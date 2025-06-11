import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Map interview_questions
function mapInterviewQuestion(q) {
  return {
    _id: q._id,
    question: q.question || null,
    link: q.link || null,
    time: q.time || null,
    frequency: q.frequency || null,
    tags: q.topics ? (Array.isArray(q.topics) ? q.topics : [q.topics]) : [],
    company_name: q.company_name || null,
    job_role: q.job_role || null,
    source: 'interview_questions',
  };
}

// Map leetcode_questions
function mapLeetcodeQuestion(q) {
  return {
    _id: q._id,
    question: q.title || null,
    link: q['question link'] || null,
    time: null, // date is not available for leetcode questions
    frequency: q.frequency ?? null, // frequency is mapped directly
    tags: [],
    company_name: q.company_name || null,
    job_role: null,
    source: 'leetcode_questions',
  };
}

export const fetchQuestions = async (params = {}) => {
  // Fetch both collections in parallel
  const [interviewRes, leetcodeRes] = await Promise.all([
    axios.get(`${API_BASE}/questions`, { params }),
    axios.get(`${API_BASE}/leetcode-questions`),
  ]);
  const interviewQs = interviewRes.data.map(mapInterviewQuestion);
  const leetcodeQs = leetcodeRes.data.map(mapLeetcodeQuestion);
  return [...interviewQs, ...leetcodeQs];
};

export const fetchCompanies = async () => {
  const res = await axios.get(`${API_BASE}/companies`);
  return res.data;
};

export const fetchCompanyQuestions = async (company) => {
  // Fetch both collections for a company
  const [interviewRes, leetcodeRes] = await Promise.all([
    axios.get(`${API_BASE}/companies/${encodeURIComponent(company)}/questions`),
    axios.get(`${API_BASE}/leetcode-questions?company=${encodeURIComponent(company)}`),
  ]);
  const interviewQs = interviewRes.data.map(mapInterviewQuestion);
  const leetcodeQs = leetcodeRes.data.map(mapLeetcodeQuestion);
  return [...interviewQs, ...leetcodeQs];
};

export const fetchLeetcodeCompanies = async () => {
  const res = await axios.get(`${API_BASE}/leetcode-questions/companies`);
  return res.data;
};

// Reports API functions
export const fetchCompanyReport = async (company, role = null) => {
  const params = role ? { role } : {};
  const res = await axios.get(`${API_BASE}/reports/company/${encodeURIComponent(company)}`, { params });
  return res.data;
};

export const fetchCompaniesWithCounts = async () => {
  const res = await axios.get(`${API_BASE}/reports/companies`);
  return res.data;
};
