export type Plan = "starter" | "pro" | "enterprise";
export type CustomerStatus = "active" | "trialing" | "churned";

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  plan: Plan;
  status: CustomerStatus;
  /** Monthly recurring revenue in USD; 0 while trialing or after churn. */
  mrr: number;
  signupDate: string;
  churnDate: string | null;
  lastActive: string;
}

export interface RevenuePoint {
  /** "2026-07" */
  month: string;
  /** "Jul 2026" */
  label: string;
  revenue: number;
  starter: number;
  pro: number;
  enterprise: number;
  newCustomers: number;
  churnedCustomers: number;
}

export interface Metric {
  value: number;
  /** % change vs previous month; churnRate uses percentage points instead. */
  delta: number;
}

export interface MetricsSummary {
  mrr: Metric;
  arr: Metric;
  activeCustomers: Metric;
  /** value is a percentage, e.g. 2.4 */
  churnRate: Metric;
}

export interface MonthlyReport {
  month: string;
  label: string;
  revenue: number;
  newCustomers: number;
  churnedCustomers: number;
  netMrrChange: number;
  activeCustomers: number;
}

export type CustomerSortField = "company" | "mrr" | "signupDate" | "status";

export interface CustomerQuery {
  page: number;
  pageSize: number;
  query: string;
  plan: Plan | null;
  status: CustomerStatus | null;
  sort: CustomerSortField;
  dir: "asc" | "desc";
}

export interface CustomerPage {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: string;
}
