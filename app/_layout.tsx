import { Stack } from "expo-router";
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AppProvider } from '../contexts/AppContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#FF9800',
    surface: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AppProvider>
    </PaperProvider>
  );
}
