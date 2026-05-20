/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'kasir' | 'purchasing' | 'gudang' | 'finance';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  branch: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  categoryId: number;
  code: string;
  name: string;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  purchaseDate: string;
  total: number;
  createdBy: string;
  createdAt: string;
  items: PurchaseItem[];
}

export interface SalesItem {
  id: number;
  salesId: number;
  productId: number;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Sales {
  id: number;
  invoiceNumber: string;
  customerId: number;
  salesDate: string;
  total: number;
  paymentMethod?: string;
  discount: number;
  tax: number;
  grandTotal: number;
  createdBy: string;
  createdAt: string;
  items: SalesItem[];
}

export interface StockMovement {
  id: number;
  productId: number;
  movementType: 'IN' | 'OUT';
  qty: number;
  referenceType: 'PURCHASE' | 'SALES' | 'MANUAL_ADJUSTMENT';
  referenceId: number;
  createdAt: string;
}

export interface FinancialTransaction {
  id: number;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  role: UserRole;
  user: string;
  action: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type CorporateDocumentType = 
  | 'INQUIRY' 
  | 'QUOTATION' 
  | 'SALES_ORDER' 
  | 'DELIVERY_ORDER' 
  | 'SALES_INVOICE' 
  | 'PURCHASE_ORDER';

export type DocumentStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'APPROVED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface CorporateDocumentItem {
  id: number;
  documentId: number;
  productId: number;
  qty: number;
  price: number;
  subtotal: number;
}

export interface CorporateDocument {
  id: number;
  type: CorporateDocumentType;
  documentNumber: string;
  referenceNumber?: string;
  customerId?: number;
  supplierId?: number;
  date: string;
  dueDate?: string;
  status: DocumentStatus;
  total: number;
  discount: number;
  tax: number;
  grandTotal: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  items: CorporateDocumentItem[];
}
