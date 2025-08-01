// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Leaf, Search, BarChart3, Plus, Eye, Truck, AlertTriangle, Home, Activity } from 'lucide-react';

// Import all components
import HomePage from './components/HomePage';
import CreateBatch from './components/CreateBatch';
import TrackBatch from './components/TrackBatch';
import ViewBatches from './components/ViewBatches';
import UpdateLocation from './components/UpdateLocation';
import RecordWastage from './components/RecordWastage';
import Analytics from './components/Analytics';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HeroSection />
          <Navigation />
          <MainContent />
        </div>
        <PrintStyles />
      </div>
    </Router>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <Leaf className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                VeggieChain
              </h1>
              <p className="text-sm text-gray-600 font-medium">AI-Blockchain Supply Chain Tracker</p>
            </div>
          </Link>
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Live Dashboard</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero Section Component
const HeroSection = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  if (!isHomePage) return null;

  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        🚀 Welcome to Your Supply Chain Dashboard
      </h2>
      <p className="text-xl text-gray-600 max-w-4xl mx-auto">
        Manage your vegetable supply chain with AI-Blockchain powered transparency and QR code tracking
      </p>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const navigation = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/create', label: 'Create Batch', icon: Plus },
    { path: '/track', label: 'Track Batch', icon: Search },
    { path: '/view', label: 'View All Batches', icon: Eye },
    { path: '/update', label: 'Update Location', icon: Truck },
    { path: '/wastage', label: 'Record Wastage', icon: AlertTriangle },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // If we're on the home page, return null (no navigation)
  if (isHomePage) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
              isActive
                ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg'
                : 'bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 shadow-md hover:shadow-lg'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-xl transition-colors ${
                isActive ? 'bg-white/20' : 'bg-gradient-to-br from-green-100 to-blue-100 group-hover:from-green-200 group-hover:to-blue-200'
              }`}>
                <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-green-600'}`} />
              </div>
              <span className={`text-sm font-semibold text-center ${
                isActive ? 'text-white' : 'text-gray-700'
              }`}>
                {item.label}
              </span>
            </div>
            {isActive && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/20 to-blue-400/20 animate-pulse"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

// Main Content Component
const MainContent = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateBatch />} />
        <Route path="/track" element={<TrackBatch />} />
        <Route path="/view" element={<ViewBatches />} />
        <Route path="/update" element={<UpdateLocation />} />
        <Route path="/wastage" element={<RecordWastage />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </div>
  );
};

// Print Styles Component
const PrintStyles = () => {
  return (
    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden;
        }
        .qr-print-area, .qr-print-area * {
          visibility: visible;
        }
        .qr-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
        }
        .qr-print-area canvas {
          margin: 20px 0;
        }
        .qr-print-area .print-info {
          text-align: center;
          font-family: Arial, sans-serif;
          color: black;
        }
      }
    `}</style>
  );
};

export default App;