import React, { useState } from "react";

const STEPS = [
  {
    icon: "⚡",
    title: "Lightning Fast POS",
    desc: "Process sales, manage inventory, and handle checkouts effortlessly with local performance."
  },
  {
    icon: "📊",
    title: "Deep Business Insights",
    desc: "Track sales trends, calculate profit margins, and generate real-time visual analytics."
  },
  {
    icon: "🔒",
    title: "Offline-First Security",
    desc: "Your data stays on your machine. Complete privacy with automated local back-ups."
  }
];

export default function AppOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="onboarding-card">
      <div className="badge-step">Step {currentStep + 1} of 3</div>

      <div className="onboarding-icon">{STEPS[currentStep].icon}</div>
      <h2 className="onboarding-title">{STEPS[currentStep].title}</h2>
      <p className="onboarding-desc">{STEPS[currentStep].desc}</p>

      <div className="pagination">
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`dot ${idx === currentStep ? "active" : ""}`}
          />
        ))}
      </div>

      <button className="primary-btn" onClick={nextStep}>
        {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
      </button>
    </div>
  );
}