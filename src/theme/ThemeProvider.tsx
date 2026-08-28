import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, Theme } from "./tokens";

type ThemePreference = "system" | "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");

  const isDark = preference === "system" ? systemScheme === "dark" : preference === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({ theme, preference, setPreference, isDark }),
    [theme, preference, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within a ThemeProvider");
  return ctx;
}
