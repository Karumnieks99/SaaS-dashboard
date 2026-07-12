import type { Metadata } from "next";
import { Suspense } from "react";
import CustomerTable from "@/components/regions/CustomerTable";
import CustomersLoading from "./loading";

export const metadata: Metadata = {
  title: "Customers",
};

// Server component: static structure only — the table region is the client
// boundary, since search/filter/sort/pagination all talk to /api/customers.
// CustomerTable reads useSearchParams(), which requires a Suspense boundary
// on a statically prerendered page.
export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersLoading />}>
      <CustomerTable />
    </Suspense>
  );
}
