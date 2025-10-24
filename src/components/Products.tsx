import React, { useState, useEffect, useMemo } from 'react';

// Interface for Product data
interface Product {
  id: number;
  name: string;
  default_code: string;
  barcode: string | false;
  list_price: number;
  standard_price: number;
  qty_available: number;
  virtual_available: number;
  uom: string;
  category: string;
  type: string;
  description: string | null;
  weight: number;
  volume: number;
  active: boolean;
}

// Component Props interface
interface ProductsProps {
  session: any; // You can make this more specific based on your session type
}

const Products: React.FC<ProductsProps> = ({ session }) => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered products with memoization
  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return products;
    
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.default_code.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        String(product.id).includes(query)
      );
    });
  }, [products, searchTerm]);

  // Fetch products
  const fetchProducts = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8069/api/products/", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch products");
      }

      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        console.error("No valid 'data' array found in response:", data);
        setError("Failed to fetch products data.");
      }
    } catch (err: any) {
      console.error("Fetch products error:", err);
      setError(err.message || "Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on component mount or session change
  useEffect(() => {
    fetchProducts();
  }, [session]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Product List
        </h1>
      </div>

      {/* Search input */}
      <div className="mb-4 flex items-center justify-between space-x-4">
        <div className="flex items-center w-full max-w-md">
          <input
            type="text"
            placeholder="Search by name, code, category or ID..."
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
          Showing {filteredProducts.length} of {products.length}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Products table */}
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Code</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Price</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Stock</th>
              <th className="p-4 text-sm font-semibold text-gray-600">UOM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Loading data...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-700">{product.id}</td>
                <td className="p-4 font-medium text-gray-900">{product.name}</td>
                <td className="p-4 text-gray-700">{product.default_code}</td>
                <td className="p-4 text-gray-700">{product.category}</td>
                <td className="p-4 text-gray-700">${product.list_price.toFixed(2)}</td>
                <td className="p-4 text-gray-700">{product.qty_available}</td>
                <td className="p-4 text-gray-700">{product.uom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;