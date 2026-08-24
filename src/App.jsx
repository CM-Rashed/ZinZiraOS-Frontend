import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TitleBar from "./components/TitleBar";
import AppOnboarding from "./components/AppOnboarding";
import ShopSetup from "./components/ShopSetup";
import DashboardLayout from "./components/Dashboard";

// Dedicated Page Imports
import InstantOrders from "./pages/InstantOrders";
import Inventory from "./pages/Inventory";
import ManageOrders from "./pages/ManageOrders";
import ManageShop from "./pages/ManageShop";
import ManageStaff from "./pages/ManageStaff";
import ManageCategory from "./pages/ManageCategory";
import WebsiteSettings from "./pages/WebsiteSettings";
import Configurations from "./pages/Configurations";
import AdminSettings from "./pages/AdminSettings";
import AddProduct from "./pages/AddProduct";
import ManageCustomer from "./pages/ManageCustomer";
import "./App.css";

export default function App() {
  const [stage, setStage] = useState("loading");

  // Prevent copying, text selection, and right-click context menu globally
  useEffect(() => {
    const handleCopy = (e) => e.preventDefault();
    const handleContextMenu = (e) => e.preventDefault();
    const handleSelectStart = (e) => {
      // Allow selection inside input fields and textareas so typing works normally
      const tag = e.target.tagName.toLowerCase();
      if (tag !== "input" && tag !== "textarea") {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const hasCompletedAppOnboarding = localStorage.getItem("hasCompletedAppOnboarding") === "true";
    const hasCreatedShop = localStorage.getItem("hasCreatedShop") === "true";

    if (!hasCompletedAppOnboarding) {
      setStage("app-onboarding");
    } else if (!hasCreatedShop || !token) {
      setStage("shop-setup");
    } else {
      setStage("dashboard");
    }
  }, []);

  const handleAppOnboardingComplete = () => {
    localStorage.setItem("hasCompletedAppOnboarding", "true");
    setStage("shop-setup");
  };

  const handleShopSetupComplete = () => {
    localStorage.setItem("hasCreatedShop", "true");
    setStage("dashboard");
  };

  if (stage === "loading") {
    return (
      <div className="loading-screen">
        <div className="pulse-loader"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Background ambient lighting effects */}
        <div className="ambient-glow glow-primary"></div>
        <div className="ambient-glow glow-secondary"></div>
        <div className="app-grid-overlay"></div>

        <TitleBar />

        <main className="content-area">
          {stage === "app-onboarding" && (
            <div className="flow-container fade-in">
              <AppOnboarding onComplete={handleAppOnboardingComplete} />
            </div>
          )}

          {stage === "shop-setup" && (
            <div className="flow-container fade-in">
              <ShopSetup onComplete={handleShopSetupComplete} />
            </div>
          )}

          {stage === "dashboard" && (
            <div className="dashboard-container fade-in">
              <Routes>
                <Route path="/" element={<DashboardLayout />}>
                  {/* Default entry point changed to manage-shop */}
                  <Route index element={<Navigate to="/manage-shop" replace />} />
                  <Route path="manage-shop" element={<ManageShop />} />
                  <Route path="instant-orders" element={<InstantOrders />} />
                  <Route path="manage-inventory" element={<Inventory />} />
                  <Route path="manage-orders" element={<ManageOrders />} />
                  <Route path="manage-staff" element={<ManageStaff />} />
                  <Route path="manage-category" element={<ManageCategory />} />
                  <Route path="website-settings" element={<WebsiteSettings />} />
                  <Route path="configurations" element={<Configurations />} />
                  <Route path="admin-settings" element={<AdminSettings />} />
                  <Route path="add-product" element={<AddProduct />} />
                  <Route path="manage-customer" element={<ManageCustomer />} />
                  {/* Fallback route redirecting to manage-shop */}
                  <Route path="*" element={<Navigate to="/manage-shop" replace />} />
                </Route>
              </Routes>
            </div>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}