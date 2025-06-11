import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import questionsRouter from "./routes/questions.js";
import companiesRouter from "./routes/companies.js";
import { leetcodeQuestionsRouter } from "./routes/leetcodeQuestions.js";
import reportsRouter from "./routes/reports.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

// API routes
app.use("/api/questions", questionsRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/leetcode-questions", leetcodeQuestionsRouter);
app.use("/api/reports", reportsRouter);

// Error handler
app.use(errorHandler);

app.listen(5000, () => {
  connectDB();
  console.log("Server started at http://localhost:5000");
});

