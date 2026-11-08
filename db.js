const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'books.db');
const database = new DatabaseSync(dbPath);

// Initialize table
database.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL
  )
`);

// Seed default records if table is empty
const countStmt = database.prepare('SELECT COUNT(*) as count FROM books');
const { count } = countStmt.get();

if (count === 0) {
  const insertStmt = database.prepare('INSERT INTO books (title, author, price) VALUES (?, ?, ?)');
  const initialBooks = [
    ['The Great Gatsby', 'F. Scott Fitzgerald', 15.99],
    ['Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 42.50],
    ['JavaScript: The Good Parts', 'Douglas Crockford', 29.99],
    ['Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', 24.95],
    ['Harry Potter and the Chamber of Secrets', 'J.K. Rowling', 25.50],
    ['Introduction to Algorithms', 'Thomas H. Cormen', 85.00],
    ['Node.js Web Development', 'David Herron', 34.99],
    ['Refactoring: Improving the Design of Existing Code', 'Martin Fowler', 48.00],
    ['Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma', 54.00],
    ['You Don\'t Know JS: Scope & Closures', 'Kyle Simpson', 19.99]
  ];

  for (const book of initialBooks) {
    insertStmt.run(...book);
  }
}

// Async wrapper simulating typical database interface with Promises
const db = {
  async all(sql, params = []) {
    const stmt = database.prepare(sql);
    return stmt.all(...params);
  },
  async get(sql, params = []) {
    const stmt = database.prepare(sql);
    return stmt.get(...params);
  },
  async run(sql, params = []) {
    const stmt = database.prepare(sql);
    return stmt.run(...params);
  }
};

module.exports = db;
