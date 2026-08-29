import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, Clock, Star } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Shadows, Spacing, type ThemePalette } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Oferta {
  id: string;
  expira_em: string;
  status: 'pendente' | 'aceita' | 'recusada' | 'expirada';
  slot: { data_hora: string } | null;
  fila: { servico: { nome: string } | null } | null;
}

export default function TelaOfertaListaEspera() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { ofertaId } = useLocalSearchParams<{ ofertaId?: string }>();
  const { barbearia } = useBarbearia();
  const [oferta, setOferta] = useState<Oferta | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [aceitando, setAceitando] = useState(false);

  useEffect(() => {
    async function carregar() {
      if (!ofertaId) { setCarregando(false); return; }
      let consulta = supabase.from('ofertas_fila').select('id, expira_em, status, slot:slot_id(data_hora), fila:fila_espera_id(servico:servico_id(nome))').eq('id', ofertaId);
      if (barbearia?.id) consulta = consulta.eq('barbearia_id', barbearia.id);
      const { data } = await consulta.maybeSingle();
      const item = data as unknown as Oferta | null;
      setOferta(item);
      if (item) setSegundos(Math.max(0, Math.floor((new Date(item.expira_em).getTime() - Date.now()) / 1000)));
      setCarregando(false);
    }
    carregar();
  }, [ofertaId, barbearia?.id]);

  useEffect(() => {
    if (segundos <= 0) return;
    const timer = setInterval(() => setSegundos((atual) => Math.max(0, atual - 1)), 1000);
    return () => clearInterval(timer);
  }, [segundos]);

  async function aceitar() {
    if (!ofertaId || segundos <= 0) return;
    setAceitando(true);
    const { error } = await supabase.rpc('aceitar_oferta_fila', { p_oferta_id: ofertaId });
    setAceitando(false);
    if (error) Alert.alert('A oferta não está mais disponível', error.message);
    else Alert.alert('Horário confirmado', 'A vaga foi reservada para você.', [{ text: 'Ver agendamentos', onPress: () => router.replace('/(app)/(tabs)/agenda') }]);
  }

  const horario = oferta?.slot?.data_hora ? new Date(oferta.slot.data_hora).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Horário indisponível';
  const tempo = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {carregando ? (
          <Text style={styles.subtitulo}>Consultando oferta...</Text>
        ) : !oferta ? (
          <>
            <AlertCircle size={72} color={theme.erro} />
            <Text style={styles.titulo}>Oferta não encontrada</Text>
          </>
        ) : (
          <>
            <View style={styles.icone}>
              <Star size={72} color={theme.ouro} fill={theme.ouro} />
            </View>
            <Text style={styles.titulo}>
              {oferta.status === 'pendente' && segundos > 0 ? 'Horário disponível!' : 'Esta oferta expirou'}
            </Text>
            <Text style={styles.subtitulo}>
              {oferta.status === 'pendente' && segundos > 0
                ? 'A vaga foi reservada temporariamente para você.'
                : 'Você pode continuar na fila para receber outra oportunidade.'}
            </Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Quando</Text>
                <Text style={styles.valor}>{horario}</Text>
              </View>
              <View style={styles.divisor} />
              <View style={styles.row}>
                <Text style={styles.label}>Serviço</Text>
                <Text style={styles.valor}>{oferta.fila?.servico?.nome ?? 'Serviço'}</Text>
              </View>
            </View>
            {oferta.status === 'pendente' && segundos > 0 && (
              <View style={styles.timer}>
                <Clock size={18} color={theme.ouro} />
                <Text style={styles.timerTexto}>Expira em {tempo}</Text>
              </View>
            )}
            {oferta.status === 'pendente' && (
              <Botao
                label={aceitando ? 'Confirmando...' : 'Confirmar horário'}
                onPress={aceitar}
                desabilitado={aceitando || segundos <= 0}
                estiloContainer={styles.botao}
              />
            )}
            {oferta.status === 'aceita' && <CheckCircle size={42} color={theme.verde} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
    scroll: {
      flexGrow: 1,
      padding: Spacing.telaH,
      paddingBottom: Spacing.giant,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
    },
    icone: { marginBottom: Spacing.xs },
    titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.displayMd, color: theme.textoPrimario, textAlign: 'center' },
    subtitulo: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: theme.textoSecundario, textAlign: 'center' },
    card: {
      width: '100%',
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.xl,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
      ...Shadows.card,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: theme.textoSecundario },
    valor: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyMd, color: theme.textoPrimario, maxWidth: '65%', textAlign: 'right', textTransform: 'capitalize' },
    divisor: { height: 1, backgroundColor: theme.borda },
    timer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    timerTexto: { fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg, color: theme.ouroTexto },
    botao: { width: '100%' },
  });
