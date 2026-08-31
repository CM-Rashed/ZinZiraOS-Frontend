import React, { useState, useEffect } from "react";
import styles from "./ManageCategory.module.css";
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = `${SERVER_BASE_URL}/api/admin/categories`;

// Helper function to extract Auth Headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export default function ManageCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        is_active: Boolean(category.is_active),
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingCategory);
    const url = isEdit ? `${API_BASE_URL}/${editingCategory.id}` : API_BASE_URL;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        handleCloseModal();
        fetchCategories();
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.message || "Failed to save category"}`);
      }
    } catch (error) {
      console.error("Form submit error:", error);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const updatedStatus = !category.is_active;
      const response = await fetch(`${API_BASE_URL}/${category.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: updatedStatus }),
      });

      if (response.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === category.id ? { ...c, is_active: updatedStatus } : c
          )
        );
      }
    } catch (error) {
      console.error("Status toggle error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description &&
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={styles.categoryContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.headerTitle}>Manage Categories</h2>
          <p className={styles.headerSubtitle}>
            Organize and structure your shop product catalog hierarchy
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
          ➕ Add New Category
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarContainer}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={`${styles.inputField} ${styles.hasIcon}`}
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.totalBadge}>
          Total Categories: <strong>{categories.length}</strong>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className={styles.emptyState}>No categories found.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td className={styles.idCell}>#{cat.id}</td>
                    <td className={styles.categoryName}>{cat.name}</td>
                    <td>
                      <code className={styles.slugBadge}>{cat.slug}</code>
                    </td>
                    <td className={styles.descCell}>{cat.description || "—"}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`${styles.statusBadge} ${
                          cat.is_active ? styles.statusActive : styles.statusInactive
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={styles.statusDot}></span>
                        {cat.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className={styles.textRight}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className={`${styles.btnIcon} ${styles.edit}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className={`${styles.btnIcon} ${styles.delete}`}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
              <button onClick={handleCloseModal} className={styles.btnClose}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g. Mens Footwear"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows="3"
                  className={styles.textareaField}
                  placeholder="Optional details regarding this category..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Active Category (visible in shop)
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}