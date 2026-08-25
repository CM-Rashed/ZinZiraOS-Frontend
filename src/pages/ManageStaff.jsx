import React, { useState, useEffect } from "react";
import { 
  UserPlus, Search, Edit3, Trash2, Shield, Phone, 
  DollarSign, RefreshCw, X, Camera, UserCheck, Key
} from "lucide-react";
import styles from "./ManageStaff.module.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/admin";

export default function ManageStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    staff_number: "",
    password: "",
    guardian_number: "",
    salary: "",
    age: "",
    type: "full_time",
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/staff`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch staff data");
      const data = await res.json();
      setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = (staff = null) => {
    setErrorMsg("");
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name || "",
        staff_number: staff.staff_number || "",
        password: "",
        guardian_number: staff.guardian_number || "",
        salary: staff.salary || "",
        age: staff.age || "",
        type: staff.type || "full_time",
        photo: null,
      });
      setPhotoPreview(staff.photo ? `${API_BASE_URL.replace('/api', '')}${staff.photo}` : null);
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        staff_number: "",
        password: "",
        guardian_number: "",
        salary: "",
        age: "",
        type: "full_time",
        photo: null,
      });
      setPhotoPreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("staff_number", formData.staff_number);
    data.append("guardian_number", formData.guardian_number);
    data.append("salary", formData.salary);
    data.append("age", formData.age);
    data.append("type", formData.type);

    if (formData.password) {
      data.append("password", formData.password);
    }

    if (formData.photo) {
      data.append("photo", formData.photo);
    }

    let url = `${API_BASE_URL}/staff`;
    if (editingStaff) {
      url = `${API_BASE_URL}/staff/${editingStaff.id}`;
      data.append("_method", "PUT");
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: data,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to process request");
      }

      fetchStaff();
      handleCloseModal();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/staff/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete operation failed");
      fetchStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredStaff = staffList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.staff_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.manageStaffContainer}>
      {/* Header */}
      <div className={styles.msHeader}>
        <div>
          <h1 className={styles.msTitle}>Staff Operations</h1>
          <p className={styles.msSubtitle}>
            Manage team assignments, compensation structures, and security privileges.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.msBtnPrimary}>
          <UserPlus size={16} />
          Add Staff Member
        </button>
      </div>

      {/* Control Panel */}
      <div className={styles.msControlPanel}>
        <div className={styles.msSearchWrapper}>
          <Search className={styles.msSearchIcon} />
          <input
            type="text"
            placeholder="Search by name or staff ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.msSearchInput}
          />
        </div>

        <div className={styles.msFilterGroup}>
          <button
            onClick={() => setFilterType("all")}
            className={`${styles.msFilterBtn} ${filterType === "all" ? styles.msFilterBtnActiveAll : ""}`}
          >
            All Staff
          </button>
          <button
            onClick={() => setFilterType("full_time")}
            className={`${styles.msFilterBtn} ${filterType === "full_time" ? styles.msFilterBtnActiveFull : ""}`}
          >
            Full-Time
          </button>
          <button
            onClick={() => setFilterType("part_time")}
            className={`${styles.msFilterBtn} ${filterType === "part_time" ? styles.msFilterBtnActivePart : ""}`}
          >
            Part-Time
          </button>
          <button onClick={fetchStaff} title="Refresh Data" className={styles.msIconBtn}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
          Syncing data...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "rgba(15,23,42,0.5)", borderRadius: "1rem" }}>
          No records match your filters.
        </div>
      ) : (
        <div className={styles.msGrid}>
          {filteredStaff.map((staff) => (
            <div key={staff.id} className={styles.msCard}>
              <div>
                <div className={styles.msCardHeader}>
                  <div className={styles.msAvatarWrapper}>
                    {staff.photo ? (
                      <img
                        src={`${API_BASE_URL.replace('/api', '')}${staff.photo}`}
                        alt={staff.name}
                        className={styles.msAvatarImg}
                      />
                    ) : (
                      <div className={styles.msAvatarPlaceholder}>
                        {staff.name.charAt(0)}
                      </div>
                    )}
                    <span
                      className={`${styles.msStatusIndicator} ${
                        staff.type === "full_time" ? styles.msStatusFull : styles.msStatusPart
                      }`}
                    />
                  </div>
                  <div className={styles.msCardActions}>
                    <button
                      onClick={() => handleOpenModal(staff)}
                      className={`${styles.msActionBtn} ${styles.msActionBtnEdit}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id)}
                      className={`${styles.msActionBtn} ${styles.msActionBtnDelete}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className={styles.msStaffName}>{staff.name}</h3>
                <div className={styles.msStaffId}>
                  <Key size={12} />
                  {staff.staff_number}
                </div>

                <div className={styles.msDetailsList}>
                  <div className={styles.msDetailRow}>
                    <span className={styles.msDetailLabel}>
                      <Shield size={14} /> Type
                    </span>
                    <span style={{ textTransform: "capitalize", color: "#e2e8f0" }}>
                      {staff.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className={styles.msDetailRow}>
                    <span className={styles.msDetailLabel}>
                      <DollarSign size={14} /> Salary
                    </span>
                    <span className={styles.msSalaryText}>
                      ${Number(staff.salary).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.msDetailRow}>
                    <span className={styles.msDetailLabel}>
                      <Phone size={14} /> Guardian
                    </span>
                    <span style={{ fontFamily: "monospace" }}>{staff.guardian_number}</span>
                  </div>
                </div>
              </div>

              <div className={styles.msCardFooter}>
                <span>Age: {staff.age} yrs</span>
                <span style={{ display: "flex", items: "center", gap: "0.25rem" }}>
                  <UserCheck size={12} style={{ color: "#10b981" }} /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.msModalOverlay}>
          <div className={styles.msModalContent}>
            <div className={styles.msModalHeader}>
              <h2 className={styles.msModalTitle}>
                {editingStaff ? "Edit Staff Details" : "Register New Staff Member"}
              </h2>
              <button onClick={handleCloseModal} className={styles.msActionBtn}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && <div className={styles.msErrorBox}>{errorMsg}</div>}

            <form onSubmit={handleSubmit} className={styles.msForm}>
              <div className={styles.msPhotoUploadSection}>
                <div className={styles.msPhotoPreviewBox}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Camera size={24} style={{ color: "#64748b" }} />
                  )}
                  <label className={styles.msUploadOverlay}>
                    Upload
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                  </label>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>Staff Photo</p>
                  <p style={{ fontSize: "0.6875rem", color: "#64748b" }}>JPG, PNG, WEBP up to 2MB (Optional)</p>
                </div>
              </div>

              <div className={styles.msFormGrid}>
                <div className={`${styles.msInputGroup} ${styles.msFullWidth}`}>
                  <label className={styles.msLabel}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={styles.msInput}
                  />
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Staff Number</label>
                  <input
                    type="text"
                    required
                    value={formData.staff_number}
                    onChange={(e) => setFormData({ ...formData, staff_number: e.target.value })}
                    className={styles.msInput}
                    style={{ fontFamily: "monospace" }}
                  />
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>
                    Password {editingStaff && "(Optional)"}
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={styles.msInput}
                  />
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Guardian Contact</label>
                  <input
                    type="text"
                    required
                    value={formData.guardian_number}
                    onChange={(e) => setFormData({ ...formData, guardian_number: e.target.value })}
                    className={styles.msInput}
                  />
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Salary ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className={styles.msInput}
                  />
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Age</label>
                  <input
                    type="number"
                    required
                    min="16"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className={styles.msInput}
                  />
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Contract Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={styles.msInput}
                  >
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                  </select>
                </div>
              </div>

              <div className={styles.msModalFooter}>
                <button type="button" onClick={handleCloseModal} className={styles.msBtnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={styles.msBtnPrimary}>
                  {submitting ? "Processing..." : editingStaff ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}