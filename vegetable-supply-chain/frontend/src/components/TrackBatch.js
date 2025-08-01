// src/components/TrackBatch.js
import React, { useState } from 'react';
import { Search, AlertTriangle, Hash, Package, User, Calendar, MapPin, QrCode, Printer, Copy, Activity } from 'lucide-react';
import QRCodeReact from 'react-qr-code';

const API_BASE_URL = 'http://localhost:3001/api';

const TrackBatch = () => {
  const [searchType, setSearchType] = useState('batchId');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');
    setBatch(null);

    try {
      const endpoint = searchType === 'batchId' 
        ? `${API_BASE_URL}/batches/${searchValue}`
        : `${API_BASE_URL}/track/${searchValue}`;
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setBatch(data);
      } else {
        setError('Batch not found');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🔍 Track Batch</h2>
        <p className="text-gray-600">Search for a batch using Batch ID or QR Code to see its journey</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="batchId">🆔 Batch ID</option>
            <option value="qrCode">📱 QR Code</option>
          </select>
          
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`Enter ${searchType === 'batchId' ? 'Batch ID (e.g., BATCH001)' : 'QR Code ID'}`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              <div className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Track Batch
              </div>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <p className="text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      {batch && (
        <div className="space-y-8">
          {/* Batch Info with QR Code */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Batch Details - Left Side */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="h-7 w-7 mr-3 text-blue-600" />
                  📋 Batch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center bg-white p-4 rounded-xl border border-gray-200">
                    <Hash className="h-6 w-6 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Batch ID</p>
                      <p className="font-bold text-lg text-gray-900">{batch.batchId}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-gray-200">
                    <Package className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Vegetable</p>
                      <p className="font-bold text-gray-900">{batch.vegetableType}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-gray-200">
                    <User className="h-6 w-6 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Farmer</p>
                      <p className="font-bold text-gray-900">{batch.farmerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-gray-200">
                    <Calendar className="h-6 w-6 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Harvest Date</p>
                      <p className="font-bold text-gray-900">{batch.harvestDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-gray-200">
                    <MapPin className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Current Location</p>
                      <p className="font-bold text-blue-600 text-lg">{batch.currentLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-gray-200">
                    <QrCode className="h-6 w-6 text-teal-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">QR Code ID</p>
                      <p className="font-bold text-xs text-gray-700 break-all">{batch.qrCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code - Right Side */}
              <div className="flex flex-col items-center bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <QrCode className="h-6 w-6 mr-2 text-blue-600" />
                  📱 Current QR Code
                </h4>
                
                {/* QR Code Container for Printing */}
                <div className="qr-print-area">
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-300 shadow-sm">
                    <QRCodeReact
                      value={JSON.stringify({
                        batchId: batch.batchId,
                        qrCode: batch.qrCode,
                        vegetableType: batch.vegetableType,
                        farmerName: batch.farmerName,
                        currentLocation: batch.currentLocation,
                        status: batch.status,
                        currentQuantity: batch.currentQuantity,
                        lastUpdated: batch.lastUpdated || new Date().toISOString()
                      })}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                    <div className="text-center mt-3 print-info">
                      <p className="text-sm font-bold text-gray-700">{batch.batchId}</p>
                      <p className="text-xs text-gray-500">{batch.status}</p>
                    </div>
                  </div>
                </div>
                
                {/* QR Actions */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={handlePrintQR}
                    className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 font-semibold shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(batch.qrCode);
                      alert('QR ID copied!');
                    }}
                    className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 font-semibold shadow-md"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-3 text-center bg-gray-50 p-2 rounded-lg">
                  Updated: {batch.lastUpdated ? new Date(batch.lastUpdated).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          </div>

          {/* Status and Quantity Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-teal-600">Initial Quantity</p>
                  <p className="text-3xl font-bold text-teal-800">{batch.initialQuantity}</p>
                  <p className="text-sm text-teal-600">kg </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Current Quantity</p>
                  <p className="text-3xl font-bold text-blue-800">{batch.currentQuantity}</p>
                  <p className="text-sm text-blue-600">kg remaining</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Status</p>
                  <p className="text-lg font-bold text-green-800">{batch.status}</p>
                  <p className="text-sm text-green-600">current status</p>
                </div>
              </div>
            </div>

            

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Price per kg</p>
                  <p className="text-2xl font-bold text-purple-800">LKR {batch.pricePerKg}</p>
                  <p className="text-sm text-purple-600">current price</p>
                </div>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="h-7 w-7 mr-3 text-green-600" />
              🚛 Supply Chain History
            </h3>
            <div className="space-y-6">
              {batch.history && batch.history.map((entry, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-lg font-bold text-gray-900">{entry.action}</p>
                      <p className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                        {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-gray-600">Location: <strong>{entry.location}</strong></span>
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-gray-600">Quantity: <strong>{entry.quantity} kg</strong></span>
                      </div>
                      {entry.wastage > 0 && (
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-red-600">Wastage: <strong>{entry.wastage} kg</strong></span>
                        </div>
                      )}
                      {entry.updatedBy && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-gray-600">By: <strong>{entry.updatedBy}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackBatch;