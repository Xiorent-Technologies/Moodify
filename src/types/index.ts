// Navigation Types
export interface RootStackParamList {
  '(tabs)': undefined;
  '+not-found': undefined;
}

export interface TabParamList {
  index: undefined;
  explore: undefined;
}

// Theme Types
export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

// Component Props Types
export interface ThemedComponentProps {
  lightColor?: string;
  darkColor?: string;
}

// API Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// App State Types
export interface AppState {
  isLoading: boolean;
  user: User | null;
  theme: ColorScheme;
}
