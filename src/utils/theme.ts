import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  conditions: {
    light: '[data-theme="light"] &, [data-theme=""] &, :root &',
    dark: '[data-theme="dark"] &',
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#FDF6E3" },
          100: { value: "#FBE9B0" },
          200: { value: "#F7D470" },
          300: { value: "#F2BF3A" },
          400: { value: "#E8A635" },
          500: { value: "#D4911E" },
          600: { value: "#B87A12" },
          700: { value: "#8A5A0A" },
          800: { value: "#5C3A04" },
          900: { value: "#3A2202" },
          950: { value: "#1A0E00" },
        },
        accent: {
          admin: { value: "#534AB7" },
          attorney: { value: "#1D9E75" },
          staff: { value: "#BA7517" },
          contractor: { value: "#D85A30" },
          portal: { value: "#378ADD" },
        },
      },
      fonts: {
        body: { value: "'DM Sans', sans-serif" },
        heading: { value: "'DM Sans', sans-serif" },
        mono: { value: "'JetBrains Mono', monospace" },
      },
      radii: {
        sm: { value: "6px" },
        md: { value: "8px" },
        lg: { value: "12px" },
        xl: { value: "16px" },
      },
    },
    semanticTokens: {
      colors: {
        // Deeply nested structural groups to prevent token loss
        bg: {
          DEFAULT: { value: { _light: "#FFFFFF", _dark: "#222222" } },
          subtle: { value: { _light: "#F1EFE8", _dark: "#2A2A2A" } },
          muted: { value: { _light: "#F1EFE8", _dark: "#303030" } },
          emphasized: { value: { _light: "#1F1F1F", _dark: "#161614" } },
          inverted: { value: { _light: "#1F1F1F", _dark: "#FFFFFF" } },
          panel: { value: { _light: "#FFFFFF", _dark: "#2A2A2A" } },
          input: { value: { _light: "#FFFFFF", _dark: "#2A2A2A" } },
        },
        fg: {
          DEFAULT: { value: { _light: "#1A1A1A", _dark: "#F1EFE8" } },
          muted: { value: { _light: "#5F5E5A", _dark: "#B4B2A9" } },
          subtle: { value: { _light: "#888780", _dark: "#5F5E5A" } },
          inverted: { value: { _light: "#FFFFFF", _dark: "#1A1A1A" } },
        },
        border: {
          DEFAULT: {
            value: {
              _light: "rgba(0,0,0,0.12)",
              _dark: "rgba(255,255,255,0.09)",
            },
          },
          muted: {
            value: {
              _light: "rgba(0,0,0,0.08)",
              _dark: "rgba(255,255,255,0.06)",
            },
          },
          subtle: {
            value: {
              _light: "rgba(0,0,0,0.08)",
              _dark: "rgba(255,255,255,0.06)",
            },
          },
          emphasized: {
            value: {
              _light: "rgba(0,0,0,0.18)",
              _dark: "rgba(255,255,255,0.14)",
            },
          },
          input: {
            value: {
              _light: "rgba(0,0,0,0.18)",
              _dark: "rgba(255,255,255,0.14)",
            },
          },
        },
        brand: {
          solid: { value: "{colors.brand.400}" },
          contrast: { value: "{colors.brand.900}" },
          fg: { value: "{colors.brand.900}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.200}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.400}" },
        },
      },
    },
    textStyles: {
      heading: {
        value: {
          fontSize: "20px",
          fontWeight: "600",
          lineHeight: "1.25",
          letterSpacing: "-0.02em",
        },
      },
      subheadline: {
        value: {
          fontSize: "14px",
          fontWeight: "400",
          lineHeight: "1.5",
        },
      },
      label: {
        value: {
          fontSize: "14px",
          fontWeight: "500",
          lineHeight: "1.25",
        },
      },
      "body-sm": {
        value: {
          fontSize: "13px",
          fontWeight: "400",
          lineHeight: "1.4",
        },
      },
    },
    layerStyles: {
      "surface-card": {
        value: {
          bg: "bg",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "lg",
        },
      },
      "surface-raised": {
        value: {
          bg: "bg",
          borderRadius: "xl",
        },
      },
      "brand-button": {
        value: {
          bg: "brand.solid",
          color: "brand.fg",
          borderRadius: "md",
          fontWeight: "500",
          _hover: { bg: "{colors.brand.500}" },
          _active: { bg: "{colors.brand.600}" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      minWidth: "320px",
      minHeight: "100%",
      fontFamily: "body",
      bg: "bg",
      color: "fg",
      fontSize: "14px",
      fontWeight: "400",
      fontSynthesis: "none",
      textRendering: "optimizeLegibility",
      transition: "background-color 300ms, color 300ms",
    },
    "#root": {
      minHeight: "100%",
    },
    "*": {
      boxSizing: "border-box",
    },
    "button, input, textarea, select": {
      font: "inherit",
    },
    a: {
      color: "inherit",
      textDecoration: "none",
    },
  },
});

export const systemThemeConfig = createSystem(defaultConfig, config);
