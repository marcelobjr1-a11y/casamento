/* ============================================================
   ATELIÊ — Núcleo: estado, rotas, componentes, interações
   ============================================================ */

const STORE_KEY = "atelie.casamento.v1";

const App = {
  data: null,
  rota: "dashboard",
  param: null,
  carregando: false,
  filtros: {
    convidados: { busca:"", grupo:"todos", rsvp:"todos" },
    fornecedores:{ busca:"", cat:"todas", status:"todos", vista:"grade" },
    tarefas:     { busca:"", vista:"lista", resp:"todos", cat:"todas" },
    financeiro:  { vista:"resumo" },
    documentos:  { cat:"todas", busca:"" },
    inspiracoes: { cat:"todas" },
    mesas:       { selecionada:null }
  }
};

/* ---------------- persistência ---------------- */
function salvar(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(App.data)); }
  catch(e){ console.warn("Não foi possível salvar localmente.", e); }
}
function carregar(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      const d = JSON.parse(raw);
      if(d && d.versao === 1){
        if(d.casal && d.casal.fotoCasal === undefined) d.casal.fotoCasal = "assets/casal-sidebar.jpg";
        if(d.casal && d.casal.supabaseUrl === undefined){
          d.casal.supabaseUrl = ""; d.casal.supabaseKey = ""; d.casal.supabaseSenha = ""; d.casal.ultimaImportacao = "";
        }
        if(d.casal && d.casal.recado === undefined){
          Object.assign(d.casal, { recado:"", mapaUrl:"", endereco:"", dressCode:"", dressCores:[], dressObs:"",
            pixChave:"", pixTitular:"", fotoCapa:"", sitePublicadoEm:"" });
        }
        if(!GRUPOS.some(g => g.id === "site")) GRUPOS.push({ id:"site", nome:"Confirmados pelo site", qtd:0 });
        /* faixa etária por pessoa + acompanhantes com nome */
        (d.convidados || []).forEach(c => {
          if(c.faixa === undefined) c.faixa = c.tipo === "crianca" ? "crianca07" : "adulto";
          if(!Array.isArray(c.acompanhantes)){
            const n = Number(c.acompanhantes) || 0;
            c.acompanhantes = Array.from({ length:n }, () => ({ nome:"", faixa:"adulto" }));
          }
          delete c.tipo;
        });
        return d;
      }
    }
  }catch(e){ /* dados corrompidos: recomeça */ }
  return dadosIniciais();
}
function restaurarExemplo(){
  App.data = dadosIniciais();
  salvar();
  render();
  toast("Dados de exemplo restaurados.", "ok");
}

/* ---------------- utilitários ---------------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function money(v, compacto){
  const n = Number(v) || 0;
  if(compacto && n >= 1000) return "R$ " + (n/1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".",",") + "mil";
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits:0, maximumFractionDigits:0 });
}
function moneyF(v){
  return "R$ " + (Number(v)||0).toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const MESES_L = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS_L = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

function d2(n){ return String(n).padStart(2,"0"); }
function parseData(s){
  if(!s) return null;
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}
function hoje(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
function fmtData(s, longo){
  const d = parseData(s); if(!d) return "—";
  return longo ? `${d.getDate()} de ${MESES_L[d.getMonth()]} de ${d.getFullYear()}`
               : `${d2(d.getDate())} ${MESES[d.getMonth()]}`;
}
function fmtDataExt(s){
  const d = parseData(s); if(!d) return "—";
  return `${DIAS_L[d.getDay()]}, ${d.getDate()} de ${MESES_L[d.getMonth()]} de ${d.getFullYear()}`;
}
function diasAte(s){
  const d = parseData(s); if(!d) return 0;
  return Math.round((d - hoje()) / 86400000);
}
function prazoTexto(s){
  const n = diasAte(s);
  if(n === 0) return "hoje";
  if(n === 1) return "amanhã";
  if(n === -1) return "ontem";
  if(n < 0) return `atrasado ${Math.abs(n)}d`;
  if(n <= 30) return `em ${n} dias`;
  return fmtData(s);
}
/* ordem do roteiro: horas depois da meia-noite pertencem ao fim da festa */
/* soma N meses a uma data YYYY-MM-DD, preservando o dia (ajusta se o mês destino for mais curto) */
function somarMeses(dataStr, n){
  const d = parseData(dataStr); if(!d) return dataStr;
  const dia = d.getDate();
  const alvo = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(dia, ultimoDia));
  return `${alvo.getFullYear()}-${d2(alvo.getMonth()+1)}-${d2(alvo.getDate())}`;
}

function ordemHora(h){
  const [hh,mm] = String(h||"00:00").split(":").map(Number);
  const min = (hh||0)*60 + (mm||0);
  return hh < 5 ? min + 1440 : min;
}

function iniciais(nome){
  const p = String(nome||"").trim().split(/\s+/);
  if(p.length === 1) return (p[0].slice(0,2) || "");
  return ((p[0]||"")[0] || "") + ((p[p.length-1]||"")[0] || "");
}
function pct(a,b){ return b > 0 ? Math.round(a/b*100) : 0; }
function uid(p){ return p + Math.random().toString(36).slice(2,8); }
function slug(s){
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-");
}
function corAvatar(seed){
  const v = ["v1","v2","v3","v4","v5"];
  let h = 0; for(const ch of String(seed)) h = (h*31 + ch.charCodeAt(0)) % 997;
  return v[h % v.length];
}

/* ---------------- ícones ---------------- */
const ICONES = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  users:'<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.2"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.87"/><path d="M16.5 4.1a3.2 3.2 0 0 1 0 5.8"/>',
  table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  briefcase:'<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M2.5 12.5h19"/>',
  dollar:'<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M14.6 9.3c-.4-.8-1.4-1.3-2.6-1.3-1.5 0-2.6.8-2.6 1.9 0 2.6 5.4 1.3 5.4 4 0 1.2-1.2 2-2.8 2-1.3 0-2.4-.5-2.8-1.4"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  folder:'<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 18z"/>',
  heart:'<path d="M12 20s-7.5-4.7-7.5-9.7A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.9C19.5 15.3 12 20 12 20z"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 13H3.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10.2 3.5V3.4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z"/>',
  bell:'<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chevronRight:'<path d="m9 6 6 6-6 6"/>',
  chevronDown:'<path d="m6 9 6 6 6-6"/>',
  chevronLeft:'<path d="m15 6-6 6 6 6"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  edit:'<path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M13.5 6.5l3 3"/>',
  trash:'<path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6.5 7l.8 12A1.6 1.6 0 0 0 8.9 20.5h6.2A1.6 1.6 0 0 0 16.7 19l.8-12"/>',
  filter:'<path d="M4 5h16l-6.2 7.4V19l-3.6 1.8v-8.4z"/>',
  upload:'<path d="M12 15V4M8 7.5 12 3.5l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  download:'<path d="M12 4v11M8 11.5l4 4 4-4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  phone:'<path d="M21 16.5v2.6a1.9 1.9 0 0 1-2.1 1.9 18.6 18.6 0 0 1-8.1-2.9 18.3 18.3 0 0 1-5.6-5.6A18.6 18.6 0 0 1 2.3 4.3 1.9 1.9 0 0 1 4.2 2.2h2.6A1.9 1.9 0 0 1 8.7 3.8c.1.9.3 1.8.6 2.6a1.9 1.9 0 0 1-.4 2L7.7 9.6a15 15 0 0 0 5.6 5.6l1.2-1.2a1.9 1.9 0 0 1 2-.4c.8.3 1.7.5 2.6.6a1.9 1.9 0 0 1 1.6 1.9z"/>',
  mail:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
  pin:'<path d="M20 10.5c0 5.5-8 11.5-8 11.5s-8-6-8-11.5a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.3" r="2.8"/>',
  alert:'<path d="M10.3 3.9 2.6 17.1A1.9 1.9 0 0 0 4.3 20h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
  sparkle:'<path d="M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5L10.1 13l-5.6-2 5.6-2z"/><path d="M18.5 4v3M20 5.5h-3"/>',
  image:'<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.8-4.6a2 2 0 0 1 2.7 0L20 19.5"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
  arrowRight:'<path d="M4 12h15M13.5 6.5 20 12l-6.5 5.5"/>',
  send:'<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-8-8-4z"/>',
  card:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  columns:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  star:'<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
  printer:'<path d="M6 9V3.5h12V9"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 14h12v6.5H6z"/>',
  camera:'<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.7l1.3-2h6.9l1.3 2h2.8A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="12.8" r="3.4"/>',
  music:'<path d="M9 18V5.5l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/>',
  cake:'<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 16c1.6 1.4 3 1.4 4.5 0s3-1.4 4.5 0 3 1.4 4.5 0M12 8V4.5M8.5 8V6M15.5 8V6"/>',
  utensils:'<path d="M5 3v7a2.5 2.5 0 0 0 5 0V3M7.5 10v11M17 3c-1.5 1-2.5 3-2.5 5.5S15.5 13 17 13v8"/>',
  car:'<path d="M5.5 16.5h13M4 16.5v2.5h3v-2.5M17 16.5V19h3v-2.5"/><path d="M3.5 16.5v-4l2-5h13l2 5v4z"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
  shield:'<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/>',
  bulb:'<path d="M9.5 18h5M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  scissors:'<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M20 4 8.1 16.4M14.5 14.5 20 20M8.1 7.6 10.5 10"/>',
  flower:'<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c0-2.4-1-3.6-1-4.8a1 1 0 0 1 2 0c0 1.2-1 2.4-1 4.8zM14.4 12c2.4 0 3.6-1 4.8-1a1 1 0 0 1 0 2c-1.2 0-2.4-1-4.8-1zM12 14.4c0 2.4 1 3.6 1 4.8a1 1 0 0 1-2 0c0-1.2 1-2.4 1-4.8zM9.6 12c-2.4 0-3.6 1-4.8 1a1 1 0 0 1 0-2c1.2 0 2.4 1 4.8 1z"/>',
  glass:'<path d="M6 3h12l-1.5 6a4.5 4.5 0 0 1-9 0z"/><path d="M12 13.5V20M8.5 20h7"/>',
  ring:'<circle cx="12" cy="14" r="6"/><path d="m9 7 3-4 3 4"/><path d="M9 7h6"/>',
  gift:'<rect x="3" y="8.5" width="18" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5S11 4 8.6 4a2.3 2.3 0 0 0 0 4.5zM12 8.5S13 4 15.4 4a2.3 2.3 0 0 1 0 4.5z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-13.7-5.2L3.5 8.5"/><path d="M4 13a8 8 0 0 0 13.7 5.2l2.8-2.7"/><path d="M3.5 4v4.5H8M20.5 20v-4.5H16"/>',
  logout:'<path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9"/><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9"/>',
  copy:'<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  chat:'<path d="M20.5 12a8 8 0 0 1-11.6 7.1L3.5 20.5l1.4-5.4A8 8 0 1 1 20.5 12z"/>',
  userPlus:'<path d="M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="8.5" cy="7" r="3.2"/><path d="M19 8v6M22 11h-6"/>',
  church:'<path d="M12 2.5v5M9.5 5h5"/><path d="M12 7.5 5 12v9h14v-9z"/><path d="M9.5 21v-4.5a2.5 2.5 0 0 1 5 0V21"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  upload2:'<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'
};
function ico(nome, cls){
  const p = ICONES[nome] || ICONES.info;
  return `<svg viewBox="0 0 24 24" class="${cls||""}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}
const CAT_ICO = {
  "Espaço":"church","Buffet":"utensils","Cerimonial":"sparkle","Fotografia":"camera","Filmagem":"camera",
  "Decoração":"flower","DJ":"music","Banda":"music","Vestido":"scissors","Terno":"scissors","Beleza":"sparkle",
  "Convites":"mail","Flores":"flower","Bolo":"cake","Doces":"cake","Bebidas":"glass","Transporte":"car",
  "Segurança":"shield","Iluminação":"bulb","Outros":"more"
};

/* ---------------- navegação ---------------- */
const ROTAS = [
  { id:"dashboard",    nome:"Visão geral",  icone:"home" },
  { id:"convidados",   nome:"Convidados",   icone:"users" },
  { id:"rsvp",         nome:"RSVP",         icone:"mail" },
  { id:"mesas",        nome:"Mesas",        icone:"table" },
  { id:"fornecedores", nome:"Fornecedores", icone:"briefcase" },
  { id:"financeiro",   nome:"Financeiro",   icone:"dollar" },
  { id:"tarefas",      nome:"Tarefas",      icone:"checkCircle" },
  { id:"cronograma",   nome:"Cronograma",   icone:"calendar" },
  { id:"documentos",   nome:"Documentos",   icone:"folder" },
  { id:"inspiracoes",  nome:"Inspirações",  icone:"heart" },
  { id:"equipe",       nome:"Equipe",       icone:"userPlus" },
  { id:"siteconvite",  nome:"Site dos convidados", icone:"globe" },
  { id:"grandedia",    nome:"O grande dia", icone:"sparkle", especial:true },
  { id:"config",       nome:"Configurações",icone:"settings" }
];

function irPara(rota, param){
  const hash = "#/" + rota + (param ? "/" + param : "");
  if(location.hash === hash){ lerRota(); render(); }
  else location.hash = hash;
  document.body.classList.remove("nav-open");
}
function lerRota(){
  const partes = (location.hash || "#/dashboard").replace(/^#\//,"").split("/");
  const r = partes[0] || "dashboard";
  App.rota = ROTAS.some(x => x.id === r) ? r : "dashboard";
  App.param = partes[1] || null;
}

/* ---------------- faixas etárias e contagem de pessoas ---------------- */
/* peso = quanto a pessoa representa na cobrança do buffet
   (0-7 anos não paga; 8-10 paga meia, então 2 = 1 adulto) */
const FAIXAS = [
  { id:"adulto",     nome:"Adulto",           curto:"Adulto",   peso:1   },
  { id:"crianca07",  nome:"Criança 0 a 7",    curto:"0-7",      peso:0   },
  { id:"crianca810", nome:"Criança 8 a 10",   curto:"8-10",     peso:0.5 }
];
function faixa(id){ return FAIXAS.find(f => f.id === id) || FAIXAS[0]; }
function nomeFaixa(id){ return faixa(id).nome; }

/* devolve todas as pessoas de um convite: o titular + os acompanhantes */
function pessoasDoConvidado(c){
  const lista = [{ nome:c.nome, faixa:c.faixa || "adulto", titular:true }];
  (c.acompanhantes || []).forEach(a => lista.push({ nome:a.nome || "", faixa:a.faixa || "adulto", titular:false }));
  return lista;
}
/* quantas pessoas um convite representa (titular + acompanhantes) */
function qtdPessoas(c){ return 1 + (c.acompanhantes || []).length; }

/* resumo de um conjunto de convidados: total de pessoas, por faixa e o
   equivalente pagante para o buffet */
function resumoPessoas(convidados){
  const r = { total:0, adulto:0, crianca07:0, crianca810:0, equivalente:0 };
  convidados.forEach(c => pessoasDoConvidado(c).forEach(p => {
    r.total++;
    r[p.faixa] = (r[p.faixa] || 0) + 1;
    r.equivalente += faixa(p.faixa).peso;
  }));
  return r;
}

/* ---------------- cálculos globais ---------------- */
function metricas(){
  const d = App.data;
  const conv = d.convidados;
  const confirmados = conv.filter(c => c.rsvp === "confirmado");
  const pendentes   = conv.filter(c => c.rsvp === "pendente");
  const recusados   = conv.filter(c => c.rsvp === "recusado");
  const resumoTodos = resumoPessoas(conv);
  const resumoConfirmados = resumoPessoas(confirmados);
  const acomp = confirmados.reduce((a,c) => a + (c.acompanhantes||[]).length, 0);
  const acompTotal = conv.reduce((a,c) => a + (c.acompanhantes||[]).length, 0);

  const contratados = d.fornecedores.filter(f => f.status === "Contratado" || f.status === "Concluído");
  const valorContratado = contratados.reduce((a,f) => a + f.valor, 0);
  const valorPago = d.pagamentos.filter(p => p.status === "pago").reduce((a,p) => a + p.valor, 0);
  const aberto = d.pagamentos.filter(p => p.status !== "pago");
  const valorRestante = aberto.reduce((a,p) => a + p.valor, 0);

  const tarefasPend = d.tarefas.filter(t => t.status !== "concluido");
  const atrasadas = tarefasPend.filter(t => diasAte(t.prazo) < 0);
  const venc7 = aberto.filter(p => { const n = diasAte(p.venc); return n >= 0 && n <= 7; });
  const vencidos = aberto.filter(p => diasAte(p.venc) < 0);
  const contratosPend = d.documentos.filter(x => x.cat === "Contratos" && !x.assinado);
  const semMesa = confirmados.filter(c => !c.mesa);
  const marcosOk = d.marcos.filter(m => m.ok).length;

  return {
    total: conv.length, confirmados, pendentes, recusados, acomp, acompTotal,
    resumoTodos, resumoConfirmados,
    pessoas: resumoConfirmados.total,
    totalGeral: resumoTodos.total,
    contratados, valorContratado, valorPago, valorRestante,
    orcamento: d.casal.orcamento,
    aberto, venc7, vencidos, atrasadas,
    tarefasPend, tarefasFeitas: d.tarefas.length - tarefasPend.length,
    contratosPend, semMesa,
    progresso: pct(marcosOk, d.marcos.length), marcosOk,
    diasRestantes: diasAte(d.casal.data)
  };
}
/* texto da contagem regressiva, tratando data indefinida, o dia do casamento e datas passadas */
function contagem(){
  if(!App.data.casal.data) return { semData:true, num:null, rotulo:"", frase:"Defina a data do casamento" };
  const n = diasAte(App.data.casal.data);
  if(n > 1)  return { num:n, rotulo:"dias", frase:`Faltam <b>${n}</b> dias para o grande dia` };
  if(n === 1) return { num:1, rotulo:"dia",  frase:"Falta <b>1</b> dia para o grande dia" };
  if(n === 0) return { num:0, rotulo:"é hoje", frase:"<b>É hoje!</b> Que seja um dia lindo" };
  return { num:Math.abs(n), rotulo:"dias atrás", passado:true, frase:`O casamento foi há <b>${Math.abs(n)}</b> dias` };
}

/* monta o link do WhatsApp a partir de um telefone brasileiro e uma mensagem */
function linkWhatsApp(telefone, mensagem){
  let digitos = String(telefone||"").replace(/\D/g,"");
  if(!digitos) return null;
  if(digitos.length <= 11) digitos = "55" + digitos; // acrescenta o código do Brasil
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem||"")}`;
}
function abrirWhatsApp(telefone, mensagem){
  const link = linkWhatsApp(telefone, mensagem);
  if(!link){ toast("Este convidado não tem telefone cadastrado.","err"); return false; }
  window.open(link, "_blank", "noopener");
  return true;
}

/* mensagem pronta de lembrete de RSVP, personalizada por convidado */
function mensagemLembreteRSVP(convidado){
  const c = App.data.casal;
  const primeiroNome = String(convidado.nome||"").trim().split(/\s+/)[0];
  return `Oi ${primeiroNome}! Aqui é ${c.noiva} e ${c.noivo} 💛 Passando só pra lembrar de confirmar sua presença no nosso casamento — leva 1 minutinho! Se ainda não respondeu, dá uma olhadinha por aqui, tá? Obrigado!`;
}

function fornecedor(id){ return App.data.fornecedores.find(f => f.id === id); }
function pessoa(id){ return App.data.equipe.find(e => e.id === id); }
function nomeGrupo(id){
  const g = GRUPOS.find(x => x.id === id);
  return g ? g.nome : id;
}

/* ---------------- componentes ---------------- */
function avatarHTML(nome, cls, seed){
  return `<span class="avatar ${cls||""} ${corAvatar(seed || nome)}" title="${esc(nome)}">${esc(iniciais(nome).toUpperCase())}</span>`;
}
function avatarPessoa(id, cls){
  const p = pessoa(id);
  if(!p) return `<span class="avatar ${cls||""}">—</span>`;
  return `<span class="avatar ${cls||""} ${p.cor}" title="${esc(p.nome)} · ${esc(p.papel)}">${esc(iniciais(p.nome).toUpperCase())}</span>`;
}
function barra(valor, total, tom, espessura){
  const p = Math.min(100, pct(valor, total));
  return `<div class="bar ${tom||""} ${espessura||""}"><i style="width:${p}%"></i></div>`;
}
function badgeRSVP(s){
  if(s === "confirmado") return `<span class="badge ok"><i class="pip"></i>Confirmado</span>`;
  if(s === "recusado")   return `<span class="badge danger"><i class="pip"></i>Não vai</span>`;
  return `<span class="badge warn"><i class="pip"></i>Pendente</span>`;
}
function badgePrioridade(p){
  if(p === "alta")  return `<span class="badge danger">Alta</span>`;
  if(p === "media") return `<span class="badge warn">Média</span>`;
  return `<span class="badge">Baixa</span>`;
}
function badgeStatusForn(s){
  const m = { "Contratado":"ok", "Concluído":"info", "Em negociação":"warn", "Orçamento recebido":"gold", "Pesquisando":"" };
  return `<span class="badge ${m[s]||""}">${esc(s)}</span>`;
}
function badgePagamento(p){
  if(p.status === "pago") return `<span class="badge ok">Pago</span>`;
  if(diasAte(p.venc) < 0) return `<span class="badge danger">Atrasado</span>`;
  if(diasAte(p.venc) <= 7) return `<span class="badge warn">Em breve</span>`;
  return `<span class="badge">Pendente</span>`;
}
function vazio(icone, titulo, texto, botao){
  return `<div class="empty">
    <div class="empty-ico">${ico(icone)}</div>
    <h4 class="display">${esc(titulo)}</h4>
    <p>${esc(texto)}</p>
    ${botao || ""}
  </div>`;
}
function skeleton(){
  return `<div class="grid g-4 mb-20">${Array(4).fill(0).map(()=>`
    <div class="card card-pad"><div class="sk" style="width:42px;height:42px;border-radius:12px"></div>
    <div class="sk sk-line mt-16" style="width:55%"></div><div class="sk" style="height:28px;width:70%;margin-top:10px"></div></div>`).join("")}</div>
  <div class="dash-main"><div class="card card-pad" style="min-height:320px">
    ${Array(6).fill(0).map(()=>`<div class="sk sk-line" style="width:${60+Math.random()*35}%;height:14px;margin-bottom:16px"></div>`).join("")}
  </div><div class="card card-pad" style="min-height:320px">
    ${Array(5).fill(0).map(()=>`<div class="sk sk-line" style="width:${55+Math.random()*40}%;height:14px;margin-bottom:16px"></div>`).join("")}
  </div></div>`;
}
function anelProgresso(valor, legenda){
  const raio = 76, circ = 2 * Math.PI * raio;
  const off = circ - (valor/100) * circ;
  return `<div class="ring-wrap">
    <svg viewBox="0 0 180 180">
      <defs><linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#D9BC7F"/><stop offset="100%" stop-color="#A8874E"/>
      </linearGradient></defs>
      <circle class="ring-bg" cx="90" cy="90" r="${raio}"/>
      <circle class="ring-fg" cx="90" cy="90" r="${raio}" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="ring-center">
      <div class="pct">${valor}<sup>%</sup></div>
      <div class="t-xs t-muted" style="letter-spacing:.1em;text-transform:uppercase">${esc(legenda||"")}</div>
    </div>
  </div>`;
}
function donut(fatias, tamanho){
  const t = tamanho || 150, r = 60, cx = 75, cy = 75, circ = 2 * Math.PI * r;
  const total = fatias.reduce((a,f) => a + f.valor, 0) || 1;
  let acc = 0;
  const arcos = fatias.map(f => {
    const frac = f.valor / total;
    const dash = `${frac * circ} ${circ}`;
    const off = -acc * circ;
    acc += frac;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${f.cor}" stroke-width="18"
      stroke-dasharray="${dash}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"/>`;
  }).join("");
  return `<svg class="donut" viewBox="0 0 150 150" style="width:${t}px;height:${t}px">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F1ECE3" stroke-width="18"/>${arcos}</svg>`;
}

/* ---------------- modal ---------------- */
let modalAberto = null;
function modal({ titulo, sub, corpo, rodape, tamanho, aoAbrir }){
  fecharModal();
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.innerHTML = `<div class="modal ${tamanho||""}" role="dialog" aria-modal="true">
    <div class="modal-head">
      <div><h3>${titulo}</h3>${sub ? `<div class="sub">${sub}</div>` : ""}</div>
      <button class="modal-x" data-fechar aria-label="Fechar">${ico("x")}</button>
    </div>
    <div class="modal-body">${corpo}</div>
    ${rodape ? `<div class="modal-foot">${rodape}</div>` : ""}
  </div>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  modalAberto = wrap;
  wrap.addEventListener("click", e => {
    if(e.target === wrap || e.target.closest("[data-fechar]")) fecharModal();
  });
  const primeiro = wrap.querySelector("input,select,textarea");
  if(primeiro) setTimeout(() => primeiro.focus(), 60);
  if(aoAbrir) aoAbrir(wrap);
  return wrap;
}
function fecharModal(){
  if(modalAberto){ modalAberto.remove(); modalAberto = null; document.body.style.overflow = ""; }
}
function confirmar(titulo, texto, aoConfirmar, rotulo){
  modal({
    titulo, sub:"", tamanho:"narrow",
    corpo:`<p style="font-size:13.5px;color:var(--ink-3);line-height:1.6">${texto}</p>`,
    rodape:`<button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="btn-confirmar">${rotulo || "Confirmar"}</button>`,
    aoAbrir(w){ w.querySelector("#btn-confirmar").onclick = () => { fecharModal(); aoConfirmar(); }; }
  });
}

/* ---------------- toast ---------------- */
function toast(msg, tipo){
  let cx = $(".toasts");
  if(!cx){ cx = document.createElement("div"); cx.className = "toasts"; document.body.appendChild(cx); }
  const t = document.createElement("div");
  const icone = tipo === "err" ? "alert" : (tipo === "ok" ? "checkCircle" : "info");
  t.className = "toast " + (tipo || "info");
  t.innerHTML = ico(icone) + `<span>${esc(msg)}</span>`;
  cx.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 260); }, 3200);
}

/* ---------------- popover ---------------- */
let popAberto = null;
function popover(alvo, html, largura){
  fecharPop();
  const p = document.createElement("div");
  p.className = "pop";
  p.style.width = (largura || 230) + "px";
  p.innerHTML = html;
  document.body.appendChild(p);
  const r = alvo.getBoundingClientRect();
  const left = Math.min(r.left, window.innerWidth - (largura || 230) - 16);
  p.style.left = Math.max(12, left) + "px";
  p.style.top = (r.bottom + window.scrollY + 8) + "px";
  popAberto = p;
  setTimeout(() => {
    document.addEventListener("click", fecharPopUmaVez, { once:true });
  }, 10);
  return p;
}
function fecharPopUmaVez(){ fecharPop(); }
function fecharPop(){ if(popAberto){ popAberto.remove(); popAberto = null; } }

/* ---------------- busca global (⌘K) ---------------- */
function abrirBusca(){
  fecharModal();
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.innerHTML = `<div class="cmdk">
    <div class="cmdk-input">${ico("search")}
      <input id="cmdk-q" placeholder="Buscar convidados, fornecedores, tarefas…" autocomplete="off">
      <span class="kbd">esc</span>
    </div>
    <div class="cmdk-list" id="cmdk-list"></div>
  </div>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  modalAberto = wrap;
  wrap.addEventListener("click", e => { if(e.target === wrap) fecharModal(); });

  const inp = wrap.querySelector("#cmdk-q");
  const lista = wrap.querySelector("#cmdk-list");
  const desenhar = q => {
    const t = q.trim().toLowerCase();
    let html = "";
    if(!t){
      html = `<div class="cmdk-sec eyebrow">Ir para</div>` + ROTAS.map(r =>
        `<button class="cmdk-item" data-go="${r.id}">${ico(r.icone)}<span>${r.nome}</span></button>`).join("");
    } else {
      const secs = [];
      const conv = App.data.convidados.filter(c => c.nome.toLowerCase().includes(t)).slice(0,5);
      if(conv.length) secs.push([`Convidados`, conv.map(c =>
        `<button class="cmdk-item" data-go="convidados" data-busca="${esc(c.nome)}">${ico("users")}<span>${esc(c.nome)}</span><span class="meta">${nomeGrupo(c.grupo)}</span></button>`).join("")]);
      const forn = App.data.fornecedores.filter(f => f.nome.toLowerCase().includes(t) || f.cat.toLowerCase().includes(t)).slice(0,5);
      if(forn.length) secs.push([`Fornecedores`, forn.map(f =>
        `<button class="cmdk-item" data-go="fornecedores" data-detalhe="${f.id}">${ico(CAT_ICO[f.cat]||"briefcase")}<span>${esc(f.nome)}</span><span class="meta">${esc(f.cat)}</span></button>`).join("")]);
      const tar = App.data.tarefas.filter(x => x.titulo.toLowerCase().includes(t)).slice(0,5);
      if(tar.length) secs.push([`Tarefas`, tar.map(x =>
        `<button class="cmdk-item" data-go="tarefas" data-busca="${esc(x.titulo)}">${ico("checkCircle")}<span>${esc(x.titulo)}</span><span class="meta">${x.status==="concluido" ? "concluída" : prazoTexto(x.prazo)}</span></button>`).join("")]);
      const rt = ROTAS.filter(r => r.nome.toLowerCase().includes(t));
      if(rt.length) secs.push([`Páginas`, rt.map(r =>
        `<button class="cmdk-item" data-go="${r.id}">${ico(r.icone)}<span>${r.nome}</span></button>`).join("")]);
      html = secs.length
        ? secs.map(([t2,h]) => `<div class="cmdk-sec eyebrow">${t2}</div>${h}`).join("")
        : `<div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">Nada encontrado para “${esc(q)}”.</div>`;
    }
    lista.innerHTML = html;
  };
  desenhar("");
  inp.addEventListener("input", () => desenhar(inp.value));
  lista.addEventListener("click", e => {
    const b = e.target.closest("[data-go]"); if(!b) return;
    const rota = b.dataset.go;
    if(b.dataset.busca && App.filtros[rota]) App.filtros[rota].busca = b.dataset.busca;
    const det = b.dataset.detalhe;
    fecharModal();
    irPara(rota);
    if(det) setTimeout(() => abrirFornecedor(det), 120);
  });
  setTimeout(() => inp.focus(), 50);
}

/* ---------------- notificações ---------------- */
function abrirNotificacoes(alvo){
  const ns = App.data.notificacoes;
  const tomIco = { warn:"alert", danger:"alert", info:"info", ok:"checkCircle" };
  const html = `
    <div style="padding:14px 16px;border-bottom:1px solid var(--line-2)" class="between">
      <strong style="font-size:13px">Notificações</strong>
      <button class="link" data-marcar-lidas>Marcar como lidas</button>
    </div>
    <div style="max-height:330px;overflow-y:auto">
      ${ns.map(n => `
        <button class="pop-item" data-notif="${n.id}" style="align-items:flex-start;gap:11px;padding:12px 16px;${n.lida?"opacity:.55":""}">
          <span style="margin-top:2px;color:var(--${n.tipo==='warn'?'warn':n.tipo==='danger'?'danger':n.tipo==='ok'?'ok':'info'})">${ico(tomIco[n.tipo])}</span>
          <span style="min-width:0">
            <span style="display:block;font-size:12.5px;font-weight:520;line-height:1.35">${esc(n.titulo)}</span>
            <span style="display:block;font-size:11.5px;color:var(--muted);margin-top:2px">${esc(n.desc)}</span>
            <span style="display:block;font-size:10.5px;color:var(--muted-2);margin-top:4px">${esc(n.quando)}</span>
          </span>
        </button>`).join("")}
    </div>`;
  const p = popover(alvo, html, 320);
  p.addEventListener("click", e => {
    if(e.target.closest("[data-marcar-lidas]")){
      App.data.notificacoes.forEach(n => n.lida = true); salvar(); fecharPop(); render();
      toast("Notificações marcadas como lidas.","ok"); return;
    }
    const b = e.target.closest("[data-notif]"); if(!b) return;
    const n = App.data.notificacoes.find(x => x.id === b.dataset.notif);
    n.lida = true; salvar(); fecharPop(); irPara(n.rota);
  });
}

/* ---------------- sincronização com o site dos convidados (Supabase) ---------------- */
function siteConfigurado(){
  const c = App.data.casal;
  return !!(c.supabaseUrl && c.supabaseKey && c.supabaseSenha);
}
async function chamarRPCSite(nome, corpo){
  const c = App.data.casal;
  const resp = await fetch(`${c.supabaseUrl.replace(/\/$/,"")}/rest/v1/rpc/${nome}`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", apikey:c.supabaseKey, Authorization:`Bearer ${c.supabaseKey}` },
    body: JSON.stringify(corpo || {})
  });
  const texto = await resp.text();
  let dados; try{ dados = texto ? JSON.parse(texto) : null; }catch(_){ dados = texto; }
  if(!resp.ok){
    const msg = (dados && (dados.message || dados.error_description)) || "Não foi possível conectar ao site.";
    throw new Error(msg);
  }
  return dados;
}
/* redimensiona e comprime uma imagem no navegador, devolvendo um data URI JPEG leve */
/* ---------------- arquivos anexados (contratos, comprovantes) ---------------- */
/* os bytes ficam no IndexedDB (bem mais espaço que localStorage);
   só o nome/tamanho/categoria fica em App.data.documentos */
const ARQ_DB = "atelie_arquivos", ARQ_STORE = "arquivos";
function abrirArquivosDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(ARQ_DB, 1);
    req.onupgradeneeded = () => { if(!req.result.objectStoreNames.contains(ARQ_STORE)) req.result.createObjectStore(ARQ_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function salvarArquivoBlob(id, blob){
  const db = await abrirArquivosDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ARQ_STORE, "readwrite");
    tx.objectStore(ARQ_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function lerArquivoBlob(id){
  const db = await abrirArquivosDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ARQ_STORE, "readonly");
    const req = tx.objectStore(ARQ_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function excluirArquivoBlob(id){
  try{
    const db = await abrirArquivosDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(ARQ_STORE, "readwrite");
      tx.objectStore(ARQ_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }catch(e){ /* ignora — não é crítico */ }
}
function tipoArquivoPorNome(nome){
  const ext = (String(nome).split(".").pop()||"").toLowerCase();
  return ["jpg","jpeg","png","gif","webp","heic"].includes(ext) ? "img"
       : ["xls","xlsx","csv"].includes(ext) ? "xls"
       : ["doc","docx"].includes(ext) ? "doc" : "pdf";
}
function fmtTamanhoArquivo(bytes){
  if(!bytes) return "—";
  return bytes/1024/1024 >= 1 ? (bytes/1024/1024).toFixed(1)+" MB" : Math.max(1,Math.round(bytes/1024))+" KB";
}
/* guarda o arquivo de verdade + o registro em App.data.documentos; devolve o registro criado */
async function anexarArquivo(arquivo, extras){
  const id = uid("d");
  await salvarArquivoBlob(id, arquivo);
  const doc = {
    id, nome: (extras && extras.nome) || arquivo.name,
    cat: (extras && extras.cat) || "Outros",
    tipo: tipoArquivoPorNome((extras && extras.nome) || arquivo.name),
    tam: fmtTamanhoArquivo(arquivo.size),
    data: new Date().toISOString().slice(0,10),
    forn: (extras && extras.forn) || "",
    pagamento: (extras && extras.pagamento) || "",
    assinado: !!(extras && extras.assinado)
  };
  App.data.documentos.unshift(doc);
  salvar();
  return doc;
}
async function baixarArquivo(docId){
  const doc = App.data.documentos.find(d => d.id === docId); if(!doc) return;
  const blob = await lerArquivoBlob(docId);
  if(!blob){ toast("Este arquivo não tem os bytes salvos (documento de exemplo ou de uma versão anterior).","err"); return; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = doc.nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function arquivoParaFotoComprimida(arquivo, larguraMax){
  return new Promise((resolve, reject) => {
    if(!arquivo || !arquivo.type.startsWith("image/")){ reject(new Error("Escolha um arquivo de imagem.")); return; }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível abrir essa imagem."));
      img.onload = () => {
        const escala = Math.min(1, (larguraMax || 1400) / img.width);
        const w = Math.round(img.width * escala), h = Math.round(img.height * escala);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

async function importarRespostasSite(manual){
  if(!siteConfigurado()) return { ok:false, motivo:"não configurado" };
  try{
    const linhas = await chamarRPCSite("listar_respostas_site", { p_senha: App.data.casal.supabaseSenha });
    const novas = (linhas || []).filter(l => !l.importado && !App.data.convidados.some(c => c.origemSiteId === l.id));
    if(novas.length){
      novas.forEach(l => {
        const partes = [];
        if(l.mensagem) partes.push(`Recado: "${l.mensagem}"`);
        partes.push(`Confirmado pelo site em ${new Date(l.criado_em).toLocaleDateString("pt-BR")}`);
        /* o site informa só quantidades; as faixas etárias entram como
           adulto/criança e podem ser ajustadas depois no Ateliê */
        const totalPessoas = Math.max(1, l.quantidade_pessoas || 1);
        const criancas = Math.min(Math.max(0, l.criancas || 0), totalPessoas - 1);
        const acompanhantes = [];
        for(let i = 0; i < totalPessoas - 1; i++){
          acompanhantes.push({ nome:"", faixa: i < criancas ? "crianca07" : "adulto" });
        }
        if(criancas) partes.unshift(`${criancas} criança(s) informadas no site — confira a faixa etária`);
        App.data.convidados.unshift({
          id: uid("c"), origemSiteId: l.id,
          nome: l.nome, grupo: "site", faixa: "adulto",
          telefone: l.telefone || "",
          acompanhantes,
          rsvp: l.status === "confirmado" ? "confirmado" : "recusado",
          mesa: null, restricao: l.restricao || "", obs: partes.join(" · ")
        });
      });
      await chamarRPCSite("marcar_respostas_importadas", { p_senha: App.data.casal.supabaseSenha, p_ids: novas.map(l => l.id) });
      App.data.casal.ultimaImportacao = new Date().toISOString();
      salvar();
    }
    return { ok:true, novas: novas.length };
  }catch(err){
    return { ok:false, motivo: err.message };
  }
}
async function sincronizarSiteAoAbrir(){
  if(!siteConfigurado()) return;
  const r = await importarRespostasSite(false);
  if(r.ok && r.novas > 0){
    toast(`${r.novas} nova(s) resposta(s) do site importada(s) para os convidados.`, "ok");
    render();
  } else if(!r.ok){
    console.warn("Sincronização com o site dos convidados falhou:", r.motivo);
  }
}

/* ---------------- shell ---------------- */
function sidebarHTML(){
  const d = App.data, m = metricas(), c = contagem();
  const badges = { convidados:m.pendentes.length, tarefas:m.tarefasPend.length, financeiro:m.venc7.length + m.vencidos.length };
  return `
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">${esc(d.casal.noiva[0])}<span class="amp">&#10084;</span>${esc(d.casal.noivo[0])}</div>
      <div class="brand-sub">${esc(d.casal.noiva)} &amp; ${esc(d.casal.noivo)}</div>
      <div class="brand-rule"></div>
    </div>
    <nav class="nav">
      <div class="nav-group eyebrow">Casamento</div>
      ${ROTAS.slice(0,12).map(r => `
        <button class="nav-item ${App.rota===r.id?"active":""}" data-rota="${r.id}">
          ${ico(r.icone)}<span>${r.nome}</span>
          ${badges[r.id] ? `<span class="nav-badge">${badges[r.id]}</span>` : ""}
        </button>`).join("")}
      <div class="nav-group eyebrow">Dia do evento</div>
      ${ROTAS.slice(12).map(r => `
        <button class="nav-item ${App.rota===r.id?"active":""} ${r.especial?"is-special":""}" data-rota="${r.id}">
          ${ico(r.icone)}<span>${r.nome}</span>
        </button>`).join("")}
    </nav>
    <div class="sidebar-foot">
      <div class="countdown-card ${d.casal.fotoCasal?"has-photo":""}">
        ${d.casal.fotoCasal ? `<img class="cc-photo" src="${esc(d.casal.fotoCasal)}" alt="${esc(d.casal.nomeNoiva)} e ${esc(d.casal.nomeNoivo)}">` : ""}
        <div class="cc-body">
          ${c.semData ? `
            <div class="cc-label">Contagem regressiva</div>
            <button class="cc-set-date" data-rota="config">${ico("calendar")}Definir a data do casamento</button>
          ` : `
            <div class="cc-label">${c.num === 0 ? "O grande dia" : (c.passado ? "Faz" : "Faltam")}</div>
            <div class="cc-num">${c.num === 0 ? "&#10084;" : c.num}</div>
            <div class="cc-days">${c.passado ? "dias" : c.rotulo}</div>
            <div class="cc-date">${fmtData(d.casal.data, true)}</div>
            <div class="cc-heart">&#10084;</div>
          `}
        </div>
      </div>
    </div>
  </aside>`;
}
function topbarHTML(){
  const d = App.data;
  const naoLidas = d.notificacoes.filter(n => !n.lida).length;
  return `
  <header class="topbar">
    <button class="hamburger" data-menu aria-label="Menu">${ico("menu")}</button>
    <button class="searchbox" data-busca-global>
      ${ico("search")}<span>Buscar…</span><span class="kbd">⌘K</span>
    </button>
    <div class="topbar-spacer"></div>
    <button class="btn btn-primary" data-adicionar>${ico("plus")}<span>Adicionar</span></button>
    <button class="icon-btn" data-notificacoes aria-label="Notificações">
      ${ico("bell")}${naoLidas ? `<span class="dot">${naoLidas}</span>` : ""}
    </button>
    <button class="avatar-btn" data-perfil>
      <span class="who">${esc(d.casal.noiva)} &amp; ${esc(d.casal.noivo)}</span>
      ${avatarHTML(d.casal.noiva + " " + d.casal.noivo, "", "casal")}
    </button>
  </header>`;
}

/* ---------------- render ---------------- */
const VIEWS = {};
function render(){
  const app = $("#app");
  app.innerHTML = sidebarHTML() + `<div class="main">${topbarHTML()}<main class="view" id="view"></main></div>`
    + `<div class="sidebar-scrim" data-menu-fechar></div>`;
  const view = $("#view");
  const fn = VIEWS[App.rota] || VIEWS.dashboard;
  if(App.carregando){
    view.innerHTML = skeleton();
    setTimeout(() => { App.carregando = false; view.innerHTML = fn(); view.classList.add("fade-in"); if(POS_RENDER[App.rota]) POS_RENDER[App.rota](); }, 240);
  } else {
    view.innerHTML = fn();
    view.classList.add("fade-in");
    if(POS_RENDER[App.rota]) POS_RENDER[App.rota]();
  }
  window.scrollTo({ top:0 });
}
const POS_RENDER = {};

/* ---------------- menu "Adicionar" ---------------- */
function menuAdicionar(alvo){
  const itens = [
    ["Convidado","userPlus",() => abrirFormConvidado()],
    ["Fornecedor","briefcase",() => abrirFormFornecedor()],
    ["Tarefa","checkCircle",() => abrirFormTarefa()],
    ["Pagamento","card",() => abrirFormPagamento()],
    ["Evento no cronograma","clock",() => abrirFormEvento()],
    ["Mesa","table",() => abrirFormMesa()],
    ["Inspiração","heart",() => abrirFormInspiracao()],
    ["Documento","upload",() => abrirFormDocumento()]
  ];
  const p = popover(alvo, itens.map(([n,i],idx) =>
    `<button class="pop-item" data-add="${idx}">${ico(i)}<span>${n}</span></button>`).join(""), 240);
  p.addEventListener("click", e => {
    const b = e.target.closest("[data-add]"); if(!b) return;
    fecharPop(); itens[+b.dataset.add][2]();
  });
}
function menuPerfil(alvo){
  const d = App.data;
  const html = `
    <div style="padding:16px 16px 12px;border-bottom:1px solid var(--line-2)" class="center">
      ${avatarHTML(d.casal.noiva + " " + d.casal.noivo,"lg","casal")}
      <div style="min-width:0">
        <div style="font-size:13.5px;font-weight:550">${esc(d.casal.nomeNoiva)} &amp; ${esc(d.casal.nomeNoivo)}</div>
        <div class="t-xs t-muted">${esc(d.casal.local)} · ${esc(d.casal.cidade)}</div>
      </div>
    </div>
    <div style="padding:6px">
      <button class="pop-item" data-ir="config">${ico("settings")}<span>Configurações</span></button>
      <button class="pop-item" data-ir="equipe">${ico("userPlus")}<span>Equipe e permissões</span></button>
      <button class="pop-item" data-imprimir>${ico("printer")}<span>Imprimir esta página</span></button>
      <div class="pop-sep"></div>
      <button class="pop-item danger" data-restaurar>${ico("refresh")}<span>Restaurar dados de exemplo</span></button>
    </div>`;
  const p = popover(alvo, html, 290);
  p.addEventListener("click", e => {
    const ir = e.target.closest("[data-ir]");
    if(ir){ fecharPop(); irPara(ir.dataset.ir); return; }
    if(e.target.closest("[data-imprimir]")){ fecharPop(); window.print(); return; }
    if(e.target.closest("[data-restaurar]")){
      fecharPop();
      confirmar("Restaurar dados de exemplo",
        "Todas as alterações feitas por você serão apagadas e o sistema voltará ao conteúdo original de demonstração.",
        restaurarExemplo, "Restaurar");
    }
  });
}

/* ---------------- eventos globais ---------------- */
document.addEventListener("click", e => {
  const rota = e.target.closest("[data-rota]");
  if(rota){ App.carregando = true; irPara(rota.dataset.rota); return; }
  if(e.target.closest("[data-menu]")){ document.body.classList.toggle("nav-open"); return; }
  if(e.target.closest("[data-menu-fechar]")){ document.body.classList.remove("nav-open"); return; }
  if(e.target.closest("[data-busca-global]")){ abrirBusca(); return; }
  const not = e.target.closest("[data-notificacoes]");
  if(not){ e.stopPropagation(); abrirNotificacoes(not); return; }
  const add = e.target.closest("[data-adicionar]");
  if(add){ e.stopPropagation(); menuAdicionar(add); return; }
  const perf = e.target.closest("[data-perfil]");
  if(perf){ e.stopPropagation(); menuPerfil(perf); return; }
});

document.addEventListener("keydown", e => {
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); abrirBusca(); }
  if(e.key === "Escape"){ fecharModal(); fecharPop(); document.body.classList.remove("nav-open"); }
});

window.addEventListener("hashchange", () => { lerRota(); render(); });

/* ---------------- boot ---------------- */
function iniciar(){
  App.data = carregar();
  lerRota();
  render();
  sincronizarSiteAoAbrir();
}
document.addEventListener("DOMContentLoaded", iniciar);
