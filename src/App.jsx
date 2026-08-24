import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TitleBar from "./components/TitleBar";
import AppOnboarding from "./components/AppOnboarding";
import ShopSetup from "./components/ShopSetup";
import DashboardLayout from "./components/Dashboard";

// Individual Dedicated Page Imports
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
// import "./App.css";

export default function App() {
  const [stage, setStage] = useState("loading");

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

  if (stage === "loading") return null;

  return (
    <BrowserRouter>
      <div className="app-layout">
        <TitleBar />
        <div className="content-area">
          {stage === "app-onboarding" && (
            <AppOnboarding onComplete={handleAppOnboardingComplete} />
          )}

          {stage === "shop-setup" && (
            <ShopSetup onComplete={handleShopSetupComplete} />
          )}

          {stage === "dashboard" && (
            <Routes>
              {/* Main Dashboard Wrapper with Persistent Sidebar */}
              <Route path="/" element={<DashboardLayout />}>
                {/* Default Route Redirects to Instant Orders */}
                <Route index element={<Navigate to="/instant-orders" replace />} />

                {/* Dedicated Pages Rendered inside DashboardLayout's <Outlet /> */}
                <Route path="instant-orders" element={<InstantOrders />} />
                <Route path="manage-inventory" element={<Inventory />} />
                <Route path="manage-orders" element={<ManageOrders />} />
                <Route path="manage-shop" element={<ManageShop />} />
                <Route path="manage-staff" element={<ManageStaff />} />
                <Route path="manage-category" element={<ManageCategory />} />
                <Route path="website-settings" element={<WebsiteSettings />} />
                <Route path="configurations" element={<Configurations />} />
                <Route path="admin-settings" element={<AdminSettings />} />
                <Route path="add-product" element={<AddProduct />} />
                {/* Catch-all redirect to instant orders */}
                <Route path="*" element={<Navigate to="/instant-orders" replace />} />
              </Route>
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}