const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const channelName = 'mychannel';
const chaincodeName = 'vegetable';

function buildCCPOrg1() {
    const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 
        'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
        throw new Error(`Connection profile not found at: ${ccpPath}`);
    }
    const contents = fs.readFileSync(ccpPath, 'utf8');
    
    // Modify to use only peer0.org1.example.com
    const ccp = JSON.parse(contents);
    
    // Remove org2 peer to avoid consensus issues
    if (ccp.peers && ccp.peers['peer0.org2.example.com']) {
        delete ccp.peers['peer0.org2.example.com'];
    }
    
    return ccp;
}

async function buildWallet() {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get('admin');
    if (adminIdentity) {
        console.log('Admin identity already exists in wallet');
        return wallet;
    }

    const credPath = path.join(__dirname, '..', 'fabric-samples', 'test-network',
        'organizations', 'peerOrganizations', 'org1.example.com');
    
    const certPath = path.join(credPath, 'users', 'Admin@org1.example.com', 'msp', 'signcerts');
    const keyPath = path.join(credPath, 'users', 'Admin@org1.example.com', 'msp', 'keystore');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        throw new Error('Admin certificates not found. Make sure the network is running.');
    }

    const certFiles = fs.readdirSync(certPath);
    const keyFiles = fs.readdirSync(keyPath);
    
    if (certFiles.length === 0 || keyFiles.length === 0) {
        throw new Error('Certificate or key files not found');
    }

    const cert = fs.readFileSync(path.join(certPath, certFiles[0])).toString();
    const key = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();

    const x509Identity = {
        credentials: {
            certificate: cert,
            privateKey: key,
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };

    await wallet.put('admin', x509Identity);
    console.log('✅ Successfully imported admin identity into wallet');
    return wallet;
}

async function getContract() {
    const ccp = buildCCPOrg1();
    const wallet = await buildWallet();
    
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { 
            enabled: true, 
            asLocalhost: true,
            // Force use of org1 peer only
            targets: [
                {
                    name: 'peer0.org1.example.com',
                    mspId: 'Org1MSP'
                }
            ]
        }
    });

    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    
    return { gateway, contract };
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Single Peer Backend API is running' });
});

// Get all batches
app.get('/api/batches', async (req, res) => {
    try {
        const { gateway, contract } = await getContract();
        const result = await contract.evaluateTransaction('GetAllBatches');
        await gateway.disconnect();
        const batches = JSON.parse(result.toString());
        res.json(batches);
    } catch (error) {
        console.error('Error getting batches:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get batch by ID
app.get('/api/batches/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { gateway, contract } = await getContract();
        const result = await contract.evaluateTransaction('GetBatch', batchId);
        await gateway.disconnect();
        const batch = JSON.parse(result.toString());
        res.json(batch);
    } catch (error) {
        console.error('Error getting batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new batch
app.post('/api/batches', async (req, res) => {
    try {
        const { batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg } = req.body;
        
        if (!batchId || !vegetableType || !farmId || !farmerName || !harvestDate || !initialQuantity || !pricePerKg) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { gateway, contract } = await getContract();
        const result = await contract.submitTransaction('CreateBatch', 
            batchId, vegetableType, farmId, farmerName, harvestDate, 
            initialQuantity.toString(), pricePerKg.toString());
        
        await gateway.disconnect();
        const batch = JSON.parse(result.toString());
        res.status(201).json(batch);
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Track batch by QR code
app.get('/api/track/:qrCode', async (req, res) => {
    try {
        const { qrCode } = req.params;
        const { gateway, contract } = await getContract();
        const result = await contract.evaluateTransaction('TrackBatchByQR', qrCode);
        await gateway.disconnect();
        const batch = JSON.parse(result.toString());
        res.json(batch);
    } catch (error) {
        console.error('Error tracking batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update batch location
app.put('/api/batches/:batchId/location', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { newLocation, currentQuantity, wastage, updatedBy } = req.body;
        
        if (!newLocation || currentQuantity === undefined || wastage === undefined || !updatedBy) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const { gateway, contract } = await getContract();
        const result = await contract.submitTransaction('UpdateBatchLocation', 
            batchId, newLocation, currentQuantity.toString(), wastage.toString(), updatedBy);
        
        await gateway.disconnect();
        const batch = JSON.parse(result.toString());
        res.json(batch);
    } catch (error) {
        console.error('Error updating batch location:', error);
        res.status(500).json({ error: error.message });
    }
});

// Record wastage
app.put('/api/batches/:batchId/wastage', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { wastageAmount, reason, updatedBy } = req.body;
        
        if (!wastageAmount || !reason || !updatedBy) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const { gateway, contract } = await getContract();
        const result = await contract.submitTransaction('RecordWastage', 
            batchId, wastageAmount.toString(), reason, updatedBy);
        
        await gateway.disconnect();
        const batch = JSON.parse(result.toString());
        res.json(batch);
    } catch (error) {
        console.error('Error recording wastage:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, async () => {
    console.log(`🚀 Single Peer Backend Server running on port ${PORT}`);
    console.log(`📡 Using only peer0.org1.example.com to avoid consensus issues`);
    try {
        await buildWallet();
        console.log('✅ Wallet initialized successfully');
        console.log(`🌐 API endpoints: http://localhost:${PORT}/api`);
    } catch (error) {
        console.error('❌ Wallet initialization failed:', error.message);
    }
});