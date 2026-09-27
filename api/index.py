import sys
import os

# Add backend directory to path so services/ and models/ are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app  # noqa: F401  — Vercel picks up `app` as the ASGI handler
