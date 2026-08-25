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
-- Pronto! Agora:
-- 1. Troque 'minha-senha-secreta' (2 lugares acima) por uma senha sua
--    e rode o script de novo (Run) para aplicar a troca.
-- 2. Vá em Project Settings → API e copie a "Project URL" e a
--    "anon public key" (ou "publishable key").
-- 3. Cole os dois valores no arquivo convite/dados.js, em
--    SUPABASE_URL e SUPABASE_KEY.
-- ============================================================
