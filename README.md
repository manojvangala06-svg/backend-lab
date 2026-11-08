# Lab 3: REST API, Query Parameters, Validation & Debugging

**Course:** Backend Development Fundamentals · Year II Term II  
**Institution:** Aurora Higher Education  
**Faculty:** Joel Prashanth D  
**Student:** Manoj Kumar  

---

## 📌 Project Overview
This repository contains the complete implementation of **Lab 3: RESTful API Development**, building upon Lab 2 to provide a production-ready, standardized REST API for a `/books` collection with parameterized SQLite queries, search, sorting, range filtering, pagination, robust input validation, proper HTTP status code handling, and an interactive static web showcase deployed on Vercel.

---

## 🌐 Live Interactive Web Showcase
An interactive browser client is included (`index.html`) allowing anyone to test all endpoints, filters, pagination, and validation rules in real time without local setup:
- **Repository:** [https://github.com/manojvangala06-svg/backend-lab](https://github.com/manojvangala06-svg/backend-lab)
- **Deployment:** Vercel (Auto-deployed from `main`)
- **Interactive Sandbox:** Live query simulator with instant status badges (`200`, `201`, `400`, `404`) and formatted JSON.
- **QA Matrix:** Visual breakdown of all 16 test cases.
- **Debugging Walkthrough:** Code diffs for the 4 lab debugging problems.

---

## 🚀 Features & Deliverables
- **Noun-Based REST Endpoints:** Resource identified by `/books` with actions mapped to standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
- **Flexible Query Parameters:**
  - `search_q`: Partial title match using parameterized SQL `LIKE ?`
  - `order_by`: Whitelisted column sorting (`id`, `title`, `author`, `price`)
  - `order`: Direction (`ASC` or `DESC`)
  - `limit` & `offset`: Defaulting to 10 and 0 respectively
- **Price Range Filter:** `min_price` and `max_price` supported using SQL `BETWEEN ? AND ?` or separate comparison conditions.
- **Strict Input Validation:**
  - `POST /books` rejects missing title, missing author, and non-numeric or negative prices with `400 Bad Request` and structured `{ "message": "..." }`.
- **Accurate HTTP Status Codes:**
  - `200 OK`: Successful retrieval, update, and deletion
  - `201 Created`: Successful creation
  - `400 Bad Request`: Validation failure
  - `404 Not Found`: Non-existent resource ID
  - `500 Internal Server Error`: Server errors
- **Debugging Resolutions:** Documented solutions for 4 standard backend bugs (`EADDRINUSE` port conflict, wrong import path, table-name typo, missing `await`).
- **Postman Test Collection:** Ready-to-import JSON collection (`postman_collection.json`) covering 16 test cases with both success and failure flows.
- **Laboratory Report:** Complete Word document (`Lab_3_REST_API_Report.docx`) with embedded visual test captures and viva answers.

---

## 📂 Project Structure
```text
lab3-rest-api/
├── .env.example              # Sample environment variable template
├── .gitignore                # Excludes node_modules, .env, and local SQLite DB
├── db.js                     # SQLite database setup with parameterized queries
├── package.json              # Project metadata and dependencies
├── postman_collection.json   # Exported Postman tests
├── README.md                 # Project documentation
├── server.js                 # Express server with EADDRINUSE handling
├── Lab_3_REST_API_Report.docx# Full lab report with embedded screenshots
├── debugging/
│   └── DEBUGGING_GUIDE.md    # Walkthrough of the 4 debugging bugs & fixes
├── routes/
│   └── books.js              # RESTful controller for /books
└── screenshots/              # 16 visual verification captures
    ├── 01_get_books_default.png
    ├── ...
    └── 16_delete_book_not_found.png
```

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manojvangala06-svg/backend-lab.git
   cd backend-lab
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   The server starts on `http://localhost:3000`. If port 3000 is occupied, it automatically falls back to an available port.

4. **Run automated test suite:**
   ```bash
   node test-and-capture.js
   ```

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Query / Body | Expected Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/books` | `limit=10&offset=0` | `200 OK` | Get all books with pagination |
| `GET` | `/books` | `search_q=Harry` | `200 OK` | Search by partial title (`LIKE`) |
| `GET` | `/books` | `order_by=price&order=DESC` | `200 OK` | Sort books by price descending |
| `GET` | `/books` | `min_price=20&max_price=40`| `200 OK` | Price range filtering (`BETWEEN`) |
| `GET` | `/books/:id` | None | `200 OK` | Retrieve single book by ID |
| `GET` | `/books/:id` | (Invalid ID) | `404 Not Found` | Non-existent book ID |
| `POST` | `/books` | `{ title, author, price }` | `201 Created` | Create new book |
| `POST` | `/books` | Missing field / bad price | `400 Bad Request` | Input validation failure |
| `PUT` | `/books/:id` | `{ title, author, price }` | `200 OK` | Update existing book |
| `DELETE` | `/books/:id` | None | `200 OK` | Delete book by ID |

---

## 🎓 Viva Voce Answers Summary

1. **Query parameter vs Path parameter:**
   - *Path parameter (`/books/:id`):* Identifies a specific unique resource entity. Mandatory.
   - *Query parameter (`/books?search_q=xyz`):* Modifies, filters, sorts, or paginates a resource collection without changing the target collection itself. Optional with defaults.

2. **What does stateless mean in REST?**
   - The server maintains no client session state between requests. Every HTTP request must contain all necessary data and context for the server to process it completely in isolation. Enables horizontal scaling and high reliability.

3. **Which status code for bad input vs a missing record?**
   - *Bad Input:* `400 Bad Request` (client provided invalid syntax, non-numeric values, or missed required fields).
   - *Missing Record:* `404 Not Found` (request syntax is valid, but the requested resource ID does not exist).

