import React, { useState, useEffect } from "react";
import styles from "./AddProduct.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const SERVER_BASE_URL = API_BASE_URL;
const PRODUCTS_API_URL = `${API_BASE_URL}/api/admin/products`;
const CATEGORIES_API_URL = `${API_BASE_URL}/api/admin/categories`;

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("authToken");
  const headers = {
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

// URL builder that prevents duplicate/missing slashes
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  const cleanBase = (SERVER_BASE_URL || "").replace(/\/+$/, "");
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${cleanBase}${cleanPath}`;
};

// Helper function to safely parse images array/string
const parseProductImages = (imagesData) => {
  if (!imagesData) return [];
  if (Array.isArray(imagesData)) return imagesData;
  if (typeof imagesData === "string") {
    try {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? parsed : [imagesData];
    } catch {
      return [imagesData];
    }
  }
  return [];
};

export default function AddProduct() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
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

  // Image Upload State
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleOpenModal = (product = null) => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);

    if (product) {
      setEditingProduct(product);
      setFormData({
        category_id: product.category_id || "",
        name: product.name || "",
        sku: product.sku || "",
        quantity: product.quantity || 0,
        buying_price: product.buying_price || "",
        selling_price: product.selling_price || "",
        location: product.location || "",
        notes: product.notes || "",
      });
      
      setExistingImages(parseProductImages(product.images));
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
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    const currentTotal = existingImages.length + imageFiles.length;
    const availableSlots = 3 - currentTotal;

    if (availableSlots <= 0) {
      alert("You can only upload a maximum of 3 images.");
      e.target.value = "";
      return;
    }

    const validFiles = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      alert(`Only ${availableSlots} more image(s) could be added. Maximum is 3.`);
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setImageFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

    e.target.value = "";
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingProduct);

    const totalImages = existingImages.length + imageFiles.length;
    if (totalImages < 1) {
      alert("Please upload at least 1 image for the product.");
      return;
    }
    if (totalImages > 3) {
      alert("You can upload a maximum of 3 images.");
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append("category_id", formData.category_id);
    data.append("name", formData.name);
    if (formData.sku?.trim()) data.append("sku", formData.sku.trim());
    data.append("quantity", formData.quantity);
    data.append("buying_price", formData.buying_price);
    data.append("selling_price", formData.selling_price);
    data.append("location", formData.location);
    if (formData.notes) data.append("notes", formData.notes);

    existingImages.forEach((img, index) => {
      data.append(`existing_images[${index}]`, img);
    });

    imageFiles.forEach((file, index) => {
      data.append(`images[${index}]`, file);
    });

    let url = PRODUCTS_API_URL;

    if (isEdit) {
      url = `${PRODUCTS_API_URL}/${editingProduct.id}`;
      data.append("_method", "PUT");
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: data,
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
    } finally {
      setSubmitting(false);
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
      prod.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.location && prod.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      String(prod.category_id) === String(selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.productContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.headerTitle}>Product Catalog</h2>
          <p className={styles.headerSubtitle}>
            Manage stock levels, location details, margins, and media assets
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
          <span className={styles.btnIconSymbol}>+</span> Add New Product
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

      {/* Main Inventory Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading catalog inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No products found</h3>
            <p>Try adjusting your search criteria or add a new product.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Media</th>
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
                  const buying = Number(prod.buying_price) || 0;
                  const selling = Number(prod.selling_price) || 0;
                  const margin = (selling - buying).toFixed(2);
                  const prodImages = parseProductImages(prod.images);
                  const firstImage = prodImages.length > 0 ? prodImages[0] : null;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div className={styles.thumbnailCell}>
                          {firstImage ? (
                            <img
                              src={getImageUrl(firstImage)}
                              alt={prod.name}
                              className={styles.tableThumbnail}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className={styles.noThumbnail}>No Img</div>
                          )}
                          {prodImages.length > 1 && (
                            <span className={styles.imageCountBadge}>
                              +{prodImages.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
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
                        ${buying.toFixed(2)}
                      </td>
                      <td>
                        <div className={styles.priceBold}>
                          ${selling.toFixed(2)}
                        </div>
                        <div className={styles.marginSub}>+${margin} margin</div>
                      </td>
                      <td>
                        <span className={styles.locationTag}>📍 {prod.location}</span>
                      </td>
                      <td className={styles.textRight}>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleOpenModal(prod)}
                            className={`${styles.btnIcon} ${styles.edit}`}
                            title="Edit Product"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className={`${styles.btnIcon} ${styles.delete}`}
                            title="Delete Product"
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {editingProduct ? "Edit Product Details" : "Create New Product"}
                </h3>
                <p className={styles.modalSubtitle}>
                  Fill in product specifications and upload showcase images
                </p>
              </div>
              <button onClick={handleCloseModal} className={styles.btnClose}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {/* Image Upload Zone */}
              <div className={styles.uploadSection}>
                <label className={styles.fieldLabel}>
                  Product Images <span className={styles.reqAsterisk}>*</span>
                  <span className={styles.fieldHint}>(Min 1, Max 3 images)</span>
                </label>

                <div className={styles.previewGrid}>
                  {/* Existing Images (Edit mode) */}
                  {existingImages.map((imgPath, index) => (
                    <div key={`existing-${index}`} className={styles.previewItem}>
                      <img
                        src={getImageUrl(imgPath)}
                        alt="Product preview"
                        className={styles.previewImage}
                      />
                      <button
                        type="button"
                        className={styles.btnRemoveImg}
                        onClick={() => handleRemoveExistingImage(index)}
                      >
                        ✕
                      </button>
                      <span className={styles.savedTag}>Saved</span>
                    </div>
                  ))}

                  {/* New Upload Previews */}
                  {imagePreviews.map((url, index) => (
                    <div key={`new-${index}`} className={styles.previewItem}>
                      <img src={url} alt="New upload preview" className={styles.previewImage} />
                      <button
                        type="button"
                        className={styles.btnRemoveImg}
                        onClick={() => handleRemoveNewImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Upload Box Slot */}
                  {existingImages.length + imageFiles.length < 3 && (
                    <label className={styles.uploadDropzone}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        multiple
                        className={styles.fileInputHidden}
                        onChange={handleImageChange}
                      />
                      <div className={styles.dropzoneContent}>
                        <span className={styles.dropzoneIcon}>📷</span>
                        <span className={styles.dropzoneText}>Upload Photo</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Input Form Fields */}
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.spanFull}`}>
                  <label className={styles.fieldLabel}>
                    Product Name <span className={styles.reqAsterisk}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g. Logitech MX Master 3S"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>
                    Category <span className={styles.reqAsterisk}>*</span>
                  </label>
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
                  <label className={styles.fieldLabel}>SKU / Barcode</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. LOGI-MX3S-BLK"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>
                    Stock Quantity <span className={styles.reqAsterisk}>*</span>
                  </label>
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
                  <label className={styles.fieldLabel}>
                    Storage Location <span className={styles.reqAsterisk}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g. Aisle 3, Shelf B"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>
                    Buying Price ($) <span className={styles.reqAsterisk}>*</span>
                  </label>
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
                  <label className={styles.fieldLabel}>
                    Selling Price ($) <span className={styles.reqAsterisk}>*</span>
                  </label>
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
                  <label className={styles.fieldLabel}>Internal Notes</label>
                  <textarea
                    rows="3"
                    className={styles.textareaField}
                    placeholder="Add supplier details or handling notes..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.btnSecondary}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}