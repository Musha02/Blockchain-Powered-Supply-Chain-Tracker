// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, BarChart3, Truck, AlertTriangle, Eye, QrCode, Zap, Target, TrendingUp, Activity, Package } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="p-8">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
             🌱 AI-BlockChain Powered Supply Chain 
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track vegetables from farm to fork with blockchain technology, QR codes, and real-time analytics
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Create Batch */}
        <Link 
          to="/create"
          className="group cursor-pointer bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-8 rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-bold text-green-800">Create Batch</h4>
              <p className="text-green-600">Start new supply chain</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Register new vegetable batches with QR codes for complete traceability from farm to consumer.
          </p>
          <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700">
            <span>Get Started</span>
            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>

        {/* Track Batch */}
        <Link 
          to="/track"
          className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-8 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Search className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-bold text-blue-800">Track Batch</h4>
              <p className="text-blue-600">Follow the journey</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Track any batch using Batch ID or QR code to see its complete journey and current status.
          </p>
          <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
            <span>Track Now</span>
            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>

        {/* Analytics */}
        <Link 
          to="/analytics"
          className="group cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-8 rounded-2xl border border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-bold text-purple-800">Analytics</h4>
              <p className="text-purple-600">View insights</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Get detailed analytics on your supply chain performance, wastage patterns, and efficiency metrics.
          </p>
          <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
            <span>View Analytics</span>
            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>

        {/* Update Location */}
        <Link 
          to="/update"
          className="group cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 p-8 rounded-2xl border border-orange-200 hover:border-orange-300 transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-bold text-orange-800">Update Location</h4>
              <p className="text-orange-600">Move through chain</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Update batch locations as they move through the supply chain from farm to retailer to consumer.
          </p>
          <div className="flex items-center text-orange-600 font-semibold group-hover:text-orange-700">
            <span>Update Now</span>
            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>

        {/* Record Wastage */}
        <Link 
          to="/wastage"
          className="group cursor-pointer bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 p-8 rounded-2xl border border-red-200 hover:border-red-300 transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-bold text-red-800">Record Wastage</h4>
              <p className="text-red-600">Track losses</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Document wastage at any point in the supply chain to improve efficiency and reduce losses.
          </p>
          <div className="flex items-center text-red-600 font-semibold group-hover:text-red-700">
            <span>Record Wastage</span>
            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>

        {/* View All Batches */}
        <Link 
          to="/view"
          className="group cursor-pointer bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 p-8 rounded-2xl border border-teal-200 hover:border-teal-300 transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-bold text-teal-800">View All Batches</h4>
              <p className="text-teal-600">Browse inventory</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Browse all registered batches, check their status, and access their QR codes for tracking.
          </p>
          <div className="flex items-center text-teal-600 font-semibold group-hover:text-teal-700">
            <span>View Batches</span>
            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>
      </div>

      {/* Features List */}
      <div className="mt-16 bg-gradient-to-r from-blue-30 to-blue-50 rounded-2xl p-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🌟 Platform Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <QrCode className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-700 font-medium">QR Code Generation & Printing</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-gray-700 font-medium">Real-time Blockchain Updates</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-gray-700 font-medium">End-to-end Traceability</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-gray-700 font-medium">Wastage Analytics</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Activity className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-gray-700 font-medium">Live Status Updates</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <span className="text-gray-700 font-medium">Inventory Management</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;