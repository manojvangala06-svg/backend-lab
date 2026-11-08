const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const repoDir = __dirname;

/**
 * Usage:
 *   node push-to-github.js <github-repo-url> <personal-access-token>
 *
 * Example:
 *   node push-to-github.js https://github.com/username/lab3-rest-api.git ghp_xxxxxx
 */

async function push() {
  const remoteUrl = process.argv[2];
  const token = process.argv[3] || process.env.GITHUB_TOKEN;

  if (!remoteUrl) {
    console.log('----------------------------------------------------');
    console.log('GitHub Push Utility for Lab 3');
    console.log('----------------------------------------------------');
    console.log('To push this repository to GitHub, run:');
    console.log('  node push-to-github.js <REMOTE_URL> <GITHUB_TOKEN>');
    console.log('\nExample:');
    console.log('  node push-to-github.js https://github.com/your-username/lab3-rest-api.git ghp_yourTokenHere');
    console.log('\nAlternatively, if you install official Git for Windows:');
    console.log('  git remote add origin <REMOTE_URL>');
    console.log('  git branch -M main');
    console.log('  git push -u origin main');
    console.log('----------------------------------------------------');
    return;
  }

  console.log(`Setting remote origin: ${remoteUrl}`);
  try {
    await git.deleteRemote({ fs, dir: repoDir, remote: 'origin' });
  } catch (_) {}
  await git.addRemote({ fs, dir: repoDir, remote: 'origin', url: remoteUrl });

  console.log('Pushing to GitHub (branch: main)...');
  const pushResult = await git.push({
    fs,
    http,
    dir: repoDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({
      username: token ? 'oauth2' : '',
      password: token || ''
    })
  });

  console.log('Push completed successfully!', pushResult);
}

push().catch(err => {
  console.error('Push failed:', err.message);
  process.exit(1);
});
