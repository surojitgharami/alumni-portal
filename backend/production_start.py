#!/usr/bin/env python3
import os
import sys
import subprocess

# Build frontend for production
print("📦 Building frontend for production...")
os.chdir(os.path.join(os.path.dirname(__file__), '../frontend'))
result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
if result.returncode != 0:
    print(f"❌ Frontend build failed:\n{result.stderr}")
    sys.exit(1)
print("✅ Frontend built successfully")

# Start backend on port 5000
print("🚀 Starting Alumni Portal backend on port 5000...")
os.chdir(os.path.join(os.path.dirname(__file__)))
os.execvp('uvicorn', ['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '5000'])
