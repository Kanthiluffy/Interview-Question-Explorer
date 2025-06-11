import React, { useEffect, useState, useMemo } from 'react';
import { fetchQuestions } from '../api/questions';
import TagBadge from '../components/TagBadge';
import GlobalInsightsSummary from '../components/GlobalInsightsSummary';
import { Search, Filter, BarChart3, Users, Target, Clock, Building2, ChevronDown } from 'lucide-react';

// Utility to normalize tags
function normalizeTags(tags) {
  if (!tags) return [];
  return tags
    .flatMap(tag => tag.split(/[;,]/))
    .map(tag => tag.trim())
    .filter(Boolean);
}

const unique = arr => Array.from(new Set(arr.filter(Boolean)));

const StatCard = ({ icon: Icon, title, value, subtitle, gradient }) => (
  <div className={`relative overflow-hidden rounded-xl p-6 text-white ${gradient}`}>
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8 text-white/70" />
      </div>
    </div>
    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10"></div>
  </div>
);

const HomePage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [recencyFilter, setRecencyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setQuestions(await fetchQuestions());
      setLoading(false);
    };
    load();
  }, []);

  // Collect unique filter values
  const { companies, roles, allTags, stats } = useMemo(() => {
    const companies = unique(questions.map(q => q.company_name));
    const roles = unique(questions.map(q => q.job_role));
    const allTags = unique(questions.flatMap(q => normalizeTags(q.tags)));
    
    const stats = {
      totalQuestions: questions.length,
      totalCompanies: companies.length,
      totalRoles: roles.length,
      totalTags: allTags.length,
      avgFrequency: questions.filter(q => q.frequency).length > 0 
        ? (questions.reduce((acc, q) => acc + (q.frequency || 0), 0) / questions.filter(q => q.frequency).length).toFixed(1)
        : 0
    };
    
    return { companies, roles, allTags, stats };
  }, [questions]);

  // Advanced filtering logic
  let filtered = useMemo(() => {
    return questions.filter(q => {
      const searchMatch = !searchTerm || 
        q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.job_role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const companyMatch = !companyFilter || q.company_name === companyFilter;
      const roleMatch = !roleFilter || q.job_role === roleFilter;
      const tagMatch = tagFilter.length === 0 || 
        (normalizeTags(q.tags).length && tagFilter.every(tag => normalizeTags(q.tags).includes(tag)));
      
      return searchMatch && companyMatch && roleMatch && tagMatch;
    });
  }, [questions, searchTerm, companyFilter, roleFilter, tagFilter]);

  // Apply sorting
  if (frequencyFilter === 'desc') {
    filtered = [...filtered].sort((a, b) => {
      if (a.frequency == null && b.frequency == null) return 0;
      if (a.frequency == null) return 1;
      if (b.frequency == null) return -1;
      return b.frequency - a.frequency;
    });
  }

  if (recencyFilter === 'latest') {
    filtered = [...filtered].sort((a, b) => {
      if (a.time && b.time) return new Date(b.time) - new Date(a.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  } else if (recencyFilter === 'oldest') {
    filtered = [...filtered].sort((a, b) => {
      if (a.time && b.time) return new Date(a.time) - new Date(b.time);
      if (a.time) return 1;
      if (b.time) return -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchTerm, companyFilter, roleFilter, frequencyFilter, recencyFilter, tagFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Question Explorer</h1>
              <p className="text-gray-600 mt-1">Discover and analyze technical interview questions</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {viewMode === 'table' ? 'Card View' : 'Table View'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Target}
            title="Total Questions"
            value={stats.totalQuestions.toLocaleString()}
            subtitle="Across all platforms"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Building2}
            title="Companies"
            value={stats.totalCompanies}
            subtitle="Tech companies"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            icon={Users}
            title="Job Roles"
            value={stats.totalRoles}
            subtitle="Different positions"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            icon={BarChart3}
            title="Avg Frequency"
            value={stats.avgFrequency}
            subtitle="Question frequency"
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          />        </div>

        {/* Global Insights Summary */}
        {!loading && questions.length > 0 && (
          <GlobalInsightsSummary questions={questions} />
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search questions, companies, or roles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
            <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <select
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {roles.map(r => r && <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                value={frequencyFilter}
                onChange={e => setFrequencyFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sort by Frequency</option>
                <option value="desc">Most Frequent First</option>
              </select>

              <select
                value={recencyFilter}
                onChange={e => setRecencyFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sort by Recency</option>
                <option value="latest">Most Recent First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          )}

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      tagFilter.includes(tag)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setTagFilter(tagFilter.includes(tag) 
                      ? tagFilter.filter(t => t !== tag) 
                      : [...tagFilter, tag]
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {paginated.length} of {filtered.length} questions
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Questions Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading questions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((q, idx) => (
                    <tr key={q._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          {q.link ? (
                            <a 
                              href={q.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              {q.question}
                            </a>
                          ) : (
                            <span className="text-gray-900">{q.question || 'No question text'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{q.company_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{q.job_role || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{q.frequency ?? 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {normalizeTags(q.tags).length > 0 ? (
                            normalizeTags(q.tags).map((tag, i) => (
                              <TagBadge key={i} tag={tag} />
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No tags</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Card View
          <div className="grid gap-6">
            {paginated.map(q => (
              <div key={q._id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {q.link ? (
                      <a 
                        href={q.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline block mb-2"
                      >
                        {q.question}
                      </a>
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{q.question || 'No question text'}</h3>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {q.company_name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {q.job_role || 'N/A'}
                      </span>
                      {q.frequency && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          Frequency: {q.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {normalizeTags(q.tags).length > 0 ? (
                    normalizeTags(q.tags).map((tag, i) => (
                      <TagBadge key={i} tag={tag} />
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No tags</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
