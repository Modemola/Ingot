# Contact sheet: python3 scripts/sheet.py out.jpg a.jpg b.jpg ... (2 columns, 960 wide each, labelled)
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W, H = 960, 540
cols = 2
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (W * cols, H * rows), "black")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((W, H))
    x, y = (i % cols) * W, (i // cols) * H
    sheet.paste(im, (x, y))
    d.rectangle([x, y, x + 150, y + 26], fill="black")
    d.text((x + 6, y + 6), f.split("/")[-1], fill="yellow")
sheet.save(out, quality=82)
