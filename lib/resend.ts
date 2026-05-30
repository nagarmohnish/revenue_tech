import { Resend } from 'resend';
import { env } from './env';

let _resend: Resend | null = null;

export function resendConfigured() {
  return !!env.resendKey;
}

export function resend(): Resend {
  if (!env.resendKey) throw new Error('Resend not configured. Set RESEND_API_KEY.');
  if (!_resend) _resend = new Resend(env.resendKey);
  return _resend;
}

export async function sendWelcomeEmail(to: string, name?: string) {
  if (!resendConfigured()) return;
  try {
    await resend().emails.send({
      from: env.resendFrom,
      to,
      subject: 'Welcome to AgentMint — 100 trial credits inside',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#111">
          <h2>Welcome${name ? `, ${name}` : ''} 👋</h2>
          <p>You're in. We dropped <strong>100 trial credits</strong> in your wallet.</p>
          <p>Try it out:</p>
          <ul>
            <li>Run an AI visibility scan with Scanner (50 credits)</li>
            <li>Generate a blog article with Blog Writer (20 credits)</li>
            <li>Spin up social posts with Content Studio (2 credits each)</li>
          </ul>
          <p><a href="${env.authUrl}/dashboard" style="display:inline-block;background:#1f3fe6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open dashboard</a></p>
          <p style="color:#52525e;font-size:13px">When you're ready, Starter ($49/mo) gets you 500 credits/month.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error('[resend] welcome failed', e);
  }
}

export async function sendLowCreditEmail(to: string, balance: number, name?: string) {
  if (!resendConfigured()) return;
  try {
    await resend().emails.send({
      from: env.resendFrom,
      to,
      subject: `You have ${balance} credits left this period`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#111">
          <h2>Heads up${name ? `, ${name}` : ''}</h2>
          <p>Your AgentMint wallet is down to <strong>${balance} credits</strong>.</p>
          <p>Two ways to keep going:</p>
          <ul>
            <li><a href="${env.authUrl}/billing/topup">Top up +500 credits for $9</a></li>
            <li><a href="${env.authUrl}/billing/upgrade">Upgrade your plan</a></li>
          </ul>
        </div>
      `,
    });
  } catch (e) {
    console.error('[resend] low-credit failed', e);
  }
}
