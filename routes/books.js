const express = require('express');
const router = express.Router();
const db = require('../db');

// Allowed columns for sorting to prevent SQL injection in ORDER BY clause
const ALLOWED_ORDER_COLUMNS = ['id', 'title', 'author', 'price'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

/**
 * GET /books
 * Supports query parameters:
 * - search_q: partial title match (LIKE %search_q%)
 * - min_price: filter price >= min_price
 * - max_price: filter price <= max_price
 * - order_by: column to sort by (default: 'id')
 * - order: sorting direction ASC or DESC (default: 'ASC')
 * - limit: max rows to return (default: 10)
 * - offset: starting offset (default: 0)
 */
router.get('/', async (req, res) => {
  try {
    const {
      search_q,
      min_price,
      max_price,
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0'
    } = req.query;

    const whereClauses = [];
    const params = [];

    // Search by partial title match using parameterised LIKE
    if (search_q !== undefined && search_q !== null && search_q.trim() !== '') {
      whereClauses.push('title LIKE ?');
      params.push(`%${search_q.trim()}%`);
    }

    // Price range filters using parameterised conditions
    if (min_price !== undefined && min_price !== '' && max_price !== undefined && max_price !== '') {
      const min = parseFloat(min_price);
      const max = parseFloat(max_price);
      if (!isNaN(min) && !isNaN(max)) {
        whereClauses.push('price BETWEEN ? AND ?');
        params.push(min, max);
      }
    } else if (min_price !== undefined && min_price !== '') {
      const min = parseFloat(min_price);
      if (!isNaN(min)) {
        whereClauses.push('price >= ?');
        params.push(min);
      }
    } else if (max_price !== undefined && max_price !== '') {
      const max = parseFloat(max_price);
      if (!isNaN(max)) {
        whereClauses.push('price <= ?');
        params.push(max);
      }
    }

    // Build WHERE clause
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Validate and sanitize ORDER BY column and direction
    const sanitizedOrderBy = ALLOWED_ORDER_COLUMNS.includes(order_by.toLowerCase())
      ? order_by.toLowerCase()
      : 'id';
    const sanitizedOrder = ALLOWED_ORDER_DIRECTIONS.includes(order.toUpperCase())
      ? order.toUpperCase()
      : 'ASC';

    // Validate and parse limit and offset
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

    // Final SQL query with parameterised placeholders
    const sql = `SELECT * FROM books ${whereSql} ORDER BY ${sanitizedOrderBy} ${sanitizedOrder} LIMIT ? OFFSET ?`;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(sql, params);
    return res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books/:id
 * Retrieve a single book by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }

    const book = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /books
 * Create a new book with validation
 */
router.post('/', async (req, res) => {
  try {
    const { title, author, price } = req.body;

    // Validation: Title required
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Validation: Author required
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: 'Author is required' });
    }

    // Validation: Price must be numeric and non-negative
    if (price === undefined || price === null || price === '' || isNaN(Number(price))) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }

    const numericPrice = Number(price);
    if (numericPrice < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    // Parameterised INSERT query
    const result = await db.run(
      'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
      [title.trim(), author.trim(), numericPrice]
    );

    const createdBook = {
      id: Number(result.lastInsertRowid),
      title: title.trim(),
      author: author.trim(),
      price: numericPrice
    };

    return res.status(201).json(createdBook);
  } catch (error) {
    console.error('Error creating book:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /books/:id
 * Update an existing book with validation
 */
router.put('/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }

    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author, price } = req.body;

    // Validate provided fields
    const updatedTitle = title !== undefined ? String(title).trim() : existingBook.title;
    const updatedAuthor = author !== undefined ? String(author).trim() : existingBook.author;
    let updatedPrice = existingBook.price;

    if (!updatedTitle) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }
    if (!updatedAuthor) {
      return res.status(400).json({ message: 'Author cannot be empty' });
    }

    if (price !== undefined) {
      if (price === null || price === '' || isNaN(Number(price))) {
        return res.status(400).json({ message: 'Price must be a valid number' });
      }
      updatedPrice = Number(price);
      if (updatedPrice < 0) {
        return res.status(400).json({ message: 'Price cannot be negative' });
      }
    }

    await db.run(
      'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
      [updatedTitle, updatedAuthor, updatedPrice, bookId]
    );

    const updatedBook = {
      id: bookId,
      title: updatedTitle,
      author: updatedAuthor,
      price: updatedPrice
    };

    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /books/:id
 * Delete a book by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }

    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await db.run('DELETE FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

