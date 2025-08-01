// src/components/RecordWastage.js
import React, { useState } from 'react';
import { AlertTriangle, Hash, User } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const RecordWastage = () => {
  const [formData, setFormData] = useState({
    batchId: '',
    wastageAmount: '',
    reason: '',
    updatedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const wastageReasons = [
    { value: 'Transportation damage', icon: '🚛' },
    { value: 'Storage spoilage', icon: '📦' },
    { value: 'Quality issues', icon: '⚠️' },
    { value: 'Overripe/expired', icon: '🕐' },
    { value: 'Pest damage', icon: '🐛' },
    { value: 'Weather damage', icon: '🌧️' },
    { value: 'Handling damage', icon: '📋' },
    { value: 'Other', icon: '❓' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/batches/${formData.batchId}/wastage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the submitted data along with the response
        setResult({
          ...data,
          wastageAmount: formData.wastageAmount,
          reason: formData.reason
        });
        // Clear form after storing the values
        setFormData({
          batchId: '',
          wastageAmount: '',
          reason: '',
          updatedBy: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to record wastage');
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">⚠️ Record Wastage</h2>
        <p className="text-gray-600">Track and document wastage in the supply chain for better optimization</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="e.g., BATCH001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Wastage Amount (kg) *
            </label>
            <input
              type="number"
              name="wastageAmount"
              value={formData.wastageAmount}
              onChange={handleChange}
              required
              min="0.1"
              step="0.1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="e.g., 25.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Reason *
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="">Select reason</option>
              {wastageReasons.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.icon} {reason.value}
                </option>
              ))}
            </select>
          </div>

          <div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
          <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Wastage Recorded Successfully!
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <p className="text-orange-600 font-medium">Batch ID</p>
                <p className="font-bold text-gray-900">{result.batchId}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <p className="text-orange-600 font-medium">Remaining Quantity</p>
                <p className="font-bold text-gray-900">{result.currentQuantity} kg</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <p className="text-orange-600 font-medium">Wastage Recorded</p>
                <p className="font-bold text-red-600">{result.wastageAmount} kg</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <p className="text-orange-600 font-medium">Reason</p>
                <p className="font-bold text-gray-900">{result.reason}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Recording Wastage...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Record Wastage
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Wastage Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm text-bold font-medium text-yellow-800 mb-2">💡 Wastage Prevention Tips</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Maintain proper temperature during transport</li>
          <li>• Use appropriate packaging materials</li>
          <li>• Handle produce gently during loading/unloading</li>
          <li>• Monitor for pest activity regularly</li>
          <li>• Ensure quick transit times</li>
        </ul>
      </div>
    </div>
  );
};

export default RecordWastage;