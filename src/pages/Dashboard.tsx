import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, History, Settings, LogOut, Search, User, Package, Plus, Edit2, Trash2, RefreshCcw } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// --- Sub-Pages Components ---

function UserManajemen() {
  const { token, baseUrl } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role_id: '2' // Default to Cashier
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/proxy/users', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
      });
      const result = await response.json();
      const userItems = Array.isArray(result) ? result : (result.data || result.users || []);
      setUsers(userItems);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, baseUrl]);

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: '', // Keep password empty unless updating
      full_name: user.full_name,
      role_id: String(user.role_id)
    });
    setShowAdd(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.full_name || (!editingId && !formData.password)) {
      alert('Mohon lengkapi data user');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId !== null ? `/api/proxy/users/${editingId}` : '/api/proxy/users';
      const method = editingId !== null ? 'PUT' : 'POST';
      
      const payload = { 
        ...formData,
        role_id: Number(formData.role_id)
      };
      if (editingId && !payload.password) delete (payload as any).password;

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || (editingId ? 'Gagal update user' : 'Gagal menambah user'));
      
      setFormData({ username: '', password: '', full_name: '', role_id: '2' });
      setShowAdd(false);
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    try {
      const response = await fetch(`/api/proxy/users/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl 
        }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menghapus user');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen User</h2>
          <p className="text-slate-500 text-sm">Kelola akun kasir dan admin</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchUsers}
            className="h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all"
          >
            <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
          </button>
          <button 
            onClick={() => {
              if (showAdd) {
                setEditingId(null);
                setFormData({ username: '', password: '', full_name: '', role_id: '2' });
              }
              setShowAdd(!showAdd);
            }}
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all",
              showAdd ? "bg-red-50 text-red-600 rotate-45" : "bg-slate-900 text-white"
            )}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleAddUser}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4"
          >
             <h3 className="text-sm font-bold text-slate-900 mb-2">{editingId ? 'Edit User' : 'Tambah User Baru'}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  placeholder="Username" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="bg-slate-50 rounded-2xl p-4 text-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-slate-900"
                />
                <input 
                  placeholder={editingId ? "Isi kolom ini bila ingin ganti password" : "Password"} 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="bg-slate-50 rounded-2xl p-4 text-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-slate-900"
                />
             </div>
             <input 
               placeholder="Nama Lengkap" 
               value={formData.full_name}
               onChange={e => setFormData({...formData, full_name: e.target.value})}
               className="w-full bg-slate-50 rounded-2xl p-4 text-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-slate-900"
             />
             <select 
               value={formData.role_id}
               onChange={e => setFormData({...formData, role_id: e.target.value})}
               className="w-full bg-slate-50 rounded-2xl p-4 text-sm outline-none ring-1 ring-slate-100"
             >
                <option value="1">Admin</option>
                <option value="2">Cashier</option>
             </select>
             <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm">
               {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update User' : 'Tambah User')}
             </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-10"><div className="h-8 w-8 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-[2rem] text-center border border-red-100">
             <p className="text-red-600 font-bold text-sm">Gagal memuat data user</p>
             <p className="text-red-400 text-[10px] mt-1 uppercase font-black">{error}</p>
             <button onClick={fetchUsers} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase">Coba Lagi</button>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
             <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold">Belum ada user terdaftar</p>
             <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Gunakan tombol + untuk menambah</p>
          </div>
        ) : users.map((u: any) => (
          <div key={u.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                 <User className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{u.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role_name || (Number(u.role_id) === 1 ? 'Admin' : 'Cashier')} • @{u.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleEdit(u)} 
                className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                title="Edit User"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDelete(u.id)} 
                className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                title="Hapus User"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KategoriManajemen() {
  const { token, baseUrl } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for Add/Edit Form
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/proxy/categories', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl 
        }
      });
      const result = await response.json();
      const items = Array.isArray(result) ? result : (result.data || result.categories || []);
      setCategories(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token, baseUrl]);

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setNewCatName(cat.category_name);
    setShowAdd(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      const url = editingId !== null ? `/api/proxy/categories/${editingId}` : '/api/proxy/categories';
      const method = editingId !== null ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category_name: newCatName })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || (editingId ? 'Gagal update kategori (API mungkin tidak mendukung PUT categories)' : 'Gagal menambah kategori'));
      
      setNewCatName('');
      setShowAdd(false);
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Hapus kategori ini? Pastikan tidak ada produk yang menggunakan kategori ini.')) return;
    try {
      const response = await fetch(`/api/proxy/categories/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl 
        }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menghapus kategori');
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kategori Menu</h2>
          <p className="text-slate-500 text-sm">Kelompokkan produk Anda</p>
        </div>
        <button 
          onClick={() => {
            if (showAdd) {
              setEditingId(null);
              setNewCatName('');
            }
            setShowAdd(!showAdd);
          }}
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95",
            showAdd ? "bg-red-50 text-red-600 rotate-45 shadow-red-100" : "bg-indigo-600 text-white shadow-indigo-100"
          )}
        >
          <Plus className="h-6 w-6" />
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddCategory}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">{editingId ? 'Edit Kategori' : 'Kategori Baru'}</h3>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block pl-1">Nama Kategori</label>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Makanan Berat"
                  disabled={isSubmitting}
                  className="w-full bg-slate-50 rounded-2xl py-3 px-4 text-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting || !newCatName.trim()}
                className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Menyimpan..." : (editingId ? "Update Kategori" : "Simpan Kategori")}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {loading && categories.length === 0 ? (
          <div className="py-20 flex justify-center"><div className="h-8 w-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : categories.map((cat) => (
          <div key={cat.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border border-slate-50 shadow-sm">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold uppercase text-xs">
                  {cat.category_name?.substring(0, 2) || "?? "}
                </div>
                <h4 className="font-bold text-slate-800">{cat.category_name || "Tanpa Nama"}</h4>
             </div>
             <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleEdit(cat)} 
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold"
                  title="Edit Kategori"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)} 
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold"
                  title="Hapus Kategori"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProdukManajemen() {
  const { token, baseUrl } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Add/Edit Form
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    stock: '',
    category_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/proxy/products', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
        }),
        fetch('/api/proxy/categories', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
        })
      ]);
      
      const prodResult = await prodRes.json();
      const catResult = await catRes.json();
      
      setProducts(Array.isArray(prodResult) ? prodResult : (prodResult.data || prodResult.products || []));
      setCategories(Array.isArray(catResult) ? catResult : (catResult.data || catResult.categories || []));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, baseUrl]);

  const handleEdit = (product: any) => {
    setEditingId(product.id || product.productId);
    setFormData({
      product_name: product.product_name,
      price: String(product.price),
      stock: String(product.stock),
      category_id: String(product.category_id)
    });
    setShowAdd(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.price || !formData.stock || !formData.category_id) {
      alert('Mohon lengkapi data produk');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId !== null ? `/api/proxy/products/${editingId}` : '/api/proxy/products';
      const method = editingId !== null ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category_id: Number(formData.category_id),
          product_name: formData.product_name,
          price: Number(formData.price),
          stock: Number(formData.stock)
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || (editingId ? 'Gagal update produk' : 'Gagal menambah produk'));
      
      setFormData({ product_name: '', price: '', stock: '', category_id: '' });
      setShowAdd(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const response = await fetch(`/api/proxy/products/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl 
        }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menghapus produk');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Produk</h2>
          <p className="text-slate-500 text-sm">Tambah, ubah, atau hapus menu kasir</p>
        </div>
        <button 
          onClick={() => {
            if (showAdd) {
               setEditingId(null);
               setFormData({ product_name: '', price: '', stock: '', category_id: '' });
            }
            setShowAdd(!showAdd);
          }}
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95",
            showAdd ? "bg-red-50 text-red-600 rotate-45 shadow-red-100" : "bg-blue-600 text-white shadow-blue-200"
          )}
        >
          <Plus className="h-6 w-6" />
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddProduct}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">{editingId ? 'Edit Produk' : 'Produk Baru'}</h3>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block pl-1">Nama Produk</label>
                <input 
                  type="text" 
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  placeholder="Contoh: Kopi Susu Aren"
                  className="w-full bg-slate-50 rounded-2xl py-3 px-4 text-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block pl-1">Harga</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="15000"
                    className="w-full bg-slate-50 rounded-2xl py-3 px-4 text-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block pl-1">Stok</label>
                  <input 
                    type="number" 
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="10"
                    className="w-full bg-slate-50 rounded-2xl py-3 px-4 text-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block pl-1">Kategori</label>
                  <select 
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl py-3 px-4 text-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  >
                    <option value="">Pilih</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting || !formData.product_name || !formData.price || !formData.stock}
                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Menyimpan..." : (editingId ? "Update Produk" : "Simpan Produk")}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : products.map((product) => (
          <div key={product.id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-50">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Package className="h-6 w-6" />
               </div>
               <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.category_name}</span>
                  <h4 className="font-bold text-slate-800 leading-tight">{product.product_name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs font-bold text-blue-600">Rp{(product.price || 0).toLocaleString()}</p>
                    <span className="h-1 w-1 bg-slate-200 rounded-full" />
                    <p className="text-[10px] font-bold text-slate-400">Stok: {product.stock}</p>
                  </div>
               </div>
             </div>
             <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleEdit(product)} 
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold"
                  title="Edit Produk"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(product.id)} 
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold"
                  title="Hapus Produk"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BerandaKasir({ onAddToCart }: { onAddToCart: (p: any) => void }) {
  const { user, token, baseUrl } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/proxy/products', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
        });
        const result = await response.json();
        const items = Array.isArray(result) ? result : (result.data || result.products || []);
        setProducts(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token, baseUrl]);

  const filtered = products.filter(p => 
    (p.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">Selamat Datang</h1>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.full_name?.split(' ')[0] || 'Kasir'}</h2>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-400 border border-slate-100">
           <User className="h-6 w-6" />
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Cari menu favorit atau scan..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white rounded-[1.5rem] py-4 pl-12 pr-4 text-sm ring-1 ring-slate-100 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300 font-medium"
        />
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Menyiapkan Menu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-100">
          <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm tracking-tight text-balance px-10">
            {search ? 'Menu tidak ditemukan' : 'Belum ada produk terdaftar. Cabang ini masih kosong.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 pb-24">
          {filtered.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-between group active:scale-95 transition-transform"
            >
              <div>
                 <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                    {item.category_name}
                   </span>
                   {item.stock !== undefined && (
                     <span className={cn("text-[8px] font-bold", item.stock > 0 ? "text-green-500" : "text-red-500")}>
                        {item.stock > 0 ? `Sedia ${item.stock}` : 'Habis'}
                     </span>
                   )}
                 </div>
                 <h3 className="mt-4 font-bold text-slate-800 leading-snug line-clamp-2">{item.product_name}</h3>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 tracking-tight">Rp{(item.price || 0).toLocaleString()}</span>
                <button 
                  disabled={item.stock <= 0}
                  onClick={() => onAddToCart(item)}
                  className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 transition-colors shadow-lg shadow-slate-200"
                >
                  +
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Transaksi({ cart, onUpdateQty, onRemove, onClear }: { cart: any[], onUpdateQty: any, onRemove: any, onClear: any }) {
  const { token, baseUrl } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [method, setMethod] = useState('Cash');
  const [shouldPrint, setShouldPrint] = useState(true);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/proxy/sales/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-target-base-url': baseUrl,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method: method,
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          }))
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Transaksi gagal');
      
      alert('Berhasil! ' + result.message);

      // Arahkan ke print jika diinginkan
      const saleId = result.data?.id || (result.sale && result.sale.id);
      if (shouldPrint && saleId) {
        window.open(`/api/proxy/sales/print/${saleId}?token=${token}`, '_blank');
      }

      onClear();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Checkout Pesanan</h2>
        <p className="text-slate-500 text-sm">Review dan simpan transaksi</p>
      </header>

      {cart.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-slate-200" />
          </div>
          <p className="text-slate-400 font-bold text-sm">Keranjang masih kosong</p>
          <Link to="/" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Pilih Menu</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-tight">{item.product_name}</h4>
                    <p className="text-[10px] font-bold text-blue-600">Rp{item.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center bg-slate-50 rounded-lg p-0.5">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="h-6 w-6 flex items-center justify-center font-bold text-slate-400">-</button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="h-6 w-6 flex items-center justify-center font-bold text-slate-400">+</button>
                   </div>
                   <button onClick={() => onRemove(item.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              <div className="flex flex-col gap-1">
                <span>Metode Pembayaran</span>
                <button 
                  onClick={() => setShouldPrint(!shouldPrint)}
                  className="flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <div className={cn("h-3 w-3 rounded-full border border-blue-400 flex items-center justify-center", shouldPrint && "bg-blue-400")}>
                    {shouldPrint && <div className="h-1.5 w-1.5 bg-slate-900 rounded-full" />}
                  </div>
                  Print Struk Otomatis
                </button>
              </div>
              <div className="flex gap-2">
                {['Cash', 'QRIS', 'Transfer'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn("px-3 py-1 rounded-lg", method === m ? "bg-blue-600 text-white" : "bg-slate-800")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-slate-800 pt-6">
               <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Tagihan</p>
                  <p className="text-3xl font-black tracking-tight font-mono">Rp{total.toLocaleString()}</p>
               </div>
               <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
               >
                 {isProcessing ? 'Proses...' : 'Bayar'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Riwayat() {
  const { token, baseUrl } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [recap, setRecap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detail State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, recapRes] = await Promise.all([
        fetch('/api/proxy/sales/history', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
        }),
        fetch('/api/proxy/sales/recap/daily', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
        }).catch(() => null)
      ]);

      const histResult = await histRes.json();
      const histItems = Array.isArray(histResult) ? histResult : (histResult.data || histResult.sales || []);
      setHistory(histItems);

      if (recapRes) {
        const recapResult = await recapRes.json();
        setRecap(recapResult.data || recapResult);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, baseUrl]);

  const handleShowDetail = async (sale: any) => {
    setSelectedSale(sale);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/proxy/sales/history/${sale.id || sale.sale_id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-target-base-url': baseUrl }
      });
      const result = await response.json();
      if (response.ok) {
        setSelectedSale(result.data || result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Penjualan</h2>
        <p className="text-slate-500 text-sm">Rekap semua transaksi yang telah selesai</p>
      </header>

      {recap && (
        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200">
           <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Omzet Hari Ini</p>
           <h3 className="text-3xl font-black tracking-tight">Rp{Number(recap.total || 0).toLocaleString()}</h3>
           <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-blue-100 opacity-80 uppercase tracking-widest">Sistem Kasir Online</p>
           </div>
        </div>
      )}
      
      <div className="space-y-4">
         {loading ? (
           <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat Riwayat...</p>
           </div>
         ) : error ? (
           <div className="bg-red-50 p-6 rounded-[2rem] text-center">
              <p className="text-sm text-red-600 font-bold">{error}</p>
           </div>
         ) : history.length === 0 ? (
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <History className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">Belum ada riwayat transaksi</p>
           </div>
         ) : (
           history.map((log, i) => (
             <motion.button 
               key={log.id || i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               onClick={() => handleShowDetail(log)}
               className="w-full bg-white p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-50 hover:border-blue-100 hover:shadow-md transition-all cursor-pointer group text-left"
             >
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <History className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">#{log.id || i + 1}</p>
                    <h4 className="font-bold text-slate-900">Rp{Number(log.total_amount).toLocaleString()}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {new Date(log.sale_date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
                    {log.payment_method}
                  </span>
                  <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase">{log.cashier_name}</p>
               </div>
             </motion.button>
           ))
         )}
      </div>

      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedSale(null)}
                className="absolute top-6 right-6 h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                style={{ zIndex: 60 }}
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>

              <div className="p-8 pb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Rincian Transaksi</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">#TRX-{selectedSale.id || '-'}</h3>
              </div>

              <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto">
                <div className="bg-slate-50 rounded-[2rem] p-6 mb-6">
                   <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      <span>Produk</span>
                      <span>Subtotal</span>
                   </div>
                   
                   {detailLoading ? (
                     <div className="py-6 flex justify-center"><div className="h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
                   ) : (
                     <div className="space-y-4">
                        {(selectedSale.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start gap-4">
                             <div>
                                <p className="text-sm font-bold text-slate-800 leading-tight">{item.product_name}</p>
                                <p className="text-[10px] font-bold text-slate-400">{item.quantity} x Rp{Number(item.subtotal / item.quantity).toLocaleString()}</p>
                             </div>
                             <p className="text-sm font-black text-slate-900">Rp{Number(item.subtotal).toLocaleString()}</p>
                          </div>
                        ))}
                        {(!selectedSale.items || selectedSale.items.length === 0) && !detailLoading && (
                          <p className="text-center text-xs text-slate-400 font-bold py-4">Data item tidak tersedia</p>
                        )}
                     </div>
                   )}
                </div>

                <div className="space-y-4 px-2">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</p>
                      <p className="text-xs font-bold text-slate-900">{new Date(selectedSale.sale_date).toLocaleString('id-ID')}</p>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Bayar</p>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-3 py-1 rounded-lg">Sukses</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metode</p>
                      <p className="text-xs font-bold text-slate-900">{selectedSale.payment_method}</p>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kasir</p>
                      <p className="text-xs font-bold text-slate-900">{selectedSale.cashier_name || 'Admin'}</p>
                   </div>
                   
                   <div className="pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Total Tagihan</p>
                         <p className="text-3xl font-black text-slate-900 tracking-tighter">Rp{Number(selectedSale.total_amount).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const saleId = selectedSale.id || selectedSale.sale_id;
                          window.open(`/api/proxy/sales/print/${saleId}?token=${token}`, '_blank');
                        }}
                        className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all"
                      >
                        Print Struk
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pengaturan() {
  const { logout, baseUrl, user } = useAuth();
  const isAdmin = user?.role === 'admin' || Number(user?.role_id) === 1;
  const roleLabel = isAdmin ? 'Owner / Admin' : 'Staff Kasir';
  
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan</h2>
        <p className="text-slate-500 text-sm">Sistem dan informasi akun</p>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8">
        <div className="flex items-center gap-5">
           <div className="h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 ring-4 ring-blue-50/50">
              <User className="h-10 w-10" />
           </div>
           <div>
              <span className="inline-block px-2 py-1 rounded-lg bg-blue-100 text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">
                {user?.role || (Number(user?.role_id) === 1 ? 'Admin' : 'Cashier')}
              </span>
              <h3 className="font-bold text-xl text-slate-900 leading-tight">{user?.full_name || user?.username}</h3>
              <p className="text-sm text-slate-500 font-medium">{roleLabel}</p>
           </div>
        </div>

        <div className="space-y-5 pt-6 border-t border-slate-50">
           <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Server API Aktif</label>
              <div className="bg-slate-50 p-4 rounded-2xl text-xs font-mono text-slate-600 break-all border border-slate-100">
                {baseUrl}
              </div>
           </div>

           {(user?.role === 'admin' || Number(user?.role_id) === 1) && (
             <Link 
               to="/users"
               className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors group"
             >
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                      <User className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800">Manajemen User</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Kelola Akun Kasir</p>
                   </div>
                </div>
                <Plus className="h-4 w-4 text-slate-300" />
             </Link>
           )}
           
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 active:scale-[0.98] transition-all"
           >
              <LogOut className="h-5 w-5" />
              Keluar dari Sistem
           </button>
        </div>
      </div>

      <div className="text-center px-10">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Nganjuk POS Mobile v1.0</p>
      </div>
    </div>
  );
}

// --- Main Layout ---

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [cart, setCart] = useState<any[]>([]);

  // Cart logic
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen pb-32">
      <main className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Routes>
              <Route path="/" element={<BerandaKasir onAddToCart={addToCart} />} />
              <Route path="/transaksi" element={
                <Transaksi 
                  cart={cart} 
                  onUpdateQty={updateQuantity} 
                  onRemove={removeFromCart} 
                  onClear={clearCart} 
                />
              } />
              <Route path="/riwayat" element={<Riwayat />} />
              <Route path="/users" element={<UserManajemen />} />
              <Route path="/produk" element={
                <div className="space-y-12">
                  <KategoriManajemen />
                  <div className="pt-12 border-t border-slate-100">
                    <ProdukManajemen />
                  </div>
                </div>
              } />
              <Route path="/pengaturan" element={<Pengaturan />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* DOCK BAR */}
      <nav className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-2 shadow-2xl shadow-blue-900/10 border border-white/50 flex items-center justify-between px-6">
          {[
            { icon: Home, label: 'Kasir', path: '/' },
            { icon: ClipboardList, label: 'Order', path: '/transaksi', badge: cart.length },
            ...((user?.role === 'admin' || Number(user?.role_id) === 1) ? [{ icon: Package, label: 'Menu', path: '/produk' }] : []),
            { icon: History, label: 'Laporan', path: '/riwayat' },
            { icon: Settings, label: 'Atur', path: '/pengaturan' },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 transition-all duration-300",
                  isActive ? "text-blue-600" : "text-slate-400 opacity-60"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-6 w-6 transition-all", isActive && "scale-110")} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[8px] font-black mt-1 uppercase tracking-tighter transition-all", isActive ? "opacity-100" : "opacity-0 h-0 w-0 overflow-hidden")}>
                  {item.label}
                </span>
                {isActive && (
                   <motion.div 
                     layoutId="dock-dot"
                     className="absolute -bottom-1 h-1 w-1 bg-blue-600 rounded-full"
                   />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
