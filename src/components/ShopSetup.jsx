import React, { useState } from "react";

export default function ShopSetup({ onComplete }) {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [otp, setOtp] = useState("");

  // Track if login needs OTP verification
  const [isLoginOtpStep, setIsLoginOtpStep] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://10.42.0.132:8000";

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

  // Helper to save complete auth state into localStorage
  const saveAuthSession = (data) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("authToken", data.token);
    }
    if (data.admin) {
      const adminPayload = {
        ...data.admin,
        token: data.token || "",
      };
      localStorage.setItem("adminData", JSON.stringify(adminPayload));
    }
  };

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

  // Step Handler for Multi-step Registration Wizard
  const handleNext = (e) => {
    e.preventDefault();
    setError(null);

    if (currentStep === 1) {
      if (!formData.admin_name || !formData.admin_number || !formData.email) {
        setError("Please fill in all required admin details including email.");
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

  /*
  |--------------------------------------------------------------------------
  | LOGIN HANDLERS
  |--------------------------------------------------------------------------
  */

  // Step 1: Submit Credentials & Request Login OTP
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
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

      // If backend requires 2FA OTP completion
      if (data.requires_otp) {
        setLoginEmail(data.email);
        setIsLoginOtpStep(true);
        setOtp("");
      } else if (data.token) {
        saveAuthSession(data);
        onComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Login by Verifying OTP
  const handleCompleteLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/complete-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      saveAuthSession(data);
      onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend Login OTP Action
  const handleResendLoginOtp = async () => {
    setResending(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP code.");
      }

      alert(`A new verification code has been dispatched to ${loginEmail}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REGISTRATION HANDLERS
  |--------------------------------------------------------------------------
  */

  // STEP 1 Request Registration OTP Handler
  const handleRequestRegistrationOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/request-otp`, {
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
        throw new Error(data.message || "Failed to send OTP code.");
      }

      setOtp("");
      setCurrentStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 Verify Registration OTP & Create Account Handler
  const handleVerifyRegistrationOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/complete-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      saveAuthSession(data);
      onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend Registration OTP Action
  const handleResendRegistrationOtp = async () => {
    setResending(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP.");
      }

      alert("A new OTP code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
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
            setIsLoginOtpStep(false);
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
            setIsLoginOtpStep(false);
            setError(null);
          }}
        >
          Sign In Existing Store
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* LOGIN FORM MODE */}
      {isLoginMode ? (
        !isLoginOtpStep ? (
          /* LOGIN STEP 1: CREDENTIALS */
          <form onSubmit={handleLoginSubmit} className="wizard-form">
            <div className="step-header">
              <h3 className="step-title">Access Store Dashboard</h3>
              <p className="step-subtitle">
                Enter your Email or Admin ID to continue to your workspace.
              </p>
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
          /* LOGIN STEP 2: OTP VERIFICATION */
          <form onSubmit={handleCompleteLoginSubmit} className="wizard-form">
            <div className="step-header">
              <h3 className="step-title">Two-Factor Authentication</h3>
              <p className="step-subtitle">
                Enter the 6-digit OTP code sent to <strong>{loginEmail}</strong>.
              </p>
            </div>

            <div className="input-field">
              <label>6-Digit Security Code</label>
              <input
                type="text"
                name="otp"
                maxLength="6"
                className="styled-input otp-input"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="resend-wrapper">
              <span>Didn't receive code? </span>
              <button
                type="button"
                className="link-btn"
                onClick={handleResendLoginOtp}
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>

            <div className="wizard-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setIsLoginOtpStep(false);
                  setError(null);
                }}
                disabled={loading}
              >
                ← Back
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Sign In 🔒"}
              </button>
            </div>
          </form>
        )
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
            <div className={`progress-line ${currentStep >= 3 ? "active" : ""}`} />
            <div className={`progress-step ${currentStep >= 3 ? "active" : ""}`}>
              <div className="step-num">3</div>
              <span className="step-label">Confirm</span>
            </div>
            <div className={`progress-line ${currentStep === 4 ? "active" : ""}`} />
            <div className={`progress-step ${currentStep === 4 ? "active" : ""}`}>
              <div className="step-num">4</div>
              <span className="step-label">Verify</span>
            </div>
          </div>

          {/* STEP 1: ADMIN CREDENTIALS */}
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
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="styled-input"
                    placeholder="admin@zinzira.io"
                    value={formData.email}
                    onChange={handleRegisterChange}
                    required
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

          {/* STEP 2: STORE SPECIFICATIONS */}
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

          {/* STEP 3: REVIEW SUMMARY */}
          {currentStep === 3 && (
            <div className="wizard-form">
              <div className="step-header">
                <h3 className="step-title">Confirm Profile</h3>
                <p className="step-subtitle">Review information before proceeding to email verification.</p>
              </div>

              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">Admin Name</span>
                  <span className="summary-val">{formData.admin_name}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Email</span>
                  <span className="summary-val">{formData.email}</span>
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
                  onClick={handleRequestRegistrationOtp}
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send Verification OTP →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REGISTRATION OTP VERIFICATION */}
          {currentStep === 4 && (
            <form onSubmit={handleVerifyRegistrationOtpSubmit} className="wizard-form">
              <div className="step-header">
                <h3 className="step-title">Enter Verification Code</h3>
                <p className="step-subtitle">
                  We've sent a 6-digit OTP to <strong>{formData.email}</strong>. Enter it below to complete registration.
                </p>
              </div>

              <div className="input-field">
                <label>6-Digit Code</label>
                <input
                  type="text"
                  name="otp"
                  maxLength="6"
                  className="styled-input otp-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="resend-wrapper">
                <span>Didn't receive code? </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={handleResendRegistrationOtp}
                  disabled={resending}
                >
                  {resending ? "Resending..." : "Resend Code"}
                </button>
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCurrentStep(3)}
                  disabled={loading}
                >
                  ← Edit Info
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Launch Platform ✨"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}