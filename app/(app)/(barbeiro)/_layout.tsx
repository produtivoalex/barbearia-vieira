import { Tabs } from 'expo-router';
import { CalendarCheck, Calendar, Users, MoreHorizontal } from 'lucide-react-native';
import { Colors, FontFamily, FontSize } from '@/theme';

export default function TabsBarbeiroLayout() {
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
        name="hoje"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="semana"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color, size }) => (
            <MoreHorizontal size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preparar-agenda"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
