from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
png_dir = BASE_DIR / "Program İco" / "png"
public_dir = BASE_DIR / "public"
public_dir.mkdir(exist_ok=True)

src_png = png_dir / "icon128.png"
if not src_png.exists():
    raise SystemExit(f"Kaynak PNG bulunamadı: {src_png}")

img = Image.open(src_png).convert("RGBA")
img_256 = img.resize((256, 256), Image.LANCZOS)

out_ico = public_dir / "icon.ico"
img_256.save(out_ico, format="ICO", sizes=[(256, 256)])
print(f"Olusturuldu: {out_ico}")
