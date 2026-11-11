import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Private-Network', 'true'); super().end_headers()
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Methods', 'GET,POST'); self.send_header('Access-Control-Allow-Headers', '*'); self.end_headers()
    def do_POST(self):
        n = int(self.headers['Content-Length']); open('unsplash-res.json', 'wb').write(self.rfile.read(n)); self.send_response(200); self.end_headers()
http.server.HTTPServer(('127.0.0.1', 8799), H).serve_forever()
