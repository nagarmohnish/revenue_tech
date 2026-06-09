import { z } from 'zod';

export const RoadmapSchema = z.object({
  name:    z.string().trim().min(2).max(120),
  email:   z.string().trim().email().max(200),
  company: z.string().trim().min(2).max(160),
  role:    z.string().trim().max(120).optional().or(z.literal('')),

  website:        z.string().trim().min(3).max(400),
  agentsSummary:  z.string().trim().min(30, 'A paragraph helps — tell us what your agents do').max(1500),
  agentCount:     z.number().int().min(1).max(999),
  clientCount:    z.enum(['lt_5', '5_25', '25_100', 'gt_100']),

  pricingNow:     z.string().trim().min(3, 'Even one sentence about your current pricing helps').max(1200),
  chargingMethod: z.enum(['none', 'manual_invoice', 'stripe', 'paypal', 'razorpay', 'other', 'mixed']),
  chargingOther:  z.string().trim().max(200).optional().or(z.literal('')),
  payoutMethod:   z.enum(['not_setup', 'stripe', 'paypal', 'wire', 'razorpay', 'other']),
  payoutOther:    z.string().trim().max(200).optional().or(z.literal('')),

  stack:        z.string().trim().min(2).max(400),
  aiTools:      z.string().trim().min(2).max(600),
  integrations: z.string().trim().max(1200).optional().or(z.literal('')),
  docLinks:     z.string().trim().max(2000).optional().or(z.literal('')),

  shareableCreds: z.string().trim().max(1200).optional().or(z.literal('')),
  timeline:       z.enum(['week', 'month', 'quarter', 'exploring']),
  notes:          z.string().trim().max(2000).optional().or(z.literal('')),
});

export type RoadmapInput = z.infer<typeof RoadmapSchema>;
