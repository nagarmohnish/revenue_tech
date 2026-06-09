import { z } from 'zod';

export const ApplicationSchema = z.object({
  name:           z.string().trim().min(2, 'Please tell us your name').max(120),
  email:          z.string().trim().email('Please enter a valid email').max(200),
  company:        z.string().trim().max(200).optional().or(z.literal('')),

  agentName:      z.string().trim().min(2, 'What\'s your agent called?').max(120),
  agentDesc:      z.string().trim().min(20, 'A sentence or two helps us scope this').max(600),
  lifecycle:      z.enum(['idea', 'building', 'live_no_billing', 'live_with_billing']),
  volumeEstimate: z.enum(['lt_100', '100_1k', '1k_10k', '10k_100k', 'gt_100k']),

  billingPref:    z.enum(['prepaid', 'usage', 'both', 'not_sure']),
  geography:      z.enum(['usd', 'inr', 'both', 'other']),
  geographyOther: z.string().trim().max(120).optional().or(z.literal('')),

  stack:          z.string().trim().min(2, 'Tell us your stack — even one word helps').max(200),
  timeline:       z.enum(['week', 'month', 'quarter', 'exploring']),
  notes:          z.string().trim().max(2000).optional().or(z.literal('')),
}).refine((d) => d.geography !== 'other' || (d.geographyOther && d.geographyOther.length > 0), {
  message: 'Tell us which geography',
  path: ['geographyOther'],
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
