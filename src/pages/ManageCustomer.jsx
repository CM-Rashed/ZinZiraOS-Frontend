import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import styles from "./ManageCustomer.module.css";

const SERVER_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const API_BASE_URL = `${SERVER_BASE_URL}/api/admin/customers`;

export default function ManageCustomer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    due: "0.00",
  });

  // Dynamic Auth Headers based on localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  // Helper to read admin data when needed
  const getAdminData = () => {
    try {
      const stored = localStorage.getItem("adminData");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Fetch Customers (GET /api/admin/customers)
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      
      if (response.ok && (result.success || Array.isArray(result) || Array.isArray(result.data))) {
        const customerList = Array.isArray(result) ? result : (result.data || []);
        setCustomers(customerList);
      } else {
        showToast(result.message || "Failed to fetch customers.", "error");
      }
    } catch (error) {
      console.error("Fetch Customers Error:", error);
      showToast("Network error while fetching customers.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Toast Handler
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Open Modal (Create or Edit)
  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        due: customer.due || "0.00",
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", address: "", due: "0.00" });
    }
    setIsModalOpen(true);
  };

  // Form Submit (POST / PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingCustomer
      ? `${API_BASE_URL}/${editingCustomer.id}`
      : API_BASE_URL;
    const method = editingCustomer ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.status === "success" || result.id)) {
        showToast(result.message || "Customer saved successfully.");
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        showToast(result.message || "Validation failed or bad request.", "error");
      }
    } catch (error) {
      console.error("Customer Submit Error:", error);
      showToast("Operation failed. Try again.", "error");
    }
  };

  // Delete Customer (DELETE)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (response.ok && (result.success || result.status === "success")) {
        showToast(result.message || "Customer deleted.");
        setCustomers((prev) => prev.filter((item) => item.id !== id));
      } else {
        showToast(result.message || "Failed to delete customer.", "error");
      }
    } catch (error) {
      console.error("Delete Customer Error:", error);
      showToast("Failed to delete customer.", "error");
    }
  };

  // Filtered List
  const filteredCustomers = customers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  // Total Dues Calculation
  const totalDues = customers.reduce(
    (acc, c) => acc + parseFloat(c.due || 0),
    0
  );

  return (
    <div className={styles.customerContainer}>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`${styles.toastNotification} ${
            notification.type === "error" ? styles.error : styles.success
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.headerTitle}>Customer Management</h2>
          <p className={styles.headerSubtitle}>
            Track customer balances, contact details, and credit profiles.
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Total Customers</span>
            <div className={`${styles.metricIcon} ${styles.purple}`}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.metricBody}>
            <span className={styles.metricValue}>{customers.length}</span>
            <span className={`${styles.metricBadge} ${styles.neutral}`}>
              Active Profiles
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Total Receivables</span>
            <div className={`${styles.metricIcon} ${styles.teal}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.metricBody}>
            <span className={styles.metricValue}>
              ${totalDues.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`${styles.metricBadge} ${
                totalDues > 0 ? styles.negative : styles.positive
              }`}
            >
              {totalDues > 0 ? "Outstanding Dues" : "All Clear"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.toolbarContainer}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${styles.inputField} ${styles.hasIcon}`}
          />
        </div>
        <button
          className={styles.btnRefresh}
          onClick={fetchCustomers}
          title="Refresh List"
        >
          <RefreshCw size={16} className={loading ? styles.spin : ""} />
        </button>
      </div>

      {/* Data Table Card */}
      <div className={styles.tableCard}>
        <h3 className={styles.cardTitle}>Customer Registry</h3>
        {loading ? (
          <div className={styles.loadingState}>Loading customer records...</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Notes</th>
                  <th>Outstanding Due</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className={styles.customerName}>{customer.name}</td>
                      <td>
                        {customer.phone ? (
                          <span className={styles.inlineIconText}>
                            <Phone size={14} /> {customer.phone}
                          </span>
                        ) : (
                          <span className={styles.textMuted}>—</span>
                        )}
                      </td>
                      <td>
                        {customer.address ? (
                          <span className={styles.inlineIconText}>
                            <MapPin size={14} /> {customer.address}
                          </span>
                        ) : (
                          <span className={styles.textMuted}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusPill} ${
                            parseFloat(customer.due || 0) > 0
                              ? styles.negative
                              : styles.completed
                          }`}
                        >
                          ${parseFloat(customer.due || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className={styles.textRight}>
                        <div className={styles.actionButtons}>
                          <button
                            className={`${styles.btnIcon} ${styles.edit}`}
                            onClick={() => handleOpenModal(customer)}
                            title="Edit Customer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className={`${styles.btnIcon} ${styles.delete}`}
                            onClick={() => handleDelete(customer.id)}
                            title="Delete Customer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.emptyState}>
                      No customers found.
                    </td>
                  </tr>
                )}
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
              <h3>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h3>
              <button
                className={styles.btnClose}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={styles.inputField}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0192"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={styles.inputField}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  placeholder="Additional notes about the customer..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={styles.textareaField}
                  rows="3"
                ></textarea>
              </div>

              <div className={styles.formGroup}>
                <label>Due Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.due}
                  onChange={(e) =>
                    setFormData({ ...formData, due: e.target.value })
                  }
                  className={styles.inputField}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}