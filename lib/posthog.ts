import { PostHog } from 'posthog-node';
import { env } from './env';

let _ph: PostHog | null = null;

export function posthogConfigured() {
  return !!env.posthogKey;
}

function getClient(): PostHog | null {
  if (!posthogConfigured()) return null;
  if (!_ph) _ph = new PostHog(env.posthogKey, { host: env.posthogHost });
  return _ph;
}

export async function track(distinctId: string, event: string, properties?: Record<string, any>) {
  const c = getClient();
  if (!c) return;
  c.capture({ distinctId, event, properties });
}

export async function shutdown() {
  if (_ph) await _ph.shutdown();
}
