$env:PYTHONPATH = "F:\ganfan\services\ai;F:\ganfan\services\ai\.runtime-deps"
& "C:\Users\a\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
