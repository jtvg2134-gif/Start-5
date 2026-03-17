from __future__ import annotations

import json
from pathlib import Path
import sys

CURRENT_DIR = Path(__file__).resolve().parent
PACKAGE_ROOT = CURRENT_DIR.parent

if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from essay_engine.evaluator import evaluate_submission


def main() -> int:
    raw_input = sys.stdin.read()

    try:
        payload = json.loads(raw_input or "{}")
    except json.JSONDecodeError:
        sys.stderr.write("Entrada JSON inválida para o motor Python.\n")
        return 1

    submission = payload.get("submission") or {}
    source_error_message = str(payload.get("sourceErrorMessage") or "")
    source_status_code = int(payload.get("sourceStatusCode") or 0)

    try:
        evaluation = evaluate_submission(
            submission=submission,
            source_error_message=source_error_message,
            source_status_code=source_status_code,
        )
    except Exception as error:  # noqa: BLE001
        sys.stderr.write(f"Falha no motor Python de redação: {error}\n")
        return 1

    sys.stdout.write(json.dumps(evaluation, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
