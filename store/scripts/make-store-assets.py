"""Builds the Microsoft Store artwork from the ESTIMO brand pack.

    python store/scripts/make-store-assets.py

Writes store/assets:
  store-logo-300.png        Partner Center listing logo (1:1)
  Square44x44Logo.png       MSIX / APPX tile set
  Square71x71Logo.png
  Square150x150Logo.png
  Square310x310Logo.png
  Wide310x150Logo.png
  StoreLogo.png             50 x 50
"""

from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
BRAND = REPO / "public" / "brand"
OUT = REPO / "store" / "assets"

TILES = {
    "Square44x44Logo.png": 44,
    "Square71x71Logo.png": 71,
    "Square89x89Logo.png": 89,
    "Square150x150Logo.png": 150,
    "Square310x310Logo.png": 310,
    "StoreLogo.png": 50,
}


def tile(source: Image.Image, size: int) -> Image.Image:
    """Icon centred on a transparent square canvas."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon = source.copy()
    icon.thumbnail((size, size), Image.LANCZOS)
    canvas.paste(icon, ((size - icon.width) // 2, (size - icon.height) // 2), icon)
    return canvas


def wide(source: Image.Image, width: int, height: int) -> Image.Image:
    """Navy banner with the mark on the left and the wordmark beside it."""
    canvas = Image.new("RGB", (width, height), (11, 31, 63))
    mark = source.copy()
    mark.thumbnail((int(height * 0.62), int(height * 0.62)), Image.LANCZOS)
    canvas.paste(mark, (int(height * 0.22), (height - mark.height) // 2), mark)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    app_icon = Image.open(BRAND / "estimo-app-icon-amber.png").convert("RGBA")
    mark = Image.open(BRAND / "estimo-mark-light.png").convert("RGBA")

    tile(app_icon, 300).save(OUT / "store-logo-300.png")
    for name, size in TILES.items():
        tile(app_icon, size).save(OUT / name)
    wide(app_icon, 310, 150).save(OUT / "Wide310x150Logo.png")

    for path in sorted(OUT.glob("*.png")):
        with Image.open(path) as image:
            print(f"{path.name}: {image.size[0]}x{image.size[1]}")


if __name__ == "__main__":
    main()
