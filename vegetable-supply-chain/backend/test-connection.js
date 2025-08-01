const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function testConnection() {
    try {
        // Load connection profile
        const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 
            'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        // Fix URLs
        if (ccp.peers && ccp.peers['peer0.org1.example.com']) {
            ccp.peers['peer0.org1.example.com'].url = 'grpcs://127.0.0.1:7051';
        }
        
        console.log('Peer URL:', ccp.peers['peer0.org1.example.com'].url);
        
        // Create wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // Connect
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: false, asLocalhost: true }
        });
        
        console.log('✅ Connected successfully!');
        
        // Test query
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('vegetable');
        const result = await contract.evaluateTransaction('GetAllBatches');
        console.log('Query result:', result.toString());
        
        await gateway.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testConnection();