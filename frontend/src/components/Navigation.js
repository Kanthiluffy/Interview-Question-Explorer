import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, Search, BarChart3, FileText } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home', description: 'All Questions' },
    { path: '/companies', icon: Building2, label: 'Companies', description: 'By Company' },
    { path: '/insights', icon: BarChart3, label: 'Insights', description: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports', description: 'Download Reports' },
  ];

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Interview Explorer</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Technical Interview Questions</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stats Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
            <BarChart3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">Live Data</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
