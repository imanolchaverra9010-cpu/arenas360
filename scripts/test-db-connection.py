"""Test PostgreSQL connectivity (local or Railway)."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import DATABASE_URL, check_database_connection


def main() -> None:
    host = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
    print(f"Conectando a: {host}")

    try:
        info = check_database_connection()
    except Exception as exc:
        print("ERROR: no se pudo conectar.")
        print(exc)
        raise SystemExit(1) from exc

    print("OK - conexión exitosa")
    print(f"  Base de datos: {info['database']}")
    print(f"  Host: {info['host']}")
    print(f"  Tablas public: {info['tables']}")
    print(f"  PostgreSQL: {info['version'][:80]}...")


if __name__ == "__main__":
    main()
