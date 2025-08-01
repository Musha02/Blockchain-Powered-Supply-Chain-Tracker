# 🌱 VeggieChain - AI-Blockchain Supply Chain Management

A complete **AI-powered blockchain supply chain tracking system** for vegetables with QR code generation, real-time analytics, and end-to-end traceability.

## 🚀 Features

### 🔗 **Blockchain Technology**
- **Hyperledger Fabric** blockchain network
- **Smart contracts** for immutable data storage
- **Distributed ledger** with peer consensus
- **Real-time data synchronization**

### 📱 **QR Code Integration**
- **Automatic QR generation** for each batch
- **Print-optimized QR codes** for physical attachment
- **Real-time QR updates** with latest batch information
- **Mobile scanning support**

### 🎯 **Supply Chain Features**
- **End-to-end tracking** from farm to consumer
- **Location updates** through supply chain stages
- **Wastage management** with detailed reasons
- **Complete audit trail** with timestamps

### 📊 **Analytics Dashboard**
- **Real-time statistics** and insights
- **Efficiency scoring** and optimization
- **Location distribution** analytics
- **Vegetable type breakdown**

### 🎨 **Modern UI/UX**
- **Responsive React frontend** with routing
- **Professional design** with Tailwind CSS
- **Gradient animations** and hover effects
- **Mobile-first responsive design**

## 🏗️ Project Structure

```
vegetable-supply-chain/
├── fabric-samples/          # Hyperledger Fabric network
│   ├── bin/                 # Fabric binaries
│   └── test-network/        # Network configuration
├── chaincode/               # Smart contracts
│   ├── lib/                 # Chaincode logic
│   ├── package.json         # Dependencies
│   └── index.js             # Entry point
├── backend/                 # Node.js API server
│   ├── server.js            # Mock backend (development)
│   ├── blockchain-server.js # Real blockchain backend
│   └── package.json         # Dependencies
├── frontend/                # React application
│   ├── src/
│   │   ├── App.js           # Main routing
│   │   └── components/      # React components
│   └── package.json         # Dependencies
├── scripts/                 # Automation scripts
│   ├── start-network.sh     # Start blockchain network
│   ├── deploy-chaincode.sh  # Deploy smart contracts
│   └── test-blockchain.sh   # Test blockchain functionality
└── README.md                # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd vegetable-supply-chain

# Install Hyperledger Fabric
curl -sSL https://bit.ly/2ysbOFE | bash -s

# Install frontend dependencies
cd frontend
npm install react-router-dom react-qr-code
npm install

# Install backend dependencies
cd ../backend
npm install

# Install chaincode dependencies
cd ../chaincode
npm install
```

### 2. Make Scripts Executable
```bash
# Make automation scripts executable
chmod +x scripts/*.sh
chmod +x start-network.sh
chmod +x deploy-chaincode.sh
chmod +x test-blockchain.sh
```

## 🚀 Quick Start

### Option 1: Full Blockchain Setup

#### Step 1: Start Blockchain Network
```bash
# Start Hyperledger Fabric network
./start-network.sh
```

#### Step 2: Deploy Smart Contracts
```bash
# Deploy chaincode to blockchain
./deploy-chaincode.sh
```

#### Step 3: Test Blockchain
```bash
# Test blockchain functionality
./test-blockchain.sh
```

#### Step 4: Start Blockchain Backend
```bash
# Start real blockchain backend
cd backend
node blockchain-server.js
```

#### Step 5: Start Frontend
```bash
# In a new terminal
cd frontend
npm start
```

### Option 2: Development Setup (Mock Backend)

#### Quick Development Start
```bash
# Terminal 1: Start mock backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm start
```

## 📱 Application URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

### Available Routes
- **Home:** `/` - Dashboard and navigation
- **Create:** `/create` - Create new batch with QR
- **Track:** `/track` - Track batch journey
- **View:** `/view` - View all batches
- **Update:** `/update` - Update batch location
- **Wastage:** `/wastage` - Record wastage
- **Analytics:** `/analytics` - Performance insights

## 🔧 API Endpoints

### Batch Management
```
POST   /api/batches              # Create new batch
GET    /api/batches              # Get all batches
GET    /api/batches/:id          # Get batch by ID
PUT    /api/batches/:id/location # Update batch location
PUT    /api/batches/:id/wastage  # Record wastage
```

### Tracking & Analytics
```
GET    /api/track/:qrCode        # Track by QR code
GET    /api/stats                # Get analytics
GET    /api/health               # Health check
```

## 🧪 Testing

### Test Blockchain Connection
```bash
# Test if blockchain is working
./test-blockchain.sh
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Get all batches
curl http://localhost:3001/api/batches

# Create test batch
curl -X POST http://localhost:3001/api/batches \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "TEST001",
    "vegetableType": "Tomato",
    "farmId": "FARM001",
    "farmerName": "Test Farmer",
    "harvestDate": "2024-07-17",
    "initialQuantity": 500,
    "pricePerKg": 75
  }'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Docker Issues
```bash
# Check if Docker is running
docker --version
docker ps

# Restart Docker if needed
sudo systemctl restart docker
```

#### 2. Network Issues
```bash
# Clean up and restart network
cd fabric-samples/test-network
./network.sh down
docker system prune -f
./network.sh up createChannel
```

#### 3. Chaincode Issues
```bash
# Redeploy chaincode
./deploy-chaincode.sh

# Check chaincode status
cd fabric-samples/test-network
peer lifecycle chaincode querycommitted -C mychannel
```

#### 4. Backend Connection Issues
```bash
# Check if network is running
docker ps | grep peer

# Check backend logs
cd backend
node blockchain-server.js
```

### Error Messages

#### "Network not found"
- Run `./start-network.sh` first
- Check Docker containers: `docker ps`

#### "Chaincode not found"
- Run `./deploy-chaincode.sh`
- Verify deployment: `./test-blockchain.sh`

#### "Wallet initialization failed"
- Check file permissions
- Verify network is running
- Check certificate paths

## 🎯 Usage Examples

### Creating a Batch
1. Go to http://localhost:3000/create
2. Fill in batch details
3. Click "Create Batch & Generate QR Code"
4. Print the QR code for physical attachment

### Tracking a Batch
1. Go to http://localhost:3000/track
2. Enter Batch ID or QR Code
3. View complete journey and current status
4. Print updated QR code if needed

### Recording Wastage
1. Go to http://localhost:3000/wastage
2. Enter batch ID and wastage details
3. Select reason for wastage
4. Submit to update blockchain

### Viewing Analytics
1. Go to http://localhost:3000/analytics
2. View real-time statistics
3. Analyze efficiency metrics
4. Monitor location distribution

## 🔒 Security Features

- **Immutable blockchain** records
- **Cryptographic signatures** for all transactions
- **Peer consensus** for data validation
- **TLS encryption** for network communication
- **MSP (Membership Service Provider)** for identity management

## 🌟 Advanced Features

### QR Code Features
- **Level H error correction** for damaged codes
- **JSON data encoding** with complete batch info
- **Real-time updates** when batch changes
- **Print optimization** for physical labels

### Blockchain Features
- **Multi-organization** support (Org1, Org2)
- **Endorsement policies** for transaction validation
- **Event listening** for real-time updates
- **Query optimization** for fast data retrieval

## 📈 Performance Optimization

### Frontend
- **Code splitting** with React Router
- **Lazy loading** for components
- **Optimized bundle** size
- **Responsive design** for all devices

### Backend
- **Connection pooling** for blockchain
- **Efficient queries** with proper indexing
- **Error handling** and retry logic
- **Logging** for debugging

### Blockchain
- **Optimized chaincode** for fast execution
- **Proper state management** in smart contracts
- **Efficient data structures** for storage
- **Query optimization** for analytics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - Initial work - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- **Hyperledger Fabric** for blockchain infrastructure
- **React** for the frontend framework
- **Tailwind CSS** for styling
- **Node.js** for backend development
- **QR Code libraries** for code generation

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: your.email@example.com
- Documentation: [Wiki](https://github.com/yourusername/vegetable-supply-chain/wiki)

---

**🌱 Built with ❤️ for sustainable supply chains and blockchain innovation**