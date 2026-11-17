#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
if [ -n "${TE01_FREECAD_PYTHON:-}" ]; then
    exec "$TE01_FREECAD_PYTHON" -m cad.export "$@"
fi
resources="/Applications/FreeCAD.app/Contents/Resources"
if [ -x "$resources/bin/python" ]; then
    PYTHONPATH="$resources/lib${PYTHONPATH:+:$PYTHONPATH}" exec "$resources/bin/python" -m cad.export "$@"
fi
exec python3 -m cad.export "$@"
