/* ============================================================
   ATELIÊ — Acesso da cerimonialista + arquivos na nuvem
   A cerimonialista entra com uma senha própria e só VÊ os dados.
   Os aparelhos dos noivos mandam para a nuvem uma cópia SEM valores,
   parcelas, orçamento nem comprovantes — então essas informações
   nunca chegam ao aparelho dela. Os arquivos anexados (contratos…)
   vão para o banco para abrirem em qualquer aparelho.
   ============================================================ */

const CER_LINK = "https://marcelobjr1-a11y.github.io/casamento/?acesso=cerimonial";
const ARQ_LIMITE = 10 * 1024 * 1024;   // arquivos acima disso ficam só no aparelho

/* ---------- a cópia sem valores ---------- */
function docVisivelCerimonial(doc){
  return doc.cat !== "Comprovantes" && doc.cat !== "Orçamentos" && !doc.pagamento;
}
function visaoCerimonial(){
  const d = nuvemDadosParaEnviar();
  d.casal.orcamento = 0; d.casal.pixChave = ""; d.casal.pixTitular = "";
  d.pagamentos = [];
  d.orcamentoCats = (d.orcamentoCats || []).map(c => ({ cat:c.cat, orcado:0 }));
  d.fornecedores = (d.fornecedores || []).map(f => ({ ...f, valor:0, pago:0, pixChave:"", pixTitular:"" }));
  d.documentos = (d.documentos || []).filter(docVisivelCerimonial);
  if(d.caixaPadrinhos) d.caixaPadrinhos.itens = (d.caixaPadrinhos.itens || []).map(i => ({ ...i, preco:0 }));
  d.notificacoes = [];
  d.casal.cerimonialAtiva = false;
  return d;
}
async function cerEnviarVisao(){
  if(modoCerimonial() || !siteConfigurado() || !App.data.casal.cerimonialAtiva) return;
  try{ await chamarRPCSite("salvar_visao_cerimonial", { p_senha:App.data.casal.supabaseSenha, p_dados:visaoCerimonial() }); }
  catch(e){ /* tenta de novo no próximo envio */ }
}

/* ---------- lado da cerimonialista ---------- */
function cerAdotar(remoto){
  const novo = migrarDados(remoto.dados);
  novo.casal.supabaseUrl = NUVEM_PADRAO.url; novo.casal.supabaseKey = NUVEM_PADRAO.key; novo.casal.supabaseSenha = "";
  App.data = novo;
  gravarLocal();
  Nuvem.base = remoto.atualizado_em; Nuvem.sujo = false; Nuvem.ultima = new Date().toISOString();
  nuvemGravarMeta();
}
function cerMensagemErro(msg){
  if(/senha/i.test(msg)) return "Senha incorreta — confira com os noivos.";
  if(/Could not find the function|schema cache/i.test(msg)) return "O acesso ainda não foi liberado pelos noivos.";
  if(/Failed to fetch|NetworkError|Load failed/i.test(msg)) return "Sem conexão com o banco de dados. Tente de novo em instantes.";
  return "Não foi possível conectar: " + msg;
}
async function cerConectar(senha){
  const c = App.data.casal;
  const ant = { u:c.supabaseUrl, k:c.supabaseKey };
  c.supabaseUrl = NUVEM_PADRAO.url; c.supabaseKey = NUVEM_PADRAO.key;
  try{
    const remoto = await chamarRPCSite("obter_visao_cerimonial", { p_senha:senha });
    if(!remoto){ c.supabaseUrl = ant.u; c.supabaseKey = ant.k; return { ok:false, motivo:"Os noivos ainda não enviaram os dados. Peça para abrirem o Ateliê e tente de novo." }; }
    Nuvem.papel = "cerimonial"; Nuvem.senhaCer = senha;
    cerAdotar(remoto);
    nuvemDefinir("ok");
    return { ok:true };
  }catch(e){
    c.supabaseUrl = ant.u; c.supabaseKey = ant.k;
    return { ok:false, motivo:cerMensagemErro(e.message) };
  }
}
async function cerSincronizar(manual){
  if(!Nuvem.senhaCer){ nuvemDefinir("desconectado"); return { ok:false, motivo:"desconectado" }; }
  if(Nuvem.ocupado) return { ok:false, motivo:"ocupado" };
  if(!navigator.onLine){ nuvemDefinir("erro", "sem internet"); return { ok:false, motivo:"sem internet" }; }
  Nuvem.ocupado = true;
  nuvemDefinir("sincronizando");
  try{
    const remoto = await chamarRPCSite("obter_visao_cerimonial", { p_senha:Nuvem.senhaCer });
    Nuvem.ocupado = false;
    let resultado = "nada";
    if(remoto && remoto.atualizado_em !== Nuvem.base){
      if(!manual && !nuvemPodeAtualizarTela()) resultado = "adiado";
      else { cerAdotar(remoto); resultado = "baixou"; render(); }
    }
    nuvemDefinir("ok");
    return { ok:true, resultado };
  }catch(e){
    Nuvem.ocupado = false;
    if(/senha/i.test(e.message)){
      nuvemDefinir("erro", "o acesso foi desligado ou a senha mudou");
      return { ok:false, motivo:"A senha mudou ou o acesso foi desligado pelos noivos." };
    }
    nuvemDefinir("erro", nuvemMensagemErro(e.message));
    return { ok:false, motivo:e.message };
  }
}
let cerAvisoEm = 0;
function cerDesfazerAlteracao(){
  App.data = carregar();          // volta para a última cópia recebida
  if(modalAberto) fecharModal();
  render();
  if(Date.now() - cerAvisoEm > 2500){
    cerAvisoEm = Date.now();
    toast("Você está no modo de visualização — só os noivos podem alterar.", "err");
  }
}
function cerDesconectar(){
  confirmar("Sair do acesso",
    "Os dados do casamento serão apagados deste aparelho. Para ver de novo, é só entrar outra vez com a senha.", () => {
      Nuvem.papel = "casal"; Nuvem.senhaCer = ""; Nuvem.base = null; Nuvem.sujo = false; Nuvem.ultima = null;
      nuvemGravarMeta();
      App.data = dadosIniciais(); gravarLocal();
      nuvemDefinir("desconectado"); irPara("dashboard"); render();
      toast("Você saiu do acesso.", "ok");
    }, "Sair");
}

/* ---------- arquivos na nuvem ---------- */
function blobParaBase64(blob){
  return new Promise((resolve, reject) => {
    const l = new FileReader();
    l.onload = () => resolve(String(l.result).split(",")[1] || "");
    l.onerror = () => reject(l.error);
    l.readAsDataURL(blob);
  });
}
function base64ParaBlob(b64, tipo){
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo || "application/octet-stream" });
}
let arqEnviando = false;
/* sobe os arquivos que só existem neste aparelho; devolve quantos subiram */
async function arquivosEnviarPendentes(){
  if(arqEnviando || modoCerimonial() || !siteConfigurado()) return 0;
  arqEnviando = true;
  let n = 0, mudou = false;
  try{
    for(const doc of App.data.documentos.filter(x => !x.naNuvem && !x.grandeDemais)){
      const blob = await lerArquivoBlob(doc.id).catch(() => null);
      if(!blob) continue;
      if(blob.size > ARQ_LIMITE){ doc.grandeDemais = true; mudou = true; continue; }
      await chamarRPCSite("salvar_arquivo_atelie", {
        p_senha:App.data.casal.supabaseSenha, p_id:doc.id, p_nome:doc.nome,
        p_tipo:blob.type || "", p_dados:await blobParaBase64(blob)
      });
      doc.naNuvem = true; mudou = true; n++;
    }
  }catch(e){ /* tenta de novo na próxima sincronização */ }
  arqEnviando = false;
  if(mudou){ salvar(); if(App.rota === "documentos" || App.rota === "config") render(); }
  return n;
}
async function arquivoBaixarDaNuvem(doc){
  const senha = modoCerimonial() ? Nuvem.senhaCer : App.data.casal.supabaseSenha;
  if(!senha) return null;
  toast("Baixando o arquivo…");
  try{
    const r = await chamarRPCSite("obter_arquivo_atelie", { p_senha:senha, p_id:doc.id });
    if(!r || !r.dados) return null;
    const blob = base64ParaBlob(r.dados, r.tipo);
    salvarArquivoBlob(doc.id, blob).catch(() => {});   // guarda para abrir mais rápido da próxima vez
    return blob;
  }catch(e){
    toast("Não foi possível baixar: " + nuvemMensagemErro(e.message), "err");
    return null;
  }
}
function arquivoRemoverDaNuvem(id){
  if(modoCerimonial() || !siteConfigurado()) return;
  chamarRPCSite("remover_arquivo_atelie", { p_senha:App.data.casal.supabaseSenha, p_id:id }).catch(() => {});
}

/* chamado depois de cada sincronização bem-sucedida dos noivos */
function cerDepoisDeSincronizar(manual){
  arquivosEnviarPendentes();
  if(manual) cerEnviarVisao();
}

/* ---------- Configurações: cartão dos noivos ---------- */
function cerCardConfigHTML(){
  if(modoCerimonial()) return "";
  const c = App.data.casal, conectado = siteConfigurado(), ativa = !!c.cerimonialAtiva;
  const docs = App.data.documentos, naNuvem = docs.filter(x => x.naNuvem).length;
  const grandes = docs.filter(x => x.grandeDemais).length;
  return `<div class="card">
    <div class="card-head"><h3>Acesso da cerimonialista</h3>
      <span class="badge ${ativa ? "ok" : "plain"}">${ativa ? "Ativo" : "Desligado"}</span></div>
    <div class="card-body">
      <p class="t-sm t-ink3" style="line-height:1.6">Ela entra com uma <strong>senha própria</strong> e só <strong>visualiza</strong>:
        convidados, padrinhos e cortejo, mesas, fornecedores e contatos, contratos, tarefas, cronograma e inspirações.</p>
      <p class="t-sm t-ink3 mt-8" style="line-height:1.6">Ela <strong>não vê</strong> valores, parcelas, orçamento, a tela Financeiro, comprovantes nem orçamentos anexados — essas informações nem chegam ao aparelho dela.</p>
      ${conectado ? `<p class="t-xs t-muted mt-12">${ico("file")} Arquivos na nuvem: ${naNuvem} de ${docs.length}${grandes ? ` · ${grandes} acima de 10 MB ficam só no aparelho onde foram enviados` : ""}</p>` : ""}
      ${!conectado ? `<div class="alert warn mt-12">${ico("alert")}<div><div class="a-title">Conecte este aparelho primeiro</div>
        <div class="a-desc">O acesso da cerimonialista usa a sincronização entre aparelhos (cartão acima).</div></div></div>` : ""}
    </div>
    ${conectado ? `<div class="card-foot between" style="flex-wrap:wrap;gap:10px">
      ${ativa ? `<button class="btn btn-sm btn-danger" data-cer-desligar>Desligar acesso</button>` : `<span></span>`}
      <span class="center gap-8" style="flex-wrap:wrap">
        ${ativa
          ? `<button class="btn btn-sm" data-cer-senha>Trocar senha</button>
             <button class="btn btn-sm btn-primary" data-cer-compartilhar>${ico("send")}Enviar acesso</button>`
          : `<button class="btn btn-sm btn-primary" data-cer-senha>Criar acesso</button>`}
      </span>
    </div>` : ""}
  </div>`;
}

/* Configurações vistas pela cerimonialista */
function cerConfigViewHTML(){
  const d = App.data;
  const ultima = Nuvem.ultima ? new Date(Nuvem.ultima).toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" }) : "—";
  return `
  <div class="page-head"><div>
    <h1 class="page-title">Configurações</h1>
    <p class="page-sub">Acesso da cerimonialista ao casamento de ${esc(d.casal.noiva)} e ${esc(d.casal.noivo)}.</p>
  </div></div>
  <div class="card" style="max-width:620px">
    <div class="card-head"><h3>Seu acesso</h3><span class="badge gold">${ico("eye")}Só visualização</span></div>
    <div class="card-body">
      <p class="t-sm t-ink3" style="line-height:1.6">Tudo o que os noivos alteram aparece aqui sozinho em alguns segundos.
        Para mudar alguma informação, fale com eles.</p>
      <p class="t-xs t-muted mt-12">Última atualização: ${esc(ultima)}</p>
    </div>
    <div class="card-foot between">
      <button class="btn btn-sm btn-danger" data-desconectar-nuvem>Sair do acesso</button>
      <button class="btn btn-sm" data-nuvem-agora>${ico("refresh")}Atualizar agora</button>
    </div>
  </div>`;
}

function cerSugestaoSenha(){
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return "cerimonia" + n;
}
function abrirSenhaCerimonial(){
  const c = App.data.casal;
  modal({
    titulo: c.cerimonialAtiva ? "Trocar a senha da cerimonialista" : "Criar acesso da cerimonialista",
    sub: "Use uma senha diferente da senha do painel.",
    tamanho: "narrow",
    corpo: `<div class="field"><label>Senha da cerimonialista</label>
        <input class="input" id="cer-nova" value="${cerSugestaoSenha()}" autocomplete="off"></div>
      <p class="t-xs t-muted mt-8">${c.cerimonialAtiva ? "A senha antiga para de funcionar na hora." : "Você pode trocar ou desligar quando quiser."}</p>
      <div class="rsvp-msg" id="cer-erro" style="display:none;margin-top:12px;color:var(--danger)"></div>`,
    rodape: `<button class="btn" data-fechar>Cancelar</button>
             <button class="btn btn-primary" id="cer-salvar">${c.cerimonialAtiva ? "Trocar senha" : "Criar acesso"}</button>`,
    aoAbrir(w){
      const inp = w.querySelector("#cer-nova"), erro = w.querySelector("#cer-erro"), btn = w.querySelector("#cer-salvar");
      const go = async () => {
        const nova = inp.value.trim();
        if(nova.length < 4){ erro.textContent = "Use uma senha com pelo menos 4 caracteres."; erro.style.display = ""; return; }
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Salvando…`;
        try{
          await chamarRPCSite("definir_senha_cerimonial", { p_senha:c.supabaseSenha, p_nova:nova });
          c.cerimonialAtiva = true; salvar();
          await chamarRPCSite("salvar_visao_cerimonial", { p_senha:c.supabaseSenha, p_dados:visaoCerimonial() });
          arquivosEnviarPendentes();
          fecharModal(); render();
          abrirCompartilharCerimonial(nova);
        }catch(e){
          btn.disabled = false; btn.textContent = c.cerimonialAtiva ? "Trocar senha" : "Criar acesso";
          erro.textContent = /Could not find the function|schema cache/i.test(e.message)
            ? "Falta rodar o SQL novo no Supabase (arquivo convite/supabase-cerimonialista.sql)."
            : nuvemMensagemErro(e.message);
          erro.style.display = "";
        }
      };
      btn.onclick = go;
      inp.addEventListener("keydown", e => { if(e.key === "Enter") go(); });
      setTimeout(() => inp.select(), 50);
    }
  });
}
async function abrirCompartilharCerimonial(senhaConhecida){
  const c = App.data.casal;
  let senha = senhaConhecida;
  if(!senha){
    try{ senha = await chamarRPCSite("obter_senha_cerimonial", { p_senha:c.supabaseSenha }); }
    catch(e){ toast("Não foi possível buscar a senha: " + nuvemMensagemErro(e.message), "err"); return; }
  }
  const msg = `Oi! Este é o organizador do nosso casamento. Lá você vê convidados, padrinhos e cortejo, mesas, fornecedores, contratos, tarefas e o cronograma do dia — tudo atualizado na hora.\n\n` +
    `1. Abra o link: ${CER_LINK}\n2. Escolha "Sou a cerimonialista"\n3. Digite a senha: ${senha}\n\n${c.noiva} & ${c.noivo}`;
  modal({
    titulo: "Enviar acesso à cerimonialista",
    sub: "Mande esta mensagem para ela pelo WhatsApp.",
    corpo: `<textarea class="textarea" id="cer-msg" style="min-height:220px" readonly>${esc(msg)}</textarea>`,
    rodape: `<button class="btn" data-fechar>Fechar</button>
             <button class="btn" id="cer-copiar">${ico("copy")}Copiar</button>
             <button class="btn btn-primary" id="cer-whats">${ico("send")}Abrir WhatsApp</button>`,
    aoAbrir(w){
      w.querySelector("#cer-copiar").onclick = () => {
        if(navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
        else { const t = w.querySelector("#cer-msg"); t.select(); document.execCommand("copy"); }
        toast("Mensagem copiada.", "ok");
      };
      w.querySelector("#cer-whats").onclick = () => window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
    }
  });
}

document.addEventListener("click", e => {
  if(e.target.closest("[data-cer-senha]")){ abrirSenhaCerimonial(); return; }
  if(e.target.closest("[data-cer-compartilhar]")){ abrirCompartilharCerimonial(); return; }
  if(e.target.closest("[data-cer-desligar]")){
    confirmar("Desligar o acesso da cerimonialista",
      "A senha dela para de funcionar na hora. Dá para criar um acesso novo depois.", async () => {
        const c = App.data.casal;
        try{
          await chamarRPCSite("definir_senha_cerimonial", { p_senha:c.supabaseSenha, p_nova:"" });
          c.cerimonialAtiva = false; salvar(); render();
          toast("Acesso da cerimonialista desligado.", "ok");
        }catch(err){ toast("Não foi possível desligar: " + nuvemMensagemErro(err.message), "err"); }
      }, "Desligar");
  }
});
