"""Builds the static Bricolage Grotesque files that the PDF exports embed.

The site ships one variable WOFF2 (weights 200-800, optical sizes 12-96).
pdf-lib cannot embed WOFF2 - every PDF viewer rejects it, which showed up as
missing spaces and swapped glyphs - so both PDF routes embed static TrueType
instances cut from that same file:

    pip install fonttools brotli
    python tools/build-pdf-fonts.py

Writes bricolage-regular.ttf (wght 400) and bricolage-bold.ttf (wght 700), both
at optical size 14, into public/fonts and admin/public/fonts.
"""

from pathlib import Path
import shutil

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "fonts" / "bricolage-grotesque-latin.woff2"
TARGETS = [ROOT / "public" / "fonts", ROOT / "admin" / "public" / "fonts"]

JOBS = [
    (400, "Regular", "BricolageGrotesque-Regular", "bricolage-regular.ttf"),
    (700, "Bold", "BricolageGrotesque-Bold", "bricolage-bold.ttf"),
]

FAMILY = "Bricolage Grotesque"
OPTICAL_SIZE = 14


def build(weight: int, style: str, postscript: str, filename: str) -> None:
    font = TTFont(SOURCE)
    instance = instantiateVariableFont(font, {"wght": weight, "opsz": OPTICAL_SIZE}, updateFontNames=False)
    # loading a .woff2 sets flavor; clear it so save() writes plain TrueType
    instance.flavor = None
    # keep the output byte-identical between runs
    instance.recalcTimestamp = False
    instance["head"].modified = 0

    for name_id, value in {
        1: FAMILY,
        2: style,
        3: f"{postscript};ESTIMO",
        4: f"{FAMILY} {style}",
        6: postscript,
        16: FAMILY,
        17: style,
    }.items():
        instance["name"].setName(value, name_id, 3, 1, 0x409)
        instance["name"].setName(value, name_id, 1, 0, 0)

    os2 = instance["OS/2"]
    os2.usWeightClass = weight
    os2.usWidthClass = 5
    bold = weight >= 700
    os2.fsSelection = (os2.fsSelection & ~(1 << (5 if not bold else 6))) | (1 << (5 if bold else 6))
    if bold:
        instance["head"].macStyle |= 1
    else:
        instance["head"].macStyle &= ~1

    primary = TARGETS[0] / filename
    instance.save(primary)
    for target in TARGETS[1:]:
        shutil.copyfile(primary, target / filename)
    print(f"wrote {filename} (wght {weight}, opsz {OPTICAL_SIZE})")


if __name__ == "__main__":
    for job in JOBS:
        build(*job)
