/* ============================================================
   ATELIÊ — Envio direto pelo WhatsApp (Evolution API)
   Um servidor Evolution API (no Railway) fica conectado ao WhatsApp
   pessoal pelo QR Code; o Ateliê manda as mensagens por ele.
   A conexão (endereço + chave) fica só neste aparelho.
   Os envios em massa vão em fila, com pausas aleatórias entre uma
   mensagem e outra, para reduzir o risco de bloqueio do número.
   ============================================================ */

const WHATS_KEY = "atelie.whats.v1";
const WHATS_INSTANCIA = "atelie";
const WHATS_PAUSA = [25, 55];        // segundos entre uma mensagem e outra (sorteado)

const Whats = { url:"", key:"", estado:"desconhecido", fila:null };

function whatsLerConfig(){
  try{ const c = JSON.parse(localStorage.getItem(WHATS_KEY) || "null"); if(c){ Whats.url = c.url || ""; Whats.key = c.key || ""; } }catch(_){}
}
function whatsGravarConfig(){
  try{ localStorage.setItem(WHATS_KEY, JSON.stringify({ url:Whats.url, key:Whats.key })); }catch(_){}
}
function whatsConfigurado(){ return !!(Whats.url && Whats.key); }
function whatsConectado(){ return whatsConfigurado() && Whats.estado === "open"; }

async function whatsChamar(metodo, caminho, corpo){
  const resp = await fetch(Whats.url.replace(/\/$/, "") + caminho, {
    method: metodo,
    headers: { "Content-Type":"application/json", apikey: Whats.key },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const txt = await resp.text();
  let dados; try{ dados = txt ? JSON.parse(txt) : null; }catch(_){ dados = txt; }
  if(!resp.ok){
    const m = dados && (dados.response && dados.response.message || dados.message || dados.error);
    const partes = (Array.isArray(m) ? m : [m]).filter(Boolean).map(x =>
      typeof x === "object" ? (x.exists === false ? "number not exists on whatsapp" : JSON.stringify(x)) : String(x));
    const err = new Error(partes.join(" ") || ("Erro " + resp.status));
    err.status = resp.status;
    throw err;
  }
  return dados;
}
function whatsErroTexto(e){
  const m = String(e && e.message || e);
  if(/Failed to fetch|NetworkError|Load failed/i.test(m)) return "não foi possível falar com o servidor do WhatsApp (confira o endereço e se o Railway está no ar)";
  if(e && (e.status === 401 || e.status === 403) && /apikey|unauthorized|forbidden/i.test(m)) return "chave da API incorreta";
  if(/exists|not.*whatsapp|jid/i.test(m)) return "este número não tem WhatsApp";
  return m;
}
async function whatsAtualizarEstado(){
  if(!whatsConfigurado()){ Whats.estado = "desconhecido"; return Whats.estado; }
  try{
    const r = await whatsChamar("GET", `/instance/connectionState/${WHATS_INSTANCIA}`);
    Whats.estado = (r && r.instance && r.instance.state) || (r && r.state) || "close";
  }catch(e){ Whats.estado = e.status === 404 ? "close" : "erro"; }
  return Whats.estado;
}

/* número brasileiro para o formato do WhatsApp (55 + DDD + número) */
function whatsNumero(tel){
  let d = String(tel || "").replace(/\D/g, "");
  if(!d) return "";
  if(d.length <= 11) d = "55" + d;
  return d;
}
async function whatsEnviar(tel, texto, arte){
  const number = whatsNumero(tel);
  if(!number) throw new Error("sem telefone");
  if(arte){
    const m = String(arte).match(/^data:([^;]+);base64,(.*)$/);
    return whatsChamar("POST", `/message/sendMedia/${WHATS_INSTANCIA}`, {
      number, mediatype:"image", mimetype: m ? m[1] : "image/jpeg",
      caption: texto, media: m ? m[2] : arte, fileName:"save-the-date.jpg"
    });
  }
  return whatsChamar("POST", `/message/sendText/${WHATS_INSTANCIA}`, { number, text: texto });
}

/* ---------- conectar: endereço + chave → QR Code ---------- */
function abrirConectarWhats(){
  let timerEstado = null, timerQr = null;
  const parar = () => { clearInterval(timerEstado); clearInterval(timerQr); };
  modal({
    titulo: "Conectar o WhatsApp",
    sub: "As mensagens vão sair do seu número, como se você mandasse pelo celular.",
    corpo: `
      <div id="wz-passo1">
        <div class="field"><label>Endereço do servidor (Railway)</label>
          <input class="input" id="wz-url" value="${esc(Whats.url)}" placeholder="https://evolution-api-production-xxxx.up.railway.app"></div>
        <div class="field mt-12"><label>Chave da API</label>
          <input class="input" id="wz-key" type="password" value="${esc(Whats.key)}" placeholder="AUTHENTICATION_API_KEY do Railway"></div>
        <p class="t-xs t-muted mt-12" style="line-height:1.55">Os dois ficam guardados só neste aparelho.</p>
      </div>
      <div id="wz-passo2" style="display:none;text-align:center">
        <div id="wz-qr" class="wz-qr"><span class="spinner"></span></div>
        <p class="t-sm mt-16" style="line-height:1.6">No celular, abra o <b>WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho</b> e aponte para o código.</p>
        <p class="t-xs t-muted mt-8" id="wz-status">Aguardando a leitura…</p>
      </div>
      <div class="rsvp-msg" id="wz-erro" style="display:none;margin-top:12px;color:var(--danger)"></div>`,
    rodape: `<button class="btn" data-fechar>Fechar</button>
             <button class="btn btn-primary" id="wz-ir">Gerar QR Code</button>`,
    aoAbrir(w){
      const erro = w.querySelector("#wz-erro"), btn = w.querySelector("#wz-ir");
      const mostrarErro = t => { erro.textContent = t; erro.style.display = ""; };
      const fechar = w.querySelector("[data-fechar]");
      fechar.addEventListener("click", parar);
      const desenharQr = async () => {
        if(!document.body.contains(w)){ parar(); return; }
        try{
          const r = await whatsChamar("GET", `/instance/connect/${WHATS_INSTANCIA}`);
          const b64 = r && (r.base64 || (r.qrcode && r.qrcode.base64));
          if(b64) w.querySelector("#wz-qr").innerHTML = `<img src="${b64}" alt="QR Code do WhatsApp">`;
        }catch(e){ /* tenta de novo no próximo ciclo */ }
      };
      btn.onclick = async () => {
        erro.style.display = "none";
        Whats.url = w.querySelector("#wz-url").value.trim();
        Whats.key = w.querySelector("#wz-key").value.trim();
        if(!/^https?:\/\//.test(Whats.url) || !Whats.key){ mostrarErro("Preencha o endereço (começando com https://) e a chave."); return; }
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Conectando…`;
        try{
          /* cria a conexão (se já existir, segue em frente) */
          try{ await whatsChamar("POST", "/instance/create", { instanceName:WHATS_INSTANCIA, qrcode:true, integration:"WHATSAPP-BAILEYS" }); }
          catch(e){ if(e.status === 401 || /Failed to fetch|NetworkError|Load failed/i.test(e.message)) throw e; }
          whatsGravarConfig();
          if(await whatsAtualizarEstado() === "open"){ parar(); fecharModal(); render(); toast("WhatsApp já estava conectado. Tudo pronto!", "ok"); return; }
          w.querySelector("#wz-passo1").style.display = "none";
          w.querySelector("#wz-passo2").style.display = "";
          btn.style.display = "none";
          await desenharQr();
          timerQr = setInterval(desenharQr, 25000);
          timerEstado = setInterval(async () => {
            if(!document.body.contains(w)){ parar(); return; }
            if(await whatsAtualizarEstado() === "open"){
              parar(); fecharModal(); render();
              toast("WhatsApp conectado! Agora dá para enviar direto pelo Ateliê.", "ok");
            }
          }, 3000);
        }catch(e){
          btn.disabled = false; btn.textContent = "Gerar QR Code";
          mostrarErro("Não foi possível conectar: " + whatsErroTexto(e) + ".");
        }
      };
    }
  });
}
async function whatsDesconectar(){
  confirmar("Desconectar o WhatsApp",
    "O Ateliê para de enviar pelo seu número. Ele também some de Aparelhos conectados no celular. Dá para conectar de novo depois.", async () => {
      try{ await whatsChamar("DELETE", `/instance/logout/${WHATS_INSTANCIA}`); }catch(_){}
      Whats.estado = "close"; render(); toast("WhatsApp desconectado.", "ok");
    }, "Desconectar");
}

/* ---------- cartão em Configurações ---------- */
function whatsCardConfigHTML(){
  if(typeof modoCerimonial === "function" && modoCerimonial()) return "";
  const conectado = whatsConectado();
  return `<div class="card">
    <div class="card-head"><h3>WhatsApp — envio direto</h3>
      <span class="badge ${conectado ? "ok" : whatsConfigurado() ? "warn" : "plain"}">${conectado ? "Conectado" : whatsConfigurado() ? "Desconectado" : "Não configurado"}</span></div>
    <div class="card-body">
      <p class="t-sm t-ink3" style="line-height:1.6">Com o WhatsApp conectado, o save the date sai direto do seu número —
        um por um ou para todos de uma vez, com pausas entre as mensagens.</p>
      <p class="t-xs t-muted mt-8" style="line-height:1.55">Precisa do servidor Evolution API no Railway. Envio automático não é oficial do WhatsApp:
        mande em lotes pequenos e só para quem tem vocês nos contatos.</p>
    </div>
    <div class="card-foot between">
      ${conectado ? `<button class="btn btn-sm btn-danger" data-whats-sair>Desconectar</button>` : `<span></span>`}
      <button class="btn btn-sm ${conectado ? "" : "btn-primary"}" data-whats-conectar>${conectado ? "Trocar conexão" : "Conectar WhatsApp"}</button>
    </div>
  </div>`;
}

/* ---------- fila de envio ---------- */
function whatsPainel(){
  let p = document.getElementById("whats-fila");
  const f = Whats.fila;
  if(!f){ if(p) p.remove(); return; }
  if(!p){ p = document.createElement("div"); p.id = "whats-fila"; p.className = "whats-fila"; document.body.appendChild(p); }
  const total = f.itens.length, feitos = f.enviados + f.erros.length;
  const falta = f.ativo && f.proximoEm ? Math.max(0, Math.ceil((f.proximoEm - Date.now()) / 1000)) : 0;
  p.innerHTML = `
    <div class="between" style="gap:10px"><strong style="font-size:13px">${f.ativo ? "Enviando save the date" : "Envio terminado"}</strong>
      ${f.ativo ? `<button class="btn btn-sm" data-whats-parar>Parar</button>` : `<button class="mini-btn" data-whats-fechar title="Fechar">${ico("x")}</button>`}</div>
    <div class="mt-8">${barra(feitos, total, f.erros.length ? "warn" : "ok")}</div>
    <div class="t-xs t-muted mt-8">${f.enviados} de ${total} enviados${f.erros.length ? ` · ${f.erros.length} com erro` : ""}
      ${f.ativo ? (f.enviando ? ` · enviando para ${esc(f.enviando)}…` : falta ? ` · próxima em ${falta}s` : "") : ""}</div>
    ${f.ativo ? `<div class="t-xs t-muted mt-4">Deixe esta página aberta até terminar.</div>` : ""}
    ${!f.ativo && f.erros.length ? `<div class="t-xs mt-8" style="color:var(--warn);line-height:1.5">Não foram: ${f.erros.map(x => esc(x.nome) + " (" + esc(x.motivo) + ")").join(", ")}</div>` : ""}`;
}
async function whatsRodarFila(){
  const f = Whats.fila;
  while(f && f.ativo && f.pos < f.itens.length){
    const c = App.data.convidados.find(x => x.id === f.itens[f.pos]);
    f.pos++;
    if(!c || c.stdEnviado || !c.telefone) continue;
    f.enviando = c.nome.split(" ")[0]; whatsPainel();
    try{
      await whatsEnviar(c.telefone, stdMensagem(c), stdDados().arte);
      c.stdEnviado = new Date().toISOString();
      f.enviados++;
      salvar();
      if(App.rota === "savethedate" && !modalAberto) render();
    }catch(e){
      f.erros.push({ nome:c.nome, motivo:whatsErroTexto(e) });
      if(/servidor|chave/.test(whatsErroTexto(e))){ f.ativo = false; break; }   // problema geral: para tudo
    }
    f.enviando = "";
    if(f.pos < f.itens.length && f.ativo){
      const seg = WHATS_PAUSA[0] + Math.random() * (WHATS_PAUSA[1] - WHATS_PAUSA[0]);
      f.proximoEm = Date.now() + seg * 1000;
      while(f.ativo && Date.now() < f.proximoEm){ whatsPainel(); await new Promise(r => setTimeout(r, 1000)); }
    }
  }
  if(f){ f.ativo = false; f.proximoEm = 0; whatsPainel(); }
  if(App.rota === "savethedate" && !modalAberto) render();
  if(f) toast(`Save the date: ${f.enviados} enviado${f.enviados === 1 ? "" : "s"}${f.erros.length ? `, ${f.erros.length} com erro` : ""}.`, f.erros.length ? "err" : "ok");
}
function abrirEnvioEmMassa(ids){
  if(App.privado){ toast("Modo privado: clique no olhinho do topo para enviar.","err"); return; }
  if(Whats.fila && Whats.fila.ativo){ toast("Já tem um envio em andamento.","err"); return; }
  const lista = App.data.convidados.filter(c => ids.includes(c.id) && !c.stdEnviado && c.telefone);
  if(!lista.length){ toast("Ninguém para enviar neste filtro (todos já receberam ou estão sem telefone).", "err"); return; }
  const sugerido = Math.min(lista.length, 40);
  modal({
    titulo: "Enviar save the date automaticamente",
    sub: `${lista.length} convite${lista.length === 1 ? "" : "s"} ainda sem envio neste filtro.`,
    tamanho: "narrow",
    corpo: `
      <div class="field"><label>Quantos enviar agora</label>
        <input class="input" type="number" id="wm-qtd" min="1" max="${lista.length}" value="${sugerido}"></div>
      <p class="t-sm t-ink3 mt-12" id="wm-tempo" style="line-height:1.6"></p>
      <div class="alert warn mt-12">${ico("alert")}<div class="a-desc" style="line-height:1.55">Para não chamar atenção do WhatsApp, as mensagens saem com <b>25 a 55 segundos</b> de pausa entre elas.
        Prefira lotes de até 40 por dia. Deixe esta página aberta até terminar.</div></div>`,
    rodape: `<button class="btn" data-fechar>Cancelar</button>
             <button class="btn btn-primary" id="wm-ir">${ico("send")}Começar envio</button>`,
    aoAbrir(w){
      const q = w.querySelector("#wm-qtd"), t = w.querySelector("#wm-tempo");
      const atualizar = () => {
        const n = Math.max(1, Math.min(lista.length, Math.floor(Number(q.value) || 1)));
        const min = Math.round(n * 40 / 60);
        t.innerHTML = `Vai levar mais ou menos <b>${min <= 1 ? "1 minuto" : min + " minutos"}</b>. Ordem: prioridade A primeiro, depois B e C.`;
      };
      q.addEventListener("input", atualizar); atualizar();
      w.querySelector("#wm-ir").onclick = () => {
        const n = Math.max(1, Math.min(lista.length, Math.floor(Number(q.value) || 1)));
        const ordem = lista.slice().sort((a,b) => (Number(a.prioridade) || 9) - (Number(b.prioridade) || 9)).slice(0, n);
        Whats.fila = { itens:ordem.map(c => c.id), pos:0, enviados:0, erros:[], ativo:true, proximoEm:0, enviando:"" };
        fecharModal(); whatsPainel(); whatsRodarFila();
      };
    }
  });
}

document.addEventListener("click", e => {
  if(e.target.closest("[data-whats-conectar]")){ abrirConectarWhats(); return; }
  if(e.target.closest("[data-whats-sair]")){ whatsDesconectar(); return; }
  if(e.target.closest("[data-whats-parar]")){ if(Whats.fila){ Whats.fila.ativo = false; whatsPainel(); } return; }
  if(e.target.closest("[data-whats-fechar]")){ Whats.fila = null; whatsPainel(); return; }
});
/* avisa antes de fechar a página no meio de um envio */
window.addEventListener("beforeunload", e => { if(Whats.fila && Whats.fila.ativo){ e.preventDefault(); e.returnValue = ""; } });

whatsLerConfig();
document.addEventListener("DOMContentLoaded", async () => {
  if(!whatsConfigurado()) return;
  const antes = Whats.estado;
  await whatsAtualizarEstado();
  if(Whats.estado !== antes && (App.rota === "savethedate" || App.rota === "config") && !modalAberto) render();
});
