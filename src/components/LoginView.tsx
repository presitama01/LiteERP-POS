import React, { useState } from 'react';
import { Lock, User, ShieldAlert, CheckCircle, HelpCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (role: UserRole) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-configured accounts for simulator
  const accounts = [
    { username: 'psi-admin', label: 'Administrator', role: 'admin' as UserRole, desc: 'Akses penuh seluruh modul ERP & SCM, otorisasi tinggi' },
    { username: 'psi-kasir', label: 'Siti (Kasir Retail POS)', role: 'kasir' as UserRole, desc: 'Hanya modul penjualan (Kasir POS) & master Customer' },
    { username: 'psi-purchasing', label: 'Andi (Purchasing Officer)', role: 'purchasing' as UserRole, desc: 'Akses produk, Supplier & re-stock pembelian' },
    { username: 'psi-gudang', label: 'Hasan (Manajer Gudang)', role: 'gudang' as UserRole, desc: 'Akses stok (ledger), data kategori & produk' },
    { username: 'psi-finance', label: 'Rian (Finance Officer)', role: 'finance' as UserRole, desc: 'Akses Buku jurnal kas, Rugi Laba & Excel Export' }
  ];

  const handleQuickLogin = (acc: typeof accounts[number]) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setTimeout(() => {
      onLoginSuccess(acc.role);
      setIsSubmitting(false);
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Simulated authentic authentication query logic
    setTimeout(() => {
      const match = accounts.find(
        (acc) =>
          acc.username.toLowerCase() === username.trim().toLowerCase() &&
          password === acc.username.split('-')[1] // password is the suffix e.g. "admin", "kasir"
      );

      if (match) {
        onLoginSuccess(match.role);
      } else {
        setErrorMsg('Autentikasi Gagal: Kombinasi username atau password salah untuk PT. UNIMETRIKA UTAMA.');
      }
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      {/* Visual background gradient accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[130px]" />
      </div>

      {/* Top corporate bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-md">
            <span className="text-sm font-black text-white">UU</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white">PT. UNIMETRIKA UTAMA</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-tight">JL. Agung Timur 8 Blok D Kav. No.7 Sunter Jaya, Tanjung Priok, Jakarta</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SSL SECURE CONNECTION ACTIVE</span>
        </div>
      </header>

      {/* Main Content Center */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10 overflow-y-auto">
        
        {/* Left column: Brand values and info */}
        <div className="md:col-span-5 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-black text-blue-400">
            <span>Enterprise Suite ERP v5.4</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Sistem Informasi <span className="text-blue-500">SCM & Logistik</span> Terintegrasi
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Selamat datang di portal autentikasi terpusat karyawan PT. UNIMETRIKA UTAMA. Hubungi bagian IT Support apabila terjadi kendala akses login sistem atau sinkronisasi Supabase.
          </p>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-md bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">✓</div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Keamanan Enkripsi Dua Arah</h4>
                <p className="text-[10px] text-slate-400 font-medium">Melindungi transaksi finansial harian serta stock logistik gudang secara real-time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form Box & Quick demo login selector */}
        <div className="md:col-span-7 space-y-5">
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Masuk Ke Sistem</h3>
            <p className="text-[11px] text-slate-400 mb-6 font-medium font-sans">Gunakan kredensial portal resmi karyawan PT. UNIMETRIKA UTAMA.</p>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-[11px] text-red-300 font-semibold flex gap-2 mb-4 leading-relaxed">
                <ShieldAlert size={16} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username Pegawai</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-500">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Masukan username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900 rounded-lg border border-slate-800 py-3 pl-10 pr-4 text-xs font-bold text-white transition-all focus:border-blue-500 focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-500">
                    <Lock size={15} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan sandi rahasia..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 rounded-lg border border-slate-800 py-3 pl-10 pr-10 text-xs font-bold text-white transition-all focus:border-blue-500 focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold font-sans text-white hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Mengautentikasi...' : 'Masuk Portal Secure UU'}
                <ArrowRight size={14} />
              </button>
            </form>

          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <footer className="px-6 py-4 border-t border-slate-800 bg-slate-950 text-slate-500 text-center text-[10px] font-bold relative z-10 shrink-0">
        <p>© 2026 PT. UNIMETRIKA UTAMA ERP & Supply Chain Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
