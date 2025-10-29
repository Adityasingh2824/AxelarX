#!/bin/bash

# AxelarX Local Deployment Script
# This script deploys all contracts to a local Linera network

set -e

echo "🚀 Starting AxelarX Local Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Linera CLI is installed
if ! command -v linera &> /dev/null; then
    echo -e "${RED}❌ Linera CLI not found. Please install it first.${NC}"
    echo "Visit: https://linera.dev/getting_started/installation.html"
    exit 1
fi

echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Set environment variables
export LINERA_TMP_DIR=${LINERA_TMP_DIR:-$(mktemp -d)}
export LINERA_WALLET="$LINERA_TMP_DIR/wallet.json"
export LINERA_KEYSTORE="$LINERA_TMP_DIR/keystore.json"
export LINERA_STORAGE="rocksdb:$LINERA_TMP_DIR/client.db"

echo -e "${YELLOW}📁 Using temporary directory: $LINERA_TMP_DIR${NC}"

# Start local Linera network if not already running
if ! pgrep -f "linera-proxy" > /dev/null; then
    echo -e "${BLUE}🌐 Starting local Linera network...${NC}"
    
    # Import the helper function
    source /dev/stdin <<<"$(linera net helper 2>/dev/null)" || {
        echo -e "${RED}❌ Failed to import Linera helper functions${NC}"
        exit 1
    }
    
    # Start network with faucet
    linera_spawn linera net up --with-faucet --faucet-port 8080
    
    echo -e "${GREEN}✅ Local network started${NC}"
else
    echo -e "${GREEN}✅ Local network already running${NC}"
fi

# Initialize wallet if not exists
if [ ! -f "$LINERA_WALLET" ]; then
    echo -e "${BLUE}👛 Initializing wallet...${NC}"
    linera wallet init --faucet http://localhost:8080
    echo -e "${GREEN}✅ Wallet initialized${NC}"
else
    echo -e "${GREEN}✅ Wallet already exists${NC}"
fi

# Request chains for different markets
echo -e "${BLUE}🔗 Creating microchains for markets...${NC}"

declare -a MARKETS=("BTC_USDT" "ETH_USDT" "SOL_USDT")
declare -A MARKET_CHAINS

for market in "${MARKETS[@]}"; do
    echo -e "${YELLOW}  Creating chain for $market...${NC}"
    
    # Request a new chain
    CHAIN_INFO=($(linera wallet request-chain --faucet http://localhost:8080))
    CHAIN_ID="${CHAIN_INFO[0]}"
    ACCOUNT="${CHAIN_INFO[1]}"
    
    MARKET_CHAINS[$market]=$CHAIN_ID
    
    echo -e "${GREEN}  ✅ $market chain: $CHAIN_ID${NC}"
done

# Build contracts
echo -e "${BLUE}🔨 Building smart contracts...${NC}"

# Build order book contract
echo -e "${YELLOW}  Building order book contract...${NC}"
cd contracts/orderbook
cargo build --release --target wasm32-unknown-unknown
cd ../..

# Build settlement contract
echo -e "${YELLOW}  Building settlement contract...${NC}"
cd contracts/settlement
cargo build --release --target wasm32-unknown-unknown
cd ../..

echo -e "${GREEN}✅ Contracts built successfully${NC}"

# Deploy contracts to each market chain
echo -e "${BLUE}📦 Deploying contracts...${NC}"

for market in "${MARKETS[@]}"; do
    CHAIN_ID="${MARKET_CHAINS[$market]}"
    
    echo -e "${YELLOW}  Deploying to $market chain ($CHAIN_ID)...${NC}"
    
    # Deploy order book contract
    ORDERBOOK_APP_ID=$(linera publish-and-create \
        target/wasm32-unknown-unknown/release/axelarx_orderbook.wasm \
        target/wasm32-unknown-unknown/release/axelarx_orderbook_service.wasm \
        --chain $CHAIN_ID \
        --json-argument '{}' 2>/dev/null | grep -o 'e[0-9a-f]*' | head -1)
    
    if [ -n "$ORDERBOOK_APP_ID" ]; then
        echo -e "${GREEN}    ✅ Order Book deployed: $ORDERBOOK_APP_ID${NC}"
    else
        echo -e "${RED}    ❌ Failed to deploy Order Book${NC}"
    fi
    
    # Deploy settlement contract
    SETTLEMENT_APP_ID=$(linera publish-and-create \
        target/wasm32-unknown-unknown/release/axelarx_settlement.wasm \
        target/wasm32-unknown-unknown/release/axelarx_settlement_service.wasm \
        --chain $CHAIN_ID \
        --json-argument '{}' 2>/dev/null | grep -o 'e[0-9a-f]*' | head -1)
    
    if [ -n "$SETTLEMENT_APP_ID" ]; then
        echo -e "${GREEN}    ✅ Settlement Engine deployed: $SETTLEMENT_APP_ID${NC}"
    else
        echo -e "${RED}    ❌ Failed to deploy Settlement Engine${NC}"
    fi
done

# Start GraphQL service
echo -e "${BLUE}🔌 Starting GraphQL service...${NC}"
linera service --port 8080 &
SERVICE_PID=$!

echo -e "${GREEN}✅ GraphQL service started on port 8080${NC}"

# Create configuration file
echo -e "${BLUE}📝 Creating configuration file...${NC}"

cat > deployment-config.json << EOF
{
  "network": {
    "type": "local",
    "faucet_url": "http://localhost:8080",
    "graphql_url": "http://localhost:8080"
  },
  "wallet": {
    "path": "$LINERA_WALLET",
    "keystore": "$LINERA_KEYSTORE",
    "storage": "$LINERA_STORAGE"
  },
  "markets": {
EOF

first=true
for market in "${MARKETS[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> deployment-config.json
    fi
    
    echo -n "    \"$market\": {" >> deployment-config.json
    echo -n "\"chain_id\": \"${MARKET_CHAINS[$market]}\"" >> deployment-config.json
    echo -n "}" >> deployment-config.json
done

cat >> deployment-config.json << EOF

  },
  "contracts": {
    "orderbook": "axelarx-orderbook",
    "settlement": "axelarx-settlement"
  },
  "deployment_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "${GREEN}✅ Configuration saved to deployment-config.json${NC}"

# Display summary
echo -e "\n${GREEN}🎉 AxelarX Deployment Complete!${NC}"
echo -e "\n${BLUE}📊 Deployment Summary:${NC}"
echo -e "  Network: Local Linera Network"
echo -e "  Faucet: http://localhost:8080"
echo -e "  GraphQL: http://localhost:8080"
echo -e "  Wallet: $LINERA_WALLET"
echo -e "  Storage: $LINERA_STORAGE"

echo -e "\n${BLUE}🏪 Deployed Markets:${NC}"
for market in "${MARKETS[@]}"; do
    echo -e "  $market: ${MARKET_CHAINS[$market]}"
done

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo -e "  1. Start the frontend: ${YELLOW}cd frontend && npm run dev${NC}"
echo -e "  2. Open http://localhost:3000 in your browser"
echo -e "  3. Connect your wallet and start trading!"

echo -e "\n${BLUE}💡 Useful Commands:${NC}"
echo -e "  Check wallet: ${YELLOW}linera wallet show${NC}"
echo -e "  Query balance: ${YELLOW}linera query-balance <chain-id>${NC}"
echo -e "  View chains: ${YELLOW}linera wallet list-chains${NC}"

echo -e "\n${YELLOW}⚠️  Keep this terminal open to maintain the local network${NC}"

# Keep the script running
wait $SERVICE_PID
