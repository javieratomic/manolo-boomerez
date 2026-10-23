"""Servidor local sin caché para jugar y desarrollar.

Uso:  python tools/serve.py [puerto] [--open]
"""
import http.server
import os
import sys
import webbrowser
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    port = int(args[0]) if args else 8080
    handler = partial(NoCacheHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        url = f"http://localhost:{port}/"
        print(f"Manolo Boomerez S.L. en {url}  (Ctrl+C para salir)")
        if "--open" in sys.argv:
            webbrowser.open(url)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
