import type {
  Customer,
  CustomerPage,
  CustomerQuery,
  CustomerStatus,
  MetricsSummary,
  MonthlyReport,
  Plan,
  RevenuePoint,
} from "./types";

// Source-of-truth dataset. Everything is derived from one seeded customer list so
// KPIs, charts, the customer table, and reports always agree with each other.
// The PRNG seed is fixed: every request, reload, and deploy sees identical data
// (anchored to the current month so the dashboard always looks "live").

const SEED = 20260711;
const MONTHS = 18;
const CUSTOMER_COUNT = 84;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

const FIRST_NAMES = [
  "Ava", "Liam", "Maya", "Noah", "Elena", "Marcus", "Priya", "Jonas", "Sofia",
  "Ethan", "Nora", "Felix", "Ines", "Oscar", "Leah", "Hugo", "Clara", "Dario",
  "Alice", "Ruben", "Tessa", "Mateo", "Ida", "Victor", "Zara", "Emil", "Freya",
  "Anton", "Lena", "Kai", "Petra", "Simon", "Vera", "Tomas", "Nina", "Aldo",
] as const;

const LAST_NAMES = [
  "Bennett", "Kowalski", "Iyer", "Lindqvist", "Marino", "Chen", "Okafor",
  "Haugen", "Silva", "Novak", "Fischer", "Andersen", "Rossi", "Kaur", "Weber",
  "Tanaka", "Berg", "Costa", "Nilsen", "Varga", "Dubois", "Klein", "Sato",
  "Moreau", "Jansen", "Petrov", "Larsen", "Vidal", "Meyer", "Bakker",
] as const;

const COMPANY_A = [
  "North", "Bright", "Clear", "Ever", "Iron", "Blue", "Swift", "Prime",
  "Deep", "True", "Nova", "Atlas", "Echo", "Solid", "Vertex", "Lumen",
  "Delta", "Argo", "Halo", "Origin",
] as const;

const COMPANY_B = [
  "lake", "path", "forge", "stack", "layer", "field", "works", "metric",
  "grid", "loop", "shift", "scale", "pilot", "frame", "signal", "harbor",
] as const;

const COMPANY_SUFFIX = ["Labs", "Systems", "Software", "HQ", "Group", ""] as const;

const PLAN_WEIGHTS: ReadonlyArray<{ plan: Plan; weight: number }> = [
  { plan: "starter", weight: 0.42 },
  { plan: "pro", weight: 0.4 },
  { plan: "enterprise", weight: 0.18 },
];

function pickPlan(): Plan {
  const r = rand();
  let acc = 0;
  for (const { plan, weight } of PLAN_WEIGHTS) {
    acc += weight;
    if (r < acc) return plan;
  }
  return "starter";
}

function planMrr(plan: Plan): number {
  switch (plan) {
    case "starter":
      return 29 + randInt(1, 5) * 10;
    case "pro":
      return 99 + randInt(5, 25) * 16;
    case "enterprise":
      return 499 + randInt(20, 100) * 22;
  }
}

// Month arithmetic uses window indices: 0 is the oldest month, MONTHS - 1 is the
// current month.
const now = new Date();
const ANCHOR_YEAR = now.getFullYear();
const ANCHOR_MONTH = now.getMonth();

function monthDate(index: number, day: number): Date {
  return new Date(ANCHOR_YEAR, ANCHOR_MONTH - (MONTHS - 1 - index), day);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function monthLabel(index: number): string {
  const d = monthDate(index, 1);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Days in the current (partial) month must not land in the future.
function randDayIn(index: number): number {
  return index >= MONTHS - 1 ? randInt(1, Math.max(1, now.getDate())) : randInt(1, 28);
}

// Plan price per customer, kept separately because Customer.mrr is 0 for churned
// and trialing customers but past months of the revenue series still need the
// price they were paying.
const historicalMrrById = new Map<string, number>();

function buildCustomers(): Customer[] {
  const usedCompanies = new Set<string>();
  const customers: Customer[] = [];

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    let company = "";
    do {
      const suffix = pick(COMPANY_SUFFIX);
      company = `${pick(COMPANY_A)}${pick(COMPANY_B)}${suffix ? ` ${suffix}` : ""}`;
    } while (usedCompanies.has(company));
    usedCompanies.add(company);

    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const email = `${slugify(name.split(" ")[0])}@${slugify(company)}.com`;

    // Squaring the roll biases signups toward recent months → upward revenue
    // trend. Signups may predate the 18-month window by up to 6 months.
    const signupIndex = Math.floor(Math.pow(rand(), 2) * (MONTHS + 6)) - 6;
    const signup = monthDate(
      Math.min(signupIndex, MONTHS - 1),
      randDayIn(Math.min(signupIndex, MONTHS - 1))
    );

    const plan = pickPlan();
    const baseMrr = planMrr(plan);

    const churns = rand() < 0.22 && signupIndex < MONTHS - 2;
    let churnDate: Date | null = null;
    if (churns) {
      const churnIndex = randInt(Math.max(signupIndex + 2, 0), MONTHS - 2);
      churnDate = monthDate(churnIndex, randInt(1, 28));
    }

    const trialing = !churns && signupIndex >= MONTHS - 1 && rand() < 0.45;
    const status: CustomerStatus = churns
      ? "churned"
      : trialing
        ? "trialing"
        : "active";

    const lastActive = churnDate ?? monthDate(MONTHS - 1, randDayIn(MONTHS - 1));

    const id = `cus_${(1000 + i).toString(36)}${Math.floor(rand() * 1296)
      .toString(36)
      .padStart(2, "0")}`;
    historicalMrrById.set(id, baseMrr);

    customers.push({
      id,
      name,
      company,
      email,
      plan,
      status,
      mrr: status === "active" ? baseMrr : 0,
      signupDate: isoDate(signup),
      churnDate: churnDate ? isoDate(churnDate) : null,
      lastActive: isoDate(lastActive),
    });
  }

  return customers;
}

export const customers: Customer[] = buildCustomers();

/** Paying customer during the given window month (trials never pay). */
function activeInMonth(c: Customer, index: number): boolean {
  if (c.status === "trialing") return false;
  const monthStart = isoDate(monthDate(index, 1));
  const nextMonthStart = isoDate(monthDate(index + 1, 1));
  return c.signupDate < nextMonthStart && (!c.churnDate || c.churnDate >= monthStart);
}

function buildRevenueSeries(): RevenuePoint[] {
  const points: RevenuePoint[] = [];
  for (let i = 0; i < MONTHS; i++) {
    const monthStart = isoDate(monthDate(i, 1));
    const nextMonthStart = isoDate(monthDate(i + 1, 1));
    const byPlan: Record<Plan, number> = { starter: 0, pro: 0, enterprise: 0 };
    let newCustomers = 0;
    let churnedCustomers = 0;

    for (const c of customers) {
      if (c.signupDate >= monthStart && c.signupDate < nextMonthStart) newCustomers++;
      if (c.churnDate && c.churnDate >= monthStart && c.churnDate < nextMonthStart) {
        churnedCustomers++;
      }
      if (activeInMonth(c, i)) {
        byPlan[c.plan] += historicalMrrById.get(c.id) ?? 0;
      }
    }

    points.push({
      month: isoDate(monthDate(i, 1)).slice(0, 7),
      label: monthLabel(i),
      revenue: byPlan.starter + byPlan.pro + byPlan.enterprise,
      starter: byPlan.starter,
      pro: byPlan.pro,
      enterprise: byPlan.enterprise,
      newCustomers,
      churnedCustomers,
    });
  }
  return points;
}

export const revenueSeries: RevenuePoint[] = buildRevenueSeries();

export function getRevenueSeries(months: number): RevenuePoint[] {
  const n = Math.max(1, Math.min(MONTHS, months));
  return revenueSeries.slice(MONTHS - n);
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function activeCountInMonth(index: number): number {
  return customers.filter((c) => activeInMonth(c, index)).length;
}

export function getMetrics(): MetricsSummary {
  const current = revenueSeries[MONTHS - 1];
  const previous = revenueSeries[MONTHS - 2];

  const activeNow = customers.filter((c) => c.status === "active").length;
  const activePrev = activeCountInMonth(MONTHS - 2);
  const activePrevPrev = activeCountInMonth(MONTHS - 3);

  const churnRate =
    activePrev === 0 ? 0 : (current.churnedCustomers / activePrev) * 100;
  const churnRatePrev =
    activePrevPrev === 0 ? 0 : (previous.churnedCustomers / activePrevPrev) * 100;

  return {
    mrr: { value: current.revenue, delta: pctDelta(current.revenue, previous.revenue) },
    arr: {
      value: current.revenue * 12,
      delta: pctDelta(current.revenue, previous.revenue),
    },
    activeCustomers: { value: activeNow, delta: pctDelta(activeNow, activePrev) },
    churnRate: { value: churnRate, delta: churnRate - churnRatePrev },
  };
}

export function getReports(): MonthlyReport[] {
  // Completed months only — the current month would be a partial report.
  return revenueSeries
    .slice(0, MONTHS - 1)
    .map((point, i) => ({
      month: point.month,
      label: point.label,
      revenue: point.revenue,
      newCustomers: point.newCustomers,
      churnedCustomers: point.churnedCustomers,
      netMrrChange: i === 0 ? 0 : point.revenue - revenueSeries[i - 1].revenue,
      activeCustomers: activeCountInMonth(i),
    }))
    .reverse();
}

export function queryCustomers(q: CustomerQuery): CustomerPage {
  let result = customers.slice();

  if (q.query) {
    const needle = q.query.toLowerCase();
    result = result.filter(
      (c) =>
        c.company.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle)
    );
  }
  if (q.plan) result = result.filter((c) => c.plan === q.plan);
  if (q.status) result = result.filter((c) => c.status === q.status);

  const dir = q.dir === "asc" ? 1 : -1;
  result.sort((a, b) => {
    switch (q.sort) {
      case "company":
        return a.company.localeCompare(b.company) * dir;
      case "mrr":
        return (a.mrr - b.mrr) * dir;
      case "signupDate":
        return a.signupDate.localeCompare(b.signupDate) * dir;
      case "status":
        return a.status.localeCompare(b.status) * dir;
    }
  });

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(Math.max(1, q.page), totalPages);
  const start = (page - 1) * q.pageSize;

  return {
    customers: result.slice(start, start + q.pageSize),
    total,
    page,
    pageSize: q.pageSize,
    totalPages,
  };
}
