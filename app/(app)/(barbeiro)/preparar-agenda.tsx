import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Copy, Save } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';

const HORARIOS = ['08:00', '09:00', '10:00', '11:00'];
const NOMES_DIAS = ['Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

function proximaSemana() {
  const hoje = new Date();
  const distancia = hoje.getDay() === 0 ? 1 : 8 - hoje.getDay();
  const segunda = new Date(hoje);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(hoje.getDate() + distancia);
  return Array.from({ length: 6 }, (_, index) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + index + 1);
    return data;
  });
}

function dataLocal(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export default function PrepararAgenda() {
  const router = useRouter();
  const { session } = useAuth();
  const { carregarProximaParaBarbeiro } = useAgendaSemanal();
  const datas = useMemo(proximaSemana, []);
  const [ativos, setAtivos] = useState<boolean[]>(Array(6).fill(true));
  const [abertura, setAbertura] = useState('19:30');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarProximaParaBarbeiro().then((existente) => {
      if (!existente) return;
      setAtivos(datas.map((data) => existente.dias.some((dia) => dia.data === dataLocal(data) && dia.ativo)));
      if (existente.data_abertura_programada) {
        setAbertura(new Date(existente.data_abertura_programada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    });
  }, [carregarProximaParaBarbeiro, datas]);

  async function salvar() {
    if (!session?.user?.id) return;
    setSalvando(true);
    const inicioData = new Date(datas[0]);
    inicioData.setDate(inicioData.getDate() - 1);
    const inicio = dataLocal(inicioData);
    const fim = dataLocal(datas[datas.length - 1]);
    const segundaAnterior = new Date(datas[0]);
    segundaAnterior.setDate(datas[0].getDate() - 1);
    const aberturaProgramada = new Date(`${dataLocal(segundaAnterior)}T${abertura}:00`).toISOString();

    const { data: agenda, error } = await supabase
      .from('agendas_semanais')
      .upsert({ barbeiro_id: session.user.id, data_inicio: inicio, data_fim: fim, status: 'programada', data_abertura_programada: aberturaProgramada, notificar_abertura: true }, { onConflict: 'barbeiro_id,data_inicio' })
      .select('id')
      .single();
    if (error || !agenda) {
      setSalvando(false);
      Alert.alert('Não foi possível salvar', error?.message ?? 'Tente novamente.');
      return;
    }

    await supabase.from('dias_agenda').delete().eq('agenda_semana_id', agenda.id);
    const dias = datas.map((data, index) => ({ agenda_semana_id: agenda.id, data: dataLocal(data), ativo: ativos[index] }));
    const { data: diasCriados, error: erroDias } = await supabase.from('dias_agenda').insert(dias).select('id, data, ativo');
    if (erroDias || !diasCriados) {
      setSalvando(false);
      Alert.alert('Agenda salva parcialmente', erroDias?.message ?? 'Não foi possível criar os dias.');
      return;
    }
    const slots = diasCriados.flatMap((dia) => HORARIOS.map((hora) => ({ dia_agenda_id: dia.id, barbeiro_id: session.user.id, data_hora: new Date(`${dia.data}T${hora}:00`).toISOString(), ativo: dia.ativo })));
    const { error: erroSlots } = await supabase.from('slots_agenda').insert(slots);
    setSalvando(false);
    if (erroSlots) {
      Alert.alert('Agenda salva parcialmente', erroSlots.message);
      return;
    }
    Alert.alert('Agenda programada', 'A próxima semana está pronta para abrir.', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color={Colors.textoPrimario} /></TouchableOpacity>
        <Text style={styles.titulo}>Preparar agenda</Text>
        <View style={styles.iconePlaceholder} />
      </View>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.subtitulo}>Próxima semana</Text>
        <Text style={styles.descricao}>Escolha os dias que estarão disponíveis. Cada dia abre 4 vagas pela manhã.</Text>
        {datas.map((data, index) => (
          <View key={data.toISOString()} style={styles.diaCard}>
            <View style={styles.diaTexto}>
              <Text style={styles.diaNome}>{NOMES_DIAS[index]}</Text>
              <Text style={styles.diaData}>{data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {ativos[index] ? '4 vagas' : 'Indisponível'}</Text>
            </View>
            <Switch value={ativos[index]} onValueChange={(valor) => setAtivos((atual) => atual.map((item, i) => i === index ? valor : item))} trackColor={{ false: Colors.borda, true: Colors.vermelho }} thumbColor={Colors.textoPrimario} />
          </View>
        ))}
        <Text style={styles.subtitulo}>Abertura da agenda</Text>
        <View style={styles.horarios}>{['18:00', '19:00', '19:30', '20:00', '21:00'].map((hora) => <TouchableOpacity key={hora} onPress={() => setAbertura(hora)} style={[styles.hora, abertura === hora && styles.horaAtiva]}><Text style={[styles.horaTexto, abertura === hora && styles.horaTextoAtiva]}>{hora}</Text></TouchableOpacity>)}</View>
        <Text style={styles.info}><Copy size={16} color={Colors.ouro} /> A agenda será aberta na segunda-feira às {abertura}.</Text>
        <Botao label={salvando ? 'Salvando...' : 'Programar agenda'} iconeEsquerda={<Save size={18} color={Colors.textoPrimario} />} onPress={salvar} desabilitado={salvando} estiloContainer={styles.botao} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.telaH, borderBottomWidth: 1, borderBottomColor: Colors.borda },
  titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.headingSm, color: Colors.textoPrimario },
  iconePlaceholder: { width: 24 },
  conteudo: { padding: Spacing.telaH, gap: Spacing.md, paddingBottom: Spacing.giant },
  subtitulo: { fontFamily: FontFamily.bold, fontSize: FontSize.headingSm, color: Colors.textoPrimario, marginTop: Spacing.sm },
  descricao: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: Colors.textoSecundario },
  diaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.superficie, borderRadius: Radii.md },
  diaTexto: { gap: 4 },
  diaNome: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyLg, color: Colors.textoPrimario },
  diaData: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, color: Colors.textoSecundario },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hora: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.sm, backgroundColor: Colors.superficie, borderWidth: 1, borderColor: Colors.borda },
  horaAtiva: { backgroundColor: Colors.vermelho, borderColor: Colors.vermelho },
  horaTexto: { fontFamily: FontFamily.medium, color: Colors.textoSecundario },
  horaTextoAtiva: { color: Colors.textoPrimario },
  info: { flexDirection: 'row', fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, color: Colors.textoSecundario },
  botao: { width: '100%', marginTop: Spacing.sm },
});
