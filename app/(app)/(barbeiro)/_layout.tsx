import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { CalendarCheck, Calendar, Users, Store } from 'lucide-react-native';
import { FontFamily, FontSize } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabsBarbeiroLayout() {
  const { perfil, carregandoPerfil } = usePerfil();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const naTelaCriacao = (segments as string[]).includes('cadastrar-barbearia');
    if (!carregandoPerfil && perfil && perfil.role !== 'barbeiro' && !naTelaCriacao) {
      router.replace('/(app)/(tabs)');
    }
  }, [perfil, carregandoPerfil, segments, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.superficie,
          borderTopColor: theme.borda,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.ouroTexto,
        tabBarInactiveTintColor: theme.textoSecundario,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 10.5,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="hoje"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="semana"
        options={{
          title: 'Semana',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Users size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Meu Negócio',
          tabBarIcon: ({ color, size }) => (
            <Store size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preparar-agenda"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="opcoes-avancadas"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="gestao-barbearia"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cadastrar-barbearia"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="gerenciar-equipe"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
