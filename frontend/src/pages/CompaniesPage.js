import React, { useEffect, useState, useMemo } from 'react';
import { fetchCompanies, fetchCompanyQuestions, fetchLeetcodeCompanies } from '../api/questions';
import CompanyInsightCard from '../components/CompanyInsightCard';
import { Search, ArrowLeft, Building2, MapPin, Users, Target, BarChart3, Clock, Filter, Grid, List, TrendingUp } from 'lucide-react';

// Utility to normalize tags
function normalizeTags(tags) {
  if (!tags) return [];
  return tags
    .flatMap(tag => tag.split(/[;,]/))
    .map(tag => tag.trim())
    .filter(Boolean);
}

const unique = arr => Array.from(new Set(arr.filter(Boolean)));

const CompanyCard = ({ company, onSelect, isSelected }) => (
  <div
    onClick={() => onSelect(company)}
    className={`group cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 shadow-lg' 
        : 'border-gray-200 bg-white hover:border-blue-300'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-500' : 'bg-gray-100 group-hover:bg-blue-100'} transition-colors`}>
        <Building2 className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} />
      </div>
      <div>
        <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{company}</h3>
        <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>Tech Company</p>
      </div>
    </div>
  </div>
);

const QuestionCard = ({ question, index }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        {question.link ? (
          <a 
            href={question.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline block mb-2"
          >
            {question.question}
          </a>
        ) : (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.question || 'No question text'}</h3>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {question.job_role && (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {question.job_role}
            </span>
          )}
          {question.frequency && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Frequency: {question.frequency}
            </span>
          )}
          {question.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {question.time}
            </span>
          )}
        </div>
      </div>
      <div className="ml-4 text-sm text-gray-400 font-mono">
        #{index + 1}
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {normalizeTags(question.tags).length > 0 ? (
        normalizeTags(question.tags).map((tag, i) => (
          <span 
            key={i} 
            className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200"
          >
            {tag}
          </span>
        ))
      ) : (
        <span className="text-gray-400 text-sm">No tags</span>
      )}
    </div>
  </div>
);

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [roleFilter, setRoleFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [recencyFilter, setRecencyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('cards');
  const pageSize = 20;

  // Filter companies by search
  const filteredCompanies = companies.filter(c => 
    c.toLowerCase().includes(companySearch.toLowerCase())
  );

  // Extract unique roles and tags for filters
  const { allRoles, allTags, stats } = useMemo(() => {
    const allRoles = Array.from(new Set(questions.map(q => q.job_role).filter(Boolean)));
    const allTags = Array.from(new Set(questions.flatMap(q => normalizeTags(q.tags)).filter(Boolean)));
    
    const stats = {
      totalQuestions: questions.length,
      totalRoles: allRoles.length,
      totalTags: allTags.length,
      avgFrequency: questions.filter(q => q.frequency).length > 0 
        ? (questions.reduce((acc, q) => acc + (q.frequency || 0), 0) / questions.filter(q => q.frequency).length).toFixed(1)
        : 0
    };
    
    return { allRoles, allTags, stats };
  }, [questions]);

  // Apply filters to questions
  let filtered = useMemo(() => {
    return questions.filter(q => {
      const searchMatch = !questionSearch || 
        q.question?.toLowerCase().includes(questionSearch.toLowerCase());
      const roleMatch = !roleFilter || q.job_role === roleFilter;
      const tagMatch = tagFilter.length === 0 || 
        (normalizeTags(q.tags).length && tagFilter.every(tag => normalizeTags(q.tags).includes(tag)));
      
      return searchMatch && roleMatch && tagMatch;
    });
  }, [questions, questionSearch, roleFilter, tagFilter]);

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
  useEffect(() => { setPage(1); }, [selected, roleFilter, frequencyFilter, recencyFilter, tagFilter, questionSearch]);

  useEffect(() => {
    const load = async () => {
      const allCompanies = await fetchCompanies();
      let leetcodeCompanies = [];
      try {
        leetcodeCompanies = await fetchLeetcodeCompanies();
      } catch (err) {
        // ignore errors
      }
      setCompanies(unique([...allCompanies, ...leetcodeCompanies]));
    };
    load();
  }, []);

  useEffect(() => {
    if (selected) {
      setLoading(true);
      fetchCompanyQuestions(selected).then(qs => {
        setQuestions(qs);
        setLoading(false);
      });
    }
  }, [selected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {selected ? `Questions at ${selected}` : 'Companies'}
              </h1>
              <p className="text-gray-600 mt-1">
                {selected 
                  ? `Explore interview questions from ${selected}` 
                  : 'Browse questions by company'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selected ? (
          // Company Selection View
          <>
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                  <p className="text-gray-600">Try adjusting your search</p>
                </div>
              ) : (
                filteredCompanies.map(company => (
                  <CompanyCard
                    key={company}
                    company={company}
                    onSelect={setSelected}
                    isSelected={selected === company}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          // Company Questions View
          <>
            {/* Company Insights Card */}
            <CompanyInsightCard company={selected} questions={questions} />

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                    <p className="text-sm text-gray-600">Questions</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
                    <p className="text-sm text-gray-600">Roles</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3">
                  <Filter className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTags}</p>
                    <p className="text-sm text-gray-600">Tags</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgFrequency}</p>
                    <p className="text-sm text-gray-600">Avg Frequency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={questionSearch}
                    onChange={e => setQuestionSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  {allRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={frequencyFilter}
                    onChange={e => setFrequencyFilter(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sort by Frequency</option>
                    <option value="desc">Most Frequent</option>
                  </select>

                  <button
                    onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                    className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title={viewMode === 'cards' ? 'Switch to table view' : 'Switch to card view'}
                  >
                    {viewMode === 'cards' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </button>
                </div>
              </div>

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
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid gap-6">
                {paginated.map((question, index) => (
                  <QuestionCard 
                    key={question._id} 
                    question={question} 
                    index={(page - 1) * pageSize + index}
                  />
                ))}
              </div>
            ) : (
              // Table View
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
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
                          <td className="px-6 py-4 text-sm text-gray-900">{q.job_role || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{q.frequency ?? 'N/A'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {normalizeTags(q.tags).length > 0 ? (
                                normalizeTags(q.tags).map((tag, i) => (
                                  <span 
                                    key={i} 
                                    className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200"
                                  >
                                    {tag}
                                  </span>
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
          </>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;
