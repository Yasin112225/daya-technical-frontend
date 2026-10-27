"""Serve the static Daya Technical frontend copy on http://localhost:8000.

Usage:
    python serve.py            # port 8000
    python serve.py 8080       # another port
"""
import http.server
import mimetypes
import socket
import sys
from pathlib import Path

# Python's mimetypes table is incomplete on some versions (3.10 and older do not
# know .woff2 or .webp), which would make the local server hand out fonts and the
# hero image as application/octet-stream. GitHub Pages serves the right types.
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")

ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            page = ROOT / "404.html"
            if page.is_file():
                body = page.read_bytes()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        super().send_error(code, message, explain)


class DualStackServer(http.server.ThreadingHTTPServer):
    """Answer on both 127.0.0.1 and ::1 so `localhost` always works."""

    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def make_server():
    try:
        return DualStackServer(("::", PORT), Handler), f"http://localhost:{PORT}/"
    except OSError:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
        return server, f"http://127.0.0.1:{PORT}/"


if __name__ == "__main__":
    server, url = make_server()
    with server:
        print(f"Daya Technical frontend copy: {url}")
        print("Press Ctrl+C to stop.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
