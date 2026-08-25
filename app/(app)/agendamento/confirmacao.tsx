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
import { useBarbearia } from '@/contexts/BarbeariaContext';

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
  const { barbearia } = useBarbearia();
  const [salvando, setSalvando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const salvoRef = useRef(false);

  async function inserirAgendamento(servicoId: string, barbeiroId: string, dataHoraIso: string) {
    if (!session?.user?.id) return { error: new Error('Usuário não autenticado.') };

    try {
      // 1. Garante que o registro na tabela perfis exista
      const { data: perfilCliente } = await supabase
        .from('perfis')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!perfilCliente) {
        await supabase.from('perfis').upsert({
          id: session.user.id,
          nome_completo:
            session.user.user_metadata?.nome_completo ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'Cliente',
          email: session.user.email,
          role: 'cliente',
        });
      }

      let idBarbeiroFinal = barbeiroId;

      // 2. Busca slot correspondente no banco
      let consultaSlot = supabase
        .from('slots_agenda')
        .select('id, barbeiro_id')
        .eq('data_hora', dataHoraIso)
        .eq('ativo', true);
      if (barbearia?.id) consultaSlot = consultaSlot.eq('barbearia_id', barbearia.id);
      const { data: slot } = await consultaSlot.maybeSingle();

      if (slot?.id) {
        if (slot.barbeiro_id) {
          idBarbeiroFinal = slot.barbeiro_id;
        }

        const { error: erroRpc } = await supabase.rpc('reservar_slot', {
          p_slot_id: slot.id,
          p_cliente_id: session.user.id,
          p_servico_id: servicoId,
        });

        if (!erroRpc) {
          return { error: null };
        }
        console.log('RPC reservar_slot falhou, usando fallback direto:', erroRpc.message);
      }

      // 3. Se barbeiroId for vazio, busca membro ativo da barbearia selecionada
      if (!idBarbeiroFinal) {
        if (barbearia?.id) {
          const { data: membroAtivo } = await supabase
            .from('barbearia_membros')
            .select('usuario_id')
            .eq('barbearia_id', barbearia.id)
            .eq('ativo', true)
            .in('papel', ['proprietario', 'gestor', 'barbeiro'])
            .order('criado_em', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (membroAtivo?.usuario_id) {
            idBarbeiroFinal = membroAtivo.usuario_id;
          }
        }

        if (!idBarbeiroFinal) {
          const { data: barbeiroCadastrado } = await supabase
            .from('perfis')
            .select('id')
            .eq('role', 'barbeiro')
            .limit(1)
            .maybeSingle();

          idBarbeiroFinal = barbeiroCadastrado?.id || '4b808eeb-9198-42a1-b10c-3a54f72c12dc';
        }
      }

      // 4. Inserção direta na tabela agendamentos como fallback confiável
      const { error: erroInsert } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: session.user.id,
          barbeiro_id: idBarbeiroFinal,
          servico_id: servicoId,
          barbearia_id: barbearia?.id ?? null,
          data_hora: dataHoraIso,
          status: 'confirmado',
        });

      return { error: erroInsert };
    } catch (err: any) {
      return { error: err };
    }
  }

  useEffect(() => {
    async function salvar() {
      if (salvoRef.current) return;
      if (!params.servicoId || !params.dataHoraIso) {
        setErro('Informações de agendamento incompletas.');
        setSalvando(false);
        return;
      }

      salvoRef.current = true;
      setSalvando(true);
      setErro(null);

      const { error } = await inserirAgendamento(
        params.servicoId,
        params.barbeiroId || '',
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
      {/* Indicador de 3 Etapas */}
      <IndicadorEtapas etapaAtual={3} />

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
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.giant,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
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
    paddingTop: 40,
    width: '100%',
  },
  iconeContainer: {
    marginBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadows.card,
  },
  cabecalhoServico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  cabecalhoServicoInfo: {
    flex: 1,
    gap: 2,
  },
  servicoNomeDestaque: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  divisor: {
    height: 1,
    backgroundColor: Colors.borda,
  },
  detalheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detalheIconeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  botao: {
    width: '100%',
    marginTop: Spacing.md,
    backgroundColor: Colors.vermelho,
  },
  botaoVoltar: {
    padding: Spacing.sm,
  },
  botaoVoltarTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
});
