import React, { useEffect, useState, type JSX } from "react";

type Product = {
  id: number;
  name: string;
  image_url?: string | null;
  default_code?: string | null;
  barcode?: string | boolean | null;
  list_price?: number;
  standard_price?: number;
  qty_available?: number;
  virtual_available?: number;
  uom?: string | null;
  category?: string | null;
  type?: string | null;
  description?: string | null;
  weight?: number;
  volume?: number;
  active?: boolean;
  company?: string | null;
};

type Company = {
  id: number;
  name: string;
};

export default function Tes(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("http://localhost:3000/api/companies", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const data = await res.json();

        const items: Company[] = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.data)
          ? data.data
          : [];

        setCompanies(items);
      } catch (e: any) {
        console.error(e);
      }
    }
    loadCompanies();
  }, []);

  // Fetch Products (filtered by selected company)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = selectedCompany
          ? `http://localhost:3000/api/products?company=${encodeURIComponent(selectedCompany)}`
          : "http://localhost:3000/api/products";

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const data = await res.json();

        const items: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.data)
          ? data.data
          : [];

        if (mounted) setProducts(items);
      } catch (e: any) {
        if (mounted) setError(e.message || "Error fetching products");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedCompany]);

  const containerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
    padding: 16,
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #e1e4e8",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: 140,
    objectFit: "cover",
    borderRadius: 6,
    marginBottom: 8,
    background: "#f6f6f6",
  };

  const metaStyle: React.CSSProperties = { color: "#555", fontSize: 13, marginTop: 6 };

  return (
    <div style={{ padding: 16 }}>
      {/* Dropdown filter */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Filter by Company:</label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          style={{
            border: "1px solid #ccc",
            padding: "6px 10px",
            borderRadius: 6,
            minWidth: 200,
          }}
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading products...</div>
      ) : error ? (
        <div style={{ color: "red" }}>Error: {error}</div>
      ) : products.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <div style={containerStyle}>
          {products.map((p) => (
            <div key={p.id} style={cardStyle}>
              {p.image_url ? (
                (() => {
                  try {
                    const u = new URL(p.image_url);
                    const proxied = `http://localhost:3000/api${u.pathname}${u.search}`;
                    return (
                      <img
                        src={proxied}
                        alt={p.name ?? "product image"}
                        style={imgStyle}
                      />
                    );
                  } catch {
                    return (
                      <img
                        src={p.image_url as string}
                        alt={p.name ?? "product image"}
                        style={imgStyle}
                      />
                    );
                  }
                })()
              ) : null}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16 }}>{p.name ?? "—"}</h3>
                <span style={{ fontSize: 12, color: "#666" }}>
                  {p.default_code ?? ""}
                </span>
              </div>

              <div style={metaStyle}>
                <div>
                  Price: <strong>{p.list_price ?? "—"}</strong> (cost:{" "}
                  {p.standard_price ?? "—"})
                </div>
                <div>
                  Stock: {p.qty_available ?? 0} available, virtual:{" "}
                  {p.virtual_available ?? 0}
                </div>
                <div>
                  UoM: {p.uom ?? "—"} · Category: {p.category ?? "—"} · Type:{" "}
                  {p.type ?? "—"}
                </div>
                {p.company && (
                  <div style={{ marginTop: 4 }}>Company: {p.company}</div>
                )}
                {p.description ? (
                  <div style={{ marginTop: 8 }}>{p.description}</div>
                ) : null}
                <div style={{ marginTop: 8 }}>
                  Weight: {p.weight ?? "—"} · Volume: {p.volume ?? "—"} · Active:{" "}
                  {p.active ? "Yes" : "No"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
