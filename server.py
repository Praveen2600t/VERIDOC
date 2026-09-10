"""
server.py — Local development server matching Vercel Serverless routing.
Runs on http://127.0.0.1:8000 using only Python standard library.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.upload import handler as UploadHandler
from api.generate_sample import handler as SampleHandler
from api.health import handler as HealthHandler


class LocalVercelRouter(UploadHandler, SampleHandler, HealthHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/health":
            HealthHandler.do_GET(self)
        elif path in ("/api/generate-sample", "/api/generate_sample"):
            SampleHandler.do_GET(self)
        else:
            self._not_found()

    def do_POST(self):
        path = self.path.split("?")[0]
        if path == "/api/upload":
            UploadHandler.do_POST(self)
        elif path in ("/api/generate-sample", "/api/generate_sample"):
            SampleHandler.do_POST(self)
        else:
            self._not_found()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def _not_found(self):
        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b'{"error": "Endpoint not found"}')


def run_local_server(port: int = 8000):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, LocalVercelRouter)
    print(f"VeriDoc local serverless backend running on http://127.0.0.1:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_local_server(port)
