"""Extract selected BugDex insects from the supplied July 2026 source sheets."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "bugdex" / "new17-17-2026"
OUTPUT_DIR = ROOT / "assets" / "bugdex"
CANVAS_SIZE = 512
PADDING = 36


@dataclass(frozen=True)
class CropSpec:
    slug: str
    sheet: str
    columns: int
    rows: int
    column: int
    row: int


SPECS = (
    CropSpec("zadelrups", "33808.png", 4, 3, 4, 2),
    CropSpec("reuzenpantervlinder", "33808.png", 4, 3, 1, 3),
    CropSpec("monarchvlinder", "33808.png", 4, 3, 3, 3),
    CropSpec("zakdrager", "33808.png", 4, 3, 4, 3),
    CropSpec("gehakkelde-aurelia", "33809.png", 3, 4, 2, 2),
    CropSpec("blauwe-morpho", "33809.png", 3, 4, 3, 2),
    CropSpec("spinnendoder", "33809.png", 3, 4, 1, 3),
    CropSpec("kameelspin", "33809.png", 3, 4, 1, 4),
    CropSpec("hooiwagen", "33809.png", 3, 4, 2, 4),
    CropSpec("zweepspin", "33809.png", 3, 4, 3, 4),
    CropSpec("doorncicade", "33810.png", 4, 3, 4, 1),
    CropSpec("kortschildkever", "33810.png", 4, 3, 2, 2),
    CropSpec("uilvlinder", "33810.png", 4, 3, 3, 2),
    CropSpec("groot-avondrood", "33811.png", 4, 3, 4, 1),
    CropSpec("alpenboktor", "33811.png", 4, 3, 4, 2),
    CropSpec("veenmol", "33811.png", 4, 3, 4, 3),
    CropSpec("schietmot", "33812.png", 4, 3, 3, 2),
    CropSpec("eendagsvlieg", "33812.png", 4, 3, 2, 3),
    CropSpec("oranjetipje", "33813.png", 5, 4, 1, 4),
    CropSpec("kleine-vuurvlinder", "33813.png", 5, 4, 4, 4),
    CropSpec("dikkopje", "33813.png", 5, 4, 5, 4),
    CropSpec("veldkrekel", "33814.png", 5, 4, 1, 1),
    CropSpec("coloradokever", "33814.png", 5, 4, 1, 2),
    CropSpec("meeltor", "33814.png", 5, 4, 2, 2),
    CropSpec("roodbruine-rijstmeelkever", "33814.png", 5, 4, 2, 3),
    CropSpec("schorskever", "33814.png", 5, 4, 5, 3),
    CropSpec("glimworm", "33814.png", 5, 4, 3, 4),
    CropSpec("zijdevlinder", "33815.png", 3, 2, 1, 2),
    CropSpec("gevlekte-komkommerkever", "33816.png", 5, 4, 2, 3),
    CropSpec("gestreepte-komkommerkever", "33816.png", 5, 4, 3, 3),
    CropSpec("oliekever", "33816.png", 5, 4, 1, 4),
    CropSpec("groentje", "33817.png", 5, 4, 1, 3),
    CropSpec("heideblauwtje", "33817.png", 5, 4, 2, 3),
    CropSpec("grote-weerschijnvlinder", "33817.png", 5, 4, 3, 3),
    CropSpec("bruin-zandoogje", "33817.png", 5, 4, 4, 3),
    CropSpec("kraamwebspin", "33818.png", 5, 4, 2, 1),
    CropSpec("groene-krabspin", "33818.png", 5, 4, 4, 1),
    CropSpec("honingbij", "33818.png", 5, 4, 4, 2),
    CropSpec("dambordvlieg", "33818.png", 5, 4, 1, 3),
    CropSpec("ligusterpijlstaart", "33819.png", 5, 2, 4, 1),
    CropSpec("dorbladbidsprinkhaan", "33819.png", 5, 2, 5, 1),
    CropSpec("roze-sprinkhaan", "33819.png", 5, 2, 2, 2),
    CropSpec("gouden-vogelvlinder", "33819.png", 5, 2, 3, 2),
    CropSpec("pauwoogpijlstaart", "33819.png", 5, 2, 4, 2),
    CropSpec("smaragd-springspin", "33819.png", 5, 2, 5, 2),
)


def cell_box(image: Image.Image, spec: CropSpec) -> tuple[int, int, int, int]:
    left = round((spec.column - 1) * image.width / spec.columns)
    top = round((spec.row - 1) * image.height / spec.rows)
    right = round(spec.column * image.width / spec.columns)
    bottom = round(spec.row * image.height / spec.rows)
    return left, top, right, bottom


def normalize(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha_box = rgba.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError("Background removal returned an empty image")
    subject = rgba.crop(alpha_box)
    available = CANVAS_SIZE - 2 * PADDING
    scale = min(available / subject.width, available / subject.height)
    subject = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(
        subject,
        ((CANVAS_SIZE - subject.width) // 2, (CANVAS_SIZE - subject.height) // 2),
    )
    return canvas


def remove_source_artifacts(image: Image.Image, slug: str) -> Image.Image:
    cleaned = image.copy()
    if slug == "spinnendoder":
        cleaned.paste((0, 0, 0, 0), (100, 40, 250, 150))
    if slug == "smaragd-springspin":
        cleaned.paste((0, 0, 0, 0), (120, 330, 230, 440))
    return cleaned


def main() -> None:
    missing = [spec.sheet for spec in SPECS if not (SOURCE_DIR / spec.sheet).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing source sheets: {sorted(set(missing))}")

    session = new_session("u2net")
    loaded: dict[str, Image.Image] = {}
    for spec in SPECS:
        sheet = loaded.get(spec.sheet)
        if sheet is None:
            sheet = Image.open(SOURCE_DIR / spec.sheet).convert("RGB")
            loaded[spec.sheet] = sheet
        exact_crop = sheet.crop(cell_box(sheet, spec))
        cutout = remove(exact_crop, session=session)
        output = remove_source_artifacts(normalize(cutout), spec.slug)
        output_path = OUTPUT_DIR / f"{spec.slug}.png"
        if output_path.exists():
            raise FileExistsError(f"Refusing to overwrite existing asset: {output_path}")
        output.save(output_path, optimize=True)
        print(f"created {output_path.relative_to(ROOT)}")

    print(f"created {len(SPECS)} exact-source BugDex crops")


if __name__ == "__main__":
    main()
