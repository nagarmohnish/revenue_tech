import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllTools, getWorkspace } from '@/lib/billing';
import { planMeetsRequirement, minPlanFromList, PLANS, Plan } from '@/lib/plans';
import { supabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const [tools, ws] = await Promise.all([getAllTools(), getWorkspace(s.workspaceId)]);
  const enriched = tools.map((t) => {
    const planAllowed = planMeetsRequirement(ws.plan as Plan, t.available_on);
    const locked = !planAllowed || !t.integrated;
    const requiredPlan = !planAllowed ? minPlanFromList(t.available_on) : null;
    return {
      ...t,
      locked,
      lockedReason: !planAllowed ? 'PLAN_INSUFFICIENT' : !t.integrated ? 'TOOL_NOT_INTEGRATED' : null,
      requiredPlan,
      upgradeCost: requiredPlan ? (PLANS[requiredPlan].price_usd != null ? `$${PLANS[requiredPlan].price_usd}/mo` : 'Custom') : null,
    };
  });
  return NextResponse.json({ tools: enriched, plan: ws.plan });
}
