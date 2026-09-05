#!/usr/bin/env bash
# راه‌اندازی سرور زنده‌ی پروژه روی پورت 8900 (از همین پوشه)
# سرور با setsid جداشده اجرا می‌شود تا با بسته‌ شدن ترمینال از بین نرود.
set -e
cd "$(dirname "$0")"

PORT="${1:-8900}"

# اگر قبلاً روی این پورت در حال اجرا است، اول خاموشش کن
if pgrep -f "http.server ${PORT}" >/dev/null 2>&1; then
  pkill -f "http.server ${PORT}" 2>/dev/null || true
  sleep 1
fi

setsid bash -c "exec python3 serve.py ${PORT}" </dev/null >/tmp/opencode/v2-server.log 2>&1 &
disown

sleep 1
if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then
  echo "✅ سرور زنده اجرا شد:  http://127.0.0.1:${PORT}/"
  echo "   (اگر باز نشد: http://$(hostname -I 2>/dev/null | awk '{print $1}'):${PORT}/)"
else
  echo "❌ سرور بالا نیامد. لاگ:"; cat /tmp/opencode/v2-server.log
fi
