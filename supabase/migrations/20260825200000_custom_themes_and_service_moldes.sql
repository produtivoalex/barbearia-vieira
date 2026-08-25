-- Migration: Adicionar suporte a ícone, moldura externa e temas customizados nos serviços
begin;

alter table public.servicos add column if not exists icone text;
alter table public.servicos add column if not exists cor_moldura text;

comment on column public.servicos.icone is 'Identificador da imagem predefinida da biblioteca de serviços (ex: corte_degrade, barba_desenhada, combo_vip).';
comment on column public.servicos.cor_moldura is 'Cor hexadecimal personalizada da moldura externa do serviço (opcional; padrão usa a cor primária da barbearia).';

commit;
