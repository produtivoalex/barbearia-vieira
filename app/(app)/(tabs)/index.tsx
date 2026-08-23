import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, BellRing, CalendarCheck, ChevronRight, Clock, ListPlus, Scissors, Calendar, AlertCircle } from 'lucide-react-native';
import { Card, Botao, LogoBarbearia } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useMeusAgendamentos } from '@/hooks/useMeusAgendamentos';
import { useAgendaSemanal, useNotificacoes } from '@/hooks/useAgendaSemanal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';

export default function TelaHome() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();
  const { proximos } = useMeusAgendamentos();
  const { agenda, carregando: carregandoAgenda, ativarLembrete } = useAgendaSemanal();
  const { naoLidas } = useNotificacoes();
  const { temPermissao, solicitarPermissao } = usePushNotifications();
  const [tardeFechadaHoje, setTardeFechadaHoje] = useState(false);

  useEffect(() => {
    async function checarAvisoTarde() {
      const hojeStr = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('avisos_funcionamento')
        .select('tarde_fechada')
        .eq('data', hojeStr)
        .eq('tarde_fechada', true)
        .maybeSingle();

      if (data?.tarde_fechada) {
        setTardeFechadaHoje(true);
      }
    }

    checarAvisoTarde();
  }, []);

  const primeiroNome = perfil?.nome_completo?.split(' ')[0] || 'Bem-vindo';
  const proximo = proximos[0];
  const abertura = agenda?.data_abertura_programada
    ? new Date(agenda.data_abertura_programada).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Abertura em breve';

  async function handleAtivarLembrete() {
    if (!agenda) return;
    if (!temPermissao) {
      await solicitarPermissao();
    }
    const resultado = await ativarLembrete(agenda.id);
    Alert.alert(
      resultado.error ? 'Não foi possível ativar' : 'Lembrete ativado! 💈',
      resultado.error?.message ?? 'Você receberá uma notificação assim que a agenda for aberta.'
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header com Logo Avatar Barbearia Vieira */}
      <View style={styles.header}>
        <View style={styles.headerEsquerda}>
          <LogoBarbearia tamanho={38} tipo="avatar" variante="compacto" />
          <View>
            <Text style={styles.logo}>BARBEARIA VIEIRA</Text>
            <Text style={styles.telefoneHeader}>(86) 98190-7478</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sino}
          activeOpacity={0.7}
          onPress={() => router.push('/(app)/notificacoes')}
        >
          <Bell size={22} color={Colors.textoPrimario} />
          {naoLidas > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{naoLidas}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Saudação limpa */}
        <View style={styles.boasVindas}>
          <Text style={styles.titulo}>
            {carregandoPerfil ? 'Carregando...' : `Olá, ${primeiroNome}!`}
          </Text>
          <Text style={styles.subtitulo}>A sua agenda, mais simples e rápida.</Text>
        </View>

        {/* Banner contextual de permissão de notificações se ainda não ativado */}
        {!temPermissao && (
          <View style={styles.bannerNotif}>
            <BellRing size={20} color={Colors.ouro} />
            <View style={styles.bannerNotifInfo}>
              <Text style={styles.bannerNotifTitulo}>Fique por dentro</Text>
              <Text style={styles.bannerNotifTexto}>
                Receba aviso de abertura da agenda e lembretes do seu corte.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bannerNotifBotao}
              onPress={solicitarPermissao}
              activeOpacity={0.8}
            >
              <Text style={styles.bannerNotifBotaoTexto}>Ativar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Banner de Aviso: Tarde Fechada (Ordem de Chegada) */}
        {tardeFechadaHoje && (
          <View style={styles.bannerTardeFechada}>
            <AlertCircle size={20} color={Colors.vermelho} />
            <View style={styles.bannerTardeInfo}>
              <Text style={styles.bannerTardeTitulo}>Aviso: Tarde Fechada Hoje</Text>
              <Text style={styles.bannerTardeTexto}>
                Informamos que a Barbearia Vieira estará fechada hoje na parte da tarde. Agradecemos a compreensão de todos!
              </Text>
            </View>
          </View>
        )}

        {/* Card Dinâmico Principal */}
        <Card estilo={styles.card}>
          {proximo ? (
            <>
              <View style={styles.linha}>
                <CalendarCheck size={24} color={Colors.verde} />
                <Text style={styles.cardTitulo}>Próximo atendimento</Text>
              </View>
              <Text style={styles.cardData}>
                {new Date(proximo.data_hora).toLocaleString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.cardSubtitulo}>{proximo.servico.nome}</Text>
              <Botao
                label="Ver meus agendamentos"
                onPress={() => router.push('/(app)/(tabs)/agenda')}
                estiloContainer={styles.botao}
              />
            </>
          ) : agenda?.status === 'programada' ? (
            <>
              <View style={styles.linha}>
                <Clock size={24} color={Colors.ouro} />
                <Text style={styles.cardTitulo}>Próxima agenda</Text>
              </View>
              <Text style={styles.cardData}>{abertura}</Text>
              <Text style={styles.cardSubtitulo}>
                Ative um lembrete para saber quando os horários forem liberados.
              </Text>
              <Botao
                label="Ativar lembrete"
                onPress={handleAtivarLembrete}
                estiloContainer={styles.botao}
              />
            </>
          ) : (
            <>
              <View style={styles.vazioIcone}>
                <Clock size={32} color={Colors.ouro} />
                <Text style={styles.cardTitulo}>
                  {carregandoAgenda
                    ? 'Consultando agenda...'
                    : agenda?.status === 'aberta'
                    ? 'A agenda está aberta'
                    : 'A agenda desta semana lotou'}
                </Text>
              </View>
              <Text style={styles.cardSubtitulo}>
                {agenda?.status === 'aberta'
                  ? 'Escolha seu serviço e reserve seu horário matinal.'
                  : 'Podemos avisar se surgir uma vaga na fila de espera.'}
              </Text>
              <Botao
                label={agenda?.status === 'aberta' ? 'Escolher Serviço' : 'Entrar na fila de espera'}
                onPress={() =>
                  agenda?.status === 'aberta'
                    ? router.push('/(app)/(tabs)/servicos')
                    : router.push('/(app)/lista-espera')
                }
                iconeEsquerda={
                  agenda?.status === 'aberta' ? (
                    <Scissors size={18} color={Colors.textoPrimario} />
                  ) : (
                    <ListPlus size={18} color={Colors.textoPrimario} />
                  )
                }
                estiloContainer={styles.botao}
              />
            </>
          )}
        </Card>

        {/* Atalhos Rápidos */}
        <View style={styles.atalhosGrid}>
          <TouchableOpacity
            style={styles.cardAtalho}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/(tabs)/servicos')}
          >
            <View style={styles.iconeAtalhoWrapper}>
              <Scissors size={20} color={Colors.ouro} />
            </View>
            <Text style={styles.atalhoTitulo}>Catálogo de Serviços</Text>
            <Text style={styles.atalhoDescricao}>14 opções reais com valores</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardAtalho}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/(tabs)/agenda')}
          >
            <View style={styles.iconeAtalhoWrapper}>
              <Calendar size={20} color={Colors.vermelho} />
            </View>
            <Text style={styles.atalhoTitulo}>Minha Agenda</Text>
            <Text style={styles.atalhoDescricao}>Próximos cortes e histórico</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.link}
          onPress={() => router.push('/(app)/(tabs)/agenda')}
          activeOpacity={0.7}
        >
          <Text style={styles.linkTexto}>Ver agenda completa</Text>
          <ChevronRight size={16} color={Colors.vermelho} />
        </TouchableOpacity>
      </ScrollView>
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
  headerEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    letterSpacing: 1.5,
  },
  telefoneHeader: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.ouro,
  },
  sino: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTexto: {
    color: Colors.textoPrimario,
    fontFamily: FontFamily.bold,
    fontSize: 9,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  boasVindas: { gap: 4 },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  card: {
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vazioIcone: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  cardData: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    textTransform: 'capitalize',
  },
  cardSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    lineHeight: 20,
  },
  botao: { width: '100%', marginTop: Spacing.xs },
  atalhosGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardAtalho: {
    flex: 1,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  iconeAtalhoWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  atalhoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
  },
  atalhoDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  link: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  linkTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.vermelho,
  },
  bannerNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.ouro,
    gap: Spacing.xs,
    ...Shadows.card,
  },
  bannerNotifInfo: {
    flex: 1,
  },
  bannerNotifTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  bannerNotifTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  bannerNotifBotao: {
    backgroundColor: Colors.ouro,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  bannerNotifBotaoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: '#0E0E0E',
  },
  bannerTardeFechada: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F1414',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.4)',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  bannerTardeInfo: {
    flex: 1,
    gap: 3,
  },
  bannerTardeTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#F87171',
  },
  bannerTardeTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#E0A0A0',
    lineHeight: 16,
  },
});
