// backend/fixed-blockchain-server.js - Fixed Blockchain Backend
const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain configuration
const channelName = 'mychannel';
const chaincodeName = 'vegetable';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(process.cwd(), 'wallet');
const org1UserId = 'appUser';

// Helper function to build connection profile with WSL fixes
function buildCCPOrg1() {
    const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 
        'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    
    if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at: ${ccpPath}`);
    }
    
    const contents = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(contents);
    
    // WSL Fix: Update URLs to use 127.0.0.1 instead of localhost
    if (ccp.peers && ccp.peers['peer0.org1.example.com']) {
        console.log('Original peer URL:', ccp.peers['peer0.org1.example.com'].url);
        ccp.peers['peer0.org1.example.com'].url = ccp.peers['peer0.org1.example.com'].url.replace('localhost', '127.0.0.1');
        console.log('Updated peer URL:', ccp.peers['peer0.org1.example.com'].url);
    }
    
    if (ccp.orderers && ccp.orderers['orderer.example.com']) {
        ccp.orderers['orderer.example.com'].url = ccp.orderers['orderer.example.com'].url.replace('localhost', '127.0.0.1');
    }
    
    if (ccp.certificateAuthorities && ccp.certificateAuthorities['ca.org1.example.com']) {
        ccp.certificateAuthorities['ca.org1.example.com'].url = ccp.certificateAuthorities['ca.org1.example.com'].url.replace('localhost', '127.0.0.1');
    }
    
    console.log(`✅ Loaded and fixed connection profile for WSL`);
    return ccp;
}

// Helper function to build wallet using cryptogen certificates
async function buildWallet() {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`📁 Built wallet at ${walletPath}`);

    // Check if admin identity exists
    const adminIdentity = await wallet.get('admin');
    if (adminIdentity) {
        console.log('👤 Admin identity already exists in wallet');
    } else {
        console.log('🔑 Creating admin identity from cryptogen certificates...');
        
        // Use cryptogen generated certificates
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
    }

    return wallet;
}


// Get gateway and contract with fixed discovery settings
async function getContract() {
    try {
        const ccp = buildCCPOrg1();
        const wallet = await buildWallet();
        
        const gateway = new Gateway();
        
        // Connect with extended timeouts for WSL
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { 
                enabled: false,
                asLocalhost: true 
            },
            eventHandlerOptions: {
                commitTimeout: 300,  // 5 minutes
                endorseTimeout: 60   // 1 minute
            },
            queryHandlerOptions: {
                timeout: 60,  // 1 minute
                strategy: 'MSPID_SCOPE_SINGLE'
            }
        });

        console.log('🔗 Connected to Fabric gateway (discovery disabled)');
        
        const network = await gateway.getNetwork(channelName);
        console.log('📡 Got network:', channelName);
        
        const contract = network.getContract(chaincodeName);
        console.log(`📋 Got contract '${chaincodeName}' on channel '${channelName}'`);
        
        return { gateway, contract };
    } catch (error) {
        console.error('❌ Failed to get contract:', error.message);
        console.error('Full error:', error);
        throw error;
    }
}

// API Routes (same as before)
app.get('/api/health', async (req, res) => {
    try {
        const { gateway, contract } = await getContract();
        await contract.evaluateTransaction('GetAllBatches');
        await gateway.disconnect();
        
        res.json({ 
            status: 'OK', 
            message: 'Blockchain Backend API is running',
            blockchain: 'Connected (Discovery Disabled)',
            chaincode: chaincodeName,
            channel: channelName
        });
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        res.status(500).json({ 
            status: 'ERROR', 
            message: 'Blockchain connection failed',
            error: error.message 
        });
    }
});

// Create a new batch
app.post('/api/batches', async (req, res) => {
    try {
        const { batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg } = req.body;
        
        if (!batchId || !vegetableType || !farmId || !farmerName || !harvestDate || !initialQuantity || !pricePerKg) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        console.log(`📦 Creating batch: ${batchId}`);
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.submitTransaction('CreateBatch', 
            batchId, vegetableType, farmId, farmerName, harvestDate, 
            initialQuantity.toString(), pricePerKg.toString());
        
        await gateway.disconnect();
        
        const batch = JSON.parse(result.toString());
        console.log(`✅ Batch created on blockchain: ${batchId}`);
        
        res.status(201).json(batch);
    } catch (error) {
        console.error('❌ Error creating batch:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get all batches
app.get('/api/batches', async (req, res) => {
    try {
        console.log('📊 Fetching all batches from blockchain...');
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.evaluateTransaction('GetAllBatches');
        
        await gateway.disconnect();
        
        const batches = JSON.parse(result.toString());
        console.log(`✅ Retrieved ${batches.length} batches from blockchain`);
        
        res.json(batches);
    } catch (error) {
        console.error('❌ Error getting batches:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get batch by ID
app.get('/api/batches/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        console.log(`🔍 Fetching batch: ${batchId}`);
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.evaluateTransaction('GetBatch', batchId);
        
        await gateway.disconnect();
        
        const batch = JSON.parse(result.toString());
        console.log(`✅ Retrieved batch from blockchain: ${batchId}`);
        
        res.json(batch);
    } catch (error) {
        console.error(`❌ Error getting batch ${req.params.batchId}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Track batch by QR code
app.get('/api/track/:qrCode', async (req, res) => {
    try {
        const { qrCode } = req.params;
        console.log(`📱 Tracking by QR code: ${qrCode}`);
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.evaluateTransaction('TrackBatchByQR', qrCode);
        
        await gateway.disconnect();
        
        const batch = JSON.parse(result.toString());
        console.log(`✅ Tracked batch by QR code: ${batch.batchId}`);
        
        res.json(batch);
    } catch (error) {
        console.error(`❌ Error tracking by QR code:`, error.message);
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
        
        console.log(`🚛 Updating location for batch: ${batchId} to ${newLocation}`);
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.submitTransaction('UpdateBatchLocation', 
            batchId, newLocation, currentQuantity.toString(), wastage.toString(), updatedBy);
        
        await gateway.disconnect();
        
        const batch = JSON.parse(result.toString());
        console.log(`✅ Updated batch location on blockchain: ${batchId}`);
        
        res.json(batch);
    } catch (error) {
        console.error('❌ Error updating batch location:', error.message);
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
        
        console.log(`⚠️ Recording wastage for batch: ${batchId}, amount: ${wastageAmount}kg`);
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.submitTransaction('RecordWastage', 
            batchId, wastageAmount.toString(), reason, updatedBy);
        
        await gateway.disconnect();
        
        const batch = JSON.parse(result.toString());
        console.log(`✅ Recorded wastage on blockchain: ${batchId}`);
        
        res.json(batch);
    } catch (error) {
        console.error('❌ Error recording wastage:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        console.log('📈 Calculating statistics from blockchain...');
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.evaluateTransaction('GetAllBatches');
        
        await gateway.disconnect();
        
        const batches = JSON.parse(result.toString());
        
        // Calculate stats from blockchain data
        const stats = {
            totalBatches: batches.length,
            totalQuantity: batches.reduce((sum, item) => sum + (item.Record?.currentQuantity || 0), 0),
            totalWastage: batches.reduce((sum, item) => {
                const batch = item.Record;
                if (batch?.history) {
                    const wastage = batch.history.reduce((w, h) => w + (h.wastage || 0), 0);
                    return sum + wastage;
                }
                return sum;
            }, 0),
            locations: {
                farm: batches.filter(item => item.Record?.currentLocation === 'Farm').length,
                warehouse: batches.filter(item => item.Record?.currentLocation === 'Warehouse').length,
                retailer: batches.filter(item => item.Record?.currentLocation === 'Retailer').length,
                shop: batches.filter(item => item.Record?.currentLocation === 'Shop').length,
            },
            vegetables: {}
        };
        
        // Count vegetables
        batches.forEach(item => {
            const vegetable = item.Record?.vegetableType;
            if (vegetable) {
                stats.vegetables[vegetable] = (stats.vegetables[vegetable] || 0) + 1;
            }
        });
        
        console.log(`✅ Calculated stats: ${stats.totalBatches} batches, ${stats.totalQuantity}kg total`);
        
        res.json(stats);
    } catch (error) {
        console.error('❌ Error calculating stats:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 VeggieChain Blockchain Backend (Fixed) starting on port ${PORT}`);
    console.log(`🔗 Chaincode: ${chaincodeName}`);
    console.log(`📡 Channel: ${channelName}`);
    console.log(`🔧 Discovery: Disabled (to avoid access issues)`);
    
    try {
        // Test blockchain connection on startup
        const { gateway, contract } = await getContract();
        await contract.evaluateTransaction('GetAllBatches');
        await gateway.disconnect();
        
        console.log('✅ Blockchain connection successful!');
        console.log(`🌐 API endpoints available at http://localhost:${PORT}/api`);
        console.log('🎯 All data will be stored on the blockchain');
    } catch (error) {
        console.error('❌ Failed to connect to blockchain:', error.message);
        console.error('💡 Make sure the network is running and chaincode is deployed');
    }
});