/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  Trash2, 
  ShoppingBag,
  ShoppingCart,
  Layers,
  FileCheck,
  FileSpreadsheet,
  Truck,
  Building,
  Mail,
  Phone,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Check,
  PlusCircle
} from 'lucide-react';
import { 
  Product, 
  Customer, 
  Supplier, 
  UserRole,
  CorporateDocument,
  CorporateDocumentItem,
  CorporateDocumentType,
  DocumentStatus
} from '../types';

export interface CorporateDocumentsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  suppliers: Supplier[];
  addAuditLog: (action: string, type: 'info' | 'success' | 'warning' | 'error', roleOverride?: string) => void;
  activeRole: UserRole;
  documents: CorporateDocument[];
  setDocuments: (value: React.SetStateAction<CorporateDocument[]>) => void;
}

// Initial seeded SCM documents for first-load and fallback state
export const INITIAL_CORPORATE_DOCUMENTS: CorporateDocument[] = [
  {
    id: 1,
    type: 'INQUIRY',
    documentNumber: 'INQ/PSI/2026/0501',
    customerId: 1,
    date: '2026-05-18',
    status: 'APPROVED',
    total: 3450000,
    discount: 0,
    tax: 379500,
    grandTotal: 3829500,
    notes: 'Inquiry harga awal untuk kebutuhan pengadaan ATK dan logistik karyawan baru.',
    createdBy: 'Andi (Purchasing)',
    createdAt: '2026-05-18T09:00:00Z',
    items: [
      { id: 101, documentId: 1, productId: 6, qty: 50, price: 54000, subtotal: 2700000 },
      { id: 102, documentId: 1, productId: 4, qty: 50, price: 15000, subtotal: 750000 }
    ]
  },
  {
    id: 2,
    type: 'QUOTATION',
    documentNumber: 'QTN/PSI/2026/0501',
    referenceNumber: 'INQ/PSI/PSI/2026/0501',
    customerId: 1,
    date: '2026-05-19',
    dueDate: '2026-06-19',
    status: 'SENT',
    total: 3450000,
    discount: 5, // 5% special corporate discount
    tax: 360525, // 11% VAT
    grandTotal: 3638025,
    notes: 'Penawaran harga resmi dengan diskon mitra 5%. Berlaku 30 hari.',
    createdBy: 'Andi (Purchasing)',
    createdAt: '2026-05-19T10:15:00Z',
    items: [
      { id: 201, documentId: 2, productId: 6, qty: 50, price: 54000, subtotal: 2700000 },
      { id: 202, documentId: 2, productId: 4, qty: 50, price: 15000, subtotal: 750000 }
    ]
  },
  {
    id: 3,
    type: 'SALES_ORDER',
    documentNumber: 'SO/PSI/2026/0502',
    referenceNumber: 'QTN/PSI/2026/0501',
    customerId: 1,
    date: '2026-05-20',
    status: 'APPROVED',
    total: 3277500,
    discount: 0,
    tax: 360525,
    grandTotal: 3638025,
    notes: 'Pesanan resmi disetujui untuk dikirimkan sesegera mungkin.',
    createdBy: 'Siti (Kasir)',
    createdAt: '2026-05-20T08:00:00Z',
    items: [
      { id: 301, documentId: 3, productId: 6, qty: 50, price: 51300, subtotal: 2565000 }, // Discounted price
      { id: 302, documentId: 3, productId: 4, qty: 50, price: 14250, subtotal: 712500 }
    ]
  },
  {
    id: 4,
    type: 'DELIVERY_ORDER',
    documentNumber: 'SJ/PSI/2026/0503',
    referenceNumber: 'SO/PSI/2026/0502',
    customerId: 1,
    date: '2026-05-20',
    status: 'COMPLETED',
    total: 0,
    discount: 0,
    tax: 0,
    grandTotal: 0,
    notes: 'Pengiriman via armada box PSI kurir logistik utama. Driver: Hasan Supardi.',
    createdBy: 'Hasan (Gudang)',
    createdAt: '2026-05-20T09:30:00Z',
    items: [
      { id: 401, documentId: 4, productId: 6, qty: 50, price: 0, subtotal: 0 },
      { id: 402, documentId: 4, productId: 4, qty: 50, price: 0, subtotal: 0 }
    ]
  },
  {
    id: 5,
    type: 'SALES_INVOICE',
    documentNumber: 'INV/PSI/2026/0504',
    referenceNumber: 'SO/PSI/2026/0502',
    customerId: 1,
    date: '2026-05-20',
    dueDate: '2026-06-03',
    status: 'SENT',
    total: 3277500,
    discount: 0,
    tax: 360525,
    grandTotal: 3638025,
    notes: 'Faktur Penjualan resmi Pajak PPN 11%. Termin pembayaran (TOP) 14 hari transfer BCA Mandiri.',
    createdBy: 'Rian (Finance)',
    createdAt: '2026-05-20T10:00:00Z',
    items: [
      { id: 501, documentId: 5, productId: 6, qty: 50, price: 51300, subtotal: 2565000 },
      { id: 502, documentId: 5, productId: 4, qty: 50, price: 14250, subtotal: 712500 }
    ]
  },
  {
    id: 6,
    type: 'PURCHASE_ORDER',
    documentNumber: 'PO/PSI/2026/0505',
    supplierId: 1,
    date: '2026-05-19',
    dueDate: '2026-05-26',
    status: 'APPROVED',
    total: 1380000,
    discount: 0,
    tax: 151800,
    grandTotal: 1531800,
    notes: 'Purchase order untuk restock kecap dan minyak goreng menjelang high season.',
    createdBy: 'Andi (Purchasing)',
    createdAt: '2026-05-19T14:00:00Z',
    items: [
      { id: 601, documentId: 6, productId: 1, qty: 30, price: 28000, subtotal: 840000 },
      { id: 602, documentId: 6, productId: 2, qty: 20, price: 14500, subtotal: 290000 },
      { id: 603, documentId: 6, productId: 5, qty: 10, price: 25000, subtotal: 250000 }
    ]
  }
];

export default function CorporateDocumentsView({
  products,
  setProducts,
  customers,
  suppliers,
  addAuditLog,
  activeRole,
  documents,
  setDocuments
}: CorporateDocumentsViewProps) {
  
  // Tab states for document type filters
  const [activeTab, setActiveTab] = useState<CorporateDocumentType>('INQUIRY');

  // Search and filter fields
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected document for details/modal printer printout view
  const [selectedDoc, setSelectedDoc] = useState<CorporateDocument | null>(documents[0] || null);

  useEffect(() => {
    if (!selectedDoc && documents && documents.length > 0) {
      setSelectedDoc(documents[0]);
    }
  }, [documents, selectedDoc]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating a new document
  const [docType, setDocType] = useState<CorporateDocumentType>('INQUIRY');
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [notes, setNotes] = useState('');
  const [docDiscount, setDocDiscount] = useState<number>(0);
  const [docTaxPercent, setDocTaxPercent] = useState<number>(11); // Standard PPN 11%
  const [formItems, setFormItems] = useState<{ productId: number; qty: number; price: number }[]>([
    { productId: products[0]?.id || 1, qty: 1, price: products[0]?.sellPrice || 10000 }
  ]);

  // SQL connection query script box helper
  const [showSQLHelper, setShowSQLHelper] = useState(true);

  // Map Document Type Label
  const getDocTypeLabel = (type: CorporateDocumentType) => {
    switch (type) {
      case 'INQUIRY': return 'Inquiry Penjualan (Sales Inquiry)';
      case 'QUOTATION': return 'Penawaran Harga (Sales Quotation)';
      case 'SALES_ORDER': return 'Pesanan Penjualan (Sales Order)';
      case 'DELIVERY_ORDER': return 'Surat Jalan (Delivery Order)';
      case 'SALES_INVOICE': return 'Faktur Penjualan (Sales Invoice)';
      case 'PURCHASE_ORDER': return 'Pesanan Pembelian (Purchase Order)';
    }
  };

  const getDocPrefix = (type: CorporateDocumentType) => {
    switch (type) {
      case 'INQUIRY': return 'INQ';
      case 'QUOTATION': return 'QTN';
      case 'SALES_ORDER': return 'SO';
      case 'DELIVERY_ORDER': return 'SJ';
      case 'SALES_INVOICE': return 'INV';
      case 'PURCHASE_ORDER': return 'PO';
    }
  };

  // IDR Currency Formatter Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Reset new document draft item rows
  const handleAddFormItem = () => {
    const defaultProduct = products[0];
    setFormItems(prev => [
      ...prev,
      { 
        productId: defaultProduct?.id || 1, 
        qty: 1, 
        price: docType === 'PURCHASE_ORDER' ? (defaultProduct?.buyPrice || 1000) : (defaultProduct?.sellPrice || 1000)
      }
    ]);
  };

  const handleRemoveFormItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFormItemProduct = (index: number, pId: number) => {
    const selectedProd = products.find(p => p.id === pId);
    if (!selectedProd) return;

    setFormItems(prev => {
      const copy = [...prev];
      copy[index].productId = pId;
      copy[index].price = docType === 'PURCHASE_ORDER' ? selectedProd.buyPrice : selectedProd.sellPrice;
      return copy;
    });
  };

  const handleUpdateFormItemQty = (index: number, value: number) => {
    setFormItems(prev => {
      const copy = [...prev];
      copy[index].qty = Math.max(1, value);
      return copy;
    });
  };

  const handleUpdateFormItemPrice = (index: number, value: number) => {
    setFormItems(prev => {
      const copy = [...prev];
      copy[index].price = Math.max(0, value);
      return copy;
    });
  };

  // Submit and Append draft document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate random doc ID and invoice number
    const year = new Date().getFullYear();
    const sequence = String(documents.length + 1).padStart(4, '0');
    const docNum = `${getDocPrefix(docType)}/PSI/${year}/${sequence}`;

    const itemsSum = formItems.reduce((acc, row) => acc + (row.qty * row.price), 0);
    const calculatedDiscountAmount = itemsSum * (docDiscount / 100);
    const subtotalAfterDisc = itemsSum - calculatedDiscountAmount;
    const calculatedTaxAmount = subtotalAfterDisc * (docTaxPercent / 100);
    const grandTotalVal = subtotalAfterDisc + calculatedTaxAmount;

    const nextId = documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1;

    const newDoc: CorporateDocument = {
      id: nextId,
      type: docType,
      documentNumber: docNum,
      customerId: docType !== 'PURCHASE_ORDER' ? Number(customerId) : undefined,
      supplierId: docType === 'PURCHASE_ORDER' ? Number(supplierId) : undefined,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Default TOP 14 days
      status: 'APPROVED',
      total: itemsSum,
      discount: docDiscount,
      tax: calculatedTaxAmount,
      grandTotal: grandTotalVal,
      notes: notes.trim() || `Di-input manual oleh operator perwakilan PSI`,
      createdBy: activeRole === 'admin' ? 'Administrator Utama' : 'Andi (SCM Officer)',
      createdAt: new Date().toISOString(),
      items: formItems.map((item, idx) => ({
        id: nextId * 1000 + idx,
        documentId: nextId,
        productId: Number(item.productId),
        qty: Number(item.qty),
        price: Number(item.price),
        subtotal: item.qty * item.price
      }))
    };

    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setShowCreateModal(false);

    // Audit Log tracking
    addAuditLog(`Dibuat corporate dokumen: [${docType}] #${docNum} untuk total ${formatIDR(grandTotalVal)}`, 'success', 'admin');

    // Trigger warehouse physical stock adjustment if it was a PO re-order or Delivery order!
    if (docType === 'PURCHASE_ORDER') {
      alert(`Purchase Order #${docNum} tersimpan. Silakan gunakan action "Selesaikan & Terima Barang" pada detail dokumen untuk melakukan restock gudang secara otomatis.`);
    }

    // Reset draft entries
    setNotes('');
    setDocDiscount(0);
    setFormItems([{ productId: products[0]?.id || 1, qty: 1, price: products[0]?.sellPrice || 1000 }]);
  };

  // STAGE PIPELINE TRANSITIONS (INQ -> QTN -> SO -> SJ / INV)
  const handleTransitionDocument = (doc: CorporateDocument, nextType: CorporateDocumentType) => {
    const year = new Date().getFullYear();
    const sequence = String(documents.length + 1).padStart(4, '0');
    const docNum = `${getDocPrefix(nextType)}/PSI/${year}/${sequence}`;

    const nextId = documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1;

    // Construct transitions payload
    const convertedDoc: CorporateDocument = {
      ...doc,
      id: nextId,
      type: nextType,
      documentNumber: docNum,
      referenceNumber: doc.documentNumber,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: nextType === 'DELIVERY_ORDER' ? 'COMPLETED' : 'SENT',
      createdAt: new Date().toISOString(),
      items: doc.items.map((item, idx) => ({
        ...item,
        id: nextId * 1000 + idx,
        documentId: nextId,
        // Delivery order items typically display quantity but sell prices could be 0 representing cargo details
        price: nextType === 'DELIVERY_ORDER' ? 0 : item.price,
        subtotal: nextType === 'DELIVERY_ORDER' ? 0 : item.subtotal
      }))
    };

    if (nextType === 'DELIVERY_ORDER') {
      convertedDoc.total = 0;
      convertedDoc.discount = 0;
      convertedDoc.tax = 0;
      convertedDoc.grandTotal = 0;
    }

    setDocuments(prev => [convertedDoc, ...prev]);
    setSelectedDoc(convertedDoc);
    addAuditLog(`Konversi Alur Dokumen: [${doc.type}] #${doc.documentNumber} diproses menjadi [${nextType}] #${docNum}`, 'success', 'admin');
    
    // Automatically trigger visual message depending on target
    if (nextType === 'DELIVERY_ORDER') {
      // Modify inventory stocks values as an actual outbound logistics delivery
      setProducts(prev => prev.map(p => {
        const docItem = doc.items.find(di => di.productId === p.id);
        if (docItem) {
          return { ...p, stock: Math.max(0, p.stock - docItem.qty) };
        }
        return p;
      }));
      addAuditLog(`Warehouse Logistik: Stock diturunkan secara real-time dari checkout Surat Jalan #${docNum}`, 'info', 'gudang');
      alert(`Sukses dikonversi menjadi Surat Jalan Logistik. Stok gudang untuk produk dalam list ini otomatis telah dipotong.`);
    } else {
      alert(`Dokumen berhasil melangkah ke tahap selanjutnya: ${getDocTypeLabel(nextType)} #${docNum}`);
    }
  };

  // Standard Purchase Order receipt processor (triggers restocking)
  const handleCompletePurchaseOrder = (doc: CorporateDocument) => {
    // Increment products stock based on items in PO
    setProducts(prev => prev.map(p => {
      const poItem = doc.items.find(item => item.productId === p.id);
      if (poItem) {
        return { ...p, stock: p.stock + poItem.qty };
      }
      return p;
    }));

    // Update PO document status to COMPLETED
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'COMPLETED' } : d));
    
    addAuditLog(`Pembelian PO Selesai: Logistik gudang menerima kiriman PO #${doc.documentNumber}. Stok bertambah.`, 'success', 'gudang');
    alert(`Otorisasi Logistik Gudang Sukses! Barang dalam Purchase Order #${doc.documentNumber} telah diterima dan stok produk diperbarui!`);
  };

  // Delete Document Row
  const handleDeleteDocument = (id: number) => {
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    if (confirm(`Apakah Anda yakin ingin menghapus arsip dokumen SCM [${docToDelete.type}] #${docToDelete.documentNumber} ini?`)) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      addAuditLog(`Menghapus arsip dokumen SCM [${docToDelete.type}] #${docToDelete.documentNumber}`, 'warning', 'admin');
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
    }
  };

  // Filter list
  const filteredDocs = documents.filter(d => {
    if (d.type !== activeTab) return false;
    
    const clientName = d.customerId 
      ? (customers.find(c => c.id === d.customerId)?.name || '') 
      : (suppliers.find(s => s.id === d.supplierId)?.name || '');
      
    const matchesSearch = d.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                          clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* UPPER TITLE PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <FileCheck size={18} />
            </span>
            Supply Chain & Corporate Sales Documents
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sistem pengarsipan, pembuatan, pencetakan berkas SCM dari Hulu ke Hilir dengan standard penulisan Kop Surat khusus <b>PT. UNIMETRIKA UTAMA</b>.
          </p>
        </div>

        <button
          onClick={() => {
            setDocType(activeTab);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-all cursor-pointer self-start"
        >
          <Plus size={14} />
          <span>Buat Dokumen Baru</span>
        </button>
      </div>

      {/* SCM STAGE STEPS METRIC BAR */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6 border border-slate-200/60 bg-white/80 backdrop-blur-md p-1.5 rounded-xl text-center">
        {[
          { type: 'INQUIRY', label: '1. Inquiry', desc: 'Permintaan Barang', color: 'border-l-blue-500' },
          { type: 'QUOTATION', label: '2. Offer Quotation', desc: 'Penawaran Harga', color: 'border-l-amber-500' },
          { type: 'SALES_ORDER', label: '3. Sales Order', desc: 'Pesanan Pelanggan', color: 'border-l-pink-500' },
          { type: 'DELIVERY_ORDER', label: '4. Surat Jalan', desc: 'Pengiriman Cargo', color: 'border-l-indigo-600 font-bold' },
          { type: 'SALES_INVOICE', label: '5. Faktur Tagihan', desc: 'Invoicing PPN', color: 'border-l-emerald-600' },
          { type: 'PURCHASE_ORDER', label: 'Purchase Order', desc: 'Re-stock Supplier', color: 'border-l-rose-500' }
        ].map((step) => (
          <button
            key={step.type}
            onClick={() => setActiveTab(step.type as CorporateDocumentType)}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-l-2 transition-all cursor-pointer ${step.color} ${
              activeTab === step.type 
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100/60'
            }`}
          >
            <span className="text-[10px] font-bold tracking-wide">{step.label}</span>
            <span className={`text-[8px] mt-0.5 ${activeTab === step.type ? 'text-slate-300' : 'text-slate-400'}`}>{step.desc}</span>
          </button>
        ))}
      </div>

      {/* SPLITSCREEN FOR ARCHIVE LISTS & WORKFLOW PREVIEWS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        
        {/* LEFT COMPARTMENT: DOCUMENT ARSIVE SHEETS (5 COLUMNS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* SEARCH BAR & STATUS DROPDOWN */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5 text-xs text-slate-700 font-semibold">
            <div className="relative">
              <Search className="absolute top-2 left-2.5 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Cari No. Dokumen / Client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex gap-2 items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Status:</span>
              <div className="flex gap-1.5">
                {['all', 'SENT', 'APPROVED', 'COMPLETED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-1.5 py-1 text-[9px] rounded font-black tracking-wider border cursor-pointer uppercase ${
                      statusFilter === st 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'Semua' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC DOCUMENT ITEMS CARD LISTING */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle size={20} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-[11px] font-bold">Tidak ada dokumen {activeTab} yang ditemukan</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                
                // Fetch associated customer or supplier name
                const clientName = doc.customerId 
                  ? (customers.find(c => c.id === doc.customerId)?.name || 'Pelanggan Ritel SCM')
                  : (suppliers.find(s => s.id === doc.supplierId)?.name || 'Supplier Utama');

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600 hover:bg-indigo-50/60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-black text-slate-900">{doc.documentNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        doc.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        doc.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' :
                        doc.status === 'SENT' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-800 font-bold mt-1.5">{clientName}</p>
                    {doc.referenceNumber && (
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block mt-0.5">Ref: {doc.referenceNumber}</span>
                    )}

                    <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                      <span>📆 {doc.date}</span>
                      {doc.type !== 'DELIVERY_ORDER' && (
                        <span className="font-mono font-bold text-slate-900">{formatIDR(doc.grandTotal)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COMPARTMENT: KOP SURAT DOCUMENT DETAIL PREVIEW (8 COLUMNS) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {selectedDoc ? (
            <div className="space-y-4">
              
              {/* TOP ACTIONS PANEL */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                <span className="text-slate-500 font-mono uppercase tracking-wider text-[10px] font-black">Detail Dokumen SCM</span>
                
                <div className="flex items-center gap-2">
                  
                  {/* Action Transition Buttons depend on status and type */}
                  {selectedDoc.type === 'INQUIRY' && (
                    <button
                      onClick={() => handleTransitionDocument(selectedDoc, 'QUOTATION')}
                      className="flex items-center gap-1.5 text-[10px] bg-slate-900 text-white font-black uppercase px-2.5 py-1.5 rounded"
                    >
                      <span>Konversi ke Penawaran (Quotation)</span>
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {selectedDoc.type === 'QUOTATION' && (
                    <button
                      onClick={() => handleTransitionDocument(selectedDoc, 'SALES_ORDER')}
                      className="flex items-center gap-1.5 text-[10px] bg-indigo-600 text-white font-black uppercase px-2.5 py-1.5 rounded"
                    >
                      <span>Konversi ke Sales Order</span>
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {selectedDoc.type === 'SALES_ORDER' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleTransitionDocument(selectedDoc, 'DELIVERY_ORDER')}
                        className="flex items-center gap-1.5 text-[10px] bg-indigo-600 text-white font-black uppercase px-2 py-1.5 rounded"
                      >
                        <Truck size={12} />
                        <span>Kirim Surat Jalan</span>
                      </button>
                      <button
                        onClick={() => handleTransitionDocument(selectedDoc, 'SALES_INVOICE')}
                        className="flex items-center gap-1.5 text-[10px] bg-emerald-600 text-white font-black uppercase px-2 py-1.5 rounded"
                      >
                        <FileText size={12} />
                        <span>Tagih Faktur</span>
                      </button>
                    </div>
                  )}

                  {selectedDoc.type === 'PURCHASE_ORDER' && selectedDoc.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCompletePurchaseOrder(selectedDoc)}
                      className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1.5 rounded"
                    >
                      <Check size={12} />
                      Selesaikan & Terima Barang (Re-Stock)
                    </button>
                  )}

                  {/* Cetak printout trigger */}
                  <button
                    onClick={() => {
                      window.print();
                      addAuditLog(`Printout dicetak untuk dokumen [${selectedDoc.type}] #${selectedDoc.documentNumber}`, 'info');
                    }}
                    className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase px-2 py-1.5 rounded"
                  >
                    <Printer size={12} />
                    Cetak
                  </button>

                  {/* Delete record */}
                  <button
                    onClick={() => handleDeleteDocument(selectedDoc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Hapus Dokumen SCM"
                  >
                    <Trash2 size={13} />
                  </button>

                </div>
              </div>

              {/* DYNAMIC SCROLLER WRAPPER FOR INDONESIAN KOP SURAT PRINT AREA */}
              <div className="p-8 select-text" id="printable-scm-bill">
                <div className="max-w-3xl mx-auto border-2 border-slate-300 p-8 rounded-xl bg-white space-y-6 shadow-sm font-sans text-xs">
                  
                  {/* PT. PRESITAMA SERVICE INDUSTRY - KOP SURAT PAJAK */}
                  <div className="flex flex-col md:flex-row justify-between items-center pb-4 border-b-2 border-double border-slate-900 gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-sans">PT. UNIMETRIKA UTAMA</h1>
                      <div className="text-[10px] font-semibold text-slate-500 max-w-lg leading-relaxed">
                        <p>JL. Agung Timur 8 Blok D Kav. No.7 Sunter Jaya – Tanjung Priok Jakarta, Indonesia - 14350</p>
                        <p className="mt-0.5">📧 {`tuti@unimetrika.co.id, tuti.santoso@gmail.com`} | 📞 {`02165304111 / Fax: 02165304110 / Mob: +6281310318868`}</p>
                      </div>
                    </div>
                    
                    {/* Visual Stamp Block */}
                    <div className="shrink-0 border-2 border-dashed border-indigo-400 text-indigo-700 p-2 text-center rounded text-[10px] font-black tracking-wider uppercase">
                      PT. UNIMETRIKA UTAMA <br />
                      <span className="text-[8px] font-mono text-slate-400">STATUS: APPROVED CO.</span>
                    </div>
                  </div>

                  {/* DOCUMENT LOG TITLE & SPECIFIC BILL METRICS */}
                  <div className="flex justify-between items-start pt-2 gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-sans tracking-wide uppercase">
                        {selectedDoc.type === 'INQUIRY' ? 'INQUIRY PENJUALAN' :
                         selectedDoc.type === 'QUOTATION' ? 'SALES QUOTATION (PENAWARAN HARGA)' :
                         selectedDoc.type === 'SALES_ORDER' ? 'PESANAN PENJUALAN (SALES ORDER)' :
                         selectedDoc.type === 'DELIVERY_ORDER' ? 'SURAT JALAN (DELIVERY NOTE)' :
                         selectedDoc.type === 'SALES_INVOICE' ? 'FAKTUR PENJUALAN (SALES INVOICE)' : 'PURCHASE ORDER (PROCUREMENT)'}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-400">Nomor: {selectedDoc.documentNumber}</span>
                      {selectedDoc.referenceNumber && (
                        <span className="block text-[10px] font-mono text-slate-500 mt-0.5">Referensi No: {selectedDoc.referenceNumber}</span>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-semibold text-slate-500">Tanggal: <span className="font-mono text-slate-900">{selectedDoc.date}</span></p>
                      {selectedDoc.dueDate && (
                        <p className="font-semibold text-slate-500">Termin/Jatuh Tempo: <span className="font-mono text-slate-900">{selectedDoc.dueDate}</span></p>
                      )}
                      <p className="font-semibold text-slate-500">Status berkas: <span className="font-semibold text-slate-900 font-mono uppercase">{selectedDoc.status}</span></p>
                    </div>
                  </div>

                  {/* CUSTOMER / VENDOR INFO BLOCK (Left-Right split) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed text-slate-600 font-semibold">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider mb-1">Diterbitkan Atas Nama:</span>
                      <p className="text-xs font-bold text-indigo-950">PT. UNIMETRIKA UTAMA</p>
                      <p className="text-[11px] text-slate-500 mt-1">Seksi Divisi SCM Logistik Utama</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Operator: {selectedDoc.createdBy}</p>
                    </div>

                    <div>
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider mb-1">Ditujukan Kepada Yth:</span>
                      {selectedDoc.customerId ? (() => {
                        const cust = customers.find(c => c.id === selectedDoc.customerId);
                        return (
                          <div>
                            <p className="text-xs font-bold text-slate-900">{cust?.name || 'Pelanggan Umum'}</p>
                            <p className="text-[11px] mt-0.5">{cust?.address || 'Kawasan Industri MM2100 Cibitung'}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">Telp: {cust?.phone || '+62'}</p>
                          </div>
                        );
                      })() : (() => {
                        const sup = suppliers.find(s => s.id === selectedDoc.supplierId);
                        return (
                          <div>
                            <p className="text-xs font-bold text-slate-900">{sup?.name || 'Supplier Mitra Dagang'}</p>
                            <p className="text-[11px] mt-0.5">{sup?.address || 'Bekasi - Indonesia'}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">Telp: {sup?.phone || '+62'}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ARTICLES INCLUDED LIST TABLE */}
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-left font-serif text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-sans text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">SKU / Code</th>
                          <th className="px-4 py-2.5">Nama Deskripsi Produk</th>
                          <th className="px-4 py-2.5 text-center">Qty / Vol</th>
                          <th className="px-4 py-2.5 text-right">Harga Satuan (IDR)</th>
                          <th className="px-4 py-2.5 text-right">Subtotal Belanja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans text-slate-700 font-medium">
                        {selectedDoc.items.map((row) => {
                          const prod = products.find(p => p.id === row.productId);
                          return (
                            <tr key={row.id}>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500 font-bold">{prod?.code || 'SKU'}</td>
                              <td className="px-4 py-3 font-bold text-slate-900">{prod?.name || 'Produk SCM'}</td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{row.qty} {prod?.unit || 'Pcs'}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-700">
                                {selectedDoc.type === 'DELIVERY_ORDER' ? '-' : formatIDR(row.price)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                                {selectedDoc.type === 'DELIVERY_ORDER' ? '-' : formatIDR(row.subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* SUMMARY SECTION */}
                  {selectedDoc.type !== 'DELIVERY_ORDER' && (
                    <div className="flex justify-end pt-2">
                      <div className="w-full max-w-xs space-y-1.5 text-xs text-slate-600 font-semibold">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Subtotal Belanja:</span>
                          <span className="font-mono text-slate-900 font-bold">{formatIDR(selectedDoc.total)}</span>
                        </div>
                        {selectedDoc.discount > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                            <span>Diskon Potongan ({selectedDoc.discount}%):</span>
                            <span className="font-mono font-bold">-{formatIDR(selectedDoc.total * (selectedDoc.discount / 100))}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>PPN Terhitung (11%):</span>
                          <span className="font-mono text-slate-900 font-bold">{formatIDR(selectedDoc.tax)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-indigo-700 font-black text-sm border-t border-slate-200">
                          <span>Grand Total Bersih:</span>
                          <span className="font-mono">{formatIDR(selectedDoc.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTES SECTION */}
                  <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl leading-relaxed">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Ketentuan / Catatan Dokumen:</span>
                    <p className="text-[11px] text-slate-600 mt-1 font-semibold italic">"{selectedDoc.notes}"</p>
                  </div>

                  {/* DOUBLE SIGNATURE BLOCK - CORPORATE STANDARD */}
                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500 font-semibold leading-relaxed">
                    <div className="space-y-12">
                      <p>Hormat Kami,<br /><strong>PT. UNIMETRIKA UTAMA</strong></p>
                      <div>
                        <span className="border-b border-slate-400 block w-40 mx-auto font-bold text-slate-800">{selectedDoc.createdBy}</span>
                        <span className="text-[9px] text-slate-400">Divisi SCM Otorisator</span>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p>Penerima Barang / <br /><strong>Mitra Usaha</strong></p>
                      <div>
                        <span className="border-b border-slate-400 block w-40 mx-auto font-bold text-slate-800">___________________</span>
                        <span className="text-[9px] text-slate-400">Tanda Tangan & Cap Basah</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-400">
              <FileText size={44} className="mx-auto text-slate-200 mb-3 animate-pulse" />
              <p className="text-sm font-bold">Silakan pilih salah satu arsip dokumen di sisi kiri untuk mencetak dokumen kop surat secara langsung.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DIALOG: WRITE NEW CORPORATE TRANSACTION DOCUMENT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 text-xs text-slate-700 font-semibold space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Buat Dokumen SCM / Corporate Baru</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sandi penulisan resmi nomor faktur otomatis dibuat oleh server PT. PSI</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-xs font-black cursor-pointer"
              >
                Tutup [x]
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              
              {/* Row 1: Document type selection & client type list */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jenis Dokumen</label>
                  <select
                    value={docType}
                    onChange={(e) => {
                      const selectedType = e.target.value as CorporateDocumentType;
                      setDocType(selectedType);
                      // Set default prices depending on PO vs Sales Quot/SO
                      setFormItems(prev => prev.map(item => {
                        const prod = products.find(p => p.id === item.productId);
                        return {
                          ...item,
                          price: selectedType === 'PURCHASE_ORDER' ? (prod?.buyPrice || 1000) : (prod?.sellPrice || 1000)
                        };
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-slate-800"
                  >
                    <option value="INQUIRY">Inquiry Penjualan (Sales Inquiry)</option>
                    <option value="QUOTATION">Penawaran Harga (Sales Quotation)</option>
                    <option value="SALES_ORDER">Pesanan Penjualan (Sales Order)</option>
                    <option value="DELIVERY_ORDER">Surat Jalan (Delivery Order)</option>
                    <option value="SALES_INVOICE">Faktur Penjualan (Sales Invoice)</option>
                    <option value="PURCHASE_ORDER">Purchase Order (Restock Bahan PO)</option>
                  </select>
                </div>

                {docType === 'PURCHASE_ORDER' ? (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Pilih Supplier Mitra *</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - Hub: {s.phone}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Pilih Customer *</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ARTICLE INPUT ROWS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="font-bold text-slate-800">List Produk Barang dalam Dokumen</span>
                  <button
                    type="button"
                    onClick={handleAddFormItem}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 cursor-pointer uppercase"
                  >
                    <PlusCircle size={12} /> Tambah Baris Produk
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      
                      {/* Product Selector */}
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateFormItemProduct(index, Number(e.target.value))}
                          className="w-full rounded border border-slate-200 p-1.5 text-[11px]"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} [{p.code}] - sisa {p.stock} {p.unit}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => handleUpdateFormItemQty(index, Number(e.target.value))}
                          className="w-full rounded border border-slate-200 p-1 font-mono font-bold text-center"
                        />
                      </div>

                      {/* Unit Price (shown if not Delivery Order) */}
                      {docType !== 'DELIVERY_ORDER' && (
                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            placeholder="Harga Rp"
                            value={item.price}
                            onChange={(e) => handleUpdateFormItemPrice(index, Number(e.target.value))}
                            className="w-full rounded border border-slate-200 p-1 font-mono text-right"
                          />
                        </div>
                      )}

                      {/* Remove item button */}
                      <button
                        type="button"
                        disabled={formItems.length === 1}
                        onClick={() => handleRemoveFormItem(index)}
                        className="text-slate-400 hover:text-red-500 rounded p-1 cursor-pointer disabled:opacity-30"
                      >
                        <Trash2 size={13} />
                      </button>

                    </div>
                  ))}
                </div>
              </div>

              {/* Financial calculations & variables */}
              {docType !== 'DELIVERY_ORDER' && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Diskon Mitra SCM (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={docDiscount}
                      onChange={(e) => setDocDiscount(Math.min(90, Number(e.target.value)))}
                      className="w-full rounded border border-slate-200 p-1 px-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">PPN (%)</label>
                    <select
                      value={docTaxPercent}
                      onChange={(e) => setDocTaxPercent(Number(e.target.value))}
                      className="w-full rounded border border-slate-200 p-1 text-xs"
                    >
                      <option value="11">PPN 11% (Normal PK)</option>
                      <option value="0">Bebas Pajak (0%)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Catatan Dokumen / Syarat SCM</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Barang dikirim menggunakan ekspedisi internal PT. PSI, pembayaran cash on delivery tempo 14 hari."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-medium"
                />
              </div>

              {/* Submit Buttons footer */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700 shadow cursor-pointer"
                >
                  Terbitkan Dokumen PT. PSI
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
