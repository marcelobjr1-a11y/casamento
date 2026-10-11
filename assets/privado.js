/* ============================================================
   ATELIÊ — Modo privado (o "olhinho" no topo)
   Para tirar prints e gravar vídeos do sistema sem mostrar dados
   reais: troca nomes, telefones, fornecedores, valores e locais por
   dados fictícios. Os dados verdadeiros ficam guardados à parte e
   nada é salvo nem sincronizado enquanto o modo está ligado.
   ============================================================ */

const PRIV_KEY = "atelie.privado.v1";
const PRIV_NOMES = ["Ana","Beatriz","Camila","Daniela","Eduarda","Fernanda","Gabriela","Helena","Isabela","Juliana",
  "Larissa","Mariana","Natália","Olívia","Patrícia","Rafaela","Sofia","Tatiana","Valentina","Yasmin",
  "André","Bruno","Caio","Daniel","Eduardo","Felipe","Gustavo","Henrique","Igor","João",
  "Lucas","Marcos","Nicolas","Otávio","Pedro","Rafael","Samuel","Thiago","Vinícius","Rodrigo"];
const PRIV_SOBRENOMES = ["Almeida","Barbosa","Cardoso","Duarte","Esteves","Ferraz","Gomes","Holanda","Lacerda","Machado",
  "Nogueira","Oliveira","Pacheco","Queiroz","Ribeiro","Siqueira","Teixeira","Vasconcelos","Moura","Prado"];
const PRIV_MARCAS = ["Aurora","Bela Vista","Jardim","Lumière","Prime","Essência","Encanto","Luar","Vila Rosa","Estrela"];

function modoPrivado(){ return !!App.privado; }

/* número estável a partir de um texto (o mesmo id gera sempre o mesmo nome falso) */
function privHash(t){ let h = 7; for(const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function privNome(seed){
  const h = privHash(seed);
  return PRIV_NOMES[h % PRIV_NOMES.length] + " " + PRIV_SOBRENOMES[(h >> 7) % PRIV_SOBRENOMES.length];
}
const PRIV_TEL = "(11) 9••••-••••";

function mascararDados(real){
  const d = JSON.parse(JSON.stringify(real));
  const c = d.casal;
  c.local = c.local ? "Espaço do evento" : ""; c.cidade = c.cidade ? "Cidade" : "";
  /* data: troca por outra (o campo de Configurações não mostra a verdadeira) e as telas mostram •• */
  if(c.data){ const dt = parseData(c.data); dt.setDate(dt.getDate() + 41); c.data = `${dt.getFullYear()}-${d2(dt.getMonth()+1)}-${d2(dt.getDate())}`; }
  c.hora = "";
  c.endereco = ""; c.mapaUrl = ""; c.pixChave = ""; c.pixTitular = "";

  d.convidados.forEach(g => {
    g.nome = privNome(g.id);
    (g.acompanhantes || []).forEach((a,i) => { if(a.nome) a.nome = privNome(g.id + ":" + i); });
    if(g.telefone) g.telefone = PRIV_TEL;
    g.obs = "";
  });
  const nomeForn = {};
  d.fornecedores.forEach(f => {
    f.nome = `${f.cat} ${PRIV_MARCAS[privHash(f.id) % PRIV_MARCAS.length]}`;
    nomeForn[f.id] = f.nome;
    if(f.contato) f.contato = privNome(f.id + "contato").split(" ")[0];
    if(f.tel) f.tel = PRIV_TEL;
    f.email = ""; f.nota = ""; f.pixChave = ""; f.pixTitular = "";
    (f.equipeDia || []).forEach((p,i) => { if(p.nome) p.nome = privNome(f.id + "eq" + i).split(" ")[0]; });
  });
  d.documentos.forEach(doc => {
    const ext = (String(doc.nome).match(/\.[a-z0-9]+$/i) || [""])[0];
    doc.nome = `${doc.cat === "Contratos" ? "Contrato" : doc.cat === "Comprovantes" ? "Comprovante" : "Documento"}${doc.forn && nomeForn[doc.forn] ? " — " + nomeForn[doc.forn] : ""}${ext}`;
  });
  (d.equipe || []).forEach(p => { if(!/^(e1|e2)$/.test(p.id)) p.nome = privNome(p.id); p.tel = ""; p.email = ""; });
  (d.cronograma || []).forEach(e => { e.local = ""; e.obs = ""; });
  (d.pagamentos || []).forEach(p => { p.obs = ""; });
  /* valores: mesma proporção (barras e porcentagens continuam certas), números diferentes */
  const k = 1.37, esc$ = v => Math.round((Number(v) || 0) * k);
  c.orcamento = esc$(c.orcamento);
  d.fornecedores.forEach(f => { f.valor = esc$(f.valor); f.pago = esc$(f.pago); });
  (d.pagamentos || []).forEach(p => { p.valor = esc$(p.valor); });
  (d.orcamentoCats || []).forEach(o => { o.orcado = esc$(o.orcado); });
  if(d.caixaPadrinhos) (d.caixaPadrinhos.itens || []).forEach(i => { i.preco = esc$(i.preco); });
  d.notificacoes = [];
  d._mascarado = true;
  return d;
}

function ligarPrivado(ligar){
  if(ligar && !App.privado){
    App.dadosReais = App.data;
    App.data = mascararDados(App.data);
    App.privado = true;
  } else if(!ligar && App.privado){
    App.data = App.dadosReais || App.data;
    App.dadosReais = null;
    App.privado = false;
  }
  try{ localStorage.setItem(PRIV_KEY, App.privado ? "1" : ""); }catch(_){}
  if(typeof modalAberto !== "undefined" && modalAberto) fecharModal();
  if(typeof fecharPop === "function") fecharPop();
  render();
  toast(App.privado ? "Modo privado ligado — nomes, contatos e valores estão escondidos." : "Modo privado desligado.", "ok");
  if(!App.privado && typeof nuvemSincronizar === "function") nuvemSincronizar({});
}

/* chamado por salvar(): no modo privado nada é gravado */
let privAvisoEm = 0;
function privBloquear(){
  App.data = mascararDados(App.dadosReais);
  if(typeof modalAberto !== "undefined" && modalAberto) fecharModal();
  render();
  if(Date.now() - privAvisoEm > 2500){
    privAvisoEm = Date.now();
    toast("Modo privado: clique no olhinho do topo para voltar a editar.", "err");
  }
}

function privBotaoHTML(){
  return `<button class="icon-btn priv-btn ${App.privado ? "on" : ""}" data-privado
    title="${App.privado ? "Mostrar os dados (sair do modo privado)" : "Esconder nomes, contatos e valores (para prints)"}"
    aria-label="Modo privado">${ico(App.privado ? "eyeOff" : "eye")}</button>`;
}

document.addEventListener("click", e => {
  if(e.target.closest("[data-privado]")){ e.stopPropagation(); ligarPrivado(!App.privado); }
});

/* volta ligado se estava ligado antes de recarregar a página */
document.addEventListener("DOMContentLoaded", () => {
  let ligado = false;
  try{ ligado = localStorage.getItem(PRIV_KEY) === "1"; }catch(_){}
  if(ligado && App.data){
    App.dadosReais = App.data; App.data = mascararDados(App.data); App.privado = true; render();
  }
});
