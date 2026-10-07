#!/bin/bash
# =========================================================
# Garmin Portable Sports Dashboard - macOS 启动器
# =========================================================

cd "$(dirname "$0")"

echo "========================================================="
echo "  🏃‍♂️ 正在启动 Garmin 跑者大屏本地服务..."
echo "========================================================="

# 检查 Python 3
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "❌ 未检测到 Python 3 环境！"
    echo "请先在电脑上安装 Python 3 (https://www.python.org) 或通过 Homebrew 安装。"
    read -p "按回车键退出..."
    exit 1
fi

# 检查关键依赖是否存在
$PY_CMD -c "import garth, httpx, fit_tool" &>/dev/null
if [ $? -ne 0 ]; then
    echo "⏳ 首次运行检测：正在自动安装轻量依赖库（约需 10-20 秒）..."
    $PY_CMD -m pip install -r requirements_portable.txt --quiet
    if [ $? -ne 0 ]; then
        echo "⚠️ 自动安装遇到问题，尝试使用备用镜像加速..."
        $PY_CMD -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements_portable.txt
    fi
fi

# 启动本地服务
echo "🚀 启动本地 Web 服务..."
$PY_CMD server.py
