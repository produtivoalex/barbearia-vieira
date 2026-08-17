import { Tabs } from 'expo-router';
import { Home, CalendarDays, Scissors, User } from 'lucide-react-native';
import { Colors, FontFamily, FontSize } from '@/theme';

export default function TabsClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.superficie,
          borderTopColor: Colors.borda,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.vermelho,
        tabBarInactiveTintColor: Colors.textoSecundario,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: FontSize.labelXs,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicos/index"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, size }) => (
            <Scissors size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
