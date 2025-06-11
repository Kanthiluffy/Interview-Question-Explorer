# 📄 Product Requirements Document

## 📌 Project Title

**Interview Question Explorer**

---

## 🎯 Overview

The Interview Question Explorer is an internal web application designed to help developers and engineering candidates browse, review, and filter technical interview questions grouped by **company** and **job role**. The tool will display questions uploaded via pre-formatted Excel/CSV files and allow users to navigate questions by frequency, tags, and recency.

---

## 🧭 Goals

* Enable internal teams to browse and explore interview questions by company and role.
* Simplify access to important metadata like frequency and recency.
* Improve interview preparation and internal knowledge sharing.

---

## 💻 Platform

* **Frontend**: React.js + Tailwind CSS
* **Backend**: Node.js + Express.js
* **Database**: MongoDB (via Mongoose)
* **Deployment**: Cloud Platform (e.g., Vercel, AWS)

---

## ✅ Features

### 🏠 Home Page 

* List all interview questions in a scrollable or paginated format

* Each question row should display the following:

  * **Company**
  * **Role**
  * **Question**: Display question text.

    * If a link is provided, make the text clickable and **visually distinct (e.g., blue or underlined)**.
  * **Recency**: Show relative time since the question was asked (e.g., “3 days ago” or “2 months ago”) based on the `time` field
  * **Frequency**: E.g., "Rare", "Moderate", "Frequent"
  * **Tags**: Display as colored badges (e.g., “DP”, “Graph”, “SQL”)

* Optional features:

  * Allow filtering/sorting by frequency or recency
  * Allow filtering by tags

### Companies Page

* List all available companies (extracted from uploaded data)
* When a company is selected:

  * Display questions associated with all roles at that company
  * Same metadata as the Home Page without company


## 🔎 Filters and Tags

* Allow filtering by:

  * Tags (e.g., "DP", "SQL", "Trees")
  * Frequency (e.g., "Frequent", "Rare")
  * Recency (e.g., show questions asked in the past month)

---

## 📱 Responsiveness

* Mobile and tablet support (responsive layout via Tailwind CSS)
* Adjust UI for smaller viewports (collapsible filters, adaptive grid)

---

## 🔐 Security

* No login/authentication
* Internal use only
* No spam protection or rate-limiting required

---


## 🚫 Not in Scope

* User accounts or login
* Public access
* Admin dashboard or web-based upload
* Advanced analytics (charts, graphs)

---

## 📈 Success Metrics

* All valid Excel and CSV files are imported without duplicates
* Users can browse company-role questions easily
* Tags, links, and recency render clearly across devices
* Fast load time for up to 10,000 questions

---


