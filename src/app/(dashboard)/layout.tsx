import BottomNav from '@/components/shared/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100/70 sm:py-6 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#F8FAF8] sm:min-h-[844px] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200/80 flex flex-col justify-between pb-24 relative overflow-hidden">
        <main className="w-full px-4 pt-5 pb-6 flex-1">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
