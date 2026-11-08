const express = require('express');
const path = require('path');
const bookRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Serve static files for documentation showcase (style.css, app.js, etc.)
app.use(express.static(__dirname));

// Root endpoint: serves interactive showcase for browser, or JSON schema for API clients
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  res.status(200).json({
    message: 'Backend Development Fundamentals - Lab 3 REST API is running!',
    endpoints: {
      getAllBooks: 'GET /books',
      searchBooks: 'GET /books?search_q={query}',
      filterByPrice: 'GET /books?min_price={min}&max_price={max}',
      sortBooks: 'GET /books?order_by={column}&order={ASC|DESC}',
      paginateBooks: 'GET /books?limit={limit}&offset={offset}',
      getBookById: 'GET /books/:id',
      createBook: 'POST /books',
      updateBook: 'PUT /books/:id',
      deleteBook: 'DELETE /books/:id'
    }
  });
});

// Mount books resource routes
app.use('/books', bookRoutes);

// Consistent 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Consistent 500 error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server with robust EADDRINUSE handling
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server successfully started and listening on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[DEBUGGING FIX] Port ${port} is already in use (EADDRINUSE). Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = { app, startServer };

