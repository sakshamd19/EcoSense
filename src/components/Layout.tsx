import { NavLink, Outlet } from 'react-router-dom';
import { Home, PenLine, SlidersHorizontal, Sparkles, User } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Log Today', path: '/log', icon: PenLine },
  { name: 'Simulator', path: '/simulator', icon: SlidersHorizontal },
  { name: 'AI Coach', path: '/coach', icon: Sparkles },
  { name: 'Profile', path: '/profile', icon: User },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="font-bold text-xl text-emerald-600 hidden sm:block">EcoSense</span>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col sm:flex-row items-center sm:space-x-2 px-3 py-2 rounded-lg text-sm transition-colors relative",
                    isActive
                      ? "text-emerald-600 font-semibold"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-500" : "")} />
                    <span className="hidden sm:inline">{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-[-16px] sm:bottom-[-16px] left-0 right-0 h-0.5 bg-emerald-500 sm:block hidden" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Nav line fallback if needed, but sticky top is specified "Tab bar sticky at top on mobile" */}
      
      <main className="flex-1 w-full max-w-[900px] mx-auto p-4 sm:p-6 sm:pb-12">
        <Outlet />
      </main>
    </div>
  );
}
