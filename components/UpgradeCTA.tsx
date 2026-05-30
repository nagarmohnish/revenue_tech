'use client';

import Link from 'next/link';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';

export type AuthDeny =
  | {
      reason: 'PLAN_INSUFFICIENT';
      agentName: string;
      currentPlan: string;
      requiredPlan: string;
      upgradeUrl: string;
      upgradeCost: string;
      featuresCTA?: string[];
    }
  | {
      reason: 'INSUFFICIENT_CREDITS';
      creditsRemaining: number;
      actionCost: number;
      shortfall: number;
      topUpOptions: Array<{ pack: string; credits: number; price: string; url: string }>;
      upgradeUrl: string;
      currentPlan: string;
    }
  | {
      reason: 'TOOL_NOT_INTEGRATED' | 'UNKNOWN_TOOL';
      message: string;
    };

export function UpgradeCTA({ deny }: { deny: AuthDeny }) {
  if (deny.reason === 'PLAN_INSUFFICIENT') {
    return (
      <div className="card p-5 border-l-4 border-l-accent-500">
        <div className="flex items-start gap-3">
          <Lock size={18} className="text-accent-600 mt-1" />
          <div className="flex-1">
            <div className="font-semibold text-ink-900">{deny.agentName} requires {deny.requiredPlan}</div>
            <div className="text-sm text-ink-500 mt-1">
              You're on <span className="font-medium text-ink-700 capitalize">{deny.currentPlan}</span>. Upgrade to {deny.requiredPlan} for {deny.upgradeCost}.
            </div>
            {deny.featuresCTA && (
              <ul className="mt-3 text-sm text-ink-700 grid sm:grid-cols-2 gap-y-1.5">
                {deny.featuresCTA.map((f, i) => (
                  <li key={i} className="flex items-start gap-2"><Sparkles size={14} className="text-accent-600 mt-0.5" /> {f}</li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link href={deny.upgradeUrl} className="btn-accent">
                Upgrade to {deny.requiredPlan} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (deny.reason === 'INSUFFICIENT_CREDITS') {
    return (
      <div className="card p-5 border-l-4 border-l-warn">
        <div className="flex items-start gap-3">
          <Lock size={18} className="text-warn mt-1" />
          <div className="flex-1">
            <div className="font-semibold text-ink-900">
              Not enough credits - you're {deny.shortfall} short
            </div>
            <div className="text-sm text-ink-500 mt-1">
              This action costs <span className="font-mono">{deny.actionCost}</span>. You have <span className="font-mono">{deny.creditsRemaining}</span>.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {deny.topUpOptions.map((o) => (
                <Link key={o.pack} href={o.url} className="btn-primary">
                  Top up {o.credits} credits - {o.price}
                </Link>
              ))}
              <Link href={deny.upgradeUrl} className="btn-secondary">Or upgrade plan →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card p-5 border-l-4 border-l-ink-300">
      <div className="font-semibold text-ink-900">Coming soon</div>
      <div className="text-sm text-ink-500 mt-1">{deny.message}</div>
    </div>
  );
}
