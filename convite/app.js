/* ============================================================
   Convite — comportamento do site
   ============================================================ */

const MESES_L = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS_L = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

function parseData(s){
  if(!s) return null;
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}
function fmtDataExt(s){ const d = parseData(s); if(!d) return ""; return `${DIAS_L[d.getDay()]}, ${d.getDate()} de ${MESES_L[d.getMonth()]} de ${d.getFullYear()}`; }
function fmtDataCurta(s){ const d = parseData(s); if(!d) return ""; return `${d.getDate()} de ${MESES_L[d.getMonth()]} de ${d.getFullYear()}`; }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

let EVENTO = { ...EVENTO_PADRAO, dressCores:[...EVENTO_PADRAO.dressCores], cronograma:[...EVENTO_PADRAO.cronograma], pix:{...EVENTO_PADRAO.pix} };

/* busca o conteúdo publicado pelo Ateliê; sem conexão, fica no texto de reserva */
async function carregarConteudoDoSite(){
  if(!supabaseConfigurado()) return;
  try{
    const dados = await chamarRPC("obter_site_config", {});
    if(dados && typeof dados === "object") EVENTO = { ...EVENTO_PADRAO, ...dados };
  }catch(err){ console.warn("Não foi possível carregar o conteúdo do site:", err.message); }
}

/* ---------- preenche o conteúdo a partir de EVENTO ---------- */
function preencherConteudo(){
  const e = EVENTO;
  $("#hero-foto").src = e.fotoCapa || "hero-foto.jpg";
  document.title = e.data ? `${e.noiva} & ${e.noivo} — ${fmtDataCurta(e.data)}` : `${e.noiva} & ${e.noivo}`;
  $("#hero-nomes").innerHTML = `${esc(e.noiva)} <span class="amp">&#10084;</span> ${esc(e.noivo)}`;
  $("#tb-mark").innerHTML = `${esc(e.noiva[0])}&nbsp;&#10084;&nbsp;${esc(e.noivo[0])}`;
  $("#hero-data").textContent = e.data
    ? `${fmtDataCurta(e.data)}${e.local ? ` — ${e.local}, ${e.cidade}` : ""}`
    : "Data e local em breve";
  if(e.recado){
    $("#recado-texto").textContent = e.recado;
    $("#recado-assinatura").textContent = `${e.noiva} & ${e.noivo}`;
  } else {
    $("#sec-recado").style.display = "none";
  }

  $("#d-data").textContent = e.data ? fmtDataCurta(e.data).replace(/^\w/, c => c.toUpperCase()) : "A definir";
  $("#d-data-sub").textContent = e.data ? fmtDataExt(e.data).replace(/^\w/, c => c.toUpperCase()) : "Em breve avisamos a data certinha";
  $("#d-hora").textContent = e.horaCerimonia ? `Cerimônia às ${e.horaCerimonia}` : "Horário a definir";
  $("#d-local").textContent = e.local || "Local a definir";
  $("#d-endereco").textContent = e.endereco || "Em breve avisamos o endereço completo";
  if(e.mapaUrl){ $("#d-mapa").href = e.mapaUrl; } else { $("#d-mapa").style.display = "none"; }

  if(e.cronograma.length){
    $("#rt-line").innerHTML = e.cronograma.map(it => `
      <div class="rt-item">
        <div class="rt-time">${esc(it.hora)}</div>
        <div class="rt-rail"><span class="rt-dot"></span></div>
        <div class="rt-body">
          <div class="rt-title">${esc(it.titulo)}</div>
          <div class="rt-sub">${esc(it.sub)}</div>
        </div>
      </div>`).join("");
  } else {
    $("#rt-line").innerHTML = `<p style="text-align:center;color:var(--muted);font-size:13px">O roteiro do dia será divulgado em breve.</p>`;
  }

  if(e.dressCode || e.dressObs || e.dressCores.length){
    $("#dress-titulo").textContent = e.dressCode || "Dress code";
    $("#dress-obs").textContent = e.dressObs;
    $("#dress-swatches").innerHTML = e.dressCores.map(c => `<span class="sw" style="background:${c}"></span>`).join("");
  } else {
    $("#sec-dress").style.display = "none";
  }

  if(e.pix && e.pix.chave){
    $("#pix-chave").textContent = e.pix.chave;
    $("#pix-titular").textContent = e.pix.nomeTitular ? `Titular: ${e.pix.nomeTitular}` : "";
  } else {
    $("#pix-card").style.display = "none";
  }

  $("#foot-mark").innerHTML = `${esc(e.noiva[0])} &#10084; ${esc(e.noivo[0])}`;
  $("#foot-data").textContent = e.data
    ? `${fmtDataCurta(e.data)}${e.local ? ` · ${e.local}, ${e.cidade}` : ""}`
    : `${e.noiva} & ${e.noivo}`;
}

/* ---------- contagem regressiva ---------- */
function atualizarContagem(){
  const alvo = parseData(EVENTO.data);
  if(!alvo){ $("#hero-count").innerHTML = ""; return; }
  const agora = new Date();
  let diff = Math.max(0, alvo - agora);
  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  $("#hero-count").innerHTML = [
    [dias, "dias"], [horas, "horas"], [min, "min"]
  ].map(([v,l]) => `<div class="hc-item"><b>${v}</b><span>${l}</span></div>`).join("");
}

/* ---------- topo com sombra ao rolar ---------- */
function iniciarTopbar(){
  const tb = $("#topbar");
  const onScroll = () => tb.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive:true });
}

/* ---------- utilitários ---------- */
function $(s, r){ return (r||document).querySelector(s); }
function $$(s, r){ return Array.from((r||document).querySelectorAll(s)); }
let toastTimer;
function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}
function supabaseConfigurado(){
  return !!(typeof SUPABASE_URL !== "undefined" && SUPABASE_URL && SUPABASE_KEY);
}
async function chamarRPC(nome, corpo){
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(corpo || {})
  });
  const texto = await resp.text();
  let dados; try{ dados = texto ? JSON.parse(texto) : null; }catch(_){ dados = texto; }
  if(!resp.ok){
    const msg = (dados && (dados.message || dados.error_description || dados.hint)) || "Não foi possível completar a ação.";
    throw new Error(msg);
  }
  return dados;
}

/* ---------- formulário de RSVP ---------- */
function iniciarRSVP(){
  let vaiComparecer = true;
  const btnVai = $("#btn-vai"), btnNao = $("#btn-nao-vai"), bloco = $("#bloco-presenca");

  btnVai.addEventListener("click", () => {
    vaiComparecer = true;
    btnVai.classList.add("active"); btnNao.classList.remove("active");
    bloco.style.display = "";
  });
  btnNao.addEventListener("click", () => {
    vaiComparecer = false;
    btnNao.classList.add("active"); btnVai.classList.remove("active");
    bloco.style.display = "none";
  });

  $("#form-rsvp").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nome = $("#rf-nome").value.trim();
    if(nome.length < 2){ mostrarMsg("Por favor, preencha seu nome completo.", "err"); return; }

    if(!supabaseConfigurado()){
      mostrarMsg("O site ainda não está conectado ao banco de dados — fale com quem está organizando o casamento.", "err");
      return;
    }

    const btn = $("#btn-enviar");
    btn.disabled = true;
    $("#btn-enviar-texto").innerHTML = `<span class="spinner"></span>`;

    try{
      await chamarRPC("confirmar_presenca", {
        p_nome: nome,
        p_telefone: $("#rf-tel").value.trim(),
        p_email: $("#rf-email").value.trim(),
        p_quantidade: vaiComparecer ? Number($("#rf-qtd").value) : 1,
        p_criancas: vaiComparecer ? Number($("#rf-criancas").value) : 0,
        p_restricao: vaiComparecer ? $("#rf-restricao").value.trim() : "",
        p_mensagem: $("#rf-mensagem").value.trim(),
        p_status: vaiComparecer ? "confirmado" : "recusado"
      });
      $("#form-rsvp").style.display = "none";
      $("#rsvp-done-titulo").textContent = vaiComparecer ? "Presença confirmada!" : "Resposta enviada";
      $("#rsvp-done-texto").textContent = vaiComparecer
        ? "Muito obrigado por responder — mal podemos esperar para celebrar com você!"
        : "Sentiremos sua falta, mas agradecemos muito por avisar.";
      $("#rsvp-done").classList.add("show");
    }catch(err){
      mostrarMsg(err.message || "Não foi possível enviar sua resposta. Tente novamente.", "err");
      btn.disabled = false;
      $("#btn-enviar-texto").textContent = "Confirmar presença";
    }
  });
}
function mostrarMsg(texto, tipo){
  const el = $("#rsvp-msg");
  el.textContent = texto;
  el.className = `rsvp-msg show ${tipo}`;
}

/* ---------- lista de presentes ---------- */
async function carregarPresentes(){
  const grid = $("#presentes-grid");
  if(!supabaseConfigurado()){
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:13px">
      A lista de presentes ainda não está conectada — fale com quem está organizando o casamento.</p>`;
    return;
  }
  try{
    const itens = await chamarRPC("listar_presentes", {});
    if(!itens || !itens.length){ grid.innerHTML = ""; return; }
    grid.innerHTML = itens.map(it => `
      <div class="pr-card" data-id="${it.id}">
        <h4>${esc(it.nome)}</h4>
        <p>${esc(it.descricao||"")}</p>
        <div class="pr-foot">
          ${it.reservado
            ? `<span class="pr-tag taken">Já foi escolhido &#10003;</span><button class="pr-btn" disabled>Reservado</button>`
            : `<span class="pr-tag">Disponível</span><button class="pr-btn" data-reservar="${it.id}">Eu vou dar!</button>`}
        </div>
      </div>`).join("");
  }catch(err){
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:13px">Não foi possível carregar a lista de presentes agora.</p>`;
  }
}
function iniciarPresentes(){
  $("#presentes-grid").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-reservar]");
    if(!btn) return;
    const nome = prompt("Seu nome, para os noivos saberem quem vai presentear:");
    if(!nome || nome.trim().length < 2) return;
    btn.disabled = true; btn.textContent = "Reservando…";
    try{
      const ok = await chamarRPC("reservar_presente", { p_id: btn.dataset.reservar, p_nome_convidado: nome.trim() });
      if(ok){ toast("Presente reservado — muito obrigado!"); carregarPresentes(); }
      else { toast("Ops, alguém acabou de reservar este item."); carregarPresentes(); }
    }catch(err){
      toast(err.message || "Não foi possível reservar agora.");
      btn.disabled = false; btn.textContent = "Eu vou dar!";
    }
  });
}

/* ---------- copiar chave Pix ---------- */
function iniciarPix(){
  $("#pix-copiar").addEventListener("click", () => {
    const chave = EVENTO.pix.chave;
    if(navigator.clipboard) navigator.clipboard.writeText(chave).catch(()=>{});
    toast("Chave Pix copiada!");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  preencherConteudo();
  atualizarContagem();
  iniciarTopbar();
  iniciarRSVP();
  iniciarPix();
  iniciarPresentes();
  carregarPresentes();

  await carregarConteudoDoSite();
  preencherConteudo();
  atualizarContagem();
  setInterval(atualizarContagem, 60000);
});
