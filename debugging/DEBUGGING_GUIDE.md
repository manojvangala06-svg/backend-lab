# Lab 3: Debugging Exercise - Common Backend Errors & Solutions

Faculty Exercise Scenario: Students are provided a broken version of the project and must diagnose and fix 4 common backend errors.

---

### Bug 1: Port Conflict (`EADDRINUSE`)
- **Error Observed:**
  ```text
  Error: listen EADDRINUSE: address already in use :::3000
      at Server.setupListenHandle [as _listen2] (node:net:1904:16)
      at listenInCluster (node:net:1961:12)
  ```
- **Root Cause:** Another process (e.g., an earlier zombie node process, another server, or terminal tab) is already occupying port 3000.
- **Solution / Fix:**
  1. Add error event listener on the HTTP server to gracefully catch `EADDRINUSE` and fall back to `port + 1` or notify the developer:
     ```javascript
     server.on('error', (err) => {
       if (err.code === 'EADDRINUSE') {
         console.warn(`Port ${port} in use, trying ${port + 1}`);
         startServer(port + 1);
       }
     });
     ```
  2. Alternatively, kill the rogue process on Windows via PowerShell:
     ```powershell
     Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
     ```

---

### Bug 2: Wrong Import Path (`MODULE_NOT_FOUND`)
- **Error Observed:**
  ```text
  Error: Cannot find module './routes/book'
  Require stack:
  - C:\...\server.js
      at Module._resolveFilename (node:internal/modules/cjs/loader:1225:15)
  ```
- **Root Cause:** `server.js` imported `require('./routes/book')` (singular) while the actual filename is `books.js` (plural) or the relative path was misspelled (`./bookRoutes`).
- **Solution / Fix:**
  Update the import statement in `server.js` to match the exact relative path and file name:
  ```javascript
  // Fixed:
  const bookRoutes = require('./routes/books');
  ```

---

### Bug 3: Table-Name Typo (`no such table`)
- **Error Observed:**
  ```text
  SqliteError: no such table: book
      at DatabaseSync.prepare (node:sqlite:...)
  ```
- **Root Cause:** The database schema created the table as `books` (plural noun), but the SQL query in a route mistakenly referenced `FROM book` (singular):
  ```javascript
  // Broken:
  const books = await db.all('SELECT * FROM book');
  ```
- **Solution / Fix:**
  Align table names across schema creation and SQL statements:
  ```javascript
  // Fixed:
  const books = await db.all('SELECT * FROM books');
  ```

---

### Bug 4: Missing `await` Keyword
- **Error Observed:**
  ```text
  // Server returns: {} or [object Promise], or client receives empty response before DB finishes,
  // or console logs: Promise { <pending> }
  ```
- **Root Cause:** Asynchronous database calls return a `Promise`. When `await` is omitted:
  ```javascript
  // Broken:
  router.get('/:id', async (req, res) => {
    const book = db.get('SELECT * FROM books WHERE id = ?', [req.params.id]); // Missing await!
    if (!book) return res.status(404).json({ message: 'Book not found' }); // Always truthy Promise!
    res.json(book); // Serializes Promise instead of data
  });
  ```
- **Solution / Fix:**
  Add the `await` keyword before any asynchronous database method invocation:
  ```javascript
  // Fixed:
  const book = await db.get('SELECT * FROM books WHERE id = ?', [req.params.id]);
  ```
