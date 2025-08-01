// src/components/CreateBatch.js
import React, { useState } from 'react';
import { Hash, Package, MapPin, User, Calendar, AlertTriangle, Plus, QrCode, Printer, Copy } from 'lucide-react';
import QRCodeReact from 'react-qr-code';

const API_BASE_URL = 'http://localhost:3001/api';

const CreateBatch = () => {
  const [formData, setFormData] = useState({
    batchId: '',
    vegetableType: '',
    farmId: '',
    farmerName: '',
    harvestDate: '',
    initialQuantity: '',
    pricePerKg: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setFormData({
          batchId: '',
          vegetableType: '',
          farmId: '',
          farmerName: '',
          harvestDate: '',
          initialQuantity: '',
          pricePerKg: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create batch');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">➕ Create New Batch</h2>
        <p className="text-gray-600">Register a new vegetable batch in the supply chain with QR code generation</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                Batch ID *
              </label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="e.g., BATCH001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Vegetable Type *
              </label>
              <select
                name="vegetableType"
                value={formData.vegetableType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">Select vegetable</option>
                <option value="Tomato">🍅 Tomato</option>
                <option value="Carrot">🥕 Carrot</option>
                <option value="Lettuce">🥬 Lettuce</option>
                <option value="Cucumber">🥒 Cucumber</option>
                <option value="Bell Pepper">🫑 Bell Pepper</option>
                <option value="Spinach">🥬 Spinach</option>
                <option value="Broccoli">🥦 Broccoli</option>
                <option value="Onion">🧅 Onion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Farm ID *
              </label>
              <input
                type="text"
                name="farmId"
                value={formData.farmId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="e.g., FARM001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Farmer Name *
              </label>
              <input
                type="text"
                name="farmerName"
                value={formData.farmerName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Harvest Date *
              </label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Initial Quantity (kg) *
              </label>
              <input
                type="number"
                name="initialQuantity"
                value={formData.initialQuantity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="e.g., 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Price per kg (LKR) *
              </label>
              <input
                type="number"
                name="pricePerKg"
                value={formData.pricePerKg}
                onChange={handleChange}
                required
                min="1"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="e.g., 50.00"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {error}
              </p>
            </div>
          )}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Batch...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Batch & Generate QR Code
                </div>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 p-8 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl">
          <h3 className="text-2xl font-bold text-green-800 mb-8 text-center">
            🎉 Batch Created Successfully!
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Batch Details */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                <Package className="h-6 w-6 mr-2" />
                📋 Batch Information
              </h4>
              <div className="bg-white p-6 rounded-xl border border-green-200 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs font-medium">Batch ID</p>
                    <p className="font-bold text-gray-900 text-lg">{result.batchId}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs font-medium">Vegetable</p>
                    <p className="font-bold text-gray-900">{result.vegetableType}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs font-medium">Farmer</p>
                    <p className="font-bold text-gray-900">{result.farmerName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs font-medium">Farm ID</p>
                    <p className="font-bold text-gray-900">{result.farmId}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs font-medium">Quantity</p>
                    <p className="font-bold text-gray-900">{result.initialQuantity} kg</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs font-medium">Price/kg</p>
                    <p className="font-bold text-gray-900">LKR {result.pricePerKg}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-600 text-xs font-medium">Status</p>
                    <p className="font-bold text-green-700">{result.status}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-blue-600 text-xs font-medium">Location</p>
                    <p className="font-bold text-blue-700">{result.currentLocation}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-gray-600 text-sm font-medium mb-2">QR Code ID:</p>
                  <p className="font-mono text-xs bg-gray-100 p-3 rounded-lg break-all">{result.qrCode}</p>
                </div>
              </div>
            </div>

            {/* QR Code for Printing */}
            <div className="flex flex-col items-center">
              <h4 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                <QrCode className="h-6 w-6 mr-2" />
                📱 Printable QR Code
              </h4>
              
              {/* QR Code Container for Printing */}
              <div className="qr-print-area">
                <div className="bg-white p-8 rounded-2xl border-4 border-green-300 shadow-2xl">
                  <QRCodeReact
                    value={JSON.stringify({
                      batchId: result.batchId,
                      qrCode: result.qrCode,
                      vegetableType: result.vegetableType,
                      farmerName: result.farmerName,
                      farmId: result.farmId,
                      harvestDate: result.harvestDate,
                      currentLocation: result.currentLocation,
                      status: result.status,
                      timestamp: new Date().toISOString()
                    })}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="text-center mt-4 print-info">
                    <p className="text-lg font-bold text-gray-800">{result.batchId}</p>
                    <p className="text-sm text-gray-600">{result.vegetableType} - {result.farmerName}</p>
                    <p className="text-xs text-gray-500 mt-2">VeggieChain Supply Tracker</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handlePrintQR}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                >
                  <Printer className="h-5 w-5" />
                  <span>Print QR Code</span>
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.qrCode);
                    alert('QR Code ID copied to clipboard!');
                  }}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                >
                  <Copy className="h-5 w-5" />
                  <span>Copy QR ID</span>
                </button>
                
                {/* <button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      const link = document.createElement('a');
                      link.download = `QR_${result.batchId}.png`;
                      link.href = canvas.toDataURL();
                      link.click();
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                >
                  <Download className="h-5 w-5" />
                  <span>Save PNG</span>
                </button> */}
              </div>
              
              <div className="mt-6 text-center bg-white p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-medium">📋 Print and attach to batch</p>
                <p className="text-xs text-gray-600 mt-1">Scan to track throughout supply chain</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setResult(null)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Create Another Batch
            </button>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.batchId);
                alert(`Batch ID "${result.batchId}" copied! Use this to track the batch.`);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Copy Batch ID for Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBatch;