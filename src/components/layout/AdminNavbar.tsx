'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import {
  LayoutDashboard,
  Activity,
  FileText,
  Users,
  Truck,
  MapPin,
  Navigation,
  Wheat,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/reports/daily', label: 'Daily Reports', icon: FileText },
  { href: '/admin/reports/trends', label: 'Trends', icon: FileText },
  { href: '/admin/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/trucks', label: 'Trucks', icon: Truck },
  { href: '/admin/gps', label: 'GPS', icon: Navigation },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/crops', label: 'Crops', icon: Wheat },
];

export function AdminNavbar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* App title */}
          <Link href="/admin" className="text-lg font-bold text-gray-900 shrink-0">
            Grain Haul
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto mx-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop user + logout */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-500">{userName}</span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gray-600"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-14 left-0 right-0 bg-white shadow-lg border-t lg:hidden z-50">
            <div className="p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t p-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{userName}</span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
