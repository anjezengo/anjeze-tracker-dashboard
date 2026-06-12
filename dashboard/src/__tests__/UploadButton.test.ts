/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';

const ICLOUD_SRC = path.resolve(__dirname, '../components');

test('SyncButton does not reference Google Sheets', () => {
  const source = fs.readFileSync(path.join(ICLOUD_SRC, 'SyncButton.tsx'), 'utf8');
  expect(source).not.toMatch(/google.sheets/i);
  expect(source).not.toMatch(/Google Sheets/);
});

test('UploadButton component exists and links to /upload', () => {
  const filePath = path.join(ICLOUD_SRC, 'UploadButton.tsx');
  expect(fs.existsSync(filePath)).toBe(true);
  const source = fs.readFileSync(filePath, 'utf8');
  expect(source).toContain('/upload');
});

test('index.tsx uses UploadButton not SyncButton', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../pages/index.tsx'),
    'utf8'
  );
  expect(source).not.toContain('SyncButton');
  expect(source).toContain('UploadButton');
});
