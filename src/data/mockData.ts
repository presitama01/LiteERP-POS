/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Product, Supplier, Customer, Sales, Purchase, FinancialTransaction, SystemAuditLog } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Makanan & Minuman' },
  { id: 2, name: 'Kebutuhan Rumah Tangga' },
  { id: 3, name: 'Kosmetik & Kebersihan' },
  { id: 4, name: 'Alat Tulis Kantor' },
  { id: 5, name: 'Pakaian & Tekstil' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    code: 'PRD-001',
    name: 'Kopi Kapal Api 380g',
    barcode: '8998866100124',
    buyPrice: 28000,
    sellPrice: 34500,
    stock: 45,
    unit: 'Bks',
    isActive: true,
    createdAt: '2026-05-15T08:00:00Z',
  },
  {
    id: 2,
    categoryId: 1,
    code: 'PRD-002',
    name: 'Susu Cair UHT Full Cream 1L',
    barcode: '8993175510018',
    buyPrice: 14500,
    sellPrice: 19800,
    stock: 8, // Low Stock Alert!
    unit: 'Kotak',
    isActive: true,
    createdAt: '2026-05-15T08:30:00Z',
  },
  {
    id: 3,
    categoryId: 2,
    code: 'PRD-003',
    name: 'Minyak Goreng Bimoli 2L',
    barcode: '8991002301412',
    buyPrice: 32000,
    sellPrice: 38500,
    stock: 3, // Low Stock Alert!
    unit: 'Pouch',
    isActive: true,
    createdAt: '2026-05-15T09:00:00Z',
  },
  {
    id: 4,
    categoryId: 3,
    code: 'PRD-004',
    name: 'Pepsodent Herbal 190g',
    barcode: '8992001100345',
    buyPrice: 12500,
    sellPrice: 16200,
    stock: 35,
    unit: 'Pcs',
    isActive: true,
    createdAt: '2026-05-16T10:00:00Z',
  },
  {
    id: 5,
    categoryId: 3,
    code: 'PRD-005',
    name: 'Lifebuoy Sabun Cair 450ml Refill',
    barcode: '8992001123498',
    buyPrice: 19500,
    sellPrice: 25000,
    stock: 15,
    unit: 'Pouch',
    isActive: true,
    createdAt: '2026-05-16T10:15:00Z',
  },
  {
    id: 6,
    categoryId: 4,
    code: 'PRD-006',
    name: 'KerTas Sidu A4 80gr Rim',
    barcode: '8996521303211',
    buyPrice: 46000,
    sellPrice: 54000,
    stock: 120,
    unit: 'Rim',
    isActive: true,
    createdAt: '2026-05-17T11:00:00Z',
  },
  {
    id: 7,
    categoryId: 5,
    code: 'PRD-007',
    name: 'Kaos Polos Cotton Combed 30s L',
    barcode: '8994512398555',
    buyPrice: 38000,
    sellPrice: 65000,
    stock: 2, // Low Stock Alert!
    unit: 'Pcs',
    isActive: true,
    createdAt: '2026-05-17T11:45:00Z',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'PT Sinar Logistik Abadi', phone: '021-5551234', address: 'Kawasan Industri Pulogadung Blok F/12, Jakarta Timur' },
  { id: 2, name: 'CV Makmur Sembada', phone: '0812-3456-7890', address: 'Jl. Rungkut Industri Raya No.15, Surabaya' },
  { id: 3, name: 'PT Global ATK Mandiri', phone: '022-7778912', address: 'Jl. Kiara Condong No. 42, Bandung' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Pelanggan Umum (Walk-in)', phone: '-', address: '-' },
  { id: 2, name: 'Rian Hidayat', phone: '0813-8888-2233', address: 'Jl. Kemang Pratama Indah Blok B-08, Bekasi' },
  { id: 3, name: 'Dewi Lestari', phone: '0857-1122-3344', address: 'Apartemen Kalibata City Tower Ebony, Jakarta Selatan' },
  { id: 4, name: 'CV Berkah Usaha Mandiri', phone: '021-889977', address: 'Jl. Danau Sunter Utara J-10, Sunter, Jakarta Utara' },
];

export const INITIAL_SALES: Sales[] = [
  {
    id: 1,
    invoiceNumber: 'SLS-20260518-001',
    customerId: 2,
    salesDate: '2026-05-18',
    total: 104200,
    discount: 5, // 5% discount
    tax: 11, // 11% PPN
    grandTotal: 109800,
    createdBy: 'Kasir Utama',
    createdAt: '2026-05-18T09:45:00Z',
    items: [
      { id: 1, salesId: 1, productId: 1, qty: 2, price: 34500, subtotal: 69000 },
      { id: 2, salesId: 1, productId: 2, qty: 1, price: 19800, subtotal: 19800 },
      { id: 3, salesId: 1, productId: 4, qty: 1, price: 16200, subtotal: 16200 },
    ],
  },
  {
    id: 2,
    invoiceNumber: 'SLS-20260519-001',
    customerId: 1,
    salesDate: '2026-05-19',
    total: 130000,
    discount: 0,
    tax: 11,
    grandTotal: 144300,
    createdBy: 'Kasir Utama',
    createdAt: '2026-05-19T14:20:00Z',
    items: [
      { id: 4, salesId: 2, productId: 7, qty: 2, price: 65000, subtotal: 130000 },
    ],
  },
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 1,
    invoiceNumber: 'PUR-20260515-001',
    supplierId: 1,
    purchaseDate: '2026-05-15',
    total: 2650000,
    createdBy: 'Purchasing Officer',
    createdAt: '2026-05-15T11:00:00Z',
    items: [
      { id: 1, purchaseId: 1, productId: 1, qty: 50, price: 28000, subtotal: 1400000 },
      { id: 2, purchaseId: 1, productId: 2, qty: 20, price: 14500, subtotal: 290000 },
      { id: 3, purchaseId: 1, productId: 3, qty: 30, price: 32000, subtotal: 960000 },
    ],
  },
];

export const INITIAL_FINANCEDATA: FinancialTransaction[] = [
  {
    id: 1,
    transactionDate: '2026-05-15',
    type: 'EXPENSE',
    description: 'Pembayaran Invoice Re-stock Bahan Pokok PUR-20260515-001',
    amount: 2650000,
    createdBy: 'Finance Admin',
    createdAt: '2026-05-15T11:30:00Z',
  },
  {
    id: 2,
    transactionDate: '2026-05-18',
    type: 'INCOME',
    description: 'Penerimaan Penjualan Kasir Invoice SLS-20260518-001',
    amount: 109800,
    createdBy: 'System Link Log',
    createdAt: '2026-05-18T09:45:00Z',
  },
  {
    id: 3,
    transactionDate: '2026-05-19',
    type: 'INCOME',
    description: 'Penerimaan Penjualan Kasir Invoice SLS-20260519-001',
    amount: 144300,
    createdBy: 'System Link Log',
    createdAt: '2026-05-19T14:20:00Z',
  },
  {
    id: 4,
    transactionDate: '2026-05-19',
    type: 'EXPENSE',
    description: 'Biaya Operasional Token Listrik Toko',
    amount: 150000,
    createdBy: 'Finance Admin',
    createdAt: '2026-05-19T16:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-20T01:10:00Z',
    role: 'admin',
    user: 'Administrator',
    action: 'Inisialisasi sistem ERP dan pemetaan database Supabase PostgreSQL.',
    type: 'success',
  },
  {
    id: 'log-2',
    timestamp: '2026-05-20T01:25:00Z',
    role: 'purchasing',
    user: 'Andi (Purchasing)',
    action: 'Menambahkan item Supplier baru: PT Sinar Logistik Abadi.',
    type: 'info',
  },
  {
    id: 'log-3',
    timestamp: '2026-05-20T01:40:00Z',
    role: 'gudang',
    user: 'Hasan (Gudang)',
    action: 'Melakukan stock opname rutin pada Kategori Makanan & Minuman.',
    type: 'warning',
  },
  {
    id: 'log-4',
    timestamp: '2026-05-20T01:55:00Z',
    role: 'kasir',
    user: 'Siti (Kasir)',
    action: 'Membuka terminal POS Shift Pagi Jakarta Barat.',
    type: 'info',
  },
];
