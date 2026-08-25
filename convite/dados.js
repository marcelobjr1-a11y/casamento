/* ============================================================
   Convite — informações do casamento
   Edite os valores abaixo para atualizar o site dos convidados.
   ============================================================ */

const EVENTO = {
  noiva:  "Ana",
  noivo:  "João",
  data:   "2027-04-24",   // AAAA-MM-DD
  horaCerimonia: "18:00",
  local:  "Fazenda Vista Alegre",
  endereco: "Estrada da Vista Alegre, 1200 — Itu, SP",
  cidade: "Itu, SP",
  mapaUrl: "https://maps.google.com/?q=Fazenda+Vista+Alegre+Itu+SP",

  recado: "Depois de tanto sonhar juntos, chegou a hora de celebrar. Com muito carinho, convidamos vocês para estarem ao nosso lado no dia em que vamos dizer sim.",

  dressCode: "Traje esporte fino",
  dressCores: ["#F4EFE4","#D9CBA8","#8C7A5A","#3D4A3A","#17150F"],
  dressObs: "Evite branco e tons muito claros — esse dia é da noiva. A cerimônia é ao ar livre; recomendamos sapatos confortáveis para a grama e a areia.",

  cronograma: [
    { hora:"17:00", titulo:"Chegada dos convidados", sub:"Recepção com welcome drink" },
    { hora:"18:00", titulo:"Cerimônia", sub:"Jardim das oliveiras" },
    { hora:"19:30", titulo:"Recepção e coquetel", sub:"Varanda da fazenda" },
    { hora:"20:30", titulo:"Jantar", sub:"Salão principal" },
    { hora:"22:30", titulo:"Festa", sub:"Pista de dança até a madrugada" }
  ],

  /* chave Pix para quem preferir contribuir em dinheiro */
  pix: {
    chave: "ana.e.joao@email.com",
    nomeTitular: "Ana Marques Silva"
  },

  /* sugestões de contribuição — apenas informativas, sem reserva */
  sugestoes: [
    { titulo:"Lua de mel", desc:"Ajude a construir as memórias da nossa primeira viagem como casados." },
    { titulo:"Nosso primeiro lar", desc:"Toda ajuda conta para montarmos a casa dos nossos sonhos." },
    { titulo:"O jantar dos noivos", desc:"Um brinde especial só nosso, no fim de um dia tão cheio." }
  ]
};

/* ============================================================
   Conexão com o Supabase — preencha depois de rodar o
   supabase-setup.sql (veja o passo a passo no LEIA-ME.md)
   ============================================================ */
const SUPABASE_URL = "";
const SUPABASE_KEY = "";
