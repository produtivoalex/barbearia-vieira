import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { supabase } from '@/lib/supabase';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

export default function GestaoBarbearia() {
  const router = useRouter();
  const { barbearia, selecionarBarbearia } = useBarbearia();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [publicada, setPublicada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState<'logo' | 'banner' | 'fotos' | null>(null);

  useEffect(() => {
    if (!barbearia) return;
    setNome(barbearia.nome);
    setDescricao(barbearia.descricao ?? '');
    setCidade(barbearia.cidade ?? '');
    setBairro(barbearia.bairro ?? '');
    setEndereco(barbearia.endereco ?? '');
    setTelefone(barbearia.telefone ?? '');
    setWhatsapp(barbearia.whatsapp ?? '');
    setPublicada(barbearia.publicada === true);
  }, [barbearia]);

  async function salvar() {
    if (!barbearia || !nome.trim()) {
      Alert.alert('Dados incompletos', 'Informe o nome da barbearia.');
      return;
    }
    setSalvando(true);
    const { data, error } = await supabase
      .from('barbearias')
      .update({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
        endereco: endereco.trim() || null,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        publicada,
        status: publicada ? 'ativa' : 'ativa',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', barbearia.id)
      .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema')
      .single();
    setSalvando(false);
    if (error) {
      Alert.alert('Não foi possível salvar', error.message);
      return;
    }
    await selecionarBarbearia({ ...barbearia, ...data, publicada });
    Alert.alert('Barbearia atualizada', publicada ? 'O estabelecimento está visível na vitrine pública.' : 'O estabelecimento permanece privado.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  async function enviarMidia(tipo: 'logo' | 'banner' | 'fotos') {
    if (!barbearia) return;
    setEnviandoMidia(tipo);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: tipo !== 'fotos',
        aspect: tipo === 'banner' ? [16, 5] : [1, 1],
        quality: 0.9,
        allowsMultipleSelection: tipo === 'fotos',
        selectionLimit: tipo === 'fotos' ? 6 : 1,
      });
      if (resultado.canceled || !resultado.assets?.length) return;

      const urls: string[] = [];
      for (const [indice, asset] of resultado.assets.entries()) {
        const resposta = await fetch(asset.uri);
        if (!resposta.ok) throw new Error(`Não foi possível ler a imagem escolhida (${resposta.status}).`);
        const arquivo = await resposta.arrayBuffer();
        const extensao = asset.mimeType?.split('/')[1] || 'jpg';
        const caminho = `${barbearia.id}/${tipo}/${Date.now()}-${indice}.${extensao}`;
        const { error: erroUpload } = await supabase.storage
          .from('barbearia-media')
          .upload(caminho, arquivo, { contentType: asset.mimeType || 'image/jpeg', cacheControl: '3600', upsert: false });
        if (erroUpload) throw new Error(`Storage: ${erroUpload.message || 'inserção recusada'}`);
        urls.push(supabase.storage.from('barbearia-media').getPublicUrl(caminho).data.publicUrl);
      }

      if (tipo === 'fotos') {
        const fotosAtuais = Array.isArray(barbearia.fotos) ? barbearia.fotos.filter((foto): foto is string => typeof foto === 'string') : [];
        const fotos = [...fotosAtuais, ...urls];
        const { error: erroUpdate } = await supabase.from('barbearias').update({ fotos, atualizado_em: new Date().toISOString() }).eq('id', barbearia.id);
        if (erroUpdate) throw new Error(`Barbearia: ${erroUpdate.message || 'fotos não puderam ser salvas'}`);
        await selecionarBarbearia({ ...barbearia, fotos });
        Alert.alert('Fotos enviadas', `${urls.length} foto(s) adicionada(s) ao perfil.`);
      } else {
        const campo = tipo === 'logo' ? 'logo_url' : 'banner_url';
        const { error: erroUpdate } = await supabase.from('barbearias').update({ [campo]: urls[0], atualizado_em: new Date().toISOString() }).eq('id', barbearia.id);
        if (erroUpdate) throw new Error(`Barbearia: ${erroUpdate.message || 'URL não pôde ser salva'}`);
        await selecionarBarbearia({ ...barbearia, [campo]: urls[0] });
        Alert.alert('Mídia enviada', `${tipo === 'logo' ? 'Logo' : 'Banner'} salvo no perfil da barbearia.`);
      }
    } catch (err: any) {
      console.error('[GestaoBarbearia] falha no upload', { tipo, erro: err });
      Alert.alert('Falha no upload', err.message || err.error_description || JSON.stringify(err) || 'Não foi possível enviar a mídia.');
    } finally {
      setEnviandoMidia(null);
    }
  }

  if (!barbearia) {
    return <SafeAreaView style={styles.safe}><Text style={styles.vazio}>Selecione uma barbearia ativa primeiro.</Text></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><ArrowLeft color={Colors.textoPrimario} size={22} /></TouchableOpacity><Text style={styles.titulo}>Dados da barbearia</Text><View style={{ width: 22 }} /></View>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.ajuda}>Edite os dados comerciais do estabelecimento ativo.</Text>
      <Campo label="Nome" value={nome} onChangeText={setNome} />
      <Campo label="Descrição" value={descricao} onChangeText={setDescricao} multiline />
      <Campo label="Cidade" value={cidade} onChangeText={setCidade} />
      <Campo label="Bairro" value={bairro} onChangeText={setBairro} />
      <Campo label="Endereço" value={endereco} onChangeText={setEndereco} />
      <Campo label="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Campo label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
      <View style={styles.midiaCard}>
        <Text style={styles.label}>Identidade visual</Text>
        <Text style={styles.subtexto}>Escolha imagens da galeria para o Storage desta barbearia.</Text>
        <View style={styles.midiaAcoes}>
          <TouchableOpacity style={styles.midiaBotao} onPress={() => enviarMidia('logo')} disabled={enviandoMidia !== null}>
            <Text style={styles.midiaBotaoTexto}>{enviandoMidia === 'logo' ? 'Enviando...' : 'Enviar logo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.midiaBotao} onPress={() => enviarMidia('banner')} disabled={enviandoMidia !== null}>
            <Text style={styles.midiaBotaoTexto}>{enviandoMidia === 'banner' ? 'Enviando...' : 'Enviar banner'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.midiaBotao} onPress={() => enviarMidia('fotos')} disabled={enviandoMidia !== null}>
            <Text style={styles.midiaBotaoTexto}>{enviandoMidia === 'fotos' ? 'Enviando...' : 'Adicionar fotos'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.publicacao}><View style={styles.publicacaoTexto}><Text style={styles.label}>Publicar na vitrine</Text><Text style={styles.subtexto}>{publicada ? 'Clientes poderão encontrar esta barbearia.' : 'A barbearia ficará visível apenas para membros.'}</Text></View><Switch value={publicada} onValueChange={setPublicada} trackColor={{ false: Colors.borda, true: Colors.ouro }} thumbColor={Colors.branco} /></View>
      <TouchableOpacity style={styles.botao} onPress={salvar} disabled={salvando}><Save size={18} color={Colors.fundo} /><Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Text></TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}

function Campo({ label, multiline, ...props }: { label: string; multiline?: boolean; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'phone-pad' }) {
  return <View style={styles.campo}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.inputMultiline]} placeholderTextColor={Colors.textoDesabilitado} /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.telaH, borderBottomWidth: 1, borderBottomColor: Colors.borda },
  titulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg },
  scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant, gap: Spacing.md },
  ajuda: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  campo: { gap: 6 },
  label: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  input: { minHeight: 46, borderWidth: 1, borderColor: Colors.borda, borderRadius: Radii.md, backgroundColor: Colors.superficie, color: Colors.textoPrimario, paddingHorizontal: Spacing.md, fontFamily: FontFamily.regular },
  inputMultiline: { minHeight: 90, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  publicacao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.borda, borderRadius: Radii.md, backgroundColor: Colors.superficie, padding: Spacing.md },
  midiaCard: { gap: 8, borderWidth: 1, borderColor: Colors.borda, borderRadius: Radii.md, backgroundColor: Colors.superficie, padding: Spacing.md },
  midiaAcoes: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  midiaBotao: { flex: 1, alignItems: 'center', borderRadius: Radii.md, backgroundColor: Colors.fundo, borderWidth: 1, borderColor: Colors.ouro, paddingVertical: 11 },
  midiaBotaoTexto: { color: Colors.ouroClaro, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  publicacaoTexto: { flex: 1, gap: 4 },
  subtexto: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.ouro, borderRadius: Radii.md, padding: Spacing.md, marginTop: Spacing.sm },
  botaoTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  vazio: { color: Colors.textoPrimario, fontFamily: FontFamily.medium, padding: Spacing.telaH },
});
