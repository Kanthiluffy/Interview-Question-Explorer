import React from 'react';
import { TrendingUp, Award, Target, Building2 } from 'lucide-react';

// Utility to normalize tags
function normalizeTags(tags) {
  if (!tags) return [];
  return tags
    .flatMap(tag => tag.split(/[;,]/))
    .map(tag => tag.trim())
    .filter(Boolean);
}

const GlobalInsightsSummary = ({ questions }) => {
  // Calculate global insights
  const allTags = questions.flatMap(q => normalizeTags(q.tags));
  const tagCounts = {};
  allTags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });

  const topTopics = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: ((count / allTags.length) * 100).toFixed(1)
    }));

  // Hot questions (high frequency)
  const hotQuestions = questions
    .filter(q => q.frequency && q.frequency > 3)
    .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
    .slice(0, 3);

  // Company distribution
  const companies = {};
  questions.forEach(q => {
    if (q.company_name) {
      companies[q.company_name] = (companies[q.company_name] || 0) + 1;
    }
  });

  const topCompanies = Object.entries(companies)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Global Insights</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">Live Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Topics */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hot Topics
          </h3>
          <div className="space-y-2">
            {topTopics.map((topic, index) => (
              <div key={topic.tag} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-blue-900">{topic.tag}</span>
                </div>
                <span className="text-sm font-bold text-blue-700">{topic.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Repeated Questions */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Most Repeated
          </h3>
          <div className="space-y-3">
            {hotQuestions.length > 0 ? hotQuestions.map((q, index) => (
              <div key={q._id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {q.frequency}
                  </span>
                  <span className="font-medium text-red-900 text-xs">
                    {q.company_name}
                  </span>
                </div>
                <p className="text-red-800 line-clamp-2">
                  {q.question?.slice(0, 60)}...
                </p>
              </div>
            )) : (
              <p className="text-red-600 text-sm">No high-frequency questions found</p>
            )}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top Companies
          </h3>
          <div className="space-y-2">
            {topCompanies.map(([company, count], index) => (
              <div key={company} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-purple-600' : index === 1 ? 'bg-purple-500' : 'bg-purple-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-purple-900 text-sm">{company}</span>
                </div>
                <span className="text-sm font-bold text-purple-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-200">
        <p className="text-gray-700">
          <span className="font-semibold text-blue-700">Quick Summary:</span>{' '}
          Most asked topics are{' '}
          <span className="font-semibold">{topTopics.slice(0, 3).map(t => t.tag).join(', ')}</span>.{' '}
          {hotQuestions.length > 0 && (
            <>
              <span className="font-semibold">{hotQuestions[0].company_name}</span> has the most repeated question.{' '}
            </>
          )}
          <span className="font-semibold">{topCompanies[0]?.[0]}</span> leads with{' '}
          <span className="font-semibold">{topCompanies[0]?.[1]}</span> questions.
        </p>
      </div>
    </div>
  );
};

export default GlobalInsightsSummary;
