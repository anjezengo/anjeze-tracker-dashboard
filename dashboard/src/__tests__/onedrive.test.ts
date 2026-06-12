/**
 * @jest-environment node
 */
import { onedriveToDownloadUrl } from '../lib/onedrive';

const SHARE_URL =
  'https://1drv.ms/x/c/6c401dcb03df05d3/IQDTBd8Dyx1AIIBs4sIDAAAAAZVe1Ye1Mw2Dqy8eLY8rLSQ?e=rePec6';

test('onedriveToDownloadUrl returns an api.onedrive.com URL', () => {
  const url = onedriveToDownloadUrl(SHARE_URL);
  expect(url).toMatch(/^https:\/\/api\.onedrive\.com\/v1\.0\/shares\/u!/);
});

test('onedriveToDownloadUrl ends with /root/content', () => {
  const url = onedriveToDownloadUrl(SHARE_URL);
  expect(url).toMatch(/\/root\/content$/);
});

test('onedriveToDownloadUrl base64url-encodes the share URL (no +, /, or =)', () => {
  const url = onedriveToDownloadUrl(SHARE_URL);
  const encoded = url.replace('https://api.onedrive.com/v1.0/shares/u!', '').replace('/root/content', '');
  expect(encoded).not.toMatch(/[+/=]/);
});

test('onedriveToDownloadUrl is deterministic', () => {
  expect(onedriveToDownloadUrl(SHARE_URL)).toBe(onedriveToDownloadUrl(SHARE_URL));
});
