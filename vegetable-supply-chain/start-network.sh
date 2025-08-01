#!/bin/bash

# start-network.sh - Automated Hyperledger Fabric Network Startup

echo "🚀 Starting VeggieChain Blockchain Network..."

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

# Navigate to test-network directory
cd fabric-samples/test-network

print_status "Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not running"
    exit 1
fi

print_status "Stopping any existing network..."
./network.sh down

print_status "Cleaning up containers and volumes..."
docker container prune -f
docker volume prune -f

print_status "Starting Hyperledger Fabric network..."
./network.sh up createChannel -ca -s couchdb

if [ $? -ne 0 ]; then
    print_error "Failed to start network!"
    exit 1
fi

print_status "Network started successfully!"

# Check if containers are running
print_status "Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}"

print_status "✅ VeggieChain Blockchain Network is ready!"
print_status "Next step: Run deploy-chaincode.sh to deploy the smart contract"

# Go back to project root
cd ../../

