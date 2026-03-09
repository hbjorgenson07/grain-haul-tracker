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
  Wheat,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/activity', label: 'Activity Log', icon: Activity },
  { href: '/admin/reports/daily', label: 'Daily Reports', icon: FileText },
  { href: '/admin/reports/trends', label: 'Trends', icon: FileText },
  { href: '/admin/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/trucks', label: 'Trucks', icon: Truck },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/crops', label: 'Crop Types', icon: Wheat },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm lg:hidden">
        <span className="text-lg font-bold text-gray-900">Grain Haul</span>
        <button onClick={() => setMobileOpen(true)} className="text-gray-600">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Grain Haul Tracker</h1>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
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
          </nav>

          <div className="border-t p-3">
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for mobile header */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
