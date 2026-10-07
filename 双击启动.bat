@echo off
chcp 65001 >nul
title Garmin 跑者大屏本地服务
cd /d "%~dp0"

echo =========================================================
echo   🏃‍♂️ 正在启动 Garmin 跑者大屏本地服务...
echo =========================================================

set PY_EXE=python

if exist "runtime\python.exe" (
    set PY_EXE=runtime\python.exe
) else (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ 未检测到 Python 运行环境！
        echo 请先在电脑上安装 Python 3 (https://www.python.org)
        echo 或将便携版 Python 解压到本目录下的 runtime 文件夹中。
        pause
        exit /b 1
    )
)

rem 检查核心依赖
%PY_EXE% -c "import garth, httpx, fit_tool" >nul 2>nul
if %errorlevel% neq 0 (
    echo ⏳ 首次运行检测：正在自动安装轻量依赖库（约需 10-20 秒）...
    %PY_EXE% -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements_portable.txt
)

echo 🚀 启动本地 Web 服务...
%PY_EXE% server.py

pause
