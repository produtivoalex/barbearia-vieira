import { Stack } from 'expo-router';
import { Colors } from '@/theme/colors';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.fundo },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(barbeiro)" />
      <Stack.Screen name="agendamento/horario" />
      <Stack.Screen name="agendamento/confirmacao" />
      <Stack.Screen name="lista-espera/index" />
      <Stack.Screen name="lista-espera/oferta" />
    </Stack>
  );
}
