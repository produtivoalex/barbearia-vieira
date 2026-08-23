import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ChevronLeft, User, Clock, Scissors, Info, Calendar } from 'lucide-react-native';
import { Botao, IndicadorEtapas, IlustracaoServico } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useAgendamento } from '@/hooks/useAgendamento';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';
import { supabase } from '@/lib/supabase';

const SLOTS_PADRAO: string[] = ['08:00', '09:00', '10:00', '11:00'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function diasDaProximaSemana(): Date[] {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const distanciaParaSegunda = diaSemana === 0 ? 1 : 8 - diaSemana;
  const segunda = new Date(hoje);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(hoje.getDate() + distanciaParaSegunda);

  return Array.from({ length: 6 }, (_, index) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + index + 1); // Terça a Domingo
    return data;
  });
}

function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

interface SlotSelecionado {
  data: Date;
  hora: string;
}

export default function TelaHorario() {
  const router = useRouter();
  const { barbearia } = useBarbearia();
  const params = useLocalSearchParams<{
    servicoId?: string;
    servicoNome?: string;
    servicoPreco?: string;
    servicoDuracao?: string;
  }>();

  const { barbeiros, buscarHorariosOcupados } = useAgendamento(barbearia?.id);
  const { agenda, carregando: carregandoAgenda } = useAgendaSemanal(barbearia?.id);
  const [barbeiroSelecionadoId, setBarbeiroSelecionadoId] = useState<string | null>(null);

  useEffect(() => {
    if (barbeiros.length > 0 && !barbeiroSelecionadoId) {
      setBarbeiroSelecionadoId(barbeiros[0].id);
    }
  }, [barbeiros, barbeiroSelecionadoId]);

  const hoje = useMemo(() => new Date(), []);

  // Determina os dias exibidos com base na agenda do banco
  const diasSemana = useMemo(() => {
    if (agenda?.dias && agenda.dias.length > 0) {
      const ordenados = [...agenda.dias].sort((a, b) => a.data.localeCompare(b.data));
      return ordenados.map((d) => {
        const [ano, mes, diaNum] = d.data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, diaNum, 12, 0, 0);
        return {
          data: dataObj,
          isoDate: d.data,
          ativo: d.ativo,
        };
      });
    }

    // Fallback: Próximos 6 dias de trabalho
    return diasDaProximaSemana().map((d) => ({
      data: d,
      isoDate: toIsoDate(d),
      ativo: true,
    }));
  }, [agenda]);

  const [slotSelecionado, setSlotSelecionado] = useState<SlotSelecionado | null>(null);
  const [ocupadosPorDia, setOcupadosPorDia] = useState<Record<string, string[]>>({});
  const [slotsPorDia, setSlotsPorDia] = useState<Record<string, string[]>>({});
  const [carregando, setCarregando] = useState(true);

  const carregarOcupacaoESlots = useCallback(async () => {
    if (!barbeiroSelecionadoId) return;
    setCarregando(true);

    try {
      // 1. Busca slots configurados no banco de dados
      let consultaSlots = supabase
        .from('slots_agenda')
        .select('data_hora, ativo')
        .eq('ativo', true);
      if (barbearia?.id) consultaSlots = consultaSlots.eq('barbearia_id', barbearia.id);
      const { data: slotsBanco } = await consultaSlots.order('data_hora', { ascending: true });

      const mapaSlots: Record<string, string[]> = {};
      if (slotsBanco && slotsBanco.length > 0) {
        for (const s of slotsBanco) {
          const iso = s.data_hora.slice(0, 10);
          const d = new Date(s.data_hora);
          const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          if (!mapaSlots[iso]) mapaSlots[iso] = [];
          if (!mapaSlots[iso].includes(hora)) mapaSlots[iso].push(hora);
        }
      }
      setSlotsPorDia(mapaSlots);

      // 2. Busca agendamentos já ocupados para cada dia
      const resultados = await Promise.all(
        diasSemana.map(async (item) => {
          const ocupados = await buscarHorariosOcupados(item.isoDate, barbeiroSelecionadoId);
          return { isoDate: item.isoDate, ocupados };
        })
      );

      const mapaOcupados: Record<string, string[]> = {};
      for (const r of resultados) {
        mapaOcupados[r.isoDate] = r.ocupados;
      }
      setOcupadosPorDia(mapaOcupados);
    } catch (e) {
      console.log('Erro ao carregar ocupação:', e);
    } finally {
      setCarregando(false);
    }
  }, [barbearia?.id, buscarHorariosOcupados, diasSemana, barbeiroSelecionadoId]);

  useEffect(() => {
    carregarOcupacaoESlots();
  }, [carregarOcupacaoESlots]);

  function getEstadoSlot(dia: Date, hora: string): 'disponivel' | 'indisponivel' | 'selecionado' {
    const isoDate = toIsoDate(dia);

    const isAtivo =
      slotSelecionado &&
      toIsoDate(slotSelecionado.data) === isoDate &&
      slotSelecionado.hora === hora;
    if (isAtivo) return 'selecionado';

    const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    if (inicioDia < hojeZero) {
      return 'indisponivel';
    }

    if (ocupadosPorDia[isoDate]?.includes(hora)) return 'indisponivel';

    if (toIsoDate(dia) === toIsoDate(hoje)) {
      const [h, m] = hora.split(':').map(Number);
      const agora = new Date();
      if (h < agora.getHours() || (h === agora.getHours() && m <= agora.getMinutes())) {
        return 'indisponivel';
      }
    }

    return 'disponivel';
  }

  function handleContinuar() {
    if (!slotSelecionado) return;

    const barbeiroObj = barbeiros.find((b) => b.id === barbeiroSelecionadoId);
    const { data, hora } = slotSelecionado;
    const [h, m] = hora.split(':').map(Number);
    const dataHoraObj = new Date(data.getFullYear(), data.getMonth(), data.getDate(), h, m, 0);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const dataFormatadaExibicao = `${dia}/${mes}/${ano} às ${hora}`;

    router.push({
      pathname: '/(app)/agendamento/confirmacao',
      params: {
        servicoId: params.servicoId || '',
        servicoNome: params.servicoNome || 'Serviço',
        servicoPreco: params.servicoPreco || '0',
        servicoDuracao: params.servicoDuracao || '30',
        barbeiroId: barbeiroSelecionadoId || '',
        barbeiroNome: barbeiroObj?.nome_completo || 'Barbeiro Vieira',
        dataHoraIso: dataHoraObj.toISOString(),
        dataExibicao: dataFormatadaExibicao,
      },
    });
  }

  const precoFormatado = params.servicoPreco
    ? Number(params.servicoPreco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';

  const labelPeriodo = useMemo(() => {
    if (diasSemana.length === 0) return 'Horários da Semana';
    const prim = diasSemana[0].data;
    const ult = diasSemana[diasSemana.length - 1].data;
    return `${prim.getDate()} ${MESES_CURTOS[prim.getMonth()]} – ${ult.getDate()} ${MESES_CURTOS[ult.getMonth()]}`;
  }, [diasSemana]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar} activeOpacity={0.7}>
          <ChevronLeft size={24} color={Colors.textoPrimario} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Data & Horário</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Indicador de Etapas: 1 Serviço > 2 Data e Horário > 3 Confirmar */}
      <IndicadorEtapas etapaAtual={2} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner do Serviço Selecionado */}
        {params.servicoNome && (
          <View style={styles.bannerServico}>
            <IlustracaoServico
              id={params.servicoId}
              nome={params.servicoNome}
              tamanho={44}
            />
            <View style={styles.bannerServicoInfo}>
              <Text style={styles.bannerServicoNome}>{params.servicoNome}</Text>
            </View>
            <Text style={styles.bannerServicoPreco}>{precoFormatado}</Text>
          </View>
        )}

        {/* Seleção de Barbeiro (se houver mais de 1) */}
        {barbeiros.length > 1 && (
          <View style={styles.barbeirosSecao}>
            <Text style={styles.secaoTitulo}>Profissional</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barbeirosLista}>
              {barbeiros.map((b) => {
                const ativo = b.id === barbeiroSelecionadoId;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.chipBarbeiro, ativo && styles.chipBarbeiroAtivo]}
                    onPress={() => {
                      setBarbeiroSelecionadoId(b.id);
                      setSlotSelecionado(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <User size={14} color={ativo ? Colors.textoPrimario : Colors.textoSecundario} />
                    <Text style={[styles.chipBarbeiroTexto, ativo && styles.chipBarbeiroTextoAtivo]}>
                      {b.nome_completo || 'Barbeiro'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Cabeçalho da Semana */}
        <View style={styles.semanaHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color={Colors.ouro} />
            <Text style={styles.semanaLabel}>Agenda · {labelPeriodo}</Text>
          </View>
          {carregando && <ActivityIndicator size="small" color={Colors.vermelho} />}
        </View>

        {/* Aviso de Tarde por Ordem de Chegada */}
        <View style={styles.avisoCard}>
          <Info size={16} color={Colors.ouro} />
          <Text style={styles.avisoTexto}>
            Horários com agendamento pela manhã (08:00 às 12:00). No turno da tarde (14:00 às 18:00) o atendimento é por ordem de chegada.
          </Text>
        </View>

        {/* Grade por dia */}
        {diasSemana.map((diaItem) => {
          const dia = diaItem.data;
          const isoDate = diaItem.isoDate;
          const isDiaAberto = diaItem.ativo;
          const slotsDoDia = slotsPorDia[isoDate] && slotsPorDia[isoDate].length > 0
            ? slotsPorDia[isoDate]
            : SLOTS_PADRAO;

          const isPassado = isoDate < toIsoDate(hoje);
          const nomesDia = DIAS_CURTOS[dia.getDay()];
          const totalOcupados = (ocupadosPorDia[isoDate] ?? []).length;
          const totalLivres = Math.max(0, slotsDoDia.length - totalOcupados);

          return (
            <View key={isoDate} style={[styles.diaCard, (!isDiaAberto || isPassado) && styles.diaCardPassado]}>
              {/* Cabeçalho do dia */}
              <View style={styles.diaCabecalho}>
                <View>
                  <Text style={[styles.diaNome, (!isDiaAberto || isPassado) && styles.textoApagado]}>
                    {nomesDia}
                  </Text>
                  <Text style={[styles.diaData, (!isDiaAberto || isPassado) && styles.textoApagado]}>
                    {dia.getDate()} de {MESES_CURTOS[dia.getMonth()]}
                  </Text>
                </View>

                {!isDiaAberto ? (
                  <View style={[styles.vagasBadge, { backgroundColor: '#2A2A2E' }]}>
                    <Text style={[styles.vagasBadgeTexto, { color: '#8E8E93' }]}>Fechado</Text>
                  </View>
                ) : isPassado ? (
                  <View style={[styles.vagasBadge, { backgroundColor: '#2A2A2E' }]}>
                    <Text style={[styles.vagasBadgeTexto, { color: '#8E8E93' }]}>Encerrado</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.vagasBadge,
                      { backgroundColor: totalLivres === 0 ? Colors.erroClaro : Colors.verdeClaro },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vagasBadgeTexto,
                        { color: totalLivres === 0 ? Colors.erro : Colors.verde },
                      ]}
                    >
                      {totalLivres === 0 ? 'Lotado' : `${totalLivres} vaga${totalLivres > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Slots da manhã */}
              {isDiaAberto && !isPassado && (
                <View style={styles.slotsRow}>
                  {slotsDoDia.map((hora) => {
                    const estado = getEstadoSlot(dia, hora);
                    const isSelected = estado === 'selecionado';
                    const isIndisponivel = estado === 'indisponivel';

                    return (
                      <TouchableOpacity
                        key={hora}
                        style={[
                          styles.slot,
                          isSelected && styles.slotSelecionado,
                          isIndisponivel && styles.slotIndisponivel,
                        ]}
                        disabled={isIndisponivel}
                        onPress={() => setSlotSelecionado({ data: dia, hora })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.slotHora,
                            isSelected && styles.slotHoraSelecionado,
                            isIndisponivel && styles.slotHoraIndisponivel,
                          ]}
                        >
                          {hora}
                        </Text>
                        <Text
                          style={[
                            styles.slotStatus,
                            isSelected && styles.slotStatusSelecionado,
                            isIndisponivel && styles.slotStatusIndisponivel,
                          ]}
                        >
                          {isSelected ? 'Escolhido' : isIndisponivel ? 'Ocupado' : 'Livre'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Barra Inferior com CTA de Continuação */}
      <View style={styles.rodapeFixo}>
        <View style={styles.resumoHorario}>
          <Text style={styles.resumoLabel}>Horário selecionado</Text>
          <Text style={styles.resumoValor}>
            {slotSelecionado
              ? `${DIAS_CURTOS[slotSelecionado.data.getDay()]}, ${slotSelecionado.data.getDate()} ${MESES_CURTOS[slotSelecionado.data.getMonth()]} às ${slotSelecionado.hora}`
              : 'Nenhum horário escolhido'}
          </Text>
        </View>
        <Botao
          label="Continuar"
          desabilitado={!slotSelecionado}
          onPress={handleContinuar}
          estiloContainer={styles.btnContinuar}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  btnVoltar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  scroll: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  bannerServico: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  bannerServicoInfo: {
    flex: 1,
    gap: 2,
  },
  bannerServicoNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  bannerServicoPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.ouro,
  },
  barbeirosSecao: {
    gap: Spacing.xs,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  barbeirosLista: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chipBarbeiro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  chipBarbeiroAtivo: {
    backgroundColor: Colors.ouro,
    borderColor: Colors.ouro,
  },
  chipBarbeiroTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  chipBarbeiroTextoAtivo: {
    color: '#0E0E0E',
    fontFamily: FontFamily.bold,
  },
  semanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  semanaLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  avisoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(203, 161, 74, 0.1)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
  },
  avisoTexto: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
    lineHeight: 16,
  },
  diaCard: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  diaCardPassado: {
    opacity: 0.45,
    backgroundColor: '#121214',
  },
  diaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diaNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  diaData: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  textoApagado: {
    color: Colors.textoDesabilitado,
  },
  vagasBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  vagasBadgeTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.fundo,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: 2,
  },
  slotSelecionado: {
    backgroundColor: Colors.ouro,
    borderColor: Colors.ouro,
  },
  slotIndisponivel: {
    backgroundColor: '#161618',
    borderColor: '#262629',
    opacity: 0.6,
  },
  slotHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
  },
  slotHoraSelecionado: {
    color: '#0E0E0E',
  },
  slotHoraIndisponivel: {
    color: Colors.textoDesabilitado,
  },
  slotStatus: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.verde,
  },
  slotStatusSelecionado: {
    color: '#0E0E0E',
    fontFamily: FontFamily.bold,
  },
  slotStatusIndisponivel: {
    color: Colors.erro,
  },
  rodapeFixo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161618',
    borderTopWidth: 1,
    borderTopColor: Colors.borda,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  resumoHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  resumoValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  btnContinuar: {
    backgroundColor: Colors.vermelho,
  },
});
