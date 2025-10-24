import React, { useState, type PropsWithChildren, type FormEvent, useEffect, useMemo } from "react";

// --- Tipe Data (Interface) ---
interface UserSession {
  uid: number;
  username: string;
  name: string;
}

// --- LANGKAH 1: Perbarui Interface Contact ---
// Kita sesuaikan dengan data lengkap yang dikirim oleh Odoo (main.py)
interface Contact {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  street: string | false;
  city: string | false;
  zip: string | false;
  country: string | false;
  company_name: string | false;
}

// Tipe untuk data form, agar 'id' opsional saat membuat baru
type ContactFormData = Omit<Partial<Contact>, "id">;

// --- Komponen Layout (Tidak berubah) ---
type LayoutProps = {
  username: string;
  onLogout: () => void;
};

const Layout = ({ children, username, onLogout }: PropsWithChildren<LayoutProps>) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="font-bold text-lg text-gray-800">Odoo Dashboard</div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Selamat datang, <span className="font-medium">{username}</span>
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- Komponen Modal Universal (Tidak berubah) ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const Modal = ({ isOpen, onClose, title, children }: PropsWithChildren<ModalProps>) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};


// --- Komponen App Utama ---
function Appa() {
  const [login, setLogin] = useState("ikhsan@gmail.com");
  const [password, setPassword] = useState("123");
  
  const [session, setSession] = useState<UserSession | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  // State for client-side search
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Memoized filtered contacts (search by id, name, email, phone)
  const filteredContacts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const idStr = c.id?.toString() || "";
      const name = (c.name || "").toString().toLowerCase();
      const email = c.email ? c.email.toString().toLowerCase() : "";
      const phone = c.phone ? c.phone.toString().toLowerCase() : "";
      return idStr.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [contacts, searchTerm]);
  
  // State Error & Loading Global (Login, Fetch Awal)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LANGKAH 2: State Management untuk Form & Modal ---
  
  // State untuk form (Create/Edit)
  const [formData, setFormData] = useState<ContactFormData>({});
  
  // State untuk kontak yang dipilih (untuk View, Edit, Delete)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // State untuk loading di dalam modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk membuka/menutup masing-masing modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  
  // --- Fungsi Bantuan Modal (UI Saja) ---

  // Buka modal CREATE (kosongkan form)
  const openCreateModal = () => {
    setFormData({ name: "", email: "", phone: "", street: "", city: "", zip: "" });
    setError(null); // Bersihkan error lama
    setIsCreateModalOpen(true);
  };
  
  // Buka modal VIEW
  const openViewModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewModalOpen(true);
  };
  
  // Buka modal EDIT (isi form dengan data kontak)
  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    // Isi form dengan data yang ada
    setFormData({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      street: contact.street || "",
      city: contact.city || "",
      zip: contact.zip || "",
    });
    setError(null); // Bersihkan error lama
    setIsEditModalOpen(true);
  };
  
  // Buka modal DELETE
  const openDeleteModal = (contact: Contact) => {
    setSelectedContact(contact);
    setError(null); // Bersihkan error lama
    setIsDeleteModalOpen(true);
  };

  // Fungsi utama untuk menutup *semua* modal dan reset
  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedContact(null);
    setFormData({});
    setError(null); // Selalu bersihkan error saat modal ditutup
    setIsSubmitting(false); // Reset loading modal
  };

  // Helper untuk update state form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Fungsi API (Login, Fetch All) ---

  // Fungsi Login (Tidak berubah)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/web/session/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: { db: "db_odoo", login, password },
        }),
      });
      const data = await res.json();
      if (data.result && data.result.uid) {
        setSession(data.result);
        // Otomatis fetch contacts setelah login
      } else {
        const errorMessage = data.error?.data?.message || "Login atau Password salah.";
        setError(errorMessage);
        console.error("Login failed:", data.error);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Gagal terhubung ke server. Pastikan server proxy berjalan.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Fetch Contacts (Sedikit diubah agar dipanggil otomatis)
  const fetchContacts = async () => {
    if (!session) return; // Hanya fetch jika sudah login
    
    setLoading(true); // Gunakan loading global saat fetch awal
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/employees", {
        method: "GET",
        credentials: "include",
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengambil data");
      }
      
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setContacts(data.data);
      } else {
        console.error("No valid 'data' array found in response:", data);
        setError("Gagal mengambil data kontak.");
      }
    } catch (err: any) {
      console.error("Fetch contacts error:", err);
      setError(err.message || "Gagal mengambil data kontak.");
    } finally {
      setLoading(false);
    }
  };
  
  // Panggil fetchContacts setiap kali 'session' berubah (setelah login)
  useEffect(() => {
    fetchContacts();
  }, [session]); // Dependency: [session]

  // Fungsi Logout (Tidak berubah)
  const handleLogout = () => {
    setSession(null);
    setContacts([]);
    setError(null);
  };

  // --- LANGKAH 3: Implementasi handleCreateSubmit (POST) ---
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Tampilkan error dari Odoo (misal: "Nama wajib diisi")
        throw new Error(data.error || "Gagal membuat kontak.");
      }

      // Sukses! Tambahkan kontak baru ke state & tutup modal
      setContacts([...contacts, data.data]);
      closeModals();
      
    } catch (err: any) {
      console.error("Create contact error:", err);
      setError(err.message); // Tampilkan error di dalam modal
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- LANGKAH 4: Implementasi handleEditSubmit (PUT) ---
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return; // Pastikan ada kontak yang dipilih

    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`http://localhost:3000/api/contacts/${selectedContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui kontak.");
      }

      // Sukses! Update data di state
      setContacts(contacts.map(c => 
        c.id === selectedContact.id ? data.data : c
      ));
      closeModals();

    } catch (err: any) {
      console.error("Edit contact error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- LANGKAH 5: Implementasi handleDeleteConfirm (DELETE) ---
  const handleDeleteConfirm = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`http://localhost:3000/api/contacts/${selectedContact.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus kontak.");
      }
      
      // Sukses! Hapus kontak dari state
      setContacts(contacts.filter(c => c.id !== selectedContact.id));
      closeModals();

    } catch (err: any) {
      console.error("Delete contact error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Tampilan Login ---
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 font-sans">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-5"
        >
          <h2 className="text-2xl font-semibold text-center text-gray-800">Login Odoo</h2>
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Email</label>
            <input
              type="text"
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // --- Tampilan Dashboard (Setelah Login) ---
  return (
    <Layout username={session.name} onLogout={handleLogout}>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Daftar Kontak
        </h1>
        <button
          onClick={openCreateModal} // Gunakan fungsi pembuka modal yang baru
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Tambah Kontak
        </button>
      </div>
      {/* Search input */}
      <div className="mb-4 flex items-center justify-between space-x-4">
        <div className="flex items-center w-full max-w-md">
          <input
            type="text"
            placeholder="Cari nama, email, telepon atau id..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="ml-2 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
            >
              Clear
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Menampilkan {filteredContacts.length} dari {contacts.length}
        </div>
      </div>
      
      {/* Ini untuk error global (fetch), error modal ada di dalam modal */}
      {error && !isSubmitting && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase">ID</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Nama</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Email</th>
              {/* LANGKAH 6: Tambah kolom Telepon */}
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Telepon</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Tidak ada data kontak.
                </td>
              </tr>
            )}
            {filteredContacts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-700">{c.id}</td>
                <td className="p-4 font-medium text-gray-900">{c.name}</td>
                <td className="p-4 text-gray-700">{c.email || "-"}</td>
                {/* LANGKAH 6: Tampilkan data Telepon */}
                <td className="p-4 text-gray-700">{c.phone || "-"}</td>
                <td className="p-4 text-right space-x-3 whitespace-nowrap">
                  <button 
                    onClick={() => openViewModal(c)} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Lihat
                  </button>
                  <button 
                    onClick={() => openEditModal(c)} 
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => openDeleteModal(c)} 
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Implementasi 4 Modal --- */}

      {/* 1. Modal Tambah Kontak (Create) */}
      <Modal isOpen={isCreateModalOpen} onClose={closeModals} title="Tambah Kontak Baru">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Tampilkan error spesifik di dalam modal */}
          {error && isSubmitting && (
             <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Nama</label>
            <input
              type="text"
              name="name" // 'name' harus sesuai dengan key di state
              placeholder="Nama Lengkap"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name || ""} // 'value' dari state
              onChange={handleFormChange} // 'onChange' untuk update state
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@contoh.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email || ""}
              onChange={handleFormChange}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Telepon</label>
            <input
              type="text"
              name="phone"
              placeholder="0812345..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.phone || ""}
              onChange={handleFormChange}
            />
          </div>
          {/* Tambahkan input lain (street, city, zip) di sini jika mau */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting} // Disable tombol saat loading
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Lihat Kontak (View) - LANGKAH 6 Diperbarui */}
      <Modal isOpen={isViewModalOpen} onClose={closeModals} title="Detail Kontak">
        {selectedContact && (
          <div className="space-y-3 text-gray-700">
            <div><strong className="text-gray-900 w-24 inline-block">ID</strong>: {selectedContact.id}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Nama</strong>: {selectedContact.name}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Email</strong>: {selectedContact.email || "-"}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Telepon</strong>: {selectedContact.phone || "-"}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Alamat</strong>: {selectedContact.street || "-"}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Kota</strong>: {selectedContact.city || "-"}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Kode Pos</strong>: {selectedContact.zip || "-"}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Negara</strong>: {selectedContact.country || "-"}</div>
            <div><strong className="text-gray-900 w-24 inline-block">Perusahaan</strong>: {selectedContact.company_name || "-"}</div>
          </div>
        )}
      </Modal>

      {/* 3. Modal Edit Kontak (Edit) */}
      <Modal isOpen={isEditModalOpen} onClose={closeModals} title="Edit Kontak">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && isSubmitting && (
             <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Nama</label>
            <input
              type="text"
              name="name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name || ""}
              onChange={handleFormChange}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Email</label>
            <input
              type="email"
              name="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email || ""}
              onChange={handleFormChange}
            />
          </div>
           <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Telepon</label>
            <input
              type="text"
              name="phone"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.phone || ""}
              onChange={handleFormChange}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-300"
            >
              {isSubmitting ? "Memperbarui..." : "Update"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Hapus Kontak (Delete) */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeModals} title="Hapus Kontak">
        {error && isSubmitting && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        <p className="text-gray-700">
          Apakah Anda yakin ingin menghapus kontak 
          <strong className="text-gray-900"> {selectedContact?.name}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={closeModals}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium disabled:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:bg-red-300"
          >
            {isSubmitting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </Modal>

    </Layout>
  );
}

export default Appa;
