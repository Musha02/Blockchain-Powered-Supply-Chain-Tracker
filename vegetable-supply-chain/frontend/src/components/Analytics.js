// src/components/Analytics.js
import React, { useState, useEffect } from 'react';
import { BarChart3, Package, AlertTriangle, TrendingUp, Target, Activity, Zap } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  const efficiency = stats ? ((stats.totalQuantity - stats.totalWastage) / stats.totalQuantity * 100).toFixed(1) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Supply Chain Analytics</h2>
        <p className="text-gray-600">Real-time insights into your vegetable supply chain performance</p>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Batches</p>
                  <p className="text-3xl font-bold">{stats.totalBatches}</p>
                  <p className="text-green-200 text-xs mt-1">Active in system</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Package className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Quantity</p>
                  <p className="text-3xl font-bold">{stats.totalQuantity}</p>
                  <p className="text-blue-200 text-xs mt-1">kg in supply chain</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <BarChart3 className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Wastage</p>
                  <p className="text-3xl font-bold">{stats.totalWastage}</p>
                  <p className="text-red-200 text-xs mt-1">kg lost</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Efficiency</p>
                  <p className="text-3xl font-bold">{efficiency}%</p>
                  <p className="text-purple-200 text-xs mt-1">supply chain efficiency</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Location Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📍 Location Distribution</h3>
              <div className="space-y-4">
                {Object.entries(stats.locations).map(([location, count]) => {
                  const percentage = stats.totalBatches > 0 ? (count / stats.totalBatches * 100).toFixed(1) : 0;
                  const colors = {
                    farm: 'bg-green-500',
                    warehouse: 'bg-blue-500', 
                    retailer: 'bg-orange-500',
                    shop: 'bg-purple-500'
                  };
                  return (
                    <div key={location} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${colors[location.toLowerCase()] || 'bg-gray-500'}`}></div>
                        <span className="font-medium text-gray-700 capitalize">{location}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[location.toLowerCase()] || 'bg-gray-500'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-600 w-12">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">🥬 Vegetable Types</h3>
              <div className="space-y-4">
                {Object.entries(stats.vegetables).map(([vegetable, count]) => {
                  const percentage = stats.totalBatches > 0 ? (count / stats.totalBatches * 100).toFixed(1) : 0;
                  return (
                    <div key={vegetable} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-green-400 to-green-600"></div>
                        <span className="font-medium text-gray-700">{vegetable}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-600 w-12">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">🎯 Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Efficiency Score</h4>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">{efficiency}%</p>
                <p className="text-sm text-gray-600">
                  {efficiency > 90 ? '🟢 Excellent efficiency!' : 
                   efficiency > 80 ? '🟡 Good efficiency' : 
                   '🔴 Needs improvement'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Active QR Codes</h4>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">{stats.totalBatches}</p>
                <p className="text-sm text-gray-600">Scannable QR codes in system</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Avg. Batch Size</h4>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.totalBatches > 0 ? Math.round(stats.totalQuantity / stats.totalBatches) : 0}
                </p>
                <p className="text-sm text-gray-600">kg per batch</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;