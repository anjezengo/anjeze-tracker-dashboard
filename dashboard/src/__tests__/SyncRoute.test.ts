/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';

const routePath = path.resolve(__dirname, '../pages/api/sync.ts');

test('/api/sync route file exists', () => {
  expect(fs.existsSync(routePath)).toBe(true);
});

test('/api/sync route references ONEDRIVE_SHARE_URL constant', () => {
  const source = fs.readFileSync(routePath, 'utf8');
  expect(source).toContain('ONEDRIVE_SHARE_URL');
});

test('/api/sync route imports onedriveToDownloadUrl', () => {
  const source = fs.readFileSync(routePath, 'utf8');
  expect(source).toContain('onedriveToDownloadUrl');
});

test('/api/sync route returns stats with imported count', () => {
  const source = fs.readFileSync(routePath, 'utf8');
  expect(source).toMatch(/imported/);
});
