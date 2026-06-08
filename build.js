import { execSync } from 'child_process';

console.log('--- Step 1: Building frontend using Vite ---');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Frontend build completed successfully.');
} catch (error) {
  console.error('Frontend build failed!', error);
  process.exit(1);
}

console.log('--- Step 2: Compiling backend server with esbuild ---');
try {
  execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit' });
  console.log('Server build completed successfully.');
} catch (error) {
  console.warn('Server build failed, but continuing because static files are built successfully!', error);
}
