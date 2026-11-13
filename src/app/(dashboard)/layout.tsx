import BottomNav from '@/components/shared/BottomNav';
import DesktopSidebar from '@/components/shared/DesktopSidebar';
import SunnyChatDrawer from '@/components/coach/SunnyChatDrawer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* 1. Desktop & Tablet Sidebar (Visible on md: and above) */}
      <DesktopSidebar />

      {/* 2. Main Responsive Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-x-hidden">
        {/* Ambient desktop glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-teal-200/15 dark:bg-teal-950/15 rounded-full blur-3xl pointer-events-none" />

        <main className="w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-5 md:pt-8 pb-28 md:pb-12 flex-1">
          {children}
        </main>

        {/* Floating AI Coach Sunny */}
        <SunnyChatDrawer />

        {/* Mobile Bottom Navigation (Hidden on md: and above) */}
        <BottomNav />
      </div>
    </div>
  );
}
