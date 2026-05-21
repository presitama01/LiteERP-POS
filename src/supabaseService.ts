import { supabase } from './supabaseClient';
import { 
  Category, 
  Product, 
  Supplier, 
  Customer, 
  Purchase, 
  PurchaseItem, 
  Sales, 
  SalesItem, 
  FinancialTransaction, 
  SystemAuditLog,
  CorporateDocument,
  CorporateDocumentItem,
  DocumentStatus
} from './types';

// ==========================================
// DB MODEL TO APPLICATION TYPE MAPPERS
// ==========================================

export function mapCategory(row: any): Category {
  return {
    id: Number(row.id),
    name: row.name
  };
}

export function mapProduct(row: any): Product {
  return {
    id: Number(row.id),
    categoryId: Number(row.category_id),
    code: row.code,
    name: row.name,
    barcode: row.barcode || '',
    buyPrice: Number(row.buy_price || 0),
    sellPrice: Number(row.sell_price || 0),
    stock: Number(row.stock || 0),
    unit: row.unit || 'Pcs',
    isActive: row.is_active !== false,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export function mapSupplier(row: any): Supplier {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone || '',
    address: row.address || ''
  };
}

export function mapCustomer(row: any): Customer {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone || '',
    address: row.address || ''
  };
}

export function mapFinancial(row: any): FinancialTransaction {
  return {
    id: Number(row.id),
    transactionDate: row.transaction_date || new Date().toISOString().slice(0, 10),
    type: row.type || 'INCOME',
    description: row.description || '',
    amount: Number(row.amount || 0),
    createdBy: row.created_by_name || 'System Ledger Broker',
    createdAt: row.created_at || new Date().toISOString()
  };
}

// ==========================================
// CENTRAL DATABASE FETCH ENGINE
// ==========================================

export interface SupabaseDataPayload {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  purchases: Purchase[];
  sales: Sales[];
  financials: FinancialTransaction[];
  corporateDocuments: CorporateDocument[];
}

export async function fetchAllSupabaseData(): Promise<SupabaseDataPayload> {
  // Fetch lists in parallel
  const [
    resCats,
    resProds,
    resSups,
    resCusts,
    resPurchases,
    resPurchaseItems,
    resSales,
    resSalesItems,
    resFinancials
  ] = await Promise.all([
    supabase.from('categories').select('*').order('id'),
    supabase.from('products').select('*').order('id'),
    supabase.from('suppliers').select('*').order('id'),
    supabase.from('customers').select('*').order('id'),
    supabase.from('purchases').select('*').order('id', { ascending: false }),
    supabase.from('purchase_items').select('*'),
    supabase.from('sales').select('*').order('id', { ascending: false }),
    supabase.from('sales_items').select('*'),
    supabase.from('financial_transactions').select('*').order('id', { ascending: false })
  ]);

  // Throw if any critical error occurs (e.g. table not found)
  if (resCats.error) throw new Error(`categories: ${resCats.error.message}`);
  if (resProds.error) throw new Error(`products: ${resProds.error.message}`);
  if (resSups.error) throw new Error(`suppliers: ${resSups.error.message}`);
  if (resCusts.error) throw new Error(`customers: ${resCusts.error.message}`);
  if (resPurchases.error) throw new Error(`purchases: ${resPurchases.error.message}`);
  if (resSales.error) throw new Error(`sales: ${resSales.error.message}`);
  if (resFinancials.error) throw new Error(`financial_transactions: ${resFinancials.error.message}`);

  // Fetch Corporate Documents gracefully to avoid breaking the application if tables are not fully created yet
  let corporateDocuments: CorporateDocument[] = [];
  try {
    const { data: rawDocs, error: docsError } = await supabase
      .from('corporate_documents')
      .select('*')
      .order('id', { ascending: false });
    
    const { data: rawItems, error: itemsError } = await supabase
      .from('corporate_document_items')
      .select('*');

    if (docsError) {
      console.warn("Table corporate_documents is missing or inaccessible:", docsError.message);
    } else if (rawDocs) {
      const itemsList = rawItems || [];
      corporateDocuments = rawDocs.map((row: any) => {
        const itemsOfDoc = itemsList
          .filter((item: any) => Number(item.document_id) === Number(row.id))
          .map((item: any) => ({
            id: Number(item.id),
            documentId: Number(item.document_id),
            productId: Number(item.product_id),
            qty: Number(item.qty || 0),
            price: Number(item.price || 0),
            subtotal: Number(item.subtotal || 0)
          }));
        
        return {
          id: Number(row.id),
          type: row.type,
          documentNumber: row.document_number,
          referenceNumber: row.reference_number || undefined,
          customerId: row.customer_id ? Number(row.customer_id) : undefined,
          supplierId: row.supplier_id ? Number(row.supplier_id) : undefined,
          date: row.date || new Date().toISOString().slice(0, 10),
          dueDate: row.due_date || undefined,
          status: row.status || 'DRAFT',
          total: Number(row.total || 0),
          discount: Number(row.discount || 0),
          tax: Number(row.tax || 0),
          grandTotal: Number(row.grand_total || 0),
          notes: row.notes || undefined,
          createdBy: row.created_by || 'System',
          createdAt: row.created_at || new Date().toISOString(),
          items: itemsOfDoc
        };
      });
    }
  } catch (err: any) {
    console.warn("Slight issue pulling corporate documents:", err?.message || err);
  }

  // Map Master Lists
  const categories = (resCats.data || []).map(mapCategory);
  const products = (resProds.data || []).map(mapProduct);
  const suppliers = (resSups.data || []).map(mapSupplier);
  const customers = (resCusts.data || []).map(mapCustomer);
  const financials = (resFinancials.data || []).map(mapFinancial);

  // Map Purchases with details
  const purchaseItems = resPurchaseItems.data || [];
  const purchases: Purchase[] = (resPurchases.data || []).map(p => {
    const itemsOfP = purchaseItems
      .filter((item: any) => Number(item.purchase_id) === Number(p.id))
      .map((item: any) => ({
        id: Number(item.id),
        purchaseId: Number(item.purchase_id),
        productId: Number(item.product_id),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
        subtotal: Number(item.subtotal || 0)
      }));

    return {
      id: Number(p.id),
      invoiceNumber: p.invoice_number,
      supplierId: Number(p.supplier_id),
      purchaseDate: p.purchase_date,
      total: Number(p.total || 0),
      paymentMethod: p.payment_method || 'Cash',
      paymentStatus: (p.payment_status as any) || 'PAID',
      createdBy: p.created_by_name || 'System',
      createdAt: p.created_at,
      items: itemsOfP
    };
  });

  // Map Sales with details
  const salesItems = resSalesItems.data || [];
  const sales: Sales[] = (resSales.data || []).map(s => {
    const itemsOfS = salesItems
      .filter((item: any) => Number(item.sales_id) === Number(s.id))
      .map((item: any) => ({
        id: Number(item.id),
        salesId: Number(item.sales_id),
        productId: Number(item.product_id),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
        subtotal: Number(item.subtotal || 0)
      }));

    return {
      id: Number(s.id),
      invoiceNumber: s.invoice_number,
      customerId: Number(s.customer_id),
      salesDate: s.sales_date,
      total: Number(s.total || 0),
      paymentMethod: s.payment_method || 'CASH',
      paymentStatus: (s.payment_status as any) || 'PAID',
      discount: Number(s.discount || 0),
      tax: Number(s.tax || 0),
      grandTotal: Number(s.grand_total || s.total || 0),
      createdBy: s.created_by_name || 'System',
      createdAt: s.created_at,
      items: itemsOfS
    };
  });

  return {
    categories,
    products,
    suppliers,
    customers,
    purchases,
    sales,
    financials,
    corporateDocuments
  };
}

// ==========================================
// MUTATION WRITERS WITH INTEGRITY WRAPPING
// ==========================================

export async function insertCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function insertProduct(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      category_id: p.categoryId,
      code: p.code,
      name: p.name,
      barcode: p.barcode,
      buy_price: p.buyPrice,
      sell_price: p.sellPrice,
      stock: p.stock,
      unit: p.unit,
      is_active: p.isActive
    }])
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id: number, p: Partial<Product>): Promise<Product> {
  const payload: any = {};
  if (p.categoryId !== undefined) payload.category_id = p.categoryId;
  if (p.code !== undefined) payload.code = p.code;
  if (p.name !== undefined) payload.name = p.name;
  if (p.barcode !== undefined) payload.barcode = p.barcode;
  if (p.buyPrice !== undefined) payload.buy_price = p.buyPrice;
  if (p.sellPrice !== undefined) payload.sell_price = p.sellPrice;
  if (p.stock !== undefined) payload.stock = p.stock;
  if (p.unit !== undefined) payload.unit = p.unit;
  if (p.isActive !== undefined) payload.is_active = p.isActive;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function insertSupplier(sup: Omit<Supplier, 'id'>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{
      name: sup.name,
      phone: sup.phone,
      address: sup.address
    }])
    .select()
    .single();

  if (error) throw error;
  return mapSupplier(data);
}

export async function insertCustomer(cust: Omit<Customer, 'id'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: cust.name,
      phone: cust.phone,
      address: cust.address
    }])
    .select()
    .single();

  if (error) throw error;
  return mapCustomer(data);
}

// Write a sales order with deep details
export async function insertSalesOrder(
  salesOrder: Omit<Sales, 'id' | 'createdAt' | 'items'>, 
  items: Omit<SalesItem, 'id' | 'salesId'>[]
): Promise<Sales> {
  // 1. Insert header
  const { data: headerData, error: headerErr } = await supabase
    .from('sales')
    .insert([{
      invoice_number: salesOrder.invoiceNumber,
      customer_id: salesOrder.customerId,
      sales_date: salesOrder.salesDate,
      total: salesOrder.total,
      payment_method: salesOrder.paymentMethod,
      payment_status: salesOrder.paymentStatus || 'PAID',
      discount: salesOrder.discount,
      tax: salesOrder.tax,
      grand_total: salesOrder.grandTotal
    }])
    .select()
    .single();

  if (headerErr) throw headerErr;
  const newHeaderId = headerData.id;

  // 2. Insert items
  const itemsPayload = items.map(item => ({
    sales_id: newHeaderId,
    product_id: item.productId,
    qty: item.qty,
    price: item.price,
    subtotal: item.subtotal
  }));

  const { data: itemsData, error: itemsErr } = await supabase
    .from('sales_items')
    .insert(itemsPayload)
    .select();

  if (itemsErr) {
    // Attempt rollback of header on item failure
    await supabase.from('sales').delete().eq('id', newHeaderId);
    throw itemsErr;
  }

  const mappedItems: SalesItem[] = itemsData.map((it: any) => ({
    id: Number(it.id),
    salesId: Number(it.sales_id),
    productId: Number(it.product_id),
    qty: Number(it.qty),
    price: Number(it.price),
    subtotal: Number(it.subtotal)
  }));

  return {
    id: Number(newHeaderId),
    invoiceNumber: headerData.invoice_number,
    customerId: Number(headerData.customer_id),
    salesDate: headerData.sales_date,
    total: Number(headerData.total),
    paymentMethod: headerData.payment_method,
    paymentStatus: headerData.payment_status || 'PAID',
    discount: Number(headerData.discount || 0),
    tax: Number(headerData.tax || 0),
    grandTotal: Number(headerData.grand_total || headerData.total || 0),
    createdBy: salesOrder.createdBy,
    createdAt: headerData.created_at,
    items: mappedItems
  };
}

// Write a purchase order with details
export async function insertPurchaseOrder(
  purchaseOrder: Omit<Purchase, 'id' | 'createdAt' | 'items'>,
  items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
): Promise<Purchase> {
  // 1. Insert header
  const { data: headerData, error: headerErr } = await supabase
    .from('purchases')
    .insert([{
      invoice_number: purchaseOrder.invoiceNumber,
      supplier_id: purchaseOrder.supplierId,
      purchase_date: purchaseOrder.purchaseDate,
      total: purchaseOrder.total,
      payment_method: purchaseOrder.paymentMethod || 'Cash',
      payment_status: purchaseOrder.paymentStatus || 'PAID'
    }])
    .select()
    .single();

  if (headerErr) throw headerErr;
  const newHeaderId = headerData.id;

  // 2. Insert items
  const itemsPayload = items.map(item => ({
    purchase_id: newHeaderId,
    product_id: item.productId,
    qty: item.qty,
    price: item.price,
    subtotal: item.subtotal
  }));

  const { data: itemsData, error: itemsErr } = await supabase
    .from('purchase_items')
    .insert(itemsPayload)
    .select();

  if (itemsErr) {
    // Attempt rollback on dynamic fail
    await supabase.from('purchases').delete().eq('id', newHeaderId);
    throw itemsErr;
  }

  const mappedItems: PurchaseItem[] = itemsData.map((it: any) => ({
    id: Number(it.id),
    purchaseId: Number(it.purchase_id),
    productId: Number(it.product_id),
    qty: Number(it.qty),
    price: Number(it.price),
    subtotal: Number(it.subtotal)
  }));

  return {
    id: Number(newHeaderId),
    invoiceNumber: headerData.invoice_number,
    supplierId: Number(headerData.supplier_id),
    purchaseDate: headerData.purchase_date,
    total: Number(headerData.total),
    paymentMethod: headerData.payment_method || 'Cash',
    paymentStatus: headerData.payment_status || 'PAID',
    createdBy: purchaseOrder.createdBy,
    createdAt: headerData.created_at,
    items: mappedItems
  };
}

// Insert Financial Ledger Record
export async function insertFinancialRecord(
  rec: Omit<FinancialTransaction, 'id' | 'createdAt'>
): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert([{
      transaction_date: rec.transactionDate,
      type: rec.type,
      description: rec.description,
      amount: rec.amount
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    ...mapFinancial(data),
    createdBy: rec.createdBy
  };
}

// ==========================================
// SEED ENGINE (FOR EMPTY SUPABASE TABLES)
// ==========================================

export async function seedSupabaseDatabase(initials: {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  financials: FinancialTransaction[];
}): Promise<{ success: boolean; message: string }> {
  try {
    // A. Check categories
    const { data: catCheck } = await supabase.from('categories').select('id').limit(1);
    if (!catCheck || catCheck.length === 0) {
      // Need to seed categories
      const { error: catErr } = await supabase
        .from('categories')
        .insert(initials.categories.map(c => ({ name: c.name })));
      if (catErr) throw new Error(`Gagal seed categories: ${catErr.message}`);
    }

    // Since categories are identity serials, let's fetch current mapped ones from db to associate products
    const { data: dbCats } = await supabase.from('categories').select('*');
    const catMap: Record<string, number> = {};
    if (dbCats && dbCats.length > 0) {
      dbCats.forEach((c: any) => {
        catMap[c.name] = Number(c.id);
      });
    }

    // B. Check supplier
    const { data: supCheck } = await supabase.from('suppliers').select('id').limit(1);
    if (!supCheck || supCheck.length === 0) {
      const { error: supErr } = await supabase
        .from('suppliers')
        .insert(initials.suppliers.map(s => ({
          name: s.name,
          phone: s.phone,
          address: s.address
        })));
      if (supErr) throw new Error(`Gagal seed suppliers: ${supErr.message}`);
    }

    // C. Check customer
    const { data: custCheck } = await supabase.from('customers').select('id').limit(1);
    if (!custCheck || custCheck.length === 0) {
      const { error: custErr } = await supabase
        .from('customers')
        .insert(initials.customers.map(c => ({
          name: c.name,
          phone: c.phone,
          address: c.address
        })));
      if (custErr) throw new Error(`Gagal seed customers: ${custErr.message}`);
    }

    // D. Check products
    const { data: prodCheck } = await supabase.from('products').select('id').limit(1);
    if (!prodCheck || prodCheck.length === 0) {
      // Match category name strings from initials to dynamically associate new IDs
      const mappedProds = initials.products.map(p => {
        const origCat = initials.categories.find(c => c.id === p.categoryId);
        const newCatId = origCat ? (catMap[origCat.name] || 1) : 1;
        return {
          category_id: newCatId,
          code: p.code,
          name: p.name,
          barcode: p.barcode,
          buy_price: p.buyPrice,
          sell_price: p.sellPrice,
          stock: p.stock,
          unit: p.unit,
          is_active: p.isActive
        };
      });

      const { error: prodErr } = await supabase.from('products').insert(mappedProds);
      if (prodErr) throw new Error(`Gagal seed products: ${prodErr.message}`);
    }

    // E. Check financials
    const { data: finCheck } = await supabase.from('financial_transactions').select('id').limit(1);
    if (!finCheck || finCheck.length === 0) {
      const { error: finErr } = await supabase
        .from('financial_transactions')
        .insert(initials.financials.map(f => ({
          transaction_date: f.transactionDate,
          type: f.type,
          description: f.description,
          amount: f.amount
        })));
      if (finErr) throw new Error(`Gagal seed financial transactions: ${finErr.message}`);
    }

    return { success: true, message: 'Database LITE-ERP Berhasil Di-seed dengan Data Awal!' };
  } catch (err: any) {
    return { success: false, message: `Gagal proses seeding: ${err?.message || err}` };
  }
}

// ==========================================
// CORPORATE DOCUMENTS MUTATIONS
// ==========================================

export async function insertCorporateDocument(
  doc: Omit<CorporateDocument, 'id' | 'createdAt' | 'items'>,
  items: Omit<CorporateDocumentItem, 'id' | 'documentId'>[]
): Promise<CorporateDocument> {
  // 1. Insert header
  const { data: headerData, error: headerErr } = await supabase
    .from('corporate_documents')
    .insert([{
      type: doc.type,
      document_number: doc.documentNumber,
      reference_number: doc.referenceNumber,
      customer_id: doc.customerId,
      supplier_id: doc.supplierId,
      date: doc.date,
      due_date: doc.dueDate,
      status: doc.status,
      total: doc.total,
      discount: doc.discount,
      tax: doc.tax,
      grand_total: doc.grandTotal,
      notes: doc.notes,
      created_by: doc.createdBy
    }])
    .select()
    .single();

  if (headerErr) throw headerErr;
  const newHeaderId = headerData.id;

  // 2. Insert items
  const itemsPayload = items.map(item => ({
    document_id: newHeaderId,
    product_id: item.productId,
    qty: item.qty,
    price: item.price,
    subtotal: item.subtotal
  }));

  const { data: itemsData, error: itemsErr } = await supabase
    .from('corporate_document_items')
    .insert(itemsPayload)
    .select();

  if (itemsErr) {
    // Cleanup/rollback header on failure
    await supabase.from('corporate_documents').delete().eq('id', newHeaderId);
    throw itemsErr;
  }

  const mappedItems: CorporateDocumentItem[] = itemsData.map((it: any) => ({
    id: Number(it.id),
    documentId: Number(it.document_id),
    productId: Number(it.product_id),
    qty: Number(it.qty),
    price: Number(it.price),
    subtotal: Number(it.subtotal)
  }));

  return {
    id: Number(newHeaderId),
    type: headerData.type,
    documentNumber: headerData.document_number,
    referenceNumber: headerData.reference_number || undefined,
    customerId: headerData.customer_id ? Number(headerData.customer_id) : undefined,
    supplierId: headerData.supplier_id ? Number(headerData.supplier_id) : undefined,
    date: headerData.date,
    dueDate: headerData.due_date || undefined,
    status: headerData.status,
    total: Number(headerData.total),
    discount: Number(headerData.discount),
    tax: Number(headerData.tax),
    grandTotal: Number(headerData.grand_total),
    notes: headerData.notes || undefined,
    createdBy: headerData.created_by,
    createdAt: headerData.created_at,
    items: mappedItems
  };
}

export async function updateCorporateDocumentStatus(
  id: number,
  status: DocumentStatus
): Promise<void> {
  const { error } = await supabase
    .from('corporate_documents')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCorporateDocument(id: number): Promise<void> {
  const { error } = await supabase
    .from('corporate_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
