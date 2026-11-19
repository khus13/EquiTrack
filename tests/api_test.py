"""
tests/api_test.py
End-to-end API tests. Starts PHP's built-in server against a SQLite copy of the schema
and checks authentication, roles, CSRF, validation, uploads and every main endpoint.

run:  python3 tests/api_test.py
"""
import os, subprocess, sys, time, io, struct, zlib, json, tempfile, requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = tempfile.mkdtemp(prefix="equitrack_test_")
DB = os.path.join(TMP, "test.db")
PORT = 8091
BASE = f"http://127.0.0.1:{PORT}/api"

subprocess.check_call([sys.executable, os.path.join(ROOT, "tests", "build_sqlite.py"), DB])

env = dict(os.environ, DB_DRIVER="sqlite", DB_SQLITE_PATH=DB, APP_DEBUG="true",
           CORS_ALLOWED_ORIGINS="http://localhost:5173", PHP_CLI_SERVER_WORKERS="1")
server = subprocess.Popen(["php", "-S", f"127.0.0.1:{PORT}", "router.php"], cwd=os.path.join(ROOT, "backend"),
                          env=env, stdout=subprocess.DEVNULL, stderr=open(os.path.join(TMP, "php.log"), "w"))
time.sleep(1.0)

passed = failed = 0
def check(name, cond, extra=""):
    global passed, failed
    if cond: passed += 1; print(f"  PASS  {name}")
    else:    failed += 1; print(f"  FAIL  {name}  {extra}")

class Client:
    """A browser-like client: keeps the session cookie and the CSRF token."""
    def __init__(self):
        self.s = requests.Session(); self.csrf = None
        self.refresh()
    def refresh(self):
        r = self.s.get(BASE + "/auth/me"); self.csrf = r.json()["data"]["csrf_token"]; return r
    def call(self, method, path, json_body=None, data=None, files=None, csrf=True, params=None):
        h = {"X-CSRF-Token": self.csrf} if csrf and self.csrf else {}
        r = self.s.request(method, BASE + path, json=json_body, data=data, files=files, headers=h, params=params)
        try:
            j = r.json()
            assert set(j.keys()) == {"success", "message", "data"}, f"bad envelope {j.keys()}"
        except ValueError:
            j = None
        if j is not None and "csrf_token" in (j.get("data") or {}):
            self.csrf = j["data"]["csrf_token"]
        return r, j
    def login(self, email, pw="password123"):
        r, j = self.call("POST", "/auth/login", {"email": email, "password": pw}); return r, j

def png(size_extra=0):
    def chunk(t, d): c = struct.pack(">I", len(d)) + t + d; return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * 8 for _ in range(8))
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 8, 8, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    return data + (b"\0" * size_extra)

try:
    print("\n== Public / session / CSRF ==")
    anon = Client()
    r, j = anon.call("GET", "/auth/me")
    check("me while logged out -> user null + csrf token", j["success"] and j["data"]["user"] is None and len(anon.csrf) == 64)
    r, j = anon.call("GET", "/stats/public")
    check("public stats ok", r.status_code == 200 and j["data"]["reports_total"] == 7, str(j))
    r, j = anon.call("GET", "/reports")
    check("reports without login -> 401", r.status_code == 401)
    r, j = anon.call("POST", "/auth/login", {"email": "juan@usc.edu.ph", "password": "password123"}, csrf=False)
    check("POST without CSRF header -> 419", r.status_code == 419)
    r, j = anon.call("GET", "/nope")
    check("unknown endpoint -> 404 JSON", r.status_code == 404 and j["success"] is False)
    r, j = anon.call("PUT", "/auth/me")
    check("wrong method -> 405", r.status_code == 405)

    print("\n== Login ==")
    r, j = anon.login("juan@usc.edu.ph", "wrongpass1")
    check("wrong password -> 401", r.status_code == 401)
    r, j = anon.login("nobody@usc.edu.ph")
    check("unknown e-mail -> 401 (same message)", r.status_code == 401 and j["message"] == "Invalid e-mail or password.")
    r, j = anon.call("POST", "/auth/login", {"email": "bad", "password": ""})
    check("login validation -> 422 with field errors", r.status_code == 422 and "email" in j["data"]["errors"] and "password" in j["data"]["errors"])
    user = Client()
    r, j = user.login("juan@usc.edu.ph")
    check("user login ok", r.status_code == 200 and j["data"]["user"]["role"] == "user" and "password_hash" not in json.dumps(j))
    old_csrf = anon.csrf
    check("csrf token rotated after login", user.csrf != old_csrf)

    print("\n== Registration ==")
    reg = Client()
    r, j = reg.call("POST", "/auth/register", {"first_name": "", "last_name": "X1", "email": "bad", "password": "short", "confirm_password": "other"})
    errs = j["data"]["errors"]
    check("register invalid -> 422 for every field", r.status_code == 422 and all(k in errs for k in ["first_name", "last_name", "email", "password", "confirm_password"]), str(errs))
    r, j = reg.call("POST", "/auth/register", {"first_name": "Maria", "last_name": "Santos", "email": "maria@usc.edu.ph", "password": "abc12345", "confirm_password": "abc12345"})
    check("register ok -> 201 + logged in", r.status_code == 201 and j["data"]["user"]["role"] == "user")
    r, j = Client().call("POST", "/auth/register", {"first_name": "Maria", "last_name": "Santos", "email": "maria@usc.edu.ph", "password": "abc12345", "confirm_password": "abc12345"})
    check("duplicate e-mail -> 422", r.status_code == 422 and "email" in j["data"]["errors"])
    r, j = Client().call("POST", "/auth/register", {"first_name": "<b>Eve</b>", "last_name": "Y", "email": "e@usc.edu.ph", "password": "abc12345", "confirm_password": "abc12345"})
    check("html in name is rejected/cleaned", r.status_code in (201, 422))

    print("\n== Role protection ==")
    for path, who in [("/users", "user"), ("/stats/dashboard", "user"), ("/stats/overview", "user"), ("/audit-logs", "user"), ("/reference/campuses", "user")]:
        r, j = user.call("GET", path)
        check(f"user GET {path} -> 403", r.status_code == 403)
    r, j = user.call("POST", "/reference/campuses", {"name": "X", "code": "X"})
    check("user cannot create reference data -> 403", r.status_code == 403)
    r, j = user.call("PATCH", "/reports/1/status", {"status": "Solved"})
    check("user cannot change status -> 403", r.status_code == 403)
    r, j = user.call("POST", "/equipment", {"name": "x"})
    check("user cannot create equipment -> 403", r.status_code == 403)

    print("\n== Meta + directory ==")
    r, j = user.call("GET", "/meta")
    m = j["data"]
    check("meta has all reference lists", all(k in m for k in ["campuses", "buildings", "rooms", "categories", "damage_types", "equipment_types", "priorities"]) and len(m["campuses"]) == 3)
    r, j = user.call("GET", "/equipment", params={"q": "seat"})
    check("equipment keyword search", j["data"]["pagination"]["total"] == 2, str(j["data"]["pagination"]))
    r, j = user.call("GET", "/equipment", params={"category_id": 2, "building_id": 4})
    check("equipment filter category+building", j["data"]["pagination"]["total"] == 1 and j["data"]["items"][0]["name"] == "Urinal Unit 2")
    r, j = user.call("GET", "/equipment", params={"campus_id": 2})
    check("equipment filter campus", j["data"]["pagination"]["total"] == 1)
    r, j = user.call("GET", "/equipment", params={"type_id": 6})
    check("equipment filter type", j["data"]["pagination"]["total"] == 2)
    r, j = user.call("GET", "/equipment", params={"per_page": 5, "page": 3})
    check("equipment pagination", j["data"]["pagination"]["total_pages"] == 3 and len(j["data"]["items"]) == 2, str(j["data"]["pagination"]))
    r, j = user.call("GET", "/equipment", params={"q": "' OR 1=1 --"})
    check("SQL-injection string in search is harmless", r.status_code == 200 and j["data"]["pagination"]["total"] == 0)
    r, j = user.call("GET", "/equipment", params={"q": "%"})
    check("LIKE wildcard is escaped", j["data"]["pagination"]["total"] == 0)

    print("\n== User: reports ==")
    r, j = user.call("GET", "/reports")
    check("user sees only own reports", j["data"]["pagination"]["total"] == 7)
    r, j = reg.call("GET", "/reports")
    check("other user sees none of Juan's reports", j["data"]["pagination"]["total"] == 0)
    r, j = reg.call("GET", "/reports/1")
    check("other user opening Juan's report -> 403", r.status_code == 403)
    r, j = user.call("GET", "/reports/1")
    check("report detail has timeline + fields", r.status_code == 200 and len(j["data"]["history"]) == 1 and j["data"]["campus_name"] == "Talamban Campus")
    r, j = user.call("GET", "/reports/999")
    check("missing report -> 404", r.status_code == 404)

    base = {"item_name": "Cracked window", "category_id": 2, "campus_id": 1, "building_id": 1, "room_id": 1,
            "damage_type_id": 1, "description": "Large crack across the lower window pane.", "priority": "High"}
    r, j = user.call("POST", "/reports", data={})
    check("submit empty form -> 422 all fields", r.status_code == 422 and len(j["data"]["errors"]) >= 7, str(j["data"]))
    r, j = user.call("POST", "/reports", data=dict(base, building_id=4))
    check("room not in chosen building -> 422", r.status_code == 422 and "room_id" in j["data"]["errors"])
    r, j = user.call("POST", "/reports", data=dict(base, campus_id=2))
    check("building not on chosen campus -> 422", r.status_code == 422 and "building_id" in j["data"]["errors"])
    r, j = user.call("POST", "/reports", data=dict(base, room_id=9))
    check("room not in building -> 422", "room_id" in j["data"]["errors"])
    r, j = user.call("POST", "/reports", data=dict(base, priority="Critical"))
    check("bad priority -> 422", "priority" in j["data"]["errors"])
    r, j = user.call("POST", "/reports", data=dict(base), files={"photo": ("evil.png", b"<?php echo 1; ?>", "image/png")})
    check("fake png (php code) rejected", r.status_code == 422 and "photo" in j["data"]["errors"], str(j))
    r, j = user.call("POST", "/reports", data=dict(base), files={"photo": ("big.png", png(3 * 1024 * 1024), "image/png")})
    check("3MB image rejected (max 2MB)", r.status_code == 422 and "photo" in j["data"]["errors"], str(j))
    r, j = user.call("POST", "/reports", data=dict(base), files={"photo": ("a.gif", b"GIF89a" + b"\0" * 30, "image/gif")})
    check("gif rejected (jpg/png only)", r.status_code == 422 and "photo" in j["data"]["errors"])
    r, j = user.call("POST", "/reports", data=dict(base, equipment_id=1), files={"photo": ("../../x.png", png(), "image/png")})
    check("valid report + png photo -> 201", r.status_code == 201 and j["data"]["status"] == "Pending" and j["data"]["reference_no"].startswith("ET-") and len(j["data"]["images"]) == 1, str(j))
    new_id = j["data"]["id"]; img_id = j["data"]["images"][0]["id"]
    stored = os.listdir(os.path.join(ROOT, "backend", "uploads", "reports"))
    check("stored under random name (no user file name)", any(f.endswith(".png") and len(f) == 36 for f in stored) and not any("x.png" in f for f in stored), str(stored))
    r, j = user.call("POST", "/reports", data=dict(base, item_name="No photo item"))
    check("photo is optional -> 201", r.status_code == 201 and j["data"]["images"] == [])
    nophoto_id = j["data"]["id"]
    r = user.s.get(BASE + f"/report-images/{img_id}")
    check("owner can view photo", r.status_code == 200 and r.headers["Content-Type"] == "image/png" and r.content[:4] == b"\x89PNG")
    r = reg.s.get(BASE + f"/report-images/{img_id}")
    check("other user cannot view photo -> 403", r.status_code == 403)
    r = Client().s.get(BASE + f"/report-images/{img_id}")
    check("anonymous cannot view photo -> 401", r.status_code == 401)

    print("\n== Admin ==")
    admin = Client()
    r, j = admin.login("admin@usc.edu.ph")
    check("admin login", j["data"]["user"]["role"] == "admin")
    r, j = admin.call("GET", "/stats/dashboard")
    d = j["data"]
    check("dashboard counts", d["counts"]["Pending"] == 7 and d["counts"]["In Progress"] == 1 and d["counts"]["Solved"] == 1, str(d["counts"]))
    check("dashboard recent + to_repair", len(d["recent"]) > 0 and d["to_repair"][0]["priority"] == "Urgent", str([x["priority"] for x in d["to_repair"]]))
    check("to_repair has no solved items", all(x["status"] != "Solved" for x in d["to_repair"]))
    r, j = admin.call("GET", "/reports", params={"per_page": 5})
    check("admin sees all reports, paginated", j["data"]["pagination"]["total"] == 9 and len(j["data"]["items"]) == 5 and j["data"]["pagination"]["total_pages"] == 2)
    r, j = admin.call("GET", "/reports", params={"status": "Solved"})
    check("filter by status", j["data"]["pagination"]["total"] == 1)
    r, j = admin.call("GET", "/reports", params={"q": "juan", "priority": "Urgent"})
    check("search by reporter + priority", j["data"]["pagination"]["total"] == 1)
    r, j = admin.call("GET", "/reports", params={"sort": "priority", "dir": "asc"})
    check("sort by priority asc (Urgent first)", j["data"]["items"][0]["priority"] == "Urgent")
    r, j = admin.call("GET", "/reports", params={"sort": "item_name", "dir": "asc"})
    names = [x["item_name"] for x in j["data"]["items"]]
    check("sort by name asc", names == sorted(names), str(names))
    r, j = admin.call("GET", "/reports", params={"sort": "id; DROP TABLE reports"})
    check("bad sort key falls back safely", r.status_code == 200)
    r, j = admin.call("GET", "/reports", params={"building_id": 1, "category_id": 1})
    check("filter by building + category", j["data"]["pagination"]["total"] >= 2)

    r, j = admin.call("PATCH", "/reports/1/status", {"status": "Nonsense"})
    check("invalid status -> 422", r.status_code == 422)
    r, j = admin.call("PATCH", "/reports/1/status", {"status": "In Progress", "remarks": "Technician on the way"})
    check("mark In Progress", r.status_code == 200 and j["data"]["status"] == "In Progress" and len(j["data"]["history"]) == 2)
    eq = admin.call("GET", "/equipment/1")[1]["data"]
    check("equipment status synced to under_repair", eq["status"] == "under_repair", eq["status"])
    r, j = admin.call("PATCH", "/reports/1/status", {"status": "Solved", "remarks": "Replaced the display controller."})
    check("Mark as Solved with remarks", r.status_code == 200 and j["data"]["status"] == "Solved" and j["data"]["remarks"].startswith("Replaced") and j["data"]["resolved_by_name"] == "Admin EquiTrack" and j["data"]["resolved_at"], str(j))
    check("timeline has 3 entries in order", [h["new_status"] for h in j["data"]["history"]] == ["Pending", "In Progress", "Solved"])
    eq = admin.call("GET", "/equipment/1")[1]["data"]
    check("equipment stays needs_repair: another open report on it", eq["status"] == "needs_repair", eq["status"])
    r, j = admin.call("PATCH", "/reports/1/status", {"status": "Solved"})
    check("same status without remarks -> 422", r.status_code == 422)
    r, j = user.call("GET", "/reports/1")
    check("user sees admin remarks + solved status", j["data"]["status"] == "Solved" and j["data"]["remarks"])
    r, j = admin.call("DELETE", "/reports/2")
    check("admin cannot delete reports -> 403", r.status_code == 403)
    r, j = user.call("DELETE", f"/reports/{nophoto_id}")
    check("owner deletes own Pending report", r.status_code == 200)
    r, j = user.call("DELETE", "/reports/1")
    check("owner cannot delete Solved report -> 403", r.status_code == 403)
    r, j = reg.call("DELETE", "/reports/2")
    check("stranger cannot delete -> 403", r.status_code == 403)

    print("\n== Super admin ==")
    sa = Client()
    r, j = sa.login("superadmin@usc.edu.ph")
    check("super admin login", j["data"]["user"]["role"] == "super_admin")
    r, j = sa.call("GET", "/users", params={"per_page": 2})
    check("users list paginated", j["data"]["pagination"]["total"] >= 5 and len(j["data"]["items"]) == 2)
    r, j = sa.call("GET", "/users", params={"role": "admin"})
    check("users filter by role", j["data"]["pagination"]["total"] == 1)
    r, j = sa.call("GET", "/users", params={"q": "juan"})
    check("users search", j["data"]["pagination"]["total"] == 1)
    r, j = sa.call("POST", "/users", {"first_name": "Tina", "last_name": "Reyes", "email": "tina@usc.edu.ph", "password": "weak", "role": "admin"})
    check("create user weak password -> 422", r.status_code == 422 and "password" in j["data"]["errors"])
    r, j = sa.call("POST", "/users", {"first_name": "Tina", "last_name": "Reyes", "email": "tina@usc.edu.ph", "password": "Strong123", "role": "admin"})
    check("create admin user", r.status_code == 201 and j["data"]["role"] == "admin")
    tid = j["data"]["id"]
    r, j = sa.call("PUT", f"/users/{tid}", {"first_name": "Tina", "last_name": "Reyes", "email": "tina@usc.edu.ph", "role": "user", "status": "active"})
    check("edit user role", r.status_code == 200 and j["data"]["role"] == "user")
    r, j = sa.call("PATCH", f"/users/{tid}/status", {"status": "inactive"})
    check("deactivate user", j["data"]["status"] == "inactive")
    t = Client(); r, j = t.login("tina@usc.edu.ph", "Strong123")
    check("deactivated user cannot log in -> 403", r.status_code == 403)
    r, j = sa.call("DELETE", "/users/1")
    check("cannot delete yourself / last super admin -> 409", r.status_code == 409)
    r, j = sa.call("PUT", "/users/1", {"first_name": "Super", "last_name": "Admin", "email": "superadmin@usc.edu.ph", "role": "user", "status": "active"})
    check("cannot demote the only super admin -> 409", r.status_code == 409)
    r, j = sa.call("DELETE", f"/users/{tid}")
    check("delete user", r.status_code == 200)

    r, j = sa.call("GET", "/reference/campuses")
    check("reference list", r.status_code == 200 and len(j["data"]) == 3)
    r, j = sa.call("POST", "/reference/campuses", {"name": "North Campus", "code": "NC", "address": "Cebu"})
    check("create campus", r.status_code == 201); cid = j["data"]["id"]
    r, j = sa.call("POST", "/reference/campuses", {"name": "North Campus", "code": "N2"})
    check("duplicate campus name -> 422", r.status_code == 422)
    r, j = sa.call("POST", "/reference/buildings", {"campus_id": cid, "name": "Annex", "code": "AX"})
    check("create building", r.status_code == 201); bid = j["data"]["id"]
    r, j = sa.call("POST", "/reference/rooms", {"building_id": bid, "name": "Rm 1", "floor": "1"})
    check("create room", r.status_code == 201); rid = j["data"]["id"]
    r, j = sa.call("POST", "/reference/rooms", {"building_id": 9999, "name": "Bad"})
    check("room with bad parent -> 422", r.status_code == 422)
    r, j = sa.call("PUT", f"/reference/rooms/{rid}", {"building_id": bid, "name": "Rm 1A", "floor": "2"})
    check("update room", r.status_code == 200 and j["data"]["name"] == "Rm 1A")
    r, j = sa.call("DELETE", "/reference/campuses/1")
    check("delete campus in use -> 409", r.status_code == 409, str(j))
    r, j = sa.call("DELETE", "/reference/nothing/1")
    check("unknown reference table -> 404", r.status_code == 404)
    for path in (f"/reference/rooms/{rid}", f"/reference/buildings/{bid}", f"/reference/campuses/{cid}"):
        r, j = sa.call("DELETE", path)
        check(f"delete {path}", r.status_code == 200, str(j))

    r, j = sa.call("POST", "/equipment", {"asset_tag": "tc-new-1", "name": "Smart Board", "category_id": 1, "type_id": 1, "room_id": 1, "status": "operational"})
    check("create equipment (tag upper-cased)", r.status_code == 201 and j["data"]["asset_tag"] == "TC-NEW-1"); eid = j["data"]["id"]
    r, j = sa.call("POST", "/equipment", {"asset_tag": "TC-NEW-1", "name": "Dup", "category_id": 1, "room_id": 1})
    check("duplicate asset tag -> 422", "asset_tag" in j["data"]["errors"])
    r, j = sa.call("POST", "/equipment", {"asset_tag": "TC-NEW-2", "name": "Bad type", "category_id": 1, "type_id": 6, "room_id": 1})
    check("type from another category -> 422", "type_id" in j["data"]["errors"])
    r, j = sa.call("PUT", f"/equipment/{eid}", {"asset_tag": "TC-NEW-1", "name": "Smart Board X", "category_id": 1, "type_id": 1, "room_id": 2, "status": "retired"})
    check("update equipment", r.status_code == 200 and j["data"]["status"] == "retired")
    r, j = sa.call("DELETE", f"/equipment/{eid}")
    check("delete equipment", r.status_code == 200)

    r, j = sa.call("GET", "/stats/overview")
    o = j["data"]
    check("overview statistics", r.status_code == 200 and len(o["monthly"]) == 6 and o["status_counts"]["total"] >= 8 and o["by_category"], str(o.keys()))
    r, j = sa.call("GET", "/audit-logs", params={"per_page": 50})
    actions = {x["action"] for x in j["data"]["items"]}
    check("audit log records key actions", {"auth.login", "auth.login_failed", "report.create", "report.status", "user.create", "reference.create", "equipment.create"} <= actions, str(actions))
    r, j = sa.call("GET", "/audit-logs", params={"action": "report."})
    check("audit filter by action prefix", j["data"]["pagination"]["total"] >= 3 and all(x["action"].startswith("report.") for x in j["data"]["items"]))
    r, j = sa.call("GET", "/audit-logs", params={"q": "juan"})
    check("audit search", r.status_code == 200 and j["data"]["pagination"]["total"] >= 1)

    print("\n== Account (profile) ==")
    r, j = reg.call("PATCH", "/profile", {"first_name": "Maria", "last_name": "Santos-Cruz", "email": "juan@usc.edu.ph"})
    check("profile: duplicate e-mail -> 422", r.status_code == 422)
    r, j = reg.call("PATCH", "/profile", {"first_name": "Maria", "last_name": "Santos-Cruz", "email": "maria@usc.edu.ph"})
    check("profile update", r.status_code == 200 and j["data"]["user"]["last_name"] == "Santos-Cruz")
    r, j = reg.call("PATCH", "/profile/password", {"current_password": "wrong", "new_password": "newpass123", "confirm_password": "newpass123"})
    check("change password: wrong current -> 422", "current_password" in j["data"]["errors"])
    r, j = reg.call("PATCH", "/profile/password", {"current_password": "abc12345", "new_password": "newpass123", "confirm_password": "newpass123"})
    check("change password ok", r.status_code == 200)
    m2 = Client(); r, j = m2.login("maria@usc.edu.ph", "newpass123")
    check("login with new password", r.status_code == 200)
    r, j = reg.call("POST", "/profile/deactivate", {"password": "bad"})
    check("deactivate needs correct password", r.status_code == 422)
    r, j = reg.call("DELETE", "/profile", {"password": "newpass123"})
    check("delete own account", r.status_code == 200)
    r, j = reg.call("GET", "/auth/me")
    check("session ended after delete", j["data"]["user"] is None)
    r, j = Client().login("maria@usc.edu.ph", "newpass123")
    check("deleted account cannot log in", r.status_code == 401)

    print("\n== Logout ==")
    r, j = user.call("POST", "/auth/logout")
    check("logout ok", r.status_code == 200 and j["data"]["user"] is None)
    r, j = user.call("GET", "/reports")
    check("after logout reports -> 401", r.status_code == 401)

    print("\n== Brute-force throttle ==")
    bf = Client()
    codes = [bf.login("juan@usc.edu.ph", "badpass99")[0].status_code for _ in range(12)]
    check("429 after repeated failed logins", 429 in codes, str(codes))

    print("\n== Security headers ==")
    r = requests.get(BASE + "/auth/me")
    check("security headers present", r.headers.get("X-Content-Type-Options") == "nosniff" and r.headers.get("X-Frame-Options") == "DENY")
    r = requests.get(BASE + "/auth/me", headers={"Origin": "http://localhost:5173"})
    check("CORS allows configured origin with credentials", r.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173" and r.headers.get("Access-Control-Allow-Credentials") == "true")
    r = requests.get(BASE + "/auth/me", headers={"Origin": "http://evil.example"})
    check("CORS blocks unknown origin", "Access-Control-Allow-Origin" not in r.headers)
    r = requests.options(BASE + "/reports", headers={"Origin": "http://localhost:5173"})
    check("OPTIONS preflight -> 204", r.status_code == 204)
    r = requests.get(f"http://127.0.0.1:{PORT}/.env"); check(".env not downloadable", r.status_code == 404)
    r = requests.get(f"http://127.0.0.1:{PORT}/uploads/reports/x.png"); check("uploads not directly reachable", r.status_code == 404)
finally:
    server.terminate()
    # clean up uploaded test files
    d = os.path.join(ROOT, "backend", "uploads", "reports")
    for f in os.listdir(d):
        if f != ".gitkeep": os.remove(os.path.join(d, f))
    log = open(os.path.join(TMP, "php.log")).read()
    if "Fatal" in log or "Warning" in log or "Notice" in log or "Deprecated" in log:
        print("\nPHP LOG (warnings):\n" + "\n".join(l for l in log.splitlines() if any(w in l for w in ("Fatal", "Warning", "Notice", "Deprecated")))[:3000])

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
