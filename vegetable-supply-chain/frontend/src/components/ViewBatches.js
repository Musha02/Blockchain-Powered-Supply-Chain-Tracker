// src/components/ViewBatches.js
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Hash, Package, User, MapPin, Calendar, QrCode } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const ViewBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/batches`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      } else {
        setError('Failed to fetch batches');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-lg">Loading batches...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">👁️ All Batches</h2>
        <p className="text-gray-600">View all registered batches in the supply chain with their current status</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <p className="text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((item, index) => {
          const batch = item.Record;
          return (
            <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Hash className="h-5 w-5 mr-2 text-blue-600" />
                    {batch.batchId}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <Package className="h-4 w-4 text-green-500 mr-1" />
                    {batch.vegetableType}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  batch.status === 'Harvested' ? 'bg-green-100 text-green-800' :
                  batch.status === 'At Retailer' ? 'bg-blue-100 text-blue-800' :
                  batch.status === 'At Shop' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {batch.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <User className="h-4 w-4 text-purple-500 mr-1" />
                    Farmer:
                  </span>
                  <span className="font-semibold text-gray-900">{batch.farmerName}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 text-blue-500 mr-1" />
                    Location:
                  </span>
                  <span className="font-semibold text-blue-600">{batch.currentLocation}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Package className="h-4 w-4 text-green-500 mr-1" />
                    Quantity:
                  </span>
                  <span className="font-semibold text-gray-900">{batch.currentQuantity} kg</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600">💰 Price/kg:</span>
                  <span className="font-semibold text-gray-900">LKR {batch.pricePerKg}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created: {new Date(batch.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(batch.qrCode);
                      alert(`QR Code copied for ${batch.batchId}!\nQR ID: ${batch.qrCode}`);
                    }}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg font-semibold"
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    Copy QR
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {batches.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="p-8 bg-gray-50 rounded-2xl border-2 border-gray-200 max-w-md mx-auto">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Batches Found</h3>
            <p className="text-gray-500 mb-4">Create your first batch to get started with supply chain tracking.</p>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">💡 Tip: Use the "Create Batch" section to register new vegetable batches</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBatches;