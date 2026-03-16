import json
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
DB_FILE = STORAGE_DIR / "db.json"
CLIENTS_FILE = STORAGE_DIR / "clients.json"
MANAGERS_FILE = STORAGE_DIR / "manager.json"
SHOWROOMS_FILE = STORAGE_DIR / "showroom.json"
ADMINPASS_FILE = BASE_DIR / "adminpas.html"


def read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def default_db():
    return {
        "meta": {"updatedAt": "1970-01-01T00:00:00.000Z"},
        "stores": [],
        "users": [
            {
                "id": "user_admin_boot",
                "role": "admin",
                "login": "admin",
                "password": "admin123",
                "firstName": "Asosiy",
                "lastName": "Admin",
                "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop",
                "storeId": "",
            }
        ],
        "clients": [],
        "notifications": [],
    }


def build_db_from_split_files():
    db = read_json(DB_FILE, default_db())
    db["stores"] = read_json(SHOWROOMS_FILE, db.get("stores", []))
    db["clients"] = read_json(CLIENTS_FILE, db.get("clients", []))
    db["users"] = read_json(MANAGERS_FILE, db.get("users", []))
    if not isinstance(db.get("notifications"), list):
        db["notifications"] = []
    if not isinstance(db.get("meta"), dict):
        db["meta"] = {"updatedAt": "1970-01-01T00:00:00.000Z"}
    return db


def write_split_files_from_db(db):
    users = db.get("users", []) if isinstance(db.get("users"), list) else []
    stores = db.get("stores", []) if isinstance(db.get("stores"), list) else []
    clients = db.get("clients", []) if isinstance(db.get("clients"), list) else []
    write_json(MANAGERS_FILE, users)
    write_json(SHOWROOMS_FILE, stores)
    write_json(CLIENTS_FILE, clients)


def html_escape(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def write_adminpass_html(db):
    users = db.get("users", []) if isinstance(db.get("users"), list) else []
    admins = [u for u in users if u.get("role") == "admin"]
    updated_at = db.get("meta", {}).get("updatedAt", "-")
    rows = "".join(
        f"<tr><td>{html_escape(u.get('firstName', ''))} {html_escape(u.get('lastName', ''))}</td><td>{html_escape(u.get('login', ''))}</td><td>{html_escape(u.get('password', ''))}</td></tr>"
        for u in admins
    )
    if not rows:
        rows = "<tr><td colspan='3'>No admin users</td></tr>"
    page = f"""<!doctype html>
<html lang='en'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Admin Credentials Snapshot</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 24px; }}
    table {{ border-collapse: collapse; width: 100%; max-width: 800px; }}
    th, td {{ border: 1px solid #ccc; padding: 8px 10px; text-align: left; }}
    th {{ background: #f5f5f5; }}
  </style>
</head>
<body>
  <h2>Admin Credentials Snapshot</h2>
  <p>Updated: {html_escape(updated_at)}</p>
  <table>
    <thead>
      <tr><th>Admin</th><th>Login</th><th>Password</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
</body>
</html>
"""
    ADMINPASS_FILE.write_text(page, encoding="utf-8")


class CRMHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def _send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/db":
            self._send_json(build_db_from_split_files())
            return
        return super().do_GET()

    def do_PUT(self):
        path = urlparse(self.path).path
        if path != "/api/db":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("payload must be object")
        except Exception:
            self._send_json({"error": "invalid_json"}, status=HTTPStatus.BAD_REQUEST)
            return

        # Keep one fallback full snapshot + split operational files.
        write_json(DB_FILE, payload)
        write_split_files_from_db(payload)
        write_adminpass_html(payload)
        self._send_json({"ok": True})


if __name__ == "__main__":
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    if not DB_FILE.exists():
        write_json(DB_FILE, default_db())
    if not CLIENTS_FILE.exists():
        write_json(CLIENTS_FILE, [])
    if not SHOWROOMS_FILE.exists():
        write_json(SHOWROOMS_FILE, [])
    if not MANAGERS_FILE.exists():
        write_json(MANAGERS_FILE, default_db()["users"])
    if not ADMINPASS_FILE.exists():
        write_adminpass_html(build_db_from_split_files())

    server = ThreadingHTTPServer(("0.0.0.0", 8080), CRMHandler)
    print("CRM server running at http://127.0.0.1:8080")
    server.serve_forever()
