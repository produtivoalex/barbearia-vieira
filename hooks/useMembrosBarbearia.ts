import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type PapelMembro = 'proprietario' | 'gestor' | 'barbeiro' | 'atendente';

export interface MembroBarbearia {
  id: string;
  barbearia_id: string;
  usuario_id: string;
  papel: PapelMembro;
  ativo: boolean;
  criado_em: string;
  perfil?: {
    id: string;
    nome_completo: string | null;
    email: string | null;
    telefone: string | null;
    role: string;
  } | null;
}

export function useMembrosBarbearia(barbeariaId?: string) {
  const [membros, setMembros] = useState<MembroBarbearia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarMembros = useCallback(async () => {
    if (!barbeariaId) {
      setMembros([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from('barbearia_membros')
        .select(`
          id,
          barbearia_id,
          usuario_id,
          papel,
          ativo,
          criado_em,
          perfil:perfis(id, nome_completo, email, telefone, role)
        `)
        .eq('barbearia_id', barbeariaId)
        .order('criado_em', { ascending: true });

      if (error) {
        setErro(error.message);
        setMembros([]);
      } else {
        const formatados = (data ?? []).map((item: any) => ({
          ...item,
          perfil: Array.isArray(item.perfil) ? item.perfil[0] ?? null : item.perfil ?? null,
        }));
        setMembros(formatados as MembroBarbearia[]);
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao buscar membros');
    } finally {
      setCarregando(false);
    }
  }, [barbeariaId]);

  useEffect(() => {
    carregarMembros();
  }, [carregarMembros]);

  /**
   * Verifica se a alteração pretendida preserva ao menos um proprietário ou gestor ativo no tenant.
   */
  const validarPreservacaoGestor = useCallback(
    (membroIdAlvo: string, novoPapel?: PapelMembro, novoStatus?: boolean): { valido: boolean; motivo?: string } => {
      const membroAlvo = membros.find((m) => m.id === membroIdAlvo);
      if (!membroAlvo) return { valido: true };

      const eGestorAtual = membroAlvo.ativo && ['proprietario', 'gestor'].includes(membroAlvo.papel);
      if (!eGestorAtual) return { valido: true };

      const outrosGestoresAtivos = membros.filter(
        (m) => m.id !== membroIdAlvo && m.ativo && ['proprietario', 'gestor'].includes(m.papel)
      );

      const perderaCondicaoDeGestor =
        novoStatus === false || (novoPapel && !['proprietario', 'gestor'].includes(novoPapel));

      if (perderaCondicaoDeGestor && outrosGestoresAtivos.length === 0) {
        return {
          valido: false,
          motivo:
            'A barbearia deve manter pelo menos um Proprietário ou Gestor ativo. Promova outro membro antes de alterar este vínculo.',
        };
      }

      return { valido: true };
    },
    [membros]
  );

  /**
   * Adiciona ou reativa um vínculo de membro no estabelecimento.
   */
  const adicionarMembro = async (usuarioId: string, papel: PapelMembro) => {
    if (!barbeariaId) throw new Error('Selecione uma barbearia ativa.');
    if (!usuarioId) throw new Error('Usuário obrigatório.');

    const { error } = await supabase.from('barbearia_membros').upsert(
      {
        barbearia_id: barbeariaId,
        usuario_id: usuarioId,
        papel,
        ativo: true,
      },
      { onConflict: 'barbearia_id,usuario_id' }
    );

    if (error) throw error;
    await carregarMembros();
  };

  /**
   * Altera o papel operacional de um membro.
   */
  const alterarPapel = async (membroId: string, novoPapel: PapelMembro) => {
    const validacao = validarPreservacaoGestor(membroId, novoPapel);
    if (!validacao.valido) {
      throw new Error(validacao.motivo);
    }

    const { error } = await supabase
      .from('barbearia_membros')
      .update({ papel: novoPapel })
      .eq('id', membroId);

    if (error) throw error;
    await carregarMembros();
  };

  /**
   * Ativa ou desativa o vínculo de um membro.
   */
  const alternarStatus = async (membroId: string, novoStatus: boolean) => {
    const validacao = validarPreservacaoGestor(membroId, undefined, novoStatus);
    if (!validacao.valido) {
      throw new Error(validacao.motivo);
    }

    const { error } = await supabase
      .from('barbearia_membros')
      .update({ ativo: novoStatus })
      .eq('id', membroId);

    if (error) throw error;
    await carregarMembros();
  };

  /**
   * Remove em definitivo o vínculo do membro.
   */
  const removerMembro = async (membroId: string) => {
    const validacao = validarPreservacaoGestor(membroId, undefined, false);
    if (!validacao.valido) {
      throw new Error(validacao.motivo);
    }

    const { error } = await supabase
      .from('barbearia_membros')
      .delete()
      .eq('id', membroId);

    if (error) throw error;
    await carregarMembros();
  };

  return {
    membros,
    carregando,
    erro,
    recarregar: carregarMembros,
    adicionarMembro,
    alterarPapel,
    alternarStatus,
    removerMembro,
    validarPreservacaoGestor,
  };
}
