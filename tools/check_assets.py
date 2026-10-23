"""Comprueba que el arte entregado cumple con assets/manifest.json.

Uso:  python tools/check_assets.py
Sale con código 1 si hay errores (faltan ficheros "done" o tienen un tamaño incorrecto).
Solo usa la biblioteca estándar: lee la cabecera PNG a mano.
"""
import json
import os
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VALID = {"requested", "done", "blocked", "revise"}


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n" or head[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", head[16:24])


def main():
    with open(os.path.join(ROOT, "assets", "manifest.json"), encoding="utf-8") as f:
        assets = json.load(f)["assets"]
    errors, warnings, counts = [], [], {}
    ids = set()
    for a in assets:
        st = a.get("status")
        counts[st] = counts.get(st, 0) + 1
        if a["id"] in ids:
            errors.append(f"{a['id']}: id duplicado")
        ids.add(a["id"])
        if st not in VALID:
            errors.append(f"{a['id']}: status desconocido '{st}'")
        path = os.path.join(ROOT, a["file"])
        exists = os.path.exists(path)
        if st == "done" and not exists:
            errors.append(f"{a['id']}: marcado como done pero no existe {a['file']}")
            continue
        if exists:
            size = png_size(path)
            if size is None:
                errors.append(f"{a['id']}: {a['file']} no es un PNG válido")
            elif size != (a["w"], a["h"]):
                errors.append(f"{a['id']}: tamaño {size[0]}×{size[1]}, se esperaba {a['w']}×{a['h']}")
            mb = os.path.getsize(path) / 1e6
            if mb > (4 if a["id"] == "map_spain" else 1.5):
                warnings.append(f"{a['id']}: ocupa {mb:.1f} MB; conviene comprimirlo")
            if st == "requested":
                warnings.append(f"{a['id']}: el fichero existe pero sigue como 'requested' (el juego no lo cargará)")
    for w in warnings:
        print("AVISO ", w)
    for e in errors:
        print("ERROR ", e)
    print("Resumen:", ", ".join(f"{k}: {v}" for k, v in sorted(counts.items(), key=lambda x: str(x[0]))))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
