import React, { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import styles from "./WebsiteSettings.module.css";

// Dynamic API Base URL & Root Host setup using Vite Env Variable
const API_HOST = import.meta.env.VITE_API_BASE_URL || "http://10.42.0.132:8000";
const API_BASE_URL = `${API_HOST}/api/admin`;

// Registered Image Keys to strip from text string payloads
const HOME_IMAGE_KEYS = ["website_logo", "slider1_image", "slider2_image"];
const ABOUT_IMAGE_KEYS = ["card1_icon", "card2_icon", "card3_icon", "our_vision_image"];

// Standard Aspect Ratio Mappings per Image Type
const RECOMMENDED_ASPECTS = {
  website_logo: 1, // 1:1 Square
  slider1_image: 16 / 9, // 16:9 Landscape Banner
  slider2_image: 16 / 9, // 16:9 Landscape Banner
  card1_icon: 1, // 1:1 Icon
  card2_icon: 1, // 1:1 Icon
  card3_icon: 1, // 1:1 Icon
  our_vision_image: 16 / 9, // 16:9 Vision Section Banner
};

export default function WebsiteSettings() {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Form State
  const [homeData, setHomeData] = useState({});
  const [aboutData, setAboutData] = useState({});

  // File Upload State & Live Object URLs
  const [homeFiles, setHomeFiles] = useState({});
  const [aboutFiles, setAboutFiles] = useState({});
  const [previews, setPreviews] = useState({});

  // Image Cropper Modal State
  const [cropModal, setCropModal] = useState({
    open: false,
    imageSrc: null,
    key: null,
    section: null,
    fileName: "",
    fileType: "image/jpeg",
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const getAuthToken = () => {
    try {
      const directToken = localStorage.getItem("token");
      if (directToken) return directToken;

      const adminData = localStorage.getItem("adminData");
      if (adminData) {
        const parsed = JSON.parse(adminData);
        return (
          parsed.token ||
          parsed.access_token ||
          parsed.api_token ||
          parsed.token_type ||
          (parsed.admin && parsed.admin.token) ||
          ""
        );
      }
    } catch (err) {
      console.error("Failed to parse token from localStorage:", err);
    }
    return "";
  };

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
      return path;
    }
    return `${API_HOST}/${path.replace(/^\//, "")}`;
  };

  const fetchSettings = async () => {
    const token = getAuthToken();
    if (!token) {
      triggerToast("Authentication token missing. Please log in again.", "error");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
      const [resHome, resAbout] = await Promise.all([
        fetch(`${API_BASE_URL}/shop-settings`, { headers }),
        fetch(`${API_BASE_URL}/about-settings`, { headers }),
      ]);

      if (resHome.status === 401 || resAbout.status === 401) {
        triggerToast("Session expired. Please log in again.", "error");
        setLoading(false);
        return;
      }

      if (resHome.ok) {
        const data = await resHome.json();
        setHomeData(data);
        setPreviews((prev) => ({
          ...prev,
          website_logo: resolveImageUrl(data.website_logo),
          slider1_image: resolveImageUrl(data.slider1_image),
          slider2_image: resolveImageUrl(data.slider2_image),
        }));
      }

      if (resAbout.ok) {
        const data = await resAbout.json();
        setAboutData(data);
        setPreviews((prev) => ({
          ...prev,
          card1_icon: resolveImageUrl(data.card1_icon),
          card2_icon: resolveImageUrl(data.card2_icon),
          card3_icon: resolveImageUrl(data.card3_icon),
          our_vision_image: resolveImageUrl(data.our_vision_image),
        }));
      }
    } catch (err) {
      triggerToast("Failed to connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    if (section === "home") {
      setHomeData((prev) => ({ ...prev, [name]: value }));
    } else {
      setAboutData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Triggers crop popup when a file is chosen
  const handleFileSelect = (e, key, section) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        open: true,
        imageSrc: reader.result,
        key,
        section,
        fileName: file.name,
        fileType: file.type || "image/jpeg",
      });
      setZoom(1);
      setAspect(RECOMMENDED_ASPECTS[key] || 16 / 9);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input value to allow re-selecting the same file if needed
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Utility to slice image using canvas and export binary file blob
  const generateCroppedFile = async (imageSrc, pixelCrop, fileName, fileType) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], fileName, { type: fileType });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ croppedFile, previewUrl });
      }, fileType);
    });
  };

  // Saves cropped image binary to form payloads
  const handleApplyCrop = async () => {
    try {
      const { croppedFile, previewUrl } = await generateCroppedFile(
        cropModal.imageSrc,
        croppedAreaPixels,
        cropModal.fileName,
        cropModal.fileType
      );

      const { key, section } = cropModal;

      if (section === "home") {
        setHomeFiles((prev) => ({ ...prev, [key]: croppedFile }));
      } else {
        setAboutFiles((prev) => ({ ...prev, [key]: croppedFile }));
      }

      setPreviews((prev) => ({ ...prev, [key]: previewUrl }));
      closeCropModal();
      triggerToast("Image cropped successfully!");
    } catch (err) {
      console.error("Crop error:", err);
      triggerToast("Failed to process cropped image.", "error");
    }
  };

  const closeCropModal = () => {
    setCropModal({ open: false, imageSrc: null, key: null, section: null, fileName: "", fileType: "image/jpeg" });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const token = getAuthToken();
    if (!token) {
      triggerToast("Unauthenticated! Please re-login.", "error");
      return;
    }

    setSaving(true);
    const isHome = activeTab === "home";
    const endpoint = isHome ? "shop-settings" : "about-settings";
    const dataObj = isHome ? homeData : aboutData;
    const filesObj = isHome ? homeFiles : aboutFiles;
    const imageKeysToIgnore = isHome ? HOME_IMAGE_KEYS : ABOUT_IMAGE_KEYS;

    const formData = new FormData();

    Object.keys(dataObj).forEach((key) => {
      if (!imageKeysToIgnore.includes(key) && dataObj[key] !== null && dataObj[key] !== undefined) {
        formData.append(key, dataObj[key]);
      }
    });

    Object.keys(filesObj).forEach((key) => {
      if (filesObj[key] instanceof File) {
        formData.append(key, filesObj[key]);
      }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        triggerToast(`${isHome ? "Home Page" : "About Us"} settings saved successfully!`);
        if (isHome) setHomeFiles({});
        else setAboutFiles({});

        if (result.data) {
          const updated = result.data;
          setPreviews((prev) => {
            const updatedPreviews = { ...prev };
            imageKeysToIgnore.forEach((key) => {
              if (updated[key]) updatedPreviews[key] = resolveImageUrl(updated[key]);
            });
            return updatedPreviews;
          });
        }
      } else {
        triggerToast(result.message || "Failed to update settings.", "error");
      }
    } catch (err) {
      triggerToast("Network error occurred while saving.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading application preferences...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast.show && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.message}</div>}

      {/* Header Bar */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Website Content Management</h1>
          <p className={styles.subtitle}>Customize your storefront sliders, branding, and about section</p>
        </div>
        <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? <span className={styles.btnLoader}></span> : "Save Changes"}
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabItem} ${activeTab === "home" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("home")}
        >
          Home Page Settings
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "about" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About Us Settings
        </button>
      </nav>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className={styles.formContent}>
        {activeTab === "home" ? (
          <div className={styles.tabPanel}>
            {/* General Branding */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>General Store Identity</h2>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>Website Name</label>
                  <input
                    type="text"
                    name="website_name"
                    value={homeData.website_name || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    value={homeData.tagline || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
              </div>
              <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
                <label>Physical Shop Location</label>
                <input
                  type="text"
                  name="shop_location"
                  value={homeData.shop_location || ""}
                  onChange={(e) => handleInputChange(e, "home")}
                />
              </div>

              <div className={styles.fileUploadArea} style={{ marginTop: "1rem" }}>
                <label>Website Logo (1:1 Recommended)</label>
                <div className={styles.previewRow}>
                  {previews.website_logo && (
                    <img src={previews.website_logo} alt="Logo Preview" className={styles.logoPreview} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "website_logo", "home")}
                  />
                </div>
              </div>
            </section>

            {/* Slider 1 */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Hero Slider #1 (16:9 Banner)</h2>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>Hero Text</label>
                  <input
                    type="text"
                    name="slider1_hero_text"
                    value={homeData.slider1_hero_text || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Headline</label>
                  <input
                    type="text"
                    name="slider1_headline"
                    value={homeData.slider1_headline || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
              </div>
              <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
                <label>Paragraph</label>
                <textarea
                  rows="3"
                  name="slider1_paragraph"
                  value={homeData.slider1_paragraph || ""}
                  onChange={(e) => handleInputChange(e, "home")}
                ></textarea>
              </div>
              <div className={styles.grid2} style={{ marginTop: "1rem" }}>
                <div className={styles.inputGroup}>
                  <label>Button Label</label>
                  <input
                    type="text"
                    name="slider1_button"
                    value={homeData.slider1_button || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
                <div className={styles.fileUploadArea}>
                  <label>Slider Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "slider1_image", "home")}
                  />
                </div>
              </div>
              {previews.slider1_image && (
                <img src={previews.slider1_image} alt="Slider 1 Preview" className={styles.bannerPreview} />
              )}
            </section>

            {/* Slider 2 */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Hero Slider #2 (16:9 Banner)</h2>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>Hero Text</label>
                  <input
                    type="text"
                    name="slider2_hero_text"
                    value={homeData.slider2_hero_text || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Headline</label>
                  <input
                    type="text"
                    name="slider2_headline"
                    value={homeData.slider2_headline || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
              </div>
              <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
                <label>Paragraph</label>
                <textarea
                  rows="3"
                  name="slider2_paragraph"
                  value={homeData.slider2_paragraph || ""}
                  onChange={(e) => handleInputChange(e, "home")}
                ></textarea>
              </div>
              <div className={styles.grid2} style={{ marginTop: "1rem" }}>
                <div className={styles.inputGroup}>
                  <label>Button Label</label>
                  <input
                    type="text"
                    name="slider2_button"
                    value={homeData.slider2_button || ""}
                    onChange={(e) => handleInputChange(e, "home")}
                  />
                </div>
                <div className={styles.fileUploadArea}>
                  <label>Slider Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "slider2_image", "home")}
                  />
                </div>
              </div>
              {previews.slider2_image && (
                <img src={previews.slider2_image} alt="Slider 2 Preview" className={styles.bannerPreview} />
              )}
            </section>

            {/* Promotional Cards */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Promotional Feature Cards (4)</h2>
              <div className={styles.grid2}>
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className={styles.subBlock}>
                    <h4>Card {num}</h4>
                    <div className={styles.inputGroup}>
                      <label>Headline</label>
                      <input
                        type="text"
                        name={`card${num}_headline`}
                        value={homeData[`card${num}_headline`] || ""}
                        onChange={(e) => handleInputChange(e, "home")}
                      />
                    </div>
                    <div className={styles.inputGroup} style={{ marginTop: "0.5rem" }}>
                      <label>Text Content</label>
                      <input
                        type="text"
                        name={`card${num}_text`}
                        value={homeData[`card${num}_text`] || ""}
                        onChange={(e) => handleInputChange(e, "home")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* About Us Tab */
          <div className={styles.tabPanel}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>About Header Banner</h2>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>Hero Text</label>
                  <input
                    type="text"
                    name="slider_hero_text"
                    value={aboutData.slider_hero_text || ""}
                    onChange={(e) => handleInputChange(e, "about")}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Headline</label>
                  <input
                    type="text"
                    name="slider_headline"
                    value={aboutData.slider_headline || ""}
                    onChange={(e) => handleInputChange(e, "about")}
                  />
                </div>
              </div>
              <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
                <label>Paragraph</label>
                <textarea
                  rows="3"
                  name="slider_paragraph"
                  value={aboutData.slider_paragraph || ""}
                  onChange={(e) => handleInputChange(e, "about")}
                ></textarea>
              </div>
            </section>

            {/* Why Choose Us */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Why Choose Us Section</h2>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>Hero Text</label>
                  <input
                    type="text"
                    name="why_choose_hero_text"
                    value={aboutData.why_choose_hero_text || ""}
                    onChange={(e) => handleInputChange(e, "about")}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Headline</label>
                  <input
                    type="text"
                    name="why_choose_headline"
                    value={aboutData.why_choose_headline || ""}
                    onChange={(e) => handleInputChange(e, "about")}
                  />
                </div>
              </div>
            </section>

            {/* 3 Icon Cards */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Why Choose Us - 3 Value Cards</h2>
              <div className={styles.grid3}>
                {[1, 2, 3].map((num) => (
                  <div key={num} className={styles.subBlock}>
                    <h4>Feature {num}</h4>
                    <div className={styles.inputGroup}>
                      <label>Header</label>
                      <input
                        type="text"
                        name={`card${num}_header`}
                        value={aboutData[`card${num}_header`] || ""}
                        onChange={(e) => handleInputChange(e, "about")}
                      />
                    </div>
                    <div className={styles.fileUploadArea} style={{ marginTop: "0.5rem" }}>
                      <label>Icon Image (1:1 Aspect)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, `card${num}_icon`, "about")}
                      />
                      {previews[`card${num}_icon`] && (
                        <img
                          src={previews[`card${num}_icon`]}
                          alt={`Icon ${num}`}
                          className={styles.iconPreview}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Vision Banner */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Our Vision Section</h2>
              <div className={styles.inputGroup}>
                <label>Vision Header</label>
                <input
                  type="text"
                  name="our_vision_header"
                  value={aboutData.our_vision_header || ""}
                  onChange={(e) => handleInputChange(e, "about")}
                />
              </div>
              <div className={styles.fileUploadArea} style={{ marginTop: "1rem" }}>
                <label>Our Vision Image (16:9 Aspect)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "our_vision_image", "about")}
                />
                {previews.our_vision_image && (
                  <img src={previews.our_vision_image} alt="Vision" className={styles.bannerPreview} />
                )}
              </div>
            </section>
          </div>
        )}
      </form>

      {/* POPUP CROPPER MODAL */}
      {cropModal.open && (
        <div className={styles.cropModalOverlay}>
          <div className={styles.cropModalContainer}>
            <h3>Crop & Adjust Image</h3>

            <div className={styles.cropContainer}>
              <Cropper
                image={cropModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className={styles.cropControls}>
              <div className={styles.controlGroup}>
                <label>Zoom Level</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>

              <div className={styles.controlGroup}>
                <label>Aspect Ratio Presets</label>
                <div className={styles.aspectBtnGroup}>
                  <button type="button" onClick={() => setAspect(1)}>1:1 (Square)</button>
                  <button type="button" onClick={() => setAspect(16 / 9)}>16:9 (Banner)</button>
                  <button type="button" onClick={() => setAspect(4 / 3)}>4:3 (Standard)</button>
                </div>
              </div>
            </div>

            <div className={styles.cropActions}>
              <button type="button" className={styles.cancelCropBtn} onClick={closeCropModal}>
                Cancel
              </button>
              <button type="button" className={styles.applyCropBtn} onClick={handleApplyCrop}>
                Apply Crop & Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}