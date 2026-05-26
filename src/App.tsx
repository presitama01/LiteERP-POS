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
  X,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
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
  updateCategory,
  deleteCategory,
  insertProduct,
  updateProduct,
  deleteProduct,
  insertSupplier,
  updateSupplier,
  deleteSupplier,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
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

  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState<number | null>(null);
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editSupplierPhone, setEditSupplierPhone] = useState('');
  const [editSupplierAddress, setEditSupplierAddress] = useState('');

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');

  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierPage, setSupplierPage] = useState(0);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(0);

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
    const resolvedRole = (roleOverride as UserRole) || activeRole;
    const newLogItem: SystemAuditLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      role: resolvedRole,
      user: resolvedRole === 'admin' ? 'Administrator' : 
            resolvedRole === 'kasir' ? 'Siti (Kasir)' :
            resolvedRole === 'purchasing' ? 'Andi (Purchasing)' :
            resolvedRole === 'gudang' ? 'Hasan (Gudang)' : 'Rian (Finance)',
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

  const handleEditCategory = async (id: number, name: string) => {
    if (!name.trim()) return;
    const oldCat = categoriesState.find(c => c.id === id);
    const oldName = oldCat ? oldCat.name : '';
    
    setCategoriesState(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    addAuditLog(`Mengubah Kategori "${oldName}" menjadi "${name}"`, 'success');

    if (supabaseStatus === 'live') {
      try {
        const freshCat = await updateCategory(id, name);
        setCategoriesState(prev => prev.map(c => c.id === id ? freshCat : c));
        addAuditLog(`Supabase Live: Update Kategori "${name}" berhasil sinkron`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Edit Kategori ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const cat = categoriesState.find(c => c.id === id);
    if (!cat) return;
    const isUsed = productsState.some(p => p.categoryId === id);
    if (isUsed) {
      alert(`Kategori "${cat.name}" sedang digunakan oleh data produk. Silakan ubah kategori produk tersebut terlebih dahulu.`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) return;

    setCategoriesState(prev => prev.filter(c => c.id !== id));
    addAuditLog(`Menghapus Kategori: "${cat.name}"`, 'warning');

    if (supabaseStatus === 'live') {
      try {
        await deleteCategory(id);
        addAuditLog(`Supabase Live: Kategori "${cat.name}" berhasil dihapus dari cloud`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Hapus Kategori ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleEditSupplier = async (id: number, name: string, phone: string, address: string) => {
    if (!name.trim()) return;
    
    setSuppliersState(prev => prev.map(s => s.id === id ? { id, name, phone, address } : s));
    addAuditLog(`Mengubah profil Supplier: "${name}"`, 'success');

    if (supabaseStatus === 'live') {
      try {
        const freshSup = await updateSupplier(id, { name, phone, address });
        setSuppliersState(prev => prev.map(s => s.id === id ? freshSup : s));
        addAuditLog(`Supabase Live: Supplier "${name}" berhasil diperbarui`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Edit Supplier ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    const sup = suppliersState.find(s => s.id === id);
    if (!sup) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus supplier "${sup.name}"?`)) return;

    setSuppliersState(prev => prev.filter(s => s.id !== id));
    addAuditLog(`Menghapus Supplier: "${sup.name}"`, 'warning');

    if (supabaseStatus === 'live') {
      try {
        await deleteSupplier(id);
        addAuditLog(`Supabase Live: Supplier "${sup.name}" berhasil dihapus dari cloud`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Hapus Supplier ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleEditCustomer = async (id: number, name: string, phone: string, address: string) => {
    if (!name.trim()) return;

    setCustomersState(prev => prev.map(c => c.id === id ? { id, name, phone, address } : c));
    addAuditLog(`Mengubah profil Pelanggan: "${name}"`, 'success');

    if (supabaseStatus === 'live') {
      try {
        const freshCust = await updateCustomer(id, { name, phone, address });
        setCustomersState(prev => prev.map(c => c.id === id ? freshCust : c));
        addAuditLog(`Supabase Live: Pelanggan "${name}" berhasil diperbarui`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Edit Pelanggan ke Supabase: ${err.message}`, 'error');
      }
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    const cust = customersState.find(c => c.id === id);
    if (!cust) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus pelanggan "${cust.name}"?`)) return;

    setCustomersState(prev => prev.filter(c => c.id !== id));
    addAuditLog(`Menghapus Pelanggan: "${cust.name}"`, 'warning');

    if (supabaseStatus === 'live') {
      try {
        await deleteCustomer(id);
        addAuditLog(`Supabase Live: Pelanggan "${cust.name}" berhasil dihapus dari cloud`, 'success');
      } catch (err: any) {
        console.error(err);
        addAuditLog(`Gagal sinkron Hapus Pelanggan ke Supabase: ${err.message}`, 'error');
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
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-200 text-slate-600 px-2.5 py-1 rounded text-[10px] font-mono">
                        ID: {cat.id}
                      </span>
                      <span className="text-sm font-semibold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditCategoryId(cat.id);
                          setEditCategoryName(cat.name);
                          setShowEditCategoryModal(true);
                        }}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-150 hover:text-blue-600 transition-all cursor-pointer bg-white"
                        title="Edit Kategori"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer bg-white"
                        title="Hapus Kategori"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'suppliers': {
        const filteredSuppliers = suppliers.filter(sup => {
          const s = supplierSearch.toLowerCase();
          return (
            sup.name.toLowerCase().includes(s) ||
            sup.phone.toLowerCase().includes(s) ||
            sup.address.toLowerCase().includes(s)
          );
        });

        const recordsPerPage = 100;
        const totalPages = Math.ceil(filteredSuppliers.length / recordsPerPage) || 1;
        const sPage = Math.min(supplierPage, totalPages - 1);
        const startIndex = sPage * recordsPerPage;
        const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + recordsPerPage);

        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
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
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Tambah Supplier</span>
              </button>
            </div>

            {/* Filter Search */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative max-w-md">
                <Search className="absolute top-2.5 left-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama supplier, telepon, atau alamat..."
                  value={supplierSearch}
                  onChange={e => {
                    setSupplierSearch(e.target.value);
                    setSupplierPage(0); // reset page
                  }}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th scope="col" className="px-6 py-4">ID</th>
                      <th scope="col" className="px-6 py-4">Nama Supplier</th>
                      <th scope="col" className="px-6 py-4">No. Telepon</th>
                      <th scope="col" className="px-6 py-4">Alamat</th>
                      <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          Tidak ada data supplier yang cocok.
                        </td>
                      </tr>
                    ) : (
                      paginatedSuppliers.map(sup => (
                        <tr key={sup.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-500">#{sup.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{sup.name}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{sup.phone || '-'}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={sup.address}>{sup.address || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditSupplierId(sup.id);
                                  setEditSupplierName(sup.name);
                                  setEditSupplierPhone(sup.phone);
                                  setEditSupplierAddress(sup.address);
                                  setShowEditSupplierModal(true);
                                }}
                                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer bg-white"
                                title="Edit Supplier"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(sup.id)}
                                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer bg-white"
                                title="Hapus Supplier"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination (100 records per page) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-slate-50 text-xs text-slate-700">
                  <div className="text-slate-500">
                    Menampilkan <span className="font-bold">{startIndex + 1}</span> sampai{' '}
                    <span className="font-bold">{Math.min(startIndex + recordsPerPage, filteredSuppliers.length)}</span> dari{' '}
                    <span className="font-bold">{filteredSuppliers.length}</span> supplier (Limit 100/page)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSupplierPage(p => Math.max(0, p - 1))}
                      disabled={sPage === 0}
                      className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-slate-700 font-bold">Halaman {sPage + 1} dari {totalPages}</span>
                    <button
                      onClick={() => setSupplierPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={sPage >= totalPages - 1}
                      className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'customers': {
        const filteredCustomers = customers.filter(cust => {
          const s = customerSearch.toLowerCase();
          return (
            cust.name.toLowerCase().includes(s) ||
            cust.phone.toLowerCase().includes(s) ||
            cust.address.toLowerCase().includes(s)
          );
        });

        const recordsPerPage = 100;
        const totalPages = Math.ceil(filteredCustomers.length / recordsPerPage) || 1;
        const cPage = Math.min(customerPage, totalPages - 1);
        const startIndex = cPage * recordsPerPage;
        const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + recordsPerPage);

        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
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
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Tambah Pelanggan</span>
              </button>
            </div>

            {/* Filter Search */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative max-w-md">
                <Search className="absolute top-2.5 left-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama pelanggan, telepon, atau alamat..."
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value);
                    setCustomerPage(0); // reset page
                  }}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th scope="col" className="px-6 py-4">ID</th>
                      <th scope="col" className="px-6 py-4">Nama Pelanggan</th>
                      <th scope="col" className="px-6 py-4">No. Telepon</th>
                      <th scope="col" className="px-6 py-4">Alamat</th>
                      <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          Tidak ada data pelanggan yang cocok.
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map(cust => (
                        <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-500">#{cust.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{cust.name}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{cust.phone || '-'}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={cust.address}>{cust.address || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditCustomerId(cust.id);
                                  setEditCustomerName(cust.name);
                                  setEditCustomerPhone(cust.phone);
                                  setEditCustomerAddress(cust.address);
                                  setShowEditCustomerModal(true);
                                }}
                                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer bg-white"
                                title="Edit Pelanggan"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(cust.id)}
                                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer bg-white"
                                title="Hapus Pelanggan"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination (100 records per page) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-slate-50 text-xs text-slate-700">
                  <div className="text-slate-500">
                    Menampilkan <span className="font-bold">{startIndex + 1}</span> sampai{' '}
                    <span className="font-bold">{Math.min(startIndex + recordsPerPage, filteredCustomers.length)}</span> dari{' '}
                    <span className="font-bold">{filteredCustomers.length}</span> pelanggan (Limit 100/page)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCustomerPage(p => Math.max(0, p - 1))}
                      disabled={cPage === 0}
                      className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-slate-700 font-bold">Halaman {cPage + 1} dari {totalPages}</span>
                    <button
                      onClick={() => setCustomerPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={cPage >= totalPages - 1}
                      className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
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

      {/* MODAL: EDIT CATEGORY */}
      {showEditCategoryModal && (
        <div id="edit-category-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>📁</span> Edit Kategori
              </h3>
              <button 
                onClick={() => setShowEditCategoryModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editCategoryId === null || !editCategoryName.trim()) return;
              await handleEditCategory(editCategoryId, editCategoryName);
              setShowEditCategoryModal(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ATK, Sparepart, Chemical..."
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCategoryModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all text-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUPPLIER */}
      {showEditSupplierModal && (
        <div id="edit-supplier-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏢</span> Edit Profil Supplier
              </h3>
              <button 
                onClick={() => setShowEditSupplierModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editSupplierId === null || !editSupplierName.trim()) return;
              await handleEditSupplier(editSupplierId, editSupplierName, editSupplierPhone, editSupplierAddress);
              setShowEditSupplierModal(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nama Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT UNIMETRIKA UTAMA..."
                  value={editSupplierName}
                  onChange={(e) => setEditSupplierName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="Contoh: +6281310318868..."
                  value={editSupplierPhone}
                  onChange={(e) => setEditSupplierPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Alamat Lengkap</label>
                <textarea
                  placeholder="Contoh: JL. Agung Timur 8 Sunter Jaya, Jakarta..."
                  value={editSupplierAddress}
                  onChange={(e) => setEditSupplierAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditSupplierModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all text-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CUSTOMER */}
      {showEditCustomerModal && (
        <div id="edit-customer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>👥</span> Edit Profil Pelanggan
              </h3>
              <button 
                onClick={() => setShowEditCustomerModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editCustomerId === null || !editCustomerName.trim()) return;
              await handleEditCustomer(editCustomerId, editCustomerName, editCustomerPhone, editCustomerAddress);
              setShowEditCustomerModal(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso..."
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="Contoh: +628..."
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Alamat Pelanggan</label>
                <textarea
                  placeholder="Contoh: Perumahan Indah Permai, Bekasi..."
                  value={editCustomerAddress}
                  onChange={(e) => setEditCustomerAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all text-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
