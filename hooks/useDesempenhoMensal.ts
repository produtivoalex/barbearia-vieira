import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface DiaDesempenho {
  dia: number;
  dataStr: string;
  diaSemana: string;
  faturamento: number;
  totalCortes: number;
  isHoje: boolean;
  isFuturo: boolean;
  agendamentos: Array<{
    id: string;
    hora: string;
    clienteNome: string;
    servicoNome: string;
    preco: number;
    status: string;
  }>;
}

export interface SemanaDesempenho {
  numero: number;
  label: string;
  dataInicio: string;
  dataFim: string;
  faturamento: number;
  totalCortes: number;
  isAtual: boolean;
  isPassada: boolean;
  dias: DiaDesempenho[];
}

const DIAS_SEMANA_SIGLA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function useDesempenhoMensal(barbeariaId?: string) {
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;

  const agora = new Date();
  const [ano, setAno] = useState<number>(agora.getFullYear());
  const [mes, setMes] = useState<number>(agora.getMonth()); // 0-indexed (0 = Jan, 7 = Ago)
  const [carregando, setCarregando] = useState<boolean>(true);
  const [agendamentosBrutos, setAgendamentosBrutos] = useState<any[]>([]);

  const avancarMes = useCallback(() => {
    setMes((mAnterior) => {
      if (mAnterior === 11) {
        setAno((a) => a + 1);
        return 0;
      }
      return mAnterior + 1;
    });
  }, []);

  const voltarMes = useCallback(() => {
    setMes((mAnterior) => {
      if (mAnterior === 0) {
        setAno((a) => a - 1);
        return 11;
      }
      return mAnterior - 1;
    });
  }, []);

  const resetarParaMesAtual = useCallback(() => {
    const d = new Date();
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }, []);

  const carregarDadosMes = useCallback(async () => {
    if (!barbeiroId) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    try {
      const inicioMes = new Date(ano, mes, 1, 0, 0, 0).toISOString();
      const totalDias = new Date(ano, mes + 1, 0).getDate();
      const fimMes = new Date(ano, mes, totalDias, 23, 59, 59).toISOString();

      let query = supabase
        .from('agendamentos')
        .select(`
          id,
          data_hora,
          status,
          servico:servico_id ( id, nome, preco, duracao_minutos ),
          cliente:cliente_id ( id, nome_completo, telefone )
        `)
        .eq('barbeiro_id', barbeiroId)
        .gte('data_hora', inicioMes)
        .lte('data_hora', fimMes)
        .neq('status', 'cancelado');

      if (barbeariaId) {
        query = query.eq('barbearia_id', barbeariaId);
      }

      const { data, error } = await query.order('data_hora', { ascending: true });

      if (error) throw error;
      setAgendamentosBrutos(data || []);
    } catch (err) {
      console.error('Erro ao carregar desempenho mensal:', err);
      setAgendamentosBrutos([]);
    } finally {
      setCarregando(false);
    }
  }, [barbeiroId, barbeariaId, ano, mes]);

  useEffect(() => {
    carregarDadosMes();
  }, [carregarDadosMes]);

  // Processamento e consolidação dos dados diários e semanais
  const processado = useMemo(() => {
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const isMesAtual = hoje.getFullYear() === ano && hoje.getMonth() === mes;
    const diaAtual = hoje.getDate();
    const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

    // Mapeamento dos dias do mês (1 .. totalDiasNoMes)
    const diasArray: DiaDesempenho[] = [];

    for (let d = 1; d <= totalDiasNoMes; d++) {
      const dataObj = new Date(ano, mes, d);
      const mesStr = String(mes + 1).padStart(2, '0');
      const diaStr = String(d).padStart(2, '0');
      const dataStr = `${ano}-${mesStr}-${diaStr}`;
      const isHoje = dataStr === hojeStr;
      const isFuturo = isMesAtual ? d > diaAtual : ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes > hoje.getMonth());

      // Agendamentos deste dia
      const agsDoDia = agendamentosBrutos.filter((a) => a.data_hora.slice(0, 10) === dataStr);
      const faturamento = agsDoDia.reduce((acc, a) => acc + Number(a.servico?.preco || 0), 0);

      diasArray.push({
        dia: d,
        dataStr,
        diaSemana: DIAS_SEMANA_SIGLA[dataObj.getDay()],
        faturamento,
        totalCortes: agsDoDia.length,
        isHoje,
        isFuturo,
        agendamentos: agsDoDia.map((a) => ({
          id: a.id,
          hora: new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          clienteNome: a.cliente?.nome_completo || 'Cliente',
          servicoNome: a.servico?.nome || 'Corte',
          preco: Number(a.servico?.preco || 0),
          status: a.status,
        })),
      });
    }

    // Totais do mês
    const faturamentoTotalMes = agendamentosBrutos.reduce((acc, a) => acc + Number(a.servico?.preco || 0), 0);
    const totalCortesMes = agendamentosBrutos.length;

    // Dias com faturamento positivo
    const diasComAtendimento = diasArray.filter((d) => d.totalCortes > 0);
    const mediaPorDiaTrabalhado =
      diasComAtendimento.length > 0 ? faturamentoTotalMes / diasComAtendimento.length : 0;

    // Projeção do mês
    let projecaoFechamento = faturamentoTotalMes;
    if (isMesAtual && diaAtual > 0) {
      const mediaAteAgora = faturamentoTotalMes / diaAtual;
      projecaoFechamento = Math.round(mediaAteAgora * totalDiasNoMes);
    }

    // Agrupamento Semana a Semana (Semana 1: 1-7, Semana 2: 8-14, Semana 3: 15-21, Semana 4: 22-28, Semana 5: 29-fim)
    const semanasArray: SemanaDesempenho[] = [];
    const cortesSemanais = [
      { num: 1, ini: 1, fim: 7 },
      { num: 2, ini: 8, fim: 14 },
      { num: 3, ini: 15, fim: 21 },
      { num: 4, ini: 22, fim: 28 },
      { num: 5, ini: 29, fim: totalDiasNoMes },
    ];

    cortesSemanais.forEach(({ num, ini, fim }) => {
      if (ini > totalDiasNoMes) return;
      const fimReal = Math.min(fim, totalDiasNoMes);
      const diasDaSemana = diasArray.filter((d) => d.dia >= ini && d.dia <= fimReal);
      const faturamentoSem = diasDaSemana.reduce((acc, d) => acc + d.faturamento, 0);
      const cortesSem = diasDaSemana.reduce((acc, d) => acc + d.totalCortes, 0);

      const isFuturoMes = ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes > hoje.getMonth());
      const isPassadoMes = ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth());
      const isAtual = isMesAtual && diaAtual >= ini && diaAtual <= fimReal;
      const isPassada = isMesAtual ? diaAtual > fimReal : isPassadoMes;

      semanasArray.push({
        numero: num,
        label: `Semana ${num} (${String(ini).padStart(2, '0')} a ${String(fimReal).padStart(2, '0')} ${MESES_NOMES[mes].slice(0, 3)})`,
        dataInicio: `${ini} de ${MESES_NOMES[mes].slice(0, 3)}`,
        dataFim: `${fimReal} de ${MESES_NOMES[mes].slice(0, 3)}`,
        faturamento: faturamentoSem,
        totalCortes: cortesSem,
        isAtual,
        isPassada,
        dias: diasDaSemana,
      });
    });

    // Maior faturamento diário para escala do gráfico
    const maxFaturamentoDiario = Math.max(1, ...diasArray.map((d) => d.faturamento));

    return {
      mesNome: MESES_NOMES[mes],
      ano,
      isMesAtual,
      dias: diasArray,
      semanas: semanasArray,
      faturamentoTotalMes,
      totalCortesMes,
      mediaPorDiaTrabalhado,
      projecaoFechamento,
      maxFaturamentoDiario,
    };
  }, [agendamentosBrutos, ano, mes]);

  return {
    mes,
    carregando,
    recarregar: carregarDadosMes,
    avancarMes,
    voltarMes,
    resetarParaMesAtual,
    ...processado,
  };
}
