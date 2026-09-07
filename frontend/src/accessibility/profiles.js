export const ADAPT_PROFILES = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Default high-tech cybersecurity interface",
    fontSize: "normal",
    contrast: "normal",
    buttonSize: "normal",
    simplifyText: false,
    className: ""
  },
  low_vision: {
    id: "low_vision",
    name: "Low Vision",
    description: "Enlarged fonts, bold contrasts, enhanced readability",
    fontSize: "extra_large",
    contrast: "high",
    buttonSize: "large",
    simplifyText: false,
    className: "mode-low-vision"
  },
  dyslexia: {
    id: "dyslexia",
    name: "Dyslexia Support",
    description: "Generous line heights, specialized letter spacing",
    fontSize: "large",
    contrast: "normal",
    buttonSize: "normal",
    simplifyText: true,
    className: "mode-dyslexia"
  },
  cognitive: {
    id: "cognitive",
    name: "Cognitive Simplification",
    description: "Plain-language evidence without technical jargon",
    fontSize: "large",
    contrast: "normal",
    buttonSize: "large",
    simplifyText: true,
    className: "mode-cognitive"
  },
  motor: {
    id: "motor",
    name: "Motor Support",
    description: "Extra-large click/touch targets, simplified controls",
    fontSize: "normal",
    contrast: "normal",
    buttonSize: "extra_large",
    simplifyText: false,
    className: "mode-motor"
  },
  high_contrast: {
    id: "high_contrast",
    name: "High Contrast",
    description: "Ultra-high contrast yellow/black theme",
    fontSize: "large",
    contrast: "ultra",
    buttonSize: "large",
    simplifyText: false,
    className: "mode-high-contrast"
  },
  reading: {
    id: "reading",
    name: "Reading Support",
    description: "Soft sepia background, relaxed eye strain",
    fontSize: "large",
    contrast: "normal",
    buttonSize: "normal",
    simplifyText: true,
    className: "mode-soft-cream"
  }
};
