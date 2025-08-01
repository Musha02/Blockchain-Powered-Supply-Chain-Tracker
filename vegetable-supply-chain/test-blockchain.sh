#!/bin/bash

# test-blockchain.sh - Test Blockchain Functionality

echo "🧪 Testing VeggieChain Blockchain..."

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

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "fabric-samples/test-network" ]; then
    print_error "fabric-samples/test-network not found!"
    exit 1
fi

# Navigate to test-network directory
cd fabric-samples/test-network

# Set environment variables
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

print_status "Checking blockchain network status..."

# Check if containers are running
if ! docker ps | grep -q "peer0.org1.example.com"; then
    print_error "Blockchain network is not running!"
    print_error "Please run start-network.sh first"
    exit 1
fi

print_status "Network is running ✅"

# Test 1: Query all batches
print_test "Test 1: Querying all batches..."
result=$(peer chaincode query -C mychannel -n vegetable -c '{"function":"GetAllBatches","Args":[]}' 2>/dev/null)
if [ $? -eq 0 ]; then
    print_status "✅ GetAllBatches successful"
    echo "Result: $result" | head -c 200
    echo "..."
else
    print_error "❌ GetAllBatches failed"
fi

# Test 2: Create a test batch
print_test "Test 2: Creating test batch..."
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
    -c '{"function":"CreateBatch","Args":["TEST001","Tomato","FARM001","Test Farmer","2024-07-17","500","75"]}' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_status "✅ CreateBatch successful"
else
    print_warning "⚠️ CreateBatch failed (batch might already exist)"
fi

# Test 3: Query the test batch
print_test "Test 3: Querying test batch..."
result=$(peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["TEST001"]}' 2>/dev/null)
if [ $? -eq 0 ]; then
    print_status "✅ GetBatch successful"
    echo "Batch TEST001 found!"
else
    print_error "❌ GetBatch failed"
fi

# Test 4: Update batch location
print_test "Test 4: Updating batch location..."
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
    -c '{"function":"UpdateBatchLocation","Args":["TEST001","Warehouse","480","20","WAREHOUSE001"]}' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_status "✅ UpdateBatchLocation successful"
else
    print_warning "⚠️ UpdateBatchLocation failed"
fi

# Test 5: Check Docker containers
print_test "Test 5: Checking Docker containers..."
print_status "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(peer|orderer|ca)"

# Test 6: Test chaincode exists
print_test "Test 6: Checking chaincode deployment..."
chaincodes=$(peer lifecycle chaincode querycommitted -C mychannel 2>/dev/null | grep vegetable)
if [ ! -z "$chaincodes" ]; then
    print_status "✅ Chaincode 'vegetable' is deployed and committed"
else
    print_error "❌ Chaincode 'vegetable' not found"
fi

print_status "🎯 Blockchain test completed!"
print_status "If all tests passed, your blockchain is ready for the backend"

# Go back to project root
cd ../../