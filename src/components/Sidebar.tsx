/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  Coins, 
  FileSpreadsheet, 
  Settings, 
  Briefcase,
  Layers,
  Truck,
  Users,
  ShieldAlert,
  Menu,
  X,
  MapPin,
  ChevronRight,
  FileCheck,
  LogOut
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  activeRole: UserRole;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout?: () => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  activeRole, 
  isOpen, 
  setIsOpen,
  onLogout
}: SidebarProps) {
  
  // Define menu items with roles that have access
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['admin', 'kasir', 'purchasing', 'gudang', 'finance'] 
    },
    { 
      id: 'products', 
      label: 'Data Produk', 
      icon: Package, 
      roles: ['admin', 'purchasing', 'gudang'] 
    },
    { 
      id: 'categories', 
      label: 'Kategori', 
      icon: Layers, 
      roles: ['admin', 'gudang'] 
    },
    { 
      id: 'suppliers', 
      label: 'Supplier', 
      icon: Truck, 
      roles: ['admin', 'purchasing'] 
    },
    { 
      id: 'customers', 
      label: 'Customer', 
      icon: Users, 
      roles: ['admin', 'kasir'] 
    },
    { 
      id: 'purchase', 
      label: 'Pembelian (Restock)', 
      icon: ShoppingBag, 
      roles: ['admin', 'purchasing', 'finance'] 
    },
    { 
      id: 'sales', 
      label: 'Penjualan (Kasir POS)', 
      icon: ShoppingCart, 
      roles: ['admin', 'kasir', 'finance'] 
    },
    { 
      id: 'stock', 
      label: 'Aktivitas Stock (Ledger)', 
      icon: Briefcase, 
      roles: ['admin', 'gudang'] 
    },
    { 
      id: 'finance', 
      label: 'Keuangan Cash Flow', 
      icon: Coins, 
      roles: ['admin', 'finance'] 
    },
    { 
      id: 'scmdocuments', 
      label: 'Dokumen Corporate', 
      icon: FileCheck, 
      roles: ['admin', 'kasir', 'purchasing', 'gudang', 'finance'] 
    },
    { 
      id: 'schema', 
      label: 'Supabase SQL Setup', 
      icon: Database, 
      roles: ['admin'] // Restricted strictly to Admin
    },
  ];

  const handleMenuClick = (id: string) => {
    setView(id);
    setIsOpen(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400';
      case 'kasir': return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400';
      case 'purchasing': return 'bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400';
      case 'gudang': return 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900 dark:text-sky-400';
      case 'finance': return 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    kasir: 'Kasir POS',
    purchasing: 'Purchasing',
    gudang: 'Logistik Gudang',
    finance: 'Finance & Cashier'
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:flex md:h-screen`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
              <span className="text-lg font-black text-white">L</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">LiteERP</h1>
              <span className="text-xs text-slate-400 font-sans">Point of Sale (POS)</span>
            </div>
          </div>
          <button 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Adaptive Menu Listings */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Menu Utama
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const hasAccess = item.roles.includes(activeRole);
              const isActive = currentView === item.id;
              
              if (!hasAccess) return null;

              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'} 
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-blue-200" />}
                </button>
              );
            })}
          </nav>

          {/* Locked Features for Simulation */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3.5">
              <div className="flex gap-2 text-xs font-semibold text-amber-500 mb-1">
                <ShieldAlert size={14} className="shrink-0" />
                <span>INFO AUTO-FILTER MENU:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Beberapa menu disembunyikan berdasarkan peran aktif <strong>{roleLabels[activeRole]}</strong> untuk mendemokan sistem Multi Login / ACL Supabase.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Role Card Summary */}
        <div className="border-t border-slate-800 bg-slate-950/30 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 bg-slate-800 flex items-center justify-center font-bold text-slate-300 rounded-lg shrink-0">
                {activeRole.substring(0,2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-[10px] text-slate-500 font-medium">Pengguna Aktif</p>
                <p className="truncate text-xs font-bold text-slate-200">
                  {activeRole === 'admin' ? 'Administrator' : 
                   activeRole === 'kasir' ? 'Siti (Kasir)' :
                   activeRole === 'purchasing' ? 'Andi (Purchasing)' :
                   activeRole === 'gudang' ? 'Hasan (Gudang)' : 'Rian (Finance)'}
                </p>
              </div>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg cursor-pointer transition-all border border-slate-800 hover:border-rose-950 shrink-0"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            )}
          </div>
          <div className="mt-3">
            <span className={`inline-flex w-full items-center justify-center rounded-md border py-1 text-center text-[10px] font-black uppercase tracking-wider transition-all ${getRoleBadgeColor(activeRole)}`}>
              Role: {activeRole}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
