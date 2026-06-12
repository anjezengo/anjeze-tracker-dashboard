/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';

const pagePath = path.resolve(__dirname, '../pages/upload.tsx');

test('/upload page file exists', () => {
  expect(fs.existsSync(pagePath)).toBe(true);
});

test('/upload page accepts .xlsx files', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  expect(source).toMatch(/\.xlsx/);
});

test('/upload page shows import results (imported / errors)', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  expect(source).toMatch(/imported/i);
  expect(source).toMatch(/error/i);
});

test('/upload page posts to /api/upload', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  expect(source).toContain('/api/upload');
});
