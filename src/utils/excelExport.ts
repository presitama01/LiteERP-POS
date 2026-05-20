/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { 
  Product, 
  Category, 
  Supplier, 
  Customer, 
  Purchase, 
  Sales, 
  FinancialTransaction 
} from '../types';

interface ExportDataPayload {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  purchases: Purchase[];
  sales: Sales[];
  financials: FinancialTransaction[];
}

/**
 * Creates an Excel worksheet prepended with the standard PT. Presitama Service Industry corporate letterhead.
 */
function createWorksheetWithKopSurat(title: string, headers: string[], rows: any[][]): XLSX.WorkSheet {
  const aoa = [
    ['PT. Presitama Service Industry'],
    ['Jl. Flores 1 Blok C No. 18, Kawasan Industri MM2100, Cibitung Bekasi 17520, Indonesia'],
    ['Email: presitama01@gmail.com | Telp: +6281310006356'],
    [''],
    [`LAPORAN OPERASIONAL: ${title.toUpperCase()}`],
    ['Tanggal Generate:', new Date().toLocaleString('id-ID')],
    ['Sistem Penunjang:', 'LITE-ERP Conceptual Cloud Engine'],
    [''],
    headers,
    ...rows
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Optional: Merge corporate header cells for a polished presentation
  if (!ws['!merges']) {
    ws['!merges'] = [];
  }
  // Merge "PT. Presitama Service Industry"
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
  // Merge Address
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } });
  // Merge Contacts
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 6 } });
  // Merge Document Title
  ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 6 } });

  return ws;
}

export function exportERPToExcel(data: ExportDataPayload, singleSheetName?: string) {
  const wb = XLSX.utils.book_new();

  // 1. Profit & Loss Summary Sheet
  if (!singleSheetName || singleSheetName === 'finance') {
    const totalRawSales = data.sales.reduce((sum, s) => sum + s.total, 0);
    const totalDiscounts = data.sales.reduce((sum, s) => sum + s.total * (data.sales.find(o => o.id === s.id)?.discount || 0) / 100, 0);
    const netSales = totalRawSales - totalDiscounts;

    let totalCOGS = 0;
    data.sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = data.products.find(p => p.id === item.productId);
        const buyForProduct = prod ? prod.buyPrice : (item.price * 0.7);
        totalCOGS += item.qty * buyForProduct;
      });
    });

    const grossProfit = netSales - totalCOGS;

    const opExpenses = data.financials
      .filter(f => f.type === 'EXPENSE' && !f.description.includes('Biaya Pembelian / Re-stock'))
      .reduce((sum, f) => sum + f.amount, 0);

    const otherIncome = data.financials
      .filter(f => f.type === 'INCOME' && !f.description.includes('Kas masuk dari Penjualan POS'))
      .reduce((sum, f) => sum + f.amount, 0);

    const netIncome = grossProfit + otherIncome - opExpenses;

    const plHeaders = ['KOMPONEN KEUANGAN', 'NOMINAL RUPIAH (IDR)'];
    const plRows = [
      ['Pemasukan kotor Penjualan POS (Gross)', totalRawSales],
      ['Diskon Potongan Penjualan POS', totalDiscounts],
      ['PENDAPATAN PENJUALAN BERSIH', netSales],
      ['HARGA POKOK PENJUALAN (HPP/COGS)', totalCOGS],
      ['LABA KOTOR (GROSS PROFIT)', grossProfit],
      ['Beban Operasional Toko/Kantor (Utilities/Rents)', opExpenses],
      ['Pendapatan Non-Operasional Lainnya', otherIncome],
      ['LABA / RUGI BERSIH AKHIR (NET PROFIT)', netIncome],
      ['Kondisi Keuangan Saat Ini:', netIncome >= 0 ? 'SURPLUS / UNTUNG' : 'DEFISIT / RUGI']
    ];

    const wsSummary = createWorksheetWithKopSurat(
      'Ikhtisar Summary Laporan Rugi Laba', 
      plHeaders, 
      plRows
    );
    XLSX.utils.book_append_sheet(wb, wsSummary, "Laba Rugi Summary");
  }

  // 2. Products Sheet
  if (!singleSheetName || singleSheetName === 'products') {
    const pHeaders = ['ID', 'SKU / Code', 'Nama Produk', 'Scan Barcode', 'Kategori', 'Harga Beli (IDR)', 'Harga Jual (IDR)', 'Sisa Stock', 'Satuan', 'Status Aktif'];
    const pRows = data.products.map(p => {
      const cat = data.categories.find(c => c.id === p.categoryId);
      return [
        p.id,
        p.code,
        p.name,
        p.barcode,
        cat ? cat.name : `ID: ${p.categoryId}`,
        p.buyPrice,
        p.sellPrice,
        p.stock,
        p.unit,
        p.isActive ? 'AKTIF' : 'NON-AKTIF'
      ];
    });

    const wsProducts = createWorksheetWithKopSurat('Data Master Persediaan Produk', pHeaders, pRows);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Data Produk");
  }

  // 3. Categories Sheet
  if (!singleSheetName || singleSheetName === 'categories') {
    const catHeaders = ['ID Kategori', 'Nama Klasifikasi Kategori'];
    const catRows = data.categories.map(c => [c.id, c.name]);

    const wsCategories = createWorksheetWithKopSurat('Daftar Klasifikasi Kategori Produk', catHeaders, catRows);
    XLSX.utils.book_append_sheet(wb, wsCategories, "Kategori");
  }

  // 4. Supplier Sheet
  if (!singleSheetName || singleSheetName === 'suppliers') {
    const supHeaders = ['ID Supplier', 'Nama Toko / Vendor Mitra', 'Nomor Telepon Kontak', 'Alamat Lengkap Kantor'];
    const supRows = data.suppliers.map(s => [s.id, s.name, s.phone, s.address]);

    const wsSuppliers = createWorksheetWithKopSurat('Rantai Pasok List Partner Supplier', supHeaders, supRows);
    XLSX.utils.book_append_sheet(wb, wsSuppliers, "Supplier Vendors");
  }

  // 5. Customer Sheet
  if (!singleSheetName || singleSheetName === 'customers') {
    const custHeaders = ['ID Pelanggan', 'Nama Pelanggan Utama', 'Nomor HP Kontak', 'Alamat Kirim Rumah'];
    const custRows = data.customers.map(c => [c.id, c.name, c.phone, c.address]);

    const wsCustomers = createWorksheetWithKopSurat('Profil Pelanggan Utama Corporate', custHeaders, custRows);
    XLSX.utils.book_append_sheet(wb, wsCustomers, "Pelanggan Customers");
  }

  // 6. Purchases Sheet
  if (!singleSheetName || singleSheetName === 'purchase') {
    const purHeaders = ['ID', 'Nomor Faktur / Invoice', 'Tanggal Reorder', 'Nama Supplier', 'Total Nilai Belanja (IDR)', 'Operator Pembeli'];
    const purRows = data.purchases.map(p => {
      const sup = data.suppliers.find(s => s.id === p.supplierId);
      return [
        p.id,
        p.invoiceNumber,
        p.purchaseDate,
        sup ? sup.name : `ID: ${p.supplierId}`,
        p.total,
        p.createdBy
      ];
    });

    const wsPurchases = createWorksheetWithKopSurat('Register Transaksi Pembelian Restock', purHeaders, purRows);
    XLSX.utils.book_append_sheet(wb, wsPurchases, "Pembelian Restock");
  }

  // 7. Sales (POS) Sheet
  if (!singleSheetName || singleSheetName === 'sales') {
    const slHeaders = ['ID', 'Nomor Invoice Nota POS', 'Tanggal Checkout', 'Nama Customer', 'Subtotal Belanja (IDR)', 'Diskon Potongan (IDR)', 'Pajak PPN 11% (IDR)', 'Total Bayar Akhir (IDR)', 'Metode Bayar', 'Petugas Kasir'];
    const slRows = data.sales.map(s => {
      const cust = data.customers.find(c => c.id === s.customerId);
      const discountVal = s.total * (s.discount / 100);
      const taxVal = (s.total - discountVal) * (s.tax / 100);
      return [
        s.id,
        s.invoiceNumber,
        s.salesDate,
        cust ? cust.name : 'Ritel Umum',
        s.total,
        discountVal,
        taxVal,
        s.grandTotal,
        s.paymentMethod || 'CASH',
        s.createdBy
      ];
    });

    const wsSales = createWorksheetWithKopSurat('Buku Jurnal Penjualan Kasir Retail POS', slHeaders, slRows);
    XLSX.utils.book_append_sheet(wb, wsSales, "Penjualan POS");
  }

  // 8. Stock Movement Activity Ledger
  if (!singleSheetName || singleSheetName === 'stock') {
    const smHeaders = ['Kode SKU SKU', 'Nama Deskripsi Produk', 'Arah Aliran Logistik', 'Volume Mutasi', 'Satuan Kemas', 'Referensi Nota', 'Tanggal Mutasi'];
    const smRows: any[][] = [];

    // Convert sales items to OUT entries
    data.sales.forEach(s => {
      s.items.forEach(item => {
        const prod = data.products.find(p => p.id === item.productId);
        smRows.push([
          prod?.code || 'N/A',
          prod?.name || 'N/A',
          'OUT (KELUAR)',
          -item.qty,
          prod?.unit || 'Pcs',
          `Nota POS #${s.invoiceNumber}`,
          s.salesDate
        ]);
      });
    });

    // Convert purchases items to IN entries
    data.purchases.forEach(p => {
      p.items.forEach(item => {
        const prod = data.products.find(p => p.id === item.productId);
        smRows.push([
          prod?.code || 'N/A',
          prod?.name || 'N/A',
          'IN (MASUK)',
          item.qty,
          prod?.unit || 'Pcs',
          `Faktur Restock #${p.invoiceNumber}`,
          p.purchaseDate
        ]);
      });
    });

    const wsStock = createWorksheetWithKopSurat('Arus Kegiatan Mutasi Sirkulasi Stock Gudang', smHeaders, smRows);
    XLSX.utils.book_append_sheet(wb, wsStock, "Aktivitas Stock");
  }

  // 9. Finance General Ledger
  if (!singleSheetName || singleSheetName === 'finance') {
    const finHeaders = ['ID Jurnal', 'Tanggal Arus Kas', 'Jenis Aliran Kas', 'Deskripsi Keperluan', 'Volume Dana (IDR)', 'Otorisator Buku Kas'];
    const finRows = data.financials.map(f => [
      f.id,
      f.transactionDate,
      f.type === 'INCOME' ? 'CASH-IN (PEMASUKAN)' : 'CASH-OUT (PENGELUARAN)',
      f.description,
      f.amount,
      f.createdBy
    ]);

    const wsCashflow = createWorksheetWithKopSurat('Jurnal Buku Mutasi Keuangan Cash Flow', finHeaders, finRows);
    XLSX.utils.book_append_sheet(wb, wsCashflow, "Mutasi Kas Buku Besar");
  }

  // Set filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const prefix = singleSheetName ? `LITE_ERP_Laporan_${singleSheetName.toUpperCase()}` : 'LITE_ERP_Laporan_Lengkap';
  const filename = `${prefix}_${timestamp}.xlsx`;

  // Write and trigger download on customer browser frame
  XLSX.writeFile(wb, filename);
}
