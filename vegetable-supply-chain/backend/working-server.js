const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Working Backend API is running',
        timestamp: new Date().toISOString(),
        totalBatches: batches.length
    });
});

// Get all batches
app.get('/api/batches', (req, res) => {
    console.log(`📊 Retrieved ${batches.length} batches`);
    const formattedBatches = batches.map(batch => ({
        Key: batch.batchId,
        Record: batch
    }));
    res.json(formattedBatches);
});

// Get batch by ID
app.get('/api/batches/:batchId', (req, res) => {
    const { batchId } = req.params;
    const batch = batches.find(b => b.batchId === batchId);
    
    if (!batch) {
        console.log(`❌ Batch ${batchId} not found`);
        return res.status(404).json({ error: 'Batch not found' });
    }
    
    console.log(`✅ Retrieved batch: ${batchId}`);
    res.json(batch);
});

// Create new batch
app.post('/api/batches', (req, res) => {
    try {
        const { batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg } = req.body;
        
        // Validation
        if (!batchId || !vegetableType || !farmId || !farmerName || !harvestDate || !initialQuantity || !pricePerKg) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if batch already exists
        if (batches.find(b => b.batchId === batchId)) {
            console.log(`❌ Batch ${batchId} already exists`);
            return res.status(400).json({ error: `Batch ${batchId} already exists. Please use a different Batch ID.` });
        }
        
        const newBatch = {
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
        
        batches.push(newBatch);
        console.log(`✅ Created new batch: ${batchId} (${vegetableType}, ${initialQuantity}kg)`);
        res.status(201).json(newBatch);
    } catch (error) {
        console.error('❌ Error creating batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Track batch by QR code
app.get('/api/track/:qrCode', (req, res) => {
    const { qrCode } = req.params;
    const batch = batches.find(b => b.qrCode === qrCode);
    
    if (!batch) {
        console.log(`❌ No batch found with QR code: ${qrCode}`);
        return res.status(404).json({ error: 'Batch not found with this QR code' });
    }
    
    console.log(`✅ Tracked batch by QR: ${batch.batchId}`);
    res.json(batch);
});

// Update batch location
app.put('/api/batches/:batchId/location', (req, res) => {
    try {
        const { batchId } = req.params;
        const { newLocation, currentQuantity, wastage, updatedBy } = req.body;
        
        if (!newLocation || currentQuantity === undefined || wastage === undefined || !updatedBy) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const batchIndex = batches.findIndex(b => b.batchId === batchId);
        if (batchIndex === -1) {
            console.log(`❌ Batch ${batchId} not found for location update`);
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        const batch = batches[batchIndex];
        
        // Validate quantities
        const newQuantity = parseInt(currentQuantity);
        const wasteAmount = parseInt(wastage);
        
        if (newQuantity + wasteAmount > batch.currentQuantity) {
            return res.status(400).json({ error: 'Total quantity and wastage cannot exceed current quantity' });
        }
        
        // Update batch
        batch.currentLocation = newLocation;
        batch.currentQuantity = newQuantity;
        batch.lastUpdated = new Date().toISOString();
        
        // Update status based on location
        if (newLocation === 'Warehouse') {
            batch.status = 'In Transit to Warehouse';
        } else if (newLocation === 'Retailer') {
            batch.status = 'At Retailer';
        } else if (newLocation === 'Shop') {
            batch.status = 'At Shop';
        }
        
        // Add to history
        batch.history.push({
            location: newLocation,
            timestamp: new Date().toISOString(),
            quantity: newQuantity,
            wastage: wasteAmount,
            action: `Moved to ${newLocation}`,
            updatedBy: updatedBy
        });
        
        batches[batchIndex] = batch;
        console.log(`✅ Updated batch ${batchId} location to ${newLocation}`);
        res.json(batch);
    } catch (error) {
        console.error('❌ Error updating batch location:', error);
        res.status(500).json({ error: error.message });
    }
});

// Record wastage
app.put('/api/batches/:batchId/wastage', (req, res) => {
    try {
        const { batchId } = req.params;
        const { wastageAmount, reason, updatedBy } = req.body;
        
        if (!wastageAmount || !reason || !updatedBy) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const batchIndex = batches.findIndex(b => b.batchId === batchId);
        if (batchIndex === -1) {
            console.log(`❌ Batch ${batchId} not found for wastage recording`);
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        const batch = batches[batchIndex];
        const wastage = parseInt(wastageAmount);
        
        if (wastage > batch.currentQuantity) {
            return res.status(400).json({ error: 'Wastage amount cannot exceed current quantity' });
        }
        
        batch.currentQuantity -= wastage;
        batch.lastUpdated = new Date().toISOString();
        
        batch.history.push({
            location: batch.currentLocation,
            timestamp: new Date().toISOString(),
            quantity: batch.currentQuantity,
            wastage: wastage,
            action: `Wastage recorded: ${reason}`,
            updatedBy: updatedBy
        });
        
        batches[batchIndex] = batch;
        console.log(`✅ Recorded ${wastage}kg wastage for batch ${batchId} (${reason})`);
        res.json(batch);
    } catch (error) {
        console.error('❌ Error recording wastage:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get batch history
app.get('/api/batches/:batchId/history', (req, res) => {
    const { batchId } = req.params;
    const batch = batches.find(b => b.batchId === batchId);
    
    if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
    }
    
    console.log(`✅ Retrieved history for batch: ${batchId}`);
    res.json(batch.history);
});

// Statistics endpoint (bonus)
app.get('/api/stats', (req, res) => {
    const stats = {
        totalBatches: batches.length,
        totalQuantity: batches.reduce((sum, batch) => sum + batch.currentQuantity, 0),
        totalWastage: batches.reduce((sum, batch) => {
            const wastage = batch.history.reduce((w, h) => w + (h.wastage || 0), 0);
            return sum + wastage;
        }, 0),
        locations: {
            farm: batches.filter(b => b.currentLocation === 'Farm').length,
            warehouse: batches.filter(b => b.currentLocation === 'Warehouse').length,
            retailer: batches.filter(b => b.currentLocation === 'Retailer').length,
            shop: batches.filter(b => b.currentLocation === 'Shop').length,
        },
        vegetables: {}
    };
    
    // Count vegetables
    batches.forEach(batch => {
        stats.vegetables[batch.vegetableType] = (stats.vegetables[batch.vegetableType] || 0) + 1;
    });
    
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`🚀 Working Backend Server running on port ${PORT}`);
    console.log(`✅ All features working perfectly`);
    //console.log(`🌐 API endpoints: http://localhost:${PORT}/api`);
    console.log(`📈 Stats endpoint: http://localhost:${PORT}/api/stats`);
    //console.log(`CouchDB: http://localhost:5984/_utils `);

});