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
      const response = await fetch(`/api/proxy${LOGIN_ENDPOINT}`, {
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
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 overflow-hidden bg-[#FAFAFA]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-indigo-100/30 blur-[100px] pointer-events-none" />

      {/* FLOATING SETTINGS IN TOP RIGHT */}
      <div className="absolute top-8 right-8 z-50">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 shadow-xl",
            showSettings ? "bg-slate-900 text-white rotate-90" : "bg-white text-slate-400 hover:text-blue-600 shadow-slate-200/50 border border-slate-100"
          )}
        >
          {showSettings ? <X className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 rounded-[2.5rem] bg-white p-8 shadow-2xl ring-1 ring-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                 <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-blue-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Server API</h3>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Konfigurasi endpoint sistem</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                    Target URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => updateBaseUrl(e.target.value)}
                    autoFocus
                    className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-100 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs font-mono bg-slate-50 shadow-sm outline-none transition-all"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 border-dashed">
                  URL ini digunakan sebagai target proxy. Pastikan format sudah benar tanpa akhiran /api.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-10 relative z-10"
      >
        <div className="text-center space-y-2">
          <motion.div 
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/40 border-4 border-white"
          >
            <Lock className="h-12 w-12" />
          </motion.div>
          <div className="pt-4">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
              POS <span className="text-blue-600">PRO</span>
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Nganjuk Digital System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6 rounded-[3.5rem] bg-white p-10 shadow-2xl shadow-slate-200/60 border border-slate-50 ring-4 ring-white">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 block ml-1">
                  Identitas Username
                </label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    {...register('username', { required: true })}
                    type="text"
                    placeholder="Masukkan username"
                    className={cn(
                      "block w-full rounded-2xl border-0 py-5 pl-14 pr-5 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm font-bold transition-all bg-slate-50/20 shadow-sm",
                      errors.username && "ring-red-500 focus:ring-red-500 bg-red-50/30"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 block ml-1">
                  Kredensial Password
                </label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    {...register('password', { required: true })}
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "block w-full rounded-2xl border-0 py-5 pl-14 pr-5 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm font-bold transition-all bg-slate-50/20 shadow-sm",
                      errors.password && "ring-red-500 focus:ring-red-500 bg-red-50/30"
                    )}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-[10px] font-bold text-red-600 border border-red-100 border-dashed"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="uppercase tracking-tight leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-[2rem] bg-blue-600 px-4 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Akses Sistem Sekarang
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="text-center px-12 space-y-4">
            <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
               <div className="h-10 w-10 bg-slate-200 rounded-full" />
               <div className="h-10 w-10 bg-slate-200 rounded-full" />
               <div className="h-10 w-10 bg-slate-200 rounded-full" />
            </div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] leading-relaxed">
              &copy; 2026 Nganjuk Network
              <br/> 
              <span className="opacity-50">Enterprise Edition v1.0.4</span>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
