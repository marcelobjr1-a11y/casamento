/* ============================================================
   ATELIÊ — Fornecedores · Financeiro · Tarefas · Cronograma
             Documentos · Inspirações · Equipe · Grande dia · Config
   ============================================================ */

/* =========================================================
   FORNECEDORES
   ========================================================= */
VIEWS.fornecedores = function(){
  const d = App.data, f = App.filtros.fornecedores, m = metricas();
  const lista = filtrarFornecedores();
  const cats = [...new Set(d.fornecedores.map(x => x.cat))].sort();

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Fornecedores</h1>
      <p class="page-sub"><b>${m.contratados.length}</b> contratados · ${money(m.valorContratado)} em contratos fechados.</p>
    </div>
    <div class="page-actions">
      <div class="seg">
        <button class="${f.vista==="grade"?"active":""}" data-vista="grade">${ico("grid")}</button>
        <button class="${f.vista==="lista"?"active":""}" data-vista="lista">${ico("list")}</button>
      </div>
      <button class="btn btn-primary" data-novo-forn>${ico("plus")}Novo fornecedor</button>
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${miniStat("Contratados", m.contratados.length, "de "+d.fornecedores.length+" cadastrados", "briefcase","g2")}
    ${miniStat("Em negociação", d.fornecedores.filter(x => x.status==="Em negociação").length, "aguardando decisão", "chat","g4")}
    ${miniStat("Valor contratado", money(m.valorContratado), "em "+m.contratados.length+" contratos", "dollar")}
    ${miniStat("Já pago", money(m.valorPago), pct(m.valorPago,m.valorContratado)+"% do contratado", "card","g3")}
  </div>

  <div class="card mb-20">
    <div class="card-body" style="padding-bottom:18px">
      <div class="between wrap gap-12">
        <div class="input-ico" style="max-width:320px;flex:1;min-width:200px">
          ${ico("search")}<input class="input" id="busca-forn" placeholder="Buscar fornecedor…" value="${esc(f.busca)}">
        </div>
        <div class="center gap-10 wrap">
          <select class="select" id="filtro-cat" style="width:auto;min-width:160px">
            <option value="todas">Todas as categorias</option>
            ${cats.map(c => `<option value="${esc(c)}" ${f.cat===c?"selected":""}>${esc(c)}</option>`).join("")}
          </select>
          <select class="select" id="filtro-status" style="width:auto;min-width:170px">
            <option value="todos">Todos os status</option>
            ${STATUS_FORN.map(s => `<option value="${esc(s)}" ${f.status===s?"selected":""}>${esc(s)}</option>`).join("")}
          </select>
        </div>
      </div>
    </div>
  </div>

  ${lista.length === 0
    ? `<div class="card">${vazio("briefcase","Nenhum fornecedor encontrado","Tente outra busca ou limpe os filtros aplicados.",
        `<button class="btn btn-primary" data-limpar-forn>Limpar filtros</button>`)}</div>`
    : f.vista === "grade" ? `
    <div class="grid g-3">
      ${lista.map(x => {
        const rest = x.valor - x.pago;
        return `<button class="card card-hover card-pad" data-forn="${x.id}" style="text-align:left;width:100%">
          <div class="between" style="align-items:flex-start">
            <div class="center gap-12" style="min-width:0">
              <span class="stat-ico" style="width:38px;height:38px;flex:0 0 38px;border-radius:10px">${ico(CAT_ICO[x.cat]||"briefcase")}</span>
              <span style="min-width:0">
                <span class="ell" style="display:block;font-size:14px;font-weight:550">${esc(x.nome)}</span>
                <span class="t-xs t-muted">${esc(x.cat)}</span>
              </span>
            </div>
            ${badgeStatusForn(x.status)}
          </div>
          <div class="sep" style="margin:14px 0"></div>
          ${x.valor ? `
            <div class="between mb-8">
              <span class="t-xs t-muted">Contratado</span>
              <span class="num" style="font-size:17px">${money(x.valor)}</span>
            </div>
            ${barra(x.pago, x.valor, "ok")}
            <div class="between mt-8">
              <span class="t-xs t-muted">Pago ${money(x.pago)}</span>
              <span class="t-xs ${rest>0?"":"t-muted"}" style="${rest>0?"color:var(--warn)":""}">${rest>0?`Falta ${money(rest)}`:"Quitado"}</span>
            </div>`
          : `<div class="t-sm t-muted" style="line-height:1.5">${esc(x.nota.slice(0,90))}${x.nota.length>90?"…":""}</div>`}
          <div class="center gap-8 mt-16 t-xs t-muted">
            ${ico("phone")}<span>${esc(x.tel)}</span>
          </div>
        </button>`;
      }).join("")}
    </div>`
    : `<div class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr><th style="width:26%">Fornecedor</th><th>Categoria</th><th>Contato</th><th>Status</th>
        <th class="right">Contratado</th><th class="right">Pago</th><th class="right">Restante</th><th></th></tr></thead>
        <tbody>${lista.map(x => `
          <tr data-forn="${x.id}" style="cursor:pointer">
            <td><span class="cell-name">
              <span class="stat-ico" style="width:32px;height:32px;flex:0 0 32px;border-radius:9px">${ico(CAT_ICO[x.cat]||"briefcase")}</span>
              <span class="nm ell">${esc(x.nome)}</span></span></td>
            <td class="t-sm t-ink3">${esc(x.cat)}</td>
            <td class="t-sm t-ink3 ell">${esc(x.contato)}</td>
            <td>${badgeStatusForn(x.status)}</td>
            <td class="right tnum">${x.valor?money(x.valor):"—"}</td>
            <td class="right tnum t-ink3">${x.pago?money(x.pago):"—"}</td>
            <td class="right tnum" style="${x.valor-x.pago>0?"color:var(--warn)":"color:var(--muted)"}">${x.valor?money(x.valor-x.pago):"—"}</td>
            <td><span class="row-actions">
              <button class="mini-btn" data-editar-forn="${x.id}">${ico("edit")}</button>
              <button class="mini-btn danger" data-excluir-forn="${x.id}">${ico("trash")}</button>
            </span></td>
          </tr>`).join("")}
        </tbody></table></div></div>`}`;
};

function filtrarFornecedores(){
  const f = App.filtros.fornecedores, q = f.busca.trim().toLowerCase();
  return App.data.fornecedores.filter(x => {
    if(f.cat !== "todas" && x.cat !== f.cat) return false;
    if(f.status !== "todos" && x.status !== f.status) return false;
    if(q && !(x.nome.toLowerCase().includes(q) || x.contato.toLowerCase().includes(q) || x.cat.toLowerCase().includes(q))) return false;
    return true;
  });
}

POS_RENDER.fornecedores = function(){
  const v = $("#view");
  const b = $("#busca-forn");
  if(b){
    let t; b.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => {
      App.filtros.fornecedores.busca = b.value; const p = b.selectionStart; render();
      const n = $("#busca-forn"); if(n){ n.focus(); n.setSelectionRange(p,p); }
    }, 220); });
  }
  const c = $("#filtro-cat"); if(c) c.onchange = () => { App.filtros.fornecedores.cat = c.value; render(); };
  const s = $("#filtro-status"); if(s) s.onchange = () => { App.filtros.fornecedores.status = s.value; render(); };

  v.addEventListener("click", e => {
    const vi = e.target.closest("[data-vista]");
    if(vi){ App.filtros.fornecedores.vista = vi.dataset.vista; render(); return; }
    if(e.target.closest("[data-novo-forn]")){ abrirFormFornecedor(); return; }
    if(e.target.closest("[data-limpar-forn]")){
      App.filtros.fornecedores = { busca:"", cat:"todas", status:"todos", vista:App.filtros.fornecedores.vista }; render(); return; }
    const ed = e.target.closest("[data-editar-forn]");
    if(ed){ e.stopPropagation(); abrirFormFornecedor(ed.dataset.editarForn); return; }
    const ex = e.target.closest("[data-excluir-forn]");
    if(ex){
      e.stopPropagation();
      const x = fornecedor(ex.dataset.excluirForn);
      confirmar("Excluir fornecedor", `Remover <strong>${esc(x.nome)}</strong>? Os pagamentos ligados a ele também serão apagados.`, () => {
        App.data.fornecedores = App.data.fornecedores.filter(y => y.id !== x.id);
        App.data.pagamentos = App.data.pagamentos.filter(p => p.fornecedor !== x.id);
        salvar(); render(); toast("Fornecedor removido.","ok");
      }, "Excluir");
      return;
    }
    const fo = e.target.closest("[data-forn]");
    if(fo) abrirFornecedor(fo.dataset.forn);
  });
};

function abrirFornecedor(id){
  const x = fornecedor(id); if(!x) return;
  const pags = App.data.pagamentos.filter(p => p.fornecedor === id).sort((a,b) => a.venc.localeCompare(b.venc));
  const docs = App.data.documentos.filter(dd => dd.forn === id);
  const rest = x.valor - x.pago;
  modal({
    titulo:esc(x.nome), sub:`${esc(x.cat)} · ${esc(x.status)}`, tamanho:"wide",
    corpo:`
      <div class="center gap-16 mb-20 wrap">
        <span class="stat-ico" style="width:56px;height:56px;flex:0 0 56px;border-radius:16px">${ico(CAT_ICO[x.cat]||"briefcase")}</span>
        <div class="grow" style="min-width:180px">
          <div class="center gap-8 wrap">${badgeStatusForn(x.status)}
            ${x.contrato?`<span class="badge gold">${ico("file")}Contrato</span>`:""}</div>
          <div class="t-sm t-muted mt-8">${esc(x.contato)} · ${esc(x.tel)}</div>
          <div class="t-sm t-muted">${esc(x.email)}</div>
        </div>
        ${x.valor ? `<div style="text-align:right">
          <div class="eyebrow">Valor contratado</div>
          <div class="num" style="font-size:24px">${money(x.valor)}</div>
        </div>` : ""}
      </div>

      ${x.valor ? `
      <div class="grid g-3" style="gap:12px" class="mb-20">
        ${linhaInfo("Pago", money(x.pago))}
        ${linhaInfo("Restante", money(rest))}
        ${linhaInfo("Contratado em", x.data ? fmtData(x.data, true) : "—")}
      </div>
      <div class="mt-12">${barra(x.pago, x.valor, "ok", "thick")}</div>` : ""}

      <div class="sep"></div>
      <div class="eyebrow mb-8">Observações</div>
      <p class="t-sm t-ink3" style="line-height:1.65">${esc(x.nota)}</p>

      ${pags.length ? `<div class="sep"></div>
      <div class="eyebrow mb-8">Pagamentos (${pags.length})</div>
      ${pags.map(p => `
        <div class="list-row">
          <span class="grow"><span style="display:block;font-size:13px">${esc(p.desc)}</span>
          <span class="t-xs t-muted">${fmtData(p.venc, true)}</span></span>
          <span class="num tnum" style="font-size:15px">${money(p.valor)}</span>
          ${badgePagamento(p)}
        </div>`).join("")}` : ""}

      ${docs.length ? `<div class="sep"></div>
      <div class="eyebrow mb-8">Documentos (${docs.length})</div>
      ${docs.map(dd => `
        <div class="list-row">
          <span class="doc-ico ${dd.tipo}">${dd.tipo.toUpperCase()}</span>
          <span class="grow"><span class="ell" style="display:block;font-size:13px">${esc(dd.nome)}</span>
          <span class="t-xs t-muted">${esc(dd.tam)} · ${fmtData(dd.data)}</span></span>
          ${dd.assinado?`<span class="badge ok">Assinado</span>`:`<span class="badge warn">Pendente</span>`}
        </div>`).join("")}` : ""}`,
    rodape:`<button class="btn btn-danger" data-excluir>Excluir</button>
            <div class="grow"></div>
            <button class="btn" data-fechar>Fechar</button>
            <button class="btn" data-pagamento>${ico("plus")}Pagamento</button>
            <button class="btn btn-primary" data-editar>Editar</button>`,
    aoAbrir(w){
      w.addEventListener("click", e => {
        if(e.target.closest("[data-editar]")){ fecharModal(); abrirFormFornecedor(id); }
        if(e.target.closest("[data-pagamento]")){ fecharModal(); abrirFormPagamento(null, id); }
        if(e.target.closest("[data-excluir]")){
          fecharModal();
          confirmar("Excluir fornecedor", `Remover <strong>${esc(x.nome)}</strong> e seus pagamentos?`, () => {
            App.data.fornecedores = App.data.fornecedores.filter(y => y.id !== id);
            App.data.pagamentos = App.data.pagamentos.filter(p => p.fornecedor !== id);
            salvar(); render(); toast("Fornecedor removido.","ok");
          }, "Excluir");
        }
      });
    }
  });
}

function abrirFormFornecedor(id){
  const x = id ? fornecedor(id) : null;
  const parcelasAtuais = x ? App.data.pagamentos.filter(p => p.fornecedor === x.id && p.auto).length : 0;
  modal({
    titulo: x ? "Editar fornecedor" : "Novo fornecedor",
    sub: x ? "" : "Cadastre um fornecedor e acompanhe o contrato.",
    tamanho:"wide",
    corpo:`<form id="form-forn" class="form-grid">
      <div class="field full"><label>Nome *</label>
        <input class="input" name="nome" required value="${x?esc(x.nome):""}" placeholder="Ex.: Buffet La Maison"></div>
      <div class="field"><label>Categoria</label>
        <select class="select" name="cat">${CATEGORIAS.map(c => `<option ${x&&x.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div>
      <div class="field"><label>Status</label>
        <select class="select" name="status">${STATUS_FORN.map(s => `<option ${x&&x.status===s?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
      <div class="field"><label>Pessoa de contato</label>
        <input class="input" name="contato" value="${x?esc(x.contato):""}"></div>
      <div class="field"><label>Telefone</label>
        <input class="input" name="tel" value="${x?esc(x.tel):""}" placeholder="(11) 99999-0000"></div>
      <div class="field full"><label>E-mail</label>
        <input class="input" name="email" type="email" value="${x?esc(x.email):""}"></div>
      <div class="field"><label>Valor contratado (R$)</label>
        <input class="input" name="valor" id="fv-valor" type="number" min="0" step="50" value="${x?x.valor:0}"></div>
      <div class="field"><label>Valor já pago (R$)</label>
        <input class="input" name="pago" type="number" min="0" step="50" value="${x?x.pago:0}"></div>
      <div class="field"><label>Data de contratação</label>
        <input class="input" name="data" type="date" value="${x?esc(x.data):""}"></div>
      <div class="field" style="justify-content:flex-end">
        <label class="switch"><input type="checkbox" name="contrato" ${x&&x.contrato?"checked":""}>
        <span class="track"></span><span class="t-sm">Contrato assinado</span></label></div>
      <div class="field full"><label>Observações</label>
        <textarea class="textarea" name="nota" placeholder="O que está incluído, condições, combinados…">${x?esc(x.nota):""}</textarea></div>

      <div class="field full">
        <div class="sep" style="margin:4px 0 16px"></div>
        <div class="between" style="margin-bottom:2px">
          <label style="margin:0">Parcelamento mensal</label>
          ${parcelasAtuais ? `<span class="badge gold">${parcelasAtuais} parcela(s) geradas</span>` : ""}
        </div>
        <span class="hint">Preencha para gerar automaticamente as parcelas no Financeiro. Deixe em branco se for pagar de outro jeito.</span>
      </div>
      <div class="field"><label>Valor da parcela (R$)</label>
        <input class="input" name="parcelaValor" id="fv-parcela" type="number" min="0" step="10" placeholder="Ex.: 500"></div>
      <div class="field"><label>Quantidade de parcelas</label>
        <input class="input" name="parcelaQtd" id="fv-qtd" type="number" min="0" max="60" placeholder="Ex.: 6"></div>
      <div class="field full"><label>Vencimento da 1ª parcela</label>
        <input class="input" name="parcelaInicio" type="date"></div>
      <div class="field full" id="fv-preview" style="display:none">
        <div class="alert info" style="padding:11px 13px">
          ${ico("info")}<div class="a-desc" id="fv-preview-texto"></div>
        </div>
      </div>
    </form>`,
    rodape:`<button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-forn">${x?"Salvar alterações":"Cadastrar"}</button>`,
    aoAbrir(w){
      const iValor = w.querySelector("#fv-parcela"), iQtd = w.querySelector("#fv-qtd"), prev = w.querySelector("#fv-preview"), prevT = w.querySelector("#fv-preview-texto");
      const atualizarPreview = () => {
        const v = Number(iValor.value)||0, q = Number(iQtd.value)||0;
        if(v > 0 && q > 0){
          prev.style.display = "";
          prevT.textContent = `${q}x de ${moneyF(v)} = ${moneyF(v*q)} no total.`;
        } else prev.style.display = "none";
      };
      iValor.addEventListener("input", atualizarPreview);
      iQtd.addEventListener("input", atualizarPreview);

      w.querySelector("#salvar-forn").onclick = () => {
        const fd = new FormData(w.querySelector("#form-forn"));
        const nome = String(fd.get("nome")||"").trim();
        if(!nome){ toast("Informe o nome do fornecedor.","err"); return; }
        const pValor = Number(fd.get("parcelaValor"))||0;
        const pQtd = Number(fd.get("parcelaQtd"))||0;
        const pInicio = fd.get("parcelaInicio")||"";
        if((pValor > 0 || pQtd > 0) && (!pValor || !pQtd || !pInicio)){
          toast("Para gerar as parcelas, preencha valor, quantidade e a data da 1ª parcela.","err"); return;
        }
        const dados = {
          nome, cat:fd.get("cat"), status:fd.get("status"), contato:fd.get("contato")||"",
          tel:fd.get("tel")||"", email:fd.get("email")||"",
          valor:Number(fd.get("valor"))||0, pago:Number(fd.get("pago"))||0,
          data:fd.get("data")||"", contrato:!!fd.get("contrato"), nota:fd.get("nota")||""
        };
        let alvo;
        if(x){ Object.assign(x, dados); alvo = x; }
        else { alvo = { id:uid("f"), ...dados }; App.data.fornecedores.unshift(alvo); }

        if(pValor > 0 && pQtd > 0 && pInicio){
          App.data.pagamentos = App.data.pagamentos.filter(p => !(p.fornecedor === alvo.id && p.auto));
          for(let i = 0; i < pQtd; i++){
            App.data.pagamentos.push({
              id:uid("p"), fornecedor:alvo.id, desc:`Parcela ${i+1}/${pQtd}`,
              valor:pValor, venc:somarMeses(pInicio, i), status:"pendente", auto:true
            });
          }
          if(!alvo.valor) alvo.valor = pValor * pQtd;
        }
        salvar(); fecharModal(); render();
        toast(x?"Fornecedor atualizado.":"Fornecedor cadastrado.","ok");
      };
    }
  });
}

/* =========================================================
   FINANCEIRO
   ========================================================= */
VIEWS.financeiro = function(){
  const d = App.data, m = metricas();
  const vista = App.filtros.financeiro.vista;

  const cats = d.orcamentoCats.map(c => {
    const fs = d.fornecedores.filter(f => f.cat === c.cat && (f.status === "Contratado" || f.status === "Concluído"));
    const contratado = fs.reduce((a,f) => a + f.valor, 0);
    const ids = fs.map(f => f.id);
    const pago = d.pagamentos.filter(p => ids.includes(p.fornecedor) && p.status === "pago").reduce((a,p) => a + p.valor, 0);
    return { ...c, contratado, pago, restante:contratado - pago };
  });
  const totOrcado = cats.reduce((a,c) => a + c.orcado, 0);

  const pagOrdenados = d.pagamentos.slice().sort((a,b) => a.venc.localeCompare(b.venc));
  const emAberto = pagOrdenados.filter(p => p.status !== "pago");

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Financeiro</h1>
      <p class="page-sub"><b>${money(m.valorRestante)}</b> ainda a pagar · ${pct(m.valorPago, m.valorContratado)}% do contratado já quitado.</p>
    </div>
    <div class="page-actions">
      <div class="seg">
        <button class="${vista==="resumo"?"active":""}" data-fvista="resumo">Resumo</button>
        <button class="${vista==="mensal"?"active":""}" data-fvista="mensal">Por mês</button>
        <button class="${vista==="pagamentos"?"active":""}" data-fvista="pagamentos">Pagamentos</button>
      </div>
      <button class="btn btn-primary" data-novo-pag>${ico("plus")}Novo pagamento</button>
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${miniStat("Orçamento total", money(m.orcamento), "definido pelos noivos", "target")}
    ${miniStat("Valor contratado", money(m.valorContratado), pct(m.valorContratado,m.orcamento)+"% do orçamento", "briefcase","g3")}
    ${miniStat("Já pago", money(m.valorPago), pct(m.valorPago,m.valorContratado)+"% do contratado", "checkCircle","g2")}
    ${miniStat("A pagar", money(m.valorRestante), emAberto.length+" parcelas em aberto", "card","g4")}
  </div>

  ${vista === "resumo" ? `
  <div class="dash-main">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h3>Orçamento por categoria</h3>
          <span class="t-xs t-muted">Orçado ${money(totOrcado)} · Contratado ${money(m.valorContratado)}</span></div>
        <div class="card-body" style="padding-top:8px">
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>Categoria</th><th class="right">Orçado</th><th class="right">Contratado</th>
            <th class="right">Pago</th><th class="right">Restante</th><th style="width:110px">Uso</th></tr></thead>
            <tbody>
              ${cats.filter(c => c.orcado > 0 || c.contratado > 0).map(c => `
                <tr>
                  <td><span class="cell-name"><span style="color:var(--gold);display:flex">${ico(CAT_ICO[c.cat]||"more")}</span>
                    <span class="nm">${esc(c.cat)}</span></span></td>
                  <td class="right tnum t-ink3">${money(c.orcado)}</td>
                  <td class="right tnum">${c.contratado?money(c.contratado):"—"}</td>
                  <td class="right tnum t-ink3">${c.pago?money(c.pago):"—"}</td>
                  <td class="right tnum" style="${c.restante>0?"color:var(--warn)":"color:var(--muted)"}">${c.restante?money(c.restante):"—"}</td>
                  <td>${barra(c.contratado, c.orcado, c.contratado > c.orcado ? "danger":"")}</td>
                </tr>`).join("")}
            </tbody>
            <tfoot><tr style="border-top:1px solid var(--line)">
              <td style="padding-top:14px"><strong>Total</strong></td>
              <td class="right tnum" style="padding-top:14px"><strong>${money(totOrcado)}</strong></td>
              <td class="right tnum" style="padding-top:14px"><strong>${money(m.valorContratado)}</strong></td>
              <td class="right tnum" style="padding-top:14px"><strong>${money(m.valorPago)}</strong></td>
              <td class="right tnum" style="padding-top:14px"><strong>${money(m.valorRestante)}</strong></td>
              <td></td>
            </tr></tfoot>
          </table></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Próximos pagamentos</h3>
          <button class="link" data-fvista="pagamentos">Ver todos ${ico("chevronRight")}</button></div>
        <div class="card-body" style="padding-top:8px">
          <div class="table-wrap"><table class="tbl" style="min-width:600px">
            <thead><tr><th>Fornecedor</th><th>Descrição</th><th class="right">Valor</th><th>Vencimento</th><th>Status</th><th style="width:1%"></th></tr></thead>
            <tbody>${emAberto.slice(0,8).map(p => {
              const f = fornecedor(p.fornecedor) || { nome:"—", cat:"Outros" };
              return `<tr>
                <td><span class="cell-name"><span class="stat-ico" style="width:30px;height:30px;flex:0 0 30px;border-radius:8px">${ico(CAT_ICO[f.cat]||"card")}</span>
                  <span class="nm ell">${esc(f.nome)}</span></span></td>
                <td class="t-sm t-ink3 ell">${esc(p.desc)}</td>
                <td class="right tnum nowrap">${money(p.valor)}</td>
                <td class="t-sm nowrap">${fmtData(p.venc)}<span class="t-muted t-xs"> · ${prazoTexto(p.venc)}</span></td>
                <td>${badgePagamento(p)}</td>
                <td class="right"><button class="btn btn-sm" data-pagar="${p.id}">${ico("check")}Pagar</button></td>
              </tr>`;
            }).join("")}</tbody>
          </table></div>
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="card card-pad">
        <h3 class="display" style="font-size:19px">Saúde do orçamento</h3>
        <div class="mt-20">${anelProgresso(pct(m.valorContratado, m.orcamento), "comprometido")}</div>
        <div class="sep"></div>
        ${[["Orçamento", m.orcamento, "#E4DDD0"],["Contratado", m.valorContratado, "#A8874E"],["Pago", m.valorPago, "#6E8B6A"]]
          .map(([n,v,cor]) => `
          <div style="margin-bottom:13px">
            <div class="between mb-8"><span class="t-sm center gap-8">
              <i style="width:8px;height:8px;border-radius:2px;background:${cor};display:block"></i>${n}</span>
              <span class="num tnum" style="font-size:15px">${money(v)}</span></div>
            ${barra(v, m.orcamento, n==="Pago"?"ok":"")}
          </div>`).join("")}
        <div class="sep"></div>
        <div class="alert ${m.valorContratado > m.orcamento ? "danger":"ok"}" >
          ${ico(m.valorContratado > m.orcamento ? "alert":"checkCircle")}
          <div><div class="a-title">${m.valorContratado > m.orcamento ? "Orçamento estourado" : "Dentro do orçamento"}</div>
          <div class="a-desc">${m.valorContratado > m.orcamento
            ? `Você passou ${money(m.valorContratado - m.orcamento)} do previsto.`
            : `Ainda há ${money(m.orcamento - m.valorContratado)} disponíveis para contratar.`}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Alertas</h3></div>
        <div class="card-body" style="padding-top:10px">
          ${m.vencidos.length ? `<div class="alert danger mb-12">${ico("alert")}
            <div><div class="a-title">${m.vencidos.length} pagamento(s) atrasado(s)</div>
            <div class="a-desc">${money(m.vencidos.reduce((a,p)=>a+p.valor,0))} vencidos.</div></div></div>` : ""}
          ${m.venc7.length ? `<div class="alert warn mb-12">${ico("clock")}
            <div><div class="a-title">${m.venc7.length} vencem em 7 dias</div>
            <div class="a-desc">${money(m.venc7.reduce((a,p)=>a+p.valor,0))} no total.</div></div></div>` : ""}
          <div class="alert info">${ico("info")}
            <div><div class="a-title">Reserva sugerida</div>
            <div class="a-desc">Guarde ${money(Math.round(m.orcamento*0.05))} (5%) para imprevistos do dia.</div></div></div>
        </div>
      </div>
    </div>
  </div>`
  : vista === "mensal" ? `
  ${(() => {
    const porMes = {};
    d.pagamentos.forEach(p => {
      const chave = p.venc.slice(0,7);
      (porMes[chave] = porMes[chave] || []).push(p);
    });
    const meses = Object.keys(porMes).sort();
    if(!meses.length) return `<div class="card">${vazio("calendar","Nenhum pagamento cadastrado","Adicione um pagamento ou cadastre parcelas em um fornecedor.","")}</div>`;
    const mesAtual = hoje().toISOString().slice(0,7);
    const maxTotal = Math.max(...meses.map(mm => porMes[mm].reduce((a,p) => a+p.valor,0)));
    return `<div class="card">
      <div class="card-head"><h3>Quanto pagar por mês</h3>
        <span class="t-xs t-muted">${meses.length} meses com lançamentos</span></div>
      <div class="card-body" style="padding-top:8px">
        ${meses.map(mm => {
          const itens = porMes[mm].slice().sort((a,b) => a.venc.localeCompare(b.venc));
          const total = itens.reduce((a,p) => a+p.valor, 0);
          const pago = itens.filter(p => p.status === "pago").reduce((a,p) => a+p.valor, 0);
          const [y,mo] = mm.split("-").map(Number);
          const rotulo = MESES_L[mo-1].charAt(0).toUpperCase() + MESES_L[mo-1].slice(1) + " de " + y;
          return `<div style="margin-bottom:20px">
            <div class="between" style="margin-bottom:8px">
              <span class="center gap-8">
                <strong style="font-size:14px">${rotulo}</strong>
                ${mm === mesAtual ? `<span class="badge gold">mês atual</span>` : ""}
              </span>
              <span class="num tnum" style="font-size:17px">${money(total)}</span>
            </div>
            ${barra(total, maxTotal, pago >= total ? "ok" : "")}
            <div class="mt-8" style="border:1px solid var(--line-2);border-radius:10px;overflow:hidden">
              ${itens.map(p => {
                const f = fornecedor(p.fornecedor) || { nome:"—", cat:"Outros" };
                return `<div class="list-row" style="padding:9px 13px">
                  <span class="stat-ico" style="width:28px;height:28px;flex:0 0 28px;border-radius:8px">${ico(CAT_ICO[f.cat]||"card")}</span>
                  <span class="grow" style="min-width:0">
                    <span class="ell" style="display:block;font-size:12.5px;font-weight:480">${esc(f.nome)}</span>
                    <span class="t-xs t-muted ell" style="display:block">${esc(p.desc)} · ${fmtData(p.venc)}</span>
                  </span>
                  <span class="tnum t-sm" style="margin-right:8px">${money(p.valor)}</span>
                  ${badgePagamento(p)}
                </div>`;
              }).join("")}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  })()}`
  : `
    <div class="card">
    <div class="card-head"><h3>Todos os pagamentos</h3>
      <span class="t-xs t-muted">${pagOrdenados.length} lançamentos</span></div>
    <div class="card-body" style="padding-top:8px">
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Fornecedor</th><th>Descrição</th><th class="right">Valor</th><th>Vencimento</th><th>Status</th><th style="width:1%"></th></tr></thead>
        <tbody>${pagOrdenados.map(p => {
          const f = fornecedor(p.fornecedor) || { nome:"—", cat:"Outros" };
          return `<tr>
            <td><span class="cell-name"><span class="stat-ico" style="width:30px;height:30px;flex:0 0 30px;border-radius:8px">${ico(CAT_ICO[f.cat]||"card")}</span>
              <span class="nm ell">${esc(f.nome)}</span></span></td>
            <td class="t-sm t-ink3 ell">${esc(p.desc)}</td>
            <td class="right tnum nowrap">${money(p.valor)}</td>
            <td class="t-sm nowrap">${fmtData(p.venc)}</td>
            <td>${badgePagamento(p)}</td>
            <td><span class="row-actions">
              ${p.status !== "pago" ? `<button class="mini-btn" data-pagar="${p.id}" title="Marcar como pago">${ico("check")}</button>` : ""}
              <button class="mini-btn" data-editar-pag="${p.id}" title="Editar">${ico("edit")}</button>
              <button class="mini-btn danger" data-excluir-pag="${p.id}" title="Excluir">${ico("trash")}</button>
            </span></td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>
    </div>
  </div>`}`;
};

POS_RENDER.financeiro = function(){
  $("#view").addEventListener("click", e => {
    const v = e.target.closest("[data-fvista]");
    if(v){ App.filtros.financeiro.vista = v.dataset.fvista; render(); return; }
    if(e.target.closest("[data-novo-pag]")){ abrirFormPagamento(); return; }
    const pg = e.target.closest("[data-pagar]");
    if(pg){
      const p = App.data.pagamentos.find(x => x.id === pg.dataset.pagar);
      const f = fornecedor(p.fornecedor);
      confirmar("Confirmar pagamento",
        `Registrar o pagamento de <strong>${moneyF(p.valor)}</strong> para ${esc(f?f.nome:"—")} (${esc(p.desc)})?`, () => {
          p.status = "pago";
          if(f) f.pago = Math.min(f.valor, f.pago + p.valor);
          salvar(); render(); toast("Pagamento registrado.","ok");
        }, "Registrar pagamento");
      return;
    }
    const ed = e.target.closest("[data-editar-pag]");
    if(ed){ abrirFormPagamento(ed.dataset.editarPag); return; }
    const ex = e.target.closest("[data-excluir-pag]");
    if(ex){
      const p = App.data.pagamentos.find(x => x.id === ex.dataset.excluirPag);
      confirmar("Excluir pagamento", `Remover o lançamento <strong>${esc(p.desc)}</strong> de ${moneyF(p.valor)}?`, () => {
        App.data.pagamentos = App.data.pagamentos.filter(x => x.id !== p.id);
        salvar(); render(); toast("Pagamento excluído.","ok");
      }, "Excluir");
    }
  });
};

function abrirFormPagamento(id, fornId){
  const p = id ? App.data.pagamentos.find(x => x.id === id) : null;
  modal({
    titulo: p ? "Editar pagamento" : "Novo pagamento",
    sub: p ? "" : "Registre uma parcela ou um pagamento avulso.",
    corpo:`<form id="form-pag" class="form-grid">
      <div class="field full"><label>Fornecedor</label>
        <select class="select" name="fornecedor">
          ${App.data.fornecedores.map(f => `<option value="${f.id}" ${(p&&p.fornecedor===f.id)||(!p&&fornId===f.id)?"selected":""}>${esc(f.nome)} — ${esc(f.cat)}</option>`).join("")}
        </select></div>
      <div class="field full"><label>Descrição *</label>
        <input class="input" name="desc" required value="${p?esc(p.desc):""}" placeholder="Ex.: 2ª parcela do buffet"></div>
      <div class="field"><label>Valor (R$)</label>
        <input class="input" name="valor" type="number" min="0" step="10" value="${p?p.valor:""}" placeholder="0"></div>
      <div class="field"><label>Vencimento</label>
        <input class="input" name="venc" type="date" value="${p?esc(p.venc):new Date().toISOString().slice(0,10)}"></div>
      <div class="field full"><label>Status</label>
        <select class="select" name="status">
          <option value="pendente" ${p&&p.status==="pendente"?"selected":""}>Pendente</option>
          <option value="pago" ${p&&p.status==="pago"?"selected":""}>Pago</option>
        </select></div>
    </form>`,
    rodape:`<button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-pag">${p?"Salvar":"Adicionar pagamento"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-pag").onclick = () => {
        const fd = new FormData(w.querySelector("#form-pag"));
        const desc = String(fd.get("desc")||"").trim();
        if(!desc){ toast("Informe a descrição.","err"); return; }
        const dados = { fornecedor:fd.get("fornecedor"), desc, valor:Number(fd.get("valor"))||0,
                        venc:fd.get("venc"), status:fd.get("status") };
        if(p) Object.assign(p, dados);
        else App.data.pagamentos.push({ id:uid("p"), ...dados });
        salvar(); fecharModal(); render(); toast(p?"Pagamento atualizado.":"Pagamento adicionado.","ok");
      };
    }
  });
}

/* =========================================================
   TAREFAS
   ========================================================= */
const CAT_TAREFA = { convidados:"Convidados", espaco:"Espaço", fornecedores:"Fornecedores", vestuario:"Vestuário",
  convites:"Convites", decoracao:"Decoração", financeiro:"Financeiro", cerimonia:"Cerimônia", buffet:"Buffet",
  beleza:"Beleza", documentos:"Documentos", mesas:"Mesas", viagem:"Viagem" };
const COLUNAS = [["afazer","A fazer"],["fazendo","Em andamento"],["concluido","Concluído"]];

VIEWS.tarefas = function(){
  const d = App.data, f = App.filtros.tarefas;
  const lista = filtrarTarefas();
  const m = metricas();

  const cabecalho = `
  <div class="page-head">
    <div>
      <h1 class="page-title">Tarefas</h1>
      <p class="page-sub"><b>${m.tarefasPend.length}</b> pendentes · ${m.tarefasFeitas} concluídas${m.atrasadas.length?` · <b style="color:var(--danger)">${m.atrasadas.length} atrasadas</b>`:""}.</p>
    </div>
    <div class="page-actions">
      <div class="seg">
        <button class="${f.vista==="lista"?"active":""}" data-tvista="lista">${ico("list")}Lista</button>
        <button class="${f.vista==="kanban"?"active":""}" data-tvista="kanban">${ico("columns")}Kanban</button>
        <button class="${f.vista==="calendario"?"active":""}" data-tvista="calendario">${ico("calendar")}Calendário</button>
      </div>
      <button class="btn btn-primary" data-nova-tarefa>${ico("plus")}Nova tarefa</button>
    </div>
  </div>

  <div class="card mb-20"><div class="card-body">
    <div class="between wrap gap-12">
      <div class="input-ico" style="max-width:300px;flex:1;min-width:200px">
        ${ico("search")}<input class="input" id="busca-tarefa" placeholder="Buscar tarefa…" value="${esc(f.busca)}">
      </div>
      <div class="center gap-10 wrap">
        <select class="select" id="filtro-resp" style="width:auto;min-width:170px">
          <option value="todos">Todos os responsáveis</option>
          ${d.equipe.map(p => `<option value="${p.id}" ${f.resp===p.id?"selected":""}>${esc(p.nome)}</option>`).join("")}
        </select>
        <select class="select" id="filtro-cattarefa" style="width:auto;min-width:160px">
          <option value="todas">Todas as categorias</option>
          ${Object.entries(CAT_TAREFA).map(([k,v]) => `<option value="${k}" ${f.cat===k?"selected":""}>${esc(v)}</option>`).join("")}
        </select>
      </div>
    </div>
  </div></div>`;

  if(f.vista === "kanban"){
    return cabecalho + `<div class="kanban">
      ${COLUNAS.map(([id,nome]) => {
        const its = lista.filter(t => t.status === id);
        return `<div class="kcol" data-col="${id}">
          <div class="kcol-head"><span class="t">${nome}</span><span class="c">${its.length}</span></div>
          ${its.map(t => `
            <div class="kcard" draggable="true" data-tarefa="${t.id}">
              <div class="kt">${esc(t.titulo)}</div>
              <div class="km">
                ${badgePrioridade(t.prioridade)}
                <span class="badge plain t-xs">${ico("clock")}${t.status==="concluido" ? fmtData(t.prazo) : prazoTexto(t.prazo)}</span>
                <span style="margin-left:auto">${avatarPessoa(t.responsavel,"sm")}</span>
              </div>
            </div>`).join("")}
          ${its.length === 0 ? `<div class="t-xs t-muted t-center" style="padding:20px 8px">Arraste tarefas para cá</div>` : ""}
        </div>`;
      }).join("")}
    </div>`;
  }

  if(f.vista === "calendario"){
    const porMes = {};
    lista.forEach(t => { (porMes[t.prazo.slice(0,7)] = porMes[t.prazo.slice(0,7)] || []).push(t); });
    const meses = Object.keys(porMes).sort();
    return cabecalho + (meses.length ? `<div class="grid g-2">
      ${meses.map(mm => {
        const [y,mo] = mm.split("-").map(Number);
        return `<div class="card">
          <div class="card-head"><h3>${MESES_L[mo-1].charAt(0).toUpperCase()+MESES_L[mo-1].slice(1)} de ${y}</h3>
            <span class="badge">${porMes[mm].length}</span></div>
          <div class="card-body" style="padding-top:8px">
            ${porMes[mm].sort((a,b)=>a.prazo.localeCompare(b.prazo)).map(t => `
              <div class="list-row" data-tarefa-click="${t.id}" style="cursor:pointer">
                <span style="width:34px;text-align:center;flex:0 0 34px">
                  <span class="num" style="display:block;font-size:17px;line-height:1">${t.prazo.slice(8)}</span>
                </span>
                <button class="check ${t.status==="concluido"?"on":""}" data-toggle-t="${t.id}">${ico("check")}</button>
                <span class="grow"><span class="ell" style="display:block;font-size:13px;${t.status==="concluido"?"color:var(--muted);text-decoration:line-through":""}">${esc(t.titulo)}</span>
                <span class="t-xs t-muted">${esc(CAT_TAREFA[t.categoria]||t.categoria)}</span></span>
                ${avatarPessoa(t.responsavel,"sm")}
              </div>`).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>` : `<div class="card">${vazio("calendar","Nenhuma tarefa no período","Ajuste os filtros para ver outras tarefas.","")}</div>`);
  }

  return cabecalho + `<div class="card">
    ${lista.length ? `<div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:40px"></th><th style="width:38%">Tarefa</th><th>Categoria</th>
      <th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th><th></th></tr></thead>
      <tbody>${lista.map(t => {
        const atras = t.status !== "concluido" && diasAte(t.prazo) < 0;
        return `<tr data-tarefa-click="${t.id}" style="cursor:pointer">
          <td><button class="check ${t.status==="concluido"?"on":""}" data-toggle-t="${t.id}">${ico("check")}</button></td>
          <td><span style="font-weight:480;${t.status==="concluido"?"color:var(--muted);text-decoration:line-through":""}">${esc(t.titulo)}</span></td>
          <td class="t-sm t-ink3">${esc(CAT_TAREFA[t.categoria]||t.categoria)}</td>
          <td><span class="cell-name">${avatarPessoa(t.responsavel,"sm")}
            <span class="t-sm ell">${esc((pessoa(t.responsavel)||{}).nome||"—")}</span></span></td>
          <td class="t-sm nowrap" style="${atras?"color:var(--danger);font-weight:520":""}">${fmtData(t.prazo)}${
            diasAte(t.prazo) <= 30 ? `<span class="t-xs ${atras?"":"t-muted"}"> · ${prazoTexto(t.prazo)}</span>` : ""}</td>
          <td>${badgePrioridade(t.prioridade)}</td>
          <td>${t.status==="concluido"?`<span class="badge ok">Concluído</span>`:
                t.status==="fazendo"?`<span class="badge info">Em andamento</span>`:`<span class="badge">A fazer</span>`}</td>
          <td><span class="row-actions">
            <button class="mini-btn" data-editar-t="${t.id}">${ico("edit")}</button>
            <button class="mini-btn danger" data-excluir-t="${t.id}">${ico("trash")}</button>
          </span></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>`
    : vazio("checkCircle","Nenhuma tarefa encontrada","Ajuste a busca ou crie uma nova tarefa.",
        `<button class="btn btn-primary" data-nova-tarefa>${ico("plus")}Nova tarefa</button>`)}
  </div>`;
};

function filtrarTarefas(){
  const f = App.filtros.tarefas, q = f.busca.trim().toLowerCase();
  return App.data.tarefas.filter(t => {
    if(f.resp !== "todos" && t.responsavel !== f.resp) return false;
    if(f.cat !== "todas" && t.categoria !== f.cat) return false;
    if(q && !t.titulo.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a,b) => {
    if(a.status === "concluido" && b.status !== "concluido") return 1;
    if(b.status === "concluido" && a.status !== "concluido") return -1;
    return a.prazo.localeCompare(b.prazo);
  });
}

POS_RENDER.tarefas = function(){
  const v = $("#view");
  const b = $("#busca-tarefa");
  if(b){ let t; b.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => {
    App.filtros.tarefas.busca = b.value; const p = b.selectionStart; render();
    const n = $("#busca-tarefa"); if(n){ n.focus(); n.setSelectionRange(p,p); } }, 220); }); }
  const r = $("#filtro-resp"); if(r) r.onchange = () => { App.filtros.tarefas.resp = r.value; render(); };
  const c = $("#filtro-cattarefa"); if(c) c.onchange = () => { App.filtros.tarefas.cat = c.value; render(); };

  let arrast = null;
  v.addEventListener("dragstart", e => {
    const k = e.target.closest("[data-tarefa]"); if(!k) return;
    arrast = k.dataset.tarefa; k.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try{ e.dataTransfer.setData("text/plain", arrast); }catch(_){}
  });
  v.addEventListener("dragend", e => {
    const k = e.target.closest("[data-tarefa]"); if(k) k.classList.remove("dragging");
    $$(".kcol").forEach(x => x.classList.remove("drag-over"));
  });
  v.addEventListener("dragover", e => { const c2 = e.target.closest("[data-col]"); if(c2){ e.preventDefault(); c2.classList.add("drag-over"); } });
  v.addEventListener("dragleave", e => { const c2 = e.target.closest("[data-col]"); if(c2) c2.classList.remove("drag-over"); });
  v.addEventListener("drop", e => {
    const c2 = e.target.closest("[data-col]"); if(!c2) return;
    e.preventDefault(); c2.classList.remove("drag-over");
    const id = arrast || e.dataTransfer.getData("text/plain"); if(!id) return;
    const t = App.data.tarefas.find(x => x.id === id);
    if(t && t.status !== c2.dataset.col){
      t.status = c2.dataset.col; salvar(); render();
      toast("Tarefa movida para “" + COLUNAS.find(c3 => c3[0] === t.status)[1] + "”.","ok");
    }
  });

  v.addEventListener("click", e => {
    const vi = e.target.closest("[data-tvista]");
    if(vi){ App.filtros.tarefas.vista = vi.dataset.tvista; render(); return; }
    if(e.target.closest("[data-nova-tarefa]")){ abrirFormTarefa(); return; }
    const tg = e.target.closest("[data-toggle-t]");
    if(tg){
      e.stopPropagation();
      const t = App.data.tarefas.find(x => x.id === tg.dataset.toggleT);
      t.status = t.status === "concluido" ? "afazer" : "concluido";
      salvar(); render(); toast(t.status === "concluido" ? "Tarefa concluída." : "Tarefa reaberta.","ok");
      return;
    }
    const ed = e.target.closest("[data-editar-t]");
    if(ed){ e.stopPropagation(); abrirFormTarefa(ed.dataset.editarT); return; }
    const ex = e.target.closest("[data-excluir-t]");
    if(ex){
      e.stopPropagation();
      const t = App.data.tarefas.find(x => x.id === ex.dataset.excluirT);
      confirmar("Excluir tarefa", `Remover <strong>${esc(t.titulo)}</strong>?`, () => {
        App.data.tarefas = App.data.tarefas.filter(x => x.id !== t.id);
        salvar(); render(); toast("Tarefa excluída.","ok");
      }, "Excluir");
      return;
    }
    const cl = e.target.closest("[data-tarefa-click]") || e.target.closest("[data-tarefa]");
    if(cl) abrirFormTarefa(cl.dataset.tarefaClick || cl.dataset.tarefa);
  });
};

function abrirFormTarefa(id){
  const t = id ? App.data.tarefas.find(x => x.id === id) : null;
  modal({
    titulo: t ? "Editar tarefa" : "Nova tarefa",
    sub: t ? esc(CAT_TAREFA[t.categoria] || t.categoria) : "Defina prazo, responsável e prioridade.",
    corpo:`<form id="form-tarefa" class="form-grid">
      <div class="field full"><label>Título *</label>
        <input class="input" name="titulo" required value="${t?esc(t.titulo):""}" placeholder="Ex.: Escolher a decoração das mesas"></div>
      <div class="field full"><label>Descrição</label>
        <textarea class="textarea" name="desc" placeholder="Detalhes, combinados, links…">${t?esc(t.desc):""}</textarea></div>
      <div class="field"><label>Prazo</label>
        <input class="input" name="prazo" type="date" value="${t?esc(t.prazo):new Date().toISOString().slice(0,10)}"></div>
      <div class="field"><label>Responsável</label>
        <select class="select" name="responsavel">
          ${App.data.equipe.map(p => `<option value="${p.id}" ${t&&t.responsavel===p.id?"selected":""}>${esc(p.nome)} — ${esc(p.papel)}</option>`).join("")}
        </select></div>
      <div class="field"><label>Prioridade</label>
        <select class="select" name="prioridade">
          <option value="alta" ${t&&t.prioridade==="alta"?"selected":""}>Alta</option>
          <option value="media" ${t&&t.prioridade==="media"?"selected":""}>Média</option>
          <option value="baixa" ${t&&t.prioridade==="baixa"?"selected":""}>Baixa</option>
        </select></div>
      <div class="field"><label>Categoria</label>
        <select class="select" name="categoria">
          ${Object.entries(CAT_TAREFA).map(([k,v]) => `<option value="${k}" ${t&&t.categoria===k?"selected":""}>${esc(v)}</option>`).join("")}
        </select></div>
      <div class="field full"><label>Status</label>
        <select class="select" name="status">
          ${COLUNAS.map(([k,v]) => `<option value="${k}" ${t&&t.status===k?"selected":""}>${v}</option>`).join("")}
        </select></div>
    </form>`,
    rodape:`${t?`<button class="btn btn-danger" data-excluir-tarefa>Excluir</button><div class="grow"></div>`:""}
            <button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-tarefa">${t?"Salvar":"Criar tarefa"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-tarefa").onclick = () => {
        const fd = new FormData(w.querySelector("#form-tarefa"));
        const titulo = String(fd.get("titulo")||"").trim();
        if(!titulo){ toast("Informe o título da tarefa.","err"); return; }
        const dados = { titulo, desc:fd.get("desc")||"", prazo:fd.get("prazo"),
          responsavel:fd.get("responsavel"), prioridade:fd.get("prioridade"),
          categoria:fd.get("categoria"), status:fd.get("status") };
        if(t) Object.assign(t, dados);
        else App.data.tarefas.unshift({ id:uid("t"), ...dados });
        salvar(); fecharModal(); render(); toast(t?"Tarefa atualizada.":"Tarefa criada.","ok");
      };
      const del = w.querySelector("[data-excluir-tarefa]");
      if(del) del.onclick = () => {
        fecharModal();
        confirmar("Excluir tarefa", `Remover <strong>${esc(t.titulo)}</strong>?`, () => {
          App.data.tarefas = App.data.tarefas.filter(x => x.id !== t.id);
          salvar(); render(); toast("Tarefa excluída.","ok");
        }, "Excluir");
      };
    }
  });
}

/* =========================================================
   CRONOGRAMA
   ========================================================= */
VIEWS.cronograma = function(){
  const d = App.data;
  const ev = d.cronograma.slice().sort((a,b) => ordemHora(a.hora) - ordemHora(b.hora));
  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Cronograma do dia</h1>
      <p class="page-sub">${d.casal.data
        ? [fmtDataExt(d.casal.data), [d.casal.local, d.casal.cidade].filter(Boolean).join(", ")].filter(Boolean).join(" · ") + "."
        : "Defina a data e o local em Configurações para montar o roteiro."}</p>
    </div>
    <div class="page-actions">
      <button class="btn" onclick="window.print()">${ico("printer")}Imprimir</button>
      <button class="btn btn-primary" data-novo-evento>${ico("plus")}Novo evento</button>
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${miniStat("Eventos", ev.length, "no roteiro do dia", "clock")}
    ${miniStat("Início", ev.length?ev[0].hora:"—", ev.length?esc(ev[0].titulo):"—", "sparkle","g4")}
    ${miniStat("Cerimônia", (ev.find(e => /cerim/i.test(e.titulo))||{}).hora || d.casal.hora || "—", "entrada da noiva", "church","g2")}
    ${miniStat("Encerramento", ev.length?ev[ev.length-1].hora:"—", "fim da festa", "moon","g3")}
  </div>

  <div class="dash-main">
    <div class="card">
      <div class="card-head"><h3>Linha do tempo</h3>
        <span class="t-xs t-muted">Clique em um evento para editar</span></div>
      <div class="card-body">
        <div class="tl">
          ${!ev.length ? vazio("calendar","Nenhum evento no roteiro ainda","Adicione os horários do seu grande dia — cerimônia, recepção, jantar, festa.",
            `<button class="btn btn-primary" data-novo-evento>${ico("plus")}Novo evento</button>`) : ev.map(e => `
            <div class="tl-item" data-evento="${e.id}" style="cursor:pointer">
              <div class="tl-time">${esc(e.hora)}</div>
              <div class="tl-rail"><span class="tl-dot"></span></div>
              <div class="tl-body">
                <div class="between">
                  <div style="min-width:0">
                    <div class="tl-title">${esc(e.titulo)}</div>
                    <div class="tl-meta">
                      <span>${ico("pin")}${esc(e.local)}</span>
                      <span>${ico("users")}${esc((pessoa(e.resp)||{}).nome||"—")}</span>
                    </div>
                    ${e.obs ? `<div class="t-xs t-muted mt-8" style="line-height:1.5">${esc(e.obs)}</div>` : ""}
                  </div>
                  ${avatarPessoa(e.resp,"sm")}
                </div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="card card-pad">
        <div class="eyebrow">Contagem regressiva</div>
        ${d.casal.data
          ? `<div class="num" style="font-size:42px;line-height:1.1;margin-top:8px">${metricas().diasRestantes}</div>
             <div class="t-sm t-muted">dias para o grande dia</div>`
          : `<div class="t-sm t-ink3 mt-8" style="line-height:1.6">Defina a data em <button class="link" data-rota="config">Configurações</button> para ver a contagem.</div>`}
        <div class="sep"></div>
        ${linhaInfo("Data", d.casal.data ? fmtData(d.casal.data, true) : "—")}
        <div class="mt-12">${linhaInfo("Cerimônia", d.casal.hora || "—")}</div>
        <div class="mt-12">${linhaInfo("Local", [d.casal.local, d.casal.cidade].filter(Boolean).join(" · ") || "—")}</div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Responsáveis do dia</h3></div>
        <div class="card-body" style="padding-top:10px">
          ${d.equipe.map(p => {
            const n = ev.filter(e => e.resp === p.id).length;
            return `<div class="list-row">
              ${avatarHTML(p.nome,"", p.id)}
              <span class="grow"><span style="display:block;font-size:13px;font-weight:480">${esc(p.nome)}</span>
              <span class="t-xs t-muted">${esc(p.papel)}</span></span>
              <span class="badge">${n} evento${n===1?"":"s"}</span>
            </div>`;
          }).join("")}
        </div>
      </div>

      <div class="card card-pad">
        <div class="alert warn">${ico("alert")}
          <div><div class="a-title">Combine as chegadas</div>
          <div class="a-desc">Fornecedores devem chegar 1h antes do horário previsto de montagem.</div></div>
        </div>
      </div>
    </div>
  </div>`;
};

POS_RENDER.cronograma = function(){
  $("#view").addEventListener("click", e => {
    if(e.target.closest("[data-novo-evento]")){ abrirFormEvento(); return; }
    const ev = e.target.closest("[data-evento]");
    if(ev) abrirFormEvento(ev.dataset.evento);
  });
};

function abrirFormEvento(id){
  const e = id ? App.data.cronograma.find(x => x.id === id) : null;
  modal({
    titulo: e ? "Editar evento" : "Novo evento do cronograma",
    sub: e ? esc(e.hora) : "Adicione um momento ao roteiro do dia.",
    corpo:`<form id="form-ev" class="form-grid">
      <div class="field"><label>Horário</label>
        <input class="input" name="hora" type="time" value="${e?esc(e.hora):"12:00"}"></div>
      <div class="field"><label>Responsável</label>
        <select class="select" name="resp">
          ${App.data.equipe.map(p => `<option value="${p.id}" ${e&&e.resp===p.id?"selected":""}>${esc(p.nome)}</option>`).join("")}
        </select></div>
      <div class="field full"><label>Título *</label>
        <input class="input" name="titulo" required value="${e?esc(e.titulo):""}" placeholder="Ex.: Chegada dos convidados"></div>
      <div class="field full"><label>Local</label>
        <input class="input" name="local" value="${e?esc(e.local):""}" placeholder="Ex.: Jardim das oliveiras"></div>
      <div class="field full"><label>Observações</label>
        <textarea class="textarea" name="obs">${e?esc(e.obs):""}</textarea></div>
    </form>`,
    rodape:`${e?`<button class="btn btn-danger" data-excluir-ev>Excluir</button><div class="grow"></div>`:""}
            <button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-ev">${e?"Salvar":"Adicionar"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-ev").onclick = () => {
        const fd = new FormData(w.querySelector("#form-ev"));
        const titulo = String(fd.get("titulo")||"").trim();
        if(!titulo){ toast("Informe o título do evento.","err"); return; }
        const dados = { hora:fd.get("hora"), titulo, local:fd.get("local")||"", resp:fd.get("resp"), obs:fd.get("obs")||"" };
        if(e) Object.assign(e, dados);
        else App.data.cronograma.push({ id:uid("h"), ...dados });
        salvar(); fecharModal(); render(); toast(e?"Evento atualizado.":"Evento adicionado.","ok");
      };
      const del = w.querySelector("[data-excluir-ev]");
      if(del) del.onclick = () => {
        fecharModal();
        confirmar("Excluir evento", `Remover <strong>${esc(e.titulo)}</strong> do cronograma?`, () => {
          App.data.cronograma = App.data.cronograma.filter(x => x.id !== e.id);
          salvar(); render(); toast("Evento excluído.","ok");
        }, "Excluir");
      };
    }
  });
}

/* =========================================================
   DOCUMENTOS
   ========================================================= */
const CAT_DOC = ["Contratos","Comprovantes","Orçamentos","Documentos","Outros"];

VIEWS.documentos = function(){
  const d = App.data, f = App.filtros.documentos;
  const q = f.busca.trim().toLowerCase();
  const lista = d.documentos.filter(x =>
    (f.cat === "todas" || x.cat === f.cat) && (!q || x.nome.toLowerCase().includes(q)));
  const pend = d.documentos.filter(x => x.cat === "Contratos" && !x.assinado);

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Documentos</h1>
      <p class="page-sub"><b>${d.documentos.length}</b> arquivos guardados${pend.length?` · ${pend.length} contratos aguardando assinatura`:""}.</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" data-upload>${ico("upload")}Enviar arquivo</button>
    </div>
  </div>

  ${pend.length ? `<div class="alert warn mb-20">${ico("alert")}
    <div><div class="a-title">${pend.length} contrato(s) aguardando assinatura</div>
    <div class="a-desc">${pend.map(p => esc(p.nome)).join(" · ")}</div></div></div>` : ""}

  <div class="grid" style="grid-template-columns:240px minmax(0,1fr);gap:18px;align-items:start" id="docs-grid">
    <div class="card card-pad">
      <div class="eyebrow mb-12">Categorias</div>
      <button class="nav-item ${f.cat==="todas"?"active":""}" data-dcat="todas" style="margin-bottom:2px">
        ${ico("folder")}<span>Todas</span><span class="nav-badge">${d.documentos.length}</span></button>
      ${CAT_DOC.map(c => {
        const n = d.documentos.filter(x => x.cat === c).length;
        return `<button class="nav-item ${f.cat===c?"active":""}" data-dcat="${esc(c)}" style="margin-bottom:2px">
          ${ico("folder")}<span>${esc(c)}</span><span class="nav-badge">${n}</span></button>`;
      }).join("")}
      <div class="sep"></div>
      <div class="dropzone" data-upload>
        ${ico("upload")}
        <div class="t-sm mt-8" style="font-weight:500">Enviar arquivo</div>
        <div class="t-xs t-muted mt-4">Clique ou arraste aqui</div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="input-ico mb-16" style="max-width:320px">
          ${ico("search")}<input class="input" id="busca-doc" placeholder="Buscar documento…" value="${esc(f.busca)}">
        </div>
        ${lista.length ? `<div class="grid" style="gap:8px">
          ${lista.map(x => {
            const fo = x.forn ? fornecedor(x.forn) : null;
            return `<div class="doc-row" data-doc="${x.id}">
              <span class="doc-ico ${x.tipo}">${x.tipo.toUpperCase()}</span>
              <span class="grow" style="min-width:0">
                <span class="ell" style="display:block;font-size:13.5px;font-weight:480">${esc(x.nome)}</span>
                <span class="t-xs t-muted">${esc(x.cat)} · ${esc(x.tam)} · ${fmtData(x.data)}${fo?` · ${esc(fo.nome)}`:""}</span>
              </span>
              ${x.cat === "Contratos" ? (x.assinado ? `<span class="badge ok">Assinado</span>` : `<span class="badge warn">Aguardando</span>`) : ""}
              <span class="center gap-4">
                <button class="mini-btn" data-baixar="${x.id}" title="Baixar">${ico("download")}</button>
                <button class="mini-btn danger" data-excluir-doc="${x.id}" title="Excluir">${ico("trash")}</button>
              </span>
            </div>`;
          }).join("")}
        </div>` : vazio("folder","Nenhum documento aqui","Envie contratos, comprovantes e orçamentos para manter tudo em um só lugar.",
            `<button class="btn btn-primary" data-upload>${ico("upload")}Enviar arquivo</button>`)}
      </div>
    </div>
  </div>`;
};

POS_RENDER.documentos = function(){
  const v = $("#view");
  const b = $("#busca-doc");
  if(b){ let t; b.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => {
    App.filtros.documentos.busca = b.value; const p = b.selectionStart; render();
    const n = $("#busca-doc"); if(n){ n.focus(); n.setSelectionRange(p,p); } }, 220); }); }

  const dz = v.querySelector(".dropzone");
  if(dz){
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("over"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("over"));
    dz.addEventListener("drop", e => {
      e.preventDefault(); dz.classList.remove("over");
      const arq = e.dataTransfer.files[0];
      if(arq) registrarArquivo(arq);
    });
  }

  v.addEventListener("click", e => {
    const c = e.target.closest("[data-dcat]");
    if(c){ App.filtros.documentos.cat = c.dataset.dcat; render(); return; }
    if(e.target.closest("[data-upload]")){ abrirFormDocumento(); return; }
    const bx = e.target.closest("[data-baixar]");
    if(bx){ toast("Este é um arquivo de demonstração — o download não está disponível.","info"); return; }
    const ex = e.target.closest("[data-excluir-doc]");
    if(ex){
      const x = App.data.documentos.find(y => y.id === ex.dataset.excluirDoc);
      confirmar("Excluir documento", `Remover <strong>${esc(x.nome)}</strong>?`, () => {
        App.data.documentos = App.data.documentos.filter(y => y.id !== x.id);
        salvar(); render(); toast("Documento removido.","ok");
      }, "Excluir");
      return;
    }
    const doc = e.target.closest("[data-doc]");
    if(doc){
      const x = App.data.documentos.find(y => y.id === doc.dataset.doc);
      if(x.cat === "Contratos"){
        x.assinado = !x.assinado; salvar(); render();
        toast(x.assinado ? "Contrato marcado como assinado." : "Contrato marcado como pendente.","ok");
      }
    }
  });
};

function registrarArquivo(arq){
  const ext = (arq.name.split(".").pop()||"").toLowerCase();
  const tipo = ["jpg","jpeg","png","gif","webp"].includes(ext) ? "img"
             : ["xls","xlsx","csv"].includes(ext) ? "xls"
             : ["doc","docx"].includes(ext) ? "doc" : "pdf";
  App.data.documentos.unshift({
    id:uid("d"), nome:arq.name, cat:App.filtros.documentos.cat === "todas" ? "Outros" : App.filtros.documentos.cat,
    tipo, tam:(arq.size/1024/1024 >= 1 ? (arq.size/1024/1024).toFixed(1)+" MB" : Math.round(arq.size/1024)+" KB"),
    data:new Date().toISOString().slice(0,10), forn:"", assinado:false
  });
  salvar(); render(); toast("Arquivo adicionado.","ok");
}

function abrirFormDocumento(){
  modal({
    titulo:"Enviar arquivo", sub:"Guarde contratos, comprovantes e orçamentos.", tamanho:"narrow",
    corpo:`<form id="form-doc" class="grid" style="gap:16px">
      <div class="field"><label>Arquivo</label>
        <input class="input" type="file" id="arquivo-doc" style="padding:8px 10px;height:auto">
        <span class="hint">Nesta demonstração o arquivo não é enviado a nenhum servidor — apenas o registro fica salvo no seu navegador.</span></div>
      <div class="field"><label>Nome</label>
        <input class="input" name="nome" placeholder="Ex.: Contrato — Buffet La Maison.pdf"></div>
      <div class="field"><label>Categoria</label>
        <select class="select" name="cat">${CAT_DOC.map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
      <div class="field"><label>Fornecedor (opcional)</label>
        <select class="select" name="forn"><option value="">Nenhum</option>
          ${App.data.fornecedores.map(f => `<option value="${f.id}">${esc(f.nome)}</option>`).join("")}</select></div>
    </form>`,
    rodape:`<button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-doc">Adicionar</button>`,
    aoAbrir(w){
      const inpArq = w.querySelector("#arquivo-doc");
      inpArq.onchange = () => {
        if(inpArq.files[0]) w.querySelector("[name=nome]").value = inpArq.files[0].name;
      };
      w.querySelector("#salvar-doc").onclick = () => {
        const fd = new FormData(w.querySelector("#form-doc"));
        const arq = inpArq.files[0];
        const nome = String(fd.get("nome")||"").trim() || (arq ? arq.name : "");
        if(!nome){ toast("Escolha um arquivo ou informe um nome.","err"); return; }
        const ext = (nome.split(".").pop()||"").toLowerCase();
        const tipo = ["jpg","jpeg","png","gif","webp"].includes(ext) ? "img"
                   : ["xls","xlsx","csv"].includes(ext) ? "xls"
                   : ["doc","docx"].includes(ext) ? "doc" : "pdf";
        App.data.documentos.unshift({
          id:uid("d"), nome, cat:fd.get("cat"), tipo,
          tam: arq ? (arq.size/1024/1024 >= 1 ? (arq.size/1024/1024).toFixed(1)+" MB" : Math.round(arq.size/1024)+" KB") : "—",
          data:new Date().toISOString().slice(0,10), forn:fd.get("forn")||"", assinado:false
        });
        salvar(); fecharModal(); render(); toast("Documento adicionado.","ok");
      };
    }
  });
}

/* =========================================================
   INSPIRAÇÕES
   ========================================================= */
const CAT_INSP = ["Decoração","Vestido","Terno","Buquê","Mesa","Convites","Fotografia","Bolo","Flores"];

VIEWS.inspiracoes = function(){
  const d = App.data, f = App.filtros.inspiracoes;
  const lista = f.cat === "todas" ? d.inspiracoes : d.inspiracoes.filter(x => x.cat === f.cat);
  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Inspirações</h1>
      <p class="page-sub">O painel de referências do casamento — <b>${d.inspiracoes.length}</b> ideias salvas.</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" data-nova-insp>${ico("plus")}Nova inspiração</button>
    </div>
  </div>

  <div class="chips mb-20">
    <button class="chip ${f.cat==="todas"?"active":""}" data-icat="todas">Todas<span class="n">${d.inspiracoes.length}</span></button>
    ${CAT_INSP.map(c => {
      const n = d.inspiracoes.filter(x => x.cat === c).length;
      return `<button class="chip ${f.cat===c?"active":""}" data-icat="${esc(c)}">${esc(c)}<span class="n">${n}</span></button>`;
    }).join("")}
  </div>

  ${lista.length ? `<div class="mood-grid">
    ${lista.map(x => `
      <div class="mood-card" data-insp="${x.id}">
        <div class="mood-img">
          ${x.img
            ? `<img src="${esc(x.img)}" alt="${esc(x.titulo)}" loading="lazy">`
            : `<div class="mood-ph" style="height:${x.h}px;background:${moodFundo(x.g)}">
                 <span class="glyph">${ico("flower")}</span></div>`}
        </div>
        <div class="mood-meta">
          <div class="between" style="align-items:flex-start;gap:8px">
            <div style="min-width:0">
              <div class="mt">${esc(x.titulo)}</div>
              <div class="mc">${esc(x.nota)}</div>
            </div>
            <span class="badge gold nowrap">${esc(x.cat)}</span>
          </div>
        </div>
      </div>`).join("")}
  </div>`
  : `<div class="card">${vazio("heart","Nenhuma inspiração nesta categoria","Salve referências de decoração, vestido, flores e tudo que inspirar vocês.",
      `<button class="btn btn-primary" data-nova-insp>${ico("plus")}Nova inspiração</button>`)}</div>`}`;
};

POS_RENDER.inspiracoes = function(){
  $("#view").addEventListener("click", e => {
    const c = e.target.closest("[data-icat]");
    if(c){ App.filtros.inspiracoes.cat = c.dataset.icat; render(); return; }
    if(e.target.closest("[data-nova-insp]")){ abrirFormInspiracao(); return; }
    const i = e.target.closest("[data-insp]");
    if(i) abrirFormInspiracao(i.dataset.insp);
  });
};

function abrirFormInspiracao(id){
  const x = id ? App.data.inspiracoes.find(y => y.id === id) : null;
  modal({
    titulo: x ? "Editar inspiração" : "Nova inspiração",
    sub: x ? esc(x.cat) : "Salve uma referência no painel do casamento.",
    corpo:`
      ${x ? `<div style="border-radius:12px;overflow:hidden;margin-bottom:18px;border:1px solid var(--line-2)">
        ${x.img ? `<img src="${esc(x.img)}" style="width:100%;display:block" alt="">`
                : `<div style="height:140px;background:${moodFundo(x.g)}"></div>`}
      </div>` : ""}
      <form id="form-insp" class="grid" style="gap:16px">
        <div class="field"><label>Título *</label>
          <input class="input" name="titulo" required value="${x?esc(x.titulo):""}" placeholder="Ex.: Mesa posta em tons champagne"></div>
        <div class="field"><label>Categoria</label>
          <select class="select" name="cat">${CAT_INSP.map(c => `<option ${x&&x.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div>
        <div class="field"><label>Link da imagem (opcional)</label>
          <input class="input" name="img" value="${x&&x.img?esc(x.img):""}" placeholder="https://…">
          <span class="hint">Sem link, usamos uma cartela de cor da paleta do casamento.</span></div>
        <div class="field"><label>Comentário</label>
          <textarea class="textarea" name="nota" placeholder="O que vocês gostaram nessa referência?">${x?esc(x.nota):""}</textarea></div>
      </form>`,
    rodape:`${x?`<button class="btn btn-danger" data-excluir-insp>Excluir</button><div class="grow"></div>`:""}
            <button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-insp">${x?"Salvar":"Adicionar"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-insp").onclick = () => {
        const fd = new FormData(w.querySelector("#form-insp"));
        const titulo = String(fd.get("titulo")||"").trim();
        if(!titulo){ toast("Informe o título.","err"); return; }
        const dados = { titulo, cat:fd.get("cat"), img:String(fd.get("img")||"").trim(), nota:fd.get("nota")||"" };
        if(x) Object.assign(x, dados);
        else App.data.inspiracoes.unshift({ id:uid("i"), g:Math.floor(Math.random()*8)+1, h:200+Math.floor(Math.random()*90), ...dados });
        salvar(); fecharModal(); render(); toast(x?"Inspiração atualizada.":"Inspiração salva.","ok");
      };
      const del = w.querySelector("[data-excluir-insp]");
      if(del) del.onclick = () => {
        fecharModal();
        confirmar("Excluir inspiração", `Remover <strong>${esc(x.titulo)}</strong> do painel?`, () => {
          App.data.inspiracoes = App.data.inspiracoes.filter(y => y.id !== x.id);
          salvar(); render(); toast("Inspiração removida.","ok");
        }, "Excluir");
      };
    }
  });
}

/* =========================================================
   EQUIPE
   ========================================================= */
const PERMISSOES = {
  "Administrador":"Acesso total: pode ver e editar tudo, inclusive o financeiro.",
  "Cerimonial":"Vê tudo e edita tarefas, cronograma, mesas e fornecedores.",
  "Família":"Vê convidados, mesas e cronograma. Recebe tarefas.",
  "Fornecedor":"Vê apenas o cronograma do dia e as tarefas atribuídas a ele."
};

VIEWS.equipe = function(){
  const d = App.data;
  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Equipe</h1>
      <p class="page-sub"><b>${d.equipe.length}</b> pessoas participam da organização deste casamento.</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" data-nova-pessoa>${ico("userPlus")}Adicionar pessoa</button>
    </div>
  </div>

  <div class="grid g-3 mb-20">
    ${d.equipe.map(p => {
      const ts = d.tarefas.filter(t => t.responsavel === p.id);
      const feitas = ts.filter(t => t.status === "concluido").length;
      return `<div class="card card-hover card-pad" data-pessoa="${p.id}" style="cursor:pointer">
        <div class="center gap-12">
          ${avatarHTML(p.nome,"lg",p.id)}
          <div style="min-width:0">
            <div class="ell" style="font-size:14.5px;font-weight:550">${esc(p.nome)}</div>
            <div class="t-xs t-muted">${esc(p.papel)}</div>
          </div>
        </div>
        <div class="sep" style="margin:14px 0"></div>
        <div class="between mb-8">
          <span class="t-xs t-muted">Tarefas</span>
          <span class="t-xs tnum">${feitas}/${ts.length} concluídas</span>
        </div>
        ${barra(feitas, ts.length, "ok")}
        <div class="center gap-8 mt-16">
          <span class="badge ${p.perm==="Administrador"?"gold":"info"}">${esc(p.perm)}</span>
        </div>
        <div class="t-xs t-muted mt-12 center gap-6">${ico("phone")}${esc(p.tel)}</div>
      </div>`;
    }).join("")}
  </div>

  <div class="card">
    <div class="card-head"><h3>Níveis de permissão</h3></div>
    <div class="card-body" style="padding-top:10px">
      ${Object.entries(PERMISSOES).map(([n,desc]) => `
        <div class="list-row">
          <span class="stat-ico" style="width:34px;height:34px;flex:0 0 34px;border-radius:9px">${ico("shield")}</span>
          <span class="grow"><span style="display:block;font-size:13.5px;font-weight:520">${esc(n)}</span>
          <span class="t-xs t-muted">${esc(desc)}</span></span>
          <span class="badge">${App.data.equipe.filter(p => p.perm === n).length} pessoa(s)</span>
        </div>`).join("")}
    </div>
  </div>`;
};

POS_RENDER.equipe = function(){
  $("#view").addEventListener("click", e => {
    if(e.target.closest("[data-nova-pessoa]")){ abrirFormPessoa(); return; }
    const p = e.target.closest("[data-pessoa]");
    if(p) abrirFormPessoa(p.dataset.pessoa);
  });
};

function abrirFormPessoa(id){
  const p = id ? pessoa(id) : null;
  const ts = p ? App.data.tarefas.filter(t => t.responsavel === p.id) : [];
  modal({
    titulo: p ? esc(p.nome) : "Adicionar pessoa",
    sub: p ? esc(p.papel) : "Convide alguém para ajudar na organização.",
    corpo:`<form id="form-pessoa" class="form-grid">
      <div class="field full"><label>Nome *</label>
        <input class="input" name="nome" required value="${p?esc(p.nome):""}" placeholder="Ex.: Lúcia Marques"></div>
      <div class="field"><label>Papel</label>
        <input class="input" name="papel" value="${p?esc(p.papel):""}" placeholder="Ex.: Mãe da noiva"></div>
      <div class="field"><label>Permissão</label>
        <select class="select" name="perm">
          ${Object.keys(PERMISSOES).map(k => `<option ${p&&p.perm===k?"selected":""}>${esc(k)}</option>`).join("")}
        </select></div>
      <div class="field"><label>Telefone</label>
        <input class="input" name="tel" value="${p?esc(p.tel):""}"></div>
      <div class="field"><label>E-mail</label>
        <input class="input" name="email" type="email" value="${p?esc(p.email):""}"></div>
    </form>
    ${p && ts.length ? `<div class="sep"></div>
      <div class="eyebrow mb-8">Tarefas de ${esc(p.nome.split(" ")[0])} (${ts.length})</div>
      ${ts.slice(0,6).map(t => `<div class="list-row">
        <span class="check ${t.status==="concluido"?"on":""}">${ico("check")}</span>
        <span class="grow t-sm ell" style="${t.status==="concluido"?"color:var(--muted);text-decoration:line-through":""}">${esc(t.titulo)}</span>
        <span class="t-xs t-muted nowrap">${prazoTexto(t.prazo)}</span>
      </div>`).join("")}` : ""}`,
    rodape:`${p && p.id !== "e1" && p.id !== "e2" ? `<button class="btn btn-danger" data-excluir-pessoa>Remover</button><div class="grow"></div>` : ""}
            <button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-pessoa">${p?"Salvar":"Adicionar"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-pessoa").onclick = () => {
        const fd = new FormData(w.querySelector("#form-pessoa"));
        const nome = String(fd.get("nome")||"").trim();
        if(!nome){ toast("Informe o nome.","err"); return; }
        const dados = { nome, papel:fd.get("papel")||"", perm:fd.get("perm"), tel:fd.get("tel")||"", email:fd.get("email")||"" };
        if(p) Object.assign(p, dados);
        else App.data.equipe.push({ id:uid("e"), cor:corAvatar(nome), ...dados });
        salvar(); fecharModal(); render(); toast(p?"Dados atualizados.":"Pessoa adicionada.","ok");
      };
      const del = w.querySelector("[data-excluir-pessoa]");
      if(del) del.onclick = () => {
        fecharModal();
        confirmar("Remover pessoa", `Remover <strong>${esc(p.nome)}</strong> da equipe? As tarefas dela ficarão sem responsável.`, () => {
          App.data.equipe = App.data.equipe.filter(x => x.id !== p.id);
          App.data.tarefas.forEach(t => { if(t.responsavel === p.id) t.responsavel = "e1"; });
          salvar(); render(); toast("Pessoa removida.","ok");
        }, "Remover");
      };
    }
  });
}

/* =========================================================
   O GRANDE DIA
   ========================================================= */
VIEWS.grandedia = function(){
  const d = App.data, m = metricas();
  const ativo = d.casal.modoGrandeDia;
  const agora = new Date();
  const hhmm = d2(agora.getHours()) + ":" + d2(agora.getMinutes());
  const ev = d.cronograma.slice().sort((a,b) => ordemHora(a.hora) - ordemHora(b.hora));
  const agoraMin = ordemHora(hhmm);
  const proximo = ev.find(e => ordemHora(e.hora) >= agoraMin) || ev[0];
  const seguinte = ev[ev.indexOf(proximo)+1] || null;
  const contatos = d.fornecedores.filter(f => f.status === "Contratado")
    .filter(f => ["Cerimonial","Buffet","Fotografia","DJ","Espaço","Decoração"].includes(f.cat));

  if(!ativo){
    return `
    <div class="page-head">
      <div>
        <h1 class="page-title">O grande dia</h1>
        <p class="page-sub">Um modo simples e direto para usar no dia do casamento.</p>
      </div>
    </div>
    <div class="card card-pad" style="text-align:center;padding:56px 24px">
      <div class="empty-ico" style="width:72px;height:72px">${ico("sparkle")}</div>
      <h2 class="display" style="font-size:28px;margin-top:16px">${d.casal.data ? `Faltam ${m.diasRestantes} dias` : "Defina a data do casamento"}</h2>
      <p class="t-ink3 mt-8" style="max-width:460px;margin:8px auto 0;line-height:1.65">
        Neste modo, o sistema mostra apenas o essencial: o próximo compromisso, quem chega agora,
        os contatos de emergência e os alertas críticos. Nada mais.
      </p>
      <div class="mt-24 center" style="justify-content:center;gap:10px;flex-wrap:wrap">
        <button class="btn btn-gold btn-lg" data-ativar-gd>${ico("sparkle")}Ativar modo grande dia</button>
        <button class="btn btn-lg" data-rota="cronograma">Ver cronograma</button>
      </div>
      <p class="t-xs t-muted mt-16">Ele é ativado automaticamente 24 horas antes da cerimônia.</p>
    </div>

    <div class="grid g-3 mt-20">
      ${[["Próximo compromisso","Sempre visível no topo, com horário e local.","clock"],
         ["Contatos rápidos","Um toque para ligar para o cerimonial, buffet ou fotógrafo.","phone"],
         ["Alertas críticos","Só o que precisa de ação imediata aparece.","alert"]].map(([t,dsc,i]) => `
        <div class="card card-pad">
          <span class="stat-ico">${ico(i)}</span>
          <h3 class="display mt-12" style="font-size:18px">${t}</h3>
          <p class="t-sm t-muted mt-8" style="line-height:1.6">${dsc}</p>
        </div>`).join("")}
    </div>`;
  }

  if(!ev.length){
    return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Hoje é o grande dia.</h1>
        <p class="page-sub">${d.casal.data ? fmtDataExt(d.casal.data) : ""} ${esc(d.casal.local||"")}</p>
      </div>
      <div class="page-actions">
        <button class="btn" data-desativar-gd>Sair do modo grande dia</button>
      </div>
    </div>
    <div class="card card-pad" style="text-align:center;padding:56px 24px">
      ${vazio("calendar","O roteiro do dia ainda está vazio","Cadastre os horários da cerimônia, recepção e festa no Cronograma para ver tudo aqui.",
        `<button class="btn btn-primary" data-rota="cronograma">${ico("calendar")}Ir para o Cronograma</button>`)}
    </div>`;
  }

  const pagtosHoje = d.pagamentos.filter(p => p.status !== "pago" && p.venc === d.casal.data);

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Hoje é o grande dia.</h1>
      <p class="page-sub">${fmtDataExt(d.casal.data)} · ${esc(d.casal.local)}</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-desativar-gd>Sair do modo grande dia</button>
    </div>
  </div>

  <div class="gd mb-20">
    <div class="grid g-3" style="gap:16px">
      <div class="gd-card">
        <div class="gd-label">Agora</div>
        <div class="gd-time">${hhmm}</div>
        <div class="gd-sub">horário local</div>
      </div>
      <div class="gd-card">
        <div class="gd-label">Próximo compromisso</div>
        <div class="gd-time">${esc(proximo.hora)}</div>
        <div class="gd-what">${esc(proximo.titulo)}</div>
        <div class="gd-sub">${ico("pin")} ${esc(proximo.local)} · ${esc((pessoa(proximo.resp)||{}).nome||"—")}</div>
      </div>
      <div class="gd-card">
        <div class="gd-label">Em seguida</div>
        <div class="gd-time">${seguinte?esc(seguinte.hora):"—"}</div>
        <div class="gd-what">${seguinte?esc(seguinte.titulo):"Fim do roteiro"}</div>
        <div class="gd-sub">${seguinte?esc(seguinte.local):""}</div>
      </div>
    </div>
  </div>

  <div class="dash-main">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h3>Roteiro de agora em diante</h3>
          <span class="t-xs t-muted">${ev.filter(e => ordemHora(e.hora) >= agoraMin).length} eventos restantes</span></div>
        <div class="card-body">
          <div class="tl">
            ${ev.filter(e => ordemHora(e.hora) >= agoraMin).slice(0,8).map((e,i) => `
              <div class="tl-item">
                <div class="tl-time">${esc(e.hora)}</div>
                <div class="tl-rail"><span class="tl-dot" style="${i===0?"background:var(--gold);transform:scale(1.3)":""}"></span></div>
                <div class="tl-body">
                  <div class="tl-title">${esc(e.titulo)}${i===0?` <span class="badge gold">agora</span>`:""}</div>
                  <div class="tl-meta"><span>${ico("pin")}${esc(e.local)}</span>
                  <span>${ico("users")}${esc((pessoa(e.resp)||{}).nome||"—")}</span></div>
                </div>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Alertas críticos</h3></div>
        <div class="card-body" style="padding-top:10px">
          <div class="alert info">${ico("info")}
            <div><div class="a-title">Nenhum alerta no momento</div>
            <div class="a-desc">Avisos de atraso ou pendência de fornecedores aparecem aqui no dia.</div></div></div>
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="card card-pad">
        <h3 class="display" style="font-size:19px;margin-bottom:14px">Contato rápido</h3>
        <div class="grid" style="gap:8px">
          ${contatos.map(f => `
            <button class="btn" style="justify-content:flex-start;height:46px" data-ligar="${f.id}">
              <span class="stat-ico" style="width:28px;height:28px;flex:0 0 28px;border-radius:8px">${ico(CAT_ICO[f.cat]||"phone")}</span>
              <span style="text-align:left;min-width:0">
                <span class="ell" style="display:block;font-size:13px;font-weight:520">${esc(f.cat)}</span>
                <span class="t-xs t-muted ell" style="display:block">${esc(f.contato)}</span>
              </span>
              <span style="margin-left:auto;color:var(--gold)">${ico("phone")}</span>
            </button>`).join("")}
        </div>
      </div>

      <div class="card card-pad">
        <div class="eyebrow">Resumo do dia</div>
        <div class="grid g-2 mt-12" style="gap:10px">
          ${linhaInfo("Convidados", String(m.pessoas))}
          ${linhaInfo("Mesas", String(d.mesas.length))}
          ${linhaInfo("Fornecedores", String(m.contratados.length))}
          ${linhaInfo("A pagar hoje", money(pagtosHoje.reduce((a,p)=>a+p.valor,0)))}
        </div>
      </div>
    </div>
  </div>`;
};

POS_RENDER.grandedia = function(){
  $("#view").addEventListener("click", e => {
    if(e.target.closest("[data-ativar-gd]")){
      App.data.casal.modoGrandeDia = true; salvar(); render();
      toast("Modo grande dia ativado.","ok"); return;
    }
    if(e.target.closest("[data-desativar-gd]")){
      App.data.casal.modoGrandeDia = false; salvar(); render();
      toast("Modo grande dia desativado.","info"); return;
    }
    const l = e.target.closest("[data-ligar]");
    if(l){
      const f = fornecedor(l.dataset.ligar);
      toast(`Ligando para ${f.contato} — ${f.tel}`,"info");
    }
  });
};

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */
VIEWS.config = function(){
  const d = App.data;
  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Configurações</h1>
      <p class="page-sub">Dados do casamento, preferências e gestão dos seus dados.</p>
    </div>
  </div>

  <div class="dash-main">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h3>O casamento</h3></div>
        <div class="card-body">
          <form id="form-config" class="form-grid">
            <div class="field"><label>Nome da noiva</label>
              <input class="input" name="nomeNoiva" value="${esc(d.casal.nomeNoiva)}"></div>
            <div class="field"><label>Nome do noivo</label>
              <input class="input" name="nomeNoivo" value="${esc(d.casal.nomeNoivo)}"></div>
            <div class="field"><label>Como aparecem no sistema</label>
              <input class="input" name="noiva" value="${esc(d.casal.noiva)}" placeholder="Karina"></div>
            <div class="field"><label>&nbsp;</label>
              <input class="input" name="noivo" value="${esc(d.casal.noivo)}" placeholder="Marcelo"></div>
            <div class="field"><label>Data do casamento</label>
              <input class="input" name="data" type="date" value="${esc(d.casal.data)}"></div>
            <div class="field"><label>Horário da cerimônia</label>
              <input class="input" name="hora" type="time" value="${esc(d.casal.hora)}"></div>
            <div class="field"><label>Local</label>
              <input class="input" name="local" value="${esc(d.casal.local)}"></div>
            <div class="field"><label>Cidade</label>
              <input class="input" name="cidade" value="${esc(d.casal.cidade)}"></div>
            <div class="field"><label>Orçamento total (R$)</label>
              <input class="input" name="orcamento" type="number" min="0" step="500" value="${d.casal.orcamento}"></div>
            <div class="field"><label>Convidados previstos</label>
              <input class="input" name="convidadosPrevistos" type="number" min="0" value="${d.casal.convidadosPrevistos}"></div>
          </form>
        </div>
        <div class="card-foot between">
          <span class="t-xs t-muted">As alterações são salvas no seu navegador.</span>
          <button class="btn btn-primary" id="salvar-config">Salvar alterações</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Site dos convidados</h3>
          ${siteConfigurado() ? `<span class="badge ok">Conectado</span>` : `<span class="badge warn">Não conectado</span>`}</div>
        <div class="card-body">
          <p class="t-sm t-ink3 mb-16" style="line-height:1.6">
            Conecte o site que você envia para os convidados (pasta <code>convite/</code>) para que as confirmações de presença
            e reservas de presentes cheguem aqui sozinhas. Veja o passo a passo em
            <code>convite/LEIA-ME.md</code>.
          </p>
          <form id="form-site" class="form-grid">
            <div class="field full"><label>URL do Supabase</label>
              <input class="input" name="supabaseUrl" value="${esc(d.casal.supabaseUrl)}" placeholder="https://xxxxxxxx.supabase.co"></div>
            <div class="field full"><label>Chave pública (anon/publishable)</label>
              <input class="input" name="supabaseKey" value="${esc(d.casal.supabaseKey)}" placeholder="sb_publishable_…"></div>
            <div class="field full"><label>Senha do painel</label>
              <input class="input" name="supabaseSenha" type="password" value="${esc(d.casal.supabaseSenha)}" placeholder="A mesma senha do supabase-setup.sql"></div>
          </form>
          ${d.casal.ultimaImportacao ? `<p class="t-xs t-muted mt-8">Última sincronização: ${fmtData(d.casal.ultimaImportacao.slice(0,10), true)} às ${new Date(d.casal.ultimaImportacao).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</p>` : ""}
        </div>
        <div class="card-foot between">
          <span class="center gap-10">
            <a class="link" href="../convite/index.html" target="_blank">${ico("arrowRight")}Abrir site dos convidados</a>
            <a class="link" href="../convite/painel.html" target="_blank">${ico("arrowRight")}Abrir painel de respostas</a>
          </span>
          <span class="center gap-8">
            <button class="btn btn-sm" id="sincronizar-site">${ico("refresh")}Sincronizar agora</button>
            <button class="btn btn-sm btn-primary" id="salvar-site">Salvar conexão</button>
          </span>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Seus dados</h3></div>
        <div class="card-body" style="padding-top:10px">
          <div class="alert info mb-16">${ico("info")}
            <div><div class="a-title">Tudo fica salvo neste navegador</div>
            <div class="a-desc">Este é um sistema de demonstração: nenhuma informação é enviada para a internet. Se limpar os dados do navegador, o conteúdo volta ao exemplo original.</div></div>
          </div>
          <div class="center gap-10 wrap">
            <button class="btn" data-exportar-tudo>${ico("download")}Exportar tudo (JSON)</button>
            <button class="btn" onclick="window.print()">${ico("printer")}Imprimir página</button>
            <button class="btn btn-danger" data-restaurar-tudo>${ico("refresh")}Restaurar dados de exemplo</button>
          </div>
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="card card-pad">
        <div class="t-center">
          <div class="brand-mark" style="font-size:42px">${esc(d.casal.noiva[0])}<span class="amp">&#10084;</span>${esc(d.casal.noivo[0])}</div>
          <div class="brand-sub mt-8">${esc(d.casal.nomeNoiva)} &amp; ${esc(d.casal.nomeNoivo)}</div>
          <div class="brand-rule" style="margin:14px auto"></div>
          <div class="t-sm t-ink3">${d.casal.data ? fmtDataExt(d.casal.data) : "Data ainda não definida"}</div>
          <div class="t-sm t-muted">${[d.casal.local, d.casal.cidade].filter(Boolean).join(" · ")}</div>
          ${d.casal.data ? `<div class="num mt-16" style="font-size:32px">${metricas().diasRestantes}</div>
          <div class="t-xs t-muted" style="letter-spacing:.14em;text-transform:uppercase">dias restantes</div>` : ""}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Resumo do sistema</h3></div>
        <div class="card-body" style="padding-top:10px">
          ${[["Convidados",d.convidados.length],["Mesas",d.mesas.length],["Fornecedores",d.fornecedores.length],
             ["Pagamentos",d.pagamentos.length],["Tarefas",d.tarefas.length],["Eventos no cronograma",d.cronograma.length],
             ["Documentos",d.documentos.length],["Inspirações",d.inspiracoes.length],["Pessoas na equipe",d.equipe.length]]
            .map(([n,v]) => `<div class="list-row"><span class="grow t-sm">${n}</span>
              <strong class="num tnum" style="font-size:16px">${v}</strong></div>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
};

POS_RENDER.config = function(){
  const v = $("#view");
  const btn = $("#salvar-config");
  if(btn) btn.onclick = () => {
    const fd = new FormData($("#form-config"));
    const c = App.data.casal;
    c.nomeNoiva = fd.get("nomeNoiva") || c.nomeNoiva;
    c.nomeNoivo = fd.get("nomeNoivo") || c.nomeNoivo;
    c.noiva = (fd.get("noiva") || c.noiva).trim() || c.noiva;
    c.noivo = (fd.get("noivo") || c.noivo).trim() || c.noivo;
    c.data = fd.get("data") || c.data;
    c.hora = fd.get("hora") || c.hora;
    c.local = fd.get("local") || c.local;
    c.cidade = fd.get("cidade") || c.cidade;
    c.orcamento = Number(fd.get("orcamento")) || c.orcamento;
    c.convidadosPrevistos = Number(fd.get("convidadosPrevistos")) || c.convidadosPrevistos;
    salvar(); render(); toast("Configurações salvas.","ok");
  };

  const btnSite = $("#salvar-site");
  if(btnSite) btnSite.onclick = () => {
    const fd = new FormData($("#form-site"));
    const c = App.data.casal;
    c.supabaseUrl = String(fd.get("supabaseUrl")||"").trim();
    c.supabaseKey = String(fd.get("supabaseKey")||"").trim();
    c.supabaseSenha = String(fd.get("supabaseSenha")||"").trim();
    salvar(); render(); toast("Conexão salva.","ok");
  };

  const btnSync = $("#sincronizar-site");
  if(btnSync) btnSync.onclick = async () => {
    if(!siteConfigurado()){ toast("Preencha e salve a conexão com o Supabase primeiro.","err"); return; }
    btnSync.disabled = true;
    const textoOriginal = btnSync.innerHTML;
    btnSync.innerHTML = `<span class="spinner"></span> Sincronizando…`;
    const r = await importarRespostasSite(true);
    btnSync.disabled = false; btnSync.innerHTML = textoOriginal;
    if(r.ok) toast(r.novas > 0 ? `${r.novas} nova(s) resposta(s) importada(s).` : "Tudo em dia — nenhuma resposta nova.", "ok");
    else toast("Não foi possível sincronizar: " + r.motivo, "err");
    render();
  };

  v.addEventListener("click", e => {
    if(e.target.closest("[data-exportar-tudo]")){
      const url = URL.createObjectURL(new Blob([JSON.stringify(App.data, null, 2)], { type:"application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = "casamento-karina-e-marcelo.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Backup exportado.","ok"); return;
    }
    if(e.target.closest("[data-restaurar-tudo]")){
      confirmar("Restaurar dados de exemplo",
        "Todas as suas alterações serão apagadas e o sistema voltará ao conteúdo original de demonstração.",
        restaurarExemplo, "Restaurar");
    }
  });
};
