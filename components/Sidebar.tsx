'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Sensors', path: '/sensors', icon: '📊' },
    { name: 'History', path: '/history', icon: '📅' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  // Toggle sidebar when clicked anywhere on it
  const handleSidebarClick = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Sidebar - click anywhere to collapse/expand */}
      <div
        onClick={handleSidebarClick}
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl transition-all duration-300 z-40 cursor-pointer border-r-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 hover:shadow-lg dark:hover:shadow-green-500/40 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo / Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <Image 
                src="/favicon.png" 
                alt="Plant Monitor Logo" 
                width={32} 
                height={32}
                className="rounded"
              />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Soil Monitor</h2>
            </div>
          ) : (
            <Image 
              src="/favicon.png" 
              alt="Logo" 
              width={32} 
              height={32}
              className="rounded mx-auto"
            />
          )}
        </div>

        {/* Navigation Items - prevent clicks from bubbling to sidebar when collapsed */}
        <nav className="mt-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center px-4 py-3 transition-colors ${
                pathname === item.path
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-l-4 border-green-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content Spacer */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`} />
    </>
  );
}