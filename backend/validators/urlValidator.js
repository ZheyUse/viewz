const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

const BLOCKED_RANGES = [
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^127\./,
];

export function validateUrl(url) {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, reason: 'Only http:// and https:// URLs are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTS.includes(hostname)) {
      return { valid: false, reason: 'Private/local URLs are not allowed' };
    }

    for (const range of BLOCKED_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, reason: 'Private IP addresses are not allowed' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

export default { validateUrl };