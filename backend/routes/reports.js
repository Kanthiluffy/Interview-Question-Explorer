import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';

// Use native driver for both collections
const InterviewQuestion = () => mongoose.connection.collection('interview_questions');
const LeetcodeQuestion = () => mongoose.connection.collection('leetcode_questions');

// GET /api/reports/company/:company - Get comprehensive company report data
router.get('/company/:company', async (req, res) => {
  try {
    const { company } = req.params;
    const { role } = req.query;
    
    // Build filters
    const interviewFilter = { company_name: company };
    const leetcodeFilter = { company_name: company };
    
    if (role) {
      interviewFilter.job_role = role;
      // Note: LeetCode questions don't have job_role field
    }
    
    // Fetch questions from both collections
    const [interviewQuestions, leetcodeQuestions] = await Promise.all([
      InterviewQuestion().find(interviewFilter).toArray(),
      LeetcodeQuestion().find(leetcodeFilter).toArray()
    ]);
    
    // Map to consistent format
    const mappedInterviewQuestions = interviewQuestions.map(q => ({
      ...q,
      source: 'interview_questions',
      tags: q.topics ? (Array.isArray(q.topics) ? q.topics : [q.topics]) : [],
      question: q.question,
      link: q.link || null,
      frequency: q.frequency || null
    }));
    
    const mappedLeetcodeQuestions = leetcodeQuestions.map(q => ({
      ...q,
      source: 'leetcode_questions',
      question: q.title,
      link: q['question link'] || null,
      tags: [],
      job_role: null, // LeetCode questions don't have roles
      time: null // LeetCode questions don't have time
    }));
    
    // Combine all questions
    const allQuestions = [...mappedInterviewQuestions, ...mappedLeetcodeQuestions];
    
    // Filter by role if specified (only affects interview questions)
    const filteredQuestions = role 
      ? allQuestions.filter(q => !q.job_role || q.job_role === role)
      : allQuestions;
    
    // Generate analysis
    const analysis = generateCompanyAnalysis(filteredQuestions, company, role);
    
    res.json({
      company,
      role: role || null,
      totalQuestions: filteredQuestions.length,
      questions: filteredQuestions,
      analysis
    });
    
  } catch (err) {
    console.error('Error in company report route:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/companies - Get list of all companies with question counts
router.get('/companies', async (req, res) => {
  try {
    // Get unique companies from both collections
    const [interviewCompanies, leetcodeCompanies] = await Promise.all([
      InterviewQuestion().distinct('company_name'),
      LeetcodeQuestion().distinct('company_name')
    ]);
    
    // Combine and deduplicate
    const allCompanies = [...new Set([...interviewCompanies, ...leetcodeCompanies])];
    
    // Get question counts for each company
    const companiesWithCounts = await Promise.all(
      allCompanies.map(async (company) => {
        const [interviewCount, leetcodeCount] = await Promise.all([
          InterviewQuestion().countDocuments({ company_name: company }),
          LeetcodeQuestion().countDocuments({ company_name: company })
        ]);
        
        return {
          name: company,
          interviewQuestions: interviewCount,
          leetcodeQuestions: leetcodeCount,
          totalQuestions: interviewCount + leetcodeCount
        };
      })
    );
    
    // Sort by total questions descending
    companiesWithCounts.sort((a, b) => b.totalQuestions - a.totalQuestions);
    
    res.json(companiesWithCounts);
    
  } catch (err) {
    console.error('Error in companies report route:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate comprehensive analysis for a company
function generateCompanyAnalysis(questions, company, role) {
  if (questions.length === 0) {
    return {
      summary: `No questions found for ${company}${role ? ` in ${role} role` : ''}`,
      topTopics: [],
      roleDistribution: [],
      frequencyAnalysis: {},
      timeAnalysis: {},
      sourceDistribution: {}
    };
  }
  
  // Tag analysis
  const allTags = questions.flatMap(q => {
    if (!q.tags) return [];
    return Array.isArray(q.tags) 
      ? q.tags.flatMap(tag => tag.split(/[;,]/).map(t => t.trim()).filter(Boolean))
      : q.tags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
  });
  
  const tagCounts = {};
  allTags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
  
  const topTopics = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: ((count / allTags.length) * 100).toFixed(1)
    }));
  
  // Role distribution
  const roleCounts = {};
  questions.forEach(q => {
    if (q.job_role) {
      roleCounts[q.job_role] = (roleCounts[q.job_role] || 0) + 1;
    }
  });
  
  const roleDistribution = Object.entries(roleCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([role, count]) => ({
      role,
      count,
      percentage: ((count / questions.length) * 100).toFixed(1)
    }));
  
  // Frequency analysis
  const questionsWithFrequency = questions.filter(q => q.frequency && q.frequency > 0);
  const frequencyAnalysis = {
    totalWithFrequency: questionsWithFrequency.length,
    averageFrequency: questionsWithFrequency.length > 0 
      ? (questionsWithFrequency.reduce((sum, q) => sum + q.frequency, 0) / questionsWithFrequency.length).toFixed(1)
      : 0,
    hotQuestions: questions
      .filter(q => q.frequency && q.frequency > 2)
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 10)
  };
  
  // Time analysis
  const questionsWithTime = questions.filter(q => q.time);
  const timeDistribution = {};
  questionsWithTime.forEach(q => {
    try {
      const year = new Date(q.time).getFullYear();
      if (!isNaN(year)) {
        timeDistribution[year] = (timeDistribution[year] || 0) + 1;
      }
    } catch (e) {
      // Handle invalid dates
    }
  });
  
  // Source distribution
  const sourceDistribution = {};
  questions.forEach(q => {
    const source = q.source || 'unknown';
    sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
  });
  
  return {
    summary: `Analysis for ${company}${role ? ` - ${role} role` : ''}: ${questions.length} total questions`,
    topTopics,
    roleDistribution,
    frequencyAnalysis,
    timeAnalysis: Object.entries(timeDistribution).sort(([a], [b]) => b - a),
    sourceDistribution
  };
}

export default router;
