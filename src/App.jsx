import React, { useState, useEffect } from "react";
import TitleBar from "./components/TitleBar";
import AppOnboarding from "./components/AppOnboarding";
import ShopSetup from "./components/ShopSetup";
import Dashboard from "./components/Dashboard";
import "./App.css";

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

  const handleShopSetupComplete = (data) => {
    localStorage.setItem("hasCreatedShop", "true");
    setStage("dashboard");
  };

  if (stage === "loading") return null;

  return (
    <div className="app-layout">
      <TitleBar />
      <div className="content-area">
        {stage === "app-onboarding" && (
          <AppOnboarding onComplete={handleAppOnboardingComplete} />
        )}
        {stage === "shop-setup" && (
          <ShopSetup onComplete={handleShopSetupComplete} />
        )}
        {stage === "dashboard" && <Dashboard />}
      </div>
    </div>
  );
}