/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  Check,
  X,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { Product, Category } from '../types';

interface ProductViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  addAuditLog: (action: string, type: 'info' | 'success' | 'warning' | 'error', roleOverride?: string) => void;
  activeRole: string;
}

export default function ProductView({
  products,
  setProducts,
  categories,
  addAuditLog,
  activeRole
}: ProductViewProps) {
  // Filters & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'normal'>('all');
  
  // Dialog state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [unit, setUnit] = useState('Pcs');
  const [barcode, setBarcode] = useState('');
  const [isActive, setIsActive] = useState(true);

  // IDR Currency Formatter
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Autogenerate unique Code & Barcode on Click
  const generateCodeAndBarcode = () => {
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    setCode(`PRD-00${nextId}`);
    setBarcode(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  // Open Add modal and reset form
  const handleOpenAdd = () => {
    setEditingProduct(null);
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    setCode(`PRD-00${nextId}`);
    setName('');
    setCategoryId(categories[0]?.id || 1);
    setBuyPrice(0);
    setSellPrice(0);
    setStock(0);
    setUnit('Pcs');
    setBarcode(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setIsActive(true);
    setShowModal(true);
  };

  // Open Edit modal and map values
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setName(prod.name);
    setCategoryId(prod.categoryId);
    setBuyPrice(prod.buyPrice);
    setSellPrice(prod.sellPrice);
    setStock(prod.stock);
    setUnit(prod.unit);
    setBarcode(prod.barcode);
    setIsActive(prod.isActive);
    setShowModal(true);
  };

  // Submit Handler for Add / Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !code) {
      alert('Nama produk dan Kode wajib diisi.');
      return;
    }

    if (editingProduct) {
      // Edit operation
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        code,
        name,
        categoryId: Number(categoryId),
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        unit,
        barcode,
        isActive
      } : p));

      addAuditLog(
        `Mengubah detail produk [${code}] - ${name} (Stock: ${stock} ${unit})`, 
        'info'
      );
    } else {
      // New Product creation
      const newProductId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const newProduct: Product = {
        id: newProductId,
        code,
        name,
        categoryId: Number(categoryId),
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        unit,
        barcode,
        isActive,
        createdAt: new Date().toISOString()
      };

      setProducts(prev => [...prev, newProduct]);
      addAuditLog(
        `Menambahkan produk baru ke database: [${code}] ${name} dengan stock awal ${stock} ${unit}`, 
        'success'
      );
    }

    setShowModal(false);
  };

  // Soft delete product
  const handleDelete = (id: number) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    if (confirm(`Apakah Anda yakin ingin menghapus produk [${prod.code}] ${prod.name}?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      addAuditLog(`Menghapus produk dari database: [${prod.code}] - ${prod.name}`, 'warning');
    }
  };

  // Filter computations
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && p.stock < 10) || 
                        (stockFilter === 'normal' && p.stock >= 10);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      
      {/* List Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Master Data Produk</h2>
          <p className="text-xs text-slate-500">Kelola rincian item persediaan, barcode SKU, harga beli, dan penyesuaian margin</p>
        </div>
        
        {/* Only Admin & Purchasing can alter Master Products files */}
        {(activeRole === 'admin' || activeRole === 'purchasing' || activeRole === 'gudang') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md transition-all self-start"
          >
            <Plus size={16} />
            <span>Tambah Produk Baru</span>
          </button>
        )}
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          
          {/* Search bar inputs */}
          <div className="relative sm:col-span-2">
            <Search className="absolute top-2.5 left-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, kode SKU, atau barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category drop selection filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Stock criteria level filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Level Stock</option>
              <option value="low">🚨 Stock Menipis (&lt; 10)</option>
              <option value="normal">✅ Stock Melimpah (&ge; 10)</option>
            </select>
          </div>

        </div>
      </div>

      {/* PRODUCTS MASTER LEDGER TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs bg-white">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-6 py-4">Kode SKU</th>
                <th scope="col" className="px-6 py-4">Nama Produk / Barcode</th>
                <th scope="col" className="px-6 py-4">Kategori</th>
                <th scope="col" className="px-6 py-4 text-center">Stock Sisa</th>
                <th scope="col" className="px-6 py-4">Harga Beli</th>
                <th scope="col" className="px-6 py-4">Harga Jual</th>
                <th scope="col" className="px-6 py-4 text-center">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={28} className="text-slate-300 mb-2" />
                      <p className="text-xs">Tidak ada data produk yang memenuhi kriteria pencarian.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const categoryName = categories.find(c => c.id === prod.categoryId)?.name || 'Uncategorized';
                  const isLow = prod.stock < 10;
                  
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600 font-mono select-all">
                        {prod.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-bold">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Barcode: {prod.barcode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-black min-w-[54px] ${
                          isLow 
                            ? 'bg-red-100 text-red-700 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {prod.stock} / {prod.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {formatIDR(prod.buyPrice)}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-slate-800">
                        {formatIDR(prod.sellPrice)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          prod.isActive 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {prod.isActive ? 'Active' : 'Non-Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Edit / View actions gated by role */}
                          {(activeRole === 'admin' || activeRole === 'purchasing' || activeRole === 'gudang') ? (
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer"
                              title="Edit / Sesuaikan"
                            >
                              <Edit2 size={13} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No permission</span>
                          )}
                          
                          {(activeRole === 'admin' || activeRole === 'purchasing') && (
                            <button
                              onClick={() => handleDelete(prod.id)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL ADD / UPDATE PRODUCT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? '📝 Edit Item Persediaan' : '📦 Tambah Produk Baru'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Kode Product */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Product SKU *</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      required
                      placeholder="PRD-00X"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold uppercase focus:border-blue-500 focus:outline-none bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={generateCodeAndBarcode}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 p-2 font-bold text-slate-700 transition-colors shrink-0"
                      title="Generate unique code & barcode"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode EAN *</label>
                  <input
                    type="text"
                    required
                    placeholder="8991234..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full rounded-lg border border-slate-100 p-2 font-mono bg-slate-50 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Nama Product */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Product Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Susu Cair Bendera Cokelat 1L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Persediaan</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-2 font-medium bg-white focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Satuan SKU */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Stock</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 font-medium bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Pcs">Pcs (Keping)</option>
                    <option value="Bks">Bks (Bungkus)</option>
                    <option value="Box">Box (Karton)</option>
                    <option value="Rim">Rim (Kertas)</option>
                    <option value="Pouch">Pouch (Cairan)</option>
                    <option value="Botol">Botol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Harga Beli */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Harga Jual */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Stock awal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status checkbox */}
              <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="font-bold text-slate-700 select-none cursor-pointer">
                  Aktifkan Produk dalam Penjualan POS
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  Simpan Produk
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
