

## 💡 Project Overview

This is a full-stack web application for browsing and filtering **interview questions** grouped by **company** and **job role**. It uses:

* **Frontend**: React.js + Tailwind CSS
* **Backend**: Node.js + Express.js
* **Database**: MongoDB with Mongoose

---

## ✅ Coding Best Practices

### 🔷 General

* Use **clear and descriptive** variable/function names
* Keep code **modular**, **reusable**, and **well-commented**
* Use **async/await** for all asynchronous operations
* Use **timestamps** in MongoDB for tracking recency
* Let GitHub Copilot auto-suggest based on context by writing clear inline comments

---

## 🎨 Frontend (React + Tailwind CSS)

### Folder Structure

```
/src
  /components     # Reusable UI elements (e.g., QuestionCard, TagBadge)
  /pages          # Page views (e.g., HomePage, CompaniesPage)
  /api            # Axios-based API handlers
  /utils          # Helper functions like time formatting
```

### Best Practices

* Use **functional components** and **React hooks**
* Use **Tailwind** for styling, keep components atomic
* Split UI vs logic when components grow
* Use `useEffect` for fetching data and `useState` for local state
* Use `useParams` and `useNavigate` from `react-router-dom` for routing

### Example Copilot Prompt

```jsx
// A React component that displays a list of questions for a selected company and role, with tags, frequency, and recency
```

---

## 🌐 Backend (Node.js + Express)

### Folder Structure

```
/server
  /routes         # API routes (e.g., /questions, /companies)
  /controllers    # Business logic
  /models         # Mongoose schemas
  /middlewares    # Input validation, error handling
```

### Best Practices

* Use **Express Router** and **Mongoose models**
* Use `.env` for credentials and config
* Validate inputs and sanitize data
* Use pagination (`limit`, `skip`) for large lists
* Apply RESTful API conventions

---



---

## 📡 API Routes

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | /api/questions                     | Fetch all questions (filters: company, role) |
| GET    | /api/companies                     | Get list of companies                        |
| GET    | /api/companies/\:company/questions | Get questions by company                     |
| POST   | /api/questions                     | Create a new question                        |

---

## 🏠 Home Page

Display:

* All questions grouped or filtered by company/job role
* Show:

  * **question** (if it has a `link`, highlight or underline)
  * **recency** (e.g., “2 weeks ago”, calculated from `time`)
  * **frequency**
  * **tags** (display as badges or pills)

---

## 🏢 Companies Page

Display:

* List of all companies
* When a company is selected:

  * Show relevant questions, with:

    * **question** (linked if available)
    * **recency**
    * **frequency**
    * **tags**

---

## 🧠 Utility Functions (Frontend)

Create a helper like this to compute relative time:

```js
// utils/timeUtils.js
export function getRecency(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
```

