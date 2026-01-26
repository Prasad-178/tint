import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative container max-w-6xl mx-auto px-4 py-8">
        <Dashboard />
      </div>
    </div>
  );
}
