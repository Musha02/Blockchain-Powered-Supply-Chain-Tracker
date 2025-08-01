// backend/simple-test.js - Minimal blockchain test
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function testBlockchain() {
    try {
        console.log('🧪 Testing basic blockchain connection...');
        
        // 1. Load connection profile
        const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 
            'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        console.log('✅ Connection profile loaded');
        
        // 2. Create wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // 3. Load admin certificate
        const credPath = path.join(__dirname, '..', 'fabric-samples', 'test-network',
            'organizations', 'peerOrganizations', 'org1.example.com');
        const certPath = path.join(credPath, 'users', 'Admin@org1.example.com', 'msp', 'signcerts');
        const keyPath = path.join(credPath, 'users', 'Admin@org1.example.com', 'msp', 'keystore');
        
        const certFiles = fs.readdirSync(certPath);
        const keyFiles = fs.readdirSync(keyPath);
        const cert = fs.readFileSync(path.join(certPath, certFiles[0])).toString();
        const key = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();
        
        const x509Identity = {
            credentials: { certificate: cert, privateKey: key },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        
        await wallet.put('admin', x509Identity);
        console.log('✅ Admin identity created');
        
        // 4. Connect to gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: false }
        });
        console.log('✅ Gateway connected');
        
        // 5. Get network and contract
        const network = await gateway.getNetwork('mychannel');
        console.log('✅ Network accessed');
        
        const contract = network.getContract('vegetable');
        console.log('✅ Contract accessed');
        
        // 6. Test simple query
        console.log('🔍 Testing chaincode query...');
        const result = await contract.evaluateTransaction('GetAllBatches');
        console.log('✅ Query successful!');
        console.log('📊 Result:', result.toString());
        
        await gateway.disconnect();
        console.log('🎯 Blockchain test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Full error:', error);
    }
}

testBlockchain();