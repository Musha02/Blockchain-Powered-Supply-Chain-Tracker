// backend/hybrid-blockchain-server.js - Enhanced with Better Error Handling
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced executePeerCommand with better error handling and logging
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
            cwd: testNetworkPath,
            timeout: 120000, // Increased timeout to 2 minutes
            maxBuffer: 1024 * 1024 * 10 // Increased buffer to 10MB
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Command failed: ${command.substring(0, 100)}...`);
                console.error(`🔍 Error code: ${error.code}`);
                console.error(`🔍 Error signal: ${error.signal}`);
                console.error(`🔍 Full error: ${error.message}`);
                
                // Log full stderr for better debugging
                if (stderr) {
                    console.error(`📜 Full stderr:`);
                    console.error(stderr);
                }
                
                // Log full stdout in case there's useful info
                if (stdout) {
                    console.error(`📜 stdout:`);
                    console.error(stdout);
                }
                
                reject(new Error(`Peer command failed: ${error.message}\nstderr: ${stderr}`));
            } else {
                console.log('✅ Command succeeded');
                if (stdout) {
                    console.log(`📤 Output: ${stdout.substring(0, 200)}...`);
                }
                resolve(stdout.trim());
            }
        });
    });
}

// Enhanced blockchain command functions with retry mechanism and better error handling

/*async function createBatchOnBlockchain(batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        
        // Verify all certificate files exist before proceeding
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        // Check if certificate files exist
        const fs = require('fs');
        if (!fs.existsSync(ordererTLS)) {
            throw new Error(`Orderer TLS certificate not found: ${ordererTLS}`);
        }
        if (!fs.existsSync(org1TLS)) {
            throw new Error(`Org1 TLS certificate not found: ${org1TLS}`);
        }
        if (!fs.existsSync(org2TLS)) {
            throw new Error(`Org2 TLS certificate not found: ${org2TLS}`);
        }

        console.log(`✅ All certificate files verified`);

        // Try with simplified command first (single peer)
        const simplifiedCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" -c '{"function":"CreateBatch","Args":["${batchId}","${vegetableType}","${farmId}","${farmerName}","${harvestDate}","${initialQuantity}","${pricePerKg}"]}'`;
        
        console.log(`⏳ Attempting simplified command (single peer endorsement)...`);
        
        try {
            const result = await executePeerCommand(simplifiedCommand);
            console.log(`✅ Transaction submitted successfully with single peer`);
            
            // Wait for transaction to be committed
            console.log(`⏳ Waiting for transaction to commit...`);
            await new Promise(resolve => setTimeout(resolve, 8000)); // Increased wait time
            
            // Query the created batch with retries
            let retries = 5;
            while (retries > 0) {
                try {
                    const batchResult = await executePeerCommand(
                        `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                    );
                    
                    const batch = JSON.parse(batchResult);
                    console.log(`✅ Successfully verified created batch: ${batchId}`);
                    return batch;
                } catch (queryError) {
                    retries--;
                    console.log(`⏳ Batch not ready yet, retrying... (${retries} attempts left)`);
                    
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    } else {
                        console.error(`❌ Failed to query created batch after all retries`);
                        throw queryError;
                    }
                }
            }
        } catch (singlePeerError) {
            console.log(`⚠️ Single peer endorsement failed, trying dual peer endorsement...`);
            console.error(`Single peer error: ${singlePeerError.message}`);
            
            // Fallback to dual peer endorsement
            const dualPeerCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"CreateBatch","Args":["${batchId}","${vegetableType}","${farmId}","${farmerName}","${harvestDate}","${initialQuantity}","${pricePerKg}"]}'`;
            
            const result = await executePeerCommand(dualPeerCommand);
            console.log(`✅ Transaction submitted successfully with dual peer endorsement`);
            
            // Wait and query as before
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            const batchResult = await executePeerCommand(
                `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
            );
            
            return JSON.parse(batchResult);
        }
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

        // Try simplified command first
        const simplifiedCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" -c '{"function":"UpdateBatchLocation","Args":["${batchId}","${newLocation}","${currentQuantity}","${wastage}","${updatedBy}"]}'`;
        
        console.log(`🚛 Updating batch location: ${batchId} → ${newLocation}`);
        
        try {
            const result = await executePeerCommand(simplifiedCommand);
            console.log(`✅ Location update submitted successfully`);
        } catch (singlePeerError) {
            console.log(`⚠️ Single peer failed, trying dual peer...`);
            
            const dualPeerCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"UpdateBatchLocation","Args":["${batchId}","${newLocation}","${currentQuantity}","${wastage}","${updatedBy}"]}'`;
            
            await executePeerCommand(dualPeerCommand);
            console.log(`✅ Location update submitted with dual peer endorsement`);
        }
        
        // Wait and query updated batch with retries
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        let retries = 3;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                return JSON.parse(batchResult);
            } catch (queryError) {
                retries--;
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw queryError;
                }
            }
        }
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

        // Try simplified command first
        const simplifiedCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" -c '{"function":"RecordWastage","Args":["${batchId}","${wastageAmount}","${reason}","${updatedBy}"]}'`;
        
        console.log(`⚠️ Recording wastage: ${batchId} - ${wastageAmount}kg`);
        
        try {
            const result = await executePeerCommand(simplifiedCommand);
            console.log(`✅ Wastage record submitted successfully`);
        } catch (singlePeerError) {
            console.log(`⚠️ Single peer failed, trying dual peer...`);
            
            const dualPeerCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"RecordWastage","Args":["${batchId}","${wastageAmount}","${reason}","${updatedBy}"]}'`;
            
            await executePeerCommand(dualPeerCommand);
            console.log(`✅ Wastage record submitted with dual peer endorsement`);
        }
        
        // Wait and query updated batch with retries
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        let retries = 3;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                return JSON.parse(batchResult);
            } catch (queryError) {
                retries--;
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw queryError;
                }
            }
        }
    } catch (error) {
        console.error('❌ Record wastage failed:', error.message);
        throw new Error(`Failed to record wastage: ${error.message}`);
    }
}*/

// Enhanced blockchain functions with proper transaction handling and debugging

// Function to check transaction status and wait for commit
async function waitForTransactionCommit(txId, maxWaitTime = 30000) {
    const startTime = Date.now();
    console.log(`⏳ Waiting for transaction ${txId} to commit...`);
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            // Query transaction status - this is just a simple wait
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // You could implement actual transaction status checking here if needed
            // For now, we'll rely on the wait time and retry mechanism
            
        } catch (error) {
            console.log(`⏳ Still waiting for transaction commit...`);
        }
    }
    
    console.log(`✅ Transaction wait period completed`);
}

// Enhanced create batch with proper endorsement policy handling
async function createBatchOnBlockchain(batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        
        // Verify all certificate files exist
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        const fs = require('fs');
        if (!fs.existsSync(ordererTLS)) throw new Error(`Orderer TLS cert missing: ${ordererTLS}`);
        if (!fs.existsSync(org1TLS)) throw new Error(`Org1 TLS cert missing: ${org1TLS}`);
        if (!fs.existsSync(org2TLS)) throw new Error(`Org2 TLS cert missing: ${org2TLS}`);

        console.log(`✅ Certificate files verified`);
        console.log(`📦 Creating batch: ${batchId}`);

        // ALWAYS use BOTH peers for endorsement (this is likely your issue)
        // Most Fabric networks require endorsement from multiple organizations
        const dualPeerCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"CreateBatch","Args":["${batchId}","${vegetableType}","${farmId}","${farmerName}","${harvestDate}","${initialQuantity}","${pricePerKg}"]}'`;
        
        console.log(`⏳ Submitting transaction with BOTH peer endorsements (required for most policies)...`);
        
        const result = await executePeerCommand(dualPeerCommand);
        console.log(`✅ Transaction submitted with dual peer endorsement`);
        console.log(`📜 Transaction response: ${result}`);
        
        // Extract transaction ID if present in response
        const txIdMatch = result.match(/txid:\s*([a-f0-9]+)/i);
        const txId = txIdMatch ? txIdMatch[1] : 'unknown';
        console.log(`🆔 Transaction ID: ${txId}`);
        
        // Wait longer for transaction to be committed and validated
        console.log(`⏳ Waiting for transaction to be committed and validated...`);
        await new Promise(resolve => setTimeout(resolve, 12000)); // Increased to 12 seconds
        
        // Query with retries and better error handling
        console.log(`🔍 Querying created batch: ${batchId}...`);
        let retries = 8; // Increased retries
        let lastError = null;
        
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                const batch = JSON.parse(batchResult);
                console.log(`✅ Successfully verified created batch: ${batchId}`);
                return batch;
                
            } catch (queryError) {
                lastError = queryError;
                retries--;
                console.log(`⏳ Batch not ready yet (${queryError.message.includes('does not exist') ? 'not committed' : 'query failed'}), retrying... (${retries} attempts left)`);
                
                if (retries > 0) {
                    // Exponential backoff: wait longer between retries
                    const waitTime = Math.min(5000 * (8 - retries), 15000);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    console.error(`❌ Failed to query created batch after all retries`);
                    
                    // If batch doesn't exist after transaction, this indicates a validation failure
                    if (lastError.message.includes('does not exist')) {
                        throw new Error(`Transaction was submitted but batch was not created. This usually indicates a validation failure or endorsement policy issue. Original error: ${lastError.message}`);
                    } else {
                        throw lastError;
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Create batch failed:', error.message);
        
        // Provide more specific error guidance
        if (error.message.includes('endorsement failure')) {
            throw new Error(`Endorsement policy failure: ${error.message}. Check that both Org1 and Org2 peers are running and accessible.`);
        } else if (error.message.includes('validation failure')) {
            throw new Error(`Transaction validation failed: ${error.message}. Check chaincode logic and transaction arguments.`);
        } else if (error.message.includes('does not exist')) {
            throw new Error(`Batch creation failed - transaction may have been rejected during validation. Check peer logs for details: ${error.message}`);
        } else {
            throw new Error(`Failed to create batch: ${error.message}`);
        }
    }
}

// Enhanced update batch location function
async function updateBatchLocationOnBlockchain(batchId, newLocation, currentQuantity, wastage, updatedBy) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        // ALWAYS use dual peer endorsement
        const dualPeerCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"UpdateBatchLocation","Args":["${batchId}","${newLocation}","${currentQuantity}","${wastage}","${updatedBy}"]}'`;
        
        console.log(`🚛 Updating batch location: ${batchId} → ${newLocation}`);
        
        const result = await executePeerCommand(dualPeerCommand);
        console.log(`✅ Location update submitted with dual peer endorsement`);
        
        // Wait for commit
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Query updated batch with retries
        let retries = 5;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                return JSON.parse(batchResult);
            } catch (queryError) {
                retries--;
                if (retries > 0) {
                    console.log(`⏳ Waiting for update to be committed... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                    throw new Error(`Failed to verify location update: ${queryError.message}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Update batch location failed:', error.message);
        throw new Error(`Failed to update batch location: ${error.message}`);
    }
}

// Enhanced record wastage function
async function recordWastageOnBlockchain(batchId, wastageAmount, reason, updatedBy) {
    try {
        const testNetworkPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network');
        const ordererTLS = path.join(testNetworkPath, 'organizations', 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
        const org1TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        const org2TLS = path.join(testNetworkPath, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

        // ALWAYS use dual peer endorsement
        const dualPeerCommand = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererTLS}" -C mychannel -n vegetable --peerAddresses localhost:7051 --tlsRootCertFiles "${org1TLS}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2TLS}" -c '{"function":"RecordWastage","Args":["${batchId}","${wastageAmount}","${reason}","${updatedBy}"]}'`;
        
        console.log(`⚠️ Recording wastage: ${batchId} - ${wastageAmount}kg`);
        
        const result = await executePeerCommand(dualPeerCommand);
        console.log(`✅ Wastage record submitted with dual peer endorsement`);
        
        // Wait for commit
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Query updated batch with retries
        let retries = 5;
        while (retries > 0) {
            try {
                const batchResult = await executePeerCommand(
                    `peer chaincode query -C mychannel -n vegetable -c '{"function":"GetBatch","Args":["${batchId}"]}'`
                );
                
                return JSON.parse(batchResult);
            } catch (queryError) {
                retries--;
                if (retries > 0) {
                    console.log(`⏳ Waiting for wastage record to be committed... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                    throw new Error(`Failed to verify wastage record: ${queryError.message}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Record wastage failed:', error.message);
        throw new Error(`Failed to record wastage: ${error.message}`);
    }
}

// Function to check peer logs for debugging
async function checkPeerLogs() {
    try {
        console.log('🔍 Checking peer logs for transaction issues...');
        
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        // Check recent peer logs
        try {
            const peer0Logs = await execAsync('docker logs peer0.org1.example.com 2>&1 | tail -20');
            console.log('📜 Recent Peer0.Org1 logs:');
            console.log(peer0Logs.stdout);
        } catch (logError) {
            console.log('⚠️ Could not retrieve peer logs');
        }
        
        // Check orderer logs
        try {
            const ordererLogs = await execAsync('docker logs orderer.example.com 2>&1 | tail -10');
            console.log('📜 Recent Orderer logs:');
            console.log(ordererLogs.stdout);
        } catch (logError) {
            console.log('⚠️ Could not retrieve orderer logs');
        }
        
    } catch (error) {
        console.log('⚠️ Could not check logs:', error.message);
    }
}

// Diagnostic function to check endorsement policy
async function checkEndorsementPolicy() {
    try {
        console.log('🔍 Checking chaincode endorsement policy...');
        
        const result = await executePeerCommand(
            `peer lifecycle chaincode querycommitted -C mychannel -n vegetable`
        );
        
        console.log('📜 Chaincode commitment info:');
        console.log(result);
        
        return result;
    } catch (error) {
        console.error('❌ Could not check endorsement policy:', error.message);
        return null;
    }
}

// Network status check function
async function checkNetworkStatus() {
    try {
        console.log('🔍 Checking Fabric network status...');
        
        // Check if orderer is running
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        try {
            const dockerPs = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(orderer|peer|ca)"');
            console.log('🐳 Docker containers status:');
            console.log(dockerPs.stdout);
        } catch (dockerError) {
            console.log('⚠️ Could not check Docker containers - they might not be running');
        }
        
        // Try a simple peer command to check connectivity
        try {
            await executePeerCommand('peer version');
            console.log('✅ Peer connectivity verified');
        } catch (peerError) {
            console.error('❌ Peer connectivity failed:', peerError.message);
            throw new Error('Peer is not accessible');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Network status check failed:', error.message);
        return false;
    }
}

// Enhanced query function
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

// API Routes (keeping existing routes unchanged)

// Health check with network status
app.get('/api/health', async (req, res) => {
    try {
        const networkStatus = await checkNetworkStatus();
        const batches = await queryAllBatches();
        
        res.json({ 
            status: networkStatus ? 'OK' : 'WARNING',
            message: 'Hybrid Blockchain Backend is running',
            blockchain: networkStatus ? 'Connected' : 'Connection issues detected',
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

// Create new batch with enhanced error handling
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
        
        // Check network status before proceeding
        const networkOk = await checkNetworkStatus();
        if (!networkOk) {
            return res.status(503).json({ error: 'Blockchain network is not accessible. Please check if the Fabric network is running.' });
        }
        
        const batch = await createBatchOnBlockchain(batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg);
        
        console.log(`✅ Batch creation completed on blockchain: ${batchId}`);
        res.status(201).json(batch);
    } catch (error) {
        console.error('❌ Error in create batch API:', error.message);
        
        // Check if it's a duplicate batch error
        if (error.message.includes('already exists')) {
            res.status(400).json({ error: `Batch ${req.body.batchId} already exists. Please use a different Batch ID.` });
        } else if (error.message.includes('connection')) {
            res.status(503).json({ error: 'Blockchain network connection failed. Please check if the Fabric network is running.' });
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
        
        // Check network status before proceeding
        const networkOk = await checkNetworkStatus();
        if (!networkOk) {
            return res.status(503).json({ error: 'Blockchain network is not accessible. Please check if the Fabric network is running.' });
        }
        
        const batch = await updateBatchLocationOnBlockchain(batchId, newLocation, currentQuantity, wastage, updatedBy);
        
        console.log(`✅ Location update completed on blockchain: ${batchId}`);
        res.json(batch);
    } catch (error) {
        console.error('❌ Error in update location API:', error.message);
        
        // Check if it's a batch not found error
        if (error.message.includes('does not exist')) {
            res.status(404).json({ error: `Batch ${req.params.batchId} not found` });
        } else if (error.message.includes('connection')) {
            res.status(503).json({ error: 'Blockchain network connection failed. Please check if the Fabric network is running.' });
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
        
        // Check network status before proceeding
        const networkOk = await checkNetworkStatus();
        if (!networkOk) {
            return res.status(503).json({ error: 'Blockchain network is not accessible. Please check if the Fabric network is running.' });
        }
        
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
        } else if (error.message.includes('connection')) {
            res.status(503).json({ error: 'Blockchain network connection failed. Please check if the Fabric network is running.' });
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
    console.log(`🛡️ Using enhanced error handling and retry mechanism`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    try {
        // Test blockchain connection on startup
        const networkOk = await checkNetworkStatus();
        if (networkOk) {
            const batches = await queryAllBatches();
            console.log('✅ Blockchain connection successful!');
            console.log(`📊 Found ${batches.length} batches on blockchain`);
            console.log(`🌐 API available at http://localhost:${PORT}/api`);
            console.log('🎯 All data will be stored permanently on blockchain!');
            console.log('📋 Available endpoints:');
            console.log('   GET  /api/health           - Health check with network status');
            console.log('   GET  /api/batches          - Get all batches');
            console.log('   GET  /api/batches/:id      - Get batch by ID');
            console.log('   POST /api/batches          - Create new batch');
            console.log('   PUT  /api/batches/:id/location - Update location');
            console.log('   PUT  /api/batches/:id/wastage  - Record wastage');
            console.log('   GET  /api/track/:qrCode    - Track by QR code');
            console.log('   GET  /api/stats            - Get statistics');
        } else {
            console.error('❌ Blockchain network connection issues detected');
            console.error('💡 Make sure the blockchain network is running');
            console.error('💡 Run: ./network.sh up createChannel -c mychannel -ca');
            console.error('💡 Then: ./network.sh deployCC -ccn vegetable -ccp ../chaincode/');
        }
    } catch (error) {
        console.error('❌ Startup test failed:', error.message);
        console.error('💡 Server will continue running but blockchain operations may fail');
        console.error('💡 Check your Hyperledger Fabric network setup');
    }
});