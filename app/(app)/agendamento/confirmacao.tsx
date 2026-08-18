import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, AlertCircle } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function TelaConfirmacao() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    servicoId?: string;
    servicoNome?: string;
    servicoPreco?: string;
    servicoDuracao?: string;
    barbeiroId?: string;
    barbeiroNome?: string;
    dataHoraIso?: string;
    dataExibicao?: string;
  }>();

  const { session } = useAuth();
  const [salvando, setSalvando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const salvoRef = useRef(false);

  async function inserirAgendamento(servicoId: string, barbeiroId: string, dataHoraIso: string) {
    if (!session?.user?.id) return { error: new Error('Usuário não autenticado.') };
    const { data: slot } = await supabase
      .from('slots_agenda')
      .select('id')
      .eq('barbeiro_id', barbeiroId)
      .eq('data_hora', dataHoraIso)
      .eq('ativo', true)
      .maybeSingle();
    if (slot?.id) {
      const { error } = await supabase.rpc('reservar_slot', { p_slot_id: slot.id, p_cliente_id: session.user.id, p_servico_id: servicoId });
      return { error };
    }
    const { error } = await supabase
      .from('agendamentos')
      .insert({
        cliente_id: session.user.id,
        barbeiro_id: barbeiroId,
        servico_id: servicoId,
        data_hora: dataHoraIso,
        status: 'confirmado',
      });
    return { error };
  }

  useEffect(() => {
    async function salvar() {
      if (salvoRef.current) return;
      if (!params.servicoId || !params.barbeiroId || !params.dataHoraIso) {
        setErro('Informações de agendamento incompletas.');
        setSalvando(false);
        return;
      }

      salvoRef.current = true;
      setSalvando(true);
      setErro(null);

      const { error } = await inserirAgendamento(
        params.servicoId,
        params.barbeiroId,
        params.dataHoraIso,
      );

      if (error) {
        setErro(error.message || 'Falha ao salvar agendamento.');
        salvoRef.current = false;
      }
      setSalvando(false);
    }

    salvar();
  // inserirAgendamento é definido no render — incluso session na dependência
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, params.servicoId, params.barbeiroId, params.dataHoraIso]);

  const precoFormatado = params.servicoPreco
    ? Number(params.servicoPreco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {salvando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.vermelho} />
            <Text style={styles.loadingTexto}>Confirmando seu agendamento...</Text>
          </View>
        ) : erro ? (
          <View style={styles.erroContainer}>
            <AlertCircle size={72} color={Colors.erro} strokeWidth={1.5} />
            <Text style={styles.titulo}>Ops, algo deu errado</Text>
            <Text style={styles.subtitulo}>{erro}</Text>
            <Botao
              label="Tentar novamente"
              onPress={() => {
                salvoRef.current = false;
                setSalvando(true);
                setErro(null);
                inserirAgendamento(
                  params.servicoId || '',
                  params.barbeiroId || '',
                  params.dataHoraIso || '',
                ).then(({ error }) => {
                  if (error) setErro(error.message ?? 'Erro desconhecido.');
                  setSalvando(false);
                });
              }}
              estiloContainer={styles.botao}
            />
            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.botaoVoltarTexto}>Voltar e escolher outro horário</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Ícone de confirmação */}
            <View style={styles.iconeContainer}>
              <CheckCircle size={72} color={Colors.verde} strokeWidth={1.5} />
            </View>

            <Text style={styles.titulo}>Agendamento confirmado!</Text>
            <Text style={styles.subtitulo}>
              Sua reserva foi realizada com sucesso.
            </Text>

            {/* Card de detalhes */}
            <View style={styles.card}>
              <View style={styles.detalheRow}>
                <Text style={styles.detalheLabel}>Data e hora</Text>
                <Text style={styles.detalheValor}>{params.dataExibicao || 'Data selecionada'}</Text>
              </View>
              <View style={styles.divisor} />
              <View style={styles.detalheRow}>
                <Text style={styles.detalheLabel}>Serviço</Text>
                <Text style={styles.detalheValor}>{params.servicoNome || 'Serviço'}</Text>
              </View>
              {precoFormatado && (
                <>
                  <View style={styles.divisor} />
                  <View style={styles.detalheRow}>
                    <Text style={styles.detalheLabel}>Valor</Text>
                    <Text style={styles.detalheValorPreco}>{precoFormatado}</Text>
                  </View>
                </>
              )}
              <View style={styles.divisor} />
              <View style={styles.detalheRow}>
                <Text style={styles.detalheLabel}>Profissional</Text>
                <Text style={styles.detalheValor}>{params.barbeiroNome || 'Barbearia Vieira'}</Text>
              </View>
            </View>

            {/* Ações */}
            <Botao
              label="Ver meus agendamentos"
              onPress={() => router.replace('/(app)/(tabs)/agenda')}
              estiloContainer={styles.botao}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  scroll: {
    flexGrow: 1,
    padding: Spacing.telaH,
    paddingBottom: Spacing.giant,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyLg,
    color: Colors.textoSecundario,
  },
  erroContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  iconeContainer: {
    marginBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  detalheRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detalheLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  detalheValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  detalheValorPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.ouro,
  },
  divisor: {
    height: 1,
    backgroundColor: Colors.borda,
  },
  botao: { width: '100%' },
  botaoVoltar: {
    paddingVertical: Spacing.sm,
  },
  botaoVoltarTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.vermelho,
  },
});
