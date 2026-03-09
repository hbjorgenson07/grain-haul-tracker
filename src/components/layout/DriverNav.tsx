'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Clock, LogOut } from 'lucide-react';
import { logout } from '@/lib/actions/auth';

export function DriverNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-gray-200 bg-white">
      <div className="flex justify-around">
        <Link
          href="/driver"
          className={`flex flex-1 flex-col items-center py-3 text-xs ${
            pathname === '/driver' || pathname === '/driver/session'
              ? 'text-green-600'
              : 'text-gray-500'
          }`}
        >
          <Truck className="mb-1 h-5 w-5" />
          Active
        </Link>
        <Link
          href="/driver/session/history"
          className={`flex flex-1 flex-col items-center py-3 text-xs ${
            pathname.includes('history') ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          <Clock className="mb-1 h-5 w-5" />
          History
        </Link>
        <button
          onClick={() => logout()}
          className="flex flex-1 flex-col items-center py-3 text-xs text-gray-500"
        >
          <LogOut className="mb-1 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
