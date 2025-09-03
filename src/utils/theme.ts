import { extendTheme } from 'native-base';
import { COLORS } from '../constants/colors';

export const nativeBaseTheme = extendTheme({
  colors: {
    primary: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: COLORS.primary, // #FF6B35
      600: COLORS.primaryDark, // #E64A19
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    secondary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: COLORS.secondary, // #1E3A8A
      600: COLORS.secondaryDark, // #1E40AF
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: COLORS.success, // #10B981
      600: COLORS.accentDark, // #059669
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: COLORS.error, // #EF4444
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    gray: {
      50: COLORS.gray50,
      100: COLORS.gray100,
      200: COLORS.gray200,
      300: COLORS.gray300,
      400: COLORS.gray400,
      500: COLORS.gray500,
      600: COLORS.gray600,
      700: COLORS.gray700,
      800: COLORS.gray800,
      900: COLORS.gray900,
    },
  },
  config: {
    // App is now dark mode only
    initialColorMode: 'dark',
    useSystemColorMode: false, // Force dark mode, ignore system preference
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'lg',
      },
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: (props: any) => {
          return {
            bg: `${props.colorScheme}.500`,
            _pressed: {
              bg: `${props.colorScheme}.600`,
            },
          };
        },
        outline: (props: any) => {
          return {
            borderColor: `${props.colorScheme}.500`,
            borderWidth: 1,
            _pressed: {
              bg: `${props.colorScheme}.50`,
            },
          };
        },
      },
    },
    Input: {
      baseStyle: {
        rounded: 'lg',
        borderColor: 'gray.600',
        color: 'gray.900',
        _focus: {
          borderColor: 'primary.600',
          bg: 'white',
        },
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.900',  // Changed from gray.800 to gray.900 for better contrast
      },
    },
    Heading: {
      baseStyle: {
        color: 'black',     // Changed to pure black for maximum contrast
        fontWeight: 'bold',
      },
    },
  },
  fontConfig: {
    // Add custom fonts here if needed
  },
  fonts: {
    heading: undefined,
    body: undefined,
    mono: undefined,
  },
});