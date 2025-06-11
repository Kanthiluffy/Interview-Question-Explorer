import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import questionsRouter from "./routes/questions.js";
import companiesRouter from "./routes/companies.js";
import { leetcodeQuestionsRouter } from "./routes/leetcodeQuestions.js";
import reportsRouter from "./routes/reports.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

// API routes
app.use("/api/questions", questionsRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/leetcode-questions", leetcodeQuestionsRouter);
app.use("/api/reports", reportsRouter);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing, return all requests that don't start with /api to React app
  app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  app.get("/", (req, res) => {
    res.send("Hello World - Development Mode");
  });
}

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  connectDB();
  console.log(`Server started at http://localhost:${PORT}`);
});

