const { execSync } = require('child_process');
const fs = require('fs');

try {
  const out = execSync('netstat -ano | findstr :3000').toString();
  const match = out.split('\n').find(line => line.includes('LISTENING'));
  if (match) {
    const pid = match.trim().split(/\s+/).pop();
    execSync(`taskkill /F /PID ${pid}`);
    console.log("Killed process on port 3000");
  }
} catch (e) {}

try {
  fs.rmSync('.next', { recursive: true, force: true });
  console.log("Cleared .next cache");
} catch (e) {}
