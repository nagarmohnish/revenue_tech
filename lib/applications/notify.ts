// Email notifications for new applications. Resend-based; gracefully skipped
// if RESEND_API_KEY is not set — the application still saves.

import { Resend } from 'resend';
import type { ApplicationInput } from './types';
import { BILLING_LABELS, GEOGRAPHY_LABELS, LIFECYCLE_LABELS, TIMELINE_LABELS, VOLUME_LABELS } from './types';

const FROM        = process.env.RESEND_FROM_EMAIL || 'AgentMint <onboarding@agentmint.com>';
const TEAM_INBOX  = process.env.APPLICATIONS_INBOX || process.env.RESEND_FROM_EMAIL || '';
const KEY         = process.env.RESEND_API_KEY || '';

let _client: Resend | null = null;
function client(): Resend | null {
  if (!KEY) return null;
  if (!_client) _client = new Resend(KEY);
  return _client;
}

export async function sendApplicantConfirmation(input: ApplicationInput, id: string): Promise<void> {
  const c = client();
  if (!c) return;
  try {
    await c.emails.send({
      from: FROM,
      to: input.email,
      subject: `We got it — your AgentMint application for ${input.agentName}`,
      text:
`Hi ${input.name.split(' ')[0]},

Thanks for telling us about ${input.agentName}. We read every application personally.

Here's what we'll do:

  1. Within one business day, someone on our team will reply with a few clarifying questions.
  2. We'll scope the monetization layer for your agent — billing model, pricing, payment rail.
  3. We build it, you review, you ship.

You said you want to monetize via: ${BILLING_LABELS[input.billingPref]}.
Geography: ${GEOGRAPHY_LABELS[input.geography]}${input.geographyOther ? ` (${input.geographyOther})` : ''}.
Timeline: ${TIMELINE_LABELS[input.timeline]}.

Your reference is: ${id}

— AgentMint`,
    });
  } catch {
    // best-effort; never block on email
  }
}

export async function sendTeamNotification(input: ApplicationInput, id: string): Promise<void> {
  const c = client();
  if (!c || !TEAM_INBOX) return;
  const body =
`New application: ${input.agentName} (${input.name} · ${input.email})

Company:   ${input.company || '—'}
Lifecycle: ${LIFECYCLE_LABELS[input.lifecycle]}
Volume:    ${VOLUME_LABELS[input.volumeEstimate]}
Billing:   ${BILLING_LABELS[input.billingPref]}
Geography: ${GEOGRAPHY_LABELS[input.geography]}${input.geographyOther ? ` (${input.geographyOther})` : ''}
Stack:     ${input.stack}
Timeline:  ${TIMELINE_LABELS[input.timeline]}

What it does
${input.agentDesc}

${input.notes ? `Notes\n${input.notes}\n\n` : ''}Reference: ${id}`;

  try {
    await c.emails.send({
      from: FROM,
      to: TEAM_INBOX,
      replyTo: input.email,
      subject: `[Application] ${input.agentName} · ${input.name}`,
      text: body,
    });
  } catch {
    // best-effort; never block
  }
}
