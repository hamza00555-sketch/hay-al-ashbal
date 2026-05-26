"""
Pre-composite character + frame images.
Output: public/cards/{char_id}_{frame_id}.webp  (512×512 RGBA)

CSS simulation:
  .avatar: 100% × 100% of outerWrap, overflow:hidden, flex center
  .img: width:160%; height:160%; object-fit:cover; object-position:center 25%
  => visible region = center N×N crop of a 1.6N×1.6N scaled source
  => for 1254×1254 source: center 783×783 crop, scaled to 512×512
"""
from PIL import Image
import os, pathlib

CANVAS    = 512
CHAR_SIZE = 440   # character crop placed centered; shrunk 72px from 512

# Pre-calculated: frame_size = CANVAS * 0.75 / min(hole_w_pct, hole_h_pct)
FRAME_SIZES = {
    'fr_c1': 604, 'fr_c2': 592, 'fr_c3': 666, 'fr_c4': 601,
    'fr_l1': 775, 'fr_l2': 743, 'fr_l3': 901, 'fr_l4': 957,
    'fr_r1': 668, 'fr_r2': 680, 'fr_r3': 739, 'fr_r4': 754,
}

CHAR_IDS = (
    [f'c{i:02d}' for i in range(1, 16)] +   # c01..c15
    [f'l{i:02d}' for i in range(1, 17)]     # l01..l16
)
FRAME_IDS = list(FRAME_SIZES.keys())

BASE = pathlib.Path(__file__).parent.parent
SRC_CARDS  = BASE / 'public/cards'
SRC_FRAMES = BASE / 'public/frames'
OUT_DIR    = BASE / 'public/cards'


def make_char_crop(char_id: str) -> Image.Image:
    """
    Simulate CSS: img.width=160%, img.height=160%, object-fit:cover, object-position:center 25%.
    Source is 1254×1254 square.
    img element size = CANVAS*1.6 = 819.2px (square).
    object-fit:cover on equal aspect = scale to fill element exactly (no overflow).
    Visible window = center CANVAS×CANVAS of the 819×819 element.
    In source coords: center 783×783 crop (offset = (1254 - 783) // 2 = 235).
    """
    img = Image.open(SRC_CARDS / f'{char_id}.webp').convert('RGBA')
    w, h = img.size  # 1254×1254

    # center crop of 783×783 from 1254×1254
    crop_size = round(CANVAS / 1.6 * (w / CANVAS))  # = round(819 * 1254/512) = round(w * 1.6 / 1.6) = w * 0.625 ≈ 783
    # simpler: crop_size = round(w * (1 / 1.6)) = round(1254 * 0.625) = 784
    # But let's use exact math: visible fraction of source = CANVAS / (CANVAS*1.6) = 1/1.6 = 0.625
    crop_size = round(w * (1 / 1.6))
    x0 = (w - crop_size) // 2
    y0 = (h - crop_size) // 2
    img = img.crop((x0, y0, x0 + crop_size, y0 + crop_size))
    img = img.resize((CHAR_SIZE, CHAR_SIZE), Image.LANCZOS)
    return img


def make_frame_overlay(frame_id: str) -> Image.Image:
    """Resize frame to its target size, return as RGBA (transparent outside frame)."""
    frame = Image.open(SRC_FRAMES / f'{frame_id}.webp').convert('RGBA')
    fs = FRAME_SIZES[frame_id]
    return frame.resize((fs, fs), Image.LANCZOS)


def composite(char_id: str, frame_id: str) -> Image.Image:
    char_img   = make_char_crop(char_id)
    frame_img  = make_frame_overlay(frame_id)

    result = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    offset = (CANVAS - CHAR_SIZE) // 2  # = 36px each side
    result.paste(char_img, (offset, offset))

    fs = FRAME_SIZES[frame_id]
    fx = (CANVAS - fs) // 2
    fy = (CANVAS - fs) // 2
    result.paste(frame_img, (fx, fy), mask=frame_img)  # frame on top

    return result


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = len(CHAR_IDS) * len(FRAME_IDS)
    done  = 0
    for char_id in CHAR_IDS:
        for frame_id in FRAME_IDS:
            out_path = OUT_DIR / f'{char_id}_{frame_id}.webp'
            img = composite(char_id, frame_id)
            img.save(str(out_path), 'WEBP', quality=85)
            done += 1
            print(f'[{done}/{total}] {char_id}_{frame_id}.webp')
    print('Done!')


if __name__ == '__main__':
    main()
