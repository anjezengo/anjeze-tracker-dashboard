export const ONEDRIVE_SHARE_URL =
  'https://1drv.ms/x/c/6c401dcb03df05d3/IQDTBd8Dyx1AIIBs4sIDAAAAAZVe1Ye1Mw2Dqy8eLY8rLSQ?e=rePec6';

export function onedriveToDownloadUrl(shareUrl: string): string {
  const encoded = Buffer.from(shareUrl)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`;
}
