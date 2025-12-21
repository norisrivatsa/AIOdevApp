import { useEffect } from 'react';
import themeConfig from '../config/theme.json';

/**
 * Hook to inject theme colors as CSS custom properties
 * Reads from theme.json and applies colors to :root
 */
export const useThemeColors = () => {
  useEffect(() => {
    const root = document.documentElement;

    // Set accent colors as CSS custom properties
    root.style.setProperty('--accent-primary', themeConfig.accent.primary);
    root.style.setProperty('--accent-secondary', themeConfig.accent.secondary);

    // Set shadow opacity
    root.style.setProperty('--shadow-hover-opacity', themeConfig.shadows.card.hoverOpacity);

    // Set border glow opacity
    root.style.setProperty('--border-glow-opacity', themeConfig.effects.borderGlow.opacity);

  }, []);

  return themeConfig;
};

/**
 * Get the gradient string for use in styles
 */
export const getAccentGradient = () => {
  return `linear-gradient(135deg, ${themeConfig.accent.primary} 0%, ${themeConfig.accent.secondary} 100%)`;
};

/**
 * Get the gradient shadow for hover effects
 */
export const getAccentShadow = (opacity = 0.2) => {
  const primary = themeConfig.accent.primary;
  const secondary = themeConfig.accent.secondary;

  // Convert hex to rgba with opacity
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return `0 20px 25px -5px ${hexToRgba(primary, opacity)}, 0 8px 10px -6px ${hexToRgba(secondary, opacity)}`;
};

export default useThemeColors;
