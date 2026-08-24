import React, { useState, useEffect } from "react";
import "./AddProduct.css";

const PRODUCTS_API_URL = "http://127.0.0.1:8000/api/admin/products";
const CATEGORIES_API_URL = "http://127.0.0.1:8000/api/admin/categories";

// Helper function to extract Auth Headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export default function AddProduct() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    sku: "",
    quantity: 0,
    buying_price: "",
    selling_price: "",
    location: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [resProducts, resCategories] = await Promise.all([
        fetch(PRODUCTS_API_URL, { headers }),
        fetch(CATEGORIES_API_URL, { headers }),
      ]);

      if (resProducts.ok) setProducts(await resProducts.json());
      if (resCategories.ok) setCategories(await resCategories.json());
    } catch (error) {
      console.error("Failed to load inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        category_id: product.category_id || "",
        name: product.name,
        sku: product.sku || "",
        quantity: product.quantity,
        buying_price: product.buying_price,
        selling_price: product.selling_price,
        location: product.location,
        notes: product.notes || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        category_id: categories.length > 0 ? categories[0].id : "",
        name: "",
        sku: "",
        quantity: 0,
        buying_price: "",
        selling_price: "",
        location: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingProduct);
    const url = isEdit ? `${PRODUCTS_API_URL}/${editingProduct.id}` : PRODUCTS_API_URL;
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      quantity: Number(formData.quantity),
      buying_price: Number(formData.buying_price),
      selling_price: Number(formData.selling_price),
      sku: formData.sku.trim() === "" ? null : formData.sku,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        handleCloseModal();
        fetchData();
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.message || "Failed to save product"}`);
      }
    } catch (error) {
      console.error("Product submit error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this product?")) return;

    try {
      const response = await fetch(`${PRODUCTS_API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Delete product error:", error);
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.location && prod.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      String(prod.category_id) === String(selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="product-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="header-title">Product Catalog & Add Products</h2>
          <p className="header-subtitle">
            Manage stock levels, location details, and margin figures
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          ➕ Add New Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar-container">
        <div className="filters-group">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="input-field has-icon"
              placeholder="Search by name, SKU, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="select-field"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="total-badge">
          Total Items: <strong>{filteredProducts.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : categories.length === 0 && filteredProducts.length === 0 ? (
          <div className="empty-state">No products found in inventory.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Buying Price</th>
                  <th>Selling Price</th>
                  <th>Location</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const margin = (prod.selling_price - prod.buying_price).toFixed(2);
                  return (
                    <tr key={prod.id}>
                      <td>
                        <div className="prod-name">{prod.name}</div>
                        <div className="prod-sku">SKU: {prod.sku || "N/A"}</div>
                      </td>
                      <td>
                        <span className="badge-category">
                          {prod.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${
                            prod.quantity > 10
                              ? "stock-high"
                              : prod.quantity > 0
                              ? "stock-medium"
                              : "stock-low"
                          }`}
                        >
                          {prod.quantity} Units
                        </span>
                      </td>
                      <td className="price-mono">
                        ${Number(prod.buying_price).toFixed(2)}
                      </td>
                      <td>
                        <div className="price-bold">
                          ${Number(prod.selling_price).toFixed(2)}
                        </div>
                        <div className="margin-sub">+${margin} margin</div>
                      </td>
                      <td>📍 {prod.location}</td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleOpenModal(prod)}
                            className="btn-icon edit"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="btn-icon delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={handleCloseModal} className="btn-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group span-full">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Nike Air Max 270"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    required
                    className="select-field"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>SKU / Barcode</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. NKE-AM270-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input-field"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Shelf A3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Buying Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input-field"
                    placeholder="0.00"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input-field"
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>

                <div className="form-group span-full">
                  <label>Notes</label>
                  <textarea
                    rows="3"
                    className="textarea-field"
                    placeholder="Internal details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}