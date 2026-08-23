import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, CalendarDays, Scissors, User, Wrench, RefreshCw, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { supabase } from '@/lib/supabase';

export default function TabsClienteLayout() {
  const { perfil, isBloqueado, carregandoPerfil } = usePerfil();
  const router = useRouter();

  useEffect(() => {
    if (!carregandoPerfil && perfil && perfil.role === 'barbeiro') {
      router.replace('/(app)/(barbeiro)/hoje');
    }
  }, [perfil, carregandoPerfil, router]);

  // Se o cliente foi colocado na Lista Negra pelo barbeiro:
  if (!carregandoPerfil && isBloqueado) {
    return (
      <SafeAreaView style={styles.manutencaoSafe}>
        <View style={styles.manutencaoConteudo}>
          <View style={styles.manutencaoIconeWrapper}>
            <Wrench size={44} color={Colors.ouro} />
          </View>
          <Text style={styles.manutencaoTitulo}>Aplicativo em Manutenção 🔧</Text>
          <Text style={styles.manutencaoTexto}>
            Estamos realizando atualizações técnicas nos servidores da barbearia. Por favor, tente novamente mais tarde.
          </Text>

          <TouchableOpacity
            style={styles.btnTentarNovamente}
            onPress={() => router.replace('/(app)/(tabs)')}
            activeOpacity={0.8}
          >
            <RefreshCw size={16} color="#0E0E0E" />
            <Text style={styles.btnTentarNovamenteTexto}>Tentar Novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSairManutencao}
            onPress={() => supabase.auth.signOut()}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={Colors.textoSecundario} />
            <Text style={styles.btnSairManutencaoTexto}>Desconectar Conta</Text>
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

const styles = StyleSheet.create({
  manutencaoSafe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  manutencaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  manutencaoTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  btnTentarNovamente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
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
    color: '#0E0E0E',
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
    color: Colors.textoSecundario,
  },
});
