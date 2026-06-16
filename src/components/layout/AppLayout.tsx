import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        <Header />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
