#!/usr/bin/env python3
"""
Garmin Portable Local Server & Sync Hub
A lightweight, self-contained local runner for friends.
"""

import os
import sys
import json
import time
import socket
import logging
import threading
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("GarminServer")

# Directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")
DATA_DIR = os.path.join(BASE_DIR, "data")
RUN_PAGE_DIR = os.path.join(BASE_DIR, "run_page")

# Ensure required dirs exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "GPX_OUT"), exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "FIT_OUT"), exist_ok=True)

# Add run_page to sys.path
if RUN_PAGE_DIR not in sys.path:
    sys.path.insert(0, RUN_PAGE_DIR)

# Global progress state
PROGRESS_LOCK = threading.Lock()
PROGRESS_STATE = {
    "status": "idle",       # "idle", "syncing", "done", "error"
    "step": "准备就绪",
    "progress": 0,
    "total_activities": 0,
    "recent_logs": [],
    "error": None
}

CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
ACTIVITIES_JSON = os.path.join(DATA_DIR, "activities.json")
ACTIVITIES_JS = os.path.join(DATA_DIR, "activities.js")


def update_progress(step=None, progress=None, log=None, status=None, error=None, total=None):
    with PROGRESS_LOCK:
        if status is not None:
            PROGRESS_STATE["status"] = status
        if step is not None:
            PROGRESS_STATE["step"] = step
        if progress is not None:
            PROGRESS_STATE["progress"] = progress
        if total is not None:
            PROGRESS_STATE["total_activities"] = total
        if error is not None:
            PROGRESS_STATE["error"] = error
        if log:
            PROGRESS_STATE["recent_logs"].append(log)
            if len(PROGRESS_STATE["recent_logs"]) > 50:
                PROGRESS_STATE["recent_logs"] = PROGRESS_STATE["recent_logs"][-50:]
            logger.info(f"[{PROGRESS_STATE['status']}] {log}")


def run_garmin_sync_task(username, password, domain, only_run, athlete_name):
    """
    Executes Garmin sync inside a background thread.
    """
    try:
        update_progress(
            status="syncing",
            step="正在连接 Garmin 官方服务器...",
            progress=10,
            log=f"开始为账号 {username} 发起 Garmin 同步任务 (地区: {domain})"
        )

        # Set environment variables for config.py
        os.environ["RUN_PAGE_SQL_FILE"] = os.path.join(DATA_DIR, "data.db")
        os.environ["RUN_PAGE_JSON_FILE"] = ACTIVITIES_JSON
        os.environ["RUN_PAGE_GPX_FOLDER"] = os.path.join(DATA_DIR, "GPX_OUT")
        os.environ["RUN_PAGE_FIT_FOLDER"] = os.path.join(DATA_DIR, "FIT_OUT")
        os.environ["RUN_PAGE_SYNCED_FILE"] = os.path.join(DATA_DIR, "imported.json")

        update_progress(
            step="正在进行 Garmin 身份凭据鉴权...",
            progress=20,
            log="正在向 Garmin SSO 发送登录验证请求..."
        )

        import garth
        import asyncio
        from garmin_sync import Garmin
        from utils import make_activities_file

        is_cn = (domain.upper() == "CN")
        secret_string = f"{username}:{password}"

        # Initialize Garmin client
        client = Garmin(secret_string, auth_domain="CN" if is_cn else "COM", is_only_running=only_run)

        # Save session token if available
        try:
            token_dump = garth.client.dumps()
            with open(os.path.join(DATA_DIR, "session_token.txt"), "w") as f:
                f.write(token_dump)
        except Exception:
            pass

        # Save persistent configuration
        config_data = {
            "username": username,
            "domain": domain,
            "only_run": only_run,
            "athlete_name": athlete_name or "My Running",
            "last_sync": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)

        update_progress(
            step="账号鉴权成功，正在检索运动活动列表...",
            progress=35,
            log="✅ Garmin 登录成功！开始查询历史运动记录..."
        )

        # Run async get_activities
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        update_progress(
            step="正在下载并解析轨迹数据...",
            progress=50,
            log="开始下载活动数据 (FIT/GPX)..."
        )
        
        loop.run_until_complete(client.get_activities())
        loop.close()

        update_progress(
            step="正在生成本地运动数据库与大屏数据集...",
            progress=85,
            log="正在生成 activities.json 与 activities.js..."
        )

        # Compile activities file
        sql_file = os.path.join(DATA_DIR, "data.db")
        folder = os.path.join(DATA_DIR, "FIT_OUT") if os.path.exists(os.path.join(DATA_DIR, "FIT_OUT")) else os.path.join(DATA_DIR, "GPX_OUT")
        make_activities_file(sql_file, folder, ACTIVITIES_JSON, file_suffix="fit")

        # Read activities to get count and generate activities.js
        count = 0
        if os.path.exists(ACTIVITIES_JSON):
            with open(ACTIVITIES_JSON, "r", encoding="utf-8") as f:
                acts = json.load(f)
                count = len(acts)

            # Generate activities.js for synchronous client injection
            site_title = f"{athlete_name} 的运动大屏" if athlete_name else "Garmin 跑者大屏"
            with open(ACTIVITIES_JS, "w", encoding="utf-8") as f:
                f.write(f"window.__ACTIVITIES__ = {json.dumps(acts, ensure_ascii=False)};\n")
                f.write(f"window.__SITE_METADATA__ = {{ siteTitle: {json.dumps(site_title, ensure_ascii=False)} }};\n")

        update_progress(
            status="done",
            step=f"同步完成！共获取 {count} 条运动轨迹",
            progress=100,
            total=count,
            log=f"🎉 全部生成成功！共计 {count} 条运动记录已存入本地数据库。"
        )

    except Exception as e:
        import traceback
        err_msg = str(e)
        logger.error(f"Sync error: {err_msg}\n{traceback.format_exc()}")
        update_progress(
            status="error",
            step="同步过程中出现错误",
            error=err_msg,
            log=f"❌ 错误: {err_msg}"
        )


class GarminPortableHandler(SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler serving static dashboard and sync APIs.
    """
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. API: Check status
        if path == "/api/status":
            has_data = os.path.exists(ACTIVITIES_JSON)
            count = 0
            athlete = ""
            if has_data:
                try:
                    with open(ACTIVITIES_JSON, "r", encoding="utf-8") as f:
                        count = len(json.load(f))
                except Exception:
                    pass
            if os.path.exists(CONFIG_PATH):
                try:
                    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                        cfg = json.load(f)
                        athlete = cfg.get("athlete_name", "")
                except Exception:
                    pass
            self.send_json_response({"has_data": has_data, "activity_count": count, "athlete_name": athlete})
            return

        # 2. API: Progress polling
        if path == "/api/progress":
            with PROGRESS_LOCK:
                self.send_json_response(PROGRESS_STATE)
            return

        # 3. Setup page
        if path == "/setup" or path == "/setup.html":
            self.serve_file(os.path.join(BASE_DIR, "setup.html"), "text/html; charset=utf-8")
            return

        # 4. Helper script
        if path == "/portal-helper.js":
            helper_path = os.path.join(BASE_DIR, "portal-helper.js")
            if not os.path.exists(helper_path):
                helper_path = os.path.join(DIST_DIR, "portal-helper.js")
            self.serve_file(helper_path, "application/javascript; charset=utf-8")
            return

        # 5. Dynamic data files
        if path == "/data/activities.js":
            if os.path.exists(ACTIVITIES_JS):
                self.serve_file(ACTIVITIES_JS, "application/javascript; charset=utf-8")
            else:
                self.send_text_response("window.__ACTIVITIES__ = null;", "application/javascript; charset=utf-8")
            return

        if path == "/data/activities.json":
            if os.path.exists(ACTIVITIES_JSON):
                self.serve_file(ACTIVITIES_JSON, "application/json; charset=utf-8")
            else:
                self.send_json_response([])
            return

        # 6. Root path: if no activities exist, redirect to setup
        if path == "/" or path == "/index.html":
            has_data = os.path.exists(ACTIVITIES_JSON)
            if not has_data:
                self.send_response(302)
                self.send_header("Location", "/setup")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            dist_index = os.path.join(DIST_DIR, "index.html")
            if os.path.exists(dist_index):
                self.serve_file(dist_index, "text/html; charset=utf-8")
                return

        # 7. Pre-built static assets from dist/
        clean_path = path.lstrip("/")
        dist_target = os.path.join(DIST_DIR, clean_path)
        if os.path.isfile(dist_target):
            content_type = self.guess_type(dist_target)
            self.serve_file(dist_target, content_type)
            return

        # Fallback to SPA route: serve dist/index.html
        dist_index = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(dist_index) and os.path.exists(ACTIVITIES_JSON):
            self.serve_file(dist_index, "text/html; charset=utf-8")
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/sync":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else b"{}"
            try:
                data = json.loads(body.decode("utf-8")) if body else {}
            except Exception:
                data = {}

            username = data.get("username")
            password = data.get("password")
            domain = data.get("domain", "CN")
            only_run = bool(data.get("only_run", False))
            athlete_name = data.get("athlete_name", "")

            # If incremental sync and no credentials passed, read saved config
            if (not username or not password) and os.path.exists(CONFIG_PATH):
                try:
                    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                        cfg = json.load(f)
                        username = cfg.get("username", "")
                        domain = cfg.get("domain", "CN")
                        only_run = cfg.get("only_run", False)
                        athlete_name = cfg.get("athlete_name", "")
                except Exception:
                    pass

            if not username or not password:
                # Check if session_token.txt exists
                token_file = os.path.join(DATA_DIR, "session_token.txt")
                if not os.path.exists(token_file):
                    self.send_json_response({"ok": False, "error": "缺少佳明登录账号或密码"}, status=400)
                    return

            with PROGRESS_LOCK:
                if PROGRESS_STATE["status"] == "syncing":
                    self.send_json_response({"ok": False, "error": "同步任务已在执行中，请稍候"}, status=409)
                    return

            # Start worker thread
            t = threading.Thread(
                target=run_garmin_sync_task,
                args=(username, password, domain, only_run, athlete_name),
                daemon=True
            )
            t.start()

            self.send_json_response({"ok": True, "message": "同步任务已启动"})
            return

        self.send_error(404, "API not found")

    def serve_file(self, filepath, content_type):
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def send_json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def send_text_response(self, text, content_type="text/plain; charset=utf-8", status=200):
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # Suppress verbose asset logging
        pass


def find_free_port(start_port=8080):
    port = start_port
    while port < 9000:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
        port += 1
    return start_port


def main():
    port = find_free_port(8080)
    server_address = ('127.0.0.1', port)
    httpd = ThreadingHTTPServer(server_address, GarminPortableHandler)

    url = f"http://localhost:{port}"

    print("\n" + "=" * 56)
    print("  🏃‍♂️ GARMIN PORTABLE - 佳明跑者大屏本地微服务")
    print("=" * 56)
    print(f"  • 本地访问地址: {url}")
    print(f"  • 数据存储目录: {DATA_DIR}")
    print("  • 隐私保障状态: 100% 本地运行 (零云端上传)")
    print("=" * 56)
    print("  提示: 浏览器将自动打开，按 Ctrl+C 可停止服务\n")

    # Automatically open default browser after 0.6s
    def open_browser():
        time.sleep(0.6)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n正在停止本地服务...")
        httpd.server_close()
        print("服务已关闭。")


if __name__ == "__main__":
    main()
