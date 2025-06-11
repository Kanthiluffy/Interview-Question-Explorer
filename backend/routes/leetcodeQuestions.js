import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';

// Use native driver for leetcode_questions
const LeetcodeQuestion = () => mongoose.connection.collection('leetcode_questions');

// GET /api/leetcode-companies - get list of unique companies from leetcode_questions
router.get('/companies', async (req, res) => {
  try {
    const companies = await LeetcodeQuestion().distinct('company_name');
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leetcode-questions - fetch all or by company
router.get('/', async (req, res) => {
  try {
    const { company } = req.query;
    const filter = {};
    if (company) filter.company_name = company;
    const questions = await LeetcodeQuestion().find(filter).toArray();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as leetcodeQuestionsRouter };
