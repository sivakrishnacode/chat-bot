import SidebarClient from "./SidebarClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <SidebarClient />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
