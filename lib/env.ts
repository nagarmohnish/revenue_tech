export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  stripeSecret: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeStarterPrice: process.env.STRIPE_STARTER_PRICE_ID || '',
  stripeGrowthPrice: process.env.STRIPE_GROWTH_PRICE_ID || '',
  stripeTopupPrice: process.env.STRIPE_TOPUP_STANDARD_PRICE_ID || '',

  authSecret: process.env.BETTER_AUTH_SECRET || '',
  authUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  sparrwoKey: process.env.SPARRWO_API_KEY || '',
  sparrwoUrl: process.env.SPARRWO_API_URL || 'https://api.sparrwo.com/v1',

  anthropicKey: process.env.ANTHROPIC_API_KEY || '',

  resendKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM_EMAIL || 'billing@agentmint.com',

  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',

  adminSecret: process.env.ADMIN_SECRET_KEY || '',
};

export function isConfigured(...keys: (keyof typeof env)[]) {
  return keys.every((k) => !!env[k]);
}
