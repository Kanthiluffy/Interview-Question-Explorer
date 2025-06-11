import express from 'express';
const router = express.Router();
import InterviewQuestion from '../model/InterviewQuestion.js';

// GET /api/companies - get list of companies
router.get('/', async (req, res) => {
  try {
    const companies = await InterviewQuestion.distinct('company_name');
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:company/questions - get questions by company
router.get('/:company/questions', async (req, res) => {
  try {
    const { company } = req.params;
    const questions = await InterviewQuestion.find({ company_name: company });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
