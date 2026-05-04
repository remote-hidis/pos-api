import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/AuthContext';
import { Settings, Lock, User, ChevronRight, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { LOGIN_ENDPOINT } from '../constants';

export default function LoginPage() {
  const { baseUrl, updateBaseUrl, login } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Menggunakan Proxy Lokal untuk menghindari CORS
      const response = await fetch(`/api/proxy/users/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-target-base-url': baseUrl 
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        })
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Non-JSON response:", responseText);
        // Jika response diawali dengan <!DOCTYPE html, berarti kita menerima halaman HTML (biasanya 404 dari Vercel/Proxy)
        if (responseText.trim().toLowerCase().startsWith('<!doctype html') || responseText.trim().toLowerCase().startsWith('<html')) {
           throw new Error('Respon server adalah halaman HTML, bukan JSON. Ini biasanya terjadi jika URL API salah atau Proxy tidak ditemukan (404).');
        }
        throw new Error('Respon server tidak valid: ' + responseText.substring(0, 100) + '...');
      }

      if (!response.ok) {
        throw new Error(result.message || 'Login gagal. Periksa kembali username dan password Anda.');
      }

      // Sesuai dengan spesifikasi JSON yang diberikan user
      const userData = result.user;
      const token = result.token;

      if (!token) throw new Error('Token tidak ditemukan dalam respon API.');

      login(userData, token);
    } catch (err: any) {
      setError(err.message === "Failed to fetch" ? "Koneksi terputus. Pastikan server proxy aktif." : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      {/* FLOATING SETTINGS IN TOP RIGHT */}
      <div className="absolute top-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 shadow-lg shadow-slate-200/50",
            showSettings ? "bg-white text-blue-600 rotate-90" : "bg-white text-slate-400 hover:text-blue-600"
          )}
        >
          {showSettings ? <X className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-72 rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                Konfigurasi API
              </h3>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Base API URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => updateBaseUrl(e.target.value)}
                autoFocus
                className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs font-mono"
              />
              <p className="mt-2 text-[9px] text-slate-400 leading-relaxed">
                Ubah URL di atas jika Anda menggunakan server API kustom.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-200 rotate-3">
            <Lock className="h-10 w-10 -rotate-3" />
          </div>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900">
            Nganjuk POS
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Masuk untuk mulai kelola transaksi kasir
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
          <div className="space-y-4 rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  {...register('username', { required: true })}
                  type="text"
                  placeholder="Username Anda"
                  className={cn(
                    "block w-full rounded-2xl border-0 py-4 pl-12 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm transition-all bg-slate-50/30",
                    errors.username && "ring-red-500 focus:ring-red-500"
                  )}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  {...register('password', { required: true })}
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    "block w-full rounded-2xl border-0 py-4 pl-12 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm transition-all bg-slate-50/30",
                    errors.password && "ring-red-500 focus:ring-red-500"
                  )}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Masuk Sekarang
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="text-center px-8">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
              &copy; 2026 Nganjuk POS Mobile System 
              <br/> 
              Powered by Nganjuk Network
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
