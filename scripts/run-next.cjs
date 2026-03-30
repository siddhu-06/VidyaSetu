const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tsConfigPath = path.join(root, 'next.config.ts');
const parkedConfigPath = path.join(root, 'next.config.ts.disabled');
const nextBinPath = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

function parkTsConfig() {
  if (fs.existsSync(tsConfigPath)) {
    fs.renameSync(tsConfigPath, parkedConfigPath);
  }
}

function restoreTsConfig() {
  if (fs.existsSync(parkedConfigPath) && !fs.existsSync(tsConfigPath)) {
    fs.renameSync(parkedConfigPath, tsConfigPath);
  }
}

function run() {
  const args = process.argv.slice(2);

  parkTsConfig();

  const child = spawn(process.execPath, [nextBinPath, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  const cleanupAndExit = (code) => {
    restoreTsConfig();
    process.exit(code ?? 0);
  };

  child.on('exit', cleanupAndExit);
  child.on('error', (error) => {
    console.error(error instanceof Error ? error.message : 'Unable to start Next.js.');
    cleanupAndExit(1);
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
    cleanupAndExit(130);
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    cleanupAndExit(143);
  });
}

run();

