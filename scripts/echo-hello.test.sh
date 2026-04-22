#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

output="$("$SCRIPT_DIR/echo-hello.sh")"
expected="hello"

if [ "$output" = "$expected" ]; then
  echo "PASS: echo-hello outputs 'hello'"
  exit 0
else
  echo "FAIL: expected '$expected', got '$output'"
  exit 1
fi
