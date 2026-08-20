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
import { CheckCircle, AlertCircle, Calendar, Clock, User, Sparkles } from 'lucide-react-native';
import { Botao, IndicadorEtapas, IlustracaoServico } from '@/components';
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
      const { error } = await supabase.rpc('reservar_slot', {
        p_slot_id: slot.id,
        p_cliente_id: session.user.id,
        p_servico_id: servicoId,
      });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, params.servicoId, params.barbeiroId, params.dataHoraIso]);

  const precoFormatado = params.servicoPreco
    ? Number(params.servicoPreco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ --';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Indicador de 4 Etapas */}
      <IndicadorEtapas etapaAtual={4} />

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
              Sua vaga na Barbearia Vieira está reservada com sucesso.
            </Text>

            {/* Card de detalhes com Ilustração */}
            <View style={styles.card}>
              <View style={styles.cabecalhoServico}>
                <IlustracaoServico
                  id={params.servicoId}
                  nome={params.servicoNome}
                  tamanho={52}
                />
                <View style={styles.cabecalhoServicoInfo}>
                  <Text style={styles.servicoNomeDestaque}>
                    {params.servicoNome || 'Serviço'}
                  </Text>
                  <Text style={styles.servicoDuracaoDestaque}>
                    Duração estimada: {params.servicoDuracao || '30'} min
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              <View style={styles.detalheRow}>
                <View style={styles.detalheIconeLabel}>
                  <Calendar size={16} color={Colors.ouro} />
                  <Text style={styles.detalheLabel}>Data e Horário</Text>
                </View>
                <Text style={styles.detalheValor}>{params.dataExibicao || 'Data selecionada'}</Text>
              </View>

              <View style={styles.divisor} />

              <View style={styles.detalheRow}>
                <View style={styles.detalheIconeLabel}>
                  <User size={16} color={Colors.textoSecundario} />
                  <Text style={styles.detalheLabel}>Profissional</Text>
                </View>
                <Text style={styles.detalheValor}>{params.barbeiroNome || 'Barbeiro Vieira'}</Text>
              </View>

              <View style={styles.divisor} />

              <View style={styles.detalheRow}>
                <View style={styles.detalheIconeLabel}>
                  <Sparkles size={16} color={Colors.ouro} />
                  <Text style={styles.detalheLabel}>Valor total</Text>
                </View>
                <Text style={styles.detalheValorPreco}>{precoFormatado}</Text>
              </View>
            </View>

            {/* Botões de Ação */}
            <Botao
              label="Ver meus agendamentos"
              onPress={() => router.replace('/(app)/(tabs)/agenda')}
              estiloContainer={styles.botao}
            />

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => router.replace('/(app)/(tabs)')}
              activeOpacity={0.7}
            >
              <Text style={styles.botaoVoltarTexto}>Voltar para o Início</Text>
            </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.giant,
    gap: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  erroContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  iconeContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
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
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  cabecalhoServico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cabecalhoServicoInfo: {
    flex: 1,
    gap: 2,
  },
  servicoNomeDestaque: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  servicoDuracaoDestaque: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  detalheRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detalheIconeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detalheLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  detalheValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
  },
  detalheValorPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.ouro,
  },
  divisor: {
    height: 1,
    backgroundColor: Colors.borda,
  },
  botao: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  botaoVoltar: {
    paddingVertical: Spacing.xs,
  },
  botaoVoltarTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
});
