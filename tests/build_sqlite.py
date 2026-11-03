"""
tests/build_sqlite.py
Converts database/schema.sql (MySQL) into a SQLite file so the PHP API can be tested
automatically WITHOUT a MySQL server.  Used only for testing - production uses MySQL.

usage: python3 tests/build_sqlite.py /path/to/output.db
"""
import re, sqlite3, sys, os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sql = open(os.path.join(root, "database", "schema.sql"), encoding="utf-8").read()

sql = re.sub(r"CREATE DATABASE[^;]*;", "", sql)
sql = re.sub(r"^USE [^;]*;", "", sql, flags=re.M)
sql = re.sub(r"SET FOREIGN_KEY_CHECKS\s*=\s*\d;", "", sql)
sql = sql.replace("INT UNSIGNED AUTO_INCREMENT PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
sql = sql.replace("INT UNSIGNED", "INTEGER")
sql = re.sub(r"ENUM\([^)]*\)", "VARCHAR(30)", sql)
sql = sql.replace("ON UPDATE CURRENT_TIMESTAMP", "")
sql = re.sub(r"\)\s*ENGINE=InnoDB[^;]*;", ");", sql)

out = sys.argv[1]
if os.path.exists(out):
    os.remove(out)
con = sqlite3.connect(out)
con.executescript(sql)
con.commit()
n = con.execute("select count(*) from sqlite_master where type='table'").fetchone()[0]
print(f"built {out}: {n} tables, users={con.execute('select count(*) from users').fetchone()[0]}")
