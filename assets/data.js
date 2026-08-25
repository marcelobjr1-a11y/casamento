/* ============================================================
   ATELIÊ — Dados de exemplo (gerados de forma determinística)
   ============================================================ */

/* PRNG determinístico: os dados são sempre os mesmos a cada carregamento */
function makeRng(seed){
  let s = seed >>> 0;
  return function(){
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function pick(rnd, arr){ return arr[Math.floor(rnd() * arr.length)]; }
function shuffle(rnd, arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function iso(y, m, d){ return new Date(y, m - 1, d).toISOString().slice(0, 10); }

const NOMES_F = ["Ana","Beatriz","Carolina","Daniela","Eduarda","Fernanda","Gabriela","Helena","Isabela","Juliana","Larissa","Mariana","Natália","Olívia","Patrícia","Rafaela","Sofia","Tatiana","Vanessa","Yasmin","Clara","Bruna","Amanda","Letícia","Camila","Renata","Priscila","Luciana","Marcela","Débora","Aline","Cristina","Elaine","Flávia","Giovana","Heloísa","Ingrid","Joana","Kelly","Lívia","Melissa","Nayara","Paula","Regina","Sandra","Talita","Verônica","Bianca","Cecília","Diana"];
const NOMES_M = ["João","Pedro","Lucas","Gabriel","Rafael","Matheus","Felipe","Bruno","Guilherme","Thiago","André","Rodrigo","Marcelo","Ricardo","Vinícius","Eduardo","Leonardo","Gustavo","Henrique","Caio","Daniel","Fábio","Igor","Júlio","Kleber","Luiz","Murilo","Otávio","Paulo","Renato","Sérgio","Tomás","Victor","Wagner","Alexandre","Bernardo","César","Diego","Emerson","Fernando","Antônio","Carlos","Davi","Enzo","Arthur","Miguel","Samuel","Nicolas","Rogério","Wesley"];
const SOBRENOMES = ["Almeida","Barbosa","Carvalho","Duarte","Esteves","Ferreira","Gonçalves","Henriques","Ibrahim","Jardim","Klein","Lima","Machado","Nogueira","Oliveira","Pacheco","Queiroz","Ramos","Siqueira","Teixeira","Uchôa","Vasconcelos","Xavier","Zanetti","Andrade","Bittencourt","Cavalcanti","Dias","Falcão","Guimarães","Moreira","Peixoto","Rezende","Sampaio","Tavares","Veloso","Azevedo","Braga","Coelho","Dantas","Freitas","Godoy","Leite","Martins","Neves","Pires","Rocha","Souza","Toledo","Vieira"];

const GRUPOS = [
  { id:"fam-noiva",   nome:"Família da noiva",  qtd:60 },
  { id:"fam-noivo",   nome:"Família do noivo",  qtd:52 },
  { id:"amigos-noiva",nome:"Amigos da noiva",   qtd:36 },
  { id:"amigos-noivo",nome:"Amigos do noivo",   qtd:32 },
  { id:"padrinhos",   nome:"Padrinhos",         qtd:20 },
  { id:"trabalho",    nome:"Trabalho",          qtd:20 },
  { id:"site",        nome:"Confirmados pelo site", qtd:0 }
];

const RESTRICOES = ["","","","","","","","","","Vegetariano","Vegano","Sem glúten","Sem lactose","Alergia a frutos do mar","Alergia a amendoim","Diabético"];

/* ---------- Convidados: 220 pessoas — 186 confirmados, 24 pendentes, 10 recusados ---------- */
function gerarConvidados(){
  const rnd = makeRng(20270424);
  const lista = [];
  let id = 1;

  GRUPOS.forEach(g => {
    for(let i = 0; i < g.qtd; i++){
      const fem = rnd() > .5;
      const primeiro = fem ? pick(rnd, NOMES_F) : pick(rnd, NOMES_M);
      const sobre = pick(rnd, SOBRENOMES) + (rnd() > .6 ? " " + pick(rnd, SOBRENOMES) : "");
      const crianca = (g.id === "fam-noiva" || g.id === "fam-noivo") && rnd() > .80;
      lista.push({
        id: "c" + (id++),
        nome: primeiro + " " + sobre,
        grupo: g.id,
        tipo: crianca ? "crianca" : "adulto",
        telefone: "(11) 9" + String(Math.floor(rnd() * 9000) + 1000) + "-" + String(Math.floor(rnd() * 9000) + 1000),
        email: (primeiro + "." + sobre.split(" ")[0]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@email.com",
        acompanhantes: 0,
        rsvp: "pendente",
        mesa: null,
        restricao: crianca ? "" : pick(rnd, RESTRICOES),
        obs: ""
      });
    }
  });

  /* distribui os status mantendo 186 / 24 / 10 */
  const ordem = shuffle(makeRng(777), lista.map(g => g.id));
  const mapa = {};
  ordem.forEach((gid, i) => { mapa[gid] = i < 186 ? "confirmado" : (i < 210 ? "pendente" : "recusado"); });
  lista.forEach(g => { g.rsvp = mapa[g.id]; });

  /* alguns confirmados trazem acompanhante ainda não nomeado */
  const comAcomp = shuffle(makeRng(31), lista.filter(g => g.rsvp === "confirmado").map(g => g.id)).slice(0, 8);
  lista.forEach(g => { if(comAcomp.includes(g.id)) g.acompanhantes = 1; });

  /* observações pontuais, para as telas não ficarem vazias */
  const obs = {
    c1:"Chega de outra cidade — reservar hospedagem.",
    c14:"Confirmou por telefone.",
    c61:"Vem com os dois filhos.",
    c113:"Precisa de acesso para cadeira de rodas.",
    c160:"Madrinha — combinar prova do vestido."
  };
  lista.forEach(g => { if(obs[g.id]) g.obs = obs[g.id]; });
  return lista;
}

/* ---------- Mesas ---------- */
function gerarMesas(convidados){
  const mesas = [
    { id:"m1", nome:"Mesa dos noivos", lugares:10, destaque:true }
  ];
  for(let i = 2; i <= 24; i++){
    mesas.push({ id:"m" + i, nome:"Mesa " + String(i).padStart(2, "0"), lugares: i % 3 === 0 ? 10 : 8, destaque:false });
  }
  /* aloca confirmados por grupo, deixando alguns sem mesa */
  const confirmados = convidados.filter(c => c.rsvp === "confirmado")
    .sort((a, b) => a.grupo.localeCompare(b.grupo));
  let mi = 0, usados = 0;
  confirmados.forEach((c, idx) => {
    if(idx >= confirmados.length - 16) return;           /* 16 ficam sem mesa */
    if(usados >= mesas[mi].lugares - (mi === 0 ? 2 : 1)){ mi++; usados = 0; }
    if(mi >= mesas.length) return;
    c.mesa = mesas[mi].id;
    usados++;
  });
  return mesas;
}

/* ---------- Fornecedores ---------- */
const CATEGORIAS = ["Espaço","Buffet","Cerimonial","Fotografia","Filmagem","Decoração","DJ","Banda","Vestido","Terno","Beleza","Convites","Flores","Bolo","Doces","Bebidas","Transporte","Segurança","Iluminação"];
const STATUS_FORN = ["Pesquisando","Orçamento recebido","Em negociação","Contratado","Concluído"];

const FORNECEDORES = [
  { id:"f1",  nome:"Fazenda Vista Alegre",   cat:"Espaço",     contato:"Regina Duarte",   tel:"(11) 3452-8890", email:"contato@vistaalegre.com.br",  status:"Contratado", valor:15000, pago:9800,  data:"2026-05-12", contrato:true,  nota:"Cerimônia ao ar livre + salão coberto para 240 pessoas. Chuva: plano B no salão." },
  { id:"f2",  nome:"Buffet La Maison",       cat:"Buffet",     contato:"Chef Aurélio",    tel:"(11) 99871-2233",email:"eventos@lamaison.com.br",     status:"Contratado", valor:12000, pago:6000,  data:"2026-06-02", contrato:true,  nota:"Menu degustação agendada. Inclui equipe de serviço e louças." },
  { id:"f3",  nome:"Estúdio Luz",            cat:"Fotografia", contato:"Marina Ferraz",   tel:"(11) 98812-4477",email:"marina@estudioluz.com.br",    status:"Contratado", valor:4500,  pago:2250,  data:"2026-06-18", contrato:true,  nota:"Cobertura de 10h, making of do casal e álbum 30x30." },
  { id:"f4",  nome:"Reels Filmes",           cat:"Filmagem",   contato:"Diego Prado",     tel:"(11) 99120-3388",email:"diego@reelsfilmes.com",       status:"Contratado", valor:2800,  pago:1400,  data:"2026-06-18", contrato:true,  nota:"Filme de 8 minutos + teaser para redes em até 15 dias." },
  { id:"f5",  nome:"Flores & Cia",           cat:"Decoração",  contato:"Sônia Camargo",   tel:"(11) 3388-1120", email:"sonia@floresecia.com.br",     status:"Contratado", valor:3200,  pago:1600,  data:"2026-07-04", contrato:true,  nota:"Arranjos de mesa, altar e caminho da cerimônia. Paleta champagne e verde." },
  { id:"f6",  nome:"DJ Marcos Vinícius",     cat:"DJ",         contato:"Marcos Vinícius", tel:"(11) 99456-1122",email:"contato@djmarcos.com.br",     status:"Contratado", valor:1900,  pago:950,   data:"2026-07-10", contrato:true,  nota:"Som da cerimônia + pista até 4h. Playlist a definir com os noivos." },
  { id:"f7",  nome:"Ateliê Cerimônia",       cat:"Cerimonial", contato:"Camila Andrade",  tel:"(11) 99333-7788",email:"camila@ateliecerimonia.com",  status:"Contratado", valor:3200,  pago:1600,  data:"2026-05-28", contrato:true,  nota:"Assessoria completa: 4 reuniões + dia do evento com 3 assistentes." },
  { id:"f8",  nome:"Ateliê Lumière",         cat:"Vestido",    contato:"Vera Lumière",    tel:"(11) 3277-9911", email:"atendimento@lumiere.com.br",  status:"Contratado", valor:1800,  pago:900,   data:"2026-07-21", contrato:true,  nota:"Aluguel com 3 provas incluídas. Última prova 30 dias antes." },
  { id:"f9",  nome:"Alfaiataria Bertoni",    cat:"Terno",      contato:"Sr. Bertoni",     tel:"(11) 3011-5566", email:"bertoni@alfaiataria.com.br",  status:"Contratado", valor:900,   pago:900,   data:"2026-07-21", contrato:true,  nota:"Terno sob medida em linho misto. Pago integralmente." },
  { id:"f10", nome:"Studio Fio Dourado",     cat:"Beleza",     contato:"Elaine Prado",    tel:"(11) 99677-2244",email:"contato@fiodourado.com.br",   status:"Contratado", valor:800,   pago:400,   data:"2026-08-01", contrato:true,  nota:"Cabelo e maquiagem da noiva + 2 madrinhas. Teste agendado." },
  { id:"f11", nome:"Papel & Tinta",          cat:"Convites",   contato:"Rodrigo Neves",   tel:"(11) 3455-2211", email:"pedidos@papeletinta.com.br",  status:"Concluído",  valor:600,   pago:600,   data:"2026-06-30", contrato:true,  nota:"220 convites impressos em papel algodão. Entregues." },
  { id:"f12", nome:"Confeitaria Dolce",      cat:"Bolo",       contato:"Luana Dolce",     tel:"(11) 99711-8899",email:"luana@dolce.com.br",          status:"Contratado", valor:700,   pago:350,   data:"2026-08-05", contrato:true,  nota:"Bolo de 4 andares, massa amêndoas com recheio de frutas vermelhas." },
  { id:"f13", nome:"Doces da Vovó Lena",     cat:"Doces",      contato:"Lena Ribeiro",    tel:"(11) 99544-3322",email:"vovolena@email.com",          status:"Contratado", valor:500,   pago:250,   data:"2026-08-05", contrato:true,  nota:"1.800 docinhos finos, 6 sabores. Degustação aprovada." },
  { id:"f14", nome:"Luz & Cena",             cat:"Iluminação", contato:"Fábio Manzoli",   tel:"(11) 99422-1177",email:"fabio@luzecena.com.br",       status:"Contratado", valor:600,   pago:300,   data:"2026-08-12", contrato:true,  nota:"Iluminação cênica do salão + varal de lâmpadas na área externa." },
  { id:"f15", nome:"Banda Serenata",         cat:"Banda",      contato:"Tiago Serenata",  tel:"(11) 99188-4455",email:"contato@bandaserenata.com",   status:"Em negociação",      valor:0, pago:0, data:"", contrato:false, nota:"Proposta de R$ 2.400 para 2h na recepção. Negociando 2 horas por R$ 2.000." },
  { id:"f16", nome:"Vinhos do Vale",         cat:"Bebidas",    contato:"Paulo Sanches",   tel:"(11) 3699-4411", email:"vendas@vinhosdovale.com.br",  status:"Orçamento recebido", valor:0, pago:0, data:"", contrato:false, nota:"Orçamento de R$ 3.100 (open bar 6h). Comparar com a opção do buffet." },
  { id:"f17", nome:"Van Prime Transfer",     cat:"Transporte", contato:"Ivan Prime",      tel:"(11) 99855-2200",email:"reservas@vanprime.com.br",    status:"Orçamento recebido", valor:0, pago:0, data:"", contrato:false, nota:"2 vans para convidados de fora — R$ 1.400 ida e volta." },
  { id:"f18", nome:"Guarda Alfa",            cat:"Segurança",  contato:"Cel. Nunes",      tel:"(11) 3477-8080", email:"comercial@guardaalfa.com.br", status:"Pesquisando",        valor:0, pago:0, data:"", contrato:false, nota:"Espaço exige 2 seguranças. Buscar 3 orçamentos." },
  { id:"f19", nome:"Flor de Liz",            cat:"Flores",     contato:"Marta Liz",       tel:"(11) 99233-6677",email:"marta@flordeliz.com.br",      status:"Em negociação",      valor:0, pago:0, data:"", contrato:false, nota:"Buquê da noiva + lapelas. R$ 780 — pedindo desconto no pacote." },
  { id:"f20", nome:"Cine Foto Studio",       cat:"Fotografia", contato:"Ana Beatriz",     tel:"(11) 99777-1234",email:"ab@cinefoto.com.br",          status:"Pesquisando",        valor:0, pago:0, data:"", contrato:false, nota:"Opção de reserva caso o Estúdio Luz tenha imprevisto." },
  { id:"f21", nome:"Espaço Villa Verde",     cat:"Espaço",     contato:"Recepção",        tel:"(11) 3222-1000", email:"eventos@villaverde.com.br",   status:"Pesquisando",        valor:0, pago:0, data:"", contrato:false, nota:"Visitado em março. Não escolhido — mantido como referência." },
  { id:"f22", nome:"Sabor & Arte Buffet",    cat:"Buffet",     contato:"Marcos Arte",     tel:"(11) 3555-7777", email:"contato@saborearte.com.br",   status:"Orçamento recebido", valor:0, pago:0, data:"", contrato:false, nota:"Orçamento de R$ 13.800. Preterido pelo La Maison." }
];

/* ---------- Orçamento por categoria ---------- */
const ORCAMENTO_CATS = [
  { cat:"Espaço",     orcado:15000 },
  { cat:"Buffet",     orcado:14000 },
  { cat:"Decoração",  orcado:4500  },
  { cat:"Fotografia", orcado:5000  },
  { cat:"Filmagem",   orcado:3000  },
  { cat:"Cerimonial", orcado:3500  },
  { cat:"DJ",         orcado:2000  },
  { cat:"Banda",      orcado:2200  },
  { cat:"Vestido",    orcado:2200  },
  { cat:"Terno",      orcado:1000  },
  { cat:"Beleza",     orcado:1000  },
  { cat:"Convites",   orcado:700   },
  { cat:"Flores",     orcado:900   },
  { cat:"Bolo",       orcado:800   },
  { cat:"Doces",      orcado:600   },
  { cat:"Bebidas",    orcado:2000  },
  { cat:"Transporte", orcado:800   },
  { cat:"Iluminação", orcado:600   },
  { cat:"Outros",     orcado:200   }
];

/* ---------- Pagamentos (a soma bate com os valores dos fornecedores) ---------- */
function gerarPagamentos(){
  const p = [];
  let id = 1;
  const add = (fid, desc, valor, venc, status) => p.push({ id:"p" + (id++), fornecedor:fid, desc, valor, venc, status });

  /* já pagos */
  add("f1","Sinal da reserva",            6000, "2026-05-12","pago");
  add("f1","2ª parcela",                  3800, "2026-07-12","pago");
  add("f2","Sinal do buffet",             6000, "2026-06-02","pago");
  add("f3","Sinal da fotografia",         2250, "2026-06-18","pago");
  add("f4","Sinal da filmagem",           1400, "2026-06-18","pago");
  add("f5","Sinal da decoração",          1600, "2026-07-04","pago");
  add("f6","Sinal do DJ",                  950, "2026-07-10","pago");
  add("f7","Sinal do cerimonial",         1600, "2026-05-28","pago");
  add("f8","Sinal do vestido",             900, "2026-07-21","pago");
  add("f9","Terno — pagamento integral",   900, "2026-07-21","pago");
  add("f10","Sinal da beleza",             400, "2026-08-01","pago");
  add("f11","Convites — integral",         600, "2026-06-30","pago");
  add("f12","Sinal do bolo",               350, "2026-08-05","pago");
  add("f13","Sinal dos doces",             250, "2026-08-05","pago");
  add("f14","Sinal da iluminação",         300, "2026-08-12","pago");

  /* em aberto — vencimentos a partir de hoje */
  add("f13","Parcela final dos doces",     250, "2026-08-26","pendente");
  add("f12","Parcela final do bolo",       350, "2026-08-28","pendente");
  add("f10","Parcela final da beleza",     400, "2026-08-30","pendente");
  add("f2","2ª parcela do buffet",        3000, "2026-09-05","pendente");
  add("f3","2ª parcela da fotografia",    1125, "2026-09-15","pendente");
  add("f5","2ª parcela da decoração",      800, "2026-09-20","pendente");
  add("f14","Parcela final da iluminação", 300, "2026-10-02","pendente");
  add("f4","2ª parcela da filmagem",       700, "2026-10-10","pendente");
  add("f6","2ª parcela do DJ",             475, "2026-10-20","pendente");
  add("f7","2ª parcela do cerimonial",     800, "2026-11-05","pendente");
  add("f8","2ª parcela do vestido",        450, "2026-11-20","pendente");
  add("f1","Parcela final do espaço",     5200, "2027-01-15","pendente");
  add("f2","Parcela final do buffet",     3000, "2027-02-20","pendente");
  add("f5","Parcela final da decoração",   800, "2027-03-10","pendente");
  add("f3","Parcela final da fotografia", 1125, "2027-03-24","pendente");
  add("f4","Parcela final da filmagem",    700, "2027-04-05","pendente");
  add("f6","Parcela final do DJ",          475, "2027-04-10","pendente");
  add("f7","Parcela final do cerimonial",  800, "2027-04-14","pendente");
  add("f8","Parcela final do vestido",     450, "2027-04-16","pendente");
  return p;
}

/* ---------- Equipe ---------- */
const EQUIPE = [
  { id:"e1", nome:"Ana Marques",     papel:"Noiva",           perm:"Administrador", tel:"(11) 99812-4455", email:"ana@email.com",     cor:"v1" },
  { id:"e2", nome:"João Ribeiro",    papel:"Noivo",           perm:"Administrador", tel:"(11) 99733-2211", email:"joao@email.com",    cor:"v4" },
  { id:"e3", nome:"Camila Andrade",  papel:"Cerimonialista",  perm:"Cerimonial",    tel:"(11) 99333-7788", email:"camila@ateliecerimonia.com", cor:"v2" },
  { id:"e4", nome:"Lúcia Marques",   papel:"Mãe da noiva",    perm:"Família",       tel:"(11) 99655-1010", email:"lucia@email.com",   cor:"v3" },
  { id:"e5", nome:"Dona Sueli",      papel:"Mãe do noivo",    perm:"Família",       tel:"(11) 99544-2020", email:"sueli@email.com",   cor:"v5" },
  { id:"e6", nome:"Marina Ferraz",   papel:"Fotógrafa",       perm:"Fornecedor",    tel:"(11) 98812-4477", email:"marina@estudioluz.com.br", cor:"v2" }
];

/* ---------- Tarefas — 72 no total, 32 pendentes ---------- */
function gerarTarefas(){
  const base = [
    ["Definir a lista final de convidados","convidados","alta","e1","2026-06-10","concluido"],
    ["Reservar o espaço da cerimônia","espaco","alta","e1","2026-05-12","concluido"],
    ["Fechar contrato com o buffet","fornecedores","alta","e2","2026-06-02","concluido"],
    ["Contratar cerimonialista","fornecedores","alta","e1","2026-05-28","concluido"],
    ["Contratar fotografia e filmagem","fornecedores","alta","e2","2026-06-18","concluido"],
    ["Escolher o vestido da noiva","vestuario","alta","e1","2026-07-21","concluido"],
    ["Escolher o terno do noivo","vestuario","media","e2","2026-07-21","concluido"],
    ["Imprimir e receber os convites","convites","alta","e1","2026-06-30","concluido"],
    ["Definir a paleta de cores","decoracao","media","e1","2026-05-20","concluido"],
    ["Abrir a conta conjunta do casamento","financeiro","media","e2","2026-05-05","concluido"],
    ["Definir o orçamento total","financeiro","alta","e2","2026-04-28","concluido"],
    ["Escolher os padrinhos e madrinhas","convidados","alta","e1","2026-05-15","concluido"],
    ["Contratar o DJ","fornecedores","media","e2","2026-07-10","concluido"],
    ["Fechar a decoração floral","decoracao","alta","e1","2026-07-04","concluido"],
    ["Agendar degustação do buffet","fornecedores","media","e1","2026-08-02","concluido"],
    ["Definir o cardápio principal","buffet","alta","e1","2026-08-10","concluido"],
    ["Contratar bolo e doces","fornecedores","media","e1","2026-08-05","concluido"],
    ["Contratar iluminação","fornecedores","baixa","e2","2026-08-12","concluido"],
    ["Reservar o salão de beleza","beleza","media","e1","2026-08-01","concluido"],
    ["Criar o site do casamento","convites","baixa","e2","2026-07-15","concluido"],
    ["Definir a data e horário da cerimônia","cerimonia","alta","e1","2026-04-25","concluido"],
    ["Levantar a documentação do civil","documentos","alta","e2","2026-06-25","concluido"],
    ["Escolher as alianças","vestuario","alta","e2","2026-08-15","concluido"],
    ["Montar a planilha de convidados","convidados","media","e1","2026-05-30","concluido"],
    ["Definir o estilo da decoração","decoracao","media","e1","2026-05-22","concluido"],
    ["Visitar 3 espaços candidatos","espaco","alta","e1","2026-04-30","concluido"],
    ["Pesquisar buffets e pedir orçamentos","fornecedores","media","e2","2026-05-18","concluido"],
    ["Contratar assessoria de dia","fornecedores","media","e1","2026-05-28","concluido"],
    ["Definir o número de mesas","mesas","media","e3","2026-08-08","concluido"],
    ["Escolher as lembrancinhas","decoracao","baixa","e4","2026-08-14","concluido"],
    ["Pagar o sinal do espaço","financeiro","alta","e2","2026-05-12","concluido"],
    ["Pagar o sinal do buffet","financeiro","alta","e2","2026-06-02","concluido"],
    ["Definir o padrinho de aliança","cerimonia","baixa","e2","2026-07-28","concluido"],
    ["Contratar o transporte da noiva","fornecedores","baixa","e4","2026-08-18","concluido"],
    ["Escolher a música da entrada","cerimonia","media","e1","2026-08-20","concluido"],
    ["Reservar hospedagem para convidados de fora","convidados","media","e4","2026-08-16","concluido"],
    ["Fazer o teste de maquiagem","beleza","media","e1","2026-08-19","concluido"],
    ["Aprovar a arte do convite digital","convites","media","e2","2026-08-12","concluido"],
    ["Definir a ordem da cerimônia","cerimonia","media","e3","2026-08-21","concluido"],
    ["Contratar o serviço de som da cerimônia","fornecedores","media","e2","2026-08-22","concluido"],

    ["Enviar os convites","convites","alta","e1","2026-08-26","fazendo"],
    ["Fechar a lista de músicas com o DJ","cerimonia","media","e2","2026-09-02","fazendo"],
    ["Definir a decoração das mesas","decoracao","alta","e1","2026-08-28","fazendo"],
    ["Cobrar os convidados pendentes de RSVP","convidados","alta","e3","2026-09-10","fazendo"],
    ["Montar o mapa de mesas","mesas","alta","e3","2026-09-25","fazendo"],
    ["Negociar o open bar","fornecedores","media","e2","2026-09-05","fazendo"],
    ["Contratar a banda da recepção","fornecedores","media","e2","2026-09-12","fazendo"],
    ["Escolher o buquê da noiva","decoracao","media","e1","2026-09-18","fazendo"],

    ["Agendar a 2ª prova do vestido","vestuario","media","e1","2026-09-28","afazer"],
    ["Contratar a segurança do evento","fornecedores","media","e2","2026-10-02","afazer"],
    ["Fechar o transporte dos convidados","fornecedores","baixa","e4","2026-10-08","afazer"],
    ["Definir o cardápio das crianças","buffet","baixa","e1","2026-10-15","afazer"],
    ["Comprar as alianças definitivas","vestuario","alta","e2","2026-10-20","afazer"],
    ["Dar entrada no casamento civil","documentos","alta","e2","2026-11-10","afazer"],
    ["Escolher o padrinho para o discurso","cerimonia","baixa","e2","2026-11-18","afazer"],
    ["Fechar as lembrancinhas","decoracao","baixa","e4","2026-11-25","afazer"],
    ["Montar o roteiro do fotógrafo","cerimonia","media","e1","2026-12-05","afazer"],
    ["Reservar a lua de mel","viagem","alta","e1","2026-12-12","afazer"],
    ["Contratar o seguro do evento","financeiro","baixa","e2","2027-01-10","afazer"],
    ["Enviar o save the date por WhatsApp","convites","baixa","e1","2027-01-20","afazer"],
    ["Fazer a prova final do vestido","vestuario","alta","e1","2027-02-24","afazer"],
    ["Confirmar todos os fornecedores por escrito","fornecedores","alta","e3","2027-03-10","afazer"],
    ["Montar o kit emergência da noiva","cerimonia","baixa","e4","2027-03-20","afazer"],
    ["Definir a ordem das mesas do jantar","mesas","media","e3","2027-03-25","afazer"],
    ["Ensaiar a primeira dança","cerimonia","media","e1","2027-03-30","afazer"],
    ["Fazer o ensaio pré-wedding","cerimonia","media","e1","2027-04-03","afazer"],
    ["Pagar as parcelas finais","financeiro","alta","e2","2027-04-10","afazer"],
    ["Entregar o mapa de mesas ao buffet","mesas","alta","e3","2027-04-14","afazer"],
    ["Separar documentos do dia da cerimônia","documentos","alta","e2","2027-04-20","afazer"],
    ["Confirmar horário de chegada dos fornecedores","fornecedores","alta","e3","2027-04-22","afazer"],
    ["Preparar as gorjetas em envelopes","financeiro","media","e2","2027-04-23","afazer"],
    ["Montar o kit de emergência dos padrinhos","cerimonia","baixa","e4","2027-04-21","afazer"]
  ];
  return base.map((t, i) => ({
    id:"t" + (i + 1), titulo:t[0], categoria:t[1], prioridade:t[2],
    responsavel:t[3], prazo:t[4], status:t[5],
    desc: i % 7 === 0 ? "Combinar detalhes com a Camila (cerimonial) antes de fechar." : ""
  }));
}

/* ---------- Cronograma do dia ---------- */
const CRONOGRAMA = [
  { id:"h1",  hora:"07:30", titulo:"Café da manhã do casal",         local:"Suíte da noiva",        resp:"e4", obs:"Café reforçado — o dia é longo." },
  { id:"h2",  hora:"08:00", titulo:"Maquiagem da noiva",             local:"Suíte da noiva",        resp:"e1", obs:"Studio Fio Dourado chega às 07:45." },
  { id:"h3",  hora:"10:00", titulo:"Cabelo da noiva e madrinhas",    local:"Suíte da noiva",        resp:"e1", obs:"Duas profissionais no local." },
  { id:"h4",  hora:"12:00", titulo:"Making of da noiva",             local:"Suíte da noiva",        resp:"e6", obs:"Luz natural — cortinas abertas." },
  { id:"h5",  hora:"13:00", titulo:"Making of do noivo",             local:"Casa da família",       resp:"e2", obs:"Fotógrafo assistente cobre este bloco." },
  { id:"h6",  hora:"14:30", titulo:"Fotos do casal",                 local:"Jardim da fazenda",     resp:"e6", obs:"Sem ver a noiva antes — first look no jardim." },
  { id:"h7",  hora:"15:00", titulo:"Chegada da equipe de decoração", local:"Salão principal",       resp:"e3", obs:"Montagem completa até 16:30." },
  { id:"h8",  hora:"16:30", titulo:"Passagem de som",                local:"Cerimônia",             resp:"e3", obs:"DJ e músicos da cerimônia." },
  { id:"h9",  hora:"17:00", titulo:"Chegada dos convidados",         local:"Recepção",              resp:"e3", obs:"Welcome drink e livro de assinaturas." },
  { id:"h10", hora:"18:00", titulo:"Cerimônia",                      local:"Jardim das oliveiras",  resp:"e3", obs:"Entrada da noiva às 18:15." },
  { id:"h11", hora:"19:00", titulo:"Sessão de fotos com famílias",   local:"Altar",                 resp:"e6", obs:"Lista de agrupamentos impressa." },
  { id:"h12", hora:"19:30", titulo:"Recepção e coquetel",            local:"Varanda",               resp:"e3", obs:"Bar aberto." },
  { id:"h13", hora:"20:30", titulo:"Jantar servido",                 local:"Salão principal",       resp:"e3", obs:"Serviço à francesa, 24 mesas." },
  { id:"h14", hora:"21:30", titulo:"Primeira dança",                 local:"Pista",                 resp:"e1", obs:"Música definida com o DJ." },
  { id:"h15", hora:"22:00", titulo:"Corte do bolo",                  local:"Salão principal",       resp:"e1", obs:"Fotógrafo posicionado." },
  { id:"h16", hora:"22:30", titulo:"Festa",                          local:"Pista",                 resp:"e2", obs:"Mesa de doces liberada." },
  { id:"h17", hora:"00:30", titulo:"Saída dos noivos",               local:"Portaria",              resp:"e3", obs:"Chuva de pétalas — combinar com padrinhos." },
  { id:"h18", hora:"01:00", titulo:"Encerramento",                   local:"Fazenda",               resp:"e3", obs:"Desmontagem no dia seguinte, às 09:00." }
];

/* ---------- Documentos ---------- */
const DOCUMENTOS = [
  { id:"d1",  nome:"Contrato — Fazenda Vista Alegre.pdf", cat:"Contratos",   tipo:"pdf", tam:"1,8 MB", data:"2026-05-12", forn:"f1",  assinado:true  },
  { id:"d2",  nome:"Contrato — Buffet La Maison.pdf",     cat:"Contratos",   tipo:"pdf", tam:"920 KB", data:"2026-06-02", forn:"f2",  assinado:true  },
  { id:"d3",  nome:"Contrato — Estúdio Luz.pdf",          cat:"Contratos",   tipo:"pdf", tam:"640 KB", data:"2026-06-18", forn:"f3",  assinado:true  },
  { id:"d4",  nome:"Contrato — Reels Filmes.pdf",         cat:"Contratos",   tipo:"pdf", tam:"580 KB", data:"2026-06-18", forn:"f4",  assinado:false },
  { id:"d5",  nome:"Contrato — Flores & Cia.pdf",         cat:"Contratos",   tipo:"pdf", tam:"430 KB", data:"2026-07-04", forn:"f5",  assinado:false },
  { id:"d6",  nome:"Comprovante — sinal do espaço.pdf",   cat:"Comprovantes",tipo:"pdf", tam:"180 KB", data:"2026-05-12", forn:"f1",  assinado:true  },
  { id:"d7",  nome:"Comprovante — sinal do buffet.pdf",   cat:"Comprovantes",tipo:"pdf", tam:"175 KB", data:"2026-06-02", forn:"f2",  assinado:true  },
  { id:"d8",  nome:"Comprovante — convites.jpg",          cat:"Comprovantes",tipo:"img", tam:"2,1 MB", data:"2026-06-30", forn:"f11", assinado:true  },
  { id:"d9",  nome:"Orçamento — Vinhos do Vale.pdf",      cat:"Orçamentos",  tipo:"pdf", tam:"310 KB", data:"2026-08-04", forn:"f16", assinado:false },
  { id:"d10", nome:"Orçamento — Van Prime.pdf",           cat:"Orçamentos",  tipo:"pdf", tam:"290 KB", data:"2026-08-09", forn:"f17", assinado:false },
  { id:"d11", nome:"Orçamento — Banda Serenata.pdf",      cat:"Orçamentos",  tipo:"pdf", tam:"265 KB", data:"2026-08-11", forn:"f15", assinado:false },
  { id:"d12", nome:"Certidões de nascimento.pdf",         cat:"Documentos",  tipo:"pdf", tam:"1,2 MB", data:"2026-06-25", forn:"",    assinado:true  },
  { id:"d13", nome:"Lista de convidados final.xlsx",      cat:"Documentos",  tipo:"xls", tam:"88 KB",  data:"2026-06-10", forn:"",    assinado:true  },
  { id:"d14", nome:"Cardápio aprovado.pdf",               cat:"Documentos",  tipo:"pdf", tam:"540 KB", data:"2026-08-10", forn:"f2",  assinado:true  },
  { id:"d15", nome:"Planta do salão.jpg",                 cat:"Outros",      tipo:"img", tam:"3,4 MB", data:"2026-07-30", forn:"f1",  assinado:true  },
  { id:"d16", nome:"Roteiro do cerimonial.docx",          cat:"Outros",      tipo:"doc", tam:"120 KB", data:"2026-08-21", forn:"f7",  assinado:true  }
];

/* ---------- Inspirações (paletas geradas em CSS — funcionam offline) ---------- */
const INSPIRACOES = [
  { id:"i1",  cat:"Decoração", titulo:"Mesa posta em tons champagne", nota:"Toalha de linho cru, velas altas e folhagem baixa. Sem arranjos que tampem a vista.", g:1, h:230 },
  { id:"i2",  cat:"Decoração", titulo:"Varal de lâmpadas na varanda", nota:"Luz quente, 3000K. Combinar com a Luz & Cena.", g:2, h:180 },
  { id:"i3",  cat:"Flores",    titulo:"Arranjo baixo com eucalipto",  nota:"Verde acinzentado + rosas brancas. Nada de cores fortes.", g:3, h:260 },
  { id:"i4",  cat:"Buquê",     titulo:"Buquê cascata discreto",       nota:"Preferência da Ana. Fita de seda cor manteiga.", g:4, h:210 },
  { id:"i5",  cat:"Vestido",   titulo:"Decote V com renda francesa",  nota:"Referência principal para a Vera do Ateliê Lumière.", g:5, h:290 },
  { id:"i6",  cat:"Vestido",   titulo:"Cauda média com botões",       nota:"Botões forrados nas costas — pedir orçamento do ajuste.", g:6, h:240 },
  { id:"i7",  cat:"Terno",     titulo:"Linho areia com gravata seda", nota:"Combina com a paleta. Sem colete.", g:7, h:200 },
  { id:"i8",  cat:"Mesa",      titulo:"Sousplat dourado escovado",    nota:"Confirmar se o buffet tem esse modelo no acervo.", g:8, h:220 },
  { id:"i9",  cat:"Mesa",      titulo:"Menu individual em papel algodão", nota:"Mesma gráfica dos convites (Papel & Tinta).", g:1, h:250 },
  { id:"i10", cat:"Convites",  titulo:"Envelope com lacre de cera",   nota:"Já aprovado e impresso.", g:2, h:190 },
  { id:"i11", cat:"Fotografia",titulo:"Luz dourada de fim de tarde",  nota:"Fotos do casal às 14:30 — pedir para a Marina repetir às 17:30.", g:3, h:270 },
  { id:"i12", cat:"Fotografia",titulo:"Retrato preto e branco",       nota:"Pelo menos 10 fotos do álbum em P&B.", g:4, h:210 },
  { id:"i13", cat:"Bolo",      titulo:"Bolo liso de 4 andares",       nota:"Sem pasta americana. Acabamento naked levemente coberto.", g:5, h:280 },
  { id:"i14", cat:"Bolo",      titulo:"Topo com folhagem fresca",     nota:"Combinar com a Flores & Cia no dia.", g:6, h:200 },
  { id:"i15", cat:"Decoração", titulo:"Caminho do altar com pétalas", nota:"Pétalas brancas e bege, sem tapete.", g:7, h:230 },
  { id:"i16", cat:"Flores",    titulo:"Arco de cerimônia assimétrico",nota:"Referência enviada para a Sônia.", g:8, h:260 },
  { id:"i17", cat:"Mesa",      titulo:"Numeração das mesas em vidro", nota:"Alternativa mais barata: papel algodão em cavalete.", g:2, h:185 },
  { id:"i18", cat:"Decoração", titulo:"Lounge externo com almofadas", nota:"Área para os convidados mais velhos descansarem.", g:4, h:225 }
];

/* ---------- Plano do casamento (marcos que geram o % de progresso) ---------- */
const MARCOS = [
  { id:"k1",  fase:"Fundação",   titulo:"Data definida",                  ok:true },
  { id:"k2",  fase:"Fundação",   titulo:"Orçamento total definido",       ok:true },
  { id:"k3",  fase:"Fundação",   titulo:"Lista de convidados fechada",    ok:true },
  { id:"k4",  fase:"Fundação",   titulo:"Espaço reservado",               ok:true },
  { id:"k5",  fase:"Fundação",   titulo:"Cerimonial contratado",          ok:true },
  { id:"k6",  fase:"Fornecedores", titulo:"Buffet contratado",            ok:true },
  { id:"k7",  fase:"Fornecedores", titulo:"Fotografia contratada",        ok:true },
  { id:"k8",  fase:"Fornecedores", titulo:"Filmagem contratada",          ok:true },
  { id:"k9",  fase:"Fornecedores", titulo:"Decoração contratada",         ok:true },
  { id:"k10", fase:"Fornecedores", titulo:"Música contratada",            ok:true },
  { id:"k11", fase:"Fornecedores", titulo:"Bolo e doces contratados",     ok:true },
  { id:"k12", fase:"Fornecedores", titulo:"Bebidas fechadas",             ok:false },
  { id:"k13", fase:"Fornecedores", titulo:"Transporte fechado",           ok:false },
  { id:"k14", fase:"Noivos",     titulo:"Vestido escolhido",              ok:true },
  { id:"k15", fase:"Noivos",     titulo:"Terno escolhido",                ok:true },
  { id:"k16", fase:"Noivos",     titulo:"Beleza reservada",               ok:true },
  { id:"k17", fase:"Noivos",     titulo:"Alianças compradas",             ok:false },
  { id:"k18", fase:"Noivos",     titulo:"Lua de mel reservada",           ok:false },
  { id:"k19", fase:"Convidados", titulo:"Convites impressos",             ok:true },
  { id:"k20", fase:"Convidados", titulo:"Convites enviados",              ok:false },
  { id:"k21", fase:"Convidados", titulo:"RSVP acima de 80%",              ok:true },
  { id:"k22", fase:"Convidados", titulo:"Mapa de mesas concluído",        ok:false },
  { id:"k23", fase:"Reta final", titulo:"Documentação do civil",          ok:true },
  { id:"k24", fase:"Reta final", titulo:"Cronograma do dia aprovado",     ok:false },
  { id:"k25", fase:"Reta final", titulo:"Pagamentos em dia",              ok:true }
];

/* ---------- Notificações ---------- */
const NOTIFICACOES = [
  { id:"n1", tipo:"warn",  titulo:"3 pagamentos vencem em 7 dias",       desc:"Doces, bolo e beleza — R$ 1.000 no total.", quando:"há 2 horas",  rota:"financeiro", lida:false },
  { id:"n2", tipo:"info",  titulo:"24 convidados ainda não responderam", desc:"Envie um lembrete pela tela de RSVP.",       quando:"há 5 horas",  rota:"rsvp",       lida:false },
  { id:"n3", tipo:"danger",titulo:"2 contratos aguardam assinatura",     desc:"Reels Filmes e Flores & Cia.",               quando:"ontem",       rota:"documentos", lida:false },
  { id:"n4", tipo:"ok",    titulo:"Degustação do buffet aprovada",       desc:"Cardápio confirmado com o Chef Aurélio.",    quando:"há 3 dias",   rota:"fornecedores", lida:true },
  { id:"n5", tipo:"info",  titulo:"16 confirmados ainda sem mesa",       desc:"Finalize o mapa de mesas.",                  quando:"há 4 dias",   rota:"mesas",      lida:true }
];

/* ---------- Estado inicial ---------- */
function dadosIniciais(){
  const convidados = gerarConvidados();
  const mesas = gerarMesas(convidados);
  return {
    versao: 1,
    casal: {
      noiva:"Ana", noivo:"João",
      nomeNoiva:"Ana Marques", nomeNoivo:"João Ribeiro",
      data:"2027-04-24", hora:"18:00",
      local:"Fazenda Vista Alegre", cidade:"Itu, SP",
      orcamento:60000, convidadosPrevistos:220,
      modoGrandeDia:false, fotoCasal:"assets/casal-sidebar.jpg",
      supabaseUrl:"", supabaseKey:"", supabaseSenha:"", ultimaImportacao:""
    },
    convidados, mesas,
    fornecedores: FORNECEDORES.map(f => ({ ...f })),
    orcamentoCats: ORCAMENTO_CATS.map(c => ({ ...c })),
    pagamentos: gerarPagamentos(),
    tarefas: gerarTarefas(),
    cronograma: CRONOGRAMA.map(c => ({ ...c })),
    documentos: DOCUMENTOS.map(d => ({ ...d })),
    inspiracoes: INSPIRACOES.map(i => ({ ...i })),
    marcos: MARCOS.map(m => ({ ...m })),
    equipe: EQUIPE.map(e => ({ ...e })),
    notificacoes: NOTIFICACOES.map(n => ({ ...n }))
  };
}
