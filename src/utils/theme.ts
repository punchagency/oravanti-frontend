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
        specialty: {
          immigration: {
            50: { value: "#E8F5F0" },
            100: { value: "#D1EAE1" },
            200: { value: "#A3D5C3" },
            300: { value: "#75C0A5" },
            400: { value: "#47AB87" },
            500: { value: "#2A9370" },
            600: { value: "#1D7A5A" },
            700: { value: "#0F6144" },
          },
          family: {
            50: { value: "#E6F1FB" },
            100: { value: "#CCE3F7" },
            200: { value: "#99C7EF" },
            300: { value: "#66ABE7" },
            400: { value: "#338FDF" },
            500: { value: "#2B73C4" },
            600: { value: "#2357A9" },
            700: { value: "#1B3B8E" },
          },
          business: {
            50: { value: "#F0E8FB" },
            100: { value: "#E1D1F7" },
            200: { value: "#C3A3EF" },
            300: { value: "#A575E7" },
            400: { value: "#8747DF" },
            500: { value: "#6F2AC4" },
            600: { value: "#571DA9" },
            700: { value: "#3F0F8E" },
          },
          estate: {
            50: { value: "#FBEEDA" },
            100: { value: "#F7DDBF" },
            200: { value: "#EFBF7F" },
            300: { value: "#E7A13F" },
            400: { value: "#DF832B" },
            500: { value: "#C4671F" },
            600: { value: "#A94B14" },
            700: { value: "#8E2F08" },
          },
          employment: {
            50: { value: "#FCE8E3" },
            100: { value: "#F9D1C7" },
            200: { value: "#F3A38F" },
            300: { value: "#ED7557" },
            400: { value: "#E7471F" },
            500: { value: "#CC351A" },
            600: { value: "#B12314" },
            700: { value: "#96110D" },
          },
          realestate: {
            50: { value: "#E0F2E9" },
            100: { value: "#C1E5D3" },
            200: { value: "#83CBA7" },
            300: { value: "#45B17B" },
            400: { value: "#1D9E75" },
            500: { value: "#1A8A68" },
            600: { value: "#16765A" },
            700: { value: "#0F5344" },
          },
          criminal: {
            50: { value: "#F3E8F5" },
            100: { value: "#E7D1EB" },
            200: { value: "#CFA3D7" },
            300: { value: "#B775C3" },
            400: { value: "#9F47AF" },
            500: { value: "#872A9B" },
            600: { value: "#6F1D87" },
            700: { value: "#570F73" },
          },
          personalinjury: {
            50: { value: "#FBE8E8" },
            100: { value: "#F7D1D1" },
            200: { value: "#EFA3A3" },
            300: { value: "#E77575" },
            400: { value: "#DF4747" },
            500: { value: "#C42A2A" },
            600: { value: "#A91D1D" },
            700: { value: "#8E0F0F" },
          },
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
          hover: { value: { _light: "#F1EFE8", _dark: "#363636" } },
        },
        fg: {
          DEFAULT: { value: { _light: "#1A1A1A", _dark: "#F1EFE8" } },
          muted: { value: { _light: "#5F5E5A", _dark: "#B4B2A9" } },
          subtle: { value: { _light: "#888780", _dark: "#5F5E5A" } },
          inverted: { value: { _light: "#FFFFFF", _dark: "#1A1A1A" } },
          error: { value: { _light: "#B00020", _dark: "#F87171" } },
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
          /*
            Text placed ON any brand-tinted surface: solid, subtle, muted,
            emphasized, or a raw brand.100–400.

            A single value, deliberately, and it must stay one. Every brand
            surface is a light amber (#FBE9B0 → #E8A635) defined as a flat
            palette reference, so none of them changes between colour modes.
            Text sitting on one therefore must not change either — brand.900
            scores 7.1:1 on solid and 12.3:1 on muted, and a mode-aware value
            here can only make one of the two modes worse.

            If you are colouring something that sits on a brand background,
            this is the token. Not `fg`.
          */
          contrast: { value: "{colors.brand.900}" },
          /*
            Brand-coloured text on the PAGE background — a different job from
            `contrast`, and the reason this one has to be a pair.

            It was a flat `brand.900` (#3A2202, near-black brown): right on the
            light surface (#FFFFFF) and unreadable on the dark one (#222222) at
            roughly 1.3:1. Dark now resolves to brand.300 (#F2BF3A), ~9:1 on
            #222222; light is unchanged, so this is a dark-mode repair rather
            than a restyle.

            Never use this on a brand-tinted background. Doing so is what broke
            every primary button: in dark mode it put brand.300 on brand.400,
            amber on amber.
          */
          fg: {
            value: {
              _light: "{colors.brand.900}",
              _dark: "{colors.brand.300}",
            },
          },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.200}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.400}" },
        },
        specialty: {
          immigration: {
            bg: { value: "{colors.specialty.immigration.50}" },
            text: { value: "{colors.specialty.immigration.600}" },
            border: { value: "{colors.specialty.immigration.300}" },
          },
          family: {
            bg: { value: "{colors.specialty.family.50}" },
            text: { value: "{colors.specialty.family.600}" },
            border: { value: "{colors.specialty.family.300}" },
          },
          business: {
            bg: { value: "{colors.specialty.business.50}" },
            text: { value: "{colors.specialty.business.600}" },
            border: { value: "{colors.specialty.business.300}" },
          },
          estate: {
            bg: { value: "{colors.specialty.estate.50}" },
            text: { value: "{colors.specialty.estate.600}" },
            border: { value: "{colors.specialty.estate.300}" },
          },
          employment: {
            bg: { value: "{colors.specialty.employment.50}" },
            text: { value: "{colors.specialty.employment.600}" },
            border: { value: "{colors.specialty.employment.300}" },
          },
          realestate: {
            bg: { value: "{colors.specialty.realestate.50}" },
            text: { value: "{colors.specialty.realestate.600}" },
            border: { value: "{colors.specialty.realestate.300}" },
          },
          criminal: {
            bg: { value: "{colors.specialty.criminal.50}" },
            text: { value: "{colors.specialty.criminal.600}" },
            border: { value: "{colors.specialty.criminal.300}" },
          },
          personalinjury: {
            bg: { value: "{colors.specialty.personalinjury.50}" },
            text: { value: "{colors.specialty.personalinjury.600}" },
            border: { value: "{colors.specialty.personalinjury.300}" },
          },
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
          // `contrast`, not `fg` — see the token definitions. The label sits on
          // brand.solid, which is the same amber in both modes, so the label
          // must be the same dark brown in both modes.
          color: "brand.contrast",
          borderRadius: "sm",
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
