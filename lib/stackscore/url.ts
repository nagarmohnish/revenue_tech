// URL validation + normalization for StackScore.
// Protects against SSRF when we fetch user-supplied URLs server-side.

const PRIVATE_HOST_RE = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,                                  // 127.0.0.0/8
  /^10\./,                                   // 10.0.0.0/8
  /^192\.168\./,                             // 192.168.0.0/16
  /^172\.(1[6-9]|2\d|3[01])\./,              // 172.16.0.0/12
  /^169\.254\./,                             // link-local incl. cloud-metadata
  /^::1$/,                                   // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,                        // IPv6 ULA
  /^fe80:/i,                                 // IPv6 link-local
];

export interface NormalizedUrl {
  url: string;
  hostname: string;
}

export function normalizeAndValidateUrl(raw: string): NormalizedUrl {
  if (!raw || typeof raw !== 'string') throw new Error('URL is required');
  let candidate = raw.trim();
  if (!candidate) throw new Error('URL is required');

  // Add protocol if missing.
  if (!/^https?:\/\//i.test(candidate)) candidate = 'https://' + candidate;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('That does not look like a valid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported');
  }

  const host = parsed.hostname.toLowerCase();
  for (const re of PRIVATE_HOST_RE) {
    if (re.test(host)) throw new Error('That host is not reachable for analysis');
  }
  if (host.length < 3 || !host.includes('.')) {
    throw new Error('That does not look like a valid hostname');
  }

  return { url: parsed.toString(), hostname: host };
}
