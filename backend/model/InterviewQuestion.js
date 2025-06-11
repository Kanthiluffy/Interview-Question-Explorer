import mongoose from "mongoose";

// Interview Question Schema matching actual DB fields
const InterviewQuestionSchema = new mongoose.Schema({
  question: { type: String },
  time: { type: String },
  topics: { type: mongoose.Schema.Types.Mixed },
  technical_terms: { type: mongoose.Schema.Types.Mixed },
  company_name: { type: String },
  job_role: { type: String }
}, { 
  strict: false, // Allow fields not defined in schema
  collection: 'interview_questions' 
});

export default mongoose.model("InterviewQuestion", InterviewQuestionSchema);
