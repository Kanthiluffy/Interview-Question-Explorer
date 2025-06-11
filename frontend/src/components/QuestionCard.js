import React from 'react';
import TagBadge from './TagBadge';
import { getRecency } from '../utils/timeUtils';

const frequencyColors = {
  Rare: 'bg-gray-200 text-gray-700',
  Moderate: 'bg-yellow-200 text-yellow-800',
  Frequent: 'bg-green-200 text-green-800',
};

const QuestionCard = ({ question }) => (
  <div className="bg-white shadow rounded p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <div className="font-semibold text-lg">
        {question.link ? (
          <a href={question.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {question.question}
          </a>
        ) : (
          question.question
        )}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {question.company_name} &middot; {question.job_role}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {question.tags && question.tags.map((tag, i) => <TagBadge key={i} tag={tag} />)}
      </div>
    </div>
    <div className="flex flex-col items-end mt-2 md:mt-0">
      <span className={`px-2 py-1 rounded text-xs font-bold ${frequencyColors[question.frequency] || 'bg-gray-100 text-gray-700'}`}>{question.frequency}</span>
      <span className="text-xs text-gray-400 mt-1">{getRecency(question.time)}</span>
    </div>
  </div>
);

export default QuestionCard;
