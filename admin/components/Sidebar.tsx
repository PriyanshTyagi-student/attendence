'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin' },
  { id: 'attendance', label: 'Attendance Records', href: '/attendance' },
  { id: 'employees', label: 'Employee Management', href: '/employees' },
  { id: 'export', label: 'Export Data', href: '/export' },
];

interface SidebarProps {
  activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#333333] min-h-screen p-6">
      <h2 className="text-white font-bold text-lg mb-8">Admin Menu</h2>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id || pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-gray-400 hover:bg-[#262626] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
