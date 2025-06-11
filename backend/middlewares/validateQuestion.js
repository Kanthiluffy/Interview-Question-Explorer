import { body, validationResult } from 'express-validator';

const validateQuestion = [
  body('question').notEmpty().withMessage('Question is required'),
  body('company_name').notEmpty().withMessage('Company name is required'),
  body('job_role').notEmpty().withMessage('Job role is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export default validateQuestion;
