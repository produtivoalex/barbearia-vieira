import { Stack } from 'expo-router';
import { Colors } from '@/theme/colors';

export default function PreAuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.fundo },
        animation: 'fade',
      }}
    />
  );
}
