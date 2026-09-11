"""Encode the original memory-game PNG artwork without changing layout or alpha.

Run with Python + Pillow when the source artwork changes. The PNG files stay as
masters; the static build publishes the smaller WebP versions.
"""
from pathlib import Path
from PIL import Image, ImageChops

assets = Path(__file__).resolve().parents[1] / "assets"
before = after = 0
for source in sorted(assets.glob("memory-*.png")):
    target = source.with_suffix(".webp")
    with Image.open(source) as original:
        original.save(target, "WEBP", quality=88, method=6, exact=True)
        with Image.open(target) as encoded:
            assert encoded.size == original.size, source.name
            if "A" in original.getbands():
                assert "A" in encoded.getbands(), source.name
                assert ImageChops.difference(original.getchannel("A"), encoded.getchannel("A")).getbbox() is None, source.name
    before += source.stat().st_size
    after += target.stat().st_size
    print(f"{source.name}: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes")
print(f"Total: {before:,} -> {after:,} bytes ({(1 - after / before):.1%} smaller)")
