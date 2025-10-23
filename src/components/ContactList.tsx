// src/components/ProductList.js
import React, { useEffect, useState } from 'react';
interface Product {
  id: number;
  name: string;
  list_price: number;
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetch('http://localhost:8069/api/contacts')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Failed to fetch products:', err));
  }, []);
  return (
    <div>
      <h2>Odoo Products</h2>
      <ul>
        {products.map((prod) => (
          <li key={prod.id}>
            {prod.name} - ${prod.list_price}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default ProductList;
