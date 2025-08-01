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

// Build a custom connection profile 
function buildConnectionProfile() {
    return {
        name: 'test-network-org1',
        version: '1.0.0',
        client: {
            organization: 'Org1',
            connection: {
                timeout: {
                    peer: {
                        endorser: '300'
                    }
                }
            }
        },
        organizations: {
            Org1: {
                mspid: 'Org1MSP',
                peers: ['peer0.org1.example.com']
            }
        },
        peers: {
            'peer0.org1.example.com': {
                url: 'grpcs://localhost:7051',
                tlsCACerts: {
                    path: path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 
                        'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
                },
                grpcOptions: {
                    'ssl-target-name-override': 'peer0.org1.example.com',
                    'hostnameOverride': 'peer0.org1.example.com'
                }
            }
        }
    };
}

async function buildWallet() {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
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
    }

    return wallet;
}

async function getContract() {
    try {
        const ccp = buildConnectionProfile();
        const wallet = await buildWallet();
        
        const gateway = new Gateway();
        
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: false }
        });

        console.log('🔗 Connected to Fabric gateway');
        
        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        
        return { gateway, contract };
    } catch (error) {
        console.error('❌ Failed to get contract:', error.message);
        throw error;
    }
}

// API Routes
app.get('/api/health', async (req, res) => {
    try {
        const { gateway, contract } = await getContract();
        const result = await contract.evaluateTransaction('GetAllBatches');
        await gateway.disconnect();
        
        res.json({ 
            status: 'OK', 
            message: 'Working Blockchain Backend is running',
            blockchain: 'Connected',
            chaincode: chaincodeName,
            channel: channelName,
            batches: JSON.parse(result.toString()).length
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

// Create new batch
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

app.listen(PORT, async () => {
    console.log(`🚀 Working Blockchain Backend starting on port ${PORT}`);
    console.log(`🔗 Chaincode: ${chaincodeName} on ${channelName}`);
    
    try {
        const { gateway, contract } = await getContract();
        const result = await contract.evaluateTransaction('GetAllBatches');
        await gateway.disconnect();
        
        console.log('✅ All features working perfectly');
       console.log('✅ Blockchain connection successful!');
        console.log(`📊 Found ${JSON.parse(result.toString()).length} batches on blockchain`);
        console.log(`🌐 API available at http://localhost:${PORT}/api`);
        console.log(`📈 Stats endpoint: http://localhost:3001/api/stats`); 
    } catch (error) {
        console.error('❌ Startup test failed:', error.message);
    }
});