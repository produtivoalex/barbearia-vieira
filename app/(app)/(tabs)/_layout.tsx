import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, CalendarDays, Scissors, User, Wrench, RefreshCw, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radii, Spacing, type ThemePalette } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function TabsClienteLayout() {
  const { perfil, isBloqueado, carregandoPerfil } = usePerfil();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  useEffect(() => {
    if (!carregandoPerfil && perfil && perfil.role === 'barbeiro') {
      router.replace('/(app)/(barbeiro)/hoje');
    }
  }, [perfil, carregandoPerfil, router]);

  // Se o cliente foi colocado na Lista Negra pelo barbeiro:
  if (!carregandoPerfil && isBloqueado) {
    return (
      <SafeAreaView style={[styles.manutencaoSafe, { backgroundColor: theme.fundo }]}>
        <View style={styles.manutencaoConteudo}>
          <View style={[styles.manutencaoIconeWrapper, { backgroundColor: theme.ouroTranslucido }]}>
            <Wrench size={44} color={theme.ouro} />
          </View>
          <Text style={[styles.manutencaoTitulo, { color: theme.textoPrimario }]}>Aplicativo em Manutenção 🔧</Text>
          <Text style={[styles.manutencaoTexto, { color: theme.textoSecundario }]}>
            Estamos realizando atualizações técnicas nos servidores da barbearia. Por favor, tente novamente mais tarde.
          </Text>

          <TouchableOpacity
            style={[styles.btnTentarNovamente, { backgroundColor: theme.ouro }]}
            onPress={() => router.replace('/(app)/(tabs)')}
            activeOpacity={0.8}
          >
            <RefreshCw size={16} color={theme.textoEscuroSobreOuro} />
            <Text style={styles.btnTentarNovamenteTexto}>Tentar Novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSairManutencao}
            onPress={() => supabase.auth.signOut()}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={theme.textoSecundario} />
            <Text style={[styles.btnSairManutencaoTexto, { color: theme.textoSecundario }]}>Desconectar Conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Home size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicos/index"
        options={{
          title: 'Cortes & Barba',
          tabBarIcon: ({ color, size }) => (
            <Scissors size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Meus Cortes',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color, size }) => (
            <User size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    manutencaoSafe: {
      flex: 1,
      backgroundColor: theme.fundo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    manutencaoConteudo: {
      paddingHorizontal: Spacing.telaH,
      alignItems: 'center',
      gap: Spacing.md,
      maxWidth: 340,
    },
    manutencaoIconeWrapper: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    manutencaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.displayMd,
      color: theme.textoPrimario,
      textAlign: 'center',
    },
    manutencaoTexto: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      color: theme.textoSecundario,
      textAlign: 'center',
      lineHeight: 22,
    },
    btnTentarNovamente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.ouro,
      paddingHorizontal: Spacing.xl,
      paddingVertical: 14,
      borderRadius: Radii.md,
      marginTop: Spacing.sm,
      width: '100%',
      justifyContent: 'center',
    },
    btnTentarNovamenteTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoEscuroSobreOuro,
    },
    btnSairManutencao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: Spacing.sm,
    },
    btnSairManutencaoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
  });
