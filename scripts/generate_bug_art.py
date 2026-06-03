from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "bugdex"
OUT.mkdir(parents=True, exist_ok=True)

SIZE = 768
SCALE = 3
CANVAS = SIZE * SCALE
C = CANVAS / 2

BUGS = [
    ("zilvervisje", "silverfish", "#9fb2ad", "#dfe8e4", "#4d635d", 1),
    ("fruitvlieg", "fly", "#8a5a2b", "#f1c45a", "#3f2714", 1),
    ("bladluis", "aphid", "#6d9f45", "#c7e48b", "#314b22", 1),
    ("mug", "mosquito", "#6d7f83", "#d7eef1", "#29373a", 1),
    ("mot", "moth", "#7b6a42", "#e4d2a4", "#352b16", 2),
    ("mier", "ant", "#423120", "#9a6740", "#1c1510", 2),
    ("vlo", "flea", "#5d3a24", "#b07a3b", "#24170f", 2),
    ("pissebed", "woodlouse", "#5f6f6a", "#b7c6c0", "#26322f", 2),
    ("stinkwants", "shield", "#456f43", "#9fc06e", "#23361f", 3),
    ("snuitkever", "weevil", "#405d44", "#91a96c", "#1d2b20", 3),
    ("lieveheersbeestje", "ladybug", "#b83227", "#f2695e", "#17211c", 3),
    ("kakkerlak", "roach", "#5a341e", "#b67a3c", "#20120b", 3),
    ("oorworm", "earwig", "#725137", "#cf9e64", "#2b1d14", 3),
    ("boktor", "longhorn", "#354f3b", "#87a868", "#18241a", 4),
    ("tapijtkever", "carpet", "#252d36", "#efc35d", "#0e1419", 4),
    ("roofwants", "assassin", "#3d4735", "#b94535", "#151c15", 4),
    ("duizendpoot", "centipede", "#704026", "#d48a43", "#2a160c", 4),
    ("sprinkhaan", "grasshopper", "#587c2d", "#a7ca61", "#263914", 4),
    ("wesp", "wasp", "#1f1f1b", "#f0c642", "#10100d", 4),
    ("hoornaar", "hornet", "#2b2118", "#d89d32", "#0f0b08", 5),
    ("schorpioen", "scorpion", "#3d332e", "#b1845e", "#18120f", 5),
    ("termiet", "termite", "#a27a4c", "#f0cf94", "#4c351e", 5),
    ("mestkever", "dung", "#1d4a3b", "#5bb489", "#0c241c", 5),
    ("wandelende-tak", "stick", "#6a5936", "#b49755", "#2e2513", 5),
    ("vogelspin", "spider", "#3b2b24", "#8b5f45", "#140f0c", 5),
    ("reuzenkakkerlak", "roach", "#4b2b19", "#d08a42", "#160c07", 5),
    ("reuzen-duizendpoot", "centipede", "#68321e", "#e07a3b", "#21100a", 5),
    ("neushoornkever", "rhino", "#253c34", "#6fa47c", "#0f211a", 5),
    ("atlaskever", "atlas", "#253540", "#73a1b1", "#0d161b", 5),
    ("herculeskever", "hercules", "#2c3a2d", "#9aae62", "#121a12", 5),
    ("goliathkever", "goliath", "#16221e", "#d7bd57", "#070d0b", 5),
]


def hex_to_rgb(value):
    value = value.strip("#")
    return tuple(int(value[i : i + 2], 16) for i in range(0, 6, 2))


def mix(a, b, t):
    ar, ag, ab = hex_to_rgb(a)
    br, bg, bb = hex_to_rgb(b)
    return (int(ar + (br - ar) * t), int(ag + (bg - ag) * t), int(ab + (bb - ab) * t), 255)


def ellipse(draw, box, fill, outline=None, width=1):
    box = tuple(int(v) for v in box)
    draw.ellipse(box, fill=fill, outline=outline, width=int(width))


def line(draw, xy, fill, width):
    draw.line([(int(x), int(y)) for x, y in xy], fill=fill, width=int(width), joint="curve")


def glow(base, color, strength):
    layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ellipse(d, (C - 270 * SCALE, C - 260 * SCALE, C + 270 * SCALE, C + 260 * SCALE), (*hex_to_rgb(color), strength))
    layer = layer.filter(ImageFilter.GaussianBlur(34 * SCALE))
    base.alpha_composite(layer)


def draw_legs(draw, count, dark, long=False):
    pairs = count // 2
    for i in range(pairs):
        y = C - 120 * SCALE + i * (240 * SCALE / max(1, pairs - 1))
        bend = 72 * SCALE if long else 54 * SCALE
        left = [(C - 80 * SCALE, y), (C - 170 * SCALE, y - 25 * SCALE), (C - 220 * SCALE, y - bend * 0.25)]
        right = [(C + 80 * SCALE, y), (C + 170 * SCALE, y - 25 * SCALE), (C + 220 * SCALE, y - bend * 0.25)]
        if i % 2:
            left = [(x, CANVAS - y) for x, y in left]
            right = [(x, CANVAS - y) for x, y in right]
        line(draw, left, dark, 16 * SCALE)
        line(draw, right, dark, 16 * SCALE)


def draw_bug(slug, kind, body, shell, dark, level):
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    glow(img, shell, 52 + level * 11)
    draw = ImageDraw.Draw(img)

    ellipse(draw, (C - 185 * SCALE, C + 210 * SCALE, C + 185 * SCALE, C + 285 * SCALE), (20, 32, 24, 44))

    leg_count = 8 if kind in {"spider", "scorpion"} else 14 if kind == "centipede" else 6
    draw_legs(draw, leg_count, hex_to_rgb(dark) + (255,), kind in {"grasshopper", "longhorn", "stick", "centipede"})

    if kind in {"moth", "fly", "mosquito", "wasp", "hornet"}:
        wing = (*hex_to_rgb(shell), 116)
        ellipse(draw, (C - 250 * SCALE, C - 145 * SCALE, C - 40 * SCALE, C + 85 * SCALE), wing)
        ellipse(draw, (C + 40 * SCALE, C - 145 * SCALE, C + 250 * SCALE, C + 85 * SCALE), wing)

    if kind in {"scorpion"}:
        line(draw, [(C, C + 150 * SCALE), (C + 120 * SCALE, C + 230 * SCALE), (C + 80 * SCALE, C + 315 * SCALE)], hex_to_rgb(dark) + (255,), 28 * SCALE)
        ellipse(draw, (C + 42 * SCALE, C + 290 * SCALE, C + 122 * SCALE, C + 355 * SCALE), hex_to_rgb(shell) + (255,))
        line(draw, [(C - 105 * SCALE, C - 125 * SCALE), (C - 250 * SCALE, C - 190 * SCALE)], hex_to_rgb(dark) + (255,), 20 * SCALE)
        line(draw, [(C + 105 * SCALE, C - 125 * SCALE), (C + 250 * SCALE, C - 190 * SCALE)], hex_to_rgb(dark) + (255,), 20 * SCALE)

    if kind in {"centipede", "silverfish", "stick"}:
        segments = 7 if kind != "centipede" else 10
        for i in range(segments):
            y = C - 190 * SCALE + i * (370 * SCALE / max(1, segments - 1))
            w = (92 + math.sin(i / max(1, segments - 1) * math.pi) * 84) * SCALE
            ellipse(draw, (C - w, y - 42 * SCALE, C + w, y + 54 * SCALE), mix(body, shell, i / max(1, segments - 1) * 0.35), hex_to_rgb(dark) + (180,), 4 * SCALE)
    else:
        ellipse(draw, (C - 145 * SCALE, C - 180 * SCALE, C + 145 * SCALE, C + 205 * SCALE), hex_to_rgb(body) + (255,), hex_to_rgb(dark) + (220,), 8 * SCALE)
        ellipse(draw, (C - 118 * SCALE, C - 152 * SCALE, C + 118 * SCALE, C + 182 * SCALE), hex_to_rgb(shell) + (255,))
        line(draw, [(C, C - 150 * SCALE), (C, C + 170 * SCALE)], hex_to_rgb(dark) + (150,), 8 * SCALE)
        for dx, dy in [(-58, -72), (62, -22), (-52, 58), (54, 102)]:
            if level >= 3 or (dx + dy) % 2 == 0:
                ellipse(draw, (C + dx * SCALE - 18 * SCALE, C + dy * SCALE - 18 * SCALE, C + dx * SCALE + 18 * SCALE, C + dy * SCALE + 18 * SCALE), hex_to_rgb(dark) + (190,))

    head_size = 95 * SCALE if kind not in {"silverfish", "centipede"} else 72 * SCALE
    ellipse(draw, (C - head_size, C - 270 * SCALE, C + head_size, C - 120 * SCALE), hex_to_rgb(dark) + (255,))
    ellipse(draw, (C - 44 * SCALE, C - 235 * SCALE, C - 22 * SCALE, C - 213 * SCALE), (238, 250, 232, 255))
    ellipse(draw, (C + 22 * SCALE, C - 235 * SCALE, C + 44 * SCALE, C - 213 * SCALE), (238, 250, 232, 255))

    if kind in {"weevil", "rhino", "atlas", "hercules", "goliath"}:
        horn_len = (92 + level * 16) * SCALE
        line(draw, [(C, C - 245 * SCALE), (C, C - 245 * SCALE - horn_len)], hex_to_rgb(dark) + (255,), 22 * SCALE)
        if kind in {"hercules", "goliath", "atlas"}:
            line(draw, [(C - 14 * SCALE, C - 275 * SCALE), (C - 80 * SCALE, C - 345 * SCALE)], hex_to_rgb(dark) + (255,), 16 * SCALE)
            line(draw, [(C + 14 * SCALE, C - 275 * SCALE), (C + 80 * SCALE, C - 345 * SCALE)], hex_to_rgb(dark) + (255,), 16 * SCALE)

    if kind in {"longhorn", "ant", "earwig"}:
        line(draw, [(C - 52 * SCALE, C - 240 * SCALE), (C - 190 * SCALE, C - 320 * SCALE)], hex_to_rgb(dark) + (255,), 14 * SCALE)
        line(draw, [(C + 52 * SCALE, C - 240 * SCALE), (C + 190 * SCALE, C - 320 * SCALE)], hex_to_rgb(dark) + (255,), 14 * SCALE)

    if kind in {"earwig"}:
        line(draw, [(C - 42 * SCALE, C + 205 * SCALE), (C - 110 * SCALE, C + 315 * SCALE)], hex_to_rgb(dark) + (255,), 16 * SCALE)
        line(draw, [(C + 42 * SCALE, C + 205 * SCALE), (C + 110 * SCALE, C + 315 * SCALE)], hex_to_rgb(dark) + (255,), 16 * SCALE)

    if level >= 5:
        crown = [(C - 65 * SCALE, C - 315 * SCALE), (C - 25 * SCALE, C - 385 * SCALE), (C, C - 322 * SCALE), (C + 25 * SCALE, C - 385 * SCALE), (C + 65 * SCALE, C - 315 * SCALE)]
        draw.polygon([(int(x), int(y)) for x, y in crown], fill=(215, 189, 87, 255))

    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    img.save(OUT / f"{slug}.png", optimize=True)


for bug in BUGS:
    draw_bug(*bug)

print(f"Generated {len(BUGS)} HD BugDex assets in {OUT}")
