/* ============================================================
   Convite — conexão com o site
   O conteúdo (recado, roteiro, fotos, presentes) agora é editado
   dentro do Ateliê, na tela "Site dos convidados", e publicado
   direto para cá. Este arquivo só guarda a conexão com o banco
   de dados e um texto de reserva enquanto a página carrega.
   ============================================================ */

const EVENTO_PADRAO = {
  noiva: "Karina", noivo: "Marcelo",
  data: "", horaCerimonia: "", local: "", endereco: "", cidade: "", mapaUrl: "",
  recado: "",
  dressCode: "", dressCores: [], dressObs: "",
  cronograma: [],
  pix: { chave: "", nomeTitular: "" },
  fotoCapa: ""
};

/* ============================================================
   Conexão com o Supabase — preencha aqui, ou veja o passo a
   passo no LEIA-ME.md. É a mesma conexão usada no Ateliê,
   em Configurações → Site dos convidados.
   ============================================================ */
const SUPABASE_URL = "";
const SUPABASE_KEY = "";
