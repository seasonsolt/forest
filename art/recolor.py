"""Generate unlockable outfit variants (_d1, _d2) in game/ using unpremultiplied HSV shifts."""
from pathlib import Path
import colorsys

import numpy as np
from PIL import Image
from scipy.ndimage import label

GAME = Path(__file__).resolve().parent.parent / 'game'

SKYE_POSES = ('skye_idle', 'skye_fly', 'skye_cheer')
LAB_POSES = ('labrador_idle', 'labrador_walk', 'labrador_search', 'labrador_cheer')

VARIANTS = {
    'skye': {
        1: 198.0 / 360.0,   # Sky-blue aviator suit
        2: 274.0 / 360.0,   # Starlight-violet aviator suit
    },
    'labrador': {
        1: 148.0 / 360.0,   # Emerald forest-ranger coat
        2: 348.0 / 360.0,   # Royal crimson chief coat
    },
}


def rgb_to_hsv_arr(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.max(rgb, axis=2)
    mn = np.min(rgb, axis=2)
    df = mx - mn
    h = np.zeros_like(mx)
    nz = df > 1e-5
    mr = nz & (mx == r)
    mg = nz & (mx == g)
    mb = nz & (mx == b)
    h[mr] = ((g[mr] - b[mr]) / df[mr]) % 6.0
    h[mg] = ((b[mg] - r[mg]) / df[mg]) + 2.0
    h[mb] = ((r[mb] - g[mb]) / df[mb]) + 4.0
    h = (h / 6.0) % 1.0
    s = np.divide(df, mx, out=np.zeros_like(mx), where=mx > 1e-5)
    return h, s, mx


def hsv_to_rgb_arr(h, s, v):
    h6 = (h * 6.0) % 6.0
    i = np.floor(h6).astype(np.int32)
    f = h6 - i
    p = v * (1.0 - s)
    q = v * (1.0 - s * f)
    t = v * (1.0 - s * (1.0 - f))
    out = np.zeros(h.shape + (3,), dtype=np.float32)
    for k, (rc, gc, bc) in enumerate(((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))):
        m = i == k
        out[m, 0], out[m, 1], out[m, 2] = rc[m], gc[m], bc[m]
    return out


def recolor_sprite(stem, who, idx):
    src = GAME / f'{stem}.webp'
    if not src.is_file():
        return
    im = Image.open(src).convert('RGBA')
    arr = np.asarray(im, dtype=np.float32)
    rgb = arr[..., :3] / 255.0
    alpha = arr[..., 3]
    h, s, v = rgb_to_hsv_arr(rgb)
    h_deg = h * 360.0

    if who == 'skye':
        raw_mask = (alpha > 20) & ((h_deg >= 292.0) | (h_deg <= 14.0)) & (s >= 0.24) & (v >= 0.18)
        lbl, _ = label(raw_mask)
        counts = np.bincount(lbl.ravel())
        sh = raw_mask.shape[0]
        keep_ids = []
        for cid in np.where(counts >= 90)[0]:
            if cid == 0:
                continue
            ys = np.where(lbl == cid)[0]
            cy = float(np.mean(ys))
            # Skip small eye irises in face band (area < 500) so Skye keeps bright magenta eyes
            if 0.22 * sh < cy < 0.46 * sh and counts[cid] < 500:
                continue
            keep_ids.append(cid)
        mask = np.isin(lbl, keep_ids)
    else:
        mask = (alpha > 20) & (h_deg >= 180.0) & (h_deg <= 258.0) & (s >= 0.14) & (v >= 0.08) & (v <= 0.98)

    if not np.any(mask):
        im.save(GAME / f'{stem}_d{idx}.webp', quality=88, alpha_quality=90, method=6)
        return

    new_h = h.copy()
    new_s = s.copy()
    new_v = v.copy()
    new_h[mask] = VARIANTS[who][idx]
    if who == 'labrador' and idx == 1:
        new_s[mask] = np.clip(new_s[mask] * 0.95, 0, 1)
        new_v[mask] = np.clip(new_v[mask] * 1.14, 0, 1)
    elif who == 'labrador' and idx == 2:
        new_s[mask] = np.clip(new_s[mask] * 1.05, 0, 1)
        new_v[mask] = np.clip(new_v[mask] * 1.24, 0, 1)
    elif who == 'skye' and idx == 1:
        new_s[mask] = np.clip(new_s[mask] * 0.92, 0, 1)
        new_v[mask] = np.clip(new_v[mask] * 1.05, 0, 1)

    out_rgb = np.clip(hsv_to_rgb_arr(new_h, new_s, new_v) * 255.0, 0, 255)
    # Keep original alpha untouched -> zero double-alpha halos
    out = np.dstack([out_rgb, alpha]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(GAME / f'{stem}_d{idx}.webp', quality=88, alpha_quality=90, method=6)


def main():
    for who, stems in (('skye', SKYE_POSES), ('labrador', LAB_POSES)):
        for stem in stems:
            for idx in (1, 2):
                recolor_sprite(stem, who, idx)
    print('recolor: generated 14 outfit variant sprites (_d1/_d2) in game/')


if __name__ == '__main__':
    main()
