/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Coins, 
  AlertTriangle, 
  Package, 
  Plus, 
  RefreshCw, 
  Activity, 
  CheckCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { Product, Sales, Purchase, FinancialTransaction, SystemAuditLog, UserRole } from '../types';

interface DashboardViewProps {
  products: Product[];
  sales: Sales[];
  purchases: Purchase[];
  financials: FinancialTransaction[];
  auditLogs: SystemAuditLog[];
  setView: (view: string) => void;
  activeRole: UserRole;
  supabaseStatus: 'checking' | 'live' | 'no_tables' | 'error' | 'disconnected';
  supabaseMessage: string;
  isSeeding: boolean;
  onSeedDatabase: () => Promise<void>;
  onReconnect: () => Promise<void>;
}

export default function DashboardView({
  products,
  sales,
  purchases,
  financials,
  auditLogs,
  setView,
  activeRole,
  supabaseStatus,
  supabaseMessage,
  isSeeding,
  onSeedDatabase,
  onReconnect
}: DashboardViewProps) {
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);

  // 1. CALCULATIONS FROM STATE
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalProductsCount = products.length;
  
  // Low Stock Items (Threshold < 10)
  const lowStockItems = products.filter(p => p.isActive && p.stock < 10);
  const lowStockCount = lowStockItems.length;

  // Cash Flow Ledger
  const totalIncome = financials.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = financials.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  // Number Formatter
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Convert Date string for neat display
  const formatDateTiny = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Dynamic Chart coordinate calculation ending with today (last 7 days rolling)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    // 6-i days ago, meaning index 0 is 6 days ago, index 6 is today
    d.setDate(d.getDate() - (6 - i));
    
    // Format to YYYY-MM-DD for dynamic state matching
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Name label (e.g., "Mei 15")
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const name = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    
    // Aggregate income/expense directly from the real-time financials ledger
    const income = financials
      .filter(f => f.transactionDate === dateStr && f.type === 'INCOME')
      .reduce((sum, f) => sum + f.amount, 0);

    const expense = financials
      .filter(f => f.transactionDate === dateStr && f.type === 'EXPENSE')
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      name,
      fullDateLabel: `${d.getDate()} ${monthNames[d.getMonth()]} ${yyyy}`,
      income,
      expense
    };
  });

  const maxVal = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 500000) * 1.15;

  const getSvgCoordinates = (dataList: number[]) => {
    const width = 600;
    const height = 180;
    const paddingX = 40;
    const paddingY = 20;

    return dataList.map((val, idx) => {
      const x = paddingX + (idx / (dataList.length - 1)) * (width - paddingX * 2);
      // invert Y axis
      const y = (height - paddingY) - (val / maxVal) * (height - paddingY * 2);
      return { x, y };
    });
  };

  const incomePoints = getSvgCoordinates(chartData.map(d => d.income));
  const expensePoints = getSvgCoordinates(chartData.map(d => d.expense));

  const incomePath = incomePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const expensePath = expensePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'kasir': return 'Kasir';
      case 'purchasing': return 'Purchasing';
      case 'gudang': return 'Gudang';
      case 'finance': return 'Finance';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">

      {/* SUPABASE STATUS CONTROL BANNER */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${
              supabaseStatus === 'live' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : supabaseStatus === 'checking' 
                ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                : 'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
              <Database size={20} className={supabaseStatus === 'checking' ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Supabase Database Integration</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  supabaseStatus === 'live' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : supabaseStatus === 'checking' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {supabaseStatus === 'live' ? 'LIVE SYNC' : supabaseStatus === 'checking' ? 'CHECKING...' : 'LOCAL MEMORY'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium select-all">
                {supabaseMessage}
              </p>
            </div>
          </div>

          {supabaseStatus === 'no_tables' && (
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setView('schema')}
                className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
              >
                Inisialisasi Tabel
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 1. TOP CARDS BAR CONTAINER */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Card 1: Total Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Penjualan</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900 truncate">{formatIDR(totalSalesAmount)}</h3>
            <span className="text-xs text-slate-500">Dari {sales.length} Faktur Penjualan</span>
          </div>
        </div>

        {/* Card 2: Total purchases */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pembelian</span>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900 truncate">{formatIDR(totalPurchasesAmount)}</h3>
            <span className="text-xs text-slate-500">Dari {purchases.length} Order Berjalan</span>
          </div>
        </div>

        {/* Card 3: Cash Flow Net */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Arus Kas Bersih</span>
            <div className={`rounded-lg p-2 ${netCashFlow >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl font-bold truncate ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatIDR(netCashFlow)}
            </h3>
            <span className="text-xs text-slate-500">Laju Kas Masuk vs Keluar</span>
          </div>
        </div>

        {/* Card 4: Total product categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Master Product</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900">{totalProductsCount}</h3>
            <span className="text-xs text-slate-500">Item Terdaftar</span>
          </div>
        </div>

        {/* Card 5: Low stock alert */}
        <div className={`rounded-xl border p-5 shadow-sm transition-all ${
          lowStockCount > 0 
            ? 'border-red-200 bg-red-50/50 hover:bg-red-50' 
            : 'border-slate-200 bg-white hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Warning Stock</span>
            <div className={`rounded-lg p-2 ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl font-extrabold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {lowStockCount} <span className="text-xs font-normal text-slate-500">Item</span>
            </h3>
            <p className="text-xs text-slate-500">Stock di bawah limit (5-10)</p>
          </div>
        </div>

      </section>

      {/* 2. MAIN CHARTS AND ALERT CONTENT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Chart Column (Span 2) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Arus Transaksi Buku Keuangan</h2>
              <p className="text-xs text-slate-500">Komparasi Penjualan (Pemasukan) vs Pembelian/Operasional (Pengeluaran)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                Pemasukan
              </span>
              <span className="inline-flex items-center gap-1.5 text-orange-500">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                Pengeluaran
              </span>
            </div>
          </div>

          {/* SVG Custom Interactive Line Chart */}
          <div className="relative mt-6 flex h-48 justify-center overflow-visible">
            <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="560" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="65" x2="560" y2="65" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="110" x2="560" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="150" x2="560" y2="150" stroke="#f8fafc" strokeWidth="1" />

              {/* Income Line & Gradient */}
              <path 
                d={incomePath} 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round" 
              />
              {/* Expense Line & Gradient */}
              <path 
                d={expensePath} 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Vertical guideline for hover */}
              {hoveredDataIndex !== null && incomePoints[hoveredDataIndex] && (
                <line 
                  x1={incomePoints[hoveredDataIndex].x} 
                  y1="10" 
                  x2={incomePoints[hoveredDataIndex].x} 
                  y2="155" 
                  stroke="#cbd5e1" 
                  strokeDasharray="4"
                />
              )}

              {/* Data points markers */}
              {incomePoints.map((p, idx) => (
                <g key={`pts-${idx}`} className="cursor-pointer" onMouseEnter={() => setHoveredDataIndex(idx)} onMouseLeave={() => setHoveredDataIndex(null)}>
                  {/* Pemasukan Node */}
                  <circle cx={p.x} cy={p.y} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Pengeluaran Node */}
                  <circle cx={expensePoints[idx].x} cy={expensePoints[idx].y} r="4" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Invisible broad hitbox */}
                  <rect x={p.x - 20} y="0" width="40" height="180" fill="transparent" />
                </g>
              ))}

              {/* X Axis Labels */}
              {chartData.map((d, idx) => {
                const p = incomePoints[idx];
                return (
                  <text 
                    key={`txt-${idx}`}
                    x={p.x} 
                    y="170" 
                    textAnchor="middle" 
                    className="text-[10px] font-semibold fill-slate-400"
                  >
                    {d.name}
                  </text>
                );
              })}
            </svg>

            {/* Dynamic Custom Tooltip over hovered index */}
            {hoveredDataIndex !== null && (
              <div 
                className="absolute bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-700 pointer-events-none"
                style={{
                  left: `${(hoveredDataIndex / (chartData.length - 1)) * 80 + 5}%`,
                  top: '10%'
                }}
              >
                <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-slate-300">
                  Tanggal: {chartData[hoveredDataIndex].fullDateLabel}
                </div>
                <div className="text-blue-400 flex justify-between gap-4">
                  <span>Pemasukan:</span> 
                  <span className="font-mono">{formatIDR(chartData[hoveredDataIndex].income)}</span>
                </div>
                <div className="text-orange-400 flex justify-between gap-4">
                  <span>Pengeluaran:</span> 
                  <span className="font-mono">{formatIDR(chartData[hoveredDataIndex].expense)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Suggestion for Real-Time Simulation */}
          <div className="mt-4 rounded-xl bg-blue-50/50 p-4 border border-blue-100 flex items-center justify-between text-xs text-blue-900 font-medium">
            <span className="leading-relaxed">💡 <b>PRO TIP:</b> Lakukan transaksi pengisian stock di menu <strong className="text-blue-700">Pembelian</strong> atau penjualan pos di menu <strong className="text-blue-700">Penjualan (Kasir)</strong>! Data grafik ini akan berubah secara realtime!</span>
          </div>
        </div>

        {/* Right side widgets: Critical Low Stock Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Stock Hampir Habis
                {lowStockCount > 0 && (
                  <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-600"></span>
                )}
              </h2>
              <p className="text-xs text-slate-500">Perlu re-order segera</p>
            </div>
            {activeRole === 'purchasing' || activeRole === 'admin' ? (
              <button 
                onClick={() => setView('purchase')} 
                className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-orange-700 shadow-sm"
              >
                Restock Semua <ArrowRight size={10} />
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg">
                <CheckCircle className="text-emerald-500 mb-1.5" size={24} />
                <p className="text-xs font-bold text-slate-600">Semua Stock Aman No Alert</p>
                <p className="text-[10px] text-slate-400">Hubungi Logistik Gudang untuk update</p>
              </div>
            ) : (
              lowStockItems.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/20 p-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{prod.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{prod.code} | Barcode: {prod.barcode}</span>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-black text-red-700 block text-center min-w-[50px]">
                      {prod.stock} / {prod.unit}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 block">Limit kritis: 10</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. LOWER SPLIT MODULES: HISTORIC TRANSACTIONS & SYSTEM ACTIVITY FEEDS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Real-Time Enterprise Audit Logs (Span 3 for maximum space now that Blueprint card is removed) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600 animate-pulse" />
                Audit Logs & Supabase Trigger Simulator
              </h2>
              <p className="text-xs text-slate-500">Catatan aktivitas sistem serta simulasi eksekusi trigger langsung di database PostgreSQL</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-2 font-mono text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Belum ada aktivitas tercatat.</p>
            ) : (
              auditLogs.map((log) => {
                let badgeStyle = "bg-slate-100 text-slate-700";
                if (log.type === 'success') badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
                if (log.type === 'warning') badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
                if (log.type === 'error') badgeStyle = "bg-rose-100 text-rose-800 border-rose-200";

                return (
                  <div key={log.id} className="flex gap-3 border-b border-slate-50 pb-2.5 last:border-0 hover:bg-slate-50/50 p-1.5 rounded transition-all">
                    <span className="text-[10px] text-slate-400 shrink-0 select-none mt-0.5">
                      [{formatDateTiny(log.timestamp)}]
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.1 text-[9px] font-black uppercase rounded ${badgeStyle}`}>
                          {getRoleLabel(log.role)}
                        </span>
                        <span className="font-bold text-slate-800">{log.user}:</span>
                        <span className="text-slate-600 text-xs">{log.action}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
