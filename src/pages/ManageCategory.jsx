import React, { useState, useEffect } from "react";
import "./ManageCategory.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/admin/categories";

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
    <div className="category-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="header-title">Manage Categories</h2>
          <p className="header-subtitle">
            Organize and structure your shop product catalog hierarchy
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          ➕ Add New Category
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input-field has-icon"
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="total-badge">
          Total Categories: <strong>{categories.length}</strong>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">No categories found.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="id-cell">#{cat.id}</td>
                    <td className="category-name">{cat.name}</td>
                    <td>
                      <code className="slug-badge">{cat.slug}</code>
                    </td>
                    <td className="desc-cell">{cat.description || "—"}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`status-badge ${
                          cat.is_active ? "status-active" : "status-inactive"
                        }`}
                        title="Click to toggle status"
                      >
                        <span className="status-dot"></span>
                        {cat.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className="btn-icon edit"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="btn-icon delete"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
              <button onClick={handleCloseModal} className="btn-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Mens Footwear"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  className="textarea-field"
                  placeholder="Optional details regarding this category..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Active Category (visible in shop)
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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