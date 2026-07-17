from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "generated" / "bugbaas-special-bugs-wave2-reference-imagegen.png"
OUT = ROOT / "assets" / "bugdex"

OUTPUT_SIZE = 384
OUTPUT_PADDING = 32
MIN_COMPONENT_AREA = 700
SHEET_BACKGROUND_THRESHOLD = 18

BUG_IDS = [
    "orchidee-bidsprinkhaan",
    "pauwspin",
    "juweelwesp",
    "goudschildkever",
    "harlekijnwants",
    "lantaarnvlieg",
    "vioolspin",
    "gespikkelde-houtvlinder",
    "zebra-springspin",
    "smaragdlibel",
    "glasvleugelvlinder",
    "komeetmot",
    "maanmot",
    "atlasvlinder",
    "rozekever",
    "kardinaalkever",
    "vuurwants",
    "sabelsprinkhaan",
    "mierenleeuw",
    "dobsonvlieg",
    "helikopterjuffer",
    "spookinsect",
    "bladpootwants",
    "assassin-bug",
    "tijgermug",
    "dolksteekwesp",
    "roofvlieg",
    "kameelhalsvlieg",
    "zweefvlieg",
    "goudwesp",
    "doodshoofdvlinder",
    "wandelend-blad",
    "fluweelmier",
    "reuzenwaterwants",
    "zweepschorpioen",
    "azuren-waterjuffer",
    "rouwmantelvlinder",
    "keizersmantel",
    "gouden-tor",
    "soldaatje",
    "doodgraverkever",
    "olifantskever",
    "regenboogmestkever",
    "titanus-kever",
    "langsprietboktor",
    "schildpadkever",
    "vuurkever",
    "blauwe-ertsbij",
    "wespboktor",
    "groene-zandloopkever",
]


def remove_white_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance_from_white = max(255 - r, 255 - g, 255 - b)
            if distance_from_white < 20:
                pixels[x, y] = (r, g, b, 0)
            elif distance_from_white < 58:
                alpha = int((distance_from_white - 20) / 38 * 255)
                pixels[x, y] = (r, g, b, min(a, alpha))
    return rgba


def fit_for_export(image: Image.Image) -> Image.Image:
    rgba = remove_white_background(image)
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (0, 0, 0, 0))

    cropped = rgba.crop(bbox)
    max_side = OUTPUT_SIZE - OUTPUT_PADDING * 2
    scale = min(max_side / cropped.width, max_side / cropped.height)
    next_size = (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale)))
    resized = cropped.resize(next_size, Image.Resampling.LANCZOS)

    out = Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (0, 0, 0, 0))
    out.alpha_composite(resized, ((OUTPUT_SIZE - resized.width) // 2, (OUTPUT_SIZE - resized.height) // 2))
    return out


def component_boxes(sheet: Image.Image) -> list[tuple[int, int, int, int]]:
    rgb = sheet.convert("RGB")
    width, height = rgb.size
    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()
    pixels = rgb.load()

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            distance_from_white = max(255 - r, 255 - g, 255 - b)
            if distance_from_white > SHEET_BACKGROUND_THRESHOLD:
                mask_pixels[x, y] = 255

    # Bridge thin legs, antennae and wing gaps so each insect becomes one component.
    for _ in range(2):
        mask = mask.filter(ImageFilter.MaxFilter(3))

    mask_pixels = mask.load()
    visited = bytearray(width * height)
    boxes: list[tuple[int, int, int, int, int]] = []

    for start_y in range(height):
        for start_x in range(width):
            start = start_y * width + start_x
            if visited[start] or mask_pixels[start_x, start_y] == 0:
                continue

            stack = [(start_x, start_y)]
            visited[start] = 1
            min_x = max_x = start_x
            min_y = max_y = start_y
            area = 0

            while stack:
                x, y = stack.pop()
                area += 1
                if x < min_x:
                    min_x = x
                elif x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                elif y > max_y:
                    max_y = y

                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        continue
                    index = ny * width + nx
                    if visited[index] or mask_pixels[nx, ny] == 0:
                        continue
                    visited[index] = 1
                    stack.append((nx, ny))

            if area >= MIN_COMPONENT_AREA:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, area))

    clean = [(left, top, right, bottom) for left, top, right, bottom, _ in boxes]
    return sorted(clean, key=lambda box: (round(box[1] / 120), box[0]))


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGB")
    boxes = component_boxes(sheet)
    if len(boxes) != len(BUG_IDS):
        raise RuntimeError(f"Expected {len(BUG_IDS)} insects, found {len(boxes)} components")

    OUT.mkdir(parents=True, exist_ok=True)

    for bug_id, (left, top, right, bottom) in zip(BUG_IDS, boxes):
        margin = 12
        crop = sheet.crop((
            max(0, left - margin),
            max(0, top - margin),
            min(sheet.width, right + margin),
            min(sheet.height, bottom + margin),
        ))
        fit_for_export(crop).save(OUT / f"{bug_id}.png")

    print(f"Extracted {len(BUG_IDS)} HD BugDex assets from {SOURCE.name}")


if __name__ == "__main__":
    main()
