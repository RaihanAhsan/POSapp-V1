'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ShoppingBag,
  Store,
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  LogOut,
  Clock,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navLinks = isAdmin
    ? [
        { href: '/pos', label: 'Register (POS)', icon: Store },
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/products', label: 'Products & Stock', icon: Package },
        { href: '/admin/reports', label: 'Sales Reports', icon: BarChart3 },
        { href: '/admin/users', label: 'Manage Users', icon: Users },
      ]
    : [
        { href: '/pos', label: 'Register (POS)', icon: Store },
        { href: '/pos/history', label: 'Shift History', icon: Clock },
      ];

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <a href={isAdmin ? '/admin' : '/pos'} className="flex items-center space-x-2.5 min-h-[44px]">
              <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                  POSv1
                </span>
                <span className="hidden sm:inline text-xs text-slate-400 font-mono">v1.0</span>
              </div>
            </a>

            {/* Desktop Navigation Links (>= md) */}
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2 shrink-0" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </nav>

            {/* Right Side: Profile & Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Profile Badge */}
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-tight truncate max-w-[140px]">
                  {user.name}
                </div>
                <div className="flex items-center justify-end">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                      isAdmin
                        ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700'
                        : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Mobile Role Badge Only (< sm) */}
              <div className="sm:hidden">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                    isAdmin
                      ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700'
                      : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* Desktop Logout Button */}
              <button
                onClick={logout}
                title="Logout"
                className="hidden sm:flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
              </button>

              {/* Mobile Hamburger Button (>= 44px touch target) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
                className="flex md:hidden items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition cursor-pointer"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer & Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <ShoppingBag className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-base">POSv1</span>
                    <span className="ml-1.5 text-[11px] text-slate-400 font-mono">v1.0</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close Navigation Menu"
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* User Info inside Drawer */}
              <div className="py-4 border-b border-slate-800/80">
                <div className="text-sm font-bold text-white">{user.name}</div>
                <div className="text-xs text-slate-400 font-mono truncate mt-0.5">{user.email}</div>
                <span
                  className={`mt-2 inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold rounded ${
                    isAdmin
                      ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700'
                      : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  Role: {user.role}
                </span>
              </div>

              {/* Navigation Links List */}
              <nav className="mt-4 space-y-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center min-h-[48px] px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 shrink-0" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Logout Action in Drawer Footer */}
            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center min-h-[48px] px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-sm transition cursor-pointer"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
