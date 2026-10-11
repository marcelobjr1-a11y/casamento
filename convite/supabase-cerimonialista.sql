-- Rode este arquivo UMA vez no Supabase: SQL Editor → New query → cole tudo → Run.
-- (É a seção 6 do supabase-setup.sql — não precisa rodar o resto de novo.)

-- ============================================================
-- 6) Acesso da cerimonialista + contratos guardados na nuvem
--    A cerimonialista entra com uma senha própria e só VÊ os dados
--    (sem valores, parcelas nem comprovantes). Os arquivos anexados
--    passam a ficar no banco, para abrirem em qualquer aparelho.
-- ============================================================
create table if not exists atelie_cerimonial (
  id smallint primary key default 1,
  senha text,
  dados jsonb,
  atualizado_em timestamptz,
  constraint atelie_cerimonial_singleton check (id = 1)
);
alter table atelie_cerimonial enable row level security;
revoke all on atelie_cerimonial from anon, authenticated;

create table if not exists atelie_arquivos (
  id text primary key,
  nome text not null,
  tipo text,
  dados text not null,              -- conteúdo do arquivo em base64
  criado_em timestamptz not null default now()
);
alter table atelie_arquivos enable row level security;
revoke all on atelie_arquivos from anon, authenticated;

create or replace function checar_senha_cerimonial(p_senha text) returns void
language plpgsql security definer as $$
begin
  if p_senha is null or not exists (select 1 from atelie_cerimonial where id = 1 and senha = p_senha) then
    raise exception 'Senha incorreta.' using errcode = 'P0001';
  end if;
end; $$;

-- os noivos definem, consultam ou apagam a senha da cerimonialista
create or replace function definir_senha_cerimonial(p_senha text, p_nova text) returns void
language plpgsql security definer as $$
declare igual boolean := true;
begin
  perform checar_senha_painel(p_senha);
  if nullif(trim(p_nova), '') is not null then
    if length(trim(p_nova)) < 4 then raise exception 'Use uma senha com pelo menos 4 caracteres.' using errcode = 'P0001'; end if;
    begin perform checar_senha_painel(trim(p_nova)); exception when others then igual := false; end;
    if igual then raise exception 'Use uma senha diferente da senha do painel.' using errcode = 'P0001'; end if;
  end if;
  insert into atelie_cerimonial (id, senha) values (1, nullif(trim(p_nova), ''))
  on conflict (id) do update set senha = nullif(trim(p_nova), '');
end; $$;
grant execute on function definir_senha_cerimonial(text, text) to anon;

create or replace function obter_senha_cerimonial(p_senha text) returns text
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  return (select senha from atelie_cerimonial where id = 1);
end; $$;
grant execute on function obter_senha_cerimonial(text) to anon;

-- os aparelhos dos noivos guardam uma cópia SEM valores para a cerimonialista
create or replace function salvar_visao_cerimonial(p_senha text, p_dados jsonb) returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  insert into atelie_cerimonial (id, dados, atualizado_em) values (1, p_dados, now())
  on conflict (id) do update set dados = excluded.dados, atualizado_em = now();
end; $$;
grant execute on function salvar_visao_cerimonial(text, jsonb) to anon;

-- a cerimonialista lê essa cópia
create or replace function obter_visao_cerimonial(p_senha text) returns jsonb
language plpgsql security definer as $$
declare r record;
begin
  perform checar_senha_cerimonial(p_senha);
  select dados, atualizado_em into r from atelie_cerimonial where id = 1;
  if r.dados is null then return null; end if;
  return jsonb_build_object('dados', r.dados, 'atualizado_em', r.atualizado_em);
end; $$;
grant execute on function obter_visao_cerimonial(text) to anon;

-- arquivos (contratos, comprovantes…)
create or replace function salvar_arquivo_atelie(p_senha text, p_id text, p_nome text, p_tipo text, p_dados text) returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  insert into atelie_arquivos (id, nome, tipo, dados) values (p_id, p_nome, p_tipo, p_dados)
  on conflict (id) do update set nome = excluded.nome, tipo = excluded.tipo, dados = excluded.dados;
end; $$;
grant execute on function salvar_arquivo_atelie(text, text, text, text, text) to anon;

create or replace function remover_arquivo_atelie(p_senha text, p_id text) returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  delete from atelie_arquivos where id = p_id;
end; $$;
grant execute on function remover_arquivo_atelie(text, text) to anon;

-- quais arquivos já estão na nuvem (só os noivos)
create or replace function listar_arquivos_atelie(p_senha text) returns setof text
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  return query select id from atelie_arquivos;
end; $$;
grant execute on function listar_arquivos_atelie(text) to anon;

-- abre um arquivo: os noivos abrem qualquer um; a cerimonialista só os
-- que aparecem na cópia dela (contratos e documentos, nunca comprovantes)
create or replace function obter_arquivo_atelie(p_senha text, p_id text) returns jsonb
language plpgsql security definer as $$
declare r record; e_casal boolean := true;
begin
  begin perform checar_senha_painel(p_senha); exception when others then e_casal := false; end;
  if not e_casal then
    perform checar_senha_cerimonial(p_senha);
    if not exists (
      select 1 from atelie_cerimonial c, jsonb_array_elements(coalesce(c.dados->'documentos', '[]'::jsonb)) d
      where c.id = 1 and d->>'id' = p_id
    ) then
      raise exception 'Arquivo não disponível.' using errcode = 'P0001';
    end if;
  end if;
  select nome, tipo, dados into r from atelie_arquivos where id = p_id;
  if not found then return null; end if;
  return jsonb_build_object('nome', r.nome, 'tipo', r.tipo, 'dados', r.dados);
end; $$;
grant execute on function obter_arquivo_atelie(text, text) to anon;
