const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const repoDir = __dirname;

async function initAndCommit() {
  console.log('Initializing git repository at:', repoDir);
  await git.init({ fs, dir: repoDir, defaultBranch: 'main' });

  // Read directory and stage files (ignoring node_modules, books.db, .env, edge-profile-temp)
  const ignoredPatterns = ['node_modules', 'books.db', '.env', 'edge-profile-temp', '.git', 'test_doc.docx', 'test_puppeteer.png'];

  function getAllFiles(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      if (ignoredPatterns.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, relPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  const filesToAdd = getAllFiles(repoDir);
  console.log(`Adding ${filesToAdd.length} files to git index...`);

  for (const file of filesToAdd) {
    await git.add({ fs, dir: repoDir, filepath: file });
  }

  const sha = await git.commit({
    fs,
    dir: repoDir,
    author: {
      name: 'Manoj Kumar',
      email: 'manojkumar@aurora.edu'
    },
    message: 'feat: complete Lab 3 REST API implementation, tests, and documentation'
  });

  console.log('Initial commit successfully created with SHA:', sha);
}

initAndCommit().catch(err => {
  console.error('Git init/commit failed:', err);
  process.exit(1);
});

