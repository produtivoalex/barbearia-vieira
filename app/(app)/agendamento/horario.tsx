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
import { ChevronLeft, User, Clock, Scissors, Info } from 'lucide-react-native';
import { Botao, IndicadorEtapas, IlustracaoServico } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { useAgendamento } from '@/hooks/useAgendamento';

/**
 * Slots fixos da manhã — regra operacional da Barbearia Vieira (v1).
 * A tarde é por ordem de chegada e NÃO usa o sistema de agendamento.
 */
const SLOTS_MANHA: string[] = ['08:00', '09:00', '10:00', '11:00'];

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Retorna os dias Ter–Dom da semana atual (ou da próxima, se já for segunda) */
function diasDaSemanaAtual(): Date[] {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb

  const DIAS_TRABALHO = [2, 3, 4, 5, 6, 0]; // Ter→Dom (índices JS)

  let diffParaTerca: number;
  if (diaSemana === 0) {
    diffParaTerca = 2;
  } else if (diaSemana === 1) {
    diffParaTerca = 1;
  } else {
    diffParaTerca = 2 - diaSemana;
  }

  const terca = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diffParaTerca);

  return DIAS_TRABALHO.map((_, i) => {
    const d = new Date(terca);
    d.setDate(terca.getDate() + i);
    return d;
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
  const params = useLocalSearchParams<{
    servicoId?: string;
    servicoNome?: string;
    servicoPreco?: string;
    servicoDuracao?: string;
  }>();

  const { barbeiros, buscarHorariosOcupados } = useAgendamento();
  const [barbeiroSelecionadoId, setBarbeiroSelecionadoId] = useState<string | null>(null);

  useEffect(() => {
    if (barbeiros.length > 0 && !barbeiroSelecionadoId) {
      setBarbeiroSelecionadoId(barbeiros[0].id);
    }
  }, [barbeiros, barbeiroSelecionadoId]);

  const diasSemana = useMemo(() => diasDaSemanaAtual(), []);
  const hoje = useMemo(() => new Date(), []);

  const [slotSelecionado, setSlotSelecionado] = useState<SlotSelecionado | null>(null);
  const [ocupadosPorDia, setOcupadosPorDia] = useState<Record<string, string[]>>({});
  const [carregando, setCarregando] = useState(true);

  const carregarOcupacao = useCallback(async () => {
    if (!barbeiroSelecionadoId) return;
    setCarregando(true);

    const resultados = await Promise.all(
      diasSemana.map(async (dia) => {
        const isoDate = toIsoDate(dia);
        const ocupados = await buscarHorariosOcupados(isoDate, barbeiroSelecionadoId);
        return { isoDate, ocupados };
      })
    );

    const mapa: Record<string, string[]> = {};
    for (const r of resultados) {
      mapa[r.isoDate] = r.ocupados;
    }
    setOcupadosPorDia(mapa);
    setCarregando(false);
  }, [buscarHorariosOcupados, diasSemana, barbeiroSelecionadoId]);

  useEffect(() => {
    carregarOcupacao();
  }, [carregarOcupacao]);

  function getEstadoSlot(dia: Date, hora: string): 'disponivel' | 'indisponivel' | 'selecionado' {
    const isoDate = toIsoDate(dia);

    const isAtivo =
      slotSelecionado &&
      toIsoDate(slotSelecionado.data) === isoDate &&
      slotSelecionado.hora === hora;
    if (isAtivo) return 'selecionado';

    const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    if (inicioDia < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0)) {
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

      {/* Indicador de 4 Etapas */}
      <IndicadorEtapas etapaAtual={3} />

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
              <View style={styles.bannerServicoMeta}>
                <Clock size={12} color={Colors.textoSecundario} />
                <Text style={styles.bannerServicoDuracao}>{params.servicoDuracao || '30'} min</Text>
              </View>
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
          <Text style={styles.semanaLabel}>
            Semana · {diasSemana[0].getDate()} {MESES_CURTOS[diasSemana[0].getMonth()]} –{' '}
            {diasSemana[diasSemana.length - 1].getDate()} {MESES_CURTOS[diasSemana[diasSemana.length - 1].getMonth()]}
          </Text>
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
        {diasSemana.map((dia) => {
          const isoDate = toIsoDate(dia);
          const isPassado = isoDate < toIsoDate(hoje);
          const nomesDia = DIAS_CURTOS[dia.getDay()];
          const totalOcupados = (ocupadosPorDia[isoDate] ?? []).length;
          const totalLivres = SLOTS_MANHA.length - totalOcupados;

          return (
            <View key={isoDate} style={[styles.diaCard, isPassado && styles.diaCardPassado]}>
              {/* Cabeçalho do dia */}
              <View style={styles.diaCabecalho}>
                <View>
                  <Text style={[styles.diaNome, isPassado && styles.textoApagado]}>
                    {nomesDia}
                  </Text>
                  <Text style={[styles.diaData, isPassado && styles.textoApagado]}>
                    {dia.getDate()} de {MESES_CURTOS[dia.getMonth()]}
                  </Text>
                </View>
                {!isPassado && (
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
              {!isPassado && (
                <View style={styles.slotsRow}>
                  {SLOTS_MANHA.map((hora) => {
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
  },
  btnVoltar: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: 110,
  },
  bannerServico: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
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
  bannerServicoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerServicoDuracao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  bannerServicoPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.ouro,
  },
  barbeirosSecao: { gap: Spacing.xs },
  secaoTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  barbeirosLista: { gap: Spacing.xs },
  chipBarbeiro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  chipBarbeiroAtivo: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelhoClaro,
  },
  chipBarbeiroTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  chipBarbeiroTextoAtivo: {
    fontFamily: FontFamily.bold,
    color: Colors.branco,
  },
  semanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  semanaLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.ouro,
  },
  avisoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.25)',
  },
  avisoTexto: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    lineHeight: 16,
  },
  diaCard: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  diaCardPassado: {
    opacity: 0.45,
  },
  diaCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
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
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  slot: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  slotSelecionado: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelhoClaro,
  },
  slotIndisponivel: {
    backgroundColor: '#161616',
    borderColor: '#222222',
  },
  slotHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  slotHoraSelecionado: {
    color: Colors.branco,
  },
  slotHoraIndisponivel: {
    color: Colors.textoDesabilitado,
  },
  slotStatus: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Colors.verde,
  },
  slotStatusSelecionado: {
    color: Colors.branco,
    fontFamily: FontFamily.bold,
  },
  slotStatusIndisponivel: {
    color: Colors.textoDesabilitado,
  },
  rodapeFixo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.superficie,
    borderTopWidth: 1,
    borderTopColor: Colors.borda,
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  resumoHorario: {
    flex: 1,
  },
  resumoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  resumoValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
    marginTop: 2,
  },
  btnContinuar: {
    minWidth: 130,
  },
});
