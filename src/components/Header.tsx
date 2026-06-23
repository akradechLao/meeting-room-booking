'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, LogOut, Monitor, CalendarCheck, Shield, Home } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const navItems = [
    { href: '/home', label: 'หน้าหลัก', icon: Home },
    { href: '/kiosk', label: 'Kiosk', icon: Monitor },
  ];

  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-slate-900 dark:text-white leading-tight text-base">Meeting Room</div>
              <div className="text-[11px] text-slate-500 font-medium">ระบบจองห้องประชุม</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1 ml-4 sm:ml-8 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              className="btn btn-ghost p-2 rounded-xl"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {session?.user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                  {(session.user.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{session.user.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-outline text-sm"
              onClick={() => signOut({ redirect: false }).then(() => window.location.href = '/login')}
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
