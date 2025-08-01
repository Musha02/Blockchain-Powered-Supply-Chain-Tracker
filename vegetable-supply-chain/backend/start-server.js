const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend server is running' });
});

// Mock endpoints for testing
app.get('/api/batches', (req, res) => {
    res.json([
        {
            Key: 'BATCH001',
            Record: {
                batchId: 'BATCH001',
                vegetableType: 'Tomato',
                farmId: 'FARM001',
                farmerName: 'John Doe',
                harvestDate: '2024-07-16',
                initialQuantity: 1000,
                currentQuantity: 1000,
                currentLocation: 'Farm',
                status: 'Harvested',
                qrCode: 'QR_BATCH001_123456',
                pricePerKg: 50,
                createdAt: new Date().toISOString()
            }
        }
    ]);
});

app.post('/api/batches', (req, res) => {
    const { batchId, vegetableType, farmId, farmerName, harvestDate, initialQuantity, pricePerKg } = req.body;
    
    const batch = {
        batchId,
        vegetableType,
        farmId,
        farmerName,
        harvestDate,
        initialQuantity,
        currentQuantity: initialQuantity,
        currentLocation: 'Farm',
        status: 'Harvested',
        qrCode: `QR_${batchId}_${Date.now()}`,
        pricePerKg,
        createdAt: new Date().toISOString()
    };
    
    res.status(201).json(batch);
});

app.listen(PORT, () => {
    console.log(`Mock server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});