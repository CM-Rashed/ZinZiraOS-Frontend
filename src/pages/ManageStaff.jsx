import React, { useState, useEffect } from "react";
import { 
  UserPlus, Search, Edit3, Trash2, Shield, 
  DollarSign, RefreshCw, X, Camera, Key,
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, UserCheck, CheckSquare
} from "lucide-react";
import styles from "./ManageStaff.module.css";

const SERVER_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const API_BASE_URL = `${SERVER_BASE_URL}/api/admin/staff`;
const ATTENDANCE_API_URL = `${SERVER_BASE_URL}/api/admin/attendance`;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

export default function ManageStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Form Modal State (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    staff_number: "",
    password: "",
    salary: "",
    age: "",
    type: "full_time",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Detail Modal State (Profile & Attendance View)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // Attendance Date Range Filters for Detail View
  const [attendanceFilter, setAttendanceFilter] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Daily Quick Attendance Modal State
  const [isDailyAttendanceOpen, setIsDailyAttendanceOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyEntries, setDailyEntries] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  const getAuthHeaders = (isFormData = false) => {
    const token = localStorage.getItem("authToken");
    const headers = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch staff data");
      const result = await res.json();
      const list = Array.isArray(result) ? result : (result.data || []);
      setStaffList(list);
    } catch (err) {
      console.error("Fetch Staff Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchAttendance = async (staffId, filter, startDate = "", endDate = "") => {
    setLoadingAttendance(true);
    try {
      let queryParams = new URLSearchParams({ staff_id: staffId });
      
      if (filter === "custom") {
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);
      } else {
        queryParams.append("filter", filter);
      }

      const res = await fetch(`${ATTENDANCE_API_URL}?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch attendance history");
      const result = await res.json();
      setAttendanceData(result.data || []);
    } catch (err) {
      console.error("Attendance Fetch Error:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (isDetailModalOpen && selectedStaff && activeTab === "attendance") {
      fetchAttendance(selectedStaff.id, attendanceFilter, customStartDate, customEndDate);
    }
  }, [attendanceFilter, activeTab, isDetailModalOpen]);

  // Handle Opening Quick Daily Attendance Modal
  const handleOpenDailyAttendance = (e, focusStaff = null) => {
    if (e) e.stopPropagation();

    const initialEntries = {};
    staffList.forEach((st) => {
      initialEntries[st.id] = {
        staff_id: st.id,
        status: focusStaff && focusStaff.id === st.id ? "absent" : "present",
        check_in: "09:00",
        check_out: "17:00",
        notes: "",
      };
    });

    setDailyEntries(initialEntries);
    setIsDailyAttendanceOpen(true);
  };

  const handleStatusChange = (staffId, status) => {
    setDailyEntries((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        status: status,
      },
    }));
  };

  // Updated Save Attendance Logic with Safe ISO Date Formatting & Detailed Exception Handling
  const handleSaveDailyAttendance = async () => {
    setSavingAttendance(true);
    try {
      // Ensure date is explicitly formatted as YYYY-MM-DD
      const formattedDate = new Date(attendanceDate).toISOString().split("T")[0];

      const payload = {
        date: formattedDate,
        attendances: Object.values(dailyEntries),
      };

      const res = await fetch(`${ATTENDANCE_API_URL}/daily`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        // Display precise validation message returned by Laravel backend
        throw new Error(result.message || "Failed to post daily attendance");
      }

      alert("Daily attendance submitted successfully!");
      setIsDailyAttendanceOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleOpenDetailModal = (staff) => {
    setSelectedStaff(staff);
    setActiveTab("profile");
    setAttendanceFilter("this_month");
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedStaff(null);
    setAttendanceData([]);
  };

  const handleOpenFormModal = (e, staff = null) => {
    if (e) e.stopPropagation();
    setErrorMsg("");
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name || "",
        staff_number: staff.staff_number || "",
        password: "",
        salary: staff.salary || "",
        age: staff.age || "",
        type: staff.type || "full_time",
        image: null,
      });
      setImagePreview(staff.image ? getImageUrl(staff.image) : null);
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        staff_number: "",
        password: "",
        salary: "",
        age: "",
        type: "full_time",
        image: null,
      });
      setImagePreview(null);
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setIsFormModalOpen(false);
    setEditingStaff(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("staff_number", formData.staff_number);
    data.append("salary", formData.salary);
    data.append("age", formData.age);
    data.append("type", formData.type);

    if (formData.password) {
      data.append("password", formData.password);
    }

    if (formData.image) {
      data.append("image", formData.image);
    } else if (!editingStaff) {
      setErrorMsg("Image is required when creating a new staff member.");
      setSubmitting(false);
      return;
    }

    let url = API_BASE_URL;
    if (editingStaff) {
      url = `${API_BASE_URL}/${editingStaff.id}`;
      data.append("_method", "PUT");
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: data,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to process request");
      }

      fetchStaff();
      handleCloseFormModal();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
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
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.staff_number && item.staff_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      present: { label: "Present", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
      absent: { label: "Absent", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
      late: { label: "Late", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
      half_day: { label: "Half Day", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
      on_leave: { label: "On Leave", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    };
    const current = badges[status] || badges.present;
    return (
      <span style={{ color: current.color, backgroundColor: current.bg, padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600 }}>
        {current.label}
      </span>
    );
  };

  return (
    <div className={styles.manageStaffContainer}>
      {/* Header */}
      <div className={styles.msHeader}>
        <div>
          <h1 className={styles.msTitle}>Staff Operations</h1>
          <p className={styles.msSubtitle}>
            Manage team assignments, compensation structures, and track daily attendance.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={(e) => handleOpenDailyAttendance(e)} className={styles.msBtnSecondary} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckSquare size={16} /> Bulk Mark Attendance
          </button>
          <button onClick={(e) => handleOpenFormModal(e)} className={styles.msBtnPrimary}>
            <UserPlus size={16} /> Add Staff Member
          </button>
        </div>
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

      {/* Staff Grid */}
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
            <div 
              key={staff.id} 
              className={styles.msCard} 
              onClick={() => handleOpenDetailModal(staff)}
              style={{ cursor: "pointer" }}
            >
              <div>
                <div className={styles.msCardHeader}>
                  <div className={styles.msAvatarWrapper}>
                    {staff.image ? (
                      <img
                        src={getImageUrl(staff.image)}
                        alt={staff.name}
                        className={styles.msAvatarImg}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className={styles.msAvatarPlaceholder}>
                        {staff.name?.charAt(0) || "U"}
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
                      onClick={(e) => handleOpenFormModal(e, staff)}
                      className={`${styles.msActionBtn} ${styles.msActionBtnEdit}`}
                      title="Edit Staff"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, staff.id)}
                      className={`${styles.msActionBtn} ${styles.msActionBtnDelete}`}
                      title="Delete Staff"
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
                      <Shield size={14} /> Contract
                    </span>
                    <span style={{ textTransform: "capitalize", color: "#e2e8f0" }}>
                      {(staff.type || "full_time").replace("_", " ")}
                    </span>
                  </div>
                  <div className={styles.msDetailRow}>
                    <span className={styles.msDetailLabel}>
                      <DollarSign size={14} /> Salary
                    </span>
                    <span className={styles.msSalaryText}>
                      ${Number(staff.salary || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Attendance Trigger Button */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={(e) => handleOpenDailyAttendance(e, staff)}
                  style={{
                    flex: 1,
                    padding: "0.4rem 0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #334155",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#f87171",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                  }}
                  title="Mark today's attendance"
                >
                  <XCircle size={14} /> Mark Attendance
                </button>
              </div>

              <div className={styles.msCardFooter} style={{ marginTop: "0.75rem" }}>
                <span>Age: {staff.age || "N/A"} yrs</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#38bdf8" }}>
                  <Calendar size={12} /> View Logs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Attendance Modal Drawer */}
      {isDailyAttendanceOpen && (
        <div className={styles.msModalOverlay}>
          <div className={styles.msModalContent} style={{ maxWidth: "650px" }}>
            <div className={styles.msModalHeader}>
              <div>
                <h2 className={styles.msModalTitle}>Take Today's Attendance</h2>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                  Quickly record absence, presence, or leave status for staff.
                </p>
              </div>
              <button onClick={() => setIsDailyAttendanceOpen(false)} className={styles.msActionBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className={styles.msLabel}>Attendance Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className={styles.msInput}
                style={{ width: "200px" }}
              />
            </div>

            <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {staffList.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    background: "rgba(30, 41, 59, 0.6)",
                    borderRadius: "0.5rem",
                    border: "1px solid #334155",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {st.image ? (
                      <img src={getImageUrl(st.image)} alt={st.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className={styles.msAvatarPlaceholder} style={{ width: "36px", height: "36px" }}>{st.name?.charAt(0)}</div>
                    )}
                    <div>
                      <p style={{ fontWeight: 600, color: "#f8fafc", margin: 0, fontSize: "0.875rem" }}>{st.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>ID: {st.staff_number}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {["present", "absent", "late", "half_day", "on_leave"].map((stType) => (
                      <button
                        key={stType}
                        type="button"
                        onClick={() => handleStatusChange(st.id, stType)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          textTransform: "capitalize",
                          background: dailyEntries[st.id]?.status === stType ? (stType === "absent" ? "#ef4444" : "#10b981") : "#334155",
                          color: "#ffffff",
                        }}
                      >
                        {stType.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.msModalFooter}>
              <button type="button" onClick={() => setIsDailyAttendanceOpen(false)} className={styles.msBtnCancel}>
                Cancel
              </button>
              <button onClick={handleSaveDailyAttendance} disabled={savingAttendance} className={styles.msBtnPrimary}>
                {savingAttendance ? "Submitting..." : "Save Attendance Logs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile & Attendance Popup Modal */}
      {isDetailModalOpen && selectedStaff && (
        <div className={styles.msModalOverlay}>
          <div className={styles.msModalContent} style={{ maxWidth: "700px" }}>
            <div className={styles.msModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {selectedStaff.image ? (
                  <img
                    src={getImageUrl(selectedStaff.image)}
                    alt={selectedStaff.name}
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div className={styles.msAvatarPlaceholder} style={{ width: "48px", height: "48px" }}>
                    {selectedStaff.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className={styles.msModalTitle}>{selectedStaff.name}</h2>
                  <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>ID: {selectedStaff.staff_number}</p>
                </div>
              </div>
              <button onClick={handleCloseDetailModal} className={styles.msActionBtn}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #334155", marginBottom: "1.5rem" }}>
              <button
                onClick={() => setActiveTab("profile")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderBottom: activeTab === "profile" ? "2px solid #38bdf8" : "none",
                  color: activeTab === "profile" ? "#38bdf8" : "#94a3b8",
                  background: "none",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Profile Details
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderBottom: activeTab === "attendance" ? "2px solid #38bdf8" : "none",
                  color: activeTab === "attendance" ? "#38bdf8" : "#94a3b8",
                  background: "none",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Calendar size={16} /> Attendance Tracker
              </button>
            </div>

            {activeTab === "profile" && (
              <div className={styles.msFormGrid} style={{ padding: "0.5rem" }}>
                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Staff Number</label>
                  <p style={{ color: "#f8fafc", fontFamily: "monospace", fontSize: "1rem" }}>{selectedStaff.staff_number}</p>
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Contract Type</label>
                  <p style={{ color: "#f8fafc", textTransform: "capitalize" }}>{selectedStaff.type?.replace("_", " ")}</p>
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Monthly Salary</label>
                  <p style={{ color: "#10b981", fontWeight: 600, fontSize: "1.1rem" }}>${Number(selectedStaff.salary || 0).toLocaleString()}</p>
                </div>

                <div className={styles.msInputGroup}>
                  <label className={styles.msLabel}>Age</label>
                  <p style={{ color: "#f8fafc" }}>{selectedStaff.age} Years Old</p>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={() => setAttendanceFilter("this_month")}
                    className={`${styles.msFilterBtn} ${attendanceFilter === "this_month" ? styles.msFilterBtnActiveAll : ""}`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setAttendanceFilter("last_month")}
                    className={`${styles.msFilterBtn} ${attendanceFilter === "last_month" ? styles.msFilterBtnActiveFull : ""}`}
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setAttendanceFilter("custom")}
                    className={`${styles.msFilterBtn} ${attendanceFilter === "custom" ? styles.msFilterBtnActivePart : ""}`}
                  >
                    Custom Range
                  </button>

                  {attendanceFilter === "custom" && (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem", width: "100%" }}>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={styles.msInput}
                        style={{ padding: "0.25rem 0.5rem" }}
                      />
                      <span style={{ color: "#94a3b8" }}>to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={styles.msInput}
                        style={{ padding: "0.25rem 0.5rem" }}
                      />
                      <button
                        onClick={() => fetchAttendance(selectedStaff.id, "custom", customStartDate, customEndDate)}
                        className={styles.msBtnPrimary}
                        style={{ padding: "0.35rem 0.75rem" }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {loadingAttendance ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>Loading logs...</div>
                ) : attendanceData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", background: "rgba(15,23,42,0.4)", borderRadius: "0.5rem" }}>
                    No attendance records found for this period.
                  </div>
                ) : (
                  <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {attendanceData.map((record) => (
                      <div
                        key={record.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.75rem 1rem",
                          background: "rgba(30, 41, 59, 0.6)",
                          borderRadius: "0.5rem",
                          border: "1px solid #334155",
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 600, color: "#f8fafc", margin: 0 }}>{record.date}</p>
                          {(record.check_in || record.check_out) && (
                            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>
                              <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                              {record.check_in || "--:--"} - {record.check_out || "--:--"}
                            </p>
                          )}
                        </div>
                        <div>{getStatusBadge(record.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isFormModalOpen && (
        <div className={styles.msModalOverlay}>
          <div className={styles.msModalContent}>
            <div className={styles.msModalHeader}>
              <h2 className={styles.msModalTitle}>
                {editingStaff ? "Edit Staff Details" : "Register New Staff Member"}
              </h2>
              <button onClick={handleCloseFormModal} className={styles.msActionBtn}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && <div className={styles.msErrorBox}>{errorMsg}</div>}

            <form onSubmit={handleSubmit} className={styles.msForm}>
              <div className={styles.msPhotoUploadSection}>
                <div className={styles.msPhotoPreviewBox}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Camera size={24} style={{ color: "#64748b" }} />
                  )}
                  <label className={styles.msUploadOverlay}>
                    Upload
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>Staff Photo</p>
                  <p style={{ fontSize: "0.6875rem", color: "#64748b" }}>JPG, PNG, WEBP up to 2MB {!editingStaff && "(Required)"}</p>
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
                <button type="button" onClick={handleCloseFormModal} className={styles.msBtnCancel}>
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