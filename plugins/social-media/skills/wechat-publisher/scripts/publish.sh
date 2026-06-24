#!/usr/bin/env bash
# wechat-publisher: Publish Markdown to WeChat Official Account drafts
# Usage: ./publish.sh <markdown-file> [theme] [highlight]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEFAULT_THEME="lapis"
DEFAULT_HIGHLIGHT="solarized-light"

check_wenyan() {
    if ! command -v wenyan &> /dev/null; then
        echo -e "${RED}wenyan-cli not installed!${NC}"
        echo -e "${YELLOW}Installing wenyan-cli...${NC}"
        npm install -g @wenyan-md/cli
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}wenyan-cli installed!${NC}"
        else
            echo -e "${RED}Install failed! Run manually: npm install -g @wenyan-md/cli${NC}"
            exit 1
        fi
    fi
}

load_credentials() {
    if [ -z "$WECHAT_APP_ID" ] || [ -z "$WECHAT_APP_SECRET" ]; then
        # Try loading from ~/.hermes/.env
        ENV_FILE="$HOME/.hermes/.env"
        if [ -f "$ENV_FILE" ]; then
            echo -e "${YELLOW}Loading credentials from ~/.hermes/.env...${NC}"
            export WECHAT_APP_ID=$(grep "^WECHAT_APP_ID=" "$ENV_FILE" | head -1 | sed 's/WECHAT_APP_ID=//' | tr -d ' "')
            export WECHAT_APP_SECRET=$(grep "^WECHAT_APP_SECRET=" "$ENV_FILE" | head -1 | sed 's/WECHAT_APP_SECRET=//' | tr -d ' "')
        fi
    fi
}

check_env() {
    load_credentials

    if [ -z "$WECHAT_APP_ID" ] || [ -z "$WECHAT_APP_SECRET" ]; then
        echo -e "${RED}Credentials not set!${NC}"
        echo -e "${YELLOW}Add to ~/.hermes/.env:${NC}"
        echo ""
        echo "  WECHAT_APP_ID=your_app_id"
        echo "  WECHAT_APP_SECRET=your_app_secret"
        echo ""
        echo -e "${YELLOW}Or export directly:${NC}"
        echo "  export WECHAT_APP_ID=your_app_id"
        echo "  export WECHAT_APP_SECRET=your_app_secret"
        exit 1
    fi
}

check_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo -e "${RED}File not found: $file${NC}"
        exit 1
    fi
}

publish() {
    local file="$1"
    local theme="${2:-$DEFAULT_THEME}"
    local highlight="${3:-$DEFAULT_HIGHLIGHT}"

    echo -e "${GREEN}Publishing article...${NC}"
    echo "  File: $file"
    echo "  Theme: $theme"
    echo "  Highlight: $highlight"
    echo ""

    wenyan publish -f "$file" -t "$theme" -h "$highlight"

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}Published successfully!${NC}"
        echo -e "${YELLOW}Check WeChat Official Account drafts:${NC}"
        echo "  https://mp.weixin.qq.com/"
    else
        echo ""
        echo -e "${RED}Publish failed!${NC}"
        echo -e "${YELLOW}Common issues:${NC}"
        echo "  1. IP not whitelisted -> Add in mp.weixin.qq.com backend"
        echo "  2. Missing frontmatter -> Add title field at top"
        echo "  3. API credentials error -> Check ~/.hermes/.env"
        echo "  4. Cover size wrong -> Need 1080x864 px"
        exit 1
    fi
}

show_help() {
    echo "Usage: $0 <markdown-file> [theme] [highlight]"
    echo ""
    echo "Examples:"
    echo "  $0 article.md"
    echo "  $0 article.md lapis"
    echo "  $0 article.md lapis solarized-light"
    echo ""
    echo "Available themes: default, lapis, phycat, ..."
    echo "  Run 'wenyan theme -l' to see all"
    echo ""
    echo "Available highlights:"
    echo "  atom-one-dark, atom-one-light, dracula, github-dark, github,"
    echo "  monokai, solarized-dark, solarized-light, xcode"
}

main() {
    if [ $# -eq 0 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
        show_help
        exit 0
    fi

    local file="$1"
    local theme="$2"
    local highlight="$3"

    check_wenyan
    check_env
    check_file "$file"

    publish "$file" "$theme" "$highlight"
}

main "$@"
