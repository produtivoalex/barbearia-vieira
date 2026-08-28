import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.fundo },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(barbeiro)" />
      <Stack.Screen name="agendamento/horario" />
      <Stack.Screen name="agendamento/confirmacao" />
      <Stack.Screen name="lista-espera/index" />
      <Stack.Screen name="lista-espera/oferta" />
      <Stack.Screen name="notificacoes" />
      <Stack.Screen name="barbearias" />
    </Stack>
  );
}
