import React, { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const STEPS = [
  {
    src: "/a2z delivered animation.lottie",
    tag: "Performance",
    title: "Lightning Fast POS",
    desc: "Process sales, manage inventory, and handle checkouts effortlessly with local performance."
  },
  {
    src: "/e-comerce.lottie",
    tag: "Analytics",
    title: "Deep Business Insights",
    desc: "Track sales trends, calculate profit margins, and generate real-time visual analytics."
  },
  {
    src: "/Ecommerce comic.lottie",
    tag: "Privacy & Sync",
    title: "Offline-First Security",
    desc: "Your data stays on your machine. Complete privacy with automated local back-ups."
  }
];

export default function AppOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (typeof onComplete === "function") {
      onComplete();
    }
  };

  return (
    <div className="onboarding-card">
      {/* Sleek App Onboarding Header */}
      <header className="onboarding-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">⚡</div>
          <span className="brand-name">A2Z POS</span>
        </div>
        
        <button className="skip-btn" onClick={handleComplete}>
          Skip Intro
        </button>
      </header>

      {/* Progress & Tag Badge */}
      <div className="status-bar">
        <div className="badge-step">
          <span className="badge-pulse"></span>
          Step {currentStep + 1} of {STEPS.length}
        </div>
        <div className="tag-badge">{STEPS[currentStep].tag}</div>
      </div>

      {/* Animation Showcase */}
      <div className="onboarding-icon-container">
        <div className="animation-glow"></div>
        <DotLottieReact
          key={currentStep}
          src={STEPS[currentStep].src}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Content Section */}
      <div className="onboarding-content">
        <h2 className="onboarding-title">{STEPS[currentStep].title}</h2>
        <p className="onboarding-desc">{STEPS[currentStep].desc}</p>
      </div>

      {/* Navigation Footer */}
      <footer className="onboarding-footer">
        <div className="pagination">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`dot ${idx === currentStep ? "active" : ""}`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        <button className="primary-btn" onClick={handleNext}>
          <span>{currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}</span>
          <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </footer>
    </div>
  );
}