/* ============================================================
   ATELIÊ — Save the date
   Envia o "reserve a data" pelo WhatsApp, convite por convite,
   e acompanha quem já recebeu e quem já viu.
   ============================================================ */

const STD_PADRAO = "Oi {nome}! 💛\n\nSave the date: {noiva} & {noivo} vão se casar{data}!{local}\n\nReserve essa data na sua agenda — o convite oficial chega em breve.";

function stdDados(){
  const d = App.data;
  if(!d.saveTheDate) d.saveTheDate = { mensagem:"", arte:"" };
  return d.saveTheDate;
}
function stdMensagem(c){
  const casal = App.data.casal, std = stdDados();
  const primeiro = String(c.nome || "").trim().split(/\s+/)[0];
  return (std.mensagem || STD_PADRAO)
    .replace(/\{nome\}/g, primeiro)
    .replace(/\{noiva\}/g, casal.noiva)
    .replace(/\{noivo\}/g, casal.noivo)
    .replace(/\{data\}/g, casal.data ? " em " + fmtData(casal.data, true) : "")
    .replace(/\{local\}/g, casal.local ? `\n📍 ${casal.local}${casal.cidade ? " — " + casal.cidade : ""}` : "");
}
function stdStatus(c){ return c.stdVisto ? "viu" : c.stdEnviado ? "enviado" : "aenviar"; }
function badgeStd(c){
  const s = stdStatus(c);
  return s === "viu" ? `<span class="badge ok"><i class="pip"></i>Viu</span>`
       : s === "enviado" ? `<span class="badge gold" title="Enviado em ${fmtData(c.stdEnviado.slice(0,10), true)}"><i class="pip"></i>Enviado ${fmtData(c.stdEnviado.slice(0,10))}</span>`
       : `<span class="badge plain"><i class="pip"></i>A enviar</span>`;
}
function stdLista(){
  const f = App.filtros.savethedate;
  const q = f.busca.trim().toLowerCase();
  return App.data.convidados.filter(c => {
    if(c.rsvp === "recusado") return false;
    if(f.status === "semtel"){ if(c.telefone) return false; }
    else if(f.status !== "todos" && stdStatus(c) !== f.status) return false;
    if(f.prioridade !== "todas" && String(c.prioridade || 0) !== f.prioridade) return false;
    if(f.grupo !== "todos" && c.grupo !== f.grupo) return false;
    if(q && !(c.nome.toLowerCase().includes(q) || String(c.telefone).includes(q))) return false;
    return true;
  });
}

VIEWS.savethedate = function(){
  const f = App.filtros.savethedate, std = stdDados();
  const todos = App.data.convidados.filter(c => c.rsvp !== "recusado");
  const enviados = todos.filter(c => c.stdEnviado || c.stdVisto);
  const viram = todos.filter(c => c.stdVisto);
  const semTel = todos.filter(c => !c.telefone);
  const lista = stdLista();
  const proximo = lista.find(c => !c.stdEnviado && !c.stdVisto && c.telefone);
  const chips = [["todos","Todos",todos.length],["aenviar","A enviar",todos.length - enviados.length],
    ["enviado","Enviados, sem visto",enviados.length - viram.length],["viu","Viram",viram.length],["semtel","Sem telefone",semTel.length]];

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Save the date</h1>
      <p class="page-sub">Avise os convidados da data antes do convite oficial · <b>${enviados.length}</b> de ${todos.length} convites enviados.</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-std-mensagem>${ico("edit")}Mensagem e arte</button>
      ${whatsConectado()
        ? (lista.some(c => !c.stdEnviado && !c.stdVisto && c.telefone)
            ? `<button class="btn btn-primary" data-std-massa title="Envia pelo seu WhatsApp, com pausas entre as mensagens">${ico("send")}Enviar automaticamente</button>` : "")
        : `${!whatsConfigurado() ? `<button class="btn" data-whats-conectar title="Enviar direto, sem abrir conversa por conversa">${ico("chat")}Conectar WhatsApp</button>` : ""}
           ${proximo ? `<button class="btn btn-primary" data-std-enviar="${proximo.id}" title="Abre o WhatsApp de ${esc(proximo.nome)}">${ico("send")}Enviar para o próximo</button>` : ""}`}
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${miniStat("Convites", todos.length, "quem não recusou", "users")}
    ${miniStat("Enviados", enviados.length, pct(enviados.length, todos.length) + "% dos convites", "send","g4")}
    ${miniStat("Viram", viram.length, enviados.length ? pct(viram.length, enviados.length) + "% dos enviados" : "marque quando a pessoa visualizar", "eye","g2")}
    ${miniStat("Sem telefone", semTel.length, semTel.length ? "cadastre para poder enviar" : "todos têm telefone", "phone", semTel.length ? "g3" : "")}
  </div>

  <div class="card mb-20">
    <div class="card-body std-previa">
      ${std.arte ? `<img class="std-arte" src="${esc(std.arte)}" alt="Arte do save the date">`
                 : `<button class="std-arte vazia" data-std-mensagem>${ico("image")}<span>Adicionar a arte</span></button>`}
      <div style="min-width:0;flex:1">
        <div class="eyebrow mb-8">Prévia da mensagem</div>
        <div class="std-balao">${esc(stdMensagem({ nome: proximo ? proximo.nome : "Maria" })).replace(/\n/g,"<br>")}</div>
        <p class="t-xs t-muted mt-12" style="line-height:1.55">
          ${whatsConectado()
            ? `${ico("checkCircle")} WhatsApp conectado: as mensagens saem direto do seu número${std.arte ? ", com a arte junto" : ""}.`
            : std.arte ? "Ao clicar em Enviar, a arte é copiada: quando o WhatsApp abrir, é só colar (Cmd+V no computador, ou segure e cole no celular) e mandar junto com o texto."
                       : "Dica: adicione a arte do save the date para mandar junto com o texto."}
        </p>
        ${std.arte ? `<button class="btn btn-sm mt-8" data-std-baixar-arte>${ico("download")}Baixar arte</button>` : ""}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-body" style="padding-bottom:0">
      <div class="between wrap gap-12 mb-16">
        <div class="input-ico" style="max-width:320px;flex:1;min-width:200px">
          ${ico("search")}<input class="input" id="busca-std" placeholder="Buscar convidado…" value="${esc(f.busca)}">
        </div>
        <div class="center gap-10 wrap">
          <select class="select" id="std-grupo" style="width:auto;min-width:170px">
            <option value="todos">Todos os grupos</option>
            ${GRUPOS.map(g => `<option value="${g.id}" ${f.grupo===g.id?"selected":""}>${esc(g.nome)}</option>`).join("")}
          </select>
          <select class="select" id="std-prio" style="width:auto;min-width:160px">
            <option value="todas">Todas as prioridades</option>
            ${PRIORIDADES.map(p => `<option value="${p.id}" ${f.prioridade===String(p.id)?"selected":""}>${p.letra} · ${p.nome}</option>`).join("")}
            <option value="0" ${f.prioridade==="0"?"selected":""}>Sem prioridade</option>
          </select>
        </div>
      </div>
      <div class="chips mb-16">
        ${chips.map(([id,nome,q]) => `<button class="chip ${f.status===id?"active":""}" data-std-filtro="${id}">${nome}<span class="n">${q}</span></button>`).join("")}
      </div>
    </div>
    ${lista.length ? `
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:30%">Convidado</th><th>Prioridade</th><th>Telefone</th><th>Situação</th><th class="right">Viu?</th><th class="right"></th></tr></thead>
      <tbody>
        ${lista.map(c => `<tr>
          <td><span class="cell-name">${avatarHTML(c.nome,"sm",c.id)}
            <span style="min-width:0"><span class="nm ell" style="display:block">${esc(c.nome)}</span>
            <span class="t-xs t-muted ell" style="display:block">${esc(nomeGrupo(c.grupo))}${qtdPessoas(c) > 1 ? ` · ${qtdPessoas(c)} pessoas` : ""}</span></span></span></td>
          <td class="nowrap">${badgePrioridadeConv(c, false)}</td>
          <td class="t-sm t-ink3 tnum nowrap">${c.telefone ? esc(c.telefone) : `<button class="link" data-std-tel="${c.id}">Adicionar</button>`}</td>
          <td class="nowrap">${badgeStd(c)}</td>
          <td class="right"><button class="check ${c.stdVisto?"on":""}" data-std-viu="${c.id}" title="${c.stdVisto ? "Desmarcar" : "Marcar que viu"}">${ico("check")}</button></td>
          <td class="right nowrap">
            ${c.stdEnviado || c.stdVisto ? `<button class="mini-btn" data-std-desfazer="${c.id}" title="Marcar como não enviado">${ico("x")}</button>` : ""}
            <button class="btn btn-sm ${c.stdEnviado ? "" : "btn-primary"}" data-std-enviar="${c.id}" ${c.telefone ? "" : "disabled"}>${ico("send")}${c.stdEnviado ? "Reenviar" : "Enviar"}</button>
          </td>
        </tr>`).join("")}
      </tbody>
    </table></div>`
    : `<div style="padding:0 0 10px">${vazio("send", todos.length ? "Ninguém neste filtro" : "Nenhum convidado ainda",
        todos.length ? "Mude o filtro para ver outros convidados." : "Cadastre os convidados para enviar o save the date.", "")}</div>`}
  </div>`;
};

/* copia a arte como imagem, para colar no WhatsApp */
/* a gravação começa na hora do clique (antes do WhatsApp abrir), senão o navegador recusa */
function stdCopiarArte(){
  const arte = stdDados().arte;
  if(!arte || !navigator.clipboard || typeof ClipboardItem === "undefined") return Promise.resolve(false);
  const png = new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext("2d").drawImage(img, 0, 0);
      cv.toBlob(b => b ? ok(b) : erro(new Error("imagem")), "image/png");
    };
    img.onerror = erro;
    img.src = arte;
  });
  try{
    return navigator.clipboard.write([new ClipboardItem({ "image/png": png })]).then(() => true, () => false);
  }catch(_){ return Promise.resolve(false); }
}
async function stdEnviar(id){
  const c = App.data.convidados.find(x => x.id === id); if(!c) return;
  if(App.privado){ toast("Modo privado: clique no olhinho do topo para enviar.","err"); return; }
  if(!c.telefone){ toast("Este convidado não tem telefone cadastrado.","err"); return; }
  if(whatsConectado()){
    const b = document.querySelector(`[data-std-enviar="${id}"]`);
    if(b){ b.disabled = true; b.innerHTML = `<span class="spinner"></span>`; }
    try{
      await whatsEnviar(c.telefone, stdMensagem(c), stdDados().arte);
      c.stdEnviado = new Date().toISOString(); salvar(); render();
      toast(`Save the date enviado para ${c.nome.split(" ")[0]}.`, "ok");
    }catch(e){
      render(); toast(`Não foi para ${c.nome.split(" ")[0]}: ${whatsErroTexto(e)}.`, "err");
    }
    return;
  }
  /* tudo começa no clique: copiar a arte e abrir o WhatsApp (o navegador bloqueia se esperar) */
  const link = linkWhatsApp(c.telefone, stdMensagem(c));
  const copia = stdCopiarArte();
  c.stdEnviado = new Date().toISOString();
  salvar();
  const janela = window.open(link, "_blank");
  if(janela) janela.opener = null; else { window.location.href = link; return; }
  const copiou = await copia;
  render();
  const primeiro = c.nome.split(" ")[0];
  if(copiou) toast(`Arte copiada — cole no WhatsApp de ${primeiro} e envie.`, "ok");
  else if(stdDados().arte) toast(`WhatsApp aberto para ${primeiro}. Não deu para copiar a arte aqui — use "Baixar arte" e anexe no WhatsApp.`, "err");
  else toast(`WhatsApp aberto para ${primeiro}. Marcado como enviado.`, "ok");
}

function abrirMensagemStd(){
  const std = stdDados();
  let arte = std.arte || "";
  modal({
    titulo: "Mensagem e arte do save the date",
    sub: "A mesma mensagem vai para todos, com o primeiro nome de cada um.",
    corpo: `
      <div class="field"><label>Mensagem</label>
        <textarea class="textarea" id="std-texto" style="min-height:170px">${esc(std.mensagem || STD_PADRAO)}</textarea>
        <span class="hint">Use <b>{nome}</b> para o primeiro nome do convidado, <b>{data}</b> para a data e <b>{local}</b> para o local (vêm de Configurações).</span></div>
      <div class="field mt-16"><label>Arte (imagem)</label>
        <div class="center gap-12" style="align-items:flex-start">
          <div id="std-arte-prev">${arte ? `<img src="${esc(arte)}" style="width:96px;border-radius:10px;border:1px solid var(--line)">` : ""}</div>
          <div class="grow">
            <input class="input" type="file" id="std-arte" accept="image/*" style="padding:8px 10px;height:auto">
            ${arte ? `<button class="link mt-8" id="std-arte-tirar" style="color:var(--danger)">Remover a arte</button>` : ""}
          </div>
        </div></div>
      <button class="link mt-12" id="std-restaurar">Voltar para a mensagem padrão</button>`,
    rodape: `<button class="btn" data-fechar>Cancelar</button>
             <button class="btn btn-primary" id="std-salvar">Salvar</button>`,
    aoAbrir(w){
      const prev = w.querySelector("#std-arte-prev");
      w.querySelector("#std-arte").addEventListener("change", async e => {
        const f = e.target.files[0]; if(!f) return;
        try{
          arte = await arquivoParaFotoComprimida(f, 1080);
          prev.innerHTML = `<img src="${arte}" style="width:96px;border-radius:10px;border:1px solid var(--line)">`;
        }catch(err){ toast(err.message, "err"); }
      });
      const tirar = w.querySelector("#std-arte-tirar");
      if(tirar) tirar.onclick = () => { arte = ""; prev.innerHTML = ""; tirar.remove(); };
      w.querySelector("#std-restaurar").onclick = () => { w.querySelector("#std-texto").value = STD_PADRAO; };
      w.querySelector("#std-salvar").onclick = () => {
        const txt = w.querySelector("#std-texto").value.trim();
        std.mensagem = txt === STD_PADRAO ? "" : txt;
        std.arte = arte;
        salvar(); fecharModal(); render(); toast("Save the date atualizado.", "ok");
      };
    }
  });
}

POS_RENDER.savethedate = function(){
  const v = $("#view"), f = App.filtros.savethedate;
  const b = $("#busca-std");
  if(b){
    let t; b.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => {
      f.busca = b.value; const p = b.selectionStart; render();
      const n = $("#busca-std"); if(n){ n.focus(); n.setSelectionRange(p,p); }
    }, 220); });
  }
  const g = $("#std-grupo"); if(g) g.onchange = () => { f.grupo = g.value; render(); };
  const p = $("#std-prio"); if(p) p.onchange = () => { f.prioridade = p.value; render(); };
  v.addEventListener("click", e => {
    const fl = e.target.closest("[data-std-filtro]");
    if(fl){ f.status = fl.dataset.stdFiltro; render(); return; }
    if(e.target.closest("[data-std-mensagem]")){ abrirMensagemStd(); return; }
    if(e.target.closest("[data-std-massa]")){ abrirEnvioEmMassa(stdLista().map(c => c.id)); return; }
    if(e.target.closest("[data-std-baixar-arte]")){
      const a = document.createElement("a"); a.href = stdDados().arte; a.download = "save-the-date.jpg"; a.click(); return;
    }
    const en = e.target.closest("[data-std-enviar]");
    if(en && !en.disabled){ stdEnviar(en.dataset.stdEnviar); return; }
    const vi = e.target.closest("[data-std-viu]");
    if(vi){
      const c = App.data.convidados.find(x => x.id === vi.dataset.stdViu);
      c.stdVisto = !c.stdVisto;
      if(c.stdVisto && !c.stdEnviado) c.stdEnviado = new Date().toISOString();
      salvar(); render(); return;
    }
    const de = e.target.closest("[data-std-desfazer]");
    if(de){
      const c = App.data.convidados.find(x => x.id === de.dataset.stdDesfazer);
      c.stdEnviado = ""; c.stdVisto = false; salvar(); render(); toast("Marcado como não enviado.", "ok"); return;
    }
    const tl = e.target.closest("[data-std-tel]");
    if(tl){ abrirFormConvidado(tl.dataset.stdTel); return; }
  });
};
