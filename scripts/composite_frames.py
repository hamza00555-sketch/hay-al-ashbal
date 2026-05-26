"""
Pre-composite character + frame images.
Output: public/cards/{char_id}_{frame_id}.webp  (512×512 RGBA)

Frame is always resized to CANVAS×CANVAS so no border clipping occurs.
Character (CHAR_SIZE) is placed centered; transparent ring fills the gaps.
"""
from PIL import Image
import pathlib

CANVAS    = 512
CHAR_SIZE = 440   # centered in canvas; shrunk 72px from full-fill (512→440)

CHAR_IDS = (
    [f'c{i:02d}' for i in range(1, 16)] +   # c01..c15
    [f'l{i:02d}' for i in range(1, 17)]     # l01..l16
)
FRAME_IDS = [
    'fr_c1', 'fr_c2', 'fr_c3', 'fr_c4',
    'fr_l1', 'fr_l2', 'fr_l3', 'fr_l4',
    'fr_r1', 'fr_r2', 'fr_r3', 'fr_r4',
]

BASE = pathlib.Path(__file__).parent.parent
SRC_CARDS  = BASE / 'public/cards'
SRC_FRAMES = BASE / 'public/frames'
OUT_DIR    = BASE / 'public/cards'


def make_char_crop(char_id: str) -> Image.Image:
    """Center-crop the source to simulate CSS width:160%/object-position:center 25%."""
    img = Image.open(SRC_CARDS / f'{char_id}.webp').convert('RGBA')
    w, h = img.size
    crop = round(w * (1 / 1.6))   # visible fraction = 1/1.6 = 62.5%
    x0 = (w - crop) // 2
    y0 = (h - crop) // 2
    img = img.crop((x0, y0, x0 + crop, y0 + crop))
    return img.resize((CHAR_SIZE, CHAR_SIZE), Image.LANCZOS)


def make_frame_overlay(frame_id: str) -> Image.Image:
    """Resize frame to exactly CANVAS×CANVAS — no border clipping possible."""
    frame = Image.open(SRC_FRAMES / f'{frame_id}.webp').convert('RGBA')
    return frame.resize((CANVAS, CANVAS), Image.LANCZOS)


def composite(char_id: str, frame_id: str) -> Image.Image:
    char_img  = make_char_crop(char_id)
    frame_img = make_frame_overlay(frame_id)

    result = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    offset = (CANVAS - CHAR_SIZE) // 2   # 36px transparent ring each side
    result.paste(char_img, (offset, offset))
    result.paste(frame_img, (0, 0), mask=frame_img)
    return result


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = len(CHAR_IDS) * len(FRAME_IDS)
    done  = 0
    for char_id in CHAR_IDS:
        for frame_id in FRAME_IDS:
            out_path = OUT_DIR / f'{char_id}_{frame_id}.webp'
            composite(char_id, frame_id).save(str(out_path), 'WEBP', quality=85)
            done += 1
            print(f'[{done}/{total}] {char_id}_{frame_id}.webp')
    print('Done!')


if __name__ == '__main__':
    main()
