import React from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, CalendarCheck, ChevronRight, Clock, ListPlus } from 'lucide-react-native';
import { Card, Botao } from '@/components';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useMeusAgendamentos } from '@/hooks/useMeusAgendamentos';
import { useAgendaSemanal, useNotificacoes } from '@/hooks/useAgendaSemanal';

export default function TelaHome() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();
  const { proximos } = useMeusAgendamentos();
  const { agenda, carregando: carregandoAgenda, ativarLembrete } = useAgendaSemanal();
  const { naoLidas } = useNotificacoes();
  const primeiroNome = perfil?.nome_completo?.split(' ')[0] || 'Bem-vindo';
  const proximo = proximos[0];
  const abertura = agenda?.data_abertura_programada
    ? new Date(agenda.data_abertura_programada).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Abertura em breve';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>BARBEARIA VIEIRA</Text>
        <TouchableOpacity style={styles.sino} activeOpacity={0.7} onPress={() => router.push('/(app)/notificacoes')}>
          <Bell size={22} color={Colors.textoPrimario} />
          {naoLidas > 0 && <View style={styles.badge}><Text style={styles.badgeTexto}>{naoLidas}</Text></View>}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.boasVindas}>
          <Text style={styles.titulo}>{carregandoPerfil ? 'Carregando...' : `Olá, ${primeiroNome}!`}</Text>
          <Text style={styles.subtitulo}>A sua agenda, mais simples.</Text>
        </View>
        <Card estilo={styles.card}>
          {proximo ? (
            <>
              <View style={styles.linha}><CalendarCheck size={24} color={Colors.verde} /><Text style={styles.cardTitulo}>Próximo atendimento</Text></View>
              <Text style={styles.cardData}>{new Date(proximo.data_hora).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.cardSubtitulo}>{proximo.servico.nome}</Text>
              <Botao label="Ver meus agendamentos" onPress={() => router.push('/(app)/(tabs)/agenda')} estiloContainer={styles.botao} />
            </>
          ) : agenda?.status === 'programada' ? (
            <>
              <View style={styles.linha}><Clock size={24} color={Colors.ouro} /><Text style={styles.cardTitulo}>Próxima agenda</Text></View>
              <Text style={styles.cardData}>{abertura}</Text>
              <Text style={styles.cardSubtitulo}>Ative um lembrete para saber quando os horários forem liberados.</Text>
              <Botao label="Ativar lembrete" onPress={async () => { if (!agenda) return; const resultado = await ativarLembrete(agenda.id); Alert.alert(resultado.error ? 'Não foi possível ativar' : 'Lembrete ativado', resultado.error?.message ?? 'Avisaremos quando a agenda abrir.'); }} estiloContainer={styles.botao} />
            </>
          ) : (
            <>
              <View style={styles.vazioIcone}><Clock size={32} color={Colors.textoDesabilitado} /><Text style={styles.cardTitulo}>{carregandoAgenda ? 'Consultando agenda...' : agenda?.status === 'aberta' ? 'A agenda está aberta' : 'A agenda desta semana lotou'}</Text></View>
              <Text style={styles.cardSubtitulo}>{agenda?.status === 'aberta' ? 'Escolha seu serviço e encontre um horário.' : 'Podemos avisar se surgir uma vaga.'}</Text>
              <Botao label={agenda?.status === 'aberta' ? 'Ver horários' : 'Entrar na fila de espera'} onPress={() => agenda?.status === 'aberta' ? router.push('/(app)/agendamento/horario') : router.push('/(app)/lista-espera')} iconeEsquerda={agenda?.status === 'aberta' ? undefined : <ListPlus size={18} color={Colors.textoPrimario} />} estiloContainer={styles.botao} />
            </>
          )}
        </Card>
        <TouchableOpacity style={styles.link} onPress={() => router.push('/(app)/(tabs)/agenda')} activeOpacity={0.7}>
          <Text style={styles.linkTexto}>Ver agenda completa</Text><ChevronRight size={16} color={Colors.vermelho} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.telaH, paddingVertical: Spacing.headerV, borderBottomWidth: 1, borderBottomColor: Colors.borda },
  logo: { fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd, color: Colors.textoPrimario, letterSpacing: 1.5 },
  sino: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.vermelho, alignItems: 'center', justifyContent: 'center' },
  badgeTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: 10 },
  scroll: { padding: Spacing.telaH, gap: Spacing.md, paddingBottom: Spacing.giant },
  boasVindas: { gap: 4 },
  titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.displayMd, color: Colors.textoPrimario },
  subtitulo: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: Colors.textoSecundario },
  card: { gap: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  vazioIcone: { alignItems: 'center', gap: Spacing.xs },
  cardTitulo: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyLg, color: Colors.textoPrimario },
  cardData: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyLg, color: Colors.textoPrimario, textTransform: 'capitalize' },
  cardSubtitulo: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: Colors.textoSecundario },
  botao: { width: '100%', marginTop: Spacing.xs },
  link: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: Spacing.xs },
  linkTexto: { fontFamily: FontFamily.medium, fontSize: FontSize.bodyMd, color: Colors.vermelho },
});
