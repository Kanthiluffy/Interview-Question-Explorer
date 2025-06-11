import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompaniesPage from './pages/CompaniesPage';
import InsightsDashboard from './pages/InsightsDashboard';
import ReportsPage from './pages/ReportsPage';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
