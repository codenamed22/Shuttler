from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # allow any origin (fine for dev; tighten later if you like)
        self.send_header("Access-Control-Allow-Origin", "*")
        return super().end_headers()

if __name__ == "__main__":
    ThreadingHTTPServer(("localhost", 8000), CORSRequestHandler).serve_forever()
