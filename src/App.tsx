/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  UserCheck, 
  ArrowRight, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Lock,
  ArrowUpRight,
  Database,
  Plus,
  X
} from 'lucide-react';
import { 
  UserProfile, 
  UserRole, 
  Product, 
  Category, 
  Supplier, 
  Customer, 
  Sales, 
  Purchase, 
  StockMovement, 
  FinancialTransaction, 
  SystemAuditLog,
  CorporateDocument
} from './types';

import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SALES, 
  INITIAL_PURCHASES, 
  INITIAL_FINANCEDATA, 
  INITIAL_AUDIT_LOGS 
} from './data/mockData';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import ProductView from './components/ProductView';
import SalesView from './components/SalesView';
import PurchaseView from './components/PurchaseView';
import FinanceView from './components/FinanceView';
import SchemaView from './components/SchemaView';
import CorporateDocumentsView, { INITIAL_CORPORATE_DOCUMENTS } from './components/CorporateDocumentsView';
import LoginView from './components/LoginView';

// Supabase services
import { checkSupabaseConnection } from './supabaseClient';
import { 
  fetchAllSupabaseData,
  insertCategory,
  deleteCategory,
  insertProduct,
  updateProduct,
  deleteProduct,
  insertSupplier,
  insertCustomer,
  insertSalesOrder,
  insertPurchaseOrder,
  insertFinancialRecord,
  seedSupabaseDatabase,
  insertCorporateDocument,
  updateCorporateDocumentStatus,
  deleteCorporateDocument
} from './supabaseService';

export default function App() {
  // 1. SYSTEM GENERAL SETTINGS
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('psi_is_logged_in') === 'true';
  });
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return (localStorage.getItem('psi_active_role') as UserRole) || 'admin';
  });
  const [currentView, setView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication callbacks
  const handleLoginSuccess = (role: UserRole) => {
    localStorage.setItem('psi_is_logged_in', 'true');
    localStorage.setItem('psi_active_role', role);
    setIsLoggedIn(true);
    setActiveRole(role);
    addAuditLog(`User berhasil login dengan izin penuh sebagai: [${role.toUpperCase()}]`, 'success', 'admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('psi_is_logged_in');
    localStorage.removeItem('psi_active_role');
    setIsLoggedIn(false);
    addAuditLog('Sesi pengguna dinonaktifkan. Keluar dari ERP Suite.', 'info', 'internal');
  };

  // 2. STATE DATA POOLS
  const [productsState, setProductsState] = useState<Product[]>(() => {
    const saved = localStorage.getItem('psi_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [categoriesState, setCategoriesState] = useState<Category[]>(() => {
    const saved = localStorage.getItem('psi_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [suppliersState, setSuppliersState] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('psi_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  const [customersState, setCustomersState] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('psi_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [salesState, setSalesState] = useState<Sales[]>(() => {
    const saved = localStorage.getItem('psi_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });
  const [purchasesState, setPurchasesState] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('psi_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });
  const [financialsState, setFinancialsState] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('psi_financials');
    return saved ? JSON.parse(saved) : INITIAL_FINANCEDATA;
  });
  const [corporateDocumentsState, setCorporateDocumentsState] = useState<CorporateDocument[]>(() => {
    const saved = localStorage.getItem('psi_corporate_documents');
    return saved ? JSON.parse(saved) : INITIAL_CORPORATE_DOCUMENTS;
  });
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(INITIAL_AUDIT_LOGS);

  // Synchronize master lists with localStorage so they persist cleanly in offline / sandbox mode!
  useEffect(() => {
    localStorage.setItem('psi_products', JSON.stringify(productsState));
  }, [productsState]);

  useEffect(() => {
    localStorage.setItem('psi_categories', JSON.stringify(categoriesState));
  }, [categoriesState]);

  useEffect(() => {
    localStorage.setItem('psi_suppliers', JSON.stringify(suppliersState));
  }, [suppliersState]);

  useEffect(() => {
    localStorage.setItem('psi_customers', JSON.stringify(customersState));
  }, [customersState]);

  useEffect(() => {
    localStorage.setItem('psi_sales', JSON.stringify(salesState));
  }, [salesState]);

  useEffect(() => {
    localStorage.setItem('psi_purchases', JSON.stringify(purchasesState));
  }, [purchasesState]);

  useEffect(() => {
    localStorage.setItem('psi_financials', JSON.stringify(financialsState));
  }, [financialsState]);

  // 2B. MODAL STATES FOR CATEGORY, SUPPLIER, AND CUSTOMER MANIPULATION
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // 3. SUPABASE INTEGRATION STATES
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'live' | 'no_tables' | 'error' | 'disconnected'>('checking');
  const [supabaseMessage, setSupabaseMessage] = useState('Sedang memeriksa koneksi Supabase...');
  const [isSeeding, setIsSeeding] = useState(false);

  // 4. INTERNAL ACTION DISPATCHERS
  const addAuditLog = (
    action: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    roleOverride?: string
  ) => {
    const nextLogId = `log-${Math.random().toString(36).substring(2, 9)}`;
    const newLogItem: SystemAuditLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      role: (roleOverride as UserRole) || activeRole,
      user: activeRole === 'admin' ? 'Administrator' : 
            activeRole === 'kasir' ? 'Siti (Kasir)' :
            activeRole === 'purchasing' ? 'Andi (Purchasing)' :
            activeRole === 'gudang' ? 'Hasan (Gudang)' : 'Rian (Finance)',
      action,
      type
    };
    setAuditLogs(prev => [newLogItem, ...prev]);
  };

  const addStockMovement = (
    productId: number,
    movementType: 'IN' | 'OUT',
    qty: number,
    referenceType: 'PURCHASE' | 'SALES' | 'MANUAL_ADJUSTMENT',
    referenceId: number
  ) => {
    const prodName = productsState.find(p => p.id === productId)?.name || 'Produk';
    const detail = `Barang ${movementType === 'IN' ? 'Masuk' : 'Keluar'}: [${qty} Pcs] dari ref: ${referenceType} #${referenceId}`;
    addAuditLog(`Stock Movement Registered: ${prodName}. ${detail}`, 'info');
  };

  const addFinancialRecord = (
    type: 'INCOME' | 'EXPENSE',
    description: string,
    amount: number
  ) => {
    const nextFnId = financialsState.length > 0 ? Math.max(...financialsState.map(f => f.id)) + 1 : 1;
    const newRecord: FinancialTransaction = {
      id: nextFnId,
      transactionDate: new Date().toISOString().slice(0, 10),
      type,
      description,
      amount,
      createdBy: activeRole === 'admin' ? 'System Ledger Broker' : 'Finance Operator Rian',
      createdAt: new Date().toISOString()
    };
    setFinancialsState(prev => [newRecord, ...prev]);
  };

  // ==========================================
  // REAL-TIME SUPABASE LIFECYCLE SYNC
  // ==========================================
  
  const refreshAllData = async (silent = false) => {
    if (!silent) {
      setSupabaseStatus('checking');
      setSupabaseMessage('Menghubungkan & mengunduh data terbaru dari Supabase...');
    }
    try {
      const data = await fetchAllSupabaseData();
      setProductsState(data.products);
      setCategoriesState(data.categories);
      setSuppliersState(data.suppliers);
      setCustomersState(data.customers);
      setSalesState(data.sales);
      setPurchasesState(data.purchases);
      setFinancialsState(data.financials);
      setCorporateDocumentsState(data.corporateDocuments);

      setSupabaseStatus('live');
      setSupabaseMessage('Tersambung penuh secara live ke database Supabase LITE-ERP!');
      
      // Seed a log
      if (!silent) {
        addAuditLog('Koneksi live Supabase berhasil dimuat. Seluruh data operasional ditarik dari server.', 'success');
      }
    } catch (err: any) {
      console.warn('Failed to load from Supabase:', err.message);
      const isMissingTable = err.message.includes('relation') || err.message.includes('does not exist') || err.message.includes('42P01');
      if (isMissingTable) {
        setSupabaseStatus('no_tables');
        setSupabaseMessage('API tersambung, tetapi tabel-tabel ERP belum terbuat di Supabase. Silakan jalankan SQL Blueprint di menu Schema.');
      } else {
        setSupabaseStatus('error');
        setSupabaseMessage(`Koneksi Supabase bermasalah: ${err.message || err}. Berjalan dalam Mode Demo Lokal.`);
      }
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    addAuditLog('Memulai pemasangan data awal (Seed) ke database Supabase...', 'info');
    const result = await seedSupabaseDatabase({
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      suppliers: INITIAL_SUPPLIERS,
      customers: INITIAL_CUSTOMERS,
      financials: INITIAL_FINANCEDATA
    });

    if (result.success) {
      addAuditLog(result.message, 'success');
      alert(result.message);
      await refreshAllData(true);
    } else {
      addAuditLog(`Gagal seeding: ${result.message}`, 'error');
      alert(`Gagal seeding: ${result.message}. Pastikan Anda sudah membuat tabel-tabel database dengan menyalin SQL Script di tab Schema ke SQL Editor Supabase terlebih dahulu.`);
    }
    setIsSeeding(false);
  };

  // ==========================================
  // INTERCEPTED REAL-TIME SETTERS FOR WRITES
  // ==========================================

  // Wrapper for setProducts
  const setProducts = async (value: React.SetStateAction<Product[]>) => {
    let nextProducts: Product[];
    if (typeof value === 'function') {
      nextProducts = (value as any)(productsState);
    } else {
      nextProducts = value;
    }
    
    // Snappy memory backup update 
    setProductsState(nextProducts);

    if (supabaseStatus === 'live') {
      try {
        if (nextProducts.length > productsState.length) {
          const added = nextProducts.find(n => !productsState.some(p => p.id === n.id));
          if (added) {
            const fresh = await insertProduct(added);
            setProductsState(prev => prev.map(p => p.id === added.id ? fresh : p));
            addAuditLog(`Supabase Live: Produk [${fresh.code}] ${fresh.name} tersimpan ke server.`, 'success');
          }
        } else if (nextProducts.length < productsState.length) {
          const deleted = productsState.find(p => !nextProducts.some(n => n.id === p.id));
          if (deleted) {
            await deleteProduct(deleted.id);
            addAuditLog(`Supabase Live: Produk #${deleted.id} terhapus dari server.`, 'warning');
          }
        } else {
          // Identify update
          for (const nextP of nextProducts) {
            const oldP = productsState.find(o => o.id === nextP.id);
            if (oldP && JSON.stringify(oldP) !== JSON.stringify(nextP)) {
              await updateProduct(nextP.id, nextP);
            }
          }
        }
      } catch (err: any) {
        console.error('Supabase write error:', err);
        addAuditLog(`Supabase Sync Warning: Gagal menulis update produk (${err.message})`, 'warning');
      }
    }
  };

  const setSales = async (value: React.SetStateAction<Sales[]>) => {
    let nextSales: Sales[];
    if (typeof value === 'function') {
      nextSales = (value as any)(salesState);
    } else {
      nextSales = value;
    }
    setSalesState(nextSales);

    if (supabaseStatus === 'live') {
      try {
        if (nextSales.length > salesState.length) {
          const added = nextSales.find(n => !salesState.some(s => s.id === n.id));
          if (added) {
            const freshSales = await insertSalesOrder(
              {
                invoiceNumber: added.invoiceNumber,
                customerId: added.customerId,
                salesDate: added.salesDate,
                total: added.total,
                paymentMethod: added.paymentMethod,
                paymentStatus: added.paymentStatus || 'PAID',
                discount: added.discount,
                tax: added.tax,
                grandTotal: added.grandTotal,
                createdBy: added.createdBy
              },
              added.items.map(item => ({
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                subtotal: item.subtotal
              }))
            );
            setSalesState(prev => prev.map(s => s.id === added.id ? freshSales : s));
            addAuditLog(`Supabase Live: Transaksi POS SLS #${freshSales.invoiceNumber} tercatat di awan.`, 'success');
            
            // Re-fetch to load recalculated stock values triggered automatically in pg_sql
            await refreshAllData(true);
          }
        }
      } catch (err: any) {
        console.error('Supabase Sales write error:', err);
        addAuditLog(`Supabase Sync Warning: Gagal sinkronisasi penjualan POS (${err.message})`, 'warning');
      }
    }
  };

  const setPurchases = async (value: React.SetStateAction<Purchase[]>) => {
    let nextPurchases: Purchase[];
    if (typeof value === 'function') {
      nextPurchases = (value as any)(purchasesState);
    } else {
      nextPurchases = value;
    }
    setPurchasesState(nextPurchases);

    if (supabaseStatus === 'live') {
      try {
        if (nextPurchases.length > purchasesState.length) {
          const added = nextPurchases.find(n => !purchasesState.some(p => p.id === n.id));
          if (added) {
            const freshPurch = await insertPurchaseOrder(
              {
                invoiceNumber: added.invoiceNumber,
                supplierId: added.supplierId,
                purchaseDate: added.purchaseDate,
                total: added.total,
                paymentMethod: added.paymentMethod || 'Cash',
                paymentStatus: added.paymentStatus || 'PAID',
                createdBy: added.createdBy
              },
              added.items.map(item => ({
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                subtotal: item.subtotal
              }))
            );
            setPurchasesState(prev => prev.map(p => p.id === added.id ? freshPurch : p));
            addAuditLog(`Supabase Live: Transaksi Pembelian PUR #${freshPurch.invoiceNumber} tersimpan di awan.`, 'success');

            // Re-fetch to load average costs and stocks
            await refreshAllData(true);
          }
        }
      } catch (err: any) {
        console.error('Supabase Purchase write error:', err);
        addAuditLog(`Supabase Sync Warning: Gagal sinkronisasi pembelian (${err.message})`, 'warning');
      }
    }
  };

  const setFinancials = async (value: React.SetStateAction<FinancialTransaction[]>) => {
    let nextFinancials: FinancialTransaction[];
    if (typeof value === 'function') {
      nextFinancials = (value as any)(financialsState);
    } else {
      nextFinancials = value;
    }
    setFinancialsState(nextFinancials);

    if (supabaseStatus === 'live') {
      try {
        if (nextFinancials.length > financialsState.length) {
          const added = nextFinancials.find(n => !financialsState.some(f => f.id === n.id));
          if (added) {
            const freshFin = await insertFinancialRecord({
              transactionDate: added.transactionDate,
              type: added.type,
              description: added.description,
              amount: added.amount,
              createdBy: added.createdBy
            });
            setFinancialsState(prev => prev.map(f => f.id === added.id ? freshFin : f));
            addAuditLog(`Supabase Live: Jurnal manual sebesar Rp ${freshFin.amount.toLocaleString()} terkirim.`, 'success');
          }
        }
      } catch (err: any) {
        console.error('Supabase finance transaction error:', err);
        addAuditLog(`Supabase Sync Warning: Gagal sinkronisasi transaksi Kas (${err.message})`, 'warning');
      }
    }
  };

  const setCorporateDocuments = async (value: React.SetStateAction<CorporateDocument[]>) => {
    let nextDocs: CorporateDocument[];
    if (typeof value === 'function') {
      nextDocs = (value as any)(corporateDocumentsState);
    } else {
      nextDocs = value;
    }
    setCorporateDocumentsState(nextDocs);
    localStorage.setItem('psi_corporate_documents', JSON.stringify(nextDocs));

    if (supabaseStatus === 'live') {
      try {
        if (nextDocs.length > corporateDocumentsState.length) {
          const added = nextDocs.find(n => !corporateDocumentsState.some(d => d.id === n.id));
          if (added) {
            const fresh = await insertCorporateDocument(
              {
                type: added.type,
                documentNumber: added.documentNumber,
                referenceNumber: added.referenceNumber,
                customerId: added.customerId,
                supplierId: added.supplierId,
                date: added.date,
                dueDate: added.dueDate,
                status: added.status,
                total: added.total,
                discount: added.discount,
                tax: added.tax,
                grandTotal: added.grandTotal,
                notes: added.notes,
                createdBy: added.createdBy
              },
              added.items.map(item => ({
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                subtotal: item.subtotal
              }))
            );
            setCorporateDocumentsState(prev => prev.map(d => d.id === added.id ? fresh : d));
            addAuditLog(`Supabase Live: Dokumen SCM [${fresh.type}] #${fresh.documentNumber} terkirim.`, 'success');
          }
        } else if (nextDocs.length < corporateDocumentsState.length) {
          const deleted = corporateDocumentsState.find(d => !nextDocs.some(n => n.id === d.id));
          if (deleted) {
            await deleteCorporateDocument(deleted.id);
            addAuditLog(`Supabase Live: Arsip Dokumen #${deleted.documentNumber} terhapus dari server.`, 'warning');
          }
        } else {
          // Check for status updates or status transitions
          for (const nextD of nextDocs) {
            const oldD = corporateDocumentsState.find(o => o.id === nextD.id);
            if (oldD && oldD.status !== nextD.status) {
              await updateCorporateDocumentStatus(nextD.id, nextD.status);
              addAuditLog(`Supabase Live: Status Dokumen #${nextD.documentNumber} diperbarui menjadi ${nextD.status}.`, 'info');
            }
          }
        }
      } catch (err: any) {
        console.error('Supabase Corporate Doc write error:', err);
        addAuditLog(`Supabase Sync Warning: Gagal sinkronisasi Dokumen SCM (${err.message})`, 'warning');
      }
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) return;
    const nextId = categoriesState.length > 0 ? Math.max(...categoriesState.map(c => c.id)) + 1 : 1;
    const newCat = { id: nextId, name };
    
    setCategoriesState(prev => [...prev, newCat]);
    addAuditLog(`Menambahkan Kategori Baru: ${name}`, 'success');

    if (supabaseStatus === 'live') {
      try {
        const freshCat = await insertCategory(name);
        setCategoriesState(prev => prev.map(c => c.id === nextId ? freshCat : c));
        addAuditLog(`Supabase Live: Kategori "${name}" berhasil sinkron dengan ID ${freshCat.id}`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Kategori ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleAddSupplier = async (name: string, phone: string, address: string) => {
    if (!name.trim()) return;
    const nextId = suppliersState.length > 0 ? Math.max(...suppliersState.map(s => s.id)) + 1 : 1;
    const newSup = { id: nextId, name, phone, address };

    setSuppliersState(prev => [...prev, newSup]);
    addAuditLog(`Menambahkan Supplier Baru: ${name}`, 'success');

    if (supabaseStatus === 'live') {
      try {
        const freshSup = await insertSupplier({ name, phone, address });
        setSuppliersState(prev => prev.map(s => s.id === nextId ? freshSup : s));
        addAuditLog(`Supabase Live: Supplier "${name}" berhasil sinkron dengan ID ${freshSup.id}`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Supplier ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleAddCustomer = async (name: string, phone: string, address: string) => {
    if (!name.trim()) return;
    const nextId = customersState.length > 0 ? Math.max(...customersState.map(c => c.id)) + 1 : 1;
    const newCust = { id: nextId, name, phone, address };

    setCustomersState(prev => [...prev, newCust]);
    addAuditLog(`Menambahkan Pelanggan Baru: ${name}`, 'success');

    if (supabaseStatus === 'live') {
      try {
        const freshCust = await insertCustomer({ name, phone, address });
        setCustomersState(prev => prev.map(c => c.id === nextId ? freshCust : c));
        addAuditLog(`Supabase Live: Pelanggan "${name}" berhasil sinkron dengan ID ${freshCust.id}`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Pelanggan ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  // Proxy getters for child views
  const products = productsState;
  const categories = categoriesState;
  const suppliers = suppliersState;
  const customers = customersState;
  const sales = salesState;
  const purchases = purchasesState;
  const financials = financialsState;

  // 4. ROLE POLICIES & BOUNDARIES VALIDATION
  const isViewAuthorized = (viewId: string, role: UserRole): boolean => {
    // Schema SQL, Settings & Dashboard are accessible to all Roles for ease of demo & learning
    if (['dashboard', 'schema', 'scmdocuments'].includes(viewId)) return true;
    
    switch (role) {
      case 'admin':
        return true; 
      case 'kasir':
        return ['sales', 'customers'].includes(viewId);
      case 'purchasing':
        return ['purchase', 'suppliers', 'products'].includes(viewId);
      case 'gudang':
        return ['stock', 'products', 'categories'].includes(viewId);
      case 'finance':
        return ['finance', 'purchase', 'sales'].includes(viewId);
      default:
        return false;
    }
  };


  const currentRoleLabels: Record<UserRole, string> = {
    admin: 'Administrator Utama',
    kasir: 'Kasir Retail POS',
    purchasing: 'Purchasing / Procurement',
    gudang: 'Logistik Gudang',
    finance: 'Staf Keuangan'
  };

  // Switch role and log it
  const handleRoleSimulationSwap = (role: UserRole) => {
    setActiveRole(role);
    addAuditLog(`Simulasi pergantian Role aktif sistem menjadi: ${currentRoleLabels[role].toUpperCase()}`, 'info');
  };

  // Render Restricted Screen layout
  const renderRestrictedCard = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="rounded-full bg-red-50 p-4 border border-red-100 text-red-600 mb-4 animate-bounce">
          <Lock size={44} />
        </div>
        
        <h3 className="text-lg font-extrabold text-slate-900">Akses Diblokir - Kebijakan Supabase RLS Aktif</h3>
        <p className="mt-2 text-xs text-slate-500 max-w-md leading-relaxed">
          Sistem mendeteksi peran aktif saat ini adalah <b>{currentRoleLabels[activeRole]} ({activeRole})</b>. Berdasarkan blueprint kebijakan keamanan PostgreSQL RLS, peran Anda tidak memiliki hak istimewa (SELECT/INSERT) untuk membuka modul ini.
        </p>

        {/* Informative advice */}
        <div className="mt-6 border border-slate-100 bg-slate-50 p-4 rounded-xl text-left max-w-lg text-xs font-medium space-y-1.5 text-slate-600">
          <p className="font-bold text-slate-800 flex items-center gap-1">
            <ShieldAlert size={14} className="text-orange-500" />
            Mengapa akses saya dibatasi?
          </p>
          <p>Mencegah kebocoran data operasional. ERP modern memisahkan kewajiban (Segregation of Duties):</p>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-slate-500">
            <li><b>Kasir</b> dilarang memanipulasi Harga Beli Produk.</li>
            <li><b>Gudang/Logistik</b> dilarang mencatat arus uang Cashbook perusahaan.</li>
            <li><b>Finance</b> dilarang langsung melakukan checkout kasir atau input supplier re-entry.</li>
          </ul>
        </div>

        {/* Quick developer bypass button */}
        <div className="mt-6">
          <button
            onClick={() => handleRoleSimulationSwap('admin')}
            className="rounded-lg bg-blue-600 text-white font-bold py-2.5 px-4 text-xs hover:bg-blue-700 transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Bypass RLS: Ganti Peran ke Admin</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // 5. VIEW ROUTER CONTAINER SELECTOR
  const renderActiveView = () => {
    if (!isViewAuthorized(currentView, activeRole)) {
      return renderRestrictedCard();
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            products={products}
            sales={sales}
            purchases={purchases}
            financials={financials}
            auditLogs={auditLogs}
            setView={setView}
            activeRole={activeRole}
            supabaseStatus={supabaseStatus}
            supabaseMessage={supabaseMessage}
            isSeeding={isSeeding}
            onSeedDatabase={handleSeedDatabase}
            onReconnect={() => refreshAllData()}
          />
        );
      case 'products':
        return (
          <ProductView 
            products={products}
            setProducts={setProducts}
            categories={categories}
            addAuditLog={addAuditLog}
            activeRole={activeRole}
          />
        );
      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Kategori Persediaan</h2>
                <p className="text-xs text-slate-500 font-medium">Pengelompokan produk master untuk optimasi klasifikasi</p>
              </div>
              <button
                onClick={() => {
                  setNewCategoryName('');
                  setShowAddCategoryModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Kategori</span>
              </button>
            </div>
            
            <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <span className="block text-xs font-bold uppercase text-slate-400">Daftar Kategori Aktif</span>
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="flex justify-between items-center rounded-lg border border-slate-100 p-3 bg-slate-50 font-bold text-slate-800 text-xs">
                    <span>{cat.name}</span>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                      ID: {cat.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Master Data Supplier</h2>
                <p className="text-xs text-slate-500 font-medium">Mitra bisnis/vendor penunjang re-stock barang di gudang utama</p>
              </div>
              <button
                onClick={() => {
                  setNewSupplierName('');
                  setNewSupplierPhone('');
                  setNewSupplierAddress('');
                  setShowAddSupplierModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Supplier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {suppliers.map(sup => (
                <div key={sup.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-xs font-semibold text-slate-700 leading-relaxed space-y-2">
                  <span className="bg-blue-50 text-blue-700 font-black rounded text-[9px] uppercase px-1.5 py-0.5">Supplier {sup.id}</span>
                  <h4 className="text-sm font-bold text-slate-900">{sup.name}</h4>
                  <p>📞 Phone: <span className="font-mono text-slate-600">{sup.phone}</span></p>
                  <p className="text-slate-500">🏠 {sup.address}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'customers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Master Data Pelanggan Utama</h2>
                <p className="text-xs text-slate-500 font-medium">Database profil pelanggan setia untuk pengiriman invoice dan pencatatan riwayat beli</p>
              </div>
              <button
                onClick={() => {
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                  setNewCustomerAddress('');
                  setShowAddCustomerModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Pelanggan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {customers.map(cust => (
                <div key={cust.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-xs font-semibold text-slate-700 leading-relaxed space-y-2">
                  <span className="bg-purple-50 text-purple-700 font-black rounded text-[9px] uppercase px-1.5 py-0.5">Customer {cust.id}</span>
                  <h4 className="text-sm font-bold text-slate-900">{cust.name}</h4>
                  <p>📞 Phone: <span className="font-mono text-slate-600">{cust.phone}</span></p>
                  <p className="text-slate-500">🏠 {cust.address}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'purchase':
        return (
          <PurchaseView 
            products={products}
            setProducts={setProducts}
            suppliers={suppliers}
            purchases={purchases}
            setPurchases={setPurchases}
            addStockMovement={addStockMovement}
            addFinancialRecord={addFinancialRecord}
            addAuditLog={addAuditLog}
            activeRole={activeRole}
          />
        );
      case 'sales':
        return (
          <SalesView 
            products={products}
            setProducts={setProducts}
            customers={customers}
            sales={sales}
            setSales={setSales}
            addStockMovement={addStockMovement}
            addFinancialRecord={addFinancialRecord}
            addAuditLog={addAuditLog}
            activeRole={activeRole}
          />
        );
      case 'stock':
        return (
          <div className="space-y-6 text-xs text-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Aktivitas Stock (Gudang Ledger)</h2>
              <p className="text-xs text-slate-500 font-medium">Buku log mutasi sirkulasi keluar masuk barang secara realtime</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Kode Produk SKU</th>
                      <th className="px-6 py-3.5">Nama Produk</th>
                      <th className="px-6 py-3.5">Status Ledger</th>
                      <th className="px-6 py-3.5">Volume Mutasi</th>
                      <th className="px-6 py-3.5">Referensi Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {/* Iterate recent sales & purchases to construct visual ledger */}
                    {sales.map(s => s.items.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <tr key={`sl-ld-${s.id}-${item.id}`} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-bold font-mono text-blue-600">{prod?.code || 'SKU'}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-800">{prod?.name || 'Item'}</td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-black px-2 py-0.5 text-[10px]">
                              OUT (KELUAR - CHECKOUT)
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-800 font-black">-{item.qty} {prod?.unit}</td>
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-500">Nota POS: #{s.invoiceNumber}</td>
                        </tr>
                      );
                    }))}

                    {purchases.map(p => p.items.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <tr key={`pr-ld-${p.id}-${item.id}`} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-bold font-mono text-blue-600">{prod?.code || 'SKU'}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-800">{prod?.name || 'Item'}</td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-black px-2 py-0.5 text-[10px]">
                              IN (MASUK - RESTOCK)
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-800 font-black">+{item.qty} {prod?.unit}</td>
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-500">Faktur Reorder: #{p.invoiceNumber}</td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'finance':
        return (
          <FinanceView 
            financials={financials}
            setFinancials={setFinancials}
            addAuditLog={addAuditLog}
            activeRole={activeRole}
            products={products}
            sales={sales}
            purchases={purchases}
            categories={categories}
            suppliers={suppliers}
            customers={customers}
            setPurchases={setPurchases}
            setSales={setSales}
          />
        );
      case 'schema':
        return <SchemaView />;
      case 'scmdocuments':
        return (
          <CorporateDocumentsView
            products={productsState}
            setProducts={setProducts}
            customers={customersState}
            suppliers={suppliersState}
            addAuditLog={addAuditLog}
            activeRole={activeRole}
            documents={corporateDocumentsState}
            setDocuments={setCorporateDocuments}
          />
        );
      default:
        return <div>View is under development.</div>;
    }
  };

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 antialiased overflow-hidden">
      
      {/* LATERAL SIDEBAR MENU CONTROLLER */}
      <Sidebar 
        currentView={currentView}
        setView={setView}
        activeRole={activeRole}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/* RIGHT UPPER ORCHESTRATION BOX */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* UPPER NAVBAR HEADER */}
        <Navbar 
          activeRole={activeRole}
          setActiveRole={handleRoleSimulationSwap}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
        />

        {/* MAIN DYNAMIC CONTENT SLIDE CANVAS */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {renderActiveView()}
        </main>

        {/* FOOTER METRICS AND STATUS INFO BAR */}
        <footer className="h-10 border-t border-slate-200 bg-white px-4 md:px-8 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${
              supabaseStatus === 'live' 
                ? 'bg-emerald-500 animate-pulse' 
                : supabaseStatus === 'checking' 
                ? 'bg-amber-400 animate-ping' 
                : 'bg-rose-500 animate-pulse'
            }`}></span>
            <span className="uppercase tracking-wider font-bold">
              Supabase: {supabaseStatus === 'live' ? 'Live connected' : supabaseStatus === 'checking' ? 'Mengecek...' : 'Sandbox demo mode'}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              DB URL: https://tjnzihnnkalrwwbuxfxa.supabase.co
            </span>
          </div>
        </footer>

      </div>

      {/* MODAL: ADD CATEGORY */}
      {showAddCategoryModal && (
        <div id="add-category-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>📁</span> Tambah Kategori Baru
              </h3>
              <button 
                onClick={() => setShowAddCategoryModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCategoryName.trim()) return;
              await handleAddCategory(newCategoryName);
              setShowAddCategoryModal(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ATK, Sparepart, Chemical..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all text-xs cursor-pointer"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div id="add-supplier-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏢</span> Tambah Supplier Baru
              </h3>
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newSupplierName.trim()) return;
              await handleAddSupplier(newSupplierName, newSupplierPhone, newSupplierAddress);
              setShowAddSupplierModal(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nama Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT UNIMETRIKA UTAMA..."
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="Contoh: +6281310318868..."
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Alamat Lengkap</label>
                <textarea
                  placeholder="Contoh: JL. Agung Timur 8 Sunter Jaya, Jakarta..."
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all text-xs cursor-pointer"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      {showAddCustomerModal && (
        <div id="add-customer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>👥</span> Tambah Pelanggan Baru
              </h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCustomerName.trim()) return;
              await handleAddCustomer(newCustomerName, newCustomerPhone, newCustomerAddress);
              setShowAddCustomerModal(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso..."
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="Contoh: +628..."
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Alamat Pelanggan</label>
                <textarea
                  placeholder="Contoh: Perumahan Indah Permai, Bekasi..."
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all text-xs cursor-pointer"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
