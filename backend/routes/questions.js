import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import validateQuestion from '../middlewares/validateQuestion.js';

// Use native driver for interview_questions
const InterviewQuestion = () => mongoose.connection.collection('interview_questions');

// GET /api/questions - fetch all questions with optional filters
router.get('/', async (req, res) => {
  try {
    const { company, role, recency, limit, skip } = req.query;
    const filter = {};
    if (company) filter.company_name = company;
    if (role) filter.job_role = role;
    if (recency) {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(recency));
      filter.time = { $gte: since.toISOString().split('T')[0] };
    }
    
    const collection = InterviewQuestion();
    let query = collection.find(filter);
    if (skip) query = query.skip(Number(skip));
    if (limit) query = query.limit(Number(limit));
    
    const questions = await query.toArray();
    res.json(questions);
  } catch (err) {
    console.error('Error in questions route:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/questions - create a new question
router.post('/', validateQuestion, async (req, res) => {
  try {
    const result = await InterviewQuestion().insertOne(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
