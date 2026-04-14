from __future__ import annotations

import time
from pathlib import Path

from build_products_manifest import SOURCE, main


def snapshot() -> dict[str, float]:
    state = {}
    for path in SOURCE.rglob('*'):
      if path.is_file():
        state[str(path)] = path.stat().st_mtime
    return state


def run() -> None:
    print('Watching mebel folder for changes...')
    last = {}
    while True:
        current = snapshot()
        if current != last:
            main()
            last = current
        time.sleep(2)


if __name__ == '__main__':
    run()
