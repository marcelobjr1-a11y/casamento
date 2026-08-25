/* ============================================================
   Convite — informações do casamento
   Edite os valores abaixo para atualizar o site dos convidados.
   ============================================================ */

const EVENTO = {
  noiva:  "Karina",
  noivo:  "Marcelo",
  data:   "",   // AAAA-MM-DD, ex.: "2027-04-24"
  horaCerimonia: "",
  local:  "",
  endereco: "",
  cidade: "",
  mapaUrl: "",

  recado: "",

  dressCode: "",
  dressCores: [],
  dressObs: "",

  cronograma: [],

  /* chave Pix para quem preferir contribuir em dinheiro — deixe em branco para ocultar a seção */
  pix: {
    chave: "",
    nomeTitular: ""
  },

  /* sugestões de contribuição — apenas informativas, sem reserva */
  sugestoes: []
};

/* ============================================================
   Conexão com o Supabase — preencha depois de rodar o
   supabase-setup.sql (veja o passo a passo no LEIA-ME.md)
   ============================================================ */
const SUPABASE_URL = "";
const SUPABASE_KEY = "";
