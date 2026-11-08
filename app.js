// Initial Database State for the Live Simulator
const initialBooks = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 15.99 },
  { id: 2, title: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", price: 42.50 },
  { id: 3, title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 29.99 },
  { id: 4, title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", price: 24.95 },
  { id: 5, title: "Harry Potter and the Chamber of Secrets", author: "J.K. Rowling", price: 25.50 },
  { id: 6, title: "Introduction to Algorithms", author: "Thomas H. Cormen", price: 85.00 },
  { id: 7, title: "Design Patterns: Elements of Reusable Object-Oriented Software", author: "Erich Gamma", price: 54.00 },
  { id: 8, title: "You Don't Know JS Yet", author: "Kyle Simpson", price: 34.99 },
  { id: 9, title: "To Kill a Mockingbird", author: "Harper Lee", price: 12.99 },
  { id: 10, title: "1984", author: "George Orwell", price: 14.50 },
  { id: 11, title: "Brave New World", author: "Aldous Huxley", price: 16.00 }
];

let simulatedDb = JSON.parse(JSON.stringify(initialBooks));
let nextId = 12;

// Real Test Suite Results from Lab Run
const testResults = [
  {
    id: "01",
    name: "Default List with Pagination",
    category: "Query & Pagination",
    method: "GET",
    endpoint: "/books",
    status: 200,
    desc: "Retrieves books with default limit=10, offset=0"
  },
  {
    id: "02",
    name: "Search Query Filter",
    category: "Query & Filtering",
    method: "GET",
    endpoint: "/books?search_q=Harry",
    status: 200,
    desc: "SQL parameterized LIKE %Harry% matching 2 books"
  },
  {
    id: "03",
    name: "Sort by Price DESC",
    category: "Sorting",
    method: "GET",
    endpoint: "/books?order_by=price&order=DESC",
    status: 200,
    desc: "Whitelisted column sort descending from highest price"
  },
  {
    id: "04",
    name: "Sort by Title ASC",
    category: "Sorting",
    method: "GET",
    endpoint: "/books?order_by=title&order=ASC",
    status: 200,
    desc: "Whitelisted column sort ascending by title"
  },
  {
    id: "05",
    name: "Price Range Filter",
    category: "Query & Filtering",
    method: "GET",
    endpoint: "/books?min_price=20&max_price=30",
    status: 200,
    desc: "SQL parameterized BETWEEN 20 AND 30"
  },
  {
    id: "06",
    name: "Custom Pagination",
    category: "Query & Pagination",
    method: "GET",
    endpoint: "/books?limit=3&offset=3",
    status: 200,
    desc: "Pagination window limit=3 offset=3"
  },
  {
    id: "07",
    name: "Get Book by ID (Found)",
    category: "CRUD",
    method: "GET",
    endpoint: "/books/1",
    status: 200,
    desc: "Fetch single resource by primary key ID=1"
  },
  {
    id: "08",
    name: "Get Book by ID (Not Found)",
    category: "CRUD",
    method: "GET",
    endpoint: "/books/9999",
    status: 404,
    desc: "Non-existent resource returns 404 Not Found"
  },
  {
    id: "09",
    name: "Create Book (Valid)",
    category: "Validation",
    method: "POST",
    endpoint: "/books",
    status: 201,
    desc: "Valid payload creates new book and returns 201 Created"
  },
  {
    id: "10",
    name: "Create Book (Missing Title)",
    category: "Validation",
    method: "POST",
    endpoint: "/books",
    status: 400,
    desc: "Rejects payload missing title with 400 Bad Request"
  },
  {
    id: "11",
    name: "Create Book (Missing Author)",
    category: "Validation",
    method: "POST",
    endpoint: "/books",
    status: 400,
    desc: "Rejects payload missing author with 400 Bad Request"
  },
  {
    id: "12",
    name: "Create Book (Invalid Price)",
    category: "Validation",
    method: "POST",
    endpoint: "/books",
    status: 400,
    desc: "Rejects non-numeric/negative price with 400 Bad Request"
  },
  {
    id: "13",
    name: "Update Book (Found)",
    category: "CRUD",
    method: "PUT",
    endpoint: "/books/1",
    status: 200,
    desc: "Updates existing book title and price with 200 OK"
  },
  {
    id: "14",
    name: "Update Book (Not Found)",
    category: "CRUD",
    method: "PUT",
    endpoint: "/books/9999",
    status: 404,
    desc: "Updating non-existent ID returns 404 Not Found"
  },
  {
    id: "15",
    name: "Delete Book (Found)",
    category: "CRUD",
    method: "DELETE",
    endpoint: "/books/2",
    status: 200,
    desc: "Deletes existing book with 200 OK"
  },
  {
    id: "16",
    name: "Delete Book (Not Found)",
    category: "CRUD",
    method: "DELETE",
    endpoint: "/books/9999",
    status: 404,
    desc: "Deleting non-existent ID returns 404 Not Found"
  }
];

// Execute Mock Request Function
function executeMockRequest(method, url, bodyText) {
  const parsedUrl = new URL(url, "http://localhost:3000");
  const path = parsedUrl.pathname;
  const params = parsedUrl.searchParams;

  // Simulate network latency (20ms - 60ms)
  const latency = Math.floor(Math.random() * 40) + 20;

  // GET /books
  if (method === "GET" && path === "/books") {
    let result = [...simulatedDb];

    // Filter search_q
    const searchQ = params.get("search_q");
    if (searchQ) {
      result = result.filter(b => b.title.toLowerCase().includes(searchQ.toLowerCase()));
    }

    // Filter min_price & max_price
    const minPrice = params.get("min_price");
    const maxPrice = params.get("max_price");
    if (minPrice !== null && !isNaN(minPrice)) {
      result = result.filter(b => b.price >= parseFloat(minPrice));
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      result = result.filter(b => b.price <= parseFloat(maxPrice));
    }

    // Sort order_by & order
    const orderBy = (params.get("order_by") || "id").toLowerCase();
    const order = (params.get("order") || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";
    const allowedColumns = ["id", "title", "author", "price"];

    if (allowedColumns.includes(orderBy)) {
      result.sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return order === "ASC" ? -1 : 1;
        if (valA > valB) return order === "ASC" ? 1 : -1;
        return 0;
      });
    }

    // Pagination limit & offset
    const limit = parseInt(params.get("limit") || "10", 10);
    const offset = parseInt(params.get("offset") || "0", 10);
    result = result.slice(offset, offset + limit);

    return {
      status: 200,
      statusText: "OK",
      latency,
      data: result
    };
  }

  // GET /books/:id
  const matchGetId = path.match(/^\/books\/(\d+)$/);
  if (method === "GET" && matchGetId) {
    const id = parseInt(matchGetId[1], 10);
    const book = simulatedDb.find(b => b.id === id);
    if (!book) {
      return { status: 404, statusText: "Not Found", latency, data: { message: "Book not found" } };
    }
    return { status: 200, statusText: "OK", latency, data: book };
  }

  // POST /books
  if (method === "POST" && path === "/books") {
    let body;
    try {
      body = JSON.parse(bodyText || "{}");
    } catch (e) {
      return { status: 400, statusText: "Bad Request", latency, data: { message: "Invalid JSON format" } };
    }

    const { title, author, price } = body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return { status: 400, statusText: "Bad Request", latency, data: { message: "Title is required and must be a non-empty string" } };
    }
    if (!author || typeof author !== 'string' || !author.trim()) {
      return { status: 400, statusText: "Bad Request", latency, data: { message: "Author is required and must be a non-empty string" } };
    }
    if (price === undefined || typeof price !== 'number' || isNaN(price) || price < 0) {
      return { status: 400, statusText: "Bad Request", latency, data: { message: "Price is required and must be a non-negative number" } };
    }

    const newBook = { id: nextId++, title: title.trim(), author: author.trim(), price: parseFloat(price) };
    simulatedDb.push(newBook);
    return { status: 201, statusText: "Created", latency, data: { message: "Book added successfully", bookId: newBook.id } };
  }

  // PUT /books/:id
  const matchPutId = path.match(/^\/books\/(\d+)$/);
  if (method === "PUT" && matchPutId) {
    const id = parseInt(matchPutId[1], 10);
    const bookIndex = simulatedDb.findIndex(b => b.id === id);
    if (bookIndex === -1) {
      return { status: 404, statusText: "Not Found", latency, data: { message: "Book not found" } };
    }

    let body;
    try {
      body = JSON.parse(bodyText || "{}");
    } catch (e) {
      return { status: 400, statusText: "Bad Request", latency, data: { message: "Invalid JSON format" } };
    }

    const existing = simulatedDb[bookIndex];
    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.author !== undefined) existing.author = String(body.author).trim();
    if (body.price !== undefined && !isNaN(body.price)) existing.price = parseFloat(body.price);

    return { status: 200, statusText: "OK", latency, data: { message: "Book updated successfully" } };
  }

  // DELETE /books/:id
  const matchDeleteId = path.match(/^\/books\/(\d+)$/);
  if (method === "DELETE" && matchDeleteId) {
    const id = parseInt(matchDeleteId[1], 10);
    const bookIndex = simulatedDb.findIndex(b => b.id === id);
    if (bookIndex === -1) {
      return { status: 404, statusText: "Not Found", latency, data: { message: "Book not found" } };
    }
    simulatedDb.splice(bookIndex, 1);
    return { status: 200, statusText: "OK", latency, data: { message: "Book deleted successfully" } };
  }

  return { status: 404, statusText: "Not Found", latency, data: { message: "Resource not found" } };
}

// UI Initialization
document.addEventListener("DOMContentLoaded", () => {
  const methodSelect = document.getElementById("req-method");
  const urlInput = document.getElementById("req-url");
  const bodyGroup = document.getElementById("req-body-group");
  const bodyTextarea = document.getElementById("req-body");
  const sendBtn = document.getElementById("btn-send-req");
  const statusBadge = document.getElementById("resp-status-badge");
  const durationTag = document.getElementById("resp-duration");
  const codeOutput = document.getElementById("resp-code-output");
  const testGrid = document.getElementById("test-grid-container");

  // Show/hide body textarea based on method
  function updateBodyVisibility() {
    const m = methodSelect.value;
    if (m === "POST" || m === "PUT") {
      bodyGroup.style.display = "flex";
      if (!bodyTextarea.value.trim()) {
        bodyTextarea.value = JSON.stringify({
          title: "Designing Data-Intensive Applications",
          author: "Martin Kleppmann",
          price: 45.99
        }, null, 2);
      }
    } else {
      bodyGroup.style.display = "none";
    }
  }

  methodSelect.addEventListener("change", updateBodyVisibility);

  // Send Request Handler
  function handleSend() {
    const method = methodSelect.value;
    const url = urlInput.value.trim();
    const bodyText = bodyTextarea.value;

    const res = executeMockRequest(method, url, bodyText);

    // Update Status Badge
    statusBadge.textContent = `${res.status} ${res.statusText}`;
    statusBadge.className = `status-badge status-${res.status}`;

    // Update Latency
    durationTag.textContent = `${res.latency}ms`;

    // Update Response Body with indentation
    codeOutput.textContent = JSON.stringify(res.data, null, 2);
  }

  sendBtn.addEventListener("click", handleSend);

  // Preset Buttons
  document.querySelectorAll(".btn-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const method = btn.getAttribute("data-method");
      const url = btn.getAttribute("data-url");
      const body = btn.getAttribute("data-body");

      methodSelect.value = method;
      urlInput.value = url;
      if (body) {
        bodyTextarea.value = body;
      }
      updateBodyVisibility();
      handleSend();
    });
  });

  // Render Test Matrix
  if (testGrid) {
    testGrid.innerHTML = testResults.map(t => `
      <div class="test-card">
        <div class="test-card-top">
          <span class="method-tag method-${t.method}">${t.method}</span>
          <span class="status-badge status-${t.status}">${t.status}</span>
        </div>
        <div class="test-card-title">${t.name}</div>
        <div class="test-card-endpoint">${t.endpoint}</div>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">${t.desc}</p>
      </div>
    `).join("");
  }

  // Initial Execute on Load
  handleSend();
});
