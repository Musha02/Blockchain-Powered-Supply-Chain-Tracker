#!/bin/bash

# deploy-chaincode.sh - Automated Chaincode Deployment

echo "📦 Deploying VeggieChain Smart Contract..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "fabric-samples/test-network" ]; then
    print_error "fabric-samples/test-network not found!"
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if chaincode directory exists
if [ ! -d "chaincode" ]; then
    print_error "chaincode directory not found!"
    print_error "Please make sure the chaincode is in the ./chaincode directory"
    exit 1
fi

# Navigate to test-network directory
cd fabric-samples/test-network

# Set environment variables
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

print_status "Setting up environment variables..."

# Set peer environment for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

print_status "Checking if network is running..."
if ! docker ps | grep -q "peer0.org1.example.com"; then
    print_error "Network is not running! Please run start-network.sh first"
    exit 1
fi

print_status "Installing chaincode dependencies..."
cd ../../chaincode
if [ -f "package.json" ]; then
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install chaincode dependencies!"
        exit 1
    fi
fi
cd ../fabric-samples/test-network

print_status "Deploying chaincode 'vegetable'..."
./network.sh deployCC -ccn vegetable -ccp ../../chaincode -ccl javascript


if [ $? -ne 0 ]; then
    print_error "Failed to deploy chaincode!"
    exit 1
fi

print_status "Initializing ledger with sample data..."
peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    -C mychannel \
    -n vegetable \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
    -c '{"function":"InitLedger","Args":[]}'

if [ $? -ne 0 ]; then
    print_warning "InitLedger failed, but chaincode is deployed"
else
    print_status "Ledger initialized successfully!"
fi

print_status "✅ VeggieChain Smart Contract deployed successfully!"
print_status "Chaincode name: vegetable"
print_status "Channel: mychannel"
print_status "Next step: Start the backend server to connect to blockchain"

# Go back to project root
cd ../../