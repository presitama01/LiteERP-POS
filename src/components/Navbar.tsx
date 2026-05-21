/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Menu, 
  MapPin, 
  User, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
}

export default function Navbar({
  activeRole,
  setActiveRole,
  setSidebarOpen,
  sidebarOpen
}: NavbarProps) {

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveRole(e.target.value as UserRole);
  };

  const roleDetails = {
    admin: { label: 'Administrator', access: 'Akses penuh ke semua modul ERP, kelola user & database.' },
    kasir: { label: 'Kasir POS', access: 'Hanya modul kasir & pelanggan umum.' },
    purchasing: { label: 'Purchasing', access: 'Kelola order pembelian/restock ke supplier.' },
    gudang: { label: 'Logistik Gudang', access: 'Kelola category, produk, stock opname & movement.' },
    finance: { label: 'Finance & Keuangan', access: 'Kelola keuangan harian, pengeluaran & cash flow.' }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-8">
      {/* Left side: Hamburger button + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Side Menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-sm font-semibold text-slate-500">Aplikasi</span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-bold text-slate-800">LiteERP Light ERP Concept</span>
        </div>
      </div>

      {/* Right side: Adaptive Controls Simulator */}
      <div className="flex items-center gap-4">
        {/* Dynamic Role Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="role-select" className="hidden lg:inline text-[10px] font-black uppercase text-slate-450 tracking-wider">Simulasi Role:</label>
          <select
            id="role-select"
            value={activeRole}
            onChange={handleRoleChange}
            className="rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-700 py-1.5 px-2.5 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="admin">👑 Administrator</option>
            <option value="kasir">🛍️ Kasir POS (Siti)</option>
            <option value="purchasing">💼 Purchasing (Andi)</option>
            <option value="gudang">📦 Logistik Gudang (Hasan)</option>
            <option value="finance">💰 Keuangan (Rian)</option>
          </select>
        </div>

        {/* Supabase Connection State badge */}
        <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-full py-1.5 px-3">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span>Supabase Sync Active</span>
        </div>

        {/* Micro Profile Detail Avatar */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-sm">
          <User size={16} />
          {/* Active status pulse */}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </div>
      </div>
    </header>
  );
}
