import type { CustomerStatus, Plan } from "@/lib/data/types";

// Two disjoint scales for two data dimensions: customer status lives on the
// semantic green/amber/gray vitals scale, plan tier on the steel-blue ordinal
// ramp. Gray is exclusive to "churned" — no tone appears in both scales.
type Tone =
  | "neutral"
  | "pos"
  | "warn"
  | "tier-starter"
  | "tier-pro"
  | "tier-enterprise";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  pos: "bg-pos/10 text-pos",
  warn: "bg-warn-soft text-warn",
  "tier-starter": "bg-tier-starter/12 text-tier-starter",
  "tier-pro": "bg-tier-pro/12 text-tier-pro",
  "tier-enterprise": "bg-tier-enterprise/12 text-tier-enterprise",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const PLAN_TONE: Record<Plan, Tone> = {
  starter: "tier-starter",
  pro: "tier-pro",
  enterprise: "tier-enterprise",
};

export function PlanBadge({ plan }: { plan: Plan }) {
  return <Badge tone={PLAN_TONE[plan]}>{plan}</Badge>;
}

const STATUS_TONE: Record<CustomerStatus, Tone> = {
  active: "pos",
  trialing: "warn",
  churned: "neutral",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}
