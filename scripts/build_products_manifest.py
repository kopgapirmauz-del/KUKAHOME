from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "products" / "mebel"
OUTPUT = ROOT / "assets" / "data" / "products-manifest.json"
OUTPUT_JS = ROOT / "assets" / "data" / "products-manifest.js"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}


LANG_KEYS = ("uz", "kz", "ru", "en", "eng", "cn", "zh")


def parse_info(text: str, fallback_model: str) -> dict[str, object]:
    model = fallback_model
    product_type = "Mehmonxona"
    product_subtype = ""
    is_new = False
    info_map = {
        "uz": "Premium collection",
        "kz": "Premium collection",
        "ru": "Premium collection",
        "en": "Premium collection",
        "zh": "Premium collection",
    }
    in_info_block = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower().startswith("model:"):
            model = line.split(":", 1)[1].strip() or fallback_model
            in_info_block = False
        elif line.lower().startswith("type:"):
            product_type = line.split(":", 1)[1].strip() or product_type
            in_info_block = False
        elif line.lower().startswith("type2:"):
            product_subtype = line.split(":", 1)[1].strip() or product_subtype
            in_info_block = False
        elif line.lower().startswith("new:"):
            is_new = True
            in_info_block = False
        elif line.lower().startswith("info:"):
            in_info_block = True
            rest = line.split(":", 1)[1].strip()
            if rest:
                info_map["uz"] = rest
        elif in_info_block and ":" in line:
            lang_key, value = line.split(":", 1)
            lang_key = lang_key.strip().lower()
            value = value.strip()
            if lang_key in LANG_KEYS and value:
                normalized = "zh" if lang_key == "cn" else "en" if lang_key == "eng" else lang_key
                info_map[normalized] = value
    return {"model": model, "type": product_type, "type2": product_subtype, "isNew": is_new, "info": info_map}


def rel_posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def iso_mtime(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()


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
        info = parse_info(info_path.read_text(encoding="utf-8"), fallback_model) if info_path.exists() else {"model": fallback_model, "type": "Mehmonxona", "type2": "", "isNew": False, "info": "Premium collection"}
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
                "type": info.get("type", "Mehmonxona"),
                "type2": info.get("type2", ""),
                "isNew": bool(info.get("isNew", False)),
                "updatedAt": iso_mtime(folder),
                "info": info["info"],
                "images": [rel_posix(image) for image in images],
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
