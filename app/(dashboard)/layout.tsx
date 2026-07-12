import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";

// Server component: the shared shell. Because this is a layout (not part of any
// page), Next keeps it mounted across /overview ⇄ /customers ⇄ /reports
// navigation — only {children} re-renders.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-56">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
