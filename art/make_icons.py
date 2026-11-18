"""Build offline app icons from game/ui_meet.webp on the forest emerald background."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / 'game'
TOP, BOTTOM = (0x2f, 0x52, 0x3b), (0x1a, 0x2e, 0x22)


def background(size):
    img = Image.new('RGB', (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))
    glow = Image.new('L', (size, size), 0)
    ImageDraw.Draw(glow).ellipse([size * .18, size * .2, size * .82, size * .84], fill=125)
    glow = glow.filter(ImageFilter.GaussianBlur(size * .12))
    return Image.composite(Image.new('RGB', (size, size), (0xff, 0xe8, 0xa8)), img, glow.point(lambda v: v * 3 // 10))


def icon(size, art_fraction):
    img = background(size)
    art = Image.open(GAME / 'ui_meet.webp').convert('RGBA')
    art = art.crop(art.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    scale = size * art_fraction / max(art.size)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
    img.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    return img


def main():
    big = icon(512, .84)
    big.save(GAME / 'icon-512.png', optimize=True)
    big.resize((192, 192), Image.LANCZOS).save(GAME / 'icon-192.png', optimize=True)
    icon(512, .62).save(GAME / 'icon-maskable-512.png', optimize=True)
    icon(180, .84).save(GAME / 'apple-touch-icon.png', optimize=True)
    for name in ('icon-192', 'icon-512', 'icon-maskable-512', 'apple-touch-icon'):
        print(f'game/{name}.png', (GAME / f'{name}.png').stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
