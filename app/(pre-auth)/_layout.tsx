import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function PreAuthLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.fundo },
        animation: 'fade',
      }}
    />
  );
}
