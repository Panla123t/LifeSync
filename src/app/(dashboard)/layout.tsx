import BottomNav from '@/components/shared/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-20">
      <main className="max-w-md mx-auto w-full px-4 pt-4 pb-8 flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
