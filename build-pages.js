const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building OpenNext...');
execSync('npx opennextjs-cloudflare build', { stdio: 'inherit' });

console.log('Setting up Pages Functions...');
const functionsDir = path.join(__dirname, 'functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir);
}

const functionsFile = path.join(functionsDir, '[[pathname]].js');
const functionsContent = `// OpenNext Cloudflare Pages Functions
import { default as handler } from "../.open-next/worker.js";

export async function onRequest(context) {
  const { request, env, params, waitUntil, next, data } = context;

  // Convert Pages context to Workers format
  const workerEnv = {
    ...env,
    // Add any additional environment variables if needed
  };

  // Call the OpenNext handler
  return handler(request, workerEnv, {
    waitUntil,
    params: params || {},
  });
}`;

fs.writeFileSync(functionsFile, functionsContent);
console.log('Pages Functions setup complete!');