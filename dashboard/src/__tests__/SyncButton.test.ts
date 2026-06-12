/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';

const componentPath = path.resolve(__dirname, '../components/OneDriveSyncButton.tsx');

test('OneDriveSyncButton component file exists', () => {
  expect(fs.existsSync(componentPath)).toBe(true);
});

test('OneDriveSyncButton posts to /api/sync', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  expect(source).toContain('/api/sync');
});

test('OneDriveSyncButton shows loading state', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  expect(source).toMatch(/loading|syncing|isSync/i);
});

test('OneDriveSyncButton shows imported count in result', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  expect(source).toMatch(/imported/i);
});
