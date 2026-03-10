from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "products" / "mebel"
OUTPUT = ROOT / "assets" / "data" / "products-manifest.json"
OUTPUT_JS = ROOT / "assets" / "data" / "products-manifest.js"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}


def parse_info(text: str, fallback_model: str) -> dict[str, str]:
    model = fallback_model
    info = "Premium collection"
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower().startswith("model:"):
            model = line.split(":", 1)[1].strip() or fallback_model
        elif line.lower().startswith("info:"):
            info = line.split(":", 1)[1].strip() or info
    return {"model": model, "info": info}


def rel_posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def build_manifest() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    if not SOURCE.exists():
        return items

    folders = sorted(
        [folder for folder in SOURCE.iterdir() if folder.is_dir()],
        key=lambda folder: int(folder.name.split(".", 1)[0]) if folder.name.split(".", 1)[0].isdigit() else 9999,
    )

    for folder in folders:
        prefix, _, suffix = folder.name.partition(".")
        fallback_model = suffix or folder.name
        info_path = folder / "info.txt"
        info = parse_info(info_path.read_text(encoding="utf-8"), fallback_model) if info_path.exists() else {"model": fallback_model, "info": "Premium collection"}
        images = sorted(
            [file for file in folder.iterdir() if file.is_file() and file.suffix.lower() in IMAGE_EXTS and file.name.lower() != "info.txt"],
            key=lambda file: file.name.lower(),
        )
        if not images:
            continue
        items.append(
            {
                "id": prefix or folder.name,
                "folder": folder.name,
                "model": info["model"],
                "info": info["info"],
                "images": [rel_posix(image) for image in images[:3]],
            }
        )
    return items


def main() -> None:
    manifest = build_manifest()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    OUTPUT_JS.write_text(
        "window.KUKA_PRODUCTS_MANIFEST = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
