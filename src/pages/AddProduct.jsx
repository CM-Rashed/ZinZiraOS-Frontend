import React, { useState, useEffect } from "react";
import styles from "./AddProduct.module.css";

const PRODUCTS_API_URL = "http://127.0.0.1:8000/api/admin/products";
const CATEGORIES_API_URL = "http://127.0.0.1:8000/api/admin/categories";

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
    <div className={styles.productContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.headerTitle}>Product Catalog & Add Products</h2>
          <p className={styles.headerSubtitle}>
            Manage stock levels, location details, and margin figures
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
          ➕ Add New Product
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarContainer}>
        <div className={styles.filtersGroup}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={`${styles.inputField} ${styles.hasIcon}`}
              placeholder="Search by name, SKU, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.selectField}
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

        <div className={styles.totalBadge}>
          Total Items: <strong>{filteredProducts.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Loading products...</div>
        ) : categories.length === 0 && filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>No products found in inventory.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Buying Price</th>
                  <th>Selling Price</th>
                  <th>Location</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const margin = (prod.selling_price - prod.buying_price).toFixed(2);
                  return (
                    <tr key={prod.id}>
                      <td>
                        <div className={styles.prodName}>{prod.name}</div>
                        <div className={styles.prodSku}>SKU: {prod.sku || "N/A"}</div>
                      </td>
                      <td>
                        <span className={styles.badgeCategory}>
                          {prod.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.stockBadge} ${
                            prod.quantity > 10
                              ? styles.stockHigh
                              : prod.quantity > 0
                              ? styles.stockMedium
                              : styles.stockLow
                          }`}
                        >
                          {prod.quantity} Units
                        </span>
                      </td>
                      <td className={styles.priceMono}>
                        ${Number(prod.buying_price).toFixed(2)}
                      </td>
                      <td>
                        <div className={styles.priceBold}>
                          ${Number(prod.selling_price).toFixed(2)}
                        </div>
                        <div className={styles.marginSub}>+${margin} margin</div>
                      </td>
                      <td>📍 {prod.location}</td>
                      <td className={styles.textRight}>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleOpenModal(prod)}
                            className={`${styles.btnIcon} ${styles.edit}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className={`${styles.btnIcon} ${styles.delete}`}
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={handleCloseModal} className={styles.btnClose}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.spanFull}`}>
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g. Nike Air Max 270"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    required
                    className={styles.selectField}
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

                <div className={styles.formGroup}>
                  <label>SKU / Barcode</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. NKE-AM270-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className={styles.inputField}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Location *</label>
                  <input
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g. Shelf A3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Buying Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={styles.inputField}
                    placeholder="0.00"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={styles.inputField}
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.spanFull}`}>
                  <label>Notes</label>
                  <textarea
                    rows="3"
                    className={styles.textareaField}
                    placeholder="Internal details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={handleCloseModal} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
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