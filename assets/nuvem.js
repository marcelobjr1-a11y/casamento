/* ============================================================
   ATELIÊ — Sincronização entre aparelhos (Supabase)
   Mantém os mesmos dados no computador e no celular de quem usa
   o Ateliê (ex.: a noiva e o noivo). Usa a mesma conexão e a mesma
   senha do site dos convidados.
   ============================================================ */

const NUVEM_KEY = "atelie.nuvem.v1";
/* URL e chave pública do projeto (não são segredo — a senha é que protege) */
const NUVEM_PADRAO = {
  url: "https://yepknqiqawhstndbcjws.supabase.co",
  key: "sb_publishable_Pmd5xWUYNJj5zxddHlLXkQ_KIhMVXqK"
};

const Nuvem = {
  estado: "desconectado",   // desconectado | ok | pendente | sincronizando | erro
  erro: "",
  base: null,               // carimbo da última versão da nuvem que este aparelho conhece
  sujo: false,              // há alterações aqui ainda não enviadas
  versao: 0,                // conta as alterações locais (evita perder edição feita durante o envio)
  ultima: null,
  ocupado: false,
  timer: null,
  adiado: false,            // o usuário fechou o aviso de conflito sem escolher
  papel: "casal",           // casal | cerimonial (acesso só para ver, sem valores)
  senhaCer: ""              // senha da cerimonialista (só no aparelho dela)
};
function modoCerimonial(){ return Nuvem.papel === "cerimonial"; }
/* este aparelho está ligado à nuvem (como casal ou como cerimonialista)? */
function nuvemConectado(){ return modoCerimonial() ? !!Nuvem.senhaCer : siteConfigurado(); }

/* ---------- metadados guardados só neste aparelho ---------- */
function nuvemLerMeta(){
  try{
    const m = JSON.parse(localStorage.getItem(NUVEM_KEY) || "null");
    if(m){ Nuvem.base = m.base || null; Nuvem.sujo = !!m.sujo; Nuvem.ultima = m.ultima || null;
           Nuvem.papel = m.papel === "cerimonial" ? "cerimonial" : "casal"; Nuvem.senhaCer = m.senhaCer || ""; }
  }catch(_){ /* ignora */ }
}
function nuvemGravarMeta(){
  try{ localStorage.setItem(NUVEM_KEY, JSON.stringify({ base:Nuvem.base, sujo:Nuvem.sujo, ultima:Nuvem.ultima,
    papel:Nuvem.papel, senhaCer:Nuvem.senhaCer })); }
  catch(_){ /* ignora */ }
}

/* ---------- estado visual (ícone da nuvem no topo) ---------- */
const NUVEM_TEXTOS = {
  desconectado: "Não conectado — clique para conectar",
  ok: "Sincronizado",
  pendente: "Alterações aguardando envio…",
  sincronizando: "Sincronizando…",
  erro: "Sem conexão com a nuvem"
};
function nuvemDefinir(estado, erro){
  Nuvem.estado = estado;
  Nuvem.erro = erro || "";
  const btn = document.querySelector("[data-nuvem]");
  if(btn){
    btn.dataset.estado = estado;
    btn.title = NUVEM_TEXTOS[estado] + (estado === "erro" && erro ? ` (${erro})` : "");
  }
}
function nuvemBotaoHTML(){
  if(!nuvemConectado() && Nuvem.estado !== "desconectado") Nuvem.estado = "desconectado";
  return `<button class="icon-btn nuvem-btn" data-nuvem data-estado="${Nuvem.estado}" aria-label="Sincronização"
    title="${esc(NUVEM_TEXTOS[Nuvem.estado] || "")}">${ico("cloud")}<span class="nuvem-dot"></span></button>`;
}

/* mensagem em português simples para o que pode dar errado */
function nuvemMensagemErro(msg){
  const m = String(msg || "");
  if(/Failed to fetch|NetworkError|Load failed/i.test(m)) return "não foi possível falar com o banco de dados (ele pode estar pausado no Supabase)";
  if(/Could not find the function|schema cache|obter_estado_atelie|salvar_estado_atelie/i.test(m)) return "falta rodar o SQL novo no Supabase";
  if(/senha/i.test(m)) return "senha incorreta";
  return m;
}

/* ---------- utilidades ---------- */
function nuvemEstaVazio(){
  const d = App.data;
  return !d.convidados.length && !d.fornecedores.length && !d.tarefas.length && !d.pagamentos.length &&
         !d.documentos.length && !d.inspiracoes.length && !d.cronograma.length && !d.casal.data && !d.casal.recado;
}
/* os dados que vão para a nuvem — sem a senha nem a conexão */
function nuvemDadosParaEnviar(){
  const copia = JSON.parse(JSON.stringify(App.data));
  copia.casal.supabaseUrl = ""; copia.casal.supabaseKey = ""; copia.casal.supabaseSenha = "";
  return copia;
}
/* dá para trocar os dados da tela sem atrapalhar quem está digitando? */
function nuvemPodeAtualizarTela(){
  if(modalAberto) return false;
  const a = document.activeElement;
  return !(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
}
function nuvemResumo(d){
  return `${(d.convidados||[]).length} convidados · ${(d.fornecedores||[]).length} fornecedores · ${(d.tarefas||[]).length} tarefas`;
}

/* ---------- baixar da nuvem / enviar para a nuvem ---------- */
function nuvemAdotar(remoto){
  const c = App.data.casal;
  const cred = { supabaseUrl:c.supabaseUrl, supabaseKey:c.supabaseKey, supabaseSenha:c.supabaseSenha };
  const novo = migrarDados(remoto.dados);
  Object.assign(novo.casal, cred);
  App.data = novo;
  gravarLocal();
  Nuvem.base = remoto.atualizado_em;
  Nuvem.sujo = false;
  Nuvem.ultima = new Date().toISOString();
  nuvemGravarMeta();
}
async function nuvemEnviar(forcar){
  const versaoEnviada = Nuvem.versao;
  const r = await chamarRPCSite("salvar_estado_atelie", {
    p_senha: App.data.casal.supabaseSenha,
    p_dados: nuvemDadosParaEnviar(),
    p_base: Nuvem.base,
    p_forcar: !!forcar
  });
  if(r && r.ok){
    Nuvem.base = r.atualizado_em;
    Nuvem.sujo = (Nuvem.versao !== versaoEnviada);   // se editou durante o envio, ainda há o que enviar
    Nuvem.ultima = new Date().toISOString();
    nuvemGravarMeta();
    if(typeof cerEnviarVisao === "function") cerEnviarVisao();
    return "enviou";
  }
  return "conflito";
}

/* ---------- o ciclo principal ---------- */
async function nuvemSincronizar(opcoes){
  const manual = !!(opcoes && opcoes.manual);
  if(App.privado) return { ok:false, motivo:"modo privado" };   // retoma ao sair do modo privado
  if(modoCerimonial()) return cerSincronizar(manual);
  if(!siteConfigurado()){ nuvemDefinir("desconectado"); return { ok:false, motivo:"desconectado" }; }
  if(Nuvem.ocupado) return { ok:false, motivo:"ocupado" };
  if(Nuvem.adiado && !manual) return { ok:false, motivo:"adiado" };
  if(manual) Nuvem.adiado = false;
  if(!navigator.onLine){ nuvemDefinir("erro", "sem internet"); return { ok:false, motivo:"sem internet" }; }

  Nuvem.ocupado = true;
  nuvemDefinir("sincronizando");
  try{
    const senha = App.data.casal.supabaseSenha;
    const remoto = await chamarRPCSite("obter_estado_atelie", { p_senha: senha });
    let resultado = "nada";

    if(!remoto){
      /* a nuvem ainda está vazia: se temos dados, eles viram a primeira versão */
      if(!nuvemEstaVazio()) resultado = await nuvemEnviar(false);
    }
    else if(!Nuvem.base){
      /* este aparelho nunca sincronizou */
      if(nuvemEstaVazio()){
        if(!manual && !nuvemPodeAtualizarTela()){ resultado = "adiado"; }
        else { nuvemAdotar(remoto); resultado = "baixou"; }
      } else { resultado = "conflito"; }
    }
    else if(remoto.atualizado_em !== Nuvem.base){
      /* alguém alterou na nuvem desde a última vez */
      if(!Nuvem.sujo){
        if(!manual && !nuvemPodeAtualizarTela()){ resultado = "adiado"; }
        else { nuvemAdotar(remoto); resultado = "baixou"; }
      } else { resultado = "conflito"; }
    }
    else if(Nuvem.sujo){
      resultado = await nuvemEnviar(false);
    }

    if(resultado === "conflito"){
      /* recarrega a versão mais nova da nuvem para mostrar na comparação */
      const atual = (await chamarRPCSite("obter_estado_atelie", { p_senha: senha })) || remoto;
      Nuvem.ocupado = false;
      nuvemDefinir("pendente");
      if(manual || nuvemPodeAtualizarTela()) abrirConflitoNuvem(atual);
      return { ok:false, motivo:"conflito" };
    }

    Nuvem.ocupado = false;
    if(resultado === "adiado"){ nuvemDefinir(Nuvem.sujo ? "pendente" : "ok"); return { ok:true, resultado }; }
    nuvemDefinir(Nuvem.sujo ? "pendente" : "ok");
    if(resultado === "baixou"){
      render();
      toast("Dados atualizados com as alterações feitas em outro aparelho.", "ok");
    }
    if(typeof cerDepoisDeSincronizar === "function") cerDepoisDeSincronizar(manual);
    return { ok:true, resultado };
  }catch(err){
    Nuvem.ocupado = false;
    nuvemDefinir("erro", nuvemMensagemErro(err.message));
    return { ok:false, motivo: err.message };
  }
}

/* marcado por salvar(): há alterações locais para enviar */
function nuvemMarcarSujo(){
  if(modoCerimonial()) return;
  Nuvem.versao++;
  if(!siteConfigurado()) return;
  Nuvem.sujo = true;
  nuvemGravarMeta();
  nuvemDefinir("pendente");
  clearTimeout(Nuvem.timer);
  Nuvem.timer = setTimeout(() => nuvemSincronizar({}), 2500);
}

function nuvemIniciar(){
  nuvemLerMeta();
  nuvemDefinir(nuvemConectado() ? (Nuvem.sujo ? "pendente" : "ok") : "desconectado");
  if(nuvemConectado()) nuvemSincronizar({});
  else if(/acesso=cerimonial/.test(location.search + location.hash)) setTimeout(() => abrirConectarNuvem("cerimonial"), 300);
  setInterval(() => { if(document.visibilityState === "visible") nuvemSincronizar({}); }, 45000);
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") nuvemSincronizar({}); });
  window.addEventListener("online", () => nuvemSincronizar({}));
}

/* ---------- telas: conectar, conflito, status ---------- */
function abrirConectarNuvem(modoInicial){
  const c = App.data.casal;
  let modo = modoInicial === "cerimonial" ? "cerimonial" : "casal";
  modal({
    titulo: "Conectar este aparelho",
    sub: "Para ver os mesmos dados em qualquer computador ou celular.",
    tamanho: "narrow",
    corpo: `
      <div class="seg mb-16" style="display:flex">
        <button class="${modo==="casal"?"active":""}" data-modo-con="casal" style="flex:1">Sou um dos noivos</button>
        <button class="${modo==="cerimonial"?"active":""}" data-modo-con="cerimonial" style="flex:1">Sou a cerimonialista</button>
      </div>
      <p class="t-sm t-ink3 mb-16" style="line-height:1.6" id="nv-explica"></p>
      <div class="field"><label>Senha</label>
        <input class="input" id="nv-senha" type="password" autocomplete="current-password"></div>
      <details class="mt-16" id="nv-avancado"><summary class="t-xs t-muted" style="cursor:pointer">Opções avançadas</summary>
        <div class="field mt-12"><label>URL do Supabase</label>
          <input class="input" id="nv-url" value="${esc(c.supabaseUrl || NUVEM_PADRAO.url)}"></div>
        <div class="field mt-12"><label>Chave pública</label>
          <input class="input" id="nv-key" value="${esc(c.supabaseKey || NUVEM_PADRAO.key)}"></div>
      </details>
      <div class="rsvp-msg" id="nv-erro" style="display:none;margin-top:14px;color:var(--danger)"></div>`,
    rodape: `<button class="btn" data-fechar>Cancelar</button>
             <button class="btn btn-primary" id="nv-conectar">Conectar</button>`,
    aoAbrir(w){
      const senhaEl = w.querySelector("#nv-senha");
      const erroEl = w.querySelector("#nv-erro");
      const aplicarModo = () => {
        w.querySelectorAll("[data-modo-con]").forEach(b => b.classList.toggle("active", b.dataset.modoCon === modo));
        w.querySelector("#nv-explica").innerHTML = modo === "casal"
          ? "Digite a <strong>senha do painel</strong> — a mesma que vocês definiram ao criar o banco de dados. Se já existirem dados salvos, eles aparecem aqui na hora."
          : "Digite a <strong>senha que os noivos te enviaram</strong>. Você vai ver convidados, padrinhos, fornecedores, contratos, tarefas e o cronograma — só para consulta.";
        senhaEl.placeholder = modo === "casal" ? "Senha do painel" : "Senha da cerimonialista";
        w.querySelector("#nv-avancado").style.display = modo === "casal" ? "" : "none";
        erroEl.style.display = "none";
      };
      aplicarModo();
      w.querySelectorAll("[data-modo-con]").forEach(b => b.onclick = () => { modo = b.dataset.modoCon; aplicarModo(); senhaEl.focus(); });
      const go = async () => {
        const senha = senhaEl.value;
        if(!senha){ erroEl.textContent = "Digite a senha."; erroEl.style.display = ""; return; }
        const btn = w.querySelector("#nv-conectar");
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Conectando…`;

        if(modo === "cerimonial"){
          const r = await cerConectar(senha);
          if(r.ok){ fecharModal(); render(); toast("Pronto! Você está vendo o casamento de " + App.data.casal.noiva + " e " + App.data.casal.noivo + ".", "ok"); return; }
          btn.disabled = false; btn.textContent = "Conectar";
          erroEl.textContent = r.motivo; erroEl.style.display = "";
          return;
        }

        const anterior = { u:c.supabaseUrl, k:c.supabaseKey, s:c.supabaseSenha };
        c.supabaseUrl = w.querySelector("#nv-url").value.trim() || NUVEM_PADRAO.url;
        c.supabaseKey = w.querySelector("#nv-key").value.trim() || NUVEM_PADRAO.key;
        c.supabaseSenha = senha;
        const r = await nuvemSincronizar({ manual:true });
        if(r.ok || r.motivo === "conflito"){
          gravarLocal();
          if(r.motivo !== "conflito"){ fecharModal(); toast(r.resultado === "baixou" ? "Conectado! Dados carregados." : "Conectado! Este aparelho está sincronizado.", "ok"); render(); }
          return;
        }
        /* falhou: desfaz e mostra o motivo */
        c.supabaseUrl = anterior.u; c.supabaseKey = anterior.k; c.supabaseSenha = anterior.s;
        nuvemDefinir(siteConfigurado() ? "erro" : "desconectado");
        btn.disabled = false; btn.textContent = "Conectar";
        erroEl.textContent = /senha/i.test(r.motivo) ? "Senha incorreta." :
          /Could not find the function|obter_estado_atelie/i.test(r.motivo) ? "O banco de dados ainda não foi atualizado — falta rodar o SQL novo no Supabase." :
          "Não foi possível conectar: " + r.motivo;
        erroEl.style.display = "";
      };
      w.querySelector("#nv-conectar").onclick = go;
      senhaEl.addEventListener("keydown", e => { if(e.key === "Enter") go(); });
      setTimeout(() => senhaEl.focus(), 50);
    }
  });
}

function abrirConflitoNuvem(remoto){
  Nuvem.adiado = true;   // se fechar sem escolher, não perguntar de novo sozinho
  const quando = remoto && remoto.atualizado_em ? new Date(remoto.atualizado_em).toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" }) : "—";
  modal({
    titulo: "Os dados são diferentes",
    sub: "Este aparelho e a nuvem têm informações diferentes. Qual vale?",
    corpo: `
      <div class="grid g-2" style="gap:12px">
        <div style="padding:14px;border:1px solid var(--line);border-radius:12px">
          <div class="eyebrow mb-8">Neste aparelho</div>
          <div class="t-sm">${esc(nuvemResumo(App.data))}</div>
        </div>
        <div style="padding:14px;border:1px solid var(--line);border-radius:12px">
          <div class="eyebrow mb-8">Na nuvem</div>
          <div class="t-sm">${esc(nuvemResumo(remoto.dados))}</div>
          <div class="t-xs t-muted mt-4">salvo em ${esc(quando)}</div>
        </div>
      </div>
      <p class="t-xs t-muted mt-16" style="line-height:1.6">Escolher um lado substitui o outro. Se não tiver certeza, use os dados da nuvem — costumam ser os mais completos.</p>`,
    rodape: `<button class="btn" id="nv-usar-local">Manter os deste aparelho</button>
             <button class="btn btn-primary" id="nv-usar-nuvem">Usar os da nuvem</button>`,
    aoAbrir(w){
      w.querySelector("#nv-usar-nuvem").onclick = () => {
        Nuvem.adiado = false;
        nuvemAdotar(remoto); fecharModal(); nuvemDefinir("ok"); render();
        toast("Dados da nuvem carregados.", "ok");
      };
      w.querySelector("#nv-usar-local").onclick = async () => {
        Nuvem.adiado = false;
        try{
          Nuvem.base = remoto.atualizado_em;           // "li a versão mais nova e escolho a minha"
          const r = await nuvemEnviar(true);
          fecharModal(); nuvemDefinir("ok");
          toast(r === "enviou" ? "Os dados deste aparelho agora valem para todos." : "Não foi possível enviar.", r === "enviou" ? "ok" : "err");
        }catch(e){ toast("Não foi possível enviar: " + e.message, "err"); }
      };
    }
  });
}

function abrirStatusNuvem(alvo){
  const conectado = nuvemConectado();
  const ultima = Nuvem.ultima ? new Date(Nuvem.ultima).toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" }) : null;
  const html = `
    <div style="padding:14px 16px;border-bottom:1px solid var(--line-2)">
      <strong style="font-size:13px">${modoCerimonial() ? "Acesso da cerimonialista" : "Sincronização entre aparelhos"}</strong>
      <div class="t-xs t-muted mt-4">${esc(NUVEM_TEXTOS[Nuvem.estado])}${Nuvem.estado === "erro" && Nuvem.erro ? ` — ${esc(Nuvem.erro)}` : ""}</div>
      ${ultima ? `<div class="t-xs t-muted">Última vez: ${esc(ultima)}</div>` : ""}
    </div>
    <div style="padding:6px">
      ${conectado
        ? `<button class="pop-item" data-nuvem-agora>${ico("refresh")}<span>${modoCerimonial() ? "Atualizar agora" : "Sincronizar agora"}</span></button>
           <button class="pop-item" data-ir="config">${ico("settings")}<span>Configurações</span></button>`
        : `<button class="pop-item" data-conectar-nuvem>${ico("globe")}<span>Conectar este aparelho</span></button>`}
    </div>`;
  const p = popover(alvo, html, 280);
  p.addEventListener("click", async e => {
    if(e.target.closest("[data-nuvem-agora]")){
      fecharPop();
      const r = await nuvemSincronizar({ manual:true });
      if(r.ok) toast(r.resultado === "baixou" ? "Dados atualizados." : "Tudo sincronizado.", "ok");
      else if(r.motivo !== "conflito") toast("Não foi possível sincronizar: " + nuvemMensagemErro(r.motivo), "err");
      return;
    }
    if(e.target.closest("[data-conectar-nuvem]")){ fecharPop(); abrirConectarNuvem(); return; }
    const ir = e.target.closest("[data-ir]");
    if(ir){ fecharPop(); irPara(ir.dataset.ir); }
  });
}

/* aviso no painel para quem abre o Ateliê num aparelho novo */
function nuvemBannerHTML(){
  if(nuvemConectado() || !nuvemEstaVazio()) return "";
  return `<div class="alert info mb-20">${ico("globe")}
    <div><div class="a-title">Já usa o Ateliê em outro aparelho?</div>
    <div class="a-desc">Conecte com a senha do painel para carregar aqui os mesmos dados. É a cerimonialista? Use a senha que os noivos te enviaram.</div></div>
    <span class="a-act"><button class="btn btn-sm btn-primary" data-conectar-nuvem>Conectar</button></span></div>`;
}

/* cartão da tela Configurações */
function nuvemCardConfigHTML(){
  const conectado = siteConfigurado();
  const ultima = Nuvem.ultima ? new Date(Nuvem.ultima).toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" }) : null;
  return `<div class="card">
    <div class="card-head"><h3>Sincronização entre aparelhos</h3>
      ${conectado ? `<span class="badge ${Nuvem.estado === "erro" ? "danger" : "ok"}">${Nuvem.estado === "erro" ? "Com erro" : "Conectado"}</span>` : `<span class="badge warn">Não conectado</span>`}</div>
    <div class="card-body">
      <p class="t-sm t-ink3" style="line-height:1.6">
        Deixa vocês dois verem e editarem os <strong>mesmos dados</strong> (convidados, fornecedores, tarefas, financeiro…)
        em qualquer computador ou celular. Usa a mesma conexão e senha do site dos convidados.</p>
      ${conectado ? `<p class="t-xs t-muted mt-12">${esc(NUVEM_TEXTOS[Nuvem.estado])}${ultima ? ` · última vez ${esc(ultima)}` : ""}</p>` : ""}
      <p class="t-xs t-muted mt-8" style="line-height:1.55">Contratos e comprovantes anexados também vão para a nuvem e abrem em qualquer aparelho conectado.</p>
    </div>
    <div class="card-foot between">
      <span></span>
      <span class="center gap-8">
        ${conectado
          ? `<button class="btn btn-sm" data-nuvem-agora>${ico("refresh")}Sincronizar agora</button>
             <button class="btn btn-sm btn-danger" data-desconectar-nuvem>Desconectar</button>`
          : `<button class="btn btn-sm btn-primary" data-conectar-nuvem>Conectar este aparelho</button>`}
      </span>
    </div>
  </div>`;
}

/* cliques globais desta funcionalidade */
document.addEventListener("click", async e => {
  const n = e.target.closest("[data-nuvem]");
  if(n){ e.stopPropagation(); abrirStatusNuvem(n); return; }
  if(e.target.closest("[data-conectar-nuvem]") && !e.target.closest(".pop")){ abrirConectarNuvem(); return; }
  if(e.target.closest("[data-nuvem-agora]") && !e.target.closest(".pop")){
    const r = await nuvemSincronizar({ manual:true });
    if(r.ok){ toast(r.resultado === "baixou" ? "Dados atualizados." : "Tudo sincronizado.", "ok"); if(App.rota === "config" && r.resultado !== "baixou") render(); }
    else if(r.motivo !== "conflito") toast("Não foi possível sincronizar: " + nuvemMensagemErro(r.motivo), "err");
    return;
  }
  if(e.target.closest("[data-desconectar-nuvem]")){
    if(modoCerimonial()){ cerDesconectar(); return; }
    confirmar("Desconectar este aparelho",
      "Os dados continuam aqui, mas param de sincronizar com a nuvem e com os outros aparelhos. Dá para conectar de novo quando quiser.",
      () => {
        const c = App.data.casal;
        c.supabaseSenha = "";
        Nuvem.base = null; Nuvem.sujo = false; nuvemGravarMeta();
        gravarLocal(); nuvemDefinir("desconectado"); render();
        toast("Aparelho desconectado.", "ok");
      }, "Desconectar");
  }
});

/* lê já no carregamento, para a navegação saber se é a cerimonialista */
nuvemLerMeta();
