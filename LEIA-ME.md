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

## Onde ficam os dados

Tudo é salvo **no seu próprio navegador** (localStorage). Nada é enviado para a internet.

- Para guardar uma cópia: **Configurações → Exportar tudo (JSON)**
- Para voltar ao exemplo original: **Configurações → Restaurar dados de exemplo**
- Se você limpar os dados do navegador, o sistema volta ao exemplo

⚠️ **Contratos e comprovantes anexados** (em Fornecedores e Documentos)
também ficam só neste navegador/computador — não sincronizam entre
dispositivos nem vão para a nuvem. Se você usa o Ateliê em mais de um
computador, anexe os arquivos sempre no mesmo. Vale a pena baixar uma
cópia dos mais importantes de vez em quando (botão de baixar em cada
documento).

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
