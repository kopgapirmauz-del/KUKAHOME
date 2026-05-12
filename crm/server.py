import json
import base64
import re
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
DB_FILE = STORAGE_DIR / "db.json"
CLIENTS_FILE = STORAGE_DIR / "clients.json"
MANAGERS_FILE = STORAGE_DIR / "manager.json"
SHOWROOMS_FILE = STORAGE_DIR / "showroom.json"
NOTIFICATIONS_FILE = STORAGE_DIR / "notifications.json"
ADMINPASS_FILE = BASE_DIR / "adminpas.html"
CHECK_DIR = BASE_DIR / "chek"


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
    db["notifications"] = read_json(NOTIFICATIONS_FILE, db.get("notifications", []))
    if not isinstance(db.get("notifications"), list):
        db["notifications"] = []
    if not isinstance(db.get("meta"), dict):
        db["meta"] = {"updatedAt": "1970-01-01T00:00:00.000Z"}
    return db


def write_split_files_from_db(db):
    users = db.get("users", []) if isinstance(db.get("users"), list) else []
    stores = db.get("stores", []) if isinstance(db.get("stores"), list) else []
    clients = db.get("clients", []) if isinstance(db.get("clients"), list) else []
    notifications = db.get("notifications", []) if isinstance(db.get("notifications"), list) else []
    write_json(MANAGERS_FILE, users)
    write_json(SHOWROOMS_FILE, stores)
    write_json(CLIENTS_FILE, clients)
    write_json(NOTIFICATIONS_FILE, notifications)


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

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _next_id(self, items):
        max_id = 0
        for item in items:
            try:
                max_id = max(max_id, int(item.get("id", 0)))
            except Exception:
                continue
        return max_id + 1

    def _login(self, data):
        managers = read_json(MANAGERS_FILE, [])
        user = next((m for m in managers if m.get("login") == data.get("login") and m.get("password") == data.get("password")), None)
        if not user:
            self._send_json({"success": False})
            return
        self._send_json({"success": True, "user": user})

    def _get_managers(self):
        managers = read_json(MANAGERS_FILE, [])
        non_admin_users = [m for m in managers if m.get("role") != "admin"]
        self._send_json({"success": True, "items": non_admin_users})

    def _add_manager(self, data):
        managers = read_json(MANAGERS_FILE, [])
        item = {
            "id": self._next_id(managers),
            "full_name": data.get("full_name", ""),
            "login": data.get("login", ""),
            "password": data.get("password", ""),
            "role": data.get("role", "manager"),
            "showroom": data.get("showroom", ""),
        }
        managers.insert(0, item)
        write_json(MANAGERS_FILE, managers)
        db = build_db_from_split_files()
        write_json(DB_FILE, db)
        write_adminpass_html(db)
        self._send_json({"success": True})

    def _update_manager(self, data):
        managers = read_json(MANAGERS_FILE, [])
        target_id = str(data.get("id", ""))
        updated = False
        for manager in managers:
            if str(manager.get("id", "")) != target_id:
                continue
            manager["full_name"] = data.get("full_name", manager.get("full_name", ""))
            manager["login"] = data.get("login", manager.get("login", ""))
            manager["password"] = data.get("password", manager.get("password", ""))
            manager["role"] = data.get("role", manager.get("role", "manager"))
            manager["showroom"] = data.get("showroom", manager.get("showroom", ""))
            updated = True
            break
        if not updated:
            self._send_json({"success": False}, status=HTTPStatus.NOT_FOUND)
            return
        write_json(MANAGERS_FILE, managers)
        db = build_db_from_split_files()
        write_json(DB_FILE, db)
        write_adminpass_html(db)
        self._send_json({"success": True})

    def _get_showrooms(self):
        stores = read_json(SHOWROOMS_FILE, [])
        self._send_json({"success": True, "items": stores})

    def _add_showroom(self, data):
        stores = read_json(SHOWROOMS_FILE, [])
        item = {
            "id": self._next_id(stores),
            "name": data.get("name", ""),
        }
        stores.insert(0, item)
        write_json(SHOWROOMS_FILE, stores)
        write_json(DB_FILE, build_db_from_split_files())
        self._send_json({"success": True})

    def _get_clients(self, manager, role):
        clients = read_json(CLIENTS_FILE, [])
        if role != "admin":
            clients = [c for c in clients if c.get("manager") == manager]
        self._send_json(clients)

    def _add_client(self, data):
        clients = read_json(CLIENTS_FILE, [])
        item = {
            "id": self._next_id(clients),
            "date": data.get("date", ""),
            "showroom": data.get("showroom", ""),
            "manager": data.get("manager", ""),
            "phone": data.get("phone", ""),
            "source": data.get("source", ""),
            "interest": data.get("interest", ""),
            "note": data.get("note", ""),
            "status": data.get("status", ""),
            "price": data.get("price", 0),
            "result": data.get("result", ""),
            "created_at": data.get("created_at") or "",
        }
        clients.insert(0, item)
        write_json(CLIENTS_FILE, clients)

        notifications = read_json(NOTIFICATIONS_FILE, [])
        if data.get("creator_role") == "manager":
            managers = read_json(MANAGERS_FILE, [])
            admins = [m for m in managers if m.get("role") == "admin"]
            for admin in admins:
                notifications.insert(0, {
                    "id": self._next_id(notifications),
                    "type": "new_client_from_manager",
                    "to_login": admin.get("login", ""),
                    "actor_login": data.get("creator_login", ""),
                    "client_contact": data.get("phone", "-"),
                    "is_read": 0,
                    "created_at": "",
                })
        if data.get("creator_role") == "admin" and data.get("assigned_manager_login"):
            notifications.insert(0, {
                "id": self._next_id(notifications),
                "type": "assigned_by_admin",
                "to_login": data.get("assigned_manager_login", ""),
                "actor_login": data.get("creator_login", ""),
                "client_contact": data.get("phone", "-"),
                "is_read": 0,
                "created_at": "",
            })
        write_json(NOTIFICATIONS_FILE, notifications)

        write_json(DB_FILE, build_db_from_split_files())
        self._send_json({"success": True})

    def _get_notifications(self, to_login):
        items = read_json(NOTIFICATIONS_FILE, [])
        filtered = [n for n in items if n.get("to_login") == to_login]
        self._send_json({"success": True, "items": filtered})

    def _add_notification(self, data):
        items = read_json(NOTIFICATIONS_FILE, [])
        items.insert(0, {
            "id": self._next_id(items),
            "type": data.get("type", "new_client_from_manager"),
            "to_login": data.get("to_login", ""),
            "actor_login": data.get("actor_login", ""),
            "client_contact": data.get("client_contact", "-"),
            "is_read": 0,
            "created_at": "",
        })
        write_json(NOTIFICATIONS_FILE, items)
        write_json(DB_FILE, build_db_from_split_files())
        self._send_json({"success": True})

    def _mark_notifications_read(self, data):
        items = read_json(NOTIFICATIONS_FILE, [])
        to_login = data.get("to_login", "")
        all_items = bool(data.get("all"))
        target_id = str(data.get("id", ""))
        for item in items:
            if item.get("to_login") != to_login:
                continue
            if all_items or str(item.get("id", "")) == target_id:
                item["is_read"] = 1
        write_json(NOTIFICATIONS_FILE, items)
        write_json(DB_FILE, build_db_from_split_files())
        self._send_json({"success": True})

    def _delete_client(self, data):
        clients = read_json(CLIENTS_FILE, [])
        cid = str(data.get("id", ""))
        clients = [c for c in clients if str(c.get("id", "")) != cid]
        write_json(CLIENTS_FILE, clients)
        write_json(DB_FILE, build_db_from_split_files())
        self._send_json({"success": True})

    def _save_sales_check_file(self, data):
        file_name = str(data.get("file_name", "")).strip()
        data_url = str(data.get("data_url", "")).strip()
        if not file_name or "," not in data_url:
            self._send_json({"success": False, "error": "invalid_payload"}, status=HTTPStatus.BAD_REQUEST)
            return
        mime = data_url.split(";", 1)[0].strip().lower()
        ext_by_mime = {
            "data:application/pdf": ".pdf",
            "data:image/png": ".png",
        }
        expected_ext = ext_by_mime.get(mime)
        if not expected_ext:
            self._send_json({"success": False, "error": "unsupported_file_type"}, status=HTTPStatus.BAD_REQUEST)
            return
        safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", file_name)
        if not safe_name.lower().endswith(expected_ext):
            safe_name = f"{safe_name}{expected_ext}"
        try:
            encoded = data_url.split(",", 1)[1]
            raw = base64.b64decode(encoded)
        except Exception:
            self._send_json({"success": False, "error": "invalid_file_data"}, status=HTTPStatus.BAD_REQUEST)
            return
        CHECK_DIR.mkdir(parents=True, exist_ok=True)
        target = CHECK_DIR / safe_name
        target.write_bytes(raw)
        self._send_json({"success": True, "url": f"/chek/{safe_name}", "path": str(target)})

    def _delete_sales_check_file(self, data):
        file_name = str(data.get("file_name", "")).strip()
        if not file_name:
            self._send_json({"success": False, "error": "missing_file_name"}, status=HTTPStatus.BAD_REQUEST)
            return
        safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", file_name)
        target = CHECK_DIR / safe_name
        if target.exists():
            target.unlink()
        self._send_json({"success": True})

    def _update_client(self, data):
        clients = read_json(CLIENTS_FILE, [])
        target_id = str(data.get("id", ""))
        updated = False
        for client in clients:
            if str(client.get("id", "")) != target_id:
                continue
            client["date"] = data.get("date", client.get("date", ""))
            client["showroom"] = data.get("showroom", client.get("showroom", ""))
            client["manager"] = data.get("manager", client.get("manager", ""))
            client["phone"] = data.get("phone", client.get("phone", ""))
            client["source"] = data.get("source", client.get("source", ""))
            client["interest"] = data.get("interest", client.get("interest", ""))
            client["note"] = data.get("note", client.get("note", ""))
            client["status"] = data.get("status", client.get("status", ""))
            client["price"] = data.get("price", client.get("price", 0))
            client["result"] = data.get("result", client.get("result", ""))
            updated = True
            break
        if not updated:
            self._send_json({"success": False}, status=HTTPStatus.NOT_FOUND)
            return
        write_json(CLIENTS_FILE, clients)
        write_json(DB_FILE, build_db_from_split_files())
        self._send_json({"success": True})

    def do_GET(self):
        path = urlparse(self.path).path
        query = urlparse(self.path).query
        if path == "/api/db":
            self._send_json(build_db_from_split_files())
            return
        if path == "/api/managers":
            self._get_managers()
            return
        if path == "/api/showrooms":
            self._get_showrooms()
            return
        if path == "/api/clients":
            params = parse_qs(query)
            manager = (params.get("manager") or [""])[0]
            role = (params.get("role") or ["manager"])[0]
            self._get_clients(manager, role)
            return
        if path == "/api/notifications":
            params = parse_qs(query)
            to_login = (params.get("to") or [""])[0]
            self._get_notifications(to_login)
            return
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in {"/api/login", "/api/managers", "/api/showrooms", "/api/clients", "/api/delete-client", "/api/notifications", "/api/sales-check-file"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            data = self._read_json_body()
        except Exception:
            self._send_json({"error": "invalid_json"}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/login":
            self._login(data)
            return
        if path == "/api/managers":
            self._add_manager(data)
            return
        if path == "/api/showrooms":
            self._add_showroom(data)
            return
        if path == "/api/clients":
            self._add_client(data)
            return
        if path == "/api/delete-client":
            self._delete_client(data)
            return
        if path == "/api/notifications":
            self._add_notification(data)
            return
        if path == "/api/sales-check-file":
            self._save_sales_check_file(data)
            return

    def do_PUT(self):
        path = urlparse(self.path).path
        if path == "/api/clients":
            try:
                data = self._read_json_body()
            except Exception:
                self._send_json({"error": "invalid_json"}, status=HTTPStatus.BAD_REQUEST)
                return
            self._update_client(data)
            return
        if path == "/api/managers":
            try:
                data = self._read_json_body()
            except Exception:
                self._send_json({"error": "invalid_json"}, status=HTTPStatus.BAD_REQUEST)
                return
            self._update_manager(data)
            return
        if path == "/api/notifications":
            try:
                data = self._read_json_body()
            except Exception:
                self._send_json({"error": "invalid_json"}, status=HTTPStatus.BAD_REQUEST)
                return
            self._mark_notifications_read(data)
            return
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

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path != "/api/sales-check-file":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            data = self._read_json_body()
        except Exception:
            self._send_json({"error": "invalid_json"}, status=HTTPStatus.BAD_REQUEST)
            return
        self._delete_sales_check_file(data)


if __name__ == "__main__":
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    if not DB_FILE.exists():
        write_json(DB_FILE, default_db())
    if not CLIENTS_FILE.exists():
        write_json(CLIENTS_FILE, [])
    if not SHOWROOMS_FILE.exists():
        write_json(SHOWROOMS_FILE, [])
    if not NOTIFICATIONS_FILE.exists():
        write_json(NOTIFICATIONS_FILE, [])
    if not MANAGERS_FILE.exists():
        write_json(MANAGERS_FILE, default_db()["users"])
    if not ADMINPASS_FILE.exists():
        write_adminpass_html(build_db_from_split_files())
    CHECK_DIR.mkdir(parents=True, exist_ok=True)

    server = ThreadingHTTPServer(("0.0.0.0", 8080), CRMHandler)
    print("CRM server running at http://127.0.0.1:8080")
    server.serve_forever()
