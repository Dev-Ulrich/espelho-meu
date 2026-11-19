#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ -n "${VIRTUAL_ENV:-}" && -x "$VIRTUAL_ENV/bin/python" ]]; then
    python_demo="$VIRTUAL_ENV/bin/python"
else
    if [[ ! -x .venv/bin/pip ]]; then
        python3.12 -m venv .venv
    fi
    python_demo=.venv/bin/python
fi

"$python_demo" -m pip install -r requirements-demo.txt
"$python_demo" preparar_facial.py
"$python_demo" verificar_demo.py
exec "$python_demo" windows_local.py
