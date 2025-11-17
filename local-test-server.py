from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

class CustomHandler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code == 404:
            # Try to serve custom 404.html
            if os.path.exists("cv/404.html"):
                self.send_response(404)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                with open("cv/404.html", "rb") as f:
                    self.wfile.write(f.read())
                return
        # Fallback to default behavior
        super().send_error(code, message, explain)

if __name__ == "__main__":
    port = 8000
    with HTTPServer(("0.0.0.0", port), CustomHandler) as server:
        print(f"Server running on http://localhost:{port}")
        server.serve_forever()
