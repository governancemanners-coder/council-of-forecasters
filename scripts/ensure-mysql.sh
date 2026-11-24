#!/usr/bin/env bash
# Idempotent local MySQL for development. Uses a world-accessible socket and
# auth_socket so the ubuntu user connects with no password.
set -euo pipefail

if ! command -v mysqld >/dev/null 2>&1 && ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client is not installed" >&2
  exit 1
fi

CNF=/etc/mysql/mysql.conf.d/zzz-dev-socket.cnf
if [ ! -f "$CNF" ]; then
  sudo tee "$CNF" >/dev/null << 'EOF'
[mysqld]
socket=/tmp/mysql.sock
[client]
socket=/tmp/mysql.sock
EOF
  sudo service mysql restart || true
fi

if ! mysqladmin --socket=/tmp/mysql.sock ping --silent 2>/dev/null; then
  sudo service mysql start || true
fi

ready=0
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if mysqladmin --socket=/tmp/mysql.sock ping --silent 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "mysql did not become ready on /tmp/mysql.sock" >&2
  exit 1
fi

sudo mysql --socket=/tmp/mysql.sock << 'SQL'
CREATE DATABASE IF NOT EXISTS council;
CREATE USER IF NOT EXISTS 'ubuntu'@'localhost' IDENTIFIED WITH auth_socket;
GRANT ALL PRIVILEGES ON council.* TO 'ubuntu'@'localhost';
FLUSH PRIVILEGES;
SQL
