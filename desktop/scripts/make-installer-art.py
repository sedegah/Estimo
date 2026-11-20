"""Builds the installer artwork from the ESTIMO brand pack.

    python desktop/scripts/make-installer-art.py

Writes into desktop/build:
  installerHeader.bmp       150 x 57   (NSIS header strip)
  installerSidebar.bmp      164 x 314  (welcome / finish sidebar)
  uninstallerSidebar.bmp    164 x 314
  icon.ico                  16-256 px, from the app icon
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
BRAND = REPO / "public" / "brand"
FONTS = REPO / "public" / "fonts"
OUT = REPO / "desktop" / "build"

NAVY = (11, 31, 63)
AMBER = (245, 179, 1)
PALE = (195, 206, 226)


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"bricolage-{weight}.ttf"), size)


def centred(draw: ImageDraw.ImageDraw, text: str, typeface, width: int, y: int, fill) -> None:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=typeface)
    draw.text(((width - (right - left)) / 2 - left, y), text, font=typeface, fill=fill)


def header() -> None:
    width, height = 150, 57
    image = Image.new("RGB", (width, height), NAVY)
    mark = Image.open(BRAND / "estimo-logo-horizontal-dark.png").convert("RGBA")
    target_height = 26
    mark = mark.resize((round(mark.width * target_height / mark.height), target_height), Image.LANCZOS)
    image.paste(mark, ((width - mark.width) // 2, (height - mark.height) // 2 - 2), mark)
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, height - 3, width, height], fill=AMBER)
    image.save(OUT / "installerHeader.bmp")


def sidebar(filename: str, line: str) -> None:
    width, height = 164, 314
    image = Image.new("RGB", (width, height), NAVY)
    draw = ImageDraw.Draw(image)

    # soft warm glow behind the mark, echoing the hero
    for radius in range(90, 0, -2):
        alpha = int(16 * (1 - radius / 90))
        draw.ellipse(
            [width / 2 - radius, 92 - radius / 2, width / 2 + radius, 92 + radius / 2],
            fill=(NAVY[0] + alpha, NAVY[1] + alpha, NAVY[2] + alpha // 2),
        )

    mark = Image.open(BRAND / "estimo-logo-stacked-dark.png").convert("RGBA")
    target_width = 108
    mark = mark.resize((target_width, round(mark.height * target_width / mark.width)), Image.LANCZOS)
    image.paste(mark, ((width - mark.width) // 2, 66), mark)

    draw.rectangle([(width - 36) // 2, 196, (width + 36) // 2, 199], fill=AMBER)
    centred(draw, line, font("bold", 11), width, 212, PALE)
    centred(draw, "Catalogue & prices", font("regular", 9), width, 232, (110, 130, 170))
    image.save(OUT / filename)


def wizard_small() -> None:
    """Inno Setup's small wizard image: the ESTIMO mark on navy."""
    size = 55
    image = Image.new("RGB", (size, size), NAVY)
    mark = Image.open(BRAND / "estimo-mark-light.png").convert("RGBA")
    target = 38
    mark = mark.resize((target, round(mark.height * target / mark.width)), Image.LANCZOS)
    image.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    image.save(OUT / "wizardSmall.bmp")


def icon() -> None:
    source = Image.open(BRAND / "estimo-favicon-512.png").convert("RGBA")
    sizes = [(s, s) for s in (16, 24, 32, 48, 64, 128, 256)]
    source.save(OUT / "icon.ico", sizes=sizes)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    header()
    sidebar("installerSidebar.bmp", "ESTIMO Admin")
    sidebar("uninstallerSidebar.bmp", "Goodbye")
    wizard_small()
    icon()
    for name in ("installerHeader.bmp", "installerSidebar.bmp", "uninstallerSidebar.bmp", "wizardSmall.bmp", "icon.ico"):
        path = OUT / name
        with Image.open(path) as image:
            print(f"{name}: {image.size[0]}x{image.size[1]} ({path.stat().st_size} bytes)")
