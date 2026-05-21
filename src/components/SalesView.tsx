/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Barcode, 
  Plus, 
  Minus, 
  User, 
  Coins, 
  FileText, 
  Receipt,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { Product, Customer, Sales, SalesItem, StockMovement, FinancialTransaction, UserRole } from '../types';

interface SalesViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  sales: Sales[];
  setSales: React.Dispatch<React.SetStateAction<Sales[]>>;
  addStockMovement: (productId: number, type: 'IN' | 'OUT', q: number, refType: 'PURCHASE' | 'SALES' | 'MANUAL_ADJUSTMENT', refId: number) => void;
  addFinancialRecord: (type: 'INCOME' | 'EXPENSE', text: string, cash: number) => void;
  addAuditLog: (action: string, type: 'info' | 'success' | 'warning' | 'error', roleOverride?: string) => void;
  activeRole: UserRole;
}

export default function SalesView({
  products,
  setProducts,
  customers,
  sales,
  setSales,
  addStockMovement,
  addFinancialRecord,
  addAuditLog,
  activeRole
}: SalesViewProps) {
  const getOperatorName = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'kasir':
        return 'Siti (Kasir)';
      case 'purchasing':
        return 'Andi (Purchasing)';
      case 'gudang':
        return 'Hasan (Gudang)';
      case 'finance':
        return 'Rian (Finance)';
      default:
        return 'Operator';
    }
  };

  const operatorName = getOperatorName(activeRole);
  // POS Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1); // default Walk-in
  
  // Cart State: productId -> qty
  const [cart, setCart] = useState<Record<number, number>>({});
  
  // Billing rates
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(11); // PPN standard

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [cashPaidAmount, setCashPaidAmount] = useState<number>(0);
  
  // Receipt popup state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<Sales | null>(null);

  // PostgreSQL Trigger Simulation Overlay notification
  const [triggerNotification, setTriggerNotification] = useState<string | null>(null);

  // Format currencies
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Click to add item to POS cart
  const addToCart = (productId: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod || !prod.isActive) return;

    if (prod.stock <= 0) {
      alert(`Mohon maaf, stock produk [${prod.name}] sisa kosong! Restock via modul pembelian.`);
      return;
    }

    setCart(prev => {
      const currentQty = prev[productId] || 0;
      if (currentQty >= prod.stock) {
        alert(`Batas maksmal! Jumlah pembelian melebihi ketersediaan stock gudang (${prod.stock} ${prod.unit}).`);
        return prev;
      }
      return {
        ...prev,
        [productId]: currentQty + 1
      };
    });
  };

  // Barcode Lookup simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = products.find(p => p.barcode === barcodeInput.trim() && p.isActive);
    if (matchedProduct) {
      addToCart(matchedProduct.id);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Scan Barcode "${barcodeInput}" tidak ditemukan atau berstatus Non-Aktif.`);
    }
  };

  // Manual Adjust Qty in Cart
  const updateCartQty = (productId: number, amt: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const targetQty = currentQty + amt;

      if (targetQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      if (targetQty > prod.stock) {
        alert(`Batas maksimal! Persediaan stock tersisa: ${prod.stock} ${prod.unit}.`);
        return prev;
      }

      return {
        ...prev,
        [productId]: targetQty
      };
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // List of active cart items with object fields
  const cartItems = Object.entries(cart).map(([pId, qty]) => {
    const product = products.find(p => p.id === Number(pId))!;
    const price = product ? product.sellPrice : 0;
    const quantity = Number(qty);
    const subtotal = price * quantity;
    return {
      product,
      qty: quantity,
      price,
      subtotal
    };
  }).filter(item => item.product !== undefined);

  // Math Calculations
  const rawSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = rawSubtotal * (discountPercent / 100);
  const taxableAmount = rawSubtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const finalGrandTotal = taxableAmount + taxAmount;

  // Checkout process simulation (triggers database state changes)
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Keranjang belanja kosong!');
      return;
    }

    // Auto calculate cash change
    if (paymentMethod === 'Cash' && cashPaidAmount < finalGrandTotal) {
      alert(`Pembayaran Tunai kurang! Dibutuhkan minimal ${formatIDR(finalGrandTotal)}.`);
      return;
    }

    // 1. GENERATE INVOICE
    const nextInvoiceId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNumber = `SLS-${todayStr}-00${nextInvoiceId}`;

    const newSalesRecord: Sales = {
      id: nextInvoiceId,
      invoiceNumber,
      customerId: Number(selectedCustomerId),
      salesDate: new Date().toISOString().slice(0, 10),
      total: rawSubtotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'Tempo' ? 'UNPAID' : 'PAID',
      discount: discountPercent,
      tax: taxPercent,
      grandTotal: finalGrandTotal,
      createdBy: operatorName,
      createdAt: new Date().toISOString(),
      items: cartItems.map((item, idx) => ({
        id: idx + 1,
        salesId: nextInvoiceId,
        productId: item.product.id,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal
      }))
    };

    // 2. SIMULATE DATABASE TRIGGERS & DEDUCT STOCK
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const qtyInCart = cart[prod.id] || 0;
        if (qtyInCart > 0) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - qtyInCart)
          };
        }
        return prod;
      });
    });

    // 3. LOG EXTENSION
    cartItems.forEach(item => {
      // register stock ledger
      addStockMovement(item.product.id, 'OUT', item.qty, 'SALES', nextInvoiceId);
    });

    // register incomes bookkeeping if PAID
    const buyerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Pelanggan';
    if (paymentMethod !== 'Tempo') {
      addFinancialRecord('INCOME', `Kas masuk dari Penjualan POS Kasir (${invoiceNumber}) - Pelanggan: ${buyerName}`, finalGrandTotal);
    } else {
      addAuditLog(`Tercatat PIUTANG penjualan dari ${buyerName} senilai ${formatIDR(finalGrandTotal)} untuk Faktur ${invoiceNumber}.`, 'warning', activeRole);
    }

    // Append POS invoice
    setSales(prev => [newSalesRecord, ...prev]);

    // Show satisfying supabase plpgsql DB trigger simulation alert
    const triggerDetail = `[POSTGRES TRIGGER SIMULATE]: Membaca trigger 'trg_sales_stock' pada sales_items. Mengubah stock relasi di table 'products' untuk ${cartItems.length} item secara otomatis.`;
    addAuditLog(`POS Checkout Sukses Faktur ${invoiceNumber}. ${triggerDetail}`, 'success', activeRole);
    
    // Set notification bubble
    setTriggerNotification(`⚡ TRIGGER FIRED: trg_sales_stock otomatis memotong stock di tabel products!`);
    setTimeout(() => setTriggerNotification(null), 7000);

    setLastSavedInvoice(newSalesRecord);
    
    // Open thermal slip dialog!
    setIsReceiptOpen(true);

    // Clear Basket
    setCart({});
    setCashPaidAmount(0);
  };

  // Filter local product listings for quick-search selection
  const searchFilteredProducts = products.filter(p => {
    return p.isActive && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">

      {/* Database Trigger Pop Indicator overlay */}
      {triggerNotification && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-500 p-4 text-white shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3 text-sm font-bold">
            <Sparkles className="shrink-0" />
            <span>{triggerNotification}</span>
          </div>
          <button onClick={() => setTriggerNotification(null)} className="text-emerald-100 hover:text-white text-xs font-black">
            Tutup [x]
          </button>
        </div>
      )}

      {/* POS Top Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Terminal Penjualan (Kasir POS)</h2>
          <p className="text-xs text-slate-500 font-medium">Operasi POS Retail cepat, scan barcode, kalkulasi diskon, multi-payment, dan sinkronisasi stock instan</p>
        </div>
        
        {/* Active Cashier Session Status */}
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 self-start md:self-auto shadow-2xs">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">TERMINAL AKTIF</span>
          <span className="h-4 w-px bg-blue-200"></span>
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            👤 {operatorName}
            <span className="px-1.5 py-0.5 text-[9px] bg-slate-900 text-white rounded font-medium uppercase">{activeRole}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* LEFT COMPONENT: Catalog Menu (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Lookup instruments */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            
            {/* Direct text filters */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama produk / SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Simulated instant barcode scanning input */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2.5">
              <div className="relative flex-1">
                <Barcode className="absolute top-2.5 left-3 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Tempel / ketik barcode produk..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none bg-slate-50"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                Scan
              </button>
            </form>

          </div>

          {/* QUICK SCAN SUGGESTIONS LIST (Help user test barcode feature without typing) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-1.5">
              <Info size={12} className="text-blue-500" />
              <span>KLIK BARCODE BERIKUT UNTUK SIMULASI CAMERA SCANNER:</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {products.slice(0, 4).map(p => (
                <button
                  key={`bc-${p.id}`}
                  onClick={() => addToCart(p.id)}
                  className="rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 px-2 py-1 text-[10px] font-mono font-bold text-slate-700 transition-all shadow-xs"
                >
                  📟 {p.name.split(' ')[0]} ({p.barcode})
                </button>
              ))}
            </div>
          </div>

          {/* Grid View of available products to quickly tap */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
            {searchFilteredProducts.map((prod) => {
              const inBasket = cart[prod.id] || 0;
              const isLow = prod.stock < 10;
              return (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod.id)}
                  className={`group relative rounded-xl border p-3 bg-white text-left cursor-pointer transition-all hover:shadow-md ${
                    inBasket > 0 
                      ? 'border-blue-500 ring-2 ring-blue-500/10' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Stock Quantity Ribbon tag */}
                  <span className={`absolute top-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-black ${
                    prod.stock === 0 
                      ? 'bg-rose-100 text-rose-700' 
                      : isLow 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    Stock: {prod.stock}
                  </span>

                  {/* Product Details */}
                  <div className="mt-4">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide block">{prod.code}</span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5 leading-snug group-hover:text-blue-600">
                      {prod.name}
                    </h4>
                    <p className="text-xs font-black text-slate-950 mt-2 font-mono">
                      {formatIDR(prod.sellPrice)}
                    </p>
                  </div>

                  {/* Multi indicator badge of active basket count */}
                  {inBasket > 0 && (
                    <div className="mt-2.5 flex items-center justify-between rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                      <span>Dalam Basket:</span>
                      <span>{inBasket} Pcs</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COMPONENT: Cart Checkout Invoice Panel (Span 5) */}
        <div className="lg:col-span-12 xl:col-span-5 bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
          
          {/* Customer selection area */}
          <div className="border-b border-slate-200 pb-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Customer / Pelanggan</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute top-2.5 left-3 text-slate-400" size={14} />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone !== '-' ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Keranjang Belanja</span>
            
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400">
                <ShoppingCart size={28} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold">Keranjang masih kosong</p>
                <p className="text-[10px] text-slate-400 mt-1">Ketuk item di sebelah kiri untuk menambah.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`item-${item.product.id}`} className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 hover:shadow-xs transition-shadow">
                    <div className="flex-1 min-w-0 pr-2">
                      <h5 className="text-xs font-bold text-slate-800 truncate leading-tight">{item.product.name}</h5>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{formatIDR(item.price)} × {item.qty} {item.product.unit}</span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Increment/Decrement Buttons */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden h-7">
                        <button
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="px-2 hover:bg-slate-200 font-bold text-slate-600 cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-2.5 font-mono text-xs font-bold text-slate-800 bg-white">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="px-2 hover:bg-slate-200 font-bold text-slate-600 cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Hard remove button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-600 rounded p-1"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discounts, Tax Modifiers */}
          {cartItems.length > 0 && (
            <div className="grid grid-cols-2 gap-3.5 bg-white border border-slate-100 p-3.5 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Diskon (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (activeRole === 'kasir' && val > 10) {
                      alert('Akses Terbatas: Petugas Kasir hanya berwenang untuk memberikan diskon maksimal 10% tanpa otorisasi Supervisor!');
                      setDiscountPercent(10);
                    } else {
                      setDiscountPercent(Math.min(50, Math.max(0, val)));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 p-1.5 text-xs text-center font-bold focus:outline-none"
                />
                {activeRole === 'kasir' && (
                  <span className="text-[9px] text-amber-600 font-bold block mt-1">🔒 Batas Kasir: Max 10%</span>
                )}
                {activeRole !== 'kasir' && (
                  <span className="text-[9px] text-emerald-600 font-bold block mt-1">🔓 Akses Penuh: Max 50%</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pajak (PPN %)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  disabled={activeRole === 'kasir'}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.min(20, Math.max(0, Number(e.target.value))))}
                  className={`w-full rounded-lg border border-slate-200 p-1.5 text-xs text-center font-bold focus:outline-none ${
                    activeRole === 'kasir' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                  }`}
                />
                {activeRole === 'kasir' ? (
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">🔒 Kunci Sistem</span>
                ) : (
                  <span className="text-[9px] text-blue-600 font-semibold block mt-1">🔓 Dapat Diubah</span>
                )}
              </div>
            </div>
          )}

          {/* Subtotal, Tax and Grandtotal billing */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal :</span>
                <span className="font-mono">{formatIDR(rawSubtotal)}</span>
              </div>
              
              {discountPercent > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon ERP ({discountPercent}%):</span>
                  <span className="font-mono">-{formatIDR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Pajak PPN ({taxPercent}%):</span>
                <span className="font-mono">{formatIDR(taxAmount)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-slate-900 font-extrabold text-sm">
                <span>TOTAL AKHIR :</span>
                <span className="font-mono text-blue-600">{formatIDR(finalGrandTotal)}</span>
              </div>
            </div>
          )}

          {/* Method payment selecting drawer */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Metode Pembayaran</label>
                <div className="grid grid-cols-5 gap-1">
                  {['Cash', 'QRIS', 'Transfer', 'Digital Wallet', 'Tempo'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded py-1.5 text-[10px] font-extrabold border transition-all truncate cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method === 'Tempo' ? '⏱️ Tempo' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash payment amount inputs */}
              {paymentMethod === 'Cash' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal Tunai Diterima (Rp) *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Masukkan jumlah cash..."
                      value={cashPaidAmount || ''}
                      onChange={(e) => setCashPaidAmount(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-slate-200 p-2 text-xs font-mono font-black focus:outline-none"
                    />
                    
                    {/* Quick values keys */}
                    <button
                      type="button"
                      onClick={() => setCashPaidAmount(Math.ceil(finalGrandTotal / 10000) * 10000)}
                      className="rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaidAmount(50000)}
                      className="rounded-lg bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-orange-800 hover:bg-orange-200"
                    >
                      50rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaidAmount(100000)}
                      className="rounded-lg bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-800 hover:bg-green-200"
                    >
                      100rb
                    </button>
                  </div>

                  {cashPaidAmount >= finalGrandTotal && (
                    <div className="mt-2 text-[11px] font-bold text-emerald-600 flex justify-between bg-emerald-50 p-2 rounded">
                      <span>Kembalian:</span>
                      <span className="font-mono">{formatIDR(cashPaidAmount - finalGrandTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout Submit Drawer trigger */}
              <button
                onClick={handleCheckout}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-bold py-3 text-xs shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
              >
                <Coins size={14} />
                <span>Bayar & Simpan Invoice (Simulasi Postgres)</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MODAL THERMAL SLIP INVOICE popup */}
      {isReceiptOpen && lastSavedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-300 bg-white p-5 shadow-2xl animate-in fade-in duration-200 text-slate-800">
            
            {/* Header Close button */}
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">FAKTUR SALES NOTA (Thermal Slip)</span>
              <button 
                onClick={() => setIsReceiptOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded"
              >
                Tutup [x]
              </button>
            </div>

            {/* Thermal layout mimicking paper */}
            <div className="mt-4 p-4 border border-slate-100 bg-slate-50/50 rounded-lg text-xs font-mono text-center space-y-3">
              <div>
                <h4 className="font-bold text-sm tracking-wide">MINIMARKET LITE-ERP</h4>
                <p className="text-[10px] text-slate-400 leading-normal">HO Jakarta Barat - Telp: 021-5551234</p>
                <p className="text-[9px] text-slate-500">Masa Simulasi: {new Date(lastSavedInvoice.createdAt).toLocaleString('id-ID')}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2.5 text-left text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>No Faktur:</span>
                  <span>{lastSavedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir POS:</span>
                  <span>{lastSavedInvoice.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{customers.find(c => c.id === lastSavedInvoice.customerId)?.name || 'Walk-in'}</span>
                </div>
              </div>

              {/* Items iteration rows */}
              <div className="text-left py-2 space-y-2 border-b border-dashed border-slate-300 text-[11px]">
                {lastSavedInvoice.items.map((item, index) => {
                  const prodObj = products.find(p => p.id === item.productId);
                  return (
                    <div key={`rcp-${index}`} className="flex justify-between items-start">
                      <div className="max-w-[190px]">
                        <div className="font-bold leading-none">{prodObj?.name || 'Item'}</div>
                        <span className="text-[10px] text-slate-400">{item.qty} × {formatIDR(item.price)}</span>
                      </div>
                      <span className="font-bold">{formatIDR(item.subtotal)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Invoice Calculations */}
              <div className="text-right text-[11px] space-y-1.5 border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between">
                  <span>Subtotal Bruto:</span>
                  <span>{formatIDR(lastSavedInvoice.total)}</span>
                </div>
                {lastSavedInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon ({lastSavedInvoice.discount}%):</span>
                    <span>-{formatIDR(lastSavedInvoice.total * (lastSavedInvoice.discount / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PPN ({lastSavedInvoice.tax}%):</span>
                  <span>{formatIDR((lastSavedInvoice.total - (lastSavedInvoice.total * (lastSavedInvoice.discount / 100))) * (lastSavedInvoice.tax / 100))}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-950 text-xs border-t border-slate-200 pt-1.5">
                  <span>TOTAL AKHIR:</span>
                  <span>{formatIDR(lastSavedInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="uppercase">{lastSavedInvoice.paymentMethod}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 leading-normal">
                <p>Terima Kasih Atas Kunjungan Anda</p>
                <p className="font-bold text-[8px] tracking-widest mt-1 text-slate-300">// DATABASES SECURE WITH SUPABASE AUTH & RLS //</p>
              </div>
            </div>

            {/* Print action dummy button */}
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => {
                  alert('Cetak Thermal Printer berhasil didemokan! Konektivitas via Driver ESC/POS USB & Bluetooth stabil.');
                }}
                className="flex-1 rounded-lg bg-slate-900 py-2 text-center text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Receipt size={14} />
                <span>Simulasi Cetak Nota</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
