#!/bin/bash
# troubleshoot.sh - Hyperledger Fabric Network Troubleshooting

echo "🔍 VeggieChain Network Troubleshooting..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [[ ! -d "fabric-samples/test-network" ]]; then
    echo -e "${RED}❌ Error: fabric-samples/test-network directory not found!${NC}"
    echo -e "${YELLOW}💡 Make sure you're in the project root directory${NC}"
    exit 1
fi

cd fabric-samples/test-network

# Check Docker containers
echo -e "${GREEN}🐳 Checking Docker containers...${NC}"
if docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "${GREEN}✅ Org1 peer is running${NC}"
else
    echo -e "${RED}❌ Org1 peer is NOT running${NC}"
fi

if docker ps | grep -q "peer0.org2.example.com"; then
    echo -e "${GREEN}✅ Org2 peer is running${NC}"
else
    echo -e "${RED}❌ Org2 peer is NOT running${NC}"
fi

if docker ps | grep -q "orderer.example.com"; then
    echo -e "${GREEN}✅ Orderer is running${NC}"
else
    echo -e "${RED}❌ Orderer is NOT running${NC}"
fi

# Check if certificates exist
echo -e "\n${GREEN}📜 Checking certificates...${NC}"
ORG1_CERT="organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
ORG2_CERT="organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
ORDERER_CERT="organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

if [[ -f "$ORG1_CERT" ]]; then
    echo -e "${GREEN}✅ Org1 TLS certificate exists${NC}"
else
    echo -e "${RED}❌ Org1 TLS certificate missing: $ORG1_CERT${NC}"
fi

if [[ -f "$ORG2_CERT" ]]; then
    echo -e "${GREEN}✅ Org2 TLS certificate exists${NC}"
else
    echo -e "${RED}❌ Org2 TLS certificate missing: $ORG2_CERT${NC}"
fi

if [[ -f "$ORDERER_CERT" ]]; then
    echo -e "${GREEN}✅ Orderer TLS certificate exists${NC}"
else
    echo -e "${RED}❌ Orderer TLS certificate missing: $ORDERER_CERT${NC}"
fi

# Set environment variables
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/${ORG1_CERT}
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Test peer connection
echo -e "\n${GREEN}🔗 Testing peer connection...${NC}"
if peer version >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Peer CLI is working${NC}"
    
    # Test chaincode query
    echo -e "\n${GREEN}📝 Testing chaincode query...${NC}"
    if peer chaincode query -C mychannel -n vegetable -c '{"function":"GetAllBatches","Args":[]}' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Chaincode query successful${NC}"
    else
        echo -e "${RED}❌ Chaincode query failed${NC}"
        echo -e "${YELLOW}💡 Try running the network setup scripts again${NC}"
    fi
else
    echo -e "${RED}❌ Peer CLI is not working${NC}"
    echo -e "${YELLOW}💡 Check if PATH and FABRIC_CFG_PATH are set correctly${NC}"
fi

echo -e "\n${GREEN}🎯 Current environment:${NC}"
echo -e "   Working directory: ${PWD}"
echo -e "   PATH: ${PATH}"
echo -e "   FABRIC_CFG_PATH: ${FABRIC_CFG_PATH}"
echo -e "   CORE_PEER_ADDRESS: ${CORE_PEER_ADDRESS}"

echo -e "\n${GREEN}📋 Next steps if there are issues:${NC}"
echo -e "   1. Stop network: ./network.sh down"
echo -e "   2. Clean docker: docker system prune -f"
echo -e "   3. Start network: ./network.sh up createChannel -ca -s couchdb"
echo -e "   4. Deploy chaincode: ./network.sh deployCC -ccn vegetable -ccp ../../chaincode -ccl javascript"
echo -e "   5. Initialize ledger: Use the InitLedger command from Step 5 above"