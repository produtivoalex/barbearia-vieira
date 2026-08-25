import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, Check, Globe, Lock, Plus, Sparkles, Store } from 'lucide-react-native';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

function gerarSlugAutomatico(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function CadastrarBarbearia() {
  const router = useRouter();
  const { session } = useAuth();
  const { selecionarBarbearia } = useBarbearia();

  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [publicada, setPublicada] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function handleNomeChange(valor: string) {
    setNome(valor);
    if (!slugEditadoManualmente) {
      setSlug(gerarSlugAutomatico(valor));
    }
  }

  function handleSlugChange(valor: string) {
    setSlugEditadoManualmente(true);
    setSlug(gerarSlugAutomatico(valor));
  }

  async function handleCadastrar() {
    if (!session?.user?.id) {
      Alert.alert('Não autenticado', 'Você precisa estar conectado para criar uma barbearia.');
      return;
    }

    const nomeLimpo = nome.trim();
    const slugLimpo = slug.trim();

    if (!nomeLimpo) {
      Alert.alert('Campo obrigatório', 'Informe o nome da nova barbearia.');
      return;
    }

    if (!slugLimpo) {
      Alert.alert('Identificador obrigatório', 'Informe um link/slug para o estabelecimento.');
      return;
    }

    setSalvando(true);

    try {
      // 1. Verifica se o slug já existe
      const { data: slugExistente } = await supabase
        .from('barbearias')
        .select('id')
        .eq('slug', slugLimpo)
        .maybeSingle();

      if (slugExistente) {
        Alert.alert(
          'Identificador já em uso',
          'O link/slug informado já está em uso por outro estabelecimento. Escolha uma variação (ex: ' +
            slugLimpo +
            '-1).'
        );
        setSalvando(false);
        return;
      }

      // 2. Insere a barbearia
      const { data: novaBarbearia, error: erroBarbearia } = await supabase
        .from('barbearias')
        .insert({
          nome: nomeLimpo,
          slug: slugLimpo,
          descricao: descricao.trim() || null,
          cidade: cidade.trim() || null,
          bairro: bairro.trim() || null,
          endereco: endereco.trim() || null,
          telefone: telefone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          publicada,
          status: 'ativa',
          tema: {
            primary: '#CBA14A',
            secondary: '#141416',
            background: '#0F0F10',
            text: '#FFFFFF',
            accent: '#F0D17D',
          },
          fotos: [],
        })
        .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status')
        .single();

      if (erroBarbearia || !novaBarbearia) {
        throw new Error(erroBarbearia?.message || 'Falha ao criar o registro do estabelecimento.');
      }

      // 3. Vincula o usuário autenticado como PROPRIETÁRIO
      const { error: erroMembro } = await supabase.from('barbearia_membros').insert({
        barbearia_id: novaBarbearia.id,
        usuario_id: session.user.id,
        papel: 'proprietario',
        ativo: true,
      });

      if (erroMembro) {
        console.warn('[CadastroBarbearia] Falha no vínculo de proprietário:', erroMembro.message);
      }

      // 4. Garante role barbeiro no perfil do usuário
      await supabase
        .from('perfis')
        .update({ role: 'barbeiro' })
        .eq('id', session.user.id);

      // 5. Cria serviços iniciais padrão para a barbearia nascer pronta para operar
      await supabase.from('servicos').insert([
        {
          barbearia_id: novaBarbearia.id,
          nome: 'Corte Degradê / Fade',
          descricao: 'Corte moderno com degradê perfeito na máquina e tesoura.',
          preco: 35.0,
          duracao_minutos: 30,
          ativo: true,
          ordem_exibicao: 1,
        },
        {
          barbearia_id: novaBarbearia.id,
          nome: 'Barba Completa',
          descricao: 'Modelagem de barba com toalha quente e finalização na navalha.',
          preco: 25.0,
          duracao_minutos: 30,
          ativo: true,
          ordem_exibicao: 2,
        },
        {
          barbearia_id: novaBarbearia.id,
          nome: 'Combo Corte + Barba',
          descricao: 'Serviço completo de cabelo e barba com acabamento premium.',
          preco: 55.0,
          duracao_minutos: 60,
          ativo: true,
          ordem_exibicao: 3,
        },
      ]);

      // 6. Seleciona a nova barbearia no contexto
      await selecionarBarbearia(novaBarbearia);

      Alert.alert(
        'Barbearia Criada com Sucesso! 💈',
        `O estabelecimento "${novaBarbearia.nome}" foi cadastrado. Você já é o proprietário e a barbearia está pronta para uso.`,
        [
          {
            text: 'Ir para o Painel',
            onPress: () => router.replace('/(app)/(barbeiro)/hoje'),
          },
        ]
      );
    } catch (err: any) {
      console.error('[CadastroBarbearia] Erro:', err);
      Alert.alert('Erro ao criar barbearia', err.message || 'Não foi possível cadastrar a barbearia.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBotao}>
          <ArrowLeft color={Colors.textoPrimario} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCentro}>
          <Text style={styles.headerTitulo}>Nova Barbearia</Text>
          <Text style={styles.headerSubtitulo}>Cadastrar estabelecimento</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Banner Informativo */}
        <View style={styles.bannerInfo}>
          <Building2 size={24} color={Colors.ouro} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerInfoTitulo}>Crie seu espaço na plataforma</Text>
            <Text style={styles.bannerInfoSub}>
              Você será automaticamente o Proprietário, com controle total de serviços, agenda, equipe e mídias.
            </Text>
          </View>
        </View>

        {/* Campos */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>IDENTIFICAÇÃO</Text>

          <Campo
            label="Nome da Barbearia *"
            value={nome}
            onChangeText={handleNomeChange}
            placeholder="Ex: Barbearia Imperial"
          />

          <Campo
            label="Link do Perfil (Slug Único) *"
            value={slug}
            onChangeText={handleSlugChange}
            placeholder="ex: barbearia-imperial"
            autoCapitalize="none"
          />

          <Campo
            label="Descrição / Apresentação"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            placeholder="Conte um pouco sobre sua barbearia, equipe e diferenciais..."
          />
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>LOCALIZAÇÃO</Text>

          <View style={styles.linhaDupla}>
            <View style={{ flex: 1 }}>
              <Campo label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Ex: Teresina" />
            </View>
            <View style={{ flex: 1 }}>
              <Campo label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Ex: Centro" />
            </View>
          </View>

          <Campo
            label="Endereço Completo"
            value={endereco}
            onChangeText={setEndereco}
            placeholder="Rua, número e ponto de referência"
          />
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>CONTATOS</Text>

          <View style={styles.linhaDupla}>
            <View style={{ flex: 1 }}>
              <Campo
                label="WhatsApp Comercial"
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="phone-pad"
                placeholder="(00) 90000-0000"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Campo
                label="Telefone Fixo"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                placeholder="(00) 0000-0000"
              />
            </View>
          </View>
        </View>

        {/* Publicação na Vitrine */}
        <View style={styles.cardPublicacao}>
          <View style={styles.cardPublicacaoHeader}>
            {publicada ? <Globe size={22} color={Colors.ouro} /> : <Lock size={22} color={Colors.textoSecundario} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardPublicacaoTitulo}>
                {publicada ? 'Publicar na Vitrine Imediatamente' : 'Manter em Rascunho / Privado'}
              </Text>
              <Text style={styles.cardPublicacaoSub}>
                {publicada
                  ? 'O estabelecimento ficará visível na busca pública de barbearias.'
                  : 'Ficará visível apenas para você enquanto personaliza serviços e fotos.'}
              </Text>
            </View>
            <Switch
              value={publicada}
              onValueChange={setPublicada}
              trackColor={{ false: Colors.borda, true: Colors.ouro }}
              thumbColor={Colors.branco}
            />
          </View>
        </View>

        {/* Botão de Envio */}
        <TouchableOpacity style={styles.botaoCadastrar} onPress={handleCadastrar} disabled={salvando}>
          {salvando ? (
            <ActivityIndicator color={Colors.fundo} size="small" />
          ) : (
            <>
              <Sparkles size={18} color={Colors.fundo} />
              <Text style={styles.botaoCadastrarTexto}>Criar Estabelecimento</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  multiline,
  ...props
}: {
  label: string;
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={Colors.textoDesabilitado}
      />
    </View>
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
  headerBotao: { padding: 4 },
  headerCentro: { alignItems: 'center' },
  headerTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg },
  headerSubtitulo: { color: Colors.ouro, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, marginTop: 2 },

  scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant, gap: Spacing.md },

  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
  },
  bannerInfoTitulo: { color: Colors.ouro, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  bannerInfoSub: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, marginTop: 2 },

  secao: { gap: Spacing.sm },
  secaoTitulo: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    letterSpacing: 1.5,
    marginTop: 4,
  },

  campo: { gap: 6 },
  campoLabel: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.borda,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    color: Colors.textoPrimario,
    paddingHorizontal: Spacing.md,
    fontFamily: FontFamily.regular,
  },
  inputMultiline: { minHeight: 85, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  linhaDupla: { flexDirection: 'row', gap: Spacing.sm },

  cardPublicacao: {
    borderWidth: 1,
    borderColor: Colors.borda,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  cardPublicacaoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardPublicacaoTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  cardPublicacaoSub: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, marginTop: 2 },

  botaoCadastrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  botaoCadastrarTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
});
