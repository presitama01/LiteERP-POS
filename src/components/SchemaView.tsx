/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  GitFork, 
  Shuffle, 
  Link, 
  Terminal, 
  Lock,
  Code2
} from 'lucide-react';

export default function SchemaView() {
  const [activeTab, setActiveTab] = useState<'sql' | 'erd' | 'auth'>('sql');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sqlSnippets = {
    allTables: `-- =========================================================================
-- BLUEPRINT SCHEMA SQL - LITE-ERP SUPABASE POSTGRESQL
-- =========================================================================

-- 1. PROFILES (Extends Supabase auth.users)
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role text check (role in ('admin','kasir','gudang','finance','purchasing')),
    created_at timestamp default now()
);

-- 2. MASTER CATEGORIES
create table categories (
    id bigint generated always as identity primary key,
    name text not null,
    created_at timestamp default now()
);

-- 3. MASTER PRODUCTS
create table products (
    id bigint generated always as identity primary key,
    category_id bigint references categories(id),
    code text unique not null,
    name text not null,
    barcode text,
    buy_price numeric(18,2) default 0,
    sell_price numeric(18,2) default 0,
    stock numeric(18,2) default 0,
    unit text,
    is_active boolean default true,
    created_at timestamp default now()
);

-- 4. SUPPLIER
create table suppliers (
    id bigint generated always as identity primary key,
    name text not null,
    phone text,
    address text,
    created_at timestamp default now()
);

-- 5. CUSTOMER
create table customers (
    id bigint generated always as identity primary key,
    name text not null,
    phone text,
    address text,
    created_at timestamp default now()
);`,

    transactions: `-- 6. PURCHASE HEADER (Restocking)
create table purchases (
    id bigint generated always as identity primary key,
    invoice_number text unique not null,
    supplier_id bigint references suppliers(id),
    purchase_date date default current_date,
    total numeric(18,2) default 0,
    created_by uuid references profiles(id),
    created_at timestamp default now()
);

-- 7. PURCHASE DETAIL
create table purchase_items (
    id bigint generated always as identity primary key,
    purchase_id bigint references purchases(id) on delete cascade,
    product_id bigint references products(id),
    qty numeric(18,2),
    price numeric(18,2),
    subtotal numeric(18,2)
);

-- 8. SALES HEADER (POS Cashier)
create table sales (
    id bigint generated always as identity primary key,
    invoice_number text unique not null,
    customer_id bigint references customers(id),
    sales_date date default current_date,
    total numeric(18,2) default 0,
    payment_method text,
    discount numeric(18,2) default 0,
    tax numeric(18,2) default 0,
    grand_total numeric(18,2) default 0,
    created_by uuid references profiles(id),
    created_at timestamp default now()
);

-- 9. SALES DETAIL
create table sales_items (
    id bigint generated always as identity primary key,
    sales_id bigint references sales(id) on delete cascade,
    product_id bigint references products(id),
    qty numeric(18,2),
    price numeric(18,2),
    subtotal numeric(18,2)
);`,

    triggers: `-- 10. STOCK MOVEMENT LEDGER
create table stock_movements (
    id bigint generated always as identity primary key,
    product_id bigint references products(id),
    movement_type text check (movement_type in ('IN','OUT')),
    qty numeric(18,2),
    reference_type text,
    reference_id bigint,
    created_at timestamp default now()
);

-- 11. FINANCIAL LEDGER
create table financial_transactions (
    id bigint generated always as identity primary key,
    transaction_date date default current_date,
    type text check (type in ('INCOME','EXPENSE')),
    description text,
    amount numeric(18,2),
    created_by uuid references profiles(id),
    created_at timestamp default now()
);

-- 12. CORPORATE DOCUMENTS (SCM INQ, QTN, SO, DO, INV, PO)
create table corporate_documents (
    id bigint generated always as identity primary key,
    type text not null check (type in ('INQUIRY', 'QUOTATION', 'SALES_ORDER', 'DELIVERY_ORDER', 'SALES_INVOICE', 'PURCHASE_ORDER')),
    document_number text unique not null,
    reference_number text,
    customer_id bigint references customers(id) on delete set null,
    supplier_id bigint references suppliers(id) on delete set null,
    date date default current_date,
    due_date date,
    status text not null check (status in ('DRAFT', 'SENT', 'APPROVED', 'COMPLETED', 'CANCELLED')),
    total numeric(18,2) default 0,
    discount numeric(18,2) default 0,
    tax numeric(18,2) default 0,
    grand_total numeric(18,2) default 0,
    notes text,
    created_by text,
    created_at timestamp default now()
);

-- 13. CORPORATE DOCUMENT ITEMS
create table corporate_document_items (
    id bigint generated always as identity primary key,
    document_id bigint references corporate_documents(id) on delete cascade,
    product_id bigint references products(id) on delete cascade,
    qty numeric(18,2) not null,
    price numeric(18,2) not null,
    subtotal numeric(18,2) not null
);

-- =========================================================================
-- PL/pgSQL TRIGGERS: AUTO ADJUST WAREHOUSE STOCK
-- =========================================================================

-- A. TRIGGER: INCREMENT STOCK FROM PURCHASING GOODS
create or replace function update_stock_after_purchase()
returns trigger as $$
begin
    update products
    set stock = stock + new.qty
    where id = new.product_id;

    -- Optional: insert automatic stock_movement history log
    insert into stock_movements (product_id, movement_type, qty, reference_type, reference_id)
    values (new.product_id, 'IN', new.qty, 'PURCHASE', new.purchase_id);

    return new;
end;
$$ language plpgsql;

create trigger trg_purchase_stock
after insert on purchase_items
for each row
execute function update_stock_after_purchase();


-- B. TRIGGER: DECREMENT STOCK FROM POS RETAIL CHECKOUTS
create or replace function update_stock_after_sales()
returns trigger as $$
begin
    update products
    set stock = stock - new.qty
    where id = new.product_id;

    -- Optional: insert automatic stock_movement history log
    insert into stock_movements (product_id, movement_type, qty, reference_type, reference_id)
    values (new.product_id, 'OUT', new.qty, 'SALES', new.sales_id);

    return new;
end;
$$ language plpgsql;

create trigger trg_sales_stock
after insert on sales_items
for each row
execute function update_stock_after_sales();`
  };

  return (
    <div className="space-y-6">
      
      {/* Intro info */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Spesifikasi Arsitektur Database (Supabase PostgreSQL)</h2>
        <p className="text-xs text-slate-500 font-medium">Pelajari relasi database relasional, skema SQL DDL lengkap, trigger otomatisasi stock, dan setup autentikasi Supabase</p>
      </div>

      {/* TABS SELECTORS */}
      <div className="flex border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2.5 font-bold transition-all -mb-px flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'sql'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 size={13} />
          SQL Scripts lengkap
        </button>

        <button
          onClick={() => setActiveTab('erd')}
          className={`px-4 py-2.5 font-bold transition-all -mb-px flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'erd'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork size={13} />
          Entity Relation Diagram (ERD)
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`px-4 py-2.5 font-bold transition-all -mb-px flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'auth'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock size={13} />
          Konsep Multi Login & RLS
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="space-y-4">
        
        {/* SQL SCRIPTS RENDERING PANEL */}
        {activeTab === 'sql' && (
          <div className="space-y-6">
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 border border-slate-100 rounded-xl">
              💡 <b>Catatan Integrasi:</b> Anda dapat menyalin kode SQL mandiri di bawah dan menempelkannya langsung ke dalam <b>SQL Editor</b> di Dashboard Supabase milik Anda untuk membangun backend ERP ini dalam hitungan detik!
            </div>

            {/* Chunk 1: Master Tables */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 font-mono">1. Tabel Master Klasifikasi & Profil</span>
                <button
                  onClick={() => handleCopy(sqlSnippets.allTables, 'mstr')}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 shadow-2xs"
                >
                  {copiedId === 'mstr' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedId === 'mstr' ? 'Copied' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-slate-700 bg-slate-950 text-slate-300 leading-relaxed max-h-[350px]">
                {sqlSnippets.allTables}
              </pre>
            </div>

            {/* Chunk 2: Transactions Headers and details */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 font-mono">2. Tabel Transaksi Penjualan & Pembelian (Header-Detail)</span>
                <button
                  onClick={() => handleCopy(sqlSnippets.transactions, 'trns')}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 shadow-2xs"
                >
                  {copiedId === 'trns' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedId === 'trns' ? 'Copied' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-slate-300 bg-slate-950 leading-relaxed max-h-[350px]">
                {sqlSnippets.transactions}
              </pre>
            </div>

            {/* Chunk 3: Ledgers and Triggers PL/pgSQL */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 font-mono">3. Tabel Stock Ledger & Database PL/pgSQL Triggers</span>
                <button
                  onClick={() => handleCopy(sqlSnippets.triggers, 'trig')}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 shadow-2xs"
                >
                  {copiedId === 'trig' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedId === 'trig' ? 'Copied' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-slate-300 bg-slate-950 leading-relaxed max-h-[350px]">
                {sqlSnippets.triggers}
              </pre>
            </div>
          </div>
        )}

        {/* DETAILED INTERACTIVE RELATION VIEW (ERD CONCEPT WITH SVGS) */}
        {activeTab === 'erd' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1">
                <GitFork size={16} className="text-blue-600 animate-pulse" />
                Visual Peta Hubungan Relasi Tabel (ER-Diagram)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Struktur relasi satu-ke-banyak (One-to-Many) antara master data profil, katalog produk, rincian nota penjualan, dan arus logistik</p>
            </div>

            {/* SVG Complex ERD display */}
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex justify-center">
              <svg viewBox="0 0 800 500" className="w-full max-w-4xl h-auto">
                {/* 1. Entity box profiles */}
                <rect x="30" y="30" width="160" height="110" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="30" y="30" width="160" height="30" rx="8" fill="#0f172a" />
                <text x="110" y="49" textAnchor="middle" fill="#fff" className="text-[11px] font-black font-mono">profiles (users)</text>
                <text x="40" y="78" fill="#334155" className="text-[10px] font-mono">id (uuid PK)</text>
                <text x="40" y="98" fill="#64748b" className="text-[10px] font-mono">full_name (text)</text>
                <text x="40" y="118" fill="#64748b" className="text-[10px] font-mono">role (text-enum)</text>

                {/* 2. Entity box products */}
                <rect x="300" y="180" width="180" height="145" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="300" y="180" width="180" height="30" rx="8" fill="#2563eb" />
                <text x="390" y="199" textAnchor="middle" fill="#fff" className="text-[11px] font-black font-mono">products (Persediaan)</text>
                <text x="310" y="228" fill="#334155" className="text-[10px] font-mono">id (bigint PK)</text>
                <text x="310" y="248" fill="#ea580c" className="text-[10px] font-mono">category_id (FK_cat)</text>
                <text x="310" y="268" fill="#64748b" className="text-[10px] font-mono">code (text_unique)</text>
                <text x="310" y="288" fill="#64748b" className="text-[10px] font-mono">name (text)</text>
                <text x="310" y="308" fill="#16a34a" className="text-[10px] font-mono">stock (numeric_trig)</text>

                {/* 3. Entity box categories */}
                <rect x="30" y="200" width="160" height="90" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="30" y="200" width="160" height="30" rx="8" fill="#475569" />
                <text x="110" y="219" textAnchor="middle" fill="#fff" className="text-[11px] font-black font-mono">categories</text>
                <text x="40" y="248" fill="#334155" className="text-[10px] font-mono">id (bigint PK)</text>
                <text x="40" y="268" fill="#64748b" className="text-[10px] font-mono">name (text)</text>

                {/* 4. Entity box sales */}
                <rect x="580" y="30" width="180" height="120" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="580" y="30" width="180" height="30" rx="8" fill="#16a34a" />
                <text x="670" y="49" textAnchor="middle" fill="#fff" className="text-[11px] font-black font-mono">sales (Nota POS)</text>
                <text x="590" y="78" fill="#334155" className="text-[10px] font-mono">id (bigint PK)</text>
                <text x="590" y="98" fill="#64748b" className="text-[10px] font-mono">invoice_number (text)</text>
                <text x="590" y="118" fill="#9333ea" className="text-[10px] font-mono">created_by (FK_user)</text>

                {/* 5. Entity box sales_items */}
                <rect x="580" y="280" width="180" height="130" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="580" y="280" width="180" height="30" rx="8" fill="#0284c7" />
                <text x="670" y="299" textAnchor="middle" fill="#fff" className="text-[11px] font-black font-mono">sales_items (Detail POS)</text>
                <text x="590" y="328" fill="#334155" className="text-[10px] font-mono">sales_id (FK_sales)</text>
                <text x="590" y="348" fill="#3b82f6" className="text-[10px] font-mono">product_id (FK_prod)</text>
                <text x="590" y="368" fill="#64748b" className="text-[10px] font-mono">qty (numeric)</text>
                <text x="590" y="388" fill="#64748b" className="text-[10px] font-mono">subtotal (numeric)</text>

                {/* Relations Lines (cardinality strings) */}
                {/* Line categories -> products */}
                <line x1="190" y1="245" x2="300" y2="245" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3" />
                <circle cx="195" cy="245" r="3" fill="#ea580c" />
                <polygon points="295,241 300,245 295,249" fill="#ea580c" />
                <text x="210" y="238" fill="#ea580c" className="text-[8px] font-bold font-mono">has many (1:N)</text>

                {/* Line profiles -> sales */}
                <path d="M 190,75 L 580,75" fill="none" stroke="#9333ea" strokeWidth="1.5" strokeDasharray="3" />
                <circle cx="195" cy="75" r="3" fill="#9333ea" />
                <polygon points="575,71 580,75 575,79" fill="#9333ea" />
                <text x="220" y="68" fill="#9333ea" className="text-[8px] font-bold font-mono">created_by (1:N)</text>

                {/* Line sales -> sales_items */}
                <line x1="670" y1="150" x2="670" y2="280" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="670" cy="155" r="3" fill="#0284c7" />
                <polygon points="666,275 670,280 674,275" fill="#0284c7" />
                <text x="676" y="210" fill="#0284c7" className="text-[8px] font-bold font-mono">cascades (1:N)</text>

                {/* Line products -> sales_items */}
                <path d="M 480,245 L 530,245 L 530,348 L 580,348" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                <circle cx="485" cy="245" r="3" fill="#2563eb" />
                <polygon points="575,344 580,348 575,352" fill="#2563eb" />
                <text x="500" y="300" fill="#2563eb" className="text-[8px] font-bold font-mono">referenced in</text>
              </svg>
            </div>

            {/* Explains relation workflow */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs leading-relaxed text-slate-600">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">🔗 Hubungan Cascade (Cascading Deletions):</span>
                Ketika Anda menghapus data <b>purchases</b> (pembelian) atau <b>sales</b> (penjualan) utama, PostgreSQL secara otomatis menghapus record detail di tabel <b>purchase_items</b> atau <b>sales_items</b> berkat constraint <code>on delete cascade</code>.
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">⚡ Aliran Trigger Otomatis (Automation):</span>
                Setiap kali data kasir melakukan input di tabel <code>sales_items</code>, trigger <code>trg_sales_stock</code> akan dijalankan di server untuk memotong nilai <code>stock</code> pada baris produk yang sesuai secara real-time.
              </div>
            </div>
          </div>
        )}

        {/* CONCEPT EXPLAIN MULTI LOGIN & SECURITY POLICIES */}
        {activeTab === 'auth' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1">
                <Lock size={16} className="text-rose-600 animate-pulse" />
                Keamanan & Konsep Multi Login Supabase
              </h3>
              <p className="text-xs text-slate-500 mt-1">Menggunakan built-in Supabase Auth dikombinasikan dengan PostgreSQL Row-Level Security (RLS) untuk membatasi pembacaan menu</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                <span className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center text-xs mb-3">1</span>
                <span className="font-bold text-slate-800 block mb-1.5 text-xs">Supabase Auth Sign-Up Trigger</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Saat user melakukan registrasi, Supabase Auth akan memvalidasinya. Kita dapat memasang PostgreSQL trigger di schema <code>auth.users</code> untuk mengisi tabel <code>profiles</code> secara otomatis.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                <span className="h-7 w-7 rounded-lg bg-orange-100 text-orange-700 font-extrabold flex items-center justify-center text-xs mb-3">2</span>
                <span className="font-bold text-slate-800 block mb-1.5 text-xs">Role-based Access Control (RBAC)</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Setiap profile menyimpan string status role <code>('admin', 'kasir', 'gudang', 'finance', 'purchasing')</code>. Pada saat aplikasi React melakukan fetch profile, aplikasi akan membatasi rendering menu sidebar.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                <span className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs mb-3">3</span>
                <span className="font-bold text-slate-800 block mb-1.5 text-xs">Row-Level Security (RLS)</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Supabase PostgreSQL melarang direct bypass! Kita mengaktifkan RLS sehingga user hanya bisa melihat, mengubah, atau memperbarui baris data yang diizinkan sesuai perannya.
                </p>
              </div>
            </div>

            {/* Code script block explaining RLS custom policy rule */}
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 space-y-3 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500">// Contoh Penerapan Row Level Security (RLS) Policy di Supabase (admin & purchasing)</span>
                <span className="text-[10px] text-rose-500">Security Rule</span>
              </div>
              <p className="text-slate-400">-- Aktifkan RLS pada produk</p>
              <p className="text-slate-200">alter table products enable row level security;</p>
              <br />
              <p className="text-slate-400">-- Izinkan Admin & Purchasing mengubah produk, Kasir & Gudang hanya bisa SELECT</p>
              <p className="text-indigo-400">{"create policy \"Hanya Admin & Purchasing yang bisa insert/update\""}</p>
              <p className="text-indigo-400">{"on products for all"}</p>
              <p className="text-indigo-400">{"using ("}</p>
              <p className="text-indigo-300">{"  exists ("}</p>
              <p className="text-indigo-300">{"    select 1 from profiles"}</p>
              <p className="text-indigo-300">{"    where id = auth.uid() and role in ('admin', 'purchasing')"}</p>
              <p className="text-indigo-300">{"  )"}</p>
              <p className="text-indigo-400 font-bold">{");"}</p>
            </div>
            
          </div>
        )}

      </div>

    </div>
  );
}
