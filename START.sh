#!/bin/bash
# Quick startup script for all three services

echo "🎧 Starting Harmony..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. Server${NC}"
echo "   cd /home/haroon12h8/Desktop/HARMONY/server && python server.py"
echo ""

echo -e "${YELLOW}2. Agent${NC}"
echo "   cd /home/haroon12h8/Desktop/HARMONY/agent && python main.py"
echo ""

echo -e "${YELLOW}3. Extension${NC}"
echo "   Open chrome://extensions/"
echo "   Load unpacked: /home/haroon12h8/Desktop/HARMONY/extension"
echo ""

echo -e "${GREEN}✓ Start each in a separate terminal${NC}"
echo ""
echo "Usage:"
echo "  • Say: ${YELLOW}\"harmony\"${NC}"
echo "  • Press: ${YELLOW}Ctrl+Shift+H${NC}"
