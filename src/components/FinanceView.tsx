/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  PlusCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lock,
  FileSpreadsheet,
  Download,
  Percent,
  TrendingUp as TrendingUpIcon,
  Calculator,
  ChevronRight,
  Database
} from 'lucide-react';
import { 
  FinancialTransaction, 
  UserRole, 
  Product, 
  Category, 
  Supplier, 
  Customer, 
  Purchase, 
  Sales 
} from '../types';
import { exportERPToExcel } from '../utils/excelExport';

interface FinanceViewProps {
  financials: FinancialTransaction[];
  setFinancials: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  addAuditLog: (action: string, type: 'info' | 'success' | 'warning' | 'error', roleOverride?: string) => void;
  activeRole: UserRole;
  products: Product[];
  sales: Sales[];
  purchases: Purchase[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
}

export default function FinanceView({
  financials,
  setFinancials,
  addAuditLog,
  activeRole,
  products,
  sales,
  purchases,
  categories,
  suppliers,
  customers
}: FinanceViewProps) {
  // Navigation tabs for Finance view
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'rugi_laba' | 'export_center'>('ledger');
  
  // Search state for Ledger
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

  // Form Modal toggle for manual entry
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // IDR Formatter
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // CASH FLOW Ledger aggregates
  const totalIncome = financials.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = financials.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // ===============================================
  // LABA RUGI MATH GENERATORS
  // ===============================================
  const totalRawSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscounts = sales.reduce((sum, s) => sum + s.total * (s.discount / 100), 0);
  const netSalesRevenue = totalRawSales - totalDiscounts;

  // Cost of Goods Sold (HPP / COGS) based on sold items buyPrices
  let totalHPP = 0;
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const buyPrice = prod ? prod.buyPrice : (item.price * 0.7); // Fallback to 70% if not found
      totalHPP += item.qty * buyPrice;
    });
  });

  const grossProfit = netSalesRevenue - totalHPP;
  const grossMarginPercent = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  // OPEX: manual expenses except stock reorderings
  const operatingExpenses = financials
    .filter(f => f.type === 'EXPENSE' && !f.description.includes('Biaya Pembelian / Re-stock'))
    .reduce((sum, f) => sum + f.amount, 0);

  // Other Non-POS Inflow (Manual General ledger cash-in except POS records)
  const otherRevenue = financials
    .filter(f => f.type === 'INCOME' && !f.description.includes('Kas masuk dari Penjualan POS'))
    .reduce((sum, f) => sum + f.amount, 0);

  // Bottom Line Profit after operating expenses
  const netProfit = grossProfit + otherRevenue - operatingExpenses;
  const netProfitMargin = netSalesRevenue > 0 ? (netProfit / netSalesRevenue) * 100 : 0;

  // Handle manual journal logging
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || amount <= 0) {
      alert('Keterangan transaksi dan Jumlah wajib diisi dengan benar.');
      return;
    }

    const nextId = financials.length > 0 ? Math.max(...financials.map(f => f.id)) + 1 : 1;
    const newTx: FinancialTransaction = {
      id: nextId,
      transactionDate: new Date().toISOString().slice(0, 10),
      type,
      description: description.trim(),
      amount: Number(amount),
      createdBy: activeRole === 'admin' ? 'Administrator' : 'Finance Officer Rian',
      createdAt: new Date().toISOString()
    };

    setFinancials(prev => [newTx, ...prev]);
    addAuditLog(
      `Mencatat transaksi manual [${type}] - ${description.trim()} sebesar ${formatIDR(amount)}`,
      type === 'INCOME' ? 'success' : 'info',
      'finance'
    );

    // reset forms
    setDescription('');
    setAmount(0);
    setShowModal(false);
  };

  // Filter listings for ledger
  const filteredTx = financials.filter(f => {
    const matchesSearch = f.description.toLowerCase().includes(searchTerm.toLowerCase()) || f.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Export handlers
  const triggerExcelExport = (section?: string) => {
    exportERPToExcel({
      products,
      categories,
      suppliers,
      customers,
      purchases,
      sales,
      financials
    }, section);

    const sectionLabel = section ? `Kategori ${section.toUpperCase()}` : 'Seluruh Database (Multi-sheet Book)';
    addAuditLog(`Mengekspor laporan XLS Excel untuk: ${sectionLabel}`, 'success', 'finance');
  };

  return (
    <div className="space-y-6">

      {/* Header with Title and Custom Sub-Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Buku Keuangan & Laporan Rugi Laba</h2>
          <p className="text-xs text-slate-500">Pantau arus kas riil-time, evaluasi Harga Pokok Penjualan (HPP), hitung keuntungan bersih usaha, dan backup laporan XLS.</p>
        </div>

        {/* Dynamic Navigations Sub-Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Buku Arus Kas
          </button>
          <button
            onClick={() => setActiveSubTab('rugi_laba')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'rugi_laba' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📉 Laporan Rugi Laba
          </button>
          <button
            onClick={() => setActiveSubTab('export_center')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'export_center' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📥 Ekspor Excel (.XLS)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW CONTENT: LEDGER / CASH FLOW */}
      {/* ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          {/* LEDGER STATS GRID */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            
            {/* Total revenue / Cash-In */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pendapatan Bruto (CASH-INFLOW)</span>
                <div className="rounded-full bg-emerald-50 p-1.5 text-emerald-600">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-slate-900 font-mono">{formatIDR(totalIncome)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Akumulasi seluruh nominal kas yang masuk real-time</span>
            </div>

            {/* Total cost and expenses / Cash-Out */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Arus Keluar Kas (CASH-OUTFLOW)</span>
                <div className="rounded-full bg-rose-50 p-1.5 text-rose-600">
                  <TrendingDown size={16} />
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-slate-900 font-mono">{formatIDR(totalExpense)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Belanja inventory stock & operasional yang terbayar</span>
            </div>

            {/* Net Cash Balance */}
            <div className={`rounded-xl border p-5 shadow-xs bg-linear-to-br transition-all ${
              netBalance >= 0 ? 'from-slate-50 to-emerald-50/50 border-emerald-200' : 'from-slate-50 to-rose-50/50 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selisih Kas Bersih (Net Cash Flow)</span>
                <div className={`rounded-full p-1.5 ${netBalance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  <Coins size={16} />
                </div>
              </div>
              <p className={`mt-3 text-xl font-black font-mono ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatIDR(netBalance)}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">Likuiditas kas sisa yang dipegang perusahaan</span>
            </div>

          </section>

          {/* JURNAL MANUAL TRIGGER ROW */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-3xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Pencatatan Buku Kas Harian</h4>
              <p className="text-[11px] text-slate-400 font-medium">Tambah entri pengeluaran kas kantor, beban angkut, bayar sewa, tagihan listrik, dll.</p>
            </div>
            
            {(activeRole === 'admin' || activeRole === 'finance') ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Input Kas Baru</span>
              </button>
            ) : (
              <div className="rounded bg-slate-50 px-2.5 py-1.5 text-slate-400 text-[10px] font-bold flex items-center gap-1 border border-slate-100 select-none">
                <Lock size={12} />
                <span>Mode View-Only (Role: {activeRole})</span>
              </div>
            )}
          </div>

          {/* FILTER SEARCH BARS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-3xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari deskripsi jurnal kas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-4 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1">
              {['all', 'INCOME', 'EXPENSE'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t as any)}
                  className={`rounded px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'all' ? 'Semua Kas' : t === 'INCOME' ? '📥 Kas Masuk' : '📤 Kas Keluar'}
                </button>
              ))}
            </div>
          </div>

          {/* LEDGER ENTRIES LISTING */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3">Tanggal Buku</th>
                    <th scope="col" className="px-5 py-3">Kelompok</th>
                    <th scope="col" className="px-5 py-3">Keterangan Aliran Kas</th>
                    <th scope="col" className="px-5 py-3">Nominal (IDR)</th>
                    <th scope="col" className="px-5 py-3">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        <div className="flex flex-col items-center justify-center py-6">
                          <AlertCircle size={22} className="text-slate-300 mb-1.5" />
                          <p className="text-xs">Tidak ada jurnal harian yang cocok dengan filter pencarian.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-500">
                          {tx.transactionDate}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {tx.type === 'INCOME' ? '📥 Cash-In' : '📤 Cash-Out'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 font-semibold max-w-xs truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className={`px-5 py-3.5 font-mono font-black text-xs ${
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatIDR(tx.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-bold">
                          {tx.createdBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW CONTENT: PROFIT & LOSS STATEMENT (RUGI LABA) */}
      {/* ========================================================================= */}
      {activeSubTab === 'rugi_laba' && (
        <div className="space-y-6">
          
          {/* PROFIT & LOSS GRAPH/KPI CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">PENJUALAN NET (A)</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-2">{formatIDR(netSalesRevenue)}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <span>Bruto: {formatIDR(totalRawSales)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase">HPP / COGS (B)</span>
              <p className="text-lg font-black text-rose-700 font-mono mt-2">{formatIDR(totalHPP)}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <span>Total Modal Pokok Terjual</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">LABA KOTOR (C)</span>
              <p className="text-lg font-black text-emerald-700 font-mono mt-2">{formatIDR(grossProfit)}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                <Percent size={12} />
                <span>Gross Margin: {grossMarginPercent.toFixed(1)}%</span>
              </div>
            </div>

            <div className={`rounded-xl border p-5 shadow-xs ${
              netProfit >= 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
            }`}>
              <span className={`text-[10px] font-black tracking-widest uppercase ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {netProfit >= 0 ? 'LABA BERSIH AKHIR (D)' : 'RUGI BERSlH AKHIR (D)'}
              </span>
              <p className={`text-xl font-extrabold font-mono mt-2 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatIDR(netProfit)}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-bold">
                <span>Margin Bersih: {netProfitMargin.toFixed(1)}%</span>
              </div>
            </div>

          </div>

          {/* INTEGRATED PROFIT AND LOSS STATEMENT TABLE */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Laporan Laba Rugi Periodik (Accrual Method)</h3>
                <p className="text-[10px] text-slate-400 font-medium">Berdasarkan data master SKU inventori, penjualan kasir harian, dan mutas beban operasional</p>
              </div>
              <button
                onClick={() => triggerExcelExport('finance')}
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 border border-slate-200 px-2 py-1 rounded"
              >
                <Download size={11} /> Export XLS Tab Rugi Laba
              </button>
            </div>

            <div className="text-xs text-slate-800 space-y-4 font-semibold">
              
              {/* SECTION 1: REVENUE */}
              <div className="space-y-1.5">
                <h4 className="border-b border-slate-200 pb-1.5 text-xs font-black text-slate-900 uppercase">1. Pendapatan Usaha (Sales Inflow)</h4>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 ml-4">
                  <span>Penerimaan Kotor Kasir POS (Gross Sales)</span>
                  <span className="font-mono">{formatIDR(totalRawSales)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600 font-bold ml-4">
                  <span>(-) Potongan Diskon Promosi Pelanggan</span>
                  <span className="font-mono">-{formatIDR(totalDiscounts)}</span>
                </div>
                <div className="flex justify-between py-2 font-black text-slate-900 bg-slate-50 px-3 rounded">
                  <span>PENDAPATAN NET PENJUALAN</span>
                  <span className="font-mono">{formatIDR(netSalesRevenue)}</span>
                </div>
              </div>

              {/* SECTION 2: COGS */}
              <div className="space-y-1.5">
                <h4 className="border-b border-slate-200 pb-1.5 text-xs font-black text-slate-900 uppercase">2. Harga Pokok Penjualan (HPP)</h4>
                <p className="text-[10px] text-slate-400 font-medium ml-4 leading-relaxed">
                  * HPP merupakan total modal beli produk yang laku terjual lewat POS. Setiap kali Anda melakukan update harga beli di table master, system menyesuaikan biaya pokok persediaan terjual agar akseptabel.
                </p>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 ml-4">
                  <span>Pokok Persediaan Dagangan Terjual (COGS)</span>
                  <span className="font-mono text-rose-700">-{formatIDR(totalHPP)}</span>
                </div>
                <div className="flex justify-between py-2 font-black text-indigo-700 bg-indigo-50/50 px-3 rounded border border-indigo-100/50">
                  <span>LABA KOTOR OPERASIONAL TOKO (GROSS PROFIT)</span>
                  <span className="font-mono">{formatIDR(grossProfit)}</span>
                </div>
              </div>

              {/* SECTION 3: EXPENSES & BEBAN */}
              <div className="space-y-1.5">
                <h4 className="border-b border-slate-200 pb-1.5 text-xs font-black text-slate-900 uppercase">3. Beban Operasional & Pendapatan Lain</h4>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 ml-4">
                  <span>Beban Umum & Administrasi (OPEX Harian Kantor / Sewa)</span>
                  <span className="font-mono text-rose-600">-{formatIDR(operatingExpenses)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600 font-bold ml-4">
                  <span>(+) Pendapatan Non-Operasional (Jurnal kas masuk umum manual)</span>
                  <span className="font-mono">+{formatIDR(otherRevenue)}</span>
                </div>
              </div>

              {/* SECTION 4: FINAL NET INCOME */}
              <div className="space-y-1.5">
                <div className={`flex justify-between py-3 px-4 rounded-xl border font-black text-sm uppercase ${
                  netProfit >= 0 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                }`}>
                  <span>{netProfit >= 0 ? 'LABA BERSIH USAHA (NET INCOME)' : 'RUGI BERSIH USAHA (NET DEFICIT)'}</span>
                  <span className="font-mono">{formatIDR(netProfit)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW CONTENT: BACKUP & REPORT CENTER (EKSPOR EXCEL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'export_center' && (
        <div className="space-y-6">
          
          {/* EXCEL GENERATOR BANNER */}
          <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-6 shadow-xs flex flex-col md:flex-row items-center gap-5 justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md">
                <FileSpreadsheet size={28} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ekspor Laporan Master LITE ERP ke File Excel (.XLSX)</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-1">
                  Download database ERP lengkap Anda dalam bentuk format spreadsheet Microsoft Excel. Sistem secara dinamis membuat multiple-tab worksheet (WBS) untuk seluruh tabel relasional PostgreSQL Supabase Anda secara instan.
                </p>
              </div>
            </div>

            <button
              onClick={() => triggerExcelExport()}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow active:scale-95 transition-all w-full md:w-auto justify-center cursor-pointer"
            >
              <Download size={14} />
              <span>Unduh Gabungan Semua sheet</span>
            </button>
          </div>

          {/* INDIVIDUAL SHEETS DOWNLOAD GRID */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Pilih Segment Laporan Individual (.XLSX)</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Product Sheet */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="space-y-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-600 font-black">MASTER DATA</span>
                  <h4 className="text-xs font-bold text-slate-900">Laporan Katalog Produk</h4>
                  <p className="text-[10px] text-slate-400 font-medium">SKU, nama barang, kode barcode, harga kulakan, harga jual, stok gudang aktif.</p>
                </div>
                <button
                  onClick={() => triggerExcelExport('products')}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 py-1.5 text-[10px] font-black tracking-wide text-slate-700 active:scale-95 transition-all focus:outline-none cursor-pointer"
                >
                  <Download size={12} />
                  UNDUH LAPORAN
                </button>
              </div>

              {/* Transactions Sheet */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="space-y-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-sky-50 text-sky-700 font-black">TRANSAKSI RETAIL</span>
                  <h4 className="text-xs font-bold text-slate-900">Laporan Penjualan POS</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Detail invoice kasir harian, data customer, subtotal, diskon item, dan PPN.</p>
                </div>
                <button
                  onClick={() => triggerExcelExport('sales')}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 py-1.5 text-[10px] font-black tracking-wide text-slate-700 active:scale-95 transition-all focus:outline-none cursor-pointer"
                >
                  <Download size={12} />
                  UNDUH LAPORAN
                </button>
              </div>

              {/* Stock Movement Sheet */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="space-y-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-pink-50 text-pink-700 font-black">LOGISTIK GUDANG</span>
                  <h4 className="text-xs font-bold text-slate-900">Laporan Mutasi Stock</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Buku besar aliran keluar masuk barang (Mutasi checkout vs Restock supplier).</p>
                </div>
                <button
                  onClick={() => triggerExcelExport('stock')}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 py-1.5 text-[10px] font-black tracking-wide text-slate-700 active:scale-95 transition-all focus:outline-none cursor-pointer"
                >
                  <Download size={12} />
                  UNDUH LAPORAN
                </button>
              </div>

              {/* Cashflow & General Ledger Sheet */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="space-y-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-50 text-emerald-700 font-black">LEDGER KEUANGAN</span>
                  <h4 className="text-xs font-bold text-slate-900">Buku Kas & Cash Flow</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Mutasi kas masuk dan keluar dari mutasi umum beserta catatan otorisator.</p>
                </div>
                <button
                  onClick={() => triggerExcelExport('finance')}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 py-1.5 text-[10px] font-black tracking-wide text-slate-700 active:scale-95 transition-all focus:outline-none cursor-pointer"
                >
                  <Download size={12} />
                  UNDUH LAPORAN
                </button>
              </div>

            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4.5 text-xs text-slate-500 font-semibold leading-relaxed max-w-2xl">
            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-amber-100 text-amber-800 font-black mb-2 uppercase">Integrasi Integritas Data</span>
            <p className="text-[11px]">
              Seluruh sheet data di atas kompatibel 100% untuk diunggah ulang ke system lain atau dibuat analisis grafik di Google Sheets, Microsoft Excel, LibreOffice, atau Apple Numbers.
            </p>
          </div>

        </div>
      )}

      {/* FORM DIALOG CATAT JURNAL KEUANGAN MANUAL (Shared across Ledger/Arus Kas view) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 text-xs text-slate-700 font-semibold space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Catat Jurnal Arus Kas Manual</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-xs font-black"
              >
                Tutup [x]
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              {/* Type toggle */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`rounded-lg py-2 font-bold border text-center transition-all cursor-pointer ${
                      type === 'INCOME'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📥 Pemasukan (Cash-In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`rounded-lg py-2 font-bold border text-center transition-all cursor-pointer ${
                      type === 'EXPENSE'
                        ? 'bg-rose-50 text-rose-700 border-rose-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📤 Pengeluaran (Cash-Out)
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Keterangan Transaksi *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Sewa domain ERP triwulanan atau biaya teh dapur toko"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 font-semibold focus:outline-none"
                />
              </div>

              {/* Amount values */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nominal Rupiah (Rp) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  placeholder="Masukkan nilai Rupiah..."
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  Simpan Jurnal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
