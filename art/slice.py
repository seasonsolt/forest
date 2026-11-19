"""Slice 16:9 paintings and 4x3 chroma-green sprite sheets into halo-free game/*.webp + art/sizes.json.

Run: .tools/venv/bin/python art/slice.py
Uses border-connected floodfill + pure-green interior-hole key + EDT color propagation so painted
green subjects (frogs, leaves, moss, lily pads) inside ink outlines never turn transparent.
"""
from collections import deque
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, distance_transform_edt, gaussian_filter, label

ART = Path(__file__).resolve().parent
RAW = ART / 'raw'
GAME = ART.parent / 'game'
SIZES_PATH = ART / 'sizes.json'
CANDIDATES = ART.parent / '.tools' / 'art_candidates'

SCENES = ('key', 'story_open', 'story_win', 'bg_woods', 'bg_pond', 'bg_meadow', 'bg_canopy')

ATLASES = {
    'atlas_heroes': [
        ['skye_idle', 'skye_fly', 'skye_cheer', 'portrait_skye'],
        ['labrador_idle', 'labrador_walk', 'labrador_search', 'labrador_cheer'],
        ['ui_meet', 'hat_wreath', 'hat_detective', 'hat_crown'],
    ],
    'atlas_abc_1': [
        ['word_a', 'word_b', 'word_c', 'word_d'],
        ['word_e', 'word_f', 'word_g', 'word_h'],
        ['word_i', 'word_j', 'word_k', 'word_l'],
    ],
    'atlas_abc_2': [
        ['word_m', 'word_n', 'word_o', 'word_p'],
        ['word_q', 'word_r', 'word_s', 'word_t'],
        ['word_u', 'word_v', 'word_w', 'word_x'],
    ],
    'atlas_abc_3': [
        ['word_y', 'word_z'],
        ['prop_letter_gem', 'prop_abc_party'],
    ],
    'atlas_hats_extra': [
        ['hat_bow', 'hat_butterfly'],
    ],
    'atlas_props': [
        ['prop_stump', 'prop_bush', 'prop_mushroom', 'prop_lily'],
        ['prop_rock', 'prop_nest', 'prop_orb', 'prop_postcard'],
        ['prop_stone', 'prop_bench', 'fx_star', 'fx_heart'],
    ],
}

HERO_TARGETS = {
    'skye_idle': 196, 'skye_fly': 196, 'skye_cheer': 204,
    'labrador_idle': 248, 'labrador_walk': 248, 'labrador_search': 248, 'labrador_cheer': 256,
}


def find_raw(stem):
    for ext in ('.png', '.jpg', '.jpeg', '.webp'):
        p = RAW / f'{stem}{ext}'
        if p.is_file():
            return p
    return None


def cut_chroma_mask(sheet_img):
    """Build full-sheet clean RGBA + foreground mask without hard grid slicing borders."""
    rgba = np.asarray(sheet_img.convert('RGBA'), dtype=np.float32)
    rgb = rgba[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h, w = r.shape
    ring = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3),
                           rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)], axis=0)
    greenish = ring[(ring[:, 1] - np.maximum(ring[:, 0], ring[:, 2])) > 40]
    bg_rgb = np.median(greenish, axis=0) if len(greenish) > 20 else np.array([0.0, 255.0, 0.0], dtype=np.float32)

    excess = g - np.maximum(r, b)
    dist = np.linalg.norm(rgb - bg_rgb[None, None, :], axis=2)
    is_bg_cand = ((excess > 52) & (g > 115)) | (dist < 78)

    bg = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_bg_cand[0, x]:
            bg[0, x] = True; q.append((0, x))
        if is_bg_cand[h - 1, x]:
            bg[h - 1, x] = True; q.append((h - 1, x))
    for y in range(h):
        if is_bg_cand[y, 0] and not bg[y, 0]:
            bg[y, 0] = True; q.append((y, 0))
        if is_bg_cand[y, w - 1] and not bg[y, w - 1]:
            bg[y, w - 1] = True; q.append((y, w - 1))
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and is_bg_cand[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))

    bg |= (excess > 145) & (g > 200) & (r < 55) & (b < 55)
    alpha = (~bg).astype(np.float32)
    edge_band = binary_dilation(bg, iterations=2) & (~bg)
    alpha[edge_band] = np.clip(1.0 - np.clip((excess[edge_band] - 28.0) / 80.0, 0.0, 1.0), 0.15, 1.0)
    alpha = gaussian_filter(alpha, sigma=0.55)
    alpha[bg & (~binary_dilation(~bg, iterations=1))] = 0.0

    core = alpha > 0.92
    if np.any(core):
        _, idx = distance_transform_edt(~core, return_indices=True)
        replace = (alpha > 0) & (~core)
        rgb[replace] = rgb[idx[0][replace], idx[1][replace]]

    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255.0, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), (~bg)


def split_sheet_islands(sheet_img, rows=3, cols=4):
    """Split a 4x3 sheet along actual empty-green horizontal/vertical valleys, preserving every full subject."""
    clean_rgba, fg = cut_chroma_mask(sheet_img)
    h, w = fg.shape
    row_proj = fg.sum(axis=1)
    y_cuts = [0]
    for k in range(1, rows):
        nom = round(h * k / rows)
        lo, hi = max(1, nom - round(h * 0.12)), min(h - 1, nom + round(h * 0.12))
        y_cuts.append(lo + int(np.argmin(row_proj[lo:hi])))
    y_cuts.append(h)

    out = {}
    for r in range(rows):
        y0, y1 = y_cuts[r], y_cuts[r + 1]
        col_proj = fg[y0:y1].sum(axis=0)
        x_cuts = [0]
        for k in range(1, cols):
            nom = round(w * k / cols)
            lo, hi = max(1, nom - round(w * 0.10)), min(w - 1, nom + round(w * 0.10))
            x_cuts.append(lo + int(np.argmin(col_proj[lo:hi])))
        x_cuts.append(w)
        for c in range(cols):
            x0, x1 = x_cuts[c], x_cuts[c + 1]
            cell = clean_rgba.crop((x0, y0, x1, y1))
            arr = np.asarray(cell)
            solid = arr[..., 3] > 42
            lbl, ncomp = label(solid)
            if ncomp > 1:
                counts = np.bincount(lbl.ravel())
                main_id = int(np.argmax(counts[1:]) + 1)
                cw = arr.shape[1]
                keep = [cid for cid in range(1, ncomp + 1)
                        if counts[cid] >= max(60, counts[main_id] * 0.015)
                        or (np.any(lbl[:, 0] == cid) == False and np.any(lbl[:, cw - 1] == cid) == False)]
                clean_mask = np.isin(lbl, keep)
                arr = arr.copy()
                arr[~clean_mask, 3] = 0
                cell = Image.fromarray(arr, 'RGBA')
            bbox = cell.getchannel('A').point(lambda v: 255 if v > 42 else 0).getbbox()
            out[(r, c)] = cell.crop(bbox) if bbox else cell
    return out


def circle_mask(im, size=220, bottom_align=False):
    sq = max(im.width, im.height)
    canvas = Image.new('RGBA', (sq, sq), (0, 0, 0, 0))
    py = sq - im.height if bottom_align else (sq - im.height) // 2
    canvas.paste(im, ((sq - im.width) // 2, py), im)
    crop = canvas.resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, size - 2, size - 2), fill=255)
    existing_a = crop.getchannel('A')
    merged_a = Image.fromarray(np.minimum(np.asarray(existing_a), np.asarray(mask)), 'L')
    crop.putalpha(merged_a)
    return crop


def resize_max(im, target_h=None, target_max=None):
    if target_h:
        w = max(1, round(im.width * target_h / im.height))
        return im.resize((w, target_h), Image.LANCZOS)
    if target_max:
        s = target_max / max(im.width, im.height)
        return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    return im


def main():
    GAME.mkdir(exist_ok=True)
    sizes = {}
    thumbs = []

    for name in SCENES:
        src = find_raw(name)
        if not src:
            print(f'WARN missing raw scene: {name}')
            continue
        im = Image.open(src).convert('RGB').resize((1280, 720), Image.LANCZOS)
        im.save(GAME / f'{name}.webp', quality=80, method=6)
        sizes[name] = [1280, 720, 640]
        print(f'  {name}.webp  {(GAME / f"{name}.webp").stat().st_size // 1024} KB')

    raw_sprites = {}
    for atlas_name, grid in ATLASES.items():
        src = find_raw(atlas_name)
        if not src:
            print(f'WARN missing raw atlas: {atlas_name}')
            continue
        sheet = Image.open(src).convert('RGBA')
        cells = split_sheet_islands(sheet, len(grid), len(grid[0]))
        for r, row in enumerate(grid):
            for c, name in enumerate(row):
                cut = cells[(r, c)]
                raw_sprites[name] = cut
                if name == 'portrait_skye':
                    out = circle_mask(cut, 220, bottom_align=True)
                elif name == 'ui_meet':
                    out = circle_mask(cut, 220)
                elif name in HERO_TARGETS:
                    out = resize_max(cut, target_h=HERO_TARGETS[name])
                elif name.startswith('hat_'):
                    out = resize_max(cut, target_max=110)
                elif name.startswith('word_'):
                    out = resize_max(cut, target_max=220)
                elif name in ('prop_bench', 'prop_stone'):
                    out = resize_max(cut, target_max=220)
                else:
                    out = resize_max(cut, target_max=180)
                out.save(GAME / f'{name}.webp', quality=88, alpha_quality=90, method=6)
                sizes[name] = [out.width, out.height, out.width // 2]
                thumbs.append((name, out))
                print(f'  {name}.webp  {out.width}x{out.height}  {(GAME / f"{name}.webp").stat().st_size // 1024} KB')

    if 'labrador_idle' in raw_sprites:
        lab = raw_sprites['labrador_idle']
        top_h = round(lab.height * 0.56)
        top_bbox = lab.crop((0, 0, lab.width, top_h)).getchannel('A').point(lambda v: 255 if v > 18 else 0).getbbox()
        cx = (top_bbox[0] + top_bbox[2]) // 2 if top_bbox else lab.width // 2
        side = min(lab.width, top_h)
        x0 = max(0, min(lab.width - side, cx - side // 2))
        head = lab.crop((x0, 0, x0 + side, side))
        plab = circle_mask(head, 220)
        plab.save(GAME / 'portrait_labrador.webp', quality=88, alpha_quality=90, method=6)
        sizes['portrait_labrador'] = [220, 220, 110]
        thumbs.append(('portrait_labrador', plab))

    SIZES_PATH.write_text(json.dumps(dict(sorted(sizes.items())), indent=2) + '\n', encoding='utf8')
    if thumbs:
        cols = 8
        rows = (len(thumbs) + cols - 1) // cols
        card = Image.new('RGB', (cols * 140, rows * 140), (34, 52, 42))
        for i, (_, t) in enumerate(thumbs):
            s = min(124 / t.width, 124 / t.height)
            r_im = t.resize((max(1, round(t.width * s)), max(1, round(t.height * s))), Image.LANCZOS)
            x0, y0 = (i % cols) * 140 + (140 - r_im.width) // 2, (i // cols) * 140 + (140 - r_im.height) // 2
            card.paste(r_im, (x0, y0), r_im)
        CANDIDATES.mkdir(parents=True, exist_ok=True)
        card.save(CANDIDATES / 'slice_verify.png')
    print(f'Wrote {len(sizes)} entries to art/sizes.json')


if __name__ == '__main__':
    main()
