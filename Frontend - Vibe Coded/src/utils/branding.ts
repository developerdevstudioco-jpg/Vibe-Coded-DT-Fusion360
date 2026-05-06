// Brand color configuration - easily customize throughout the app
export const BRAND_COLORS = {
  primary: '#ed1c24', // Red
  primaryLight: '#f4a4aa',
  primaryLighter: '#fae9eb',
  secondary: '#0f172a',
  accent: '#64748b',
  
  // For gradient backgrounds
  gradientStart: '#ed1c24',
  gradientEnd: '#d41019',
  gradientMid: '#f54c54',
};

export const getThemeClass = (lightClass: string, darkClass: string) => {
  // Convert brand colors to Tailwind classes or inline styles
  return `${lightClass}`;
};

// CSS variables for consistent theming
export const brandCSSVariables = `
  :root {
    --brand-primary: ${BRAND_COLORS.primary};
    --brand-primary-light: ${BRAND_COLORS.primaryLight};
    --brand-primary-lighter: ${BRAND_COLORS.primaryLighter};
    --brand-secondary: ${BRAND_COLORS.secondary};
    --brand-accent: ${BRAND_COLORS.accent};
  }
`;
