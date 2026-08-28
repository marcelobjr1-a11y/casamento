/* ============================================================
   ATELIÊ — Dashboard · Convidados · RSVP · Mesas
   ============================================================ */

const PALETAS = {
  1:"linear-gradient(150deg,#EADFC8,#CDBB9B)", 2:"linear-gradient(150deg,#DED4C4,#B7A98F)",
  3:"linear-gradient(150deg,#DDE2D6,#B4BCA8)", 4:"linear-gradient(150deg,#F0E7DB,#D3C4AE)",
  5:"linear-gradient(150deg,#E6E2DB,#C0B8AA)", 6:"linear-gradient(150deg,#EEE3D1,#C9B48E)",
  7:"linear-gradient(150deg,#DFD7CC,#B3A797)", 8:"linear-gradient(150deg,#E8E4DC,#C4BCAC)"
};
function moodFundo(i){ return PALETAS[((i-1) % 8) + 1]; }

/* =========================================================
   DASHBOARD
   ========================================================= */
VIEWS.dashboard = function(){
  const d = App.data, m = metricas();

  const proximasTarefas = d.tarefas
    .filter(t => t.status !== "concluido")
    .sort((a,b) => a.prazo.localeCompare(b.prazo)).slice(0,5);

  const proximosPagtos = m.aberto
    .slice().sort((a,b) => a.venc.localeCompare(b.venc)).slice(0,4);

  const compromissos = [];

  const alertas = [];
  if(m.venc7.length) alertas.push(["warn","alert",`${m.venc7.length} pagamento${m.venc7.length>1?"s vencem":" vence"} nos próximos 7 dias`, money(m.venc7.reduce((a,p)=>a+p.valor,0)) + " no total.", "financeiro"]);
  if(m.pendentes.length) alertas.push(["info","info",`${m.pendentes.length} convidados ainda não responderam`, "Envie um lembrete de RSVP.", "rsvp"]);
  if(m.contratosPend.length) alertas.push(["danger","alert",`${m.contratosPend.length} contratos aguardam assinatura`, m.contratosPend.map(c => c.nome.replace(/^Contrato — /,"").replace(/\.pdf$/,"")).join(" e ") + ".", "documentos"]);
  if(m.atrasadas.length) alertas.push(["danger","clock",`${m.atrasadas.length} tarefa${m.atrasadas.length>1?"s atrasadas":" atrasada"}`, "Reveja os prazos com a equipe.", "tarefas"]);
  if(m.semMesa.length) alertas.push(["info","table",`${m.semMesa.length} confirmados ainda sem mesa`, "Finalize o mapa do salão.", "mesas"]);

  const catsTop = d.orcamentoCats.map(c => {
    const fs = d.fornecedores.filter(f => f.cat === c.cat && (f.status === "Contratado" || f.status === "Concluído"));
    return { ...c, contratado: fs.reduce((a,f) => a + f.valor, 0) };
  }).sort((a,b) => b.orcado - a.orcado).slice(0,5);

  const grupos = GRUPOS.map(g => ({
    nome:g.nome,
    qtd: d.convidados.filter(c => c.grupo === g.id).length,
    conf: d.convidados.filter(c => c.grupo === g.id && c.rsvp === "confirmado").length
  }));

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Olá, ${esc(d.casal.noiva)} e ${esc(d.casal.noivo)}.</h1>
      <p class="page-sub">${d.casal.data ? `${contagem().frase} — ${fmtDataExt(d.casal.data)}.` : `${contagem().frase} para ver a contagem regressiva e o roteiro do dia.`}</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-rota="cronograma">${ico("calendar")}Ver cronograma</button>
      <button class="btn btn-primary" data-adicionar>${ico("plus")}Adicionar</button>
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${cardStat("users","", "Convidados", `${m.confirmados.length + m.acomp}<small> / ${m.totalGeral}</small>`, m.acompTotal ? `confirmados · inclui acompanhantes` : "confirmados", m.confirmados.length + m.acomp, m.totalGeral, "ok", "convidados")}
    ${cardStat("dollar","g4","Orçamento", money(m.valorContratado), `de ${money(m.orcamento)} previstos`, m.valorContratado, m.orcamento, "", "financeiro")}
    ${cardStat("briefcase","g3","Fornecedores", m.contratados.length, "contratados", m.contratados.length, d.fornecedores.length, "", "fornecedores",
        `<div class="avatar-stack">${m.contratados.slice(0,4).map(f => avatarHTML(f.contato, "sm", f.id)).join("")}
         ${m.contratados.length > 4 ? `<span class="avatar-more">+${m.contratados.length-4}</span>` : ""}</div>`)}
    ${cardStat("checkCircle","g2","Tarefas", m.tarefasPend.length, "pendentes", m.tarefasFeitas, d.tarefas.length, "warn", "tarefas")}
  </div>

  ${alertas.length ? `<div class="grid ${alertas.length>2?"g-3":"g-2"} mb-20">
    ${alertas.slice(0,3).map(([tom,icone,titulo,desc,rota]) => `
      <button class="alert ${tom}" data-rota="${rota}" style="text-align:left;width:100%">
        ${ico(icone)}
        <span style="min-width:0"><span class="a-title" style="display:block">${esc(titulo)}</span>
        <span class="a-desc" style="display:block">${esc(desc)}</span></span>
        <span class="a-act" style="color:var(--muted)">${ico("chevronRight")}</span>
      </button>`).join("")}
  </div>` : ""}

  <div class="dash-main">
    <div class="stack">

      <div class="grid" style="grid-template-columns:296px minmax(0,1fr);gap:18px" id="dash-linha1">
        <div class="card card-pad">
          <h3 class="display" style="font-size:19px">Progresso do casamento</h3>
          <div class="mt-20">${anelProgresso(m.progresso, "organizado")}</div>
          <p class="t-sm t-center t-ink3 mt-16" style="line-height:1.5">
            ${m.progresso >= 70 ? "Muito bem! Vocês estão no caminho certo." : "Ainda há bastante coisa para acertar."}<br>
            <span class="t-muted">${m.marcosOk} de ${d.marcos.length} marcos concluídos</span>
          </p>
          <div class="t-center mt-16"><button class="btn btn-sm" data-plano>Ver plano completo</button></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Próximas tarefas</h3>
            <button class="link" data-rota="tarefas">Ver todas ${ico("chevronRight")}</button></div>
          <div class="card-body" style="padding-top:8px">
            ${proximasTarefas.length ? proximasTarefas.map(t => `
              <div class="list-row">
                <button class="check ${t.status==="concluido"?"on":""}" data-toggle-tarefa="${t.id}" title="Concluir">${ico("check")}</button>
                <span class="grow">
                  <span style="display:block;font-size:13.5px;font-weight:480" class="ell">${esc(t.titulo)}</span>
                  <span class="t-xs t-muted center mt-4" style="gap:7px">
                    ${ico("clock")}<span>${prazoTexto(t.prazo)}</span>
                    <span class="dot-sep"></span>${esc((pessoa(t.responsavel)||{}).nome || "—")}
                  </span>
                </span>
                ${badgePrioridade(t.prioridade)}
                ${avatarPessoa(t.responsavel,"sm")}
              </div>`).join("")
            : vazio("checkCircle","Nada pendente","Todas as tarefas estão concluídas.","")}
          </div>
          <div class="card-foot"><button class="link" data-rota="tarefas">Ver todas as tarefas (${m.tarefasPend.length} pendentes)</button></div>
        </div>
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-head"><h3>Convidados</h3>
            <button class="link" data-rota="rsvp">RSVP ${ico("chevronRight")}</button></div>
          <div class="card-body">
            <div class="center gap-16 wrap">
              ${donut([
                { valor:m.confirmados.length, cor:"#6E8B6A" },
                { valor:m.pendentes.length,   cor:"#C0A165" },
                { valor:m.recusados.length,   cor:"#B0574B" }
              ])}
              <div class="legend grow">
                <div class="legend-item"><i class="sw" style="background:#6E8B6A"></i>Confirmados<span class="lv">${m.confirmados.length}</span></div>
                <div class="legend-item"><i class="sw" style="background:#C0A165"></i>Pendentes<span class="lv">${m.pendentes.length}</span></div>
                <div class="legend-item"><i class="sw" style="background:#B0574B"></i>Recusados<span class="lv">${m.recusados.length}</span></div>
                <div class="sep" style="margin:6px 0"></div>
                <div class="legend-item t-muted">Total de pessoas<span class="lv">${m.pessoas}</span></div>
              </div>
            </div>
            <div class="sep"></div>
            <div class="grid g-2" style="gap:10px">
              ${grupos.slice(0,4).map(g => `
                <div style="padding:10px 12px;border:1px solid var(--line-2);border-radius:10px">
                  <div class="t-xs t-muted ell">${esc(g.nome)}</div>
                  <div class="center" style="gap:6px;margin-top:2px">
                    <strong class="num" style="font-size:19px">${g.qtd}</strong>
                    <span class="t-xs t-muted">· ${g.conf} conf.</span>
                  </div>
                </div>`).join("")}
            </div>
          </div>
          <div class="card-foot"><button class="link" data-rota="convidados">Ver lista completa</button></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Orçamento por categoria</h3>
            <button class="link" data-rota="financeiro">Ver detalhes ${ico("chevronRight")}</button></div>
          <div class="card-body">
            ${catsTop.map(c => `
              <div style="margin-bottom:15px">
                <div class="between" style="margin-bottom:6px">
                  <span class="center gap-8" style="font-size:13px">
                    <span style="color:var(--gold);display:flex">${ico(CAT_ICO[c.cat]||"more")}</span>${esc(c.cat)}
                  </span>
                  <span class="t-xs t-muted tnum">${money(c.contratado)} / ${money(c.orcado)}</span>
                </div>
                ${barra(c.contratado, c.orcado, c.contratado > c.orcado ? "danger" : (c.contratado >= c.orcado*.9 ? "warn" : ""))}
              </div>`).join("")}
            <div class="sep"></div>
            <div class="between">
              <span class="t-sm t-muted">Total contratado</span>
              <strong class="num" style="font-size:20px">${money(m.valorContratado)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>O grande dia</h3>
          <button class="link" data-rota="cronograma">Ver cronograma completo ${ico("chevronRight")}</button></div>
        <div class="card-body" style="padding-top:0">
          ${d.cronograma.length ? `<div class="dayline">
            <div class="dayline-track">
              ${(() => {
                const chave = ["08:00","12:00","17:00","18:00","19:30","21:30","22:30","00:30"];
                const ev = chave.map(h => d.cronograma.find(e => e.hora === h)).filter(Boolean);
                const lista = ev.length >= 5 ? ev : d.cronograma.filter((_,i) => i % 2 === 0).slice(0,8);
                return lista.map(e => `
                  <div class="dl-pt" title="${esc(e.titulo)} · ${esc(e.local)}">
                    <div class="h">${esc(e.hora)}</div>
                    <div class="d"></div>
                    <div class="t">${esc(e.titulo)}</div>
                  </div>`).join("");
              })()}
            </div>
          </div>` : vazio("calendar","Roteiro do dia vazio","Adicione os horários do seu grande dia no Cronograma.","")}
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="card">
        <div class="card-head"><h3>Próximos compromissos</h3></div>
        <div class="card-body" style="padding-top:10px">
          ${compromissos.length ? compromissos.map(c => `
            <button class="list-row" style="width:100%;text-align:left" data-rota="cronograma">
              <span style="width:44px;text-align:center;flex:0 0 44px">
                <span class="num" style="display:block;font-size:20px;line-height:1">${c.dia}</span>
                <span class="t-xs t-muted" style="letter-spacing:.08em">${c.mes}</span>
              </span>
              <span class="grow">
                <span style="display:block;font-size:13px;font-weight:500" class="ell">${esc(c.titulo)}</span>
                <span class="t-xs t-muted">${esc(c.hora)} · ${esc(c.onde)}</span>
              </span>
              ${avatarPessoa(c.quem,"sm")}
              <span style="color:var(--muted-2);display:flex">${ico("chevronRight")}</span>
            </button>`).join("")
          : vazio("calendar","Nenhum compromisso ainda","Reuniões e marcações com fornecedores aparecem aqui.","")}
        </div>
        ${compromissos.length ? `<div class="card-foot"><button class="link" data-rota="cronograma">Ver todos</button></div>` : ""}
      </div>

      <div class="card">
        <div class="card-head"><h3>Próximos pagamentos</h3></div>
        <div class="card-body" style="padding-top:10px">
          ${proximosPagtos.map(p => {
            const f = fornecedor(p.fornecedor) || { nome:"—", cat:"Outros" };
            return `<div class="list-row">
              <span class="stat-ico" style="width:34px;height:34px;flex:0 0 34px;border-radius:9px">${ico(CAT_ICO[f.cat]||"card")}</span>
              <span class="grow">
                <span style="display:block;font-size:13px;font-weight:500" class="ell">${esc(f.nome)}</span>
                <span class="t-xs t-muted">${moneyF(p.valor)} · ${fmtData(p.venc)}</span>
              </span>
              ${badgePagamento(p)}
            </div>`;
          }).join("")}
          <div class="sep" style="margin:14px 0 10px"></div>
          <div class="between">
            <span class="t-sm t-muted">Total em aberto</span>
            <strong class="num" style="font-size:19px">${money(m.valorRestante)}</strong>
          </div>
        </div>
        <div class="card-foot"><button class="link" data-rota="financeiro">Ver todos os pagamentos</button></div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Inspirações salvas</h3>
          <button class="link" data-rota="inspiracoes">Ver todas ${ico("chevronRight")}</button></div>
        <div class="card-body">
          <div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">
            ${d.inspiracoes.slice(0,6).map(i => `
              <button class="mini-mood" data-rota="inspiracoes" title="${esc(i.titulo)}"
                style="background:${i.img?`url('${esc(i.img)}') center/cover`:moodFundo(i.g)}">${i.img?"":ico("flower")}</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <h3 class="display" style="font-size:18px;margin-bottom:14px">Acesso rápido</h3>
        <div class="grid g-2" style="gap:8px">
          ${[["documentos","Documentos","folder"],["fornecedores","Fornecedores","briefcase"],
             ["mesas","Mesas","table"],["cronograma","Cronograma","calendar"],
             ["equipe","Equipe","userPlus"],["grandedia","Grande dia","sparkle"]].map(([r,n,i]) => `
            <button class="btn btn-sm" style="justify-content:flex-start" data-rota="${r}">${ico(i)}${n}</button>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
};

function cardStat(icone, tom, rotulo, valor, nota, a, b, tomBarra, rota, extra){
  return `<button class="card card-hover stat" data-rota="${rota}" style="text-align:left;width:100%">
    <span class="stat-top">
      <span class="stat-ico ${tom}">${ico(icone)}</span>
      <span style="min-width:0">
        <span class="stat-label" style="display:block">${rotulo}</span>
        <span class="stat-val" style="display:block">${valor}</span>
        <span class="stat-note" style="display:block">${nota}</span>
      </span>
    </span>
    ${extra || ""}
    ${barra(a, b, tomBarra, "thin")}
  </button>`;
}

POS_RENDER.dashboard = function(){
  $("#view").addEventListener("click", e => {
    const t = e.target.closest("[data-toggle-tarefa]");
    if(t){
      e.stopPropagation();
      const tarefa = App.data.tarefas.find(x => x.id === t.dataset.toggleTarefa);
      tarefa.status = tarefa.status === "concluido" ? "afazer" : "concluido";
      salvar(); render();
      toast(tarefa.status === "concluido" ? "Tarefa concluída." : "Tarefa reaberta.", "ok");
      return;
    }
    if(e.target.closest("[data-plano]")) abrirPlano();
  });
};

function abrirPlano(){
  const fases = [...new Set(App.data.marcos.map(m => m.fase))];
  const m = metricas();
  modal({
    titulo:"Plano do casamento",
    sub:`${m.marcosOk} de ${App.data.marcos.length} marcos concluídos · ${m.progresso}% organizado`,
    tamanho:"wide",
    corpo:`<div class="mb-20">${barra(m.marcosOk, App.data.marcos.length, "", "thick")}</div>
      ${fases.map(f => `
        <div class="mb-20">
          <div class="eyebrow mb-8">${esc(f)}</div>
          ${App.data.marcos.filter(x => x.fase === f).map(x => `
            <div class="list-row">
              <button class="check ${x.ok?"on":""}" data-marco="${x.id}">${ico("check")}</button>
              <span class="grow" style="font-size:13.5px;${x.ok?"color:var(--muted);text-decoration:line-through":""}">${esc(x.titulo)}</span>
              ${x.ok ? `<span class="badge ok">Concluído</span>` : `<span class="badge">Pendente</span>`}
            </div>`).join("")}
        </div>`).join("")}`,
    rodape:`<button class="btn" data-fechar>Fechar</button>`,
    aoAbrir(w){
      w.addEventListener("click", e => {
        const b = e.target.closest("[data-marco]"); if(!b) return;
        const mk = App.data.marcos.find(x => x.id === b.dataset.marco);
        mk.ok = !mk.ok; salvar(); fecharModal(); render(); abrirPlano();
      });
    }
  });
}

/* =========================================================
   CONVIDADOS
   ========================================================= */
VIEWS.convidados = function(){
  const f = App.filtros.convidados;
  const m = metricas();
  const lista = filtrarConvidados();
  f.pagina = f.pagina || 1;
  const porPag = 25;
  const totalPags = Math.max(1, Math.ceil(lista.length / porPag));
  if(f.pagina > totalPags) f.pagina = 1;
  const pag = lista.slice((f.pagina-1)*porPag, f.pagina*porPag);

  const filtrosRSVP = [["todos","Todos",m.total],["confirmado","Confirmados",m.confirmados.length],
    ["pendente","Pendentes",m.pendentes.length],["recusado","Recusados",m.recusados.length]];
  const filtrosGrupo = [["todos","Todos os grupos",0]].concat(
    GRUPOS.map(g => [g.id, g.nome, App.data.convidados.filter(c => c.grupo === g.id).length]),
    [["criancas","Crianças", App.data.convidados.filter(c => c.tipo === "crianca").length]]);

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Convidados</h1>
      <p class="page-sub"><b>${m.confirmados.length + m.acomp}</b> de ${m.totalGeral} pessoas confirmadas${m.acompTotal ? ` · inclui ${m.acompTotal} acompanhante${m.acompTotal>1?"s":""}` : ""}.</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-exportar>${ico("download")}Exportar CSV</button>
      ${m.total ? `<button class="btn btn-danger" data-excluir-todos>${ico("trash")}Excluir todos</button>` : ""}
      <button class="btn btn-primary" data-novo-convidado>${ico("userPlus")}Adicionar convidado</button>
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${miniStat("Total de pessoas", m.totalGeral, m.acompTotal ? `${m.total} na lista + ${m.acompTotal} acompanhante${m.acompTotal>1?"s":""}` : "pessoas na lista", "users")}
    ${miniStat("Confirmados", m.confirmados.length + m.acomp, m.acomp ? `${m.confirmados.length} + ${m.acomp} acompanhante${m.acomp>1?"s":""}` : pct(m.confirmados.length,m.total)+"% da lista", "checkCircle","g2")}
    ${miniStat("Pendentes", m.pendentes.length, "aguardando resposta", "clock","g4")}
    ${miniStat("Recusados", m.recusados.length, "não poderão ir", "x","g3")}
  </div>

  <div class="card">
    <div class="card-body" style="padding-bottom:0">
      <div class="between wrap gap-12 mb-16">
        <div class="input-ico" style="max-width:320px;flex:1;min-width:200px">
          ${ico("search")}
          <input class="input" id="busca-conv" placeholder="Buscar por nome ou telefone…" value="${esc(f.busca)}">
        </div>
        <div class="center gap-10 wrap">
          <select class="select" id="filtro-grupo" style="width:auto;min-width:180px">
            ${filtrosGrupo.map(([id,nome,q]) => `<option value="${id}" ${f.grupo===id?"selected":""}>${esc(nome)}${q?` (${q})`:""}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="chips mb-16">
        ${filtrosRSVP.map(([id,nome,q]) => `
          <button class="chip ${f.rsvp===id?"active":""}" data-frsvp="${id}">${nome}<span class="n">${q}</span></button>`).join("")}
      </div>
    </div>

    ${lista.length ? `
    <div class="table-wrap">
      <table class="tbl">
        <thead><tr>
          <th style="width:30%">Convidado</th><th>Grupo</th><th>Telefone</th>
          <th class="right">Acomp.</th><th>RSVP</th><th>Mesa</th><th>Restrição</th><th></th>
        </tr></thead>
        <tbody>
          ${pag.map(c => {
            const mesa = App.data.mesas.find(x => x.id === c.mesa);
            return `<tr data-conv="${c.id}" style="cursor:pointer">
              <td><span class="cell-name">
                ${avatarHTML(c.nome,"sm",c.id)}
                <span style="min-width:0">
                  <span class="nm ell" style="display:block">${esc(c.nome)}${c.tipo==="crianca"?` <span class="badge" style="height:18px;font-size:10px">criança</span>`:""}</span>
                </span></span></td>
              <td class="t-sm t-ink3 nowrap">${esc(nomeGrupo(c.grupo))}</td>
              <td class="t-sm t-ink3 tnum nowrap">${esc(c.telefone)}</td>
              <td class="right t-sm tnum">${c.acompanhantes ? "+"+c.acompanhantes : "—"}</td>
              <td>${badgeRSVP(c.rsvp)}</td>
              <td class="t-sm">${mesa ? `<span class="badge gold">${esc(mesa.nome)}</span>` : `<span class="t-muted">—</span>`}</td>
              <td class="t-sm t-ink3" style="max-width:150px">${c.restricao ? esc(c.restricao) : `<span class="t-muted">—</span>`}</td>
              <td><span class="row-actions">
                <button class="mini-btn" data-editar-conv="${c.id}" title="Editar">${ico("edit")}</button>
                <button class="mini-btn danger" data-excluir-conv="${c.id}" title="Excluir">${ico("trash")}</button>
              </span></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
    <div class="card-foot between">
      <span class="t-sm t-muted">Mostrando ${(f.pagina-1)*porPag+1}–${Math.min(f.pagina*porPag, lista.length)} de ${lista.length}</span>
      <span class="center gap-8">
        <button class="btn btn-sm" data-pag="${f.pagina-1}" ${f.pagina<=1?"disabled":""}>${ico("chevronLeft")}Anterior</button>
        <span class="t-sm t-muted tnum">${f.pagina} / ${totalPags}</span>
        <button class="btn btn-sm" data-pag="${f.pagina+1}" ${f.pagina>=totalPags?"disabled":""}>Próxima${ico("chevronRight")}</button>
      </span>
    </div>`
    : (App.data.convidados.length === 0
        ? vazio("users","Nenhum convidado cadastrado ainda","Adicione o primeiro convidado para começar a montar sua lista.",
            `<button class="btn btn-primary" data-novo-convidado>${ico("userPlus")}Adicionar convidado</button>`)
        : vazio("users","Nenhum convidado encontrado","Ajuste a busca ou os filtros para ver outros convidados.",
            `<button class="btn btn-primary" data-limpar-filtros>Limpar filtros</button>`))}
  </div>`;
};

function miniStat(rotulo, valor, nota, icone, tom){
  return `<div class="card stat">
    <span class="stat-top">
      <span class="stat-ico ${tom||""}">${ico(icone)}</span>
      <span><span class="stat-label" style="display:block">${rotulo}</span>
      <span class="stat-val" style="display:block">${valor}</span>
      <span class="stat-note" style="display:block">${nota}</span></span>
    </span></div>`;
}

function filtrarConvidados(){
  const f = App.filtros.convidados;
  const q = f.busca.trim().toLowerCase();
  return App.data.convidados.filter(c => {
    if(f.rsvp !== "todos" && c.rsvp !== f.rsvp) return false;
    if(f.grupo === "criancas"){ if(c.tipo !== "crianca") return false; }
    else if(f.grupo !== "todos" && c.grupo !== f.grupo) return false;
    if(q && !(c.nome.toLowerCase().includes(q) || c.telefone.includes(q))) return false;
    return true;
  });
}

POS_RENDER.convidados = function(){
  const v = $("#view");
  sincronizarSiteAoAbrir();
  const busca = $("#busca-conv");
  if(busca){
    let tmr;
    busca.addEventListener("input", () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        App.filtros.convidados.busca = busca.value;
        App.filtros.convidados.pagina = 1;
        const pos = busca.selectionStart;
        render();
        const nb = $("#busca-conv");
        if(nb){ nb.focus(); nb.setSelectionRange(pos,pos); }
      }, 220);
    });
  }
  const grupo = $("#filtro-grupo");
  if(grupo) grupo.addEventListener("change", () => {
    App.filtros.convidados.grupo = grupo.value;
    App.filtros.convidados.pagina = 1; render();
  });

  v.addEventListener("click", e => {
    const r = e.target.closest("[data-frsvp]");
    if(r){ App.filtros.convidados.rsvp = r.dataset.frsvp; App.filtros.convidados.pagina = 1; render(); return; }
    const p = e.target.closest("[data-pag]");
    if(p && !p.disabled){ App.filtros.convidados.pagina = +p.dataset.pag; render(); return; }
    if(e.target.closest("[data-limpar-filtros]")){
      App.filtros.convidados = { busca:"", grupo:"todos", rsvp:"todos", pagina:1 }; render(); return;
    }
    if(e.target.closest("[data-novo-convidado]")){ abrirFormConvidado(); return; }
    if(e.target.closest("[data-exportar]")){ exportarConvidados(); return; }
    if(e.target.closest("[data-excluir-todos]")){
      const n = App.data.convidados.length;
      confirmar("Excluir todos os convidados",
        `Tem certeza que deseja remover <strong>${n} convidados</strong> da lista? Eles também sairão das mesas. Esta ação não pode ser desfeita.`,
        () => {
          App.data.convidados = [];
          salvar(); render();
          toast("Todos os convidados foram excluídos.","ok");
        }, "Excluir todos");
      return;
    }
    const ed = e.target.closest("[data-editar-conv]");
    if(ed){ e.stopPropagation(); abrirFormConvidado(ed.dataset.editarConv); return; }
    const ex = e.target.closest("[data-excluir-conv]");
    if(ex){
      e.stopPropagation();
      const c = App.data.convidados.find(x => x.id === ex.dataset.excluirConv);
      confirmar("Excluir convidado", `Tem certeza que deseja remover <strong>${esc(c.nome)}</strong> da lista? Esta ação não pode ser desfeita.`, () => {
        App.data.convidados = App.data.convidados.filter(x => x.id !== c.id);
        salvar(); render(); toast("Convidado removido.","ok");
      }, "Excluir");
      return;
    }
    const row = e.target.closest("[data-conv]");
    if(row) abrirConvidado(row.dataset.conv);
  });
};

function exportarConvidados(){
  const linhas = [["Nome","Grupo","Telefone","Acompanhantes","RSVP","Mesa","Restrição","Observações"]];
  filtrarConvidados().forEach(c => {
    const mesa = App.data.mesas.find(x => x.id === c.mesa);
    linhas.push([c.nome, nomeGrupo(c.grupo), c.telefone, c.acompanhantes, c.rsvp, mesa?mesa.nome:"", c.restricao, c.obs]);
  });
  const csv = linhas.map(l => l.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿"+csv], { type:"text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = "convidados.csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Lista exportada em CSV.","ok");
}

function abrirListaLembretes(){
  const pendentes = App.data.convidados.filter(c => c.rsvp === "pendente");
  modal({
    titulo: "Enviar lembrete de RSVP",
    sub: `${pendentes.length} convidados ainda não responderam`,
    tamanho: "wide",
    corpo: pendentes.length ? `
      <p class="t-sm t-ink3 mb-16">Clique em cada um para abrir o WhatsApp já com a mensagem escrita — você revisa e envia por lá, um de cada vez.</p>
      <div id="lista-lembretes">
        ${pendentes.map(c => `
          <div class="list-row" data-linha="${c.id}">
            ${avatarHTML(c.nome,"sm",c.id)}
            <span class="grow" style="min-width:0">
              <span class="ell" style="display:block;font-size:13px;font-weight:480">${esc(c.nome)}</span>
              <span class="t-xs t-muted">${c.telefone ? esc(c.telefone) : "sem telefone cadastrado"}</span>
            </span>
            <button class="btn btn-sm" data-enviar-lembrete="${c.id}" ${!c.telefone?"disabled":""}>${ico("send")}Enviar</button>
          </div>`).join("")}
      </div>`
      : vazio("checkCircle","Todos responderam!","Não há convidados pendentes de RSVP.",""),
    rodape: `<button class="btn btn-primary" data-fechar>Concluir</button>`,
    aoAbrir(w){
      w.addEventListener("click", e => {
        const b = e.target.closest("[data-enviar-lembrete]"); if(!b) return;
        const c = App.data.convidados.find(x => x.id === b.dataset.enviarLembrete);
        if(abrirWhatsApp(c.telefone, mensagemLembreteRSVP(c))){
          b.disabled = true; b.innerHTML = `${ico("check")}Enviado`;
        }
      });
    }
  });
}

function abrirConvidado(id){
  const c = App.data.convidados.find(x => x.id === id); if(!c) return;
  const mesa = App.data.mesas.find(x => x.id === c.mesa);
  modal({
    titulo:esc(c.nome),
    sub:`${esc(nomeGrupo(c.grupo))}${c.tipo==="crianca"?" · criança":""}`,
    corpo:`
      <div class="center gap-16 mb-20">
        ${avatarHTML(c.nome,"xl",c.id)}
        <div>${badgeRSVP(c.rsvp)}
          <div class="t-sm t-muted mt-8">${esc(c.telefone)}</div>
        </div>
      </div>
      <div class="grid g-2" style="gap:12px">
        ${linhaInfo("Grupo", nomeGrupo(c.grupo))}
        ${linhaInfo("Mesa", mesa ? mesa.nome : "Sem mesa definida")}
        ${linhaInfo("Acompanhantes", c.acompanhantes ? String(c.acompanhantes) : "Nenhum")}
        ${linhaInfo("Restrição alimentar", c.restricao || "Nenhuma")}
      </div>
      ${c.obs ? `<div class="mt-16"><div class="eyebrow mb-8">Observações</div>
        <p class="t-sm t-ink3" style="line-height:1.6">${esc(c.obs)}</p></div>` : ""}
      <div class="sep"></div>
      <div class="eyebrow mb-8">Alterar RSVP</div>
      <div class="chips">
        ${[["confirmado","Confirmado"],["pendente","Pendente"],["recusado","Não vai"]].map(([v,n]) =>
          `<button class="chip ${c.rsvp===v?"active":""}" data-rsvp="${v}">${n}</button>`).join("")}
      </div>`,
    rodape:`${c.telefone ? `<button class="btn" data-whatsapp>${ico("send")}WhatsApp</button>` : ""}
            <div class="grow"></div>
            <button class="btn" data-fechar>Fechar</button>
            <button class="btn btn-primary" data-editar>Editar convidado</button>`,
    aoAbrir(w){
      w.addEventListener("click", e => {
        const r = e.target.closest("[data-rsvp]");
        if(r){ c.rsvp = r.dataset.rsvp; if(c.rsvp !== "confirmado") c.mesa = null;
               salvar(); fecharModal(); render(); toast("RSVP atualizado.","ok"); return; }
        if(e.target.closest("[data-editar]")){ fecharModal(); abrirFormConvidado(c.id); return; }
        if(e.target.closest("[data-whatsapp]")){
          const msg = c.rsvp === "pendente" ? mensagemLembreteRSVP(c) : "";
          abrirWhatsApp(c.telefone, msg);
        }
      });
    }
  });
}
function linhaInfo(rotulo, valor){
  return `<div style="padding:11px 13px;background:var(--surface-2);border-radius:10px">
    <div class="t-xs t-muted">${esc(rotulo)}</div>
    <div style="font-size:13.5px;font-weight:480;margin-top:2px">${esc(valor)}</div></div>`;
}

function abrirFormConvidado(id){
  const c = id ? App.data.convidados.find(x => x.id === id) : null;
  const mesasOpts = App.data.mesas.map(m => {
    const ocup = App.data.convidados.filter(x => x.mesa === m.id).length;
    return `<option value="${m.id}" ${c && c.mesa===m.id?"selected":""}>${esc(m.nome)} — ${ocup}/${m.lugares}</option>`;
  }).join("");
  modal({
    titulo: c ? "Editar convidado" : "Adicionar convidado",
    sub: c ? "Atualize as informações abaixo." : "Preencha os dados do convidado.",
    corpo:`<form id="form-conv" class="form-grid">
      <div class="field full"><label>Nome completo *</label>
        <input class="input" name="nome" required value="${c?esc(c.nome):""}" placeholder="Ex.: Maria Helena Souza"></div>
      <div class="field"><label>Telefone</label>
        <input class="input" name="telefone" value="${c?esc(c.telefone):""}" placeholder="(11) 99999-0000"></div>
      <div class="field"><label>Grupo</label>
        <select class="select" name="grupo">
          ${GRUPOS.map(g => `<option value="${g.id}" ${c&&c.grupo===g.id?"selected":""}>${esc(g.nome)}</option>`).join("")}
        </select></div>
      <div class="field"><label>Tipo</label>
        <select class="select" name="tipo">
          <option value="adulto" ${c&&c.tipo==="adulto"?"selected":""}>Adulto</option>
          <option value="crianca" ${c&&c.tipo==="crianca"?"selected":""}>Criança</option>
        </select></div>
      <div class="field"><label>Acompanhantes</label>
        <input class="input" name="acompanhantes" type="number" min="0" max="6" value="${c?c.acompanhantes:0}"></div>
      <div class="field"><label>Status do RSVP</label>
        <select class="select" name="rsvp">
          <option value="pendente"   ${c&&c.rsvp==="pendente"?"selected":""}>Pendente</option>
          <option value="confirmado" ${c&&c.rsvp==="confirmado"?"selected":""}>Confirmado</option>
          <option value="recusado"   ${c&&c.rsvp==="recusado"?"selected":""}>Não vai</option>
        </select></div>
      <div class="field"><label>Restrição alimentar</label>
        <input class="input" name="restricao" value="${c?esc(c.restricao):""}" placeholder="Ex.: vegetariano"></div>
      <div class="field"><label>Mesa</label>
        <select class="select" name="mesa"><option value="">Sem mesa</option>${mesasOpts}</select></div>
      <div class="field full"><label>Observações</label>
        <textarea class="textarea" name="obs" placeholder="Anotações sobre este convidado…">${c?esc(c.obs):""}</textarea></div>
    </form>`,
    rodape:`<button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-conv">${c?"Salvar alterações":"Adicionar convidado"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-conv").onclick = () => {
        const fd = new FormData(w.querySelector("#form-conv"));
        const nome = String(fd.get("nome")||"").trim();
        if(!nome){ toast("Informe o nome do convidado.","err"); return; }
        const dados = {
          nome, telefone:fd.get("telefone")||"",
          grupo:fd.get("grupo"), tipo:fd.get("tipo"),
          acompanhantes:Number(fd.get("acompanhantes"))||0,
          rsvp:fd.get("rsvp"), restricao:fd.get("restricao")||"",
          mesa:fd.get("mesa")||null, obs:fd.get("obs")||""
        };
        if(c) Object.assign(c, dados);
        else App.data.convidados.unshift({ id:uid("c"), ...dados });
        salvar(); fecharModal(); render();
        toast(c ? "Convidado atualizado." : "Convidado adicionado.","ok");
      };
    }
  });
}

/* =========================================================
   RSVP
   ========================================================= */
VIEWS.rsvp = function(){
  const m = metricas();
  const respondido = m.confirmados.length + m.recusados.length;
  const pendentes = m.pendentes;

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">RSVP</h1>
      <p class="page-sub"><b>${m.confirmados.length}</b> de ${m.total} convidados confirmaram presença.</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-copiar-link>${ico("copy")}Copiar link do RSVP</button>
      <button class="btn btn-primary" data-lembrete-todos>${ico("send")}Enviar lembrete a todos</button>
    </div>
  </div>

  <div class="dash-main">
    <div class="stack">
      <div class="card card-pad">
        <div class="center gap-16 wrap" style="justify-content:space-between">
          <div>
            <div class="eyebrow">Taxa de resposta</div>
            <div class="num" style="font-size:37px;line-height:1.1;margin-top:6px">${pct(respondido,m.total)}%</div>
            <div class="t-sm t-muted">${respondido} de ${m.total} responderam</div>
          </div>
          ${donut([
            { valor:m.confirmados.length, cor:"#6E8B6A" },
            { valor:m.recusados.length,   cor:"#B0574B" },
            { valor:m.pendentes.length,   cor:"#E4DDD0" }
          ], 130)}
        </div>
        <div class="sep"></div>
        <div class="grid g-3" style="gap:12px">
          ${[["Confirmados",m.confirmados.length,"#6E8B6A"],["Não vão",m.recusados.length,"#B0574B"],["Sem resposta",m.pendentes.length,"#C0A165"]]
            .map(([n,v,cor]) => `
            <div style="padding:13px 14px;border:1px solid var(--line-2);border-radius:12px">
              <div class="center gap-8"><i style="width:8px;height:8px;border-radius:2px;background:${cor};display:block"></i>
              <span class="t-xs t-muted">${n}</span></div>
              <div class="num" style="font-size:23px;margin-top:5px">${v}</div>
              <div class="t-xs t-muted">${pct(v,m.total)}% do total</div>
            </div>`).join("")}
        </div>
        <div class="mt-20">${barra(m.confirmados.length, m.total, "ok", "thick")}</div>
        <div class="between mt-8">
          <span class="t-xs t-muted">Meta: 100% até 24 de março de 2027</span>
          <span class="t-xs t-muted">${m.pessoas} pessoas no total (com acompanhantes)</span>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Ainda não responderam</h3>
          <span class="badge warn">${pendentes.length} convidados</span>
        </div>
        <div class="card-body" style="padding-top:8px">
          ${pendentes.length ? `
          <div class="table-wrap"><table class="tbl" style="min-width:560px">
            <thead><tr><th style="width:34%">Convidado</th><th style="width:20%">Grupo</th><th style="width:20%">Contato</th><th class="right">Ação</th></tr></thead>
            <tbody>${pendentes.map(c => `
              <tr>
                <td><span class="cell-name">${avatarHTML(c.nome,"sm",c.id)}<span class="nm ell">${esc(c.nome)}</span></span></td>
                <td class="t-sm t-ink3 nowrap">${esc(nomeGrupo(c.grupo))}</td>
                <td class="t-sm t-ink3 nowrap">${esc(c.telefone)}</td>
                <td class="right"><span class="center gap-6" style="justify-content:flex-end">
                  <button class="btn btn-sm" data-lembrete="${c.id}">${ico("send")}Lembrete</button>
                  <button class="btn btn-sm" data-marcar-conf="${c.id}">${ico("check")}Confirmar</button>
                </span></td>
              </tr>`).join("")}
            </tbody></table></div>`
          : vazio("checkCircle","Todos responderam!","Não há convidados pendentes de RSVP.","")}
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="card card-pad">
        <h3 class="display" style="font-size:19px">Link de confirmação</h3>
        <p class="t-sm t-muted mt-8">Envie este link para os convidados confirmarem presença sozinhos.</p>
        <div class="mt-16" style="padding:12px 14px;background:var(--surface-2);border:1px dashed var(--line-strong);border-radius:10px;font-size:12.5px;word-break:break-all">
          ateliedecasamento.com/rsvp/karina-e-marcelo
        </div>
        <button class="btn btn-block mt-12" data-copiar-link>${ico("copy")}Copiar link</button>
      </div>

      <div class="card">
        <div class="card-head"><h3>Confirmações por grupo</h3></div>
        <div class="card-body">
          ${GRUPOS.map(g => {
            const t = App.data.convidados.filter(c => c.grupo === g.id);
            const conf = t.filter(c => c.rsvp === "confirmado").length;
            return `<div style="margin-bottom:14px">
              <div class="between mb-8"><span class="t-sm">${esc(g.nome)}</span>
              <span class="t-xs t-muted tnum">${conf}/${t.length}</span></div>
              ${barra(conf, t.length, "ok")}
            </div>`;
          }).join("")}
        </div>
      </div>

      <div class="card card-pad">
        <div class="alert info" style="border:0;padding:0;background:transparent">
          ${ico("info")}
          <div><div class="a-title">Dica do cerimonial</div>
          <div class="a-desc">Faltando 60 dias, ligue para quem não respondeu. A taxa de resposta sobe cerca de 30%.</div></div>
        </div>
      </div>
    </div>
  </div>`;
};

POS_RENDER.rsvp = function(){
  sincronizarSiteAoAbrir();
  $("#view").addEventListener("click", e => {
    if(e.target.closest("[data-copiar-link]")){
      const url = "ateliedecasamento.com/rsvp/karina-e-marcelo";
      if(navigator.clipboard) navigator.clipboard.writeText(url).catch(()=>{});
      toast("Link copiado para a área de transferência.","ok"); return;
    }
    if(e.target.closest("[data-lembrete-todos]")){
      abrirListaLembretes(); return;
    }
    const l = e.target.closest("[data-lembrete]");
    if(l){
      const c = App.data.convidados.find(x => x.id === l.dataset.lembrete);
      if(abrirWhatsApp(c.telefone, mensagemLembreteRSVP(c))) toast(`WhatsApp aberto para ${c.nome}.`,"ok");
      return;
    }
    const mc = e.target.closest("[data-marcar-conf]");
    if(mc){
      const c = App.data.convidados.find(x => x.id === mc.dataset.marcarConf);
      c.rsvp = "confirmado"; salvar(); render();
      toast(`${c.nome} confirmado.`,"ok");
    }
  });
};

/* =========================================================
   MESAS
   ========================================================= */
VIEWS.mesas = function(){
  const d = App.data;
  const confirmados = d.convidados.filter(c => c.rsvp === "confirmado");
  const semMesa = confirmados.filter(c => !c.mesa);
  const lugares = d.mesas.reduce((a,m) => a + m.lugares, 0);
  const ocupados = confirmados.filter(c => c.mesa).length;

  return `
  <div class="page-head">
    <div>
      <h1 class="page-title">Mapa de mesas</h1>
      <p class="page-sub"><b>${ocupados}</b> de ${lugares} lugares ocupados · ${semMesa.length} convidados ainda sem mesa.</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-auto-alocar>${ico("sparkle")}Distribuir automaticamente</button>
      <button class="btn btn-primary" data-nova-mesa>${ico("plus")}Nova mesa</button>
    </div>
  </div>

  <div class="grid g-4 mb-20">
    ${miniStat("Mesas", d.mesas.length, "no salão", "table")}
    ${miniStat("Lugares", lugares, "capacidade total", "users","g3")}
    ${miniStat("Ocupados", ocupados, pct(ocupados,lugares)+"% da capacidade", "checkCircle","g2")}
    ${miniStat("Sem mesa", semMesa.length, "convidados confirmados", "alert","g4")}
  </div>

  <div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start" id="mesas-grid">
    <div class="card">
      <div class="card-head">
        <h3>Planta do salão</h3>
        <span class="t-xs t-muted">Arraste um convidado da lista para uma mesa</span>
      </div>
      <div class="card-body">
        <div class="hall" id="hall">
          ${d.mesas.map(m => {
            const oc = d.convidados.filter(c => c.mesa === m.id);
            const cheia = oc.length >= m.lugares;
            const assentos = Array.from({length:m.lugares}, (_,i) => {
              const ang = (i / m.lugares) * Math.PI * 2 - Math.PI/2;
              const x = 32 + Math.cos(ang) * 34 - 4.5, y = 32 + Math.sin(ang) * 34 - 4.5;
              return `<i class="tn-seat ${i < oc.length ? "taken":""}" style="left:${x}px;top:${y}px"></i>`;
            }).join("");
            return `<div class="table-node ${cheia?"full":""} ${m.destaque?"tn-head":""}" data-mesa="${m.id}" title="${esc(m.nome)}">
              <div class="tn-circle"><span class="n">${m.destaque ? "&#10084;" : esc(m.nome.replace(/\D/g,"") || "•")}</span>${assentos}</div>
              <div class="tn-name">${esc(m.nome)}</div>
              <div class="tn-cap">${oc.length}/${m.lugares} lugares</div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Sem mesa</h3><span class="badge warn">${semMesa.length}</span></div>
      <div class="card-body" style="padding-top:10px">
        ${semMesa.length ? `<div class="guest-pool" id="pool">
          ${semMesa.map(c => `
            <div class="pool-item" draggable="true" data-guest="${c.id}">
              ${avatarHTML(c.nome,"sm",c.id)}
              <span class="grow" style="min-width:0">
                <span class="ell" style="display:block;font-size:12.5px;font-weight:480">${esc(c.nome)}</span>
                <span class="t-xs t-muted ell" style="display:block">${esc(nomeGrupo(c.grupo))}</span>
              </span>
            </div>`).join("")}
        </div>` : vazio("checkCircle","Tudo alocado","Todos os convidados confirmados já têm mesa.","")}
      </div>
    </div>
  </div>`;
};

POS_RENDER.mesas = function(){
  const v = $("#view");
  let arrastando = null;

  v.addEventListener("dragstart", e => {
    const it = e.target.closest("[data-guest]"); if(!it) return;
    arrastando = it.dataset.guest;
    it.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try{ e.dataTransfer.setData("text/plain", arrastando); }catch(_){}
  });
  v.addEventListener("dragend", e => {
    const it = e.target.closest("[data-guest]"); if(it) it.classList.remove("dragging");
    $$(".table-node").forEach(n => n.classList.remove("drag-over"));
  });
  v.addEventListener("dragover", e => {
    const n = e.target.closest("[data-mesa]"); if(!n) return;
    e.preventDefault(); n.classList.add("drag-over");
  });
  v.addEventListener("dragleave", e => {
    const n = e.target.closest("[data-mesa]"); if(n) n.classList.remove("drag-over");
  });
  v.addEventListener("drop", e => {
    const n = e.target.closest("[data-mesa]"); if(!n) return;
    e.preventDefault(); n.classList.remove("drag-over");
    const gid = arrastando || e.dataTransfer.getData("text/plain");
    if(!gid) return;
    alocar(gid, n.dataset.mesa);
  });

  v.addEventListener("click", e => {
    if(e.target.closest("[data-nova-mesa]")){ abrirFormMesa(); return; }
    if(e.target.closest("[data-auto-alocar]")){
      confirmar("Distribuir automaticamente",
        "Os convidados sem mesa serão distribuídos nos lugares livres, mantendo cada grupo junto sempre que possível. As alocações já feitas não mudam.",
        autoAlocar, "Distribuir");
      return;
    }
    const m = e.target.closest("[data-mesa]");
    if(m) abrirMesa(m.dataset.mesa);
  });
};

function alocar(gid, mid){
  const c = App.data.convidados.find(x => x.id === gid);
  const m = App.data.mesas.find(x => x.id === mid);
  if(!c || !m) return;
  const oc = App.data.convidados.filter(x => x.mesa === mid).length;
  if(oc >= m.lugares){ toast(`${m.nome} já está completa.`,"err"); return; }
  c.mesa = mid; salvar(); render();
  toast(`${c.nome} → ${m.nome}.`,"ok");
}
function autoAlocar(){
  const d = App.data;
  const semMesa = d.convidados.filter(c => c.rsvp === "confirmado" && !c.mesa)
    .sort((a,b) => a.grupo.localeCompare(b.grupo));
  let n = 0;
  semMesa.forEach(c => {
    const mesa = d.mesas.find(m => d.convidados.filter(x => x.mesa === m.id).length < m.lugares);
    if(mesa){ c.mesa = mesa.id; n++; }
  });
  salvar(); render();
  toast(n ? `${n} convidados distribuídos.` : "Não há lugares livres suficientes.", n ? "ok" : "err");
}

function abrirMesa(id){
  const m = App.data.mesas.find(x => x.id === id); if(!m) return;
  const oc = App.data.convidados.filter(c => c.mesa === id);
  const livres = App.data.convidados.filter(c => c.rsvp === "confirmado" && !c.mesa);
  modal({
    titulo:esc(m.nome),
    sub:`${oc.length} de ${m.lugares} lugares ocupados`,
    corpo:`
      <div class="mb-16">${barra(oc.length, m.lugares, oc.length >= m.lugares ? "ok" : "", "thick")}</div>
      <div class="eyebrow mb-8">Convidados nesta mesa</div>
      ${oc.length ? oc.map(c => `
        <div class="list-row">
          ${avatarHTML(c.nome,"sm",c.id)}
          <span class="grow"><span style="display:block;font-size:13px;font-weight:480">${esc(c.nome)}</span>
          <span class="t-xs t-muted">${esc(nomeGrupo(c.grupo))}${c.restricao?` · ${esc(c.restricao)}`:""}</span></span>
          <button class="mini-btn danger" data-remover="${c.id}" title="Remover da mesa">${ico("x")}</button>
        </div>`).join("")
      : `<p class="t-sm t-muted" style="padding:12px 0">Nenhum convidado nesta mesa ainda.</p>`}
      ${oc.length < m.lugares && livres.length ? `
        <div class="sep"></div>
        <div class="eyebrow mb-8">Adicionar convidado</div>
        <div class="center gap-8">
          <select class="select" id="sel-add-mesa">
            ${livres.slice(0,80).map(c => `<option value="${c.id}">${esc(c.nome)} — ${esc(nomeGrupo(c.grupo))}</option>`).join("")}
          </select>
          <button class="btn btn-primary" id="btn-add-mesa" style="flex:0 0 auto">${ico("plus")}Adicionar</button>
        </div>` : ""}`,
    rodape:`<button class="btn btn-danger" data-excluir-mesa>Excluir mesa</button>
            <div class="grow"></div>
            <button class="btn" data-fechar>Fechar</button>
            <button class="btn btn-primary" data-editar-mesa>Editar mesa</button>`,
    aoAbrir(w){
      const add = w.querySelector("#btn-add-mesa");
      if(add) add.onclick = () => { alocar(w.querySelector("#sel-add-mesa").value, id); fecharModal(); };
      w.addEventListener("click", e => {
        const r = e.target.closest("[data-remover]");
        if(r){
          const c = App.data.convidados.find(x => x.id === r.dataset.remover);
          c.mesa = null; salvar(); fecharModal(); render(); toast(`${c.nome} removido da mesa.`,"ok"); return;
        }
        if(e.target.closest("[data-editar-mesa]")){ fecharModal(); abrirFormMesa(id); return; }
        if(e.target.closest("[data-excluir-mesa]")){
          fecharModal();
          confirmar("Excluir mesa", `Os ${oc.length} convidados desta mesa voltarão para a lista “sem mesa”.`, () => {
            App.data.convidados.forEach(c => { if(c.mesa === id) c.mesa = null; });
            App.data.mesas = App.data.mesas.filter(x => x.id !== id);
            salvar(); render(); toast("Mesa excluída.","ok");
          }, "Excluir mesa");
        }
      });
    }
  });
}

function abrirFormMesa(id){
  const m = id ? App.data.mesas.find(x => x.id === id) : null;
  modal({
    titulo: m ? "Editar mesa" : "Nova mesa",
    sub: m ? "" : "Crie uma mesa e defina quantos lugares ela terá.",
    tamanho:"narrow",
    corpo:`<form id="form-mesa" class="grid" style="gap:16px">
      <div class="field"><label>Nome da mesa</label>
        <input class="input" name="nome" value="${m?esc(m.nome):"Mesa "+String(App.data.mesas.length+1).padStart(2,"0")}"></div>
      <div class="field"><label>Quantidade de lugares</label>
        <input class="input" name="lugares" type="number" min="2" max="20" value="${m?m.lugares:8}"></div>
      <label class="switch"><input type="checkbox" name="destaque" ${m&&m.destaque?"checked":""}>
        <span class="track"></span><span class="t-sm">Mesa dos noivos</span></label>
    </form>`,
    rodape:`<button class="btn" data-fechar>Cancelar</button>
            <button class="btn btn-primary" id="salvar-mesa">${m?"Salvar":"Criar mesa"}</button>`,
    aoAbrir(w){
      w.querySelector("#salvar-mesa").onclick = () => {
        const fd = new FormData(w.querySelector("#form-mesa"));
        const dados = { nome:String(fd.get("nome")||"Mesa").trim(), lugares:Number(fd.get("lugares"))||8, destaque:!!fd.get("destaque") };
        if(m) Object.assign(m, dados);
        else App.data.mesas.push({ id:uid("m"), ...dados });
        salvar(); fecharModal(); render(); toast(m?"Mesa atualizada.":"Mesa criada.","ok");
      };
    }
  });
}
