import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompaniesPage from './pages/CompaniesPage';
import InsightsDashboard from './pages/InsightsDashboard';
import ReportsPage from './pages/ReportsPage';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  // Log environment info for debugging
  React.useEffect(() => {
    console.log('🔍 App Environment Check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   Origin:', window.location.origin);
    console.log('   Hostname:', window.location.hostname);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Development environment indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-xs">
            🔧 Development Mode - API: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
          </div>
        )}
        
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/insights" element={<InsightsDashboard />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
