// src/components/UpdateLocation.js
import React, { useState } from 'react';
import { Truck, Hash, MapPin, Package, AlertTriangle, User } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const UpdateLocation = () => {
  const [formData, setFormData] = useState({
    batchId: '',
    newLocation: '',
    currentQuantity: '',
    wastage: '0',
    updatedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const locations = [
    { value: 'Farm', icon: '🚜', color: 'green' },
    { value: 'Warehouse', icon: '🏭', color: 'blue' },
    { value: 'Retailer', icon: '🏪', color: 'orange' },
    { value: 'Shop', icon: '🛒', color: 'purple' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/batches/${formData.batchId}/location`, {
        method: 'PUT',
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
          newLocation: '',
          currentQuantity: '',
          wastage: '0',
          updatedBy: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update location');
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🚛 Update Location</h2>
        <p className="text-gray-600">Move batch through the supply chain and track quantities</p>
      </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., BATCH001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              New Location *
            </label>
            <select
              name="newLocation"
              value={formData.newLocation}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select location</option>
              {locations.map(location => (
                <option key={location.value} value={location.value}>
                  {location.icon} {location.value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="inline h-4 w-4 mr-1" />
              Current Quantity (kg) *
            </label>
            <input
              type="number"
              name="currentQuantity"
              value={formData.currentQuantity}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., 950"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Wastage (kg)
            </label>
            <input
              type="number"
              name="wastage"
              value={formData.wastage}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., 50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Updated By *
            </label>
            <input
              type="text"
              name="updatedBy"
              value={formData.updatedBy}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., WAREHOUSE001 or John Doe"
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

        {result && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Location Updated Successfully!
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-green-600 font-medium">Batch ID</p>
                <p className="font-bold text-gray-900">{result.batchId}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-green-600 font-medium">New Location</p>
                <p className="font-bold text-gray-900">{result.currentLocation}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-green-600 font-medium">Current Quantity</p>
                <p className="font-bold text-gray-900">{result.currentQuantity} kg</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-green-600 font-medium">Status</p>
                <p className="font-bold text-gray-900">{result.status}</p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className=" bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-10 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Updating Location...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Truck className="h-5 w-5 mr-2" />
                Update Location
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateLocation;