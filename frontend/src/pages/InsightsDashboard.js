import React, { useEffect, useState, useMemo } from 'react';
import { fetchQuestions } from '../api/questions';
import CompanyInsightCard from '../components/CompanyInsightCard';
import { BarChart3, TrendingUp, Target, Building2, Users, Award, Calendar, Filter } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Utility to normalize tags
function normalizeTags(tags) {
  if (!tags) return [];
  return tags
    .flatMap(tag => tag.split(/[;,]/))
    .map(tag => tag.trim())
    .filter(Boolean);
}

const unique = arr => Array.from(new Set(arr.filter(Boolean)));

const InsightsDashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'company', 'trends'

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setQuestions(await fetchQuestions());
      setLoading(false);
    };
    load();
  }, []);

  const { globalInsights, companyInsights, trendData } = useMemo(() => {
    // Global insights
    const companies = unique(questions.map(q => q.company_name));
    const roles = unique(questions.map(q => q.job_role));
    const allTags = questions.flatMap(q => normalizeTags(q.tags));
    
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topGlobalTopics = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: ((count / allTags.length) * 100).toFixed(1)
      }));

    // Company-wise insights
    const companyData = {};
    companies.forEach(company => {
      const companyQuestions = questions.filter(q => q.company_name === company);
      const companyTags = companyQuestions.flatMap(q => normalizeTags(q.tags));
      
      const companyTagCounts = {};
      companyTags.forEach(tag => {
        companyTagCounts[tag] = (companyTagCounts[tag] || 0) + 1;
      });

      const topTopics = Object.entries(companyTagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({
          tag,
          count,
          percentage: ((count / companyTags.length) * 100).toFixed(1)
        }));

      const avgFrequency = companyQuestions
        .filter(q => q.frequency)
        .reduce((acc, q) => acc + q.frequency, 0) / companyQuestions.filter(q => q.frequency).length || 0;

      companyData[company] = {
        totalQuestions: companyQuestions.length,
        topTopics,
        avgFrequency: avgFrequency.toFixed(1),
        questions: companyQuestions
      };
    });

    // Trend data (monthly distribution)
    const monthlyData = {};
    questions.forEach(q => {
      if (q.time) {
        const date = new Date(q.time);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort().slice(-12); // Last 12 months
    const trendData = {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label: 'Questions Added',
        data: sortedMonths.map(month => monthlyData[month] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
      }]
    };

    return {
      globalInsights: {
        totalQuestions: questions.length,
        totalCompanies: companies.length,
        totalRoles: roles.length,
        topTopics: topGlobalTopics,
        avgFrequency: (questions.filter(q => q.frequency).reduce((acc, q) => acc + q.frequency, 0) / questions.filter(q => q.frequency).length || 0).toFixed(1)
      },
      companyInsights: companyData,
      trendData
    };
  }, [questions]);

  const topicsChartData = {
    labels: globalInsights.topTopics.slice(0, 8).map(t => t.tag),
    datasets: [{
      data: globalInsights.topTopics.slice(0, 8).map(t => t.count),
      backgroundColor: [
        '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
        '#EF4444', '#6366F1', '#EC4899', '#14B8A6'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const companyComparisonData = {
    labels: Object.keys(companyInsights).slice(0, 10),
    datasets: [{
      label: 'Total Questions',
      data: Object.values(companyInsights).slice(0, 10).map(c => c.totalQuestions),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Insights Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive analysis of interview question patterns</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('company')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'company' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Companies
              </button>
              <button
                onClick={() => setViewMode('trends')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'trends' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trends
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'overview' && (
          <>
            {/* Global Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{globalInsights.totalQuestions.toLocaleString()}</p>
                    <p className="text-blue-100">Total Questions</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{globalInsights.totalCompanies}</p>
                    <p className="text-purple-100">Companies</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{globalInsights.totalRoles}</p>
                    <p className="text-green-100">Job Roles</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{globalInsights.avgFrequency}</p>
                    <p className="text-orange-100">Avg Frequency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Topics Distribution</h3>
                <div className="h-80">
                  <Doughnut 
                    data={topicsChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Question Volume</h3>
                <div className="h-80">
                  <Bar 
                    data={companyComparisonData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top Companies Quick View */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(companyInsights)
                  .sort(([,a], [,b]) => b.totalQuestions - a.totalQuestions)
                  .slice(0, 6)
                  .map(([company, data]) => (
                    <div key={company} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{company}</h4>
                      <p className="text-sm text-gray-600 mb-3">{data.totalQuestions} questions</p>
                      <div className="space-y-1">
                        {data.topTopics.slice(0, 3).map((topic, index) => (
                          <div key={topic.tag} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{topic.tag}</span>
                            <span className="font-medium text-blue-600">{topic.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {viewMode === 'company' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Company for Detailed Analysis
              </label>
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                className="w-full max-w-md border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a company...</option>
                {Object.keys(companyInsights)
                  .sort()
                  .map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
              </select>
            </div>

            {selectedCompany && companyInsights[selectedCompany] ? (
              <CompanyInsightCard 
                company={selectedCompany} 
                questions={companyInsights[selectedCompany].questions}
              />
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Company</h3>
                <p className="text-gray-600">Choose a company from the dropdown to view detailed insights</p>
              </div>
            )}
          </>
        )}

        {viewMode === 'trends' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Volume Trends (Last 12 Months)</h3>
              <div className="h-80">
                <Bar 
                  data={trendData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Hot Topics Trending */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalInsights.topTopics.slice(0, 9).map((topic, index) => (
                  <div key={topic.tag} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index < 3 ? 'bg-red-500' : index < 6 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{topic.tag}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{topic.count}</p>
                      <p className="text-sm text-gray-600">{topic.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InsightsDashboard;
