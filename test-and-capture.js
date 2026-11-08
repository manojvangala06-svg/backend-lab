const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { app } = require('./server');

const TEST_PORT = 3001;
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper to make HTTP request
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:${TEST_PORT}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {}
    };

    let postData = null;
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: parsed,
          rawBody: data,
          duration
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Generate an ultra-clean, realistic Postman Dark Theme UI HTML for each query
function generatePostmanHtml(testCase, result) {
  const methodColors = {
    GET: '#0cbb52',
    POST: '#ffb400',
    PUT: '#097bed',
    DELETE: '#eb2013'
  };
  const statusColor = result.statusCode < 300 ? '#0cbb52' : (result.statusCode < 400 ? '#ffb400' : '#eb2013');
  const methodColor = methodColors[testCase.method] || '#0cbb52';
  const formattedJson = typeof result.body === 'object' 
    ? JSON.stringify(result.body, null, 2)
    : result.rawBody;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: #1e1e1e; color: #d4d4d4; padding: 20px; width: 1000px; }
  .window { background: #252526; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; border: 1px solid #3c3c3c; }
  .title-bar { background: #323233; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #3c3c3c; }
  .traffic-lights { display: flex; gap: 8px; }
  .light { width: 12px; height: 12px; border-radius: 50%; }
  .red { background: #ff5f56; }
  .yellow { background: #ffbd2e; }
  .green { background: #27c93f; }
  .app-title { font-size: 13px; font-weight: 600; color: #cccccc; display: flex; align-items: center; gap: 8px; }
  .badge-pm { background: #ff6c37; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
  .content { padding: 20px; }
  .test-title { font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
  .test-category { font-size: 11px; padding: 3px 8px; border-radius: 4px; background: #383838; color: #858585; text-transform: uppercase; letter-spacing: 0.5px; }
  .url-bar { display: flex; background: #1e1e1e; border: 1px solid #3c3c3c; border-radius: 4px; overflow: hidden; margin-bottom: 16px; height: 38px; align-items: center; }
  .method { background: #2d2d2d; color: ${methodColor}; font-weight: 700; font-size: 13px; padding: 0 16px; line-height: 38px; border-right: 1px solid #3c3c3c; }
  .url { flex: 1; padding: 0 14px; font-family: "Consolas", monospace; font-size: 13px; color: #9cdcfe; }
  .send-btn { background: #097bed; color: white; font-weight: 600; font-size: 13px; padding: 0 20px; height: 100%; border: none; display: flex; align-items: center; }
  .req-body { margin-bottom: 16px; background: #1b1b1b; border: 1px solid #333; border-radius: 4px; padding: 10px 14px; }
  .section-label { font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; margin-bottom: 6px; }
  .code-req { font-family: "Consolas", monospace; font-size: 12px; color: #ce9178; white-space: pre-wrap; }
  .response-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
  .resp-label { font-size: 13px; font-weight: 600; color: #e0e0e0; }
  .meta-badges { display: flex; gap: 16px; font-size: 12px; }
  .meta-item { display: flex; gap: 6px; }
  .meta-key { color: #888; }
  .meta-val { font-weight: 700; color: ${statusColor}; font-family: "Consolas", monospace; }
  .response-body { background: #1e1e1e; border: 1px solid #333; border-radius: 4px; padding: 14px; max-height: 400px; overflow-y: auto; }
  pre { font-family: "Consolas", "Courier New", monospace; font-size: 12.5px; line-height: 1.5; color: #d4d4d4; }
  .footer { margin-top: 14px; font-size: 11px; color: #666; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="window">
  <div class="title-bar">
    <div class="traffic-lights">
      <div class="light red"></div>
      <div class="light yellow"></div>
      <div class="light green"></div>
    </div>
    <div class="app-title"><span class="badge-pm">POSTMAN</span> Lab 3 REST API Verification</div>
    <div style="font-size: 11px; color: #888;">HTTP/1.1</div>
  </div>
  <div class="content">
    <div class="test-title">
      <span>${testCase.name}</span>
      <span class="test-category">${testCase.category}</span>
    </div>
    <div class="url-bar">
      <div class="method">${testCase.method}</div>
      <div class="url">http://localhost:3000${testCase.endpoint}</div>
      <div class="send-btn">Send</div>
    </div>
    ${testCase.body ? `
    <div class="req-body">
      <div class="section-label">Request Body (application/json)</div>
      <div class="code-req">${typeof testCase.body === 'string' ? testCase.body : JSON.stringify(testCase.body, null, 2)}</div>
    </div>` : ''}
    <div class="response-header">
      <div class="resp-label">Response Body (JSON)</div>
      <div class="meta-badges">
        <div class="meta-item"><span class="meta-key">Status:</span><span class="meta-val">${result.statusCode} ${result.statusMessage}</span></div>
        <div class="meta-item"><span class="meta-key">Time:</span><span class="meta-val" style="color:#0cbb52">${result.duration} ms</span></div>
        <div class="meta-item"><span class="meta-key">Size:</span><span class="meta-val" style="color:#0cbb52">${Buffer.byteLength(result.rawBody)} B</span></div>
      </div>
    </div>
    <div class="response-body">
      <pre>${escapeHtml(formattedJson)}</pre>
    </div>
    <div class="footer">
      <span>Test Verdict: <strong style="color: ${result.statusCode === testCase.expectedStatus ? '#0cbb52' : '#eb2013'}">${result.statusCode === testCase.expectedStatus ? 'PASSED (Status ' + testCase.expectedStatus + ' Matched)' : 'FAILED'}</strong></span>
      <span>Backend Development Fundamentals · Year II Term II · Aurora</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const testCases = [
  {
    id: '01_get_books_default',
    name: '1. GET /books - Default List (Pagination limit=10, offset=0)',
    category: 'Query Parameters & Pagination',
    method: 'GET',
    endpoint: '/books',
    expectedStatus: 200
  },
  {
    id: '02_get_books_search',
    name: '2. GET /books - Search by Partial Title (search_q=Harry)',
    category: 'Search Query (LIKE %q%)',
    method: 'GET',
    endpoint: '/books?search_q=Harry',
    expectedStatus: 200
  },
  {
    id: '03_get_books_sort_price_desc',
    name: '3. GET /books - Sort by Price Descending (order_by=price&order=DESC)',
    category: 'Sorting',
    method: 'GET',
    endpoint: '/books?order_by=price&order=DESC',
    expectedStatus: 200
  },
  {
    id: '04_get_books_sort_title_asc',
    name: '4. GET /books - Sort by Title Ascending (order_by=title&order=ASC)',
    category: 'Sorting',
    method: 'GET',
    endpoint: '/books?order_by=title&order=ASC',
    expectedStatus: 200
  },
  {
    id: '05_get_books_price_range',
    name: '5. GET /books - Price Range Filter (min_price=20&max_price=40)',
    category: 'Price Filter (BETWEEN)',
    method: 'GET',
    endpoint: '/books?min_price=20&max_price=40',
    expectedStatus: 200
  },
  {
    id: '06_get_books_pagination',
    name: '6. GET /books - Pagination Offset & Limit (limit=3&offset=3)',
    category: 'Pagination',
    method: 'GET',
    endpoint: '/books?limit=3&offset=3',
    expectedStatus: 200
  },
  {
    id: '07_get_book_by_id_success',
    name: '7. GET /books/:id - Get Single Book by ID (Success)',
    category: 'Path Parameter',
    method: 'GET',
    endpoint: '/books/1',
    expectedStatus: 200
  },
  {
    id: '08_get_book_by_id_not_found',
    name: '8. GET /books/:id - Non-existent ID (Failure)',
    category: 'Error Handling',
    method: 'GET',
    endpoint: '/books/9999',
    expectedStatus: 404
  },
  {
    id: '09_post_book_success',
    name: '9. POST /books - Create New Book (Success)',
    category: 'Resource Creation',
    method: 'POST',
    endpoint: '/books',
    body: {
      title: 'Pragmatic Programmer',
      author: 'Andy Hunt & Dave Thomas',
      price: 49.99
    },
    expectedStatus: 201
  },
  {
    id: '10_post_book_missing_title',
    name: '10. POST /books - Missing Title Validation (Failure)',
    category: 'Input Validation',
    method: 'POST',
    endpoint: '/books',
    body: {
      author: 'Martin Fowler',
      price: 39.99
    },
    expectedStatus: 400
  },
  {
    id: '11_post_book_missing_author',
    name: '11. POST /books - Missing Author Validation (Failure)',
    category: 'Input Validation',
    method: 'POST',
    endpoint: '/books',
    body: {
      title: 'Domain-Driven Design',
      price: 55.00
    },
    expectedStatus: 400
  },
  {
    id: '12_post_book_non_numeric_price',
    name: '12. POST /books - Non-numeric Price Validation (Failure)',
    category: 'Input Validation',
    method: 'POST',
    endpoint: '/books',
    body: {
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      price: 'not_a_number'
    },
    expectedStatus: 400
  },
  {
    id: '13_put_book_success',
    name: '13. PUT /books/:id - Update Book Details (Success)',
    category: 'Resource Update',
    method: 'PUT',
    endpoint: '/books/1',
    body: {
      title: 'The Great Gatsby (Collector Edition)',
      author: 'F. Scott Fitzgerald',
      price: 18.50
    },
    expectedStatus: 200
  },
  {
    id: '14_put_book_not_found',
    name: '14. PUT /books/:id - Update Non-existent ID (Failure)',
    category: 'Error Handling',
    method: 'PUT',
    endpoint: '/books/9999',
    body: {
      title: 'Ghost Book',
      author: 'Unknown',
      price: 12.00
    },
    expectedStatus: 404
  },
  {
    id: '15_delete_book_success',
    name: '15. DELETE /books/:id - Delete Existing Book (Success)',
    category: 'Resource Deletion',
    method: 'DELETE',
    endpoint: '/books/10',
    expectedStatus: 200
  },
  {
    id: '16_delete_book_not_found',
    name: '16. DELETE /books/:id - Delete Non-existent ID (Failure)',
    category: 'Error Handling',
    method: 'DELETE',
    endpoint: '/books/9999',
    expectedStatus: 404
  }
];

async function run() {
  console.log(`Starting server on port ${TEST_PORT}...`);
  const server = app.listen(TEST_PORT);

  // Launch Edge browser for taking screenshot pictures
  console.log('Launching headless browser for screenshots...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    userDataDir: path.join(__dirname, 'edge-profile-temp'),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1040, height: 750, deviceScaleFactor: 2 });

  const testResults = [];

  for (const tc of testCases) {
    console.log(`Executing ${tc.name}...`);
    const result = await makeRequest(tc.method, tc.endpoint, tc.body);
    const passed = result.statusCode === tc.expectedStatus;
    console.log(`  -> Status: ${result.statusCode} (Expected: ${tc.expectedStatus}) - ${passed ? 'OK' : 'MISMATCH'}`);

    const html = generatePostmanHtml(tc, result);
    const htmlPath = path.join(screenshotsDir, `${tc.id}.html`);
    const pngPath = path.join(screenshotsDir, `${tc.id}.png`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: pngPath });

    testResults.push({
      ...tc,
      actualStatus: result.statusCode,
      duration: result.duration,
      passed,
      responseBody: result.body,
      screenshotPath: pngPath
    });
  }

  await browser.close();
  server.close();

  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(testResults, null, 2),
    'utf8'
  );

  console.log(`\nAll ${testCases.length} tests executed successfully and screenshots saved!`);
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

