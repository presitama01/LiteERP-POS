/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Coins, 
  FileText, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { Product, Supplier, Purchase, PurchaseItem } from '../types';

interface PurchaseViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  addStockMovement: (productId: number, type: 'IN' | 'OUT', q: number, refType: 'PURCHASE' | 'SALES' | 'MANUAL_ADJUSTMENT', refId: number) => void;
  addFinancialRecord: (type: 'INCOME' | 'EXPENSE', text: string, cash: number) => void;
  addAuditLog: (action: string, type: 'info' | 'success' | 'warning' | 'error', roleOverride?: string) => void;
  activeRole: string;
}

export default function PurchaseView({
  products,
  setProducts,
  suppliers,
  purchases,
  setPurchases,
  addStockMovement,
  addFinancialRecord,
  addAuditLog,
  activeRole
}: PurchaseViewProps) {
  
  // Selection
  const [supplierId, setSupplierId] = useState<number>(1);
  const [invoiceNumber, setInvoiceNumber] = useState(`PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Tempo'>('Cash');

  // Current draft list of items to buy
  const [draftItems, setDraftItems] = useState<{ productId: number; qty: number; buyPrice: number }[]>([]);

  // Selection inputs
  const [selectedProdId, setSelectedProdId] = useState<number>(1);
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemPrice, setItemPrice] = useState<number>(25000);

  // Trigger Notification POP
  const [triggerPop, setTriggerPop] = useState<string | null>(null);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Change product dropdown selection -> fetch its current buyPrice instantly to ease workflow
  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = Number(e.target.value);
    setSelectedProdId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setItemPrice(prod.buyPrice);
    }
  };

  // Add Item to Purchase Draft list
  const addDraftItem = () => {
    const isExist = draftItems.some(i => i.productId === selectedProdId);
    if (isExist) {
      alert('Produk sudah ada di dalam draft list pembelian! Sila sesuaikan qty atau hapus dahulu.');
      return;
    }

    if (itemQty <= 0) {
      alert('Kuantitas beli harus minimal 1!');
      return;
    }

    setDraftItems(prev => [...prev, {
      productId: selectedProdId,
      qty: itemQty,
      buyPrice: itemPrice
    }]);

    // Reset temporary selectors
    setItemQty(10);
  };

  const removeDraftItem = (index: number) => {
    setDraftItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Compute calculated Total
  const totalPurchaseCost = draftItems.reduce((sum, item) => sum + (item.qty * item.buyPrice), 0);

  // Submit complete invoice
  const handleSavePurchase = () => {
    if (draftItems.length === 0) {
      alert('Draft restocking product masih kosong! Masukkan minimal 1 item.');
      return;
    }

    const nextId = purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1;

    const newPurchaseRecord: Purchase = {
      id: nextId,
      invoiceNumber,
      supplierId: Number(supplierId),
      purchaseDate,
      total: totalPurchaseCost,
      paymentMethod,
      paymentStatus: paymentMethod === 'Tempo' ? 'UNPAID' : 'PAID',
      createdBy: 'Simulated Purchasing Andi',
      createdAt: new Date().toISOString(),
      items: draftItems.map((item, idx) => ({
        id: idx + 1,
        purchaseId: nextId,
        productId: item.productId,
        qty: item.qty,
        price: item.buyPrice,
        subtotal: item.qty * item.buyPrice
      }))
    };

    // 1. UPDATE REAL PRODUCTS STOCK (Simulating PL/pgSQL database trigger trg_purchase_stock)
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const itemToRestock = draftItems.find(item => item.productId === prod.id);
        if (itemToRestock) {
          return {
            ...prod,
            stock: prod.stock + itemToRestock.qty,
            // Optionally update cost price to standard average
            buyPrice: itemToRestock.buyPrice
          };
        }
        return prod;
      });
    });

    // 2. REGISTER LEDGER LOGS
    draftItems.forEach(item => {
      addStockMovement(item.productId, 'IN', item.qty, 'PURCHASE', nextId);
    });

    // register expenses finance ledger only if cash spent instantly
    const vendorName = suppliers.find(s => s.id === supplierId)?.name || 'Supplier';
    if (paymentMethod === 'Cash') {
      addFinancialRecord('EXPENSE', `Biaya Pembelian / Re-stock Bahan Dagang (${invoiceNumber}) - Supplier: ${vendorName}`, totalPurchaseCost);
    } else {
      addAuditLog(`Tercatat HUTANG usaha kepada ${vendorName} untuk Faktur ${invoiceNumber} senilai ${formatIDR(totalPurchaseCost)}.`, 'warning', 'purchasing');
    }

    // Save
    setPurchases(prev => [newPurchaseRecord, ...prev]);

    // Show satisfying supabase database trigger simulation log
    const triggerDetail = `[POSTGRES TRIGGER SIMULATED]: Mengeksekusi 'trg_purchase_stock' pada tabel 'purchase_items' secara otomatis. Mengubah sisa stock di tabel 'products' untuk ${draftItems.length} item.`;
    addAuditLog(`Re-stocking Sukses Faktur ${invoiceNumber}. ${triggerDetail}`, 'success', 'purchasing');

    // Trigger Notification popup
    setTriggerPop(`⚡ DATABASE TRIGGER: trg_purchase_stock dijalankan! Jumlah stock di tabel products otomatis bertambah.`);
    setTimeout(() => setTriggerPop(null), 7000);

    // Reset POS form
    setDraftItems([]);
    setPaymentMethod('Cash');
    setInvoiceNumber(`PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${nextId + 1}`);
    alert(`Transaksi restock barang dengan No Invoice ${invoiceNumber} berhasil dicatat.`);
  };

  return (
    <div className="space-y-6">

      {/* Database trigger pop animation info */}
      {triggerPop && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-600 p-4 text-white shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3 text-sm font-bold">
            <Sparkles className="shrink-0 animate-spin" size={18} />
            <span>{triggerPop}</span>
          </div>
          <button onClick={() => setTriggerPop(null)} className="text-indigo-100 hover:text-white text-xs font-black">
            Tutup [x]
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pembelian & Re-stock Barang (Goods Receipt)</h2>
        <p className="text-xs text-slate-500">Mencatat pembelian barang ke supplier / pemasok resmi untuk menambah unit persediaan secara otomatis</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* LEFT COMPONENT: restock bill drawer (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm text-xs font-semibold text-slate-700">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Informasi Pembelian</h3>

          {/* Supplier dropdown list */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Supplier Resmi *</label>
            <div className="relative">
              <Building className="absolute top-2.5 left-3 text-slate-400" size={14} />
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Invoice invoice text */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nomor Invoice Pemasok *</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-slate-800 uppercase focus:outline-none"
              />
            </div>

            {/* Date selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-1.5 font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Metode Pembayaran *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                💵 Lunas (Tunai)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Tempo')}
                className={`py-2 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                  paymentMethod === 'Tempo'
                    ? 'bg-amber-50 text-amber-700 border-amber-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⏱️ Tempo (Hutang)
              </button>
            </div>
          </div>

          {/* Draft Item Inputs list selector */}
          <div className="border-t border-slate-100 pt-3 space-y-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Tambahkan Item Produk</span>
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Produk</label>
              <select
                value={selectedProdId}
                onChange={handleProductSelectChange}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>({p.code}) {p.name} - Stock: {p.stock} {p.unit}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Qty count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Kuantitas Restock</label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              {/* Buying price */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Harga Beli Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addDraftItem}
              className="w-full rounded-lg bg-slate-900 text-white font-bold py-2 text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Masukkan ke List Draft</span>
            </button>
          </div>
        </div>

        {/* RIGHT COMPONENT: active restocking basket list (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">List Draft Restocking Barang</h3>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {draftItems.length} Produk terpilih
              </span>
            </div>

            {draftItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <ShoppingBag size={34} className="text-slate-300 mb-2 animate-bounce" />
                <p className="text-xs font-bold leading-normal">Belum ada item ditambahkan ke list restock</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">Gunakan formulir disamping untuk memilih produk, jumlah stock baru, dan harga re-order.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 text-xs">
                {draftItems.map((item, idx) => {
                  const prodRef = products.find(p => p.id === item.productId)!;
                  return (
                    <div key={`purch-idx-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-slate-50 hover:bg-slate-50/50 transition-all font-medium">
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-slate-900 font-bold truncate">({prodRef.code}) {prodRef.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          Restock {item.qty} {prodRef.unit} × {formatIDR(item.buyPrice)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-slate-950">
                          {formatIDR(item.qty * item.buyPrice)}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => removeDraftItem(idx)}
                          className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Total Summary & submitting block */}
          {draftItems.length > 0 && (
            <div className="border-t border-slate-100 pt-4 mt-6 space-y-4">
              <div className="flex items-center justify-between text-slate-950">
                <span className="text-xs font-bold uppercase text-slate-500">Total Biaya Pembelian:</span>
                <span className="font-mono text-base font-black text-rose-600">
                  {formatIDR(totalPurchaseCost)}
                </span>
              </div>

              {/* Notification reminder inside table */}
              <div className="rounded-xl bg-indigo-50/60 p-3.5 border border-indigo-100">
                <div className="flex gap-2 text-[10px] text-indigo-900 leading-normal font-semibold">
                  <Info size={14} className="shrink-0 text-indigo-500" />
                  <span>
                    <b>INFORMASI SYSTEM SIMULATOR:</b> Menyimpan invoice ini akan mendebit saldo Kas Keuangan sebesar <b>{formatIDR(totalPurchaseCost)}</b> sebagai biaya operasional (EXPENSE) dan meningkatkan stock persediaan masing-masing SKU produk secara instan.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDraftItems([])}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Clear Draft
                </button>
                <button
                  type="button"
                  onClick={handleSavePurchase}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold px-5 py-2.5 text-xs text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Confirm & Re-stock Produk</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
