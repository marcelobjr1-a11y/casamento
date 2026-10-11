-- ============================================================
-- Ateliê / Convite — configuração do Supabase
-- Rode este script inteiro no Supabase: SQL Editor → New query → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) Respostas de RSVP enviadas pelo site
-- ------------------------------------------------------------
create table if not exists rsvp_respostas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  quantidade_pessoas int not null default 1,
  criancas int not null default 0,
  restricao text,
  mensagem text,
  status text not null default 'confirmado',
  criado_em timestamptz not null default now(),
  importado boolean not null default false
);

alter table rsvp_respostas enable row level security;
revoke all on rsvp_respostas from anon, authenticated;

-- convidado confirma ou recusa presença (chamada pública, sem senha)
create or replace function confirmar_presenca(
  p_nome text, p_telefone text, p_email text, p_quantidade int,
  p_criancas int, p_restricao text, p_mensagem text, p_status text
) returns uuid
language plpgsql security definer as $$
declare v_id uuid;
begin
  if p_nome is null or length(trim(p_nome)) < 2 then
    raise exception 'Informe o nome completo.';
  end if;
  if p_status not in ('confirmado','recusado') then
    p_status := 'confirmado';
  end if;
  insert into rsvp_respostas(nome, telefone, email, quantidade_pessoas, criancas, restricao, mensagem, status)
  values (trim(p_nome), nullif(trim(coalesce(p_telefone,'')),''), nullif(trim(coalesce(p_email,'')),''),
          greatest(coalesce(p_quantidade,1),1), greatest(coalesce(p_criancas,0),0),
          nullif(trim(coalesce(p_restricao,'')),''), nullif(trim(coalesce(p_mensagem,'')),''), p_status)
  returning id into v_id;
  return v_id;
end; $$;

grant execute on function confirmar_presenca(text,text,text,int,int,text,text,text) to anon;

-- ------------------------------------------------------------
-- 2) Lista de presentes (itens que os convidados podem reservar)
-- ------------------------------------------------------------
create table if not exists presentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  ordem int not null default 0,
  reservado boolean not null default false,
  reservado_por text,
  criado_em timestamptz not null default now()
);

alter table presentes enable row level security;
revoke all on presentes from anon, authenticated;

-- lista pública (não mostra quem reservou, só se já foi reservado)
create or replace function listar_presentes()
returns table(id uuid, nome text, descricao text, reservado boolean, ordem int)
language sql security definer as $$
  select id, nome, descricao, reservado, ordem from presentes order by ordem, nome;
$$;
grant execute on function listar_presentes() to anon;

-- convidado reserva um item (só funciona se ainda estiver livre)
create or replace function reservar_presente(p_id uuid, p_nome_convidado text)
returns boolean
language plpgsql security definer as $$
declare v_linhas int;
begin
  if p_nome_convidado is null or length(trim(p_nome_convidado)) < 2 then
    raise exception 'Informe seu nome para reservar.';
  end if;
  update presentes set reservado = true, reservado_por = trim(p_nome_convidado)
  where id = p_id and reservado = false;
  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end; $$;
grant execute on function reservar_presente(uuid,text) to anon;

-- alguns itens de exemplo — edite ou apague pelo painel.html
insert into presentes (nome, descricao, ordem) values
  ('Jogo de panelas', 'Um conjunto completo para os primeiros jantares em casa.', 1),
  ('Liquidificador', 'Para os sucos e vitaminas do dia a dia.', 2),
  ('Jogo de cama casal', 'Roupa de cama para o nosso quarto novo.', 3),
  ('Air fryer', 'Vai facilitar (e muito) a nossa rotina na cozinha.', 4),
  ('Kit churrasco', 'Para receber a família nos finais de semana.', 5),
  ('Vale-compras casa e decoração', 'Ajuda para montarmos os últimos detalhes da casa.', 6)
on conflict do nothing;

-- ------------------------------------------------------------
-- 3) Painel da noiva e do noivo — protegido por senha
--    TROQUE 'minha-senha-secreta' por uma senha sua antes de rodar!
-- ------------------------------------------------------------
create or replace function checar_senha_painel(p_senha text) returns void
language plpgsql as $$
begin
  if p_senha is null or p_senha <> 'minha-senha-secreta' then
    raise exception 'Senha incorreta.' using errcode = 'P0001';
  end if;
end; $$;

-- lista as respostas de RSVP (mais recentes primeiro)
create or replace function listar_respostas_site(p_senha text)
returns setof rsvp_respostas
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  return query select * from rsvp_respostas order by criado_em desc;
end; $$;
grant execute on function listar_respostas_site(text) to anon;

-- marca respostas como já importadas para o Ateliê
create or replace function marcar_respostas_importadas(p_senha text, p_ids uuid[])
returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  update rsvp_respostas set importado = true where id = any(p_ids);
end; $$;
grant execute on function marcar_respostas_importadas(text, uuid[]) to anon;

-- lista os presentes (com quem reservou, visível só no painel)
create or replace function admin_listar_presentes(p_senha text)
returns setof presentes
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  return query select * from presentes order by ordem, nome;
end; $$;
grant execute on function admin_listar_presentes(text) to anon;

-- cria ou atualiza um item da lista de presentes
create or replace function admin_salvar_presente(
  p_senha text, p_id uuid, p_nome text, p_descricao text, p_ordem int
) returns uuid
language plpgsql security definer as $$
declare v_id uuid;
begin
  perform checar_senha_painel(p_senha);
  if p_id is null then
    insert into presentes(nome, descricao, ordem) values (p_nome, p_descricao, coalesce(p_ordem,0))
    returning id into v_id;
  else
    update presentes set nome = p_nome, descricao = p_descricao, ordem = coalesce(p_ordem,0)
    where id = p_id;
    v_id := p_id;
  end if;
  return v_id;
end; $$;
grant execute on function admin_salvar_presente(text,uuid,text,text,int) to anon;

-- exclui um item da lista de presentes
create or replace function admin_excluir_presente(p_senha text, p_id uuid) returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  delete from presentes where id = p_id;
end; $$;
grant execute on function admin_excluir_presente(text, uuid) to anon;

-- libera de novo um item que foi reservado por engano
create or replace function admin_liberar_presente(p_senha text, p_id uuid) returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  update presentes set reservado = false, reservado_por = null where id = p_id;
end; $$;
grant execute on function admin_liberar_presente(text, uuid) to anon;
-- ============================================================
-- 4) Conteúdo do site dos convidados — editado pelo Ateliê,
--    lido publicamente pelo site (convite/index.html)
-- ============================================================
create table if not exists site_config (
  id smallint primary key default 1,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint site_config_singleton check (id = 1)
);

alter table site_config enable row level security;
revoke all on site_config from anon, authenticated;

-- leitura pública (o site dos convidados usa isso, sem senha)
create or replace function obter_site_config()
returns jsonb
language sql security definer as $$
  select dados from site_config where id = 1;
$$;
grant execute on function obter_site_config() to anon;

-- salvar/atualizar o conteúdo (só o Ateliê, com senha)
create or replace function salvar_site_config(p_senha text, p_dados jsonb)
returns void
language plpgsql security definer as $$
begin
  perform checar_senha_painel(p_senha);
  insert into site_config (id, dados, atualizado_em)
  values (1, p_dados, now())
  on conflict (id) do update set dados = excluded.dados, atualizado_em = now();
end; $$;
grant execute on function salvar_site_config(text, jsonb) to anon;


-- ============================================================
-- 5) Sincronização do Ateliê entre aparelhos
--    (a noiva e o noivo veem e editam os mesmos dados)
-- ============================================================
create table if not exists atelie_estado (
  id smallint primary key default 1,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint atelie_estado_singleton check (id = 1)
);

alter table atelie_estado enable row level security;
revoke all on atelie_estado from anon, authenticated;

-- devolve os dados salvos e o carimbo da última alteração (ou null se ainda não há nada)
create or replace function obter_estado_atelie(p_senha text)
returns jsonb
language plpgsql security definer as $$
declare r record;
begin
  perform checar_senha_painel(p_senha);
  select dados, atualizado_em into r from atelie_estado where id = 1;
  if not found then return null; end if;
  return jsonb_build_object('dados', r.dados, 'atualizado_em', r.atualizado_em);
end; $$;
grant execute on function obter_estado_atelie(text) to anon;

-- salva os dados; se outra pessoa salvou no meio tempo, recusa (a não ser que p_forcar = true)
create or replace function salvar_estado_atelie(
  p_senha text, p_dados jsonb, p_base timestamptz, p_forcar boolean default false
) returns jsonb
language plpgsql security definer as $$
declare atual timestamptz; novo timestamptz := now();
begin
  perform checar_senha_painel(p_senha);
  select atualizado_em into atual from atelie_estado where id = 1;
  if atual is not null and not coalesce(p_forcar, false) and (p_base is null or atual > p_base) then
    return jsonb_build_object('ok', false, 'atualizado_em', atual);
  end if;
  insert into atelie_estado (id, dados, atualizado_em) values (1, p_dados, novo)
  on conflict (id) do update set dados = excluded.dados, atualizado_em = novo;
  return jsonb_build_object('ok', true, 'atualizado_em', novo);
end; $$;
grant execute on function salvar_estado_atelie(text, jsonb, timestamptz, boolean) to anon;

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

-- ============================================================
-- Pronto! Agora:
-- 1. Troque 'minha-senha-secreta' (2 lugares acima) por uma senha sua
--    e rode o script de novo (Run) para aplicar a troca.
-- 2. Vá em Project Settings → API e copie a "Project URL" e a
--    "anon public key" (ou "publishable key").
-- 3. Cole os dois valores no arquivo convite/dados.js, em
--    SUPABASE_URL e SUPABASE_KEY.
-- ============================================================
