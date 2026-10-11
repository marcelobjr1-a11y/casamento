# Ateliê — sistema de organização de casamentos

Sistema completo de gestão de casamentos para noivos e cerimonialistas.
Funciona direto no navegador, sem instalar nada.

## Como abrir

Dê dois cliques no arquivo `index.html`.
Ele abre no navegador e o sistema já vem com o casamento de exemplo (Karina & Marcelo) preenchido.

## O que tem dentro

| Tela | O que faz |
|---|---|
| **Visão geral** | O resumo do casamento: convidados, orçamento, fornecedores, tarefas, progresso, alertas e a linha do tempo do dia |
| **Convidados** | Lista completa com busca, filtros, RSVP, mesa e restrição alimentar. Exporta em CSV |
| **RSVP** | Taxa de resposta, quem ainda não respondeu e envio de lembretes |
| **Mesas** | Planta do salão. Arraste um convidado da lista da direita para dentro de uma mesa |
| **Fornecedores** | Ficha completa de cada fornecedor: contato, contrato, valores, pagamentos e documentos |
| **Financeiro** | Orçado x contratado x pago x restante, por categoria, e o controle de parcelas |
| **Tarefas** | Três formas de ver: lista, kanban (arrastando entre colunas) e calendário |
| **Cronograma** | O roteiro do dia, hora a hora, com local e responsável |
| **Documentos** | Contratos, comprovantes e orçamentos organizados por categoria |
| **Inspirações** | Painel de referências. Dá para colar o link de uma imagem em cada ideia |
| **Equipe** | Quem participa da organização e o nível de acesso de cada um |
| **Site dos convidados** | Edite o recado, endereço, dress code, Pix e a foto de capa do site que você envia aos convidados — clique em Publicar e as mudanças vão direto para lá |
| **O grande dia** | Modo simplificado para usar no dia do casamento (ative no botão dourado) |
| **Configurações** | Nomes, data, local, orçamento e backup dos dados |

## Atalhos

- `⌘K` (ou `Ctrl+K`) — busca geral em convidados, fornecedores e tarefas
- `Esc` — fecha qualquer janela aberta
- Botão **+ Adicionar** no topo — cria qualquer item de qualquer tela

## Usar em mais de um aparelho (a noiva e o noivo)

O Ateliê sincroniza os dados entre computadores e celulares. Em cada aparelho novo:

1. Abra o link do Ateliê — vai aparecer um aviso **"Já usa o Ateliê em outro aparelho?"**
2. Clique em **Conectar** e digite a **senha do painel** (a mesma do Supabase)
3. Pronto: os dados aparecem e tudo o que um alterar o outro vê em poucos segundos

O ícone de nuvem no topo mostra o estado: **verde** = sincronizado, **dourado** = enviando,
**vermelho** = sem conexão com o banco de dados. Se os dois mexerem no mesmo instante, o sistema
mostra os dois lados e pergunta qual vale.

Os contratos e comprovantes anexados também vão para a nuvem (até 10 MB cada) e abrem nos outros aparelhos.

## Acesso da cerimonialista

Em **Configurações → Acesso da cerimonialista**, clique em **Criar acesso**: o sistema cria uma senha
só para ela e monta a mensagem com o link para mandar pelo WhatsApp. Ela entra em
`https://marcelobjr1-a11y.github.io/casamento/?acesso=cerimonial`, escolhe **Sou a cerimonialista** e digita a senha.

- Ela **vê**: convidados, padrinhos e cortejo, mesas, fornecedores (contatos e status), contratos, tarefas, cronograma, inspirações.
- Ela **não vê**: valores, parcelas, orçamento, a tela Financeiro, comprovantes e orçamentos anexados — o sistema
  manda para ela uma cópia sem essas informações.
- É **só visualização**: ela não consegue alterar nada. Dá para trocar a senha ou desligar o acesso a qualquer momento.
- Precisa ter rodado o arquivo `convite/supabase-cerimonialista.sql` no Supabase (uma vez).

Para isso funcionar, o script `convite/supabase-setup.sql` precisa ter sido rodado (seção 5).
Uma rotina do GitHub (`.github/workflows/manter-banco-ativo.yml`) chama o banco a cada 3 dias
para o Supabase não pausar por falta de uso.

## WhatsApp: envio direto (Evolution API no Railway)

O save the date pode sair direto do WhatsApp de vocês, sem abrir conversa por conversa.
1. No Railway, publique o modelo **"Deploy Whatsapp API"** (Evolution API) e gere um domínio público.
2. Copie o domínio e a variável `AUTHENTICATION_API_KEY`.
3. No Ateliê: **Configurações → WhatsApp — envio direto → Conectar WhatsApp**, cole os dois e leia o QR Code
   no celular (WhatsApp → Aparelhos conectados).
4. Em **Save the date**, use **Enviar automaticamente**: as mensagens saem com 25 a 55 segundos de pausa entre elas.

Não é um recurso oficial do WhatsApp: mande em lotes pequenos (até ~40 por dia) para reduzir o risco de bloqueio.
A conexão fica salva só no aparelho onde foi feita.

## Onde ficam os dados

Tudo é salvo **no seu próprio navegador** (localStorage). Com a sincronização ligada (veja acima), uma cópia também fica no seu banco de dados do Supabase, para o outro aparelho enxergar.

- Para guardar uma cópia: **Configurações → Exportar tudo (JSON)**
- Para voltar ao exemplo original: **Configurações → Restaurar dados de exemplo**
- Se você limpar os dados do navegador, o sistema volta ao exemplo

**Contratos e comprovantes anexados** (em Fornecedores e Documentos) ficam
neste navegador e, com a sincronização ligada, uma cópia vai para o banco de
dados (arquivos de até 10 MB). Vale a pena baixar uma cópia dos mais
importantes de vez em quando (botão de baixar em cada documento).

## Site para os convidados

Na pasta `convite/` tem um site separado para você enviar aos convidados,
com as informações do casamento, confirmação de presença e lista de
presentes. As respostas ficam guardadas num banco de dados (Supabase) e
aparecem sozinhas aqui no Ateliê. Veja o passo a passo completo em
**`convite/LEIA-ME.md`** — leva uns 10 minutos para configurar.

## Arquivos

```
casamento/
├── index.html          página principal do Ateliê
├── assets/
│   ├── style.css       aparência (cores, fontes, espaçamentos)
│   ├── data.js         dados de exemplo do casamento
│   ├── core.js         estrutura: menu, busca, janelas, avisos
│   ├── views-1.js      telas: visão geral, convidados, RSVP, mesas
│   └── views-2.js      telas: fornecedores, financeiro, tarefas, cronograma,
│                       documentos, inspirações, equipe, grande dia, configurações
└── convite/             site para os convidados (veja convite/LEIA-ME.md)
    ├── index.html       o site que você envia
    ├── painel.html       telinha protegida por senha para você
    ├── dados.js          informações do casamento — edite aqui
    └── supabase-setup.sql  script do banco de dados (roda uma vez)
```

Para mudar o casal, a data ou o orçamento **do Ateliê**, use a tela
**Configurações** — não precisa mexer no código. Para mudar as informações
**do site dos convidados** (recado, endereço, dress code, Pix, foto de
capa), use a tela **Site dos convidados** dentro do próprio Ateliê e
clique em **Publicar** — não precisa mais editar arquivos nem usar o
GitHub Desktop para isso (só para atualizar o código do sistema em si).
