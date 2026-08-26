import React, { useState } from "react";

export default function ShopSetup({ onComplete }) {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login Form State
  const [loginData, setLoginData] = useState({
    login: "",
    password: "",
  });

  // Registration Form State
  const [formData, setFormData] = useState({
    admin_name: "",
    admin_number: "",
    email: "",
    password: "",
    password_confirmation: "",
    shop_name: "",
    shop_location: "",
    staff_numbers: 0,
    shop_type: "grocery",
  });

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "staff_numbers" ? parseInt(value) || 0 : value,
    }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  // Step Handler for Multi-step Wizard
  const handleNext = (e) => {
    e.preventDefault();
    setError(null);

    if (currentStep === 1) {
      if (!formData.admin_name || !formData.admin_number) {
        setError("Please fill in all required admin details.");
        return;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (formData.password !== formData.password_confirmation) {
        setError("Passwords do not match.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.shop_name || !formData.shop_location) {
        setError("Please enter the store name and location.");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  // Submit Login Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://computercity.cmrashed.com/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("adminData", JSON.stringify(data.admin));

      onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Registration Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          throw new Error(data.errors[firstErrorKey][0]);
        }
        throw new Error(data.message || "Failed to create shop and admin.");
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("adminData", JSON.stringify(data.admin));

      onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-card setup-wizard-card">
      {/* Mode Switcher Segmented Control */}
      <div className="auth-mode-switch">
        <button
          type="button"
          className={`mode-btn ${!isLoginMode ? "active" : ""}`}
          onClick={() => {
            setIsLoginMode(false);
            setError(null);
          }}
        >
          Create New Store
        </button>
        <button
          type="button"
          className={`mode-btn ${isLoginMode ? "active" : ""}`}
          onClick={() => {
            setIsLoginMode(true);
            setError(null);
          }}
        >
          Sign In Existing Store
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* LOGIN FORM MODE */}
      {isLoginMode ? (
        <form onSubmit={handleLoginSubmit} className="wizard-form">
          <div className="step-header">
            <h3 className="step-title">Access Store Dashboard</h3>
            <p className="step-subtitle">Enter your Email or Admin ID to continue to your workspace.</p>
          </div>

          <div className="input-field">
            <label>Email or Admin Number</label>
            <input
              type="text"
              name="login"
              className="styled-input"
              placeholder="e.g. admin@zinzira.io or ADM-10293"
              value={loginData.login}
              onChange={handleLoginChange}
              required
            />
          </div>

          <div className="input-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="styled-input"
              placeholder="••••••••"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
          </div>

          <button type="submit" className="primary-btn wizard-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Login to Store →"}
          </button>
        </form>
      ) : (
        /* MULTI-STEP REGISTRATION MODE */
        <>
          <div className="wizard-progress">
            <div className={`progress-step ${currentStep >= 1 ? "active" : ""}`}>
              <div className="step-num">1</div>
              <span className="step-label">Admin</span>
            </div>
            <div className={`progress-line ${currentStep >= 2 ? "active" : ""}`} />
            <div className={`progress-step ${currentStep >= 2 ? "active" : ""}`}>
              <div className="step-num">2</div>
              <span className="step-label">Store</span>
            </div>
            <div className={`progress-line ${currentStep === 3 ? "active" : ""}`} />
            <div className={`progress-step ${currentStep === 3 ? "active" : ""}`}>
              <div className="step-num">3</div>
              <span className="step-label">Confirm</span>
            </div>
          </div>

          {currentStep === 1 && (
            <form onSubmit={handleNext} className="wizard-form">
              <div className="step-header">
                <h3 className="step-title">Admin Credentials</h3>
                <p className="step-subtitle">Set up primary credentials to secure your store.</p>
              </div>

              <div className="input-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="admin_name"
                  className="styled-input"
                  placeholder="e.g. Alex Mercer"
                  value={formData.admin_name}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="input-group">
                <div className="input-field">
                  <label>Phone / Admin ID</label>
                  <input
                    type="text"
                    name="admin_number"
                    className="styled-input"
                    placeholder="ADM-10293"
                    value={formData.admin_number}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="input-field">
                  <label>Email <span className="label-optional">(Optional)</span></label>
                  <input
                    type="email"
                    name="email"
                    className="styled-input"
                    placeholder="admin@zinzira.io"
                    value={formData.email}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-field">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    className="styled-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="input-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    className="styled-input"
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="primary-btn wizard-btn">
                Next: Store Details →
              </button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleNext} className="wizard-form">
              <div className="step-header">
                <h3 className="step-title">Store Specifications</h3>
                <p className="step-subtitle">Provide details regarding your physical outlet.</p>
              </div>

              <div className="input-field">
                <label>Shop Name</label>
                <input
                  type="text"
                  name="shop_name"
                  className="styled-input"
                  placeholder="e.g. Apex Hypermarket"
                  value={formData.shop_name}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="input-field">
                <label>Shop Location</label>
                <input
                  type="text"
                  name="shop_location"
                  className="styled-input"
                  placeholder="Downtown Hub, Block B #14"
                  value={formData.shop_location}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="input-group">
                <div className="input-field">
                  <label>Business Category</label>
                  <select
                    name="shop_type"
                    className="styled-input styled-select"
                    value={formData.shop_type}
                    onChange={handleRegisterChange}
                    required
                  >
                    <option value="grocery">Grocery Store</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="library">Bookshop / Library</option>
                    <option value="telecom">Telecom & Electronics</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Staff Members</label>
                  <input
                    type="number"
                    name="staff_numbers"
                    className="styled-input"
                    min="0"
                    value={formData.staff_numbers}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back
                </button>
                <button type="submit" className="primary-btn">
                  Next: Review & Launch →
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <div className="wizard-form">
              <div className="step-header">
                <h3 className="step-title">Confirm Profile</h3>
                <p className="step-subtitle">Review information before provisioning your workplace.</p>
              </div>

              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">Admin Name</span>
                  <span className="summary-val">{formData.admin_name}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Admin ID</span>
                  <span className="summary-val">{formData.admin_number}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shop Name</span>
                  <span className="summary-val">{formData.shop_name}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Category</span>
                  <span className="summary-val badge">{formData.shop_type}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Location</span>
                  <span className="summary-val">{formData.shop_location}</span>
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCurrentStep(2)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleRegisterSubmit}
                  disabled={loading}
                >
                  {loading ? "Initializing..." : "Launch Platform ✨"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}