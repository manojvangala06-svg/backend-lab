const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  ShadingType
} = require('docx');

const screenshotsDir = path.join(__dirname, 'screenshots');

function createHeading(text, level) {
  return new Paragraph({
    text: text,
    heading: level,
    spacing: { before: 280, after: 120 }
  });
}

function createParagraph(text, bold = false, italic = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        italics: italic,
        size: 22, // 11pt
        font: 'Calibri'
      })
    ],
    spacing: { before: 60, after: 60 }
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ': ', bold: true, size: 22, font: 'Calibri' }));
  }
  children.push(new TextRun({ text, size: 22, font: 'Calibri' }));
  return new Paragraph({
    bullet: { level: 0 },
    children,
    spacing: { before: 40, after: 40 }
  });
}

function createCodeBlock(code) {
  const lines = code.split('\n');
  return lines.map(line => new Paragraph({
    children: [
      new TextRun({
        text: line || ' ',
        font: 'Consolas',
        size: 19 // 9.5pt
      })
    ],
    spacing: { before: 10, after: 10 },
    shading: {
      type: ShadingType.CLEAR,
      fill: 'F4F4F4'
    }
  }));
}

function createKeyValueRow(key, value) {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20 })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: 'F0F4F8' }
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
        width: { size: 70, type: WidthType.PERCENTAGE }
      })
    ]
  });
}

async function buildDocx() {
  const testResults = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-results.json'), 'utf8'));

  const children = [];

  // TITLE & HEADER
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'AURORA HIGHER EDUCATION',
        bold: true,
        size: 32, // 16pt
        color: '1A365D',
        font: 'Calibri'
      })
    ],
    spacing: { before: 100, after: 50 }
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING',
        bold: true,
        size: 24, // 12pt
        color: '4A5568',
        font: 'Calibri'
      })
    ],
    spacing: { before: 40, after: 100 }
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'LABORATORY REPORT — LAB 3',
        bold: true,
        size: 28, // 14pt
        color: '2B6CB0',
        font: 'Calibri'
      })
    ],
    spacing: { before: 100, after: 50 }
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Module: RESTful API Development, Query Parameters, Validation & Debugging',
        bold: true,
        italics: true,
        size: 24,
        color: '2D3748',
        font: 'Calibri'
      })
    ],
    spacing: { before: 40, after: 200 }
  }));

  // METADATA TABLE
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createKeyValueRow('Course', 'Backend Development Fundamentals'),
      createKeyValueRow('Academic Year & Term', 'Year II · Term II'),
      createKeyValueRow('Content Week & Slots', 'Week 3 (Slots 13–19)'),
      createKeyValueRow('Course Faculty', 'Joel Prashanth D'),
      createKeyValueRow('Student Name', 'Manoj Kumar'),
      createKeyValueRow('Submission Date', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })),
      createKeyValueRow('Evaluation Criteria', 'Working Output (50%), Code Quality (20%), Testing Evidence (15%), Viva (15%)')
    ]
  });
  children.push(metaTable);
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // SECTION 1: OBJECTIVES & REQUIREMENTS
  children.push(createHeading('1. Lab Objective & Overview', HeadingLevel.HEADING_1));
  children.push(createParagraph(
    'The objective of this laboratory session is to transform basic Lab 2 endpoints into an industry-standard, clean, and robust RESTful API adhering strictly to REST design patterns, HTTP semantics, parameterized SQLite queries, flexible query parameters (search, sorting, range filtering, pagination), comprehensive input validation, and systematic debugging of common backend failure modes.'
  ));

  children.push(createHeading('Core REST Tasks & Deliverables:', HeadingLevel.HEADING_2));
  children.push(createBullet('Name all endpoints strictly as plural nouns (/books) and map operations to proper HTTP verbs (GET, POST, PUT, DELETE).', 'Resource-Oriented URIs'));
  children.push(createBullet('Support search_q (partial title match with SQL LIKE), order_by, order (ASC/DESC), limit and offset with sensible defaults.', 'Query Parameters & Sorting'));
  children.push(createBullet('Enable price filtering via min_price and max_price using BETWEEN or compound SQL conditions.', 'Range Filtering'));
  children.push(createBullet('Reject missing title, missing author, or non-numeric/negative price with HTTP 400 Bad Request and consistent JSON message.', 'Input Validation'));
  children.push(createBullet('Return 201 Created on resource insertion, 200 OK on updates/deletions/retrievals, and 404 Not Found for non-existent IDs.', 'Accurate Status Codes'));
  children.push(createBullet('Diagnose and resolve 4 standard bugs: port conflict (EADDRINUSE), wrong import path, table name typo, and missing await keyword.', 'Debugging Exercise'));

  // SECTION 2: SYSTEM ARCHITECTURE & SOURCE CODE
  children.push(createHeading('2. Implementation Architecture & Source Code', HeadingLevel.HEADING_1));
  children.push(createParagraph(
    'The project is structured with strict separation of concerns into database management (db.js), route controllers (routes/books.js), application entrypoint (server.js), and automated testing suites.'
  ));

  children.push(createHeading('A. Database Layer (db.js)', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'Utilizes SQLite with parameterised SQL statements to guarantee protection against SQL injection attacks, initializes schema, and provides an asynchronous Promise-based query wrapper.'
  ));
  const dbCode = fs.readFileSync(path.join(__dirname, 'db.js'), 'utf8');
  children.push(...createCodeBlock(dbCode));

  children.push(createHeading('B. REST API Route Controller (routes/books.js)', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'Implements all CRUD operations, parameter sanitization, column whitelisting for sorting, pagination bounds, price filtering, and input validation with consistent JSON responses.'
  ));
  const routeCode = fs.readFileSync(path.join(__dirname, 'routes/books.js'), 'utf8');
  children.push(...createCodeBlock(routeCode));

  children.push(createHeading('C. Server Entrypoint (server.js)', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'Configures Express middleware, request logging, route mounts, centralized 404/500 handlers, and dynamic port conflict resolution.'
  ));
  const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  children.push(...createCodeBlock(serverCode));

  // SECTION 3: DEBUGGING EXERCISE
  children.push(createHeading('3. Debugging Exercise: Analysis & Resolutions', HeadingLevel.HEADING_1));
  children.push(createParagraph(
    'During the lab session, students were tasked with diagnosing and repairing four common backend errors injected into a broken starter template. Below is the structured analysis of each bug, root cause, and applied resolution.'
  ));

  const debugTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Error Type', bold: true, size: 20 })] })], shading: { fill: 'DCE6F1' }, width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Symptom & Stack Trace', bold: true, size: 20 })] })], shading: { fill: 'DCE6F1' }, width: { size: 35, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Root Cause & Fix Applied', bold: true, size: 20 })] })], shading: { fill: 'DCE6F1' }, width: { size: 45, type: WidthType.PERCENTAGE } })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1. Port Conflict', bold: true, size: 19 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Error: listen EADDRINUSE: address already in use :::3000', size: 18, font: 'Consolas' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'A lingering zombie node process was holding port 3000. Added an "error" listener on the server object to catch code EADDRINUSE and automatically retry on port + 1, or terminate the blocking process using Stop-Process.', size: 19 })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '2. Import Path Misspelling', bold: true, size: 19 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Error: Cannot find module ./routes/book\ncode: MODULE_NOT_FOUND', size: 18, font: 'Consolas' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'The route file was named "books.js" (plural), but server.js requested "./routes/book" (singular). Fixed the require statement to require("./routes/books").', size: 19 })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3. Table-Name Typo', bold: true, size: 19 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SqliteError: no such table: book\nat prepare (node:sqlite)', size: 18, font: 'Consolas' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'The DDL created table "books" (plural), but the SQL query executed SELECT * FROM book. Updated the query to use the correct plural identifier "books".', size: 19 })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '4. Missing await Keyword', bold: true, size: 19 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Route returned empty object {} or Promise { <pending> }, failing to serialize DB rows.', size: 18, font: 'Consolas' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Asynchronous DB calls return a Promise. Without await, execution immediately proceeded to send the pending Promise. Added await before db.all() and db.get().', size: 19 })] })] })
        ]
      })
    ]
  });
  children.push(debugTable);
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // SECTION 4: TEST PLAN & VERIFICATION EVIDENCE
  children.push(createHeading('4. Comprehensive Testing & Postman Evidence', HeadingLevel.HEADING_1));
  children.push(createParagraph(
    'A full test matrix of 16 distinct test cases was executed against the API covering all required success flows, edge conditions, parameter queries, and failure validations. Below is the summary test matrix followed by visual captures of each request and response.'
  ));

  // TEST SUMMARY TABLE
  const testTableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, size: 18 })] })], shading: { fill: 'E2E8F0' }, width: { size: 6, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Method & Endpoint', bold: true, size: 18 })] })], shading: { fill: 'E2E8F0' }, width: { size: 36, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Test Focus', bold: true, size: 18 })] })], shading: { fill: 'E2E8F0' }, width: { size: 32, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, size: 18 })] })], shading: { fill: 'E2E8F0' }, width: { size: 13, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Verdict', bold: true, size: 18 })] })], shading: { fill: 'E2E8F0' }, width: { size: 13, type: WidthType.PERCENTAGE } })
      ]
    })
  ];

  testResults.forEach((tc, idx) => {
    testTableRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${tc.method} ${tc.endpoint}`, font: 'Consolas', size: 17 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tc.category, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${tc.actualStatus}`, bold: true, size: 18, color: tc.actualStatus < 300 ? '0CBB52' : (tc.actualStatus === 404 ? 'FF9900' : 'EB2013') })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tc.passed ? 'PASSED' : 'FAILED', bold: true, size: 18, color: tc.passed ? '0CBB52' : 'EB2013' })] })] })
      ]
    }));
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: testTableRows
  }));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // DETAILED SCREENSHOTS FOR EACH QUERY
  children.push(createHeading('Visual Testing Evidence (Postman Screenshots)', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'The following captures show the execution of each test case in the Postman environment, displaying the request method, URI, query parameters/payload, status code, response time, and structured JSON output.'
  ));

  for (let i = 0; i < testResults.length; i++) {
    const tc = testResults[i];
    const imgPath = path.join(screenshotsDir, `${tc.id}.png`);

    children.push(new Paragraph({
      children: [
        new TextRun({
          text: `Test Case ${i + 1}: ${tc.name}`,
          bold: true,
          size: 22,
          color: '1A365D'
        })
      ],
      spacing: { before: 200, after: 60 }
    }));

    children.push(new Paragraph({
      children: [
        new TextRun({ text: 'Category: ', bold: true, size: 20 }),
        new TextRun({ text: `${tc.category} | `, size: 20 }),
        new TextRun({ text: 'Expected Status: ', bold: true, size: 20 }),
        new TextRun({ text: `${tc.expectedStatus} | `, size: 20 }),
        new TextRun({ text: 'Observed Status: ', bold: true, size: 20 }),
        new TextRun({ text: `${tc.actualStatus} | `, bold: true, color: '0CBB52', size: 20 }),
        new TextRun({ text: 'Duration: ', bold: true, size: 20 }),
        new TextRun({ text: `${tc.duration} ms`, size: 20 })
      ],
      spacing: { before: 40, after: 80 }
    }));

    if (fs.existsSync(imgPath)) {
      const imgData = fs.readFileSync(imgPath);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: imgData,
            transformation: {
              width: 540,
              height: 380
            }
          })
        ],
        spacing: { before: 60, after: 180 }
      }));
    }
  }

  // SECTION 5: VIVA VOCE QUESTIONS & IN-DEPTH ANSWERS
  children.push(createHeading('5. Viva Voce Questions & Answers', HeadingLevel.HEADING_1));

  children.push(createHeading('Question 1: Query parameter vs Path parameter?', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'Answer: Path parameters and query parameters serve distinct architectural purposes in RESTful system design:'
  ));
  children.push(createBullet('Path parameters (/books/:id) are integral parts of the hierarchical resource URL path. They uniquely identify a specific, individual resource instance or entity within a collection. They are mandatory—omitting a path parameter alters the route entirely (e.g. GET /books vs GET /books/5).', 'Path Parameters (Identifier)'));
  children.push(createBullet('Query parameters (/books?search_q=harry&order_by=price) appear after the question mark (?) as key-value pairs. They do NOT change which resource collection is being targeted; instead, they alter how the data is filtered, searched, sorted, or paginated. They are optional and have sensible defaults.', 'Query Parameters (Modifier)'));
  children.push(createBullet('Use a path parameter when asking for "Which specific entity do I want?" (e.g., /books/42). Use query parameters when asking "How should this set of entities be modified, searched, or formatted?" (e.g., /books?order=DESC&limit=10).', 'Rule of Thumb'));

  children.push(createHeading('Question 2: What does stateless mean in REST?', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'Answer: The Stateless constraint is one of the core architectural principles defined by Roy Fielding in REST:'
  ));
  children.push(createBullet('No Client Session on the Server: The server does not store any contextual information or conversational state about previous requests made by the client across multiple transactions.', 'Definition'));
  children.push(createBullet('Self-Contained Requests: Every incoming HTTP request from the client must contain all information, parameters, headers, and authentication tokens required for the server to understand and process the request in complete isolation.', 'Self-Sufficiency'));
  children.push(createBullet('High Scalability & Reliability: Because any server in a cluster or load-balanced farm can handle any incoming request without needing shared memory or sticky server sessions, horizontal scaling is straightforward. Server crashes do not corrupt client state.', 'System Advantages'));

  children.push(createHeading('Question 3: Which status code for bad input vs a missing record?', HeadingLevel.HEADING_2));
  children.push(createParagraph(
    'Answer: HTTP semantics provide clearly demarcated 4xx client error codes for each scenario:'
  ));
  children.push(createBullet('400 Bad Request: Used when the client submits malformed syntax, invalid data types (e.g. string supplied for numeric price), missing required body fields (e.g. empty title or author), or violated business validation rules. The server refuses to process the request due to client data error.', 'Bad Input (400 Bad Request)'));
  children.push(createBullet('404 Not Found: Used when the client specifies an identifier or URI for a resource that does not exist in the database (e.g. GET /books/9999 or DELETE /books/9999). The request syntax and semantics are completely valid, but the target entity cannot be located.', 'Missing Record (404 Not Found)'));
  children.push(createBullet('In REST API design, returning 200 with an error object or returning 500 for validation errors is considered an anti-pattern. Precise status codes allow client software to make automated retry, alerting, or UI error-display decisions.', 'Best Practice'));

  // SECTION 6: LAB RULES VERIFICATION CHECKLIST
  children.push(createHeading('6. Lab Rules Compliance Checklist', HeadingLevel.HEADING_1));
  children.push(createBullet('Checked. The .env file is excluded in .gitignore and .env.example is provided for configuration.', '1. Never commit or share .env'));
  children.push(createBullet('Checked. node_modules is ignored via .gitignore and clean package.json is provided.', '2. Do not include node_modules'));
  children.push(createBullet('Checked. No sensitive passwords or credentials are stored or printed in logs.', '3. Passwords never plain text'));
  children.push(createBullet('Checked. 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Internal Error).', '4. Every route returns the right status code'));
  children.push(createBullet('Checked. All database operations strictly use SQL placeholders (?) to prevent SQL injection.', '5. Parameterised queries'));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
        }
      },
      children
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, 'Lab_3_REST_API_Report.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`Word document successfully created: ${outPath} (${buffer.length} bytes)`);

  // Also copy to brain artifact folder and user's Downloads for convenience!
  const brainDocx = 'C:/Users/Manoj Kumar/.gemini/antigravity/brain/9abdaa52-f147-482d-b3a4-2c2d41ab825e/Lab_3_REST_API_Report.docx';
  fs.writeFileSync(brainDocx, buffer);
  console.log(`Word document copied to artifact folder: ${brainDocx}`);

  const downloadsDocx = 'C:/Users/Manoj Kumar/Downloads/Lab_3_REST_API_Report.docx';
  fs.writeFileSync(downloadsDocx, buffer);
  console.log(`Word document copied to Downloads: ${downloadsDocx}`);
}

buildDocx().catch(err => {
  console.error('Docx build failed:', err);
  process.exit(1);
});
