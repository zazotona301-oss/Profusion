from pathlib import Path
from PIL import Image, ImageOps

project = Path(__file__).resolve().parents[1]
source_path = project / "assest" / "midcal.png"
source = Image.open(source_path).convert("RGB")
source = ImageOps.fit(source, (1024, 1024), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

# Keep a real PNG copy for the web app and future asset tooling.
public_icon = project / "public" / "midcal.png"
public_icon.parent.mkdir(parents=True, exist_ok=True)
source.save(public_icon, format="PNG", optimize=True)

sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
android_root = project / "android" / "app" / "src" / "main" / "res"
for density, size in sizes.items():
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
        destination = android_root / f"mipmap-{density}" / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        icon.save(destination, format="PNG", optimize=True)

print(f"Generated {public_icon}")
print(f"Generated Android launcher icons in {android_root}")
