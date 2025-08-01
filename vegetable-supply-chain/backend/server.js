const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Fabric network configuration
const channelName = 'mychannel';
const chaincodeName = 'vegetable';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(process.cwd(), 'wallet');
const org1UserId = 'appUser';

// Helper function to build CCP (Connection Profile)
function buildCCPOrg1() {
    const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 
        'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
        throw new Error(`no such file or directory: ${ccpPath}`);
    }
    const contents = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(contents);
    console.log(`Loaded the network configuration located at ${ccpPath}`);
    return ccp;
}

// Helper function to build wallet
async function buildWallet(Wallets, walletPath) {
    let wallet;
    if (walletPath) {
        wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Built a file system wallet at ${walletPath}`);
    } else {
        wallet = await Wallets.newInMemoryWallet();
        console.log('Built an in memory wallet');
    }
    return wallet;
}

// Helper function to create user identity
async function enrollAdmin() {
    try {
        const ccp = buildCCPOrg1();
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const wallet = await buildWallet(Wallets, walletPath);

        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
    }
}

// Helper function to register and enroll user
async function registerAndEnrollUser() {
    try {
        const ccp = buildCCPOrg1();
        const ca = new FabricCAServices(ccp.certificateAuthorities['ca.org1.example.com'].url);

        const wallet = await buildWallet(Wallets, walletPath);

        const userIdentity = await wallet.get(org1UserId);
        if (userIdentity) {
            console.log(`An identity for the user ${org1UserId} already exists in the wallet`);
            return;
        }

        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: org1UserId,
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: org1UserId,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put(org1UserId, x509Identity);
        console.log(`Successfully registered and enrolled user ${org1UserId} and imported it into the wallet`);
    } catch (error) {
        console.error(`Failed to register user ${org1UserId}: ${error}`);
    }
}

// Initialize wallet and users
async function initWallet() {
    try {
        await enrollAdmin();
        await registerAndEnrollUser();
    } catch (error) {
        console.error(`Failed to initialize wallet: ${error}`);
    }
}

// Get gateway and contract
async function getContract() {
    const ccp = buildCCPOrg1();
    const wallet = await buildWallet(Wallets, walletPath);
    
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: org1UserId,
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    
    return { gateway, contract };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Blockchain API is running' });
});

// Create a new batch
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

// Get batch history
app.get('/api/batches/:batchId/history', async (req, res) => {
    try {
        const { batchId } = req.params;
        
        const { gateway, contract } = await getContract();
        
        const result = await contract.evaluateTransaction('GetBatchHistory', batchId);
        
        await gateway.disconnect();
        
        const history = JSON.parse(result.toString());
        res.json(history);
    } catch (error) {
        console.error('Error getting batch history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Initializing wallet...');
    await initWallet();
    console.log('Wallet initialized successfully');
});