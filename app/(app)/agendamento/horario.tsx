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
import { ChevronLeft, User } from 'lucide-react-native';
import { Botao } from '@/components';
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

  // Encontra a terça-feira mais próxima futura (ou desta semana)
  // Mapeamento: Ter=2, Qua=3, Qui=4, Sex=5, Sáb=6, Dom=0
  const DIAS_TRABALHO = [2, 3, 4, 5, 6, 0]; // Ter→Dom (índices JS)

  // Calcula o offset para chegar à terça desta semana
  let diffParaTerca: number;
  if (diaSemana === 0) {
    // Domingo: próxima terça = +2
    diffParaTerca = 2;
  } else if (diaSemana === 1) {
    // Segunda: próxima terça = +1
    diffParaTerca = 1;
  } else {
    // Terça a Sábado: retorna à terça desta semana
    diffParaTerca = 2 - diaSemana;
  }

  const terca = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diffParaTerca);

  return DIAS_TRABALHO.map((_, i) => {
    const d = new Date(terca);
    d.setDate(terca.getDate() + i);
    return d;
  });
}

/** Formata Date como YYYY-MM-DD */
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

  // Seleciona o primeiro barbeiro por padrão
  useEffect(() => {
    if (barbeiros.length > 0 && !barbeiroSelecionadoId) {
      setBarbeiroSelecionadoId(barbeiros[0].id);
    }
  }, [barbeiros, barbeiroSelecionadoId]);

  const diasSemana = useMemo(() => diasDaSemanaAtual(), []);
  const hoje = useMemo(() => new Date(), []);

  const [slotSelecionado, setSlotSelecionado] = useState<SlotSelecionado | null>(null);

  // Mapa de horários ocupados por dia: { 'YYYY-MM-DD': ['08:00', '09:00', ...] }
  const [ocupadosPorDia, setOcupadosPorDia] = useState<Record<string, string[]>>({});
  const [carregando, setCarregando] = useState(true);

  // Busca ocupação de todos os dias da semana de uma vez
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

  /** Determina o estado visual de um slot */
  function getEstadoSlot(dia: Date, hora: string): 'disponivel' | 'indisponivel' | 'selecionado' {
    const isoDate = toIsoDate(dia);

    const isAtivo =
      slotSelecionado &&
      toIsoDate(slotSelecionado.data) === isoDate &&
      slotSelecionado.hora === hora;
    if (isAtivo) return 'selecionado';

    // Dia passado
    const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    if (inicioDia < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0)) {
      return 'indisponivel';
    }

    // Já ocupado no banco
    if (ocupadosPorDia[isoDate]?.includes(hora)) return 'indisponivel';

    // Se é hoje, verifica se o horário já passou
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

    const dia  = String(data.getDate()).padStart(2, '0');
    const mes  = String(data.getMonth() + 1).padStart(2, '0');
    const ano  = data.getFullYear();
    const dataFormatadaExibicao = `${dia}/${mes}/${ano} • ${hora}`;

    router.push({
      pathname: '/(app)/agendamento/confirmacao',
      params: {
        servicoId: params.servicoId || '',
        servicoNome: params.servicoNome || 'Serviço',
        servicoPreco: params.servicoPreco || '0',
        servicoDuracao: params.servicoDuracao || '60',
        barbeiroId: barbeiroSelecionadoId || '',
        barbeiroNome: barbeiroObj?.nome_completo || 'Barbeiro da Casa',
        dataHoraIso: dataHoraObj.toISOString(),
        dataExibicao: dataFormatadaExibicao,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar}>
          <ChevronLeft size={24} color={Colors.textoPrimario} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Escolha o horário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Seleção de Barbeiro (apenas se > 1 cadastrado) */}
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

        {/* Label da semana */}
        <View style={styles.semanaHeader}>
          <Text style={styles.semanaLabel}>
            Semana · {diasSemana[0].getDate()} {MESES_CURTOS[diasSemana[0].getMonth()]} –{' '}
            {diasSemana[diasSemana.length - 1].getDate()} {MESES_CURTOS[diasSemana[diasSemana.length - 1].getMonth()]}
          </Text>
          {carregando && <ActivityIndicator size="small" color={Colors.vermelho} />}
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
                  <View style={[
                    styles.vagasBadge,
                    { backgroundColor: totalLivres === 0 ? Colors.erroClaro : Colors.verdeClaro },
                  ]}>
                    <Text style={[
                      styles.vagasBadgeTexto,
                      { color: totalLivres === 0 ? Colors.erro : Colors.verde },
                    ]}>
                      {totalLivres === 0 ? 'Lotado' : `${totalLivres} vaga${totalLivres > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Slots */}
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
                        onPress={() => {
                          if (!isIndisponivel) {
                            setSlotSelecionado(isSelected ? null : { data: dia, hora });
                          }
                        }}
                        activeOpacity={isIndisponivel ? 1 : 0.7}
                        disabled={isIndisponivel}
                      >
                        <Text style={[
                          styles.slotTexto,
                          isSelected && styles.slotTextoSelecionado,
                          isIndisponivel && styles.slotTextoIndisponivel,
                        ]}>
                          {hora}
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

      {/* Rodapé */}
      <View style={styles.rodape}>
        <Botao
          label="Continuar"
          onPress={handleContinuar}
          desabilitado={!slotSelecionado}
          estiloContainer={styles.botaoContinuar}
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
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.headerV,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  btnVoltar: { width: 40, alignItems: 'flex-start' },
  titulo: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  barbeirosSecao: { gap: Spacing.xs },
  barbeirosLista: { gap: Spacing.xs, paddingVertical: 4 },
  chipBarbeiro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  chipBarbeiroAtivo: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelho,
  },
  chipBarbeiroTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  chipBarbeiroTextoAtivo: {
    color: Colors.textoPrimario,
    fontFamily: FontFamily.semiBold,
  },
  semanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  semanaLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  diaCard: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  diaCardPassado: {
    opacity: 0.4,
  },
  diaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diaNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  diaData: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  textoApagado: { color: Colors.textoDesabilitado },
  vagasBadge: {
    paddingHorizontal: Spacing.xs,
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
    height: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.superficie2,
    borderWidth: 1.5,
    borderColor: Colors.borda,
  },
  slotSelecionado: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelho,
    ...Shadows.card,
  },
  slotIndisponivel: {
    backgroundColor: Colors.transparente,
    borderColor: Colors.transparente,
    opacity: 0.35,
  },
  slotTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  slotTextoSelecionado: {
    color: Colors.textoPrimario,
  },
  slotTextoIndisponivel: {
    color: Colors.textoDesabilitado,
    textDecorationLine: 'line-through',
  },
  rodape: {
    padding: Spacing.telaH,
    borderTopWidth: 1,
    borderTopColor: Colors.borda,
    backgroundColor: Colors.fundo,
  },
  botaoContinuar: { width: '100%' },
  secaoTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
});
