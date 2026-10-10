"""Build GIFs from the actual SVG demonstration frames captured by Playwright."""
from pathlib import Path
import json
from PIL import Image

experiment = Path(__file__).resolve().parents[1]
workspace = experiment.parents[3]
source = workspace / "output/playwright/demo-frames"
destination = experiment / "docs/images"
destination.mkdir(parents=True, exist_ok=True)
results = []
for name, expected in [("vector", 40), ("parent", 50), ("projection", 50)]:
    paths = sorted((source / name).glob("*.png"))
    if len(paths) != expected:
        raise ValueError(f"{name}: expected {expected} frames, got {len(paths)}")
    frames = [Image.open(path).convert("RGB") for path in paths]
    width, height = frames[0].size
    if any(frame.size != (width, height) for frame in frames):
        raise ValueError(f"{name}: inconsistent frame size")
    # Use one palette for every frame, so moving shapes and text do not flicker.
    sheet = Image.new("RGB", (width, height * 3))
    for row, index in enumerate([0, len(frames) // 3, len(frames) * 2 // 3]):
        sheet.paste(frames[index], (0, row * height))
    palette = sheet.quantize(colors=128)
    animation = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    target = destination / f"stage-01-{name}.gif"
    animation[0].save(target, save_all=True, append_images=animation[1:], duration=100, loop=0, disposal=2, optimize=True)
    with Image.open(target) as result:
        if result.n_frames < 2 or result.info.get("loop") != 0:
            raise ValueError(f"{target}: not a looping animation")
        duration = 0
        for index in range(result.n_frames):
            result.seek(index)
            duration += result.info.get("duration", 0)
        if duration != expected * 100:
            raise ValueError(f"{target}: animation duration changed ({duration} ms)")
        results.append({"file": target.name, "frames": result.n_frames, "size": result.size, "duration_ms": duration, "bytes": target.stat().st_size})
print(json.dumps(results, ensure_ascii=False))
