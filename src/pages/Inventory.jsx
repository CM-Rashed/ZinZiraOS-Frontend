import React, { useState, useEffect } from "react";
import { Search, PlusCircle, Package, AlertCircle, X, Check, Loader2 } from "lucide-react";
import styles from "./Inventory.module.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/admin";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    previous_stock: 0,
    new_stock: 0,
    total_stock: 0,
    notes: "",
  });

  // Extract auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Real-time Search Filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name?.toLowerCase().includes(term) ||
            p.sku?.toLowerCase().includes(term) ||
            p.category?.name?.toLowerCase().includes(term) ||
            p.id.toString().includes(term)
        )
      );
    }
  }, [searchTerm, products]);

  // Compute dynamic total stock whenever previous or new stock changes
  useEffect(() => {
    const prev = parseInt(formData.previous_stock, 10) || 0;
    const added = parseInt(formData.new_stock, 10) || 0;
    setFormData((prevData) => ({
      ...prevData,
      total_stock: prev + added,
    }));
  }, [formData.previous_stock, formData.new_stock]);

  // Fetch product array matching your backend structure
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/products`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch product list.");
      
      const data = await res.json();
      const productList = Array.isArray(data) ? data : data.data || [];
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open modal and prepopulate stock directly from the product object
  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      previous_stock: product.quantity ?? 0,
      new_stock: 0,
      total_stock: product.quantity ?? 0,
      notes: product.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormData({ previous_stock: 0, new_stock: 0, total_stock: 0, notes: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitInventory = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const addedQty = parseInt(formData.new_stock, 10) || 0;
    if (addedQty <= 0) {
      alert("Please enter a valid incoming stock quantity greater than 0.");
      return;
    }

    setSubmitting(true);

    // Payload mapped to match original Laravel Controller validation rules
    const payload = {
      product_id: selectedProduct.id,
      added_quantity: addedQty,
      notes: formData.notes,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/inventories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update inventory.");
      }

      const responseData = await res.json();

      // Update product list locally for immediate feedback
      if (responseData.product) {
        setProducts((prev) =>
          prev.map((item) => (item.id === selectedProduct.id ? responseData.product : item))
        );
      } else {
        fetchProducts();
      }

      handleCloseModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* Header & Filter Controls */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <Package className={styles.titleIcon} /> Inventory Management
            </h1>
            <p className={styles.subtitle}>
              Track product stock, log additions, and update notes seamlessly.
            </p>
          </div>

          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Product List Table */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.stateContainer}>
              <Loader2 className={styles.spinner} />
              <span>Fetching catalog...</span>
            </div>
          ) : error ? (
            <div className={`${styles.stateContainer} ${styles.errorState}`}>
              <AlertCircle style={{ width: 20, height: 20 }} /> {error}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Current Stock</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.stateContainer}>
                        No products found matching your search term.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id}>
                        <td className={styles.productId}>#{prod.id}</td>
                        <td>
                          <div className={styles.productName}>{prod.name}</div>
                          <div className={styles.productSku}>SKU: {prod.sku || "N/A"}</div>
                        </td>
                        <td>
                          <span className={styles.productSku}>
                            {prod.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ${parseFloat(prod.selling_price || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={styles.stockBadge}>
                            {prod.quantity ?? 0} units
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleOpenModal(prod)}
                            className={styles.btnPrimary}
                          >
                            <PlusCircle style={{ width: 16, height: 16 }} /> Add Inventory
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Inventory Modal */}
      {isModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Adjust Inventory</h3>
                <p className={styles.modalSub}>{selectedProduct.name}</p>
              </div>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleSubmitInventory} className={styles.form}>
              <div className={styles.gridRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Previous Stock</label>
                  <input
                    type="number"
                    name="previous_stock"
                    value={formData.previous_stock}
                    readOnly
                    className={`${styles.input} ${styles.readOnlyInput}`}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>New Incoming Stock</label>
                  <input
                    type="number"
                    name="new_stock"
                    value={formData.new_stock}
                    onChange={handleInputChange}
                    min="1"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Calculated Total Stock</label>
                <input
                  type="number"
                  name="total_stock"
                  value={formData.total_stock}
                  readOnly
                  className={`${styles.input} ${styles.readOnlyInput}`}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Inventory Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add batch notes or receipt numbers..."
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.btnPrimary}
                >
                  {submitting ? (
                    <Loader2 className={styles.spinner} style={{ width: 16, height: 16, margin: 0 }} />
                  ) : (
                    <Check style={{ width: 16, height: 16 }} />
                  )}
                  Save Inventory Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}