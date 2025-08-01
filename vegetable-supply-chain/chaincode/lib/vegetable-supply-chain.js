'use strict';

const { Contract } = require('fabric-contract-api');

class VegetableSupplyChain extends Contract {

    // Initialize the ledger with some sample data
    async InitLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        const batches = [
            {
                batchId: 'BATCH001',
                vegetableType: 'Tomato',
                farmId: 'FARM001',
                farmerName: 'John Doe',
                harvestDate: '2025-07-31',
                initialQuantity: 100,
                currentQuantity: 100,
                currentLocation: 'Farm',
                status: 'Harvested',
                qrCode: 'QR_BATCH001_1721148000000',
                pricePerKg: 80,
                createdAt: new Date().toISOString(),
                history: [
                    {
                        location: 'Farm',
                        timestamp: new Date().toISOString(),
                        quantity: 100,
                        wastage: 0,
                        action: 'Batch Created',
                        updatedBy: 'FARM001'
                    }
                ]
            },
            {
                batchId: 'BATCH002',
                vegetableType: 'Carrot',
                farmId: 'FARM002',
                farmerName: 'David',
                harvestDate: '2025-07-31',
                initialQuantity: 80,
                currentQuantity: 80,
                currentLocation: 'Farm',
                status: 'Harvested',
                qrCode: 'QR_BATCH002_1721148000000',
                pricePerKg: 120,
                createdAt: new Date().toISOString(),
                history: [
                    {
                        location: 'Farm',
                        timestamp: new Date().toISOString(),
                        quantity: 80,
                        wastage: 0,
                        action: 'Batch Created',
                        updatedBy: 'FARM002'
                    }
                ]
            },
            {
                batchId: 'BATCH003',
                vegetableType: 'Onion',
                farmId: 'FARM003',
                farmerName: 'Ahamed',
                harvestDate: '2025-07-31',
                initialQuantity: 100,
                currentQuantity: 98,
                currentLocation: 'Warehouse',
                status: 'Location Updated',
                qrCode: 'QR_BATCH003_1721148000000',
                pricePerKg: 100,
                createdAt: new Date().toISOString(),
                history: [
                    {
                        location: 'Warehouse',
                        timestamp: new Date().toISOString(),
                        quantity: 98,
                        wastage: 2,
                        action: 'In Transit to Warehouse',
                        updatedBy: 'FARM003'
                    }
                ]
            }
        ];

        for (const batch of batches) {
            await ctx.stub.putState(batch.batchId, Buffer.from(JSON.stringify(batch)));
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }


    // Create a new vegetable batch
    async CreateBatch(ctx, batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg) {
        console.info('============= START : Create Batch ===========');
        
        const exists = await this.BatchExists(ctx, batchId);
        if (exists) {
            throw new Error(`The batch ${batchId} already exists`);
        }

        // Generate QR code identifier
        const qrCode = `QR_${batchId}_${Date.now()}`;
        
        const batch = {
            batchId,
            vegetableType,
            farmId,
            farmerName,
            harvestDate,
            initialQuantity: parseInt(initialQuantity),
            currentQuantity: parseInt(initialQuantity),
            currentLocation: 'Farm',
            status: 'Harvested',
            qrCode,
            pricePerKg: parseFloat(pricePerKg),
            createdAt: new Date().toISOString(),
            history: [
                {
                    location: 'Farm',
                    timestamp: new Date().toISOString(),
                    quantity: parseInt(initialQuantity),
                    wastage: 0,
                    action: 'Batch Created',
                    updatedBy: farmId
                }
            ]
        };

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        
        console.info('============= END : Create Batch ===========');
        return JSON.stringify(batch);
    }

    // Update batch location and quantities
    async UpdateBatchLocation(ctx, batchId, newLocation, currentQuantity, wastage, updatedBy) {
        console.info('============= START : Update Batch Location ===========');
        
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`The batch ${batchId} does not exist`);
        }
        
        const batch = JSON.parse(batchBytes.toString());
        
        // Validate quantities
        const newQuantity = parseInt(currentQuantity);
        const wastedAmount = parseInt(wastage);
        
        if (newQuantity + wastedAmount > batch.currentQuantity) {
            throw new Error('Total quantity and wastage cannot exceed current quantity');
        }

        // Update batch details
        batch.currentLocation = newLocation;
        batch.currentQuantity = newQuantity;
        
        // Update status based on location
        if (newLocation === 'Warehouse') {
            batch.status = 'In Transit to Warehouse';
        } else if (newLocation === 'Retailer') {
            batch.status = 'At Retailer';
        } else if (newLocation === 'Shop') {
            batch.status = 'At Shop';
        }

        // Add to history
        const historyEntry = {
            location: newLocation,
            timestamp: new Date().toISOString(),
            quantity: newQuantity,
            wastage: wastedAmount,
            action: `Moved to ${newLocation}`,
            updatedBy: updatedBy
        };
        
        batch.history.push(historyEntry);
        batch.lastUpdated = new Date().toISOString();

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        
        console.info('============= END : Update Batch Location ===========');
        return JSON.stringify(batch);
    }

    // Get batch details
    async GetBatch(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`The batch ${batchId} does not exist`);
        }
        return batchBytes.toString();
    }

    // Get all batches
    async GetAllBatches(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // Track batch by QR code
    async TrackBatchByQR(ctx, qrCode) {
        const queryString = {
            selector: {
                qrCode: qrCode
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const result = await iterator.next();
        
        if (result.done) {
            throw new Error(`No batch found with QR code ${qrCode}`);
        }
        
        const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
        return strValue;
    }

    // Check if batch exists
    async BatchExists(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        return batchBytes && batchBytes.length > 0;
    }

    // Get batch history
    async GetBatchHistory(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`The batch ${batchId} does not exist`);
        }
        
        const batch = JSON.parse(batchBytes.toString());
        return JSON.stringify(batch.history);
    }

    // Update wastage only
    async RecordWastage(ctx, batchId, wastageAmount, reason, updatedBy) {
        console.info('============= START : Record Wastage ===========');
        
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`The batch ${batchId} does not exist`);
        }
        
        const batch = JSON.parse(batchBytes.toString());
        const wastage = parseInt(wastageAmount);
        
        if (wastage > batch.currentQuantity) {
            throw new Error('Wastage amount cannot exceed current quantity');
        }
        
        batch.currentQuantity -= wastage;
        
        const historyEntry = {
            location: batch.currentLocation,
            timestamp: new Date().toISOString(),
            quantity: batch.currentQuantity,
            wastage: wastage,
            action: `Wastage recorded: ${reason}`,
            updatedBy: updatedBy
        };
        
        batch.history.push(historyEntry);
        batch.lastUpdated = new Date().toISOString();

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        
        console.info('============= END : Record Wastage ===========');
        return JSON.stringify(batch);
    }
}

module.exports = VegetableSupplyChain;1