import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Target, Clock, Award, Users } from 'lucide-react';

// Utility to normalize tags
function normalizeTags(tags) {
  if (!tags) return [];
  return tags
    .flatMap(tag => tag.split(/[;,]/))
    .map(tag => tag.trim())
    .filter(Boolean);
}

const CompanyInsightCard = ({ company, questions }) => {
  const insights = useMemo(() => {
    // Calculate topic distribution
    const allTags = questions.flatMap(q => normalizeTags(q.tags));
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const totalQuestions = questions.length;
    const totalTags = allTags.length;

    // Calculate percentages for top topics
    const topTopics = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: ((count / totalTags) * 100).toFixed(1)
      }));

    // Role distribution
    const roleCounts = {};
    questions.forEach(q => {
      if (q.job_role) {
        roleCounts[q.job_role] = (roleCounts[q.job_role] || 0) + 1;
      }
    });

    const topRoles = Object.entries(roleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([role, count]) => ({
        role,
        count,
        percentage: ((count / totalQuestions) * 100).toFixed(1)
      }));

    // Frequency analysis
    const frequencyData = questions
      .filter(q => q.frequency)
      .reduce((acc, q) => acc + q.frequency, 0) / questions.filter(q => q.frequency).length || 0;

    // Most repeated questions (by frequency)
    const hotQuestions = questions
      .filter(q => q.frequency && q.frequency > 2)
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 3);

    // Recent trend (questions from last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentQuestions = questions.filter(q => {
      if (!q.time) return false;
      const questionDate = new Date(q.time);
      return questionDate >= sixMonthsAgo;
    });

    return {
      totalQuestions,
      topTopics,
      topRoles,
      avgFrequency: frequencyData.toFixed(1),
      hotQuestions,
      recentTrend: {
        count: recentQuestions.length,
        percentage: ((recentQuestions.length / totalQuestions) * 100).toFixed(1)
      }
    };
  }, [questions]);

  const getTopicColor = (index) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 
      'bg-orange-500', 'bg-red-500', 'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  const getRoleColor = (index) => {
    const colors = [
      'bg-emerald-500', 'bg-cyan-500', 'bg-rose-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{company} Insights</h2>
          <p className="text-gray-600">{insights.totalQuestions} total questions analyzed</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Analytics</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <span className="text-sm font-medium">Questions</span>
          </div>
          <p className="text-2xl font-bold mt-1">{insights.totalQuestions}</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">Avg Frequency</span>
          </div>
          <p className="text-2xl font-bold mt-1">{insights.avgFrequency}</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Recent Trend</span>
          </div>
          <p className="text-2xl font-bold mt-1">{insights.recentTrend.percentage}%</p>
          <p className="text-xs opacity-80">Last 6 months</p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium">Hot Questions</span>
          </div>
          <p className="text-2xl font-bold mt-1">{insights.hotQuestions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Topic Distribution
          </h3>
          <div className="space-y-3">
            {insights.topTopics.map((topic, index) => (
              <div key={topic.tag} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getTopicColor(index)}`}></div>
                  <span className="font-medium text-gray-700">{topic.tag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getTopicColor(index)}`}
                      style={{ width: `${topic.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                    {topic.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Role Distribution
          </h3>
          <div className="space-y-3">
            {insights.topRoles.map((role, index) => (
              <div key={role.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getRoleColor(index)}`}></div>
                  <span className="font-medium text-gray-700">{role.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getRoleColor(index)}`}
                      style={{ width: `${role.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                    {role.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hot Questions */}
      {insights.hotQuestions.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Most Repeated Questions
          </h3>
          <div className="space-y-3">
            {insights.hotQuestions.map((q, index) => (
              <div key={q._id} className="flex items-start justify-between bg-white rounded-lg p-3 border border-red-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      Frequency: {q.frequency}
                    </span>
                  </div>
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
                    <p className="text-gray-900 font-medium">{q.question}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {normalizeTags(q.tags).slice(0, 3).map((tag, i) => (
                      <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Company Summary</h3>
        <div className="text-blue-900 font-medium">
          <span className="text-xl font-bold">{company}</span>
          {insights.topRoles.length > 0 && (
            <span> {insights.topRoles[0].role}: </span>
          )}
          {insights.topTopics.slice(0, 3).map((topic, index) => (
            <span key={topic.tag}>
              {index > 0 && ', '}
              <span className="font-semibold">{topic.percentage}% {topic.tag}</span>
            </span>
          ))}
        </div>
        
        {insights.recentTrend.count > 0 && (
          <p className="text-blue-700 mt-2 text-sm">
            📈 <strong>{insights.recentTrend.percentage}%</strong> of questions are from recent months, 
            showing active recruitment trends
          </p>
        )}
        
        {insights.hotQuestions.length > 0 && (
          <p className="text-blue-700 mt-1 text-sm">
            🔥 <strong>{insights.hotQuestions.length}</strong> frequently repeated questions identified
          </p>
        )}
      </div>
    </div>
  );
};

export default CompanyInsightCard;
