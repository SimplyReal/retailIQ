"""RetailIQ Foundation Verification Script.

Checks repository directory layout, dependencies, environment configuration,
and backend endpoints.
"""

import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def check_directories():
    required_dirs = [
        "frontend",
        "backend",
        "data/raw",
        "data/generated",
        "data/schemas",
        "docs",
        "scripts",
        "tests",
        "infra",
    ]
    root = Path(__file__).resolve().parent.parent
    all_ok = True
    print("[*] Checking repository directory structure...")
    for d in required_dirs:
        target = root / d
        if target.is_dir():
            print(f"  [PASS] {d}/ exists")
        else:
            print(f"  [FAIL] {d}/ missing")
            all_ok = False
    return all_ok


def check_docs():
    required_files = [
        ".gitignore",
        ".env.example",
        "README.md",
        "docs/product-spec.md",
        "docs/architecture.md",
        "docs/agents.md",
        "docs/datasets.md",
        "docs/api.md",
    ]
    root = Path(__file__).resolve().parent.parent
    all_ok = True
    print("\n[*] Checking documentation and root configuration files...")
    for f in required_files:
        target = root / f
        if target.is_file():
            print(f"  [PASS] {f} exists")
        else:
            print(f"  [FAIL] {f} missing")
            all_ok = False
    return all_ok


def check_backend_imports():
    print("\n[*] Checking Python backend dependencies...")
    dependencies = ["fastapi", "uvicorn", "pydantic", "httpx", "pytest"]
    all_ok = True
    for dep in dependencies:
        try:
            __import__(dep)
            print(f"  [PASS] {dep} is installed and importable")
        except ImportError:
            print(f"  [FAIL] {dep} is NOT installed")
            all_ok = False
    return all_ok


def check_fastapi_app():
    print("\n[*] Checking FastAPI app initialization...")
    try:
        from backend.app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        health_resp = client.get("/health")
        if health_resp.status_code == 200 and health_resp.json().get("status") == "ok":
            print(f"  [PASS] GET /health returned 200: {health_resp.json()}")
        else:
            print(f"  [FAIL] GET /health failed: {health_resp.status_code}")
            return False

        sys_resp = client.get("/api/v1/system")
        if sys_resp.status_code == 200 and sys_resp.json().get("status") == "ready":
            print(f"  [PASS] GET /api/v1/system returned 200: {sys_resp.json()}")
        else:
            print(f"  [FAIL] GET /api/v1/system failed: {sys_resp.status_code}")
            return False

        return True
    except Exception as e:
        print(f"  [FAIL] Could not test FastAPI app: {e}")
        return False


def main():
    print("=" * 60)
    print("RetailIQ Foundation Verification")
    print(f"Python Version: {sys.version}")
    print("=" * 60)

    dirs_ok = check_directories()
    docs_ok = check_docs()
    imports_ok = check_backend_imports()
    app_ok = check_fastapi_app()

    print("\n" + "=" * 60)
    if dirs_ok and docs_ok and imports_ok and app_ok:
        print("ALL FOUNDATION CHECKS PASSED.")
        print("=" * 60)
        sys.exit(0)
    else:
        print("FOUNDATION CHECKS FAILED.")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
