# Site dos convidados — passo a passo

Este é o site que você envia para os convidados. Ele tem as informações do
casamento, o formulário de confirmação de presença (RSVP) e a lista de
presentes. As respostas ficam guardadas num banco de dados gratuito
(Supabase) e aparecem sozinhas no seu painel principal (o Ateliê).

## O que tem nesta pasta

| Arquivo | O que é |
|---|---|
| `index.html` | O site que você manda para os convidados |
| `painel.html` | Uma telinha protegida por senha só para você: vê as respostas de RSVP e gerencia a lista de presentes |
| `dados.js` | As informações do casamento (data, local, roteiro, chave Pix...) — edite aqui |
| `supabase-setup.sql` | O script que cria o banco de dados — você roda **uma vez só** |
| `estilo.css` / `app.js` | O visual e o funcionamento do site — não precisa mexer |

## Passo 1 — Criar o banco de dados (Supabase)

1. Acesse **supabase.com** e crie uma conta gratuita (ou entre na que você já tem).
2. Clique em **New project**. Dê um nome (ex.: `casamento-ana-joao`), crie uma
   senha do banco (guarde ela, mas não é a mesma senha do painel) e escolha
   uma região perto do Brasil (ex.: São Paulo).
3. Espere o projeto ser criado (leva 1 ou 2 minutos).

## Passo 2 — Rodar o script

1. No menu da esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase-setup.sql` desta pasta, copie **tudo** e cole ali.
4. **Antes de rodar**, troque `minha-senha-secreta` (aparece 2 vezes no
   arquivo) pela senha que você quer usar para entrar no `painel.html`.
5. Clique em **Run** (ou aperte `Ctrl+Enter` / `Cmd+Enter`).
6. Deve aparecer "Success. No rows returned" — pronto, o banco está criado.

> Quer trocar a senha depois? Edite as 2 linhas de novo no SQL Editor e rode
> só aquele trecho de novo.

## Passo 3 — Conectar o site ao banco

1. No menu da esquerda do Supabase, clique em **Project Settings** (ícone de
   engrenagem) → **API**.
2. Copie o valor de **Project URL**.
3. Copie o valor de **anon public** (ou **publishable key**) — é uma chave
   longa, começa geralmente com `sb_` ou `eyJ`.
4. Abra o arquivo `dados.js` desta pasta e cole os dois valores nas linhas:
   ```js
   const SUPABASE_URL = "";   // cole a Project URL aqui
   const SUPABASE_KEY = "";   // cole a anon public key aqui
   ```
5. Salve o arquivo.

## Passo 4 — Conectar o Ateliê (o painel principal)

1. Abra o Ateliê (`index.html` da pasta principal) → **Configurações**.
2. Na seção **Site dos convidados**, cole a mesma URL e a mesma chave, e a
   senha que você definiu no Passo 2.
3. Clique em **Salvar conexão**.

Pronto — a partir de agora, toda vez que você abrir a tela de **Convidados**
ou **RSVP** no Ateliê, as novas respostas do site são buscadas e adicionadas
à sua lista sozinhas. Você também pode clicar em **Sincronizar agora**, em
Configurações, a qualquer momento.

Essa mesma conexão também é usada pela tela **Site dos convidados**, que
você vai usar no próximo passo para editar e publicar o conteúdo do site.

## Passo 5 — Editar as informações do casamento

Você **não precisa mais editar `dados.js` na mão**. Abra o Ateliê →
**Site dos convidados** e edite ali: recado, endereço, link do mapa,
dress code, cores, chave Pix e a foto de capa. A data, horário e local
do casamento continuam vindo de **Configurações**, e o roteiro do dia
continua vindo da tela **Cronograma** — edite nesses lugares e eles
aparecem automaticamente no site.

Depois de editar, clique em **Publicar** no topo da tela — as mudanças
vão direto para o site, sem precisar mexer no GitHub Desktop.

`dados.js` agora só guarda a conexão com o Supabase (a mesma do Passo 3).

Para editar a lista de presentes (adicionar, remover, liberar um item
reservado por engano), use o `painel.html` com a senha que você criou.

## Passo 6 — Colocar o site no ar

Assim como fizemos no Base Festival: publique esta pasta no GitHub Pages
(ou na Vercel) e envie o link para os convidados. O `painel.html` fica no
mesmo endereço, em `/painel.html` — só você tem a senha.

⚠️ **Atenção:** o `painel.html` não é telas de administração à prova de
tudo — qualquer pessoa com o link e a senha entra. Não compartilhe a senha
e evite deixar o link do painel em lugares públicos.

## Testando antes de enviar

Abra o `index.html` no navegador, preencha o formulário de RSVP com um nome
de teste e confirme. Depois abra o `painel.html`, entre com a senha e veja
se a resposta apareceu. Depois é só clicar em **Sincronizar agora** no
Ateliê para ver ela chegar na sua lista de convidados. Depois pode marcar
como "importado" ou apagar o teste diretamente no Ateliê.
