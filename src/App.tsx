import React, { useState, PropsWithChildren, FormEvent } from "react";

// --- Tipe Data (Interface) ---
// (Tidak berubah)
interface UserSession {
  uid: number;
  username: string;
  name: string;
  // Tambahkan properti lain dari 'session' jika ada
}

interface Contact {
  id: number;
  name: string;
  email: string | false; // Email bisa jadi false dari Odoo
}

// --- Komponen Layout (Perbaikan untuk 'children') ---
// (Tidak berubah)
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
        {/* Konten utama (termasuk modal) akan dirender di sini */}
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- LANGKAH 2: Komponen Modal Universal ---
// Komponen baru yang bisa kita gunakan ulang untuk semua modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const Modal = ({ isOpen, onClose, title, children }: PropsWithChildren<ModalProps>) => {
  if (!isOpen) return null;

  return (
    // Overlay latar belakang
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose} // Menutup modal saat klik di luar
    >
      {/* Panel Modal */}
      <div
        className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg z-50"
        onClick={(e) => e.stopPropagation()} // Mencegah penutupan saat klik di dalam modal
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        {/* Konten Modal (Form, Teks, dll) */}
        <div>{children}</div>
      </div>
    </div>
  );
};


// --- Komponen App Utama ---
function App() {
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("admin");
  
  const [session, setSession] = useState<UserSession | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LANGKAH 1: State Management untuk Modal ---
  // State untuk kontak yang dipilih (untuk View, Edit, Delete)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // State untuk membuka/menutup masing-masing modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Fungsi Bantuan Modal (UI Saja) ---

  // Fungsi untuk membuka modal dengan kontak yang dipilih
  const openViewModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewModalOpen(true);
  };
  
  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };
  
  const openDeleteModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  // Fungsi utama untuk menutup *semua* modal dan reset kontak
  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedContact(null); // Selalu reset selected contact
  };

  // --- Handler Dummy (UI Saja) ---
  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Submit Create Form (UI Saja)");
    closeModals(); // Tutup modal setelah submit
  };
  
  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Submit Edit Form untuk contact:", selectedContact?.id, "(UI Saja)");
    closeModals();
  };
  
  const handleDeleteConfirm = () => {
    console.log("Delete contact:", selectedContact?.id, "(UI Saja)");
    closeModals();
  };

  // Fungsi Login (Tidak berubah)
  const handleLogin = async (e: React.FormEvent) => {
    // ... (kode handleLogin tidak berubah)
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
        fetchContacts();
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

  // Fungsi Fetch Contacts (Tidak berubah)
  const fetchContacts = async () => {
    // ... (kode fetchContacts tidak berubah)
    try {
      const res = await fetch("http://localhost:3000/api/contacts", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setContacts(data.data);
      } else {
        console.error("No valid 'data' array found in response:", data);
        setError("Gagal mengambil data kontak.");
      }
    } catch (err) {
      console.error("Fetch contacts error:", err);
      setError("Gagal mengambil data kontak.");
    }
  };

  // Fungsi Logout (Tidak berubah)
  const handleLogout = () => {
    setSession(null);
    setContacts([]);
    setError(null);
  };

  // --- Tampilan Login ---
  // (Tidak berubah)
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
      
      {/* LANGKAH 3: Tombol Tambah Kontak */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Daftar Kontak
        </h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Tambah Kontak
        </button>
      </div>
      
      {error && (
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
              {/* LANGKAH 4: Kolom Aksi Baru */}
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  {loading ? "Memuat data..." : "Tidak ada data kontak."}
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-700">{c.id}</td>
                <td className="p-4 font-medium text-gray-900">{c.name}</td>
                <td className="p-4 text-gray-700">{c.email || "-"}</td>
                {/* LANGKAH 4: Tombol Aksi Baru */}
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

      {/* --- LANGKAH 5: Implementasi 4 Modal --- */}

      {/* 1. Modal Tambah Kontak (Create) */}
      <Modal isOpen={isCreateModalOpen} onClose={closeModals} title="Tambah Kontak Baru">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Nama</label>
            <input
              type="text"
              placeholder="Nama Lengkap"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Lihat Kontak (View) */}
      <Modal isOpen={isViewModalOpen} onClose={closeModals} title="Detail Kontak">
        {selectedContact && (
          <div className="space-y-3 text-gray-700">
            <div>
              <strong className="text-gray-900">ID:</strong> {selectedContact.id}
            </div>
            <div>
              <strong className="text-gray-900">Nama:</strong> {selectedContact.name}
            </div>
            <div>
              <strong className="text-gray-900">Email:</strong> {selectedContact.email || "-"}
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Modal Edit Kontak (Edit) */}
      <Modal isOpen={isEditModalOpen} onClose={closeModals} title="Edit Kontak">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Nama</label>
            <input
              type="text"
              placeholder="Nama Lengkap"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={selectedContact?.name || ""}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={selectedContact?.email || ""}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Hapus Kontak (Delete) */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeModals} title="Hapus Kontak">
        <p className="text-gray-700">
          Apakah Anda yakin ingin menghapus kontak 
          <strong className="text-gray-900"> {selectedContact?.name}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={closeModals}
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
          >
            Hapus
          </button>
        </div>
      </Modal>

    </Layout>
  );
}

export default App;

