import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Clock } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useServicos, type Servico } from '@/hooks/useServicos';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const DIAS = [{ id: 2, nome: 'Ter' }, { id: 3, nome: 'Qua' }, { id: 4, nome: 'Qui' }, { id: 5, nome: 'Sex' }, { id: 6, nome: 'Sáb' }, { id: 0, nome: 'Dom' }];
const HORARIOS = ['08:00', '09:00', '10:00', '11:00'];

export default function TelaListaEspera() {
  const router = useRouter();
  const { session } = useAuth();
  const { servicos } = useServicos();
  const [servico, setServico] = useState<Servico | null>(null);
  const [dias, setDias] = useState<number[]>([2, 3, 4, 5, 6, 0]);
  const [horarios, setHorarios] = useState<string[]>(HORARIOS);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (!servico && servicos[0]) setServico(servicos[0]); }, [servicos, servico]);
  const alternar = <T,>(lista: T[], valor: T, setLista: (novo: T[]) => void) => setLista(lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor]);

  async function entrar() {
    if (!session?.user?.id || !servico) { Alert.alert('Escolha um serviço', 'Selecione o serviço de interesse para entrar na fila.'); return; }
    setSalvando(true);
    const { error } = await supabase.from('fila_espera').insert({ cliente_id: session.user.id, servico_id: servico.id, dias_preferidos: dias, horarios_preferidos: horarios });
    setSalvando(false);
    if (error) Alert.alert('Não foi possível entrar na fila', error.message);
    else Alert.alert('Você está na fila', 'Avisaremos se surgir uma vaga compatível.', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color={Colors.textoPrimario} /></TouchableOpacity><Text style={styles.titulo}>Lista de espera</Text><View style={styles.placeholder} /></View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Clock size={56} color={Colors.ouro} strokeWidth={1.5} />
        <Text style={styles.heading}>Entre na lista de espera</Text>
        <Text style={styles.descricao}>Escolha suas preferências e avisaremos quando surgir uma vaga.</Text>
        <Text style={styles.label}>Serviço de interesse</Text>
        <View style={styles.opcoes}>{servicos.map((item) => <TouchableOpacity key={item.id} style={[styles.opcao, servico?.id === item.id && styles.opcaoAtiva]} onPress={() => setServico(item)}><Text style={[styles.opcaoTexto, servico?.id === item.id && styles.opcaoTextoAtiva]}>{item.nome}</Text>{servico?.id === item.id && <Check size={16} color={Colors.textoPrimario} />}</TouchableOpacity>)}</View>
        <Text style={styles.label}>Dias possíveis</Text>
        <View style={styles.chips}>{DIAS.map((dia) => <TouchableOpacity key={dia.id} style={[styles.chip, dias.includes(dia.id) && styles.chipAtivo]} onPress={() => alternar(dias, dia.id, setDias)}><Text style={[styles.chipTexto, dias.includes(dia.id) && styles.chipTextoAtivo]}>{dia.nome}</Text></TouchableOpacity>)}</View>
        <Text style={styles.label}>Horários possíveis</Text>
        <View style={styles.chips}>{HORARIOS.map((hora) => <TouchableOpacity key={hora} style={[styles.chip, horarios.includes(hora) && styles.chipAtivo]} onPress={() => alternar(horarios, hora, setHorarios)}><Text style={[styles.chipTexto, horarios.includes(hora) && styles.chipTextoAtivo]}>{hora}</Text></TouchableOpacity>)}</View>
        <Botao label={salvando ? 'Entrando...' : 'Entrar na lista'} onPress={entrar} desabilitado={salvando || !servico} estiloContainer={styles.botao} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.telaH, borderBottomWidth: 1, borderBottomColor: Colors.borda },
  titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.headingSm, color: Colors.textoPrimario },
  placeholder: { width: 24 },
  scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant, gap: Spacing.md },
  heading: { fontFamily: FontFamily.bold, fontSize: FontSize.displayMd, color: Colors.textoPrimario, textAlign: 'center' },
  descricao: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: Colors.textoSecundario, textAlign: 'center', marginBottom: Spacing.sm },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, color: Colors.textoSecundario, marginTop: Spacing.sm },
  opcoes: { gap: Spacing.xs },
  opcao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderRadius: Radii.sm, borderWidth: 1, borderColor: Colors.borda, backgroundColor: Colors.superficie },
  opcaoAtiva: { borderColor: Colors.vermelho, backgroundColor: Colors.vermelho },
  opcaoTexto: { fontFamily: FontFamily.medium, fontSize: FontSize.bodyMd, color: Colors.textoPrimario },
  opcaoTextoAtiva: { fontFamily: FontFamily.semiBold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.borda, backgroundColor: Colors.superficie },
  chipAtivo: { borderColor: Colors.vermelho, backgroundColor: Colors.vermelho },
  chipTexto: { fontFamily: FontFamily.medium, color: Colors.textoSecundario },
  chipTextoAtivo: { color: Colors.textoPrimario },
  botao: { width: '100%', marginTop: Spacing.md },
});
