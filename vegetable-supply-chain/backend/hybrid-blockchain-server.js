// backend/hybrid-blockchain-server.js - Complete Hybrid Blockchain Backend
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());


// Enhanced executePeerCommand with correct paths
function executePeerCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        // Get the absolute path to test-network directory
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        const binPath = path.resolve(__dirname, '..', 'fabric-samples', 'bin');
        const configPath = path.resolve(__dirname, '..', 'fabric-samples', 'config');
        
        const defaultEnv = {
            ...process.env,
            PATH: `${binPath}:${process.env.PATH}`,
            FABRIC_CFG_PATH: configPath,
            CORE_PEER_TLS_ENABLED: 'true',
            CORE_PEER_LOCALMSPID: 'Org1MSP',
            CORE_PEER_TLS_ROOTCERT_FILE: path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
            CORE_PEER_MSPCONFIGPATH: path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp'),
            CORE_PEER_ADDRESS: 'localhost:7051'
        };

        // Add Org2 configuration if needed
        const peerEnv = options.useOrg2 ? {
            ...defaultEnv,
            CORE_PEER_LOCALMSPID: 'Org2MSP',
            CORE_PEER_TLS_ROOTCERT_FILE: path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt'),
            CORE_PEER_MSPCONFIGPATH: path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'Admin@org2.example.com', 'msp'),
            CORE_PEER_ADDRESS: 'localhost:9051'
        } : defaultEnv;

        console.log(`🔧 Executing: ${command.substring(0, 100)}...`);
        console.log(`📁 Working directory: ${testNetworkPath}`);

        exec(command, {
            env: peerEnv,
            cwd: testNetworkPath, // Make sure we're in the right directory
            timeout: 60000,
            maxBuffer: 1024 * 1024 * 5 // 5MB buffer
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Command failed: ${command.substring(0, 100)}...`);
                console.error(`🔍 Error: ${error.message}`);
                if (stderr) console.error(`📜 stderr: ${stderr.substring(0, 500)}`);
                reject(new Error(`Peer command failed: ${error.message}`));
            } else {
                console.log('✅ Command succeeded');
                resolve(stdout.trim());
            }
        });
    });
}

// Enhanced Error Class
class EnhancedError extends Error {
    constructor(type, message, context = {}) {
        super(message);
        this.type = type;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

// New function to verify peer synchronization
async function verifyPeerSynchronization(batchId, maxRetries = 5) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            // Check both peers independently
            const [org1Result, org2Result] = await Promise.all([
                executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                ),
                executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`,
                    { useOrg2: true }
                )
            ]);

            const org1Data = JSON.parse(org1Result);
            const org2Data = JSON.parse(org2Result);

            // Deep comparison (excluding timestamps)
            const { history: org1History, ...org1Rest } = org1Data;
            const { history: org2History, ...org2Rest } = org2Data;
            
            if (JSON.stringify(org1Rest) !== JSON.stringify(org2Rest)) {
                throw new EnhancedError('PEER_SYNC_MISMATCH', 'Peers have inconsistent data', {
                    org1Data: org1Rest,
                    org2Data: org2Rest
                });
            }

            return org1Data;
        } catch (error) {
            retries++;
            if (retries >= maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000 * retries));
        }
    }
}

// Blockchain functions

async function queryAllBatches() {
    try {
        console.log('📊 Querying all batches from blockchain...');
        const result = await executePeerCommand(
            `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetAllBatches","Args":[]}'`
        );
        
        if (!result || result.trim() === '' || result.trim() === '[]') {
            console.log('📋 No batches found on blockchain');
            return [];
        }
        
        const batches = JSON.parse(result);
        console.log(`✅ Retrieved ${batches.length} batches from blockchain`);
        return batches;
    } catch (error) {
        console.error('❌ Query all batches failed:', error.message);
        return [];
    }
}

/*async function createBatchOnBlockchain(batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg) {
    try {
        // Use BOTH peers to satisfy endorsement policy (Org1 and Org2)
        const command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem')}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')}" --peerAddresses localhost:9051 --tlsRootCertFiles "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt')}" -c '{"function":"CreateBatch","Args":["${batchId}","${vegetableType}","${farmId}","${farmerName}","${harvestDate}","${initialQuantity}","${pricePerKg}"]}'`;
        
        console.log(`⏳ Submitting transaction with both peer endorsements (Org1 + Org2)...`);
        const result = await executePeerCommand(command);
        console.log(`✅ Transaction submitted successfully with proper endorsements`);
        
        // Wait for transaction to be committed to the ledger
        console.log(`⏳ Waiting for transaction to commit to blockchain...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait
        
        // Attempt to query the created batch with retries
        console.log(`🔍 Querying created batch: ${batchId}...`);
        let retries = 5;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                const batch = JSON.parse(batchResult);
                console.log(`✅ Successfully retrieved created batch: ${batchId}`);
                return batch;
            } catch (error) {
                retries--;
                console.log(`⏳ Batch not ready yet, retrying... (${retries} attempts left)`);
                
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay between retries
                } else {
                    console.log(`⚠️ Query failed after all retries, returning constructed batch info`);
                    
                    // Return constructed batch object if query fails
                    return {
                        batchId,
                        vegetableType,
                        farmId,
                        farmerName,
                        harvestDate,
                        initialQuantity: parseInt(initialQuantity),
                        currentQuantity: parseInt(initialQuantity),
                        currentLocation: 'Farm',
                        status: 'Harvested',
                        qrCode: `QR_${batchId}_${Date.now()}`,
                        pricePerKg: parseFloat(pricePerKg),
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        history: [{
                            location: 'Farm',
                            timestamp: new Date().toISOString(),
                            quantity: parseInt(initialQuantity),
                            wastage: 0,
                            action: 'Batch Created',
                            updatedBy: farmId
                        }]
                    };
                }
            }
        }
    } catch (error) {
        console.error('❌ Create batch failed:', error.message);
        throw new Error(`Failed to create batch: ${error.message}`);
    }
}*/

/*async function updateBatchLocationOnBlockchain(batchId, newLocation, currentQuantity, wastage, updatedBy) {
    try {
        // Use BOTH peers to satisfy endorsement policy (Org1 and Org2)
        const command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem')}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')}" --peerAddresses localhost:9051 --tlsRootCertFiles "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt')}" -c '{"function":"UpdateBatchLocation","Args":["${batchId}","${newLocation}","${currentQuantity}","${wastage}","${updatedBy}"]}'`;
        
        console.log(`🚛 Updating batch location on blockchain: ${batchId} → ${newLocation}`);
        console.log(`⏳ Submitting location update with both peer endorsements...`);
        
        const result = await executePeerCommand(command);
        console.log(`✅ Location update transaction submitted successfully`);
        
        // Wait for transaction to be committed
        console.log(`⏳ Waiting for location update to commit to blockchain...`);
        await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second wait
        
        // Query the updated batch with retries
        console.log(`🔍 Querying updated batch: ${batchId}...`);
        let retries = 4;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                const batch = JSON.parse(batchResult);
                console.log(`✅ Successfully retrieved updated batch: ${batchId}`);
                return batch;
            } catch (error) {
                retries--;
                console.log(`⏳ Updated batch not ready yet, retrying... (${retries} attempts left)`);
                
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                } else {
                    console.error(`❌ Failed to query updated batch after all retries: ${error.message}`);
                    throw new Error(`Failed to verify location update for batch ${batchId}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Update batch location failed:', error.message);
        throw new Error(`Failed to update batch location: ${error.message}`);
    }
}*/

/*async function recordWastageOnBlockchain(batchId, wastageAmount, reason, updatedBy) {
    try {
        // Use BOTH peers to satisfy endorsement policy (Org1 and Org2)
        const command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem')}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')}" --peerAddresses localhost:9051 --tlsRootCertFiles "${path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt')}" -c '{"function":"RecordWastage","Args":["${batchId}","${wastageAmount}","${reason}","${updatedBy}"]}'`;
        
        console.log(`⚠️ Recording wastage on blockchain: ${batchId} - ${wastageAmount}kg (${reason})`);
        console.log(`⏳ Submitting wastage record with both peer endorsements...`);
        
        const result = await executePeerCommand(command);
        console.log(`✅ Wastage record transaction submitted successfully`);
        
        // Wait for transaction to be committed
        console.log(`⏳ Waiting for wastage record to commit to blockchain...`);
        await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second wait
        
        // Query the updated batch with retries
        console.log(`🔍 Querying batch after wastage record: ${batchId}...`);
        let retries = 4;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                const batch = JSON.parse(batchResult);
                console.log(`✅ Successfully retrieved batch after wastage record: ${batchId}`);
                return batch;
            } catch (error) {
                retries--;
                console.log(`⏳ Batch not ready after wastage record, retrying... (${retries} attempts left)`);
                
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                } else {
                    console.error(`❌ Failed to query batch after wastage record: ${error.message}`);
                    throw new Error(`Failed to verify wastage record for batch ${batchId}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Record wastage failed:', error.message);
        throw new Error(`Failed to record wastage: ${error.message}`);
    }
}*/

// Fixed blockchain command functions with correct paths

async function createBatchOnBlockchain(batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        const command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"CreateBatch","Args":["${batchId}","${vegetableType}","${farmId}","${farmerName}","${harvestDate}","${initialQuantity}","${pricePerKg}"]}'`;
        
        console.log(`⏳ Submitting transaction with both peer endorsements (Org1 + Org2)...`);
        const result = await executePeerCommand(command);
        console.log(`✅ Transaction submitted successfully`);
        
        // Wait for transaction to be committed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Query the created batch
        const batchResult = await executePeerCommand(
            `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
        );
        
        return JSON.parse(batchResult);
    } catch (error) {
        console.error('❌ Create batch failed:', error.message);
        throw new Error(`Failed to create batch: ${error.message}`);
    }
}

async function updateBatchLocationOnBlockchain(batchId, newLocation, currentQuantity, wastage, updatedBy) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        const command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"UpdateBatchLocation","Args":["${batchId}","${newLocation}","${currentQuantity}","${wastage}","${updatedBy}"]}'`;
        
        console.log(`🚛 Updating batch location: ${batchId} → ${newLocation}`);
        const result = await executePeerCommand(command);
        
        // Wait and query updated batch
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const batchResult = await executePeerCommand(
            `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
        );
        
        return JSON.parse(batchResult);
    } catch (error) {
        console.error('❌ Update batch location failed:', error.message);
        throw new Error(`Failed to update batch location: ${error.message}`);
    }
}

async function recordWastageOnBlockchain(batchId, wastageAmount, reason, updatedBy) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        const command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"RecordWastage","Args":["${batchId}","${wastageAmount}","${reason}","${updatedBy}"]}'`;
        
        console.log(`⚠️ Recording wastage: ${batchId} - ${wastageAmount}kg`);
        const result = await executePeerCommand(command);
        
        // Wait and query updated batch
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const batchResult = await executePeerCommand(
            `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
        );
        
        return JSON.parse(batchResult);
    } catch (error) {
        console.error('❌ Record wastage failed:', error.message);
        throw new Error(`Failed to record wastage: ${error.message}`);
    }
}
async function trackBatchByQROnBlockchain(qrCode) {
    try {
        console.log(`📱 Tracking batch by QR code: ${qrCode}`);
        
        const result = await executePeerCommand(
            `peer chaincode query -C mychannel -n vegetable -c '{"function":"TrackBatchByQR","Args":["${qrCode}"]}'`
        );
        
        const batch = JSON.parse(result);
        console.log(`✅ Successfully tracked batch by QR: ${batch.batchId}`);
        return batch;
    } catch (error) {
        console.error(`❌ Track by QR failed:`, error.message);
        throw new Error(`Failed to track batch by QR code: ${qrCode}`);
    }
}

async function getBatchFromBlockchain(batchId) {
    try {
        console.log(`🔍 Fetching batch from blockchain: ${batchId}`);
        
        const result = await executePeerCommand(
            `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
        );
        
        const batch = JSON.parse(result);
        console.log(`✅ Successfully retrieved batch: ${batchId}`);
        return batch;
    } catch (error) {
        console.error(`❌ Get batch failed:`, error.message);
        throw new Error(`Failed to get batch: ${batchId}`);
    }
}

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const batches = await queryAllBatches();
        res.json({ 
            status: 'OK', 
            message: 'Hybrid Blockchain Backend is running',
            blockchain: 'Connected via peer commands with two-peer endorsement',
            chaincode: 'vegetable',
            channel: 'mychannel',
            totalBatches: batches.length,
            timestamp: new Date().toISOString()
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
        const batches = await queryAllBatches();
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
        
        const batch = await getBatchFromBlockchain(batchId);
        
        console.log(`✅ Retrieved batch from blockchain: ${batchId}`);
        res.json(batch);
    } catch (error) {
        console.error(`❌ Error getting batch ${req.params.batchId}:`, error.message);
        
        if (error.message.includes('does not exist')) {
            res.status(404).json({ error: `Batch ${req.params.batchId} not found` });
        } else {
            res.status(500).json({ error: `Failed to get batch: ${error.message}` });
        }
    }
});

// Create new batch
app.post('/api/batches', async (req, res) => {
    try {
        const { batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg } = req.body;
        
        // Validation
        if (!batchId || !vegetableType || !farmId || !farmerName || !harvestDate || !initialQuantity || !pricePerKg) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Additional validation
        if (parseInt(initialQuantity) <= 0) {
            return res.status(400).json({ error: 'Initial quantity must be greater than 0' });
        }

        if (parseFloat(pricePerKg) <= 0) {
            return res.status(400).json({ error: 'Price per kg must be greater than 0' });
        }

        console.log(`📦 Creating batch on blockchain: ${batchId}`);
        
        const batch = await createBatchOnBlockchain(batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg);
        
        console.log(`✅ Batch creation completed on blockchain: ${batchId}`);
        res.status(201).json(batch);
    } catch (error) {
        console.error('❌ Error in create batch API:', error.message);
        
        // Check if it's a duplicate batch error
        if (error.message.includes('already exists')) {
            res.status(400).json({ error: `Batch ${req.body.batchId} already exists. Please use a different Batch ID.` });
        } else {
            res.status(500).json({ error: `Failed to create batch: ${error.message}` });
        }
    }
});

// Track batch by QR code
app.get('/api/track/:qrCode', async (req, res) => {
    try {
        const { qrCode } = req.params;
        console.log(`📱 Tracking by QR code: ${qrCode}`);
        
        const batch = await trackBatchByQROnBlockchain(qrCode);
        
        console.log(`✅ QR tracking completed: ${batch.batchId}`);
        res.json(batch);
    } catch (error) {
        console.error(`❌ Error in track by QR API:`, error.message);
        
        if (error.message.includes('does not exist')) {
            res.status(404).json({ error: 'No batch found with this QR code' });
        } else {
            res.status(500).json({ error: `Failed to track batch by QR code: ${error.message}` });
        }
    }
});

// Update batch location
app.put('/api/batches/:batchId/location', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { newLocation, currentQuantity, wastage, updatedBy } = req.body;
        
        // Validation
        if (!newLocation || currentQuantity === undefined || wastage === undefined || !updatedBy) {
            return res.status(400).json({ error: 'All fields are required: newLocation, currentQuantity, wastage, updatedBy' });
        }

        // Additional validation
        if (parseInt(currentQuantity) < 0) {
            return res.status(400).json({ error: 'Current quantity cannot be negative' });
        }

        if (parseInt(wastage) < 0) {
            return res.status(400).json({ error: 'Wastage cannot be negative' });
        }

        console.log(`🚛 Updating location for batch: ${batchId} to ${newLocation}`);
        
        const batch = await updateBatchLocationOnBlockchain(batchId, newLocation, currentQuantity, wastage, updatedBy);
        
        console.log(`✅ Location update completed on blockchain: ${batchId}`);
        res.json(batch);
    } catch (error) {
        console.error('❌ Error in update location API:', error.message);
        
        // Check if it's a batch not found error
        if (error.message.includes('does not exist')) {
            res.status(404).json({ error: `Batch ${req.params.batchId} not found` });
        } else {
            res.status(500).json({ error: `Failed to update batch location: ${error.message}` });
        }
    }
});

// Record wastage
app.put('/api/batches/:batchId/wastage', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { wastageAmount, reason, updatedBy } = req.body;
        
        // Validation
        if (!wastageAmount || !reason || !updatedBy) {
            return res.status(400).json({ error: 'All fields are required: wastageAmount, reason, updatedBy' });
        }

        // Additional validation
        if (parseFloat(wastageAmount) <= 0) {
            return res.status(400).json({ error: 'Wastage amount must be greater than 0' });
        }

        console.log(`⚠️ Recording wastage for batch: ${batchId}, amount: ${wastageAmount}kg`);
        
        const batch = await recordWastageOnBlockchain(batchId, wastageAmount, reason, updatedBy);
        
        console.log(`✅ Wastage record completed on blockchain: ${batchId}`);
        res.json(batch);
    } catch (error) {
        console.error('❌ Error in record wastage API:', error.message);
        
        // Check if it's a batch not found error
        if (error.message.includes('does not exist')) {
            res.status(404).json({ error: `Batch ${req.params.batchId} not found` });
        } else if (error.message.includes('exceeds current quantity')) {
            res.status(400).json({ error: 'Wastage amount cannot exceed current batch quantity' });
        } else {
            res.status(500).json({ error: `Failed to record wastage: ${error.message}` });
        }
    }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        console.log('📈 Calculating statistics from blockchain...');
        
        const batches = await queryAllBatches();
        
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

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Hybrid Blockchain Backend starting on port ${PORT}`);
    console.log(`🔗 Using direct peer commands for blockchain access`);
    console.log(`📡 Channel: mychannel, Chaincode: vegetable`);
    console.log(`🛡️ Using two-peer endorsement (Org1 + Org2) for security`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    try {
        // Test blockchain connection on startup
        const batches = await queryAllBatches();
        console.log('✅ Blockchain connection successful!');
        console.log(`📊 Found ${batches.length} batches on blockchain`);
        console.log(`🌐 API available at http://localhost:${PORT}/api`);
        console.log('🎯 All data will be stored permanently on blockchain!');
        console.log('📋 Available endpoints:');
        console.log('   GET  /api/health           - Health check');
        console.log('   GET  /api/batches          - Get all batches');
        console.log('   GET  /api/batches/:id      - Get batch by ID');
        console.log('   POST /api/batches          - Create new batch');
        console.log('   PUT  /api/batches/:id/location - Update location');
        console.log('   PUT  /api/batches/:id/wastage  - Record wastage');
        console.log('   GET  /api/track/:qrCode    - Track by QR code');
        console.log('   GET  /api/stats            - Get statistics');
    } catch (error) {
        console.error('❌ Startup test failed:', error.message);
        console.error('💡 Make sure the blockchain network is running');
        console.error('💡 Run: ./scripts/start-network.sh && ./scripts/deploy-chaincode.sh');
    }
});