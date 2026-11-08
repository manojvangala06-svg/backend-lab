let database = null;
let isInMemoryFallback = false;

const initialBooksData = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 15.99 },
  { id: 2, title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', price: 42.50 },
  { id: 3, title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 29.99 },
  { id: 4, title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', price: 24.95 },
  { id: 5, title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling', price: 25.50 },
  { id: 6, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', price: 85.00 },
  { id: 7, title: 'Node.js Web Development', author: 'David Herron', price: 34.99 },
  { id: 8, title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', price: 48.00 },
  { id: 9, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma', price: 54.00 },
  { id: 10, title: 'You Don\'t Know JS: Scope & Closures', author: 'Kyle Simpson', price: 19.99 }
];

try {
  const { DatabaseSync } = require('node:sqlite');
  const path = require('node:path');
  // Use in-memory database on Vercel to avoid read-only filesystem restrictions
  const dbPath = process.env.VERCEL ? ':memory:' : path.join(__dirname, 'books.db');
  database = new DatabaseSync(dbPath);

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
    for (const b of initialBooksData) {
      insertStmt.run(b.title, b.author, b.price);
    }
  }
} catch (err) {
  console.warn('[db.js] Native node:sqlite not available or read-only, falling back to in-memory store:', err.message);
  isInMemoryFallback = true;
}

let memoryBooks = JSON.parse(JSON.stringify(initialBooksData));
let memoryNextId = 11;

const db = {
  async all(sql, params = []) {
    if (!isInMemoryFallback && database) {
      const stmt = database.prepare(sql);
      return stmt.all(...params);
    }
    // Simple memory parser for fallback
    let result = [...memoryBooks];
    if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
      const search = params[0].replace(/%/g, '').toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(search));
    }
    return result;
  },
  async get(sql, params = []) {
    if (!isInMemoryFallback && database) {
      const stmt = database.prepare(sql);
      return stmt.get(...params);
    }
    if (params.length > 0) {
      const id = parseInt(params[0], 10);
      return memoryBooks.find(b => b.id === id) || null;
    }
    return memoryBooks[0] || null;
  },
  async run(sql, params = []) {
    if (!isInMemoryFallback && database) {
      const stmt = database.prepare(sql);
      return stmt.run(...params);
    }
    if (sql.includes('INSERT')) {
      const newBook = { id: memoryNextId++, title: params[0], author: params[1], price: parseFloat(params[2]) };
      memoryBooks.push(newBook);
      return { lastInsertRowid: newBook.id };
    }
    if (sql.includes('UPDATE')) {
      const id = parseInt(params[3], 10);
      const b = memoryBooks.find(item => item.id === id);
      if (b) {
        b.title = params[0];
        b.author = params[1];
        b.price = parseFloat(params[2]);
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (sql.includes('DELETE')) {
      const id = parseInt(params[0], 10);
      const idx = memoryBooks.findIndex(item => item.id === id);
      if (idx !== -1) {
        memoryBooks.splice(idx, 1);
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

module.exports = db;
