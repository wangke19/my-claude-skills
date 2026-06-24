#!/usr/bin/env bash
# setup.sh - Load WeChat Official Account credentials
# Usage: source scripts/setup.sh

ENV_FILE="$HOME/.hermes/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: ~/.hermes/.env not found"
    echo ""
    echo "Create it with:"
    echo "  echo 'WECHAT_APP_ID=your_app_id' >> ~/.hermes/.env"
    echo "  echo 'WECHAT_APP_SECRET=your_app_secret' >> ~/.hermes/.env"
    exit 1
fi

WECHAT_APP_ID=$(grep "^WECHAT_APP_ID=" "$ENV_FILE" | head -1 | sed 's/WECHAT_APP_ID=//' | tr -d ' "')
WECHAT_APP_SECRET=$(grep "^WECHAT_APP_SECRET=" "$ENV_FILE" | head -1 | sed 's/WECHAT_APP_SECRET=//' | tr -d ' "')

if [ -z "$WECHAT_APP_ID" ] || [ -z "$WECHAT_APP_SECRET" ]; then
    echo "ERROR: Could not read credentials from ~/.hermes/.env"
    echo ""
    echo "Make sure it contains:"
    echo "  WECHAT_APP_ID=your_app_id"
    echo "  WECHAT_APP_SECRET=your_app_secret"
    exit 1
fi

export WECHAT_APP_ID
export WECHAT_APP_SECRET

echo "OK: WeChat credentials loaded from ~/.hermes/.env"
echo "  WECHAT_APP_ID=${WECHAT_APP_ID:0:10}..."
echo "  WECHAT_APP_SECRET=****** (hidden)"
