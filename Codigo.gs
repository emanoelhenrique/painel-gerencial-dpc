function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  ui.createMenu('📊 PAINEL DPC')
      .addItem('Abrir Monitor', 'abrirMonitorPopUp')
      .addToUi();

  ui.createMenu('📱 Receber no APP')
    .addItem('Confirmar Recebimento', 'confirmarRecebimento')
    .addToUi();
}

function abrirMonitorPopUp() {
  var html = HtmlService.createTemplateFromFile('Index').evaluate()
      .setWidth(1500)
      .setHeight(900);
  SpreadsheetApp.getUi().showModalDialog(html, 'Monitor DPC | Grupo Boticário');
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Monitor DPC | Grupo Boticário')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getFormAtual() {
  try {
    const pastaId = '1jwDhGPE3umAz1jfIKxcdd2HfEk0NsrFB';
    const pasta = DriveApp.getFolderById(pastaId);
    const arquivos = pasta.getFiles();
    let maiorNumero = 0;
    while (arquivos.hasNext()) {
      let arquivo = arquivos.next();
      let nome = arquivo.getName();
      let match = nome.match(/^\d+/);
      if (match) {
        let num = parseInt(match[0], 10);
        if (num > maiorNumero) maiorNumero = num;
      }
    }
    return maiorNumero > 0 ? maiorNumero.toString() : "---";
  } catch (e) { return "Erro"; }
}

function getDadosMonitor(dataFiltro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dadosP = ss.getSheetByName('Controle de paletes').getDataRange().getValues();
  const dadosT = ss.getSheetByName('Triagem em peças').getDataRange().getValues();
 
  let valorRec = 0;
  let limiteRec = 1; 
  try {
    const abaRec = ss.getSheetByName('Acumulado Recebimento');
    valorRec = abaRec.getRange("V2").getValue() || 0;
    limiteRec = abaRec.getRange("W2").getValue() || 1;
    if (limiteRec === 0) limiteRec = 1;
  } catch(e) { valorRec = 0; limiteRec = 1; }

  const dataAlvo = dataFiltro ? dataFiltro.split("-").reverse().join("/") : Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
 
  let semanaAlvo = "S16";
  for (let i = 1; i < dadosP.length; i++) {
    if (dadosP[i][1]) {
      let dtFormatada = Utilities.formatDate(new Date(dadosP[i][1]), "GMT-3", "dd/MM/yyyy");
      if (dtFormatada === dataAlvo) { semanaAlvo = String(dadosP[i][3]); break; }
    }
  }

  let fechamentosTxt = "";
  try {
    const ssCTR = SpreadsheetApp.openById("1n5thJuYezYsqyDUol7s0AyZgilQsOxyrfI6GWy8nPz0");
    const dadosCTR = ssCTR.getSheetByName("2026").getDataRange().getValues();
    dadosCTR.slice(4).forEach(row => {
      let dtF = row[3];
      if (dtF instanceof Date) dtF = Utilities.formatDate(dtF, "GMT-3", "dd/MM/yyyy");
      let statusF = String(row[9]).trim().toLowerCase();
      let turnoF = String(row[10]).trim().toLowerCase();
      if (dtF === dataAlvo && statusF === "fechado") {
        let linha = `>Fechamento do Palete Nº ${row[1]} - ${row[7]} - ${row[4]} - ${row[8]}`;
        fechamentosTxt += linha + "|" + turnoF + "\n";
      }
    });
  } catch(e) { fechamentosTxt = ""; }

  const procsTurno = ["D2D","FRANQUIA","SUCATA","AERO","ER","E-COMM","TRUSS"];
  const procsSemana = ["D2D","FRANQUIA","SUCATA","AERO","ER","E-COMM","TRUSS"];
 
  let t1={}, t2={}, tADM={}, ras={};
  procsTurno.forEach(p => {
    t1[p]={e:0,s:0,q:0};
    t2[p]={e:0,s:0,q:0};
    tADM[p]={e:0,s:0,q:0};
  });
  procsSemana.forEach(p => { ras[p]={pal:0,pec:0}; });

  let resumoPorDia = {};
  let resumoPorSemana = {}; 
  let acumuladoTotalProcesso = {};
  let entT=0, saiT=0, totPal=0, totPec=0;
  let estoqueMap={};
 
  let entM = [0,0,0,0,0,0,0,0,0,0,0,0];
  let saiM = [0,0,0,0,0,0,0,0,0,0,0,0];

  let rastreadorProcessos = {}; 
  let dashRaw = {
    dbDia: {}, dbSem: {}, 
    dbMesPal: [{},{},{},{},{},{},{},{},{},{},{},{}], 
    dbMesPec: [{},{},{},{},{},{},{},{},{},{},{},{}],
    dbAnoEnt: {}, dbAnoSai: {}, dbProc: {}, processosUnicos: []
  };

  dadosP.slice(1).forEach(r => {
    if (!r[1]) return;
    let dt = Utilities.formatDate(new Date(r[1]), "GMT-3", "dd/MM/yyyy");
    let sem = String(r[3]).trim().toUpperCase(); 
    let procNome = String(r[6]).trim().toUpperCase();
    let vEnt = Number(r[10]) || 0; let vSai = Number(r[11]) || 0;
    let turnoOriginal = String(r[0]).toLowerCase().trim();

    if (procNome && procNome !== "" && procNome !== "PROCESSOS") {
      entT += vEnt; saiT += vSai;
      
      let mesIdx = -1;
      if (dt.indexOf("/") !== -1) { mesIdx = parseInt(dt.split("/")[1], 10) - 1; }
      if (mesIdx >= 0 && mesIdx <= 11) { entM[mesIdx] += vEnt; saiM[mesIdx] += vSai; }

      if (sem && sem !== "" && sem !== "SEMANA") {
        if (!resumoPorSemana[sem]) resumoPorSemana[sem] = { e: 0, s: 0 };
        resumoPorSemana[sem].e += vEnt;
        resumoPorSemana[sem].s += vSai;
      }

      if (!acumuladoTotalProcesso[procNome]) acumuladoTotalProcesso[procNome] = 0;
      acumuladoTotalProcesso[procNome] += (vEnt - vSai);
      if(!resumoPorDia[dt]) resumoPorDia[dt] = { pecas: 0, paletes: 0 };
      resumoPorDia[dt].paletes += vSai;
      
      if (dt === dataAlvo) {
        if(turnoOriginal === "1º turno" && t1[procNome]) { t1[procNome].e += vEnt; t1[procNome].s += vSai; }
        if(turnoOriginal === "2º turno" && t2[procNome]) { t2[procNome].e += vEnt; t2[procNome].s += vSai; }
        if(turnoOriginal === "adm" && tADM[procNome]) { tADM[procNome].e += vEnt; tADM[procNome].s += vSai; }
      }
      if (r[3] === semanaAlvo && ras[procNome]) { ras[procNome].pal += vSai; totPal += vSai; }

      rastreadorProcessos[procNome] = true;
      if (!dashRaw.dbDia[dt]) dashRaw.dbDia[dt] = {};
      if (!dashRaw.dbDia[dt][procNome]) dashRaw.dbDia[dt][procNome] = { pec: 0, pal: 0 };
      dashRaw.dbDia[dt][procNome].pal += vSai;

      if (sem && sem !== "SEMANA") {
        if (!dashRaw.dbSem[sem]) dashRaw.dbSem[sem] = {};
        if (!dashRaw.dbSem[sem][procNome]) dashRaw.dbSem[sem][procNome] = { pal: 0, pec: 0 };
        dashRaw.dbSem[sem][procNome].pal += vSai;
      }

      if (mesIdx >= 0 && mesIdx <= 11) { dashRaw.dbMesPal[mesIdx][procNome] = (dashRaw.dbMesPal[mesIdx][procNome] || 0) + vSai; }
      dashRaw.dbAnoEnt[procNome] = (dashRaw.dbAnoEnt[procNome] || 0) + vEnt;
      dashRaw.dbAnoSai[procNome] = (dashRaw.dbAnoSai[procNome] || 0) + vSai;
      dashRaw.dbProc[procNome] = (dashRaw.dbProc[procNome] || 0) + (vEnt - vSai);
    }

    let id = r[5]; 
    if(id) {
      if(!estoqueMap[id]) estoqueMap[id] = {id: id, procsDict: {}, entrada: 0, saida: 0, sla: Number(r[18]) || 0};
      estoqueMap[id].procsDict[procNome] = true; 
      estoqueMap[id].entrada += vEnt; 
      estoqueMap[id].saida += vSai;
    }
  });

  dadosT.slice(1).forEach(r => {
    if (!r[1]) return;
    let dt = Utilities.formatDate(new Date(r[1]), "GMT-3", "dd/MM/yyyy");
    let sem = String(r[3]).trim().toUpperCase(); 
    let qPec = Number(r[6]) || 0;
    let procNome = String(r[5]).trim().toUpperCase();
    let turnoOriginal = String(r[0]).toLowerCase().trim();

    if(!resumoPorDia[dt]) resumoPorDia[dt] = { pecas: 0, paletes: 0 };
    resumoPorDia[dt].pecas += qPec;
    
    if (dt === dataAlvo) {
      if(turnoOriginal === "1º turno" && t1[procNome]) t1[procNome].q += qPec;
      if(turnoOriginal === "2º turno" && t2[procNome]) t2[procNome].q += qPec;
      if(turnoOriginal === "adm" && tADM[procNome]) tADM[procNome].q += qPec;
    }
    if (r[3] === semanaAlvo && ras[procNome]) { 
      ras[procNome].pec += qPec; 
      totPec += qPec; 
    }

    if (procNome && procNome !== "" && procNome !== "PROCESSOS") {
      rastreadorProcessos[procNome] = true;
      if (!dashRaw.dbDia[dt]) dashRaw.dbDia[dt] = {};
      if (!dashRaw.dbDia[dt][procNome]) dashRaw.dbDia[dt][procNome] = { pec: 0, pal: 0 };
      dashRaw.dbDia[dt][procNome].pec += qPec;

      if (sem && sem !== "SEMANA") {
        if (!dashRaw.dbSem[sem]) dashRaw.dbSem[sem] = {};
        if (!dashRaw.dbSem[sem][procNome]) dashRaw.dbSem[sem][procNome] = { pal: 0, pec: 0 };
        dashRaw.dbSem[sem][procNome].pec += qPec;
      }
      let mesIdx = -1;
      if (dt.indexOf("/") !== -1) { mesIdx = parseInt(dt.split("/")[1], 10) - 1; }
      if (mesIdx >= 0 && mesIdx <= 11) { dashRaw.dbMesPec[mesIdx][procNome] = (dashRaw.dbMesPec[mesIdx][procNome] || 0) + qPec; }
    }
  });

  let diasComDados = Object.keys(resumoPorDia).filter(d => resumoPorDia[d].pecas > 0 || resumoPorDia[d].paletes > 0).sort((a,b) => {
        let da = a.split("/"), db = b.split("/");
        return new Date(da[2],da[1]-1,da[0]) - new Date(db[2],db[1]-1,db[0]);
  });
  let ultimos7Dias = diasComDados.slice(-7);
  let u7L = ultimos7Dias.map(d => d.substring(0,5));
  let u7Pec = ultimos7Dias.map(d => Math.round(resumoPorDia[d].pecas) || 0);
  let u7Pal = ultimos7Dias.map(d => Math.round(resumoPorDia[d].paletes) || 0);

  procsTurno.forEach(p => {
    t1[p].q = Math.round(t1[p].q) || 0;
    t2[p].q = Math.round(t2[p].q) || 0;
    tADM[p].q = Math.round(tADM[p].q) || 0;
  });

  procsSemana.forEach(p => { ras[p].pec = Math.round(ras[p].pec) || 0; });
  totPec = Math.round(totPec) || 0;
 
  let listaEstoque = Object.keys(estoqueMap).map(k => {
    let p = estoqueMap[k];
    return {
      id: p.id,
      processos: Object.keys(p.procsDict).join('/'),
      entrada: p.entrada,
      saida: p.saida,
      sla: p.sla,
      saldo: p.entrada - p.saida,
      status: (p.saida > 0 ? "INICIADO" : "PENDENTE")
    };
  }).filter(p => p.saldo > 0).sort((a, b) => b.sla - a.sla);

  let semanasKeys = Object.keys(resumoPorSemana).sort((a,b) => {
    let numA = parseInt(a.replace(/\D/g, '')) || 0;
    let numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  let ultimas5Semanas = semanasKeys.slice(-5);
  let u5SemL = ultimas5Semanas;
  let u5SemE = ultimas5Semanas.map(s => resumoPorSemana[s].e || 0);
  let u5SemS = ultimas5Semanas.map(s => resumoPorSemana[s].s || 0);

  dashRaw.u7Full = ultimos7Dias;
  dashRaw.processosUnicos = Object.keys(rastreadorProcessos).filter(function(x){ return x !== ""; }).sort();
  
  let ocupacaoLimpa = isNaN((entT-saiT)) ? "0.00" : (((entT-saiT)/35)*100).toFixed(2);
  let ocupacaoRecLimpa = isNaN(valorRec/limiteRec) ? "0.00" : ((valorRec/limiteRec)*100).toFixed(2);

  return {
    ocupacao: ocupacaoLimpa, qtdPaletes: (entT-saiT) || 0,
    valorRec: valorRec || 0, ocupacaoRec: ocupacaoRecLimpa,
    t1: t1, t2: t2, tADM: tADM, ras: ras, totPal: totPal || 0, totPec: totPec || 0, 
    procs: procsSemana, procsTurno: procsTurno, dataAlvo: dataAlvo, semanaAlvo: semanaAlvo, estoque: listaEstoque,
    u7L: u7L, u7Pec: u7Pec, u7Pal: u7Pal, entTot: entT || 0, saiTot: saiT || 0, acumuladoProcesso: acumuladoTotalProcesso,
    fechamentosBrutos: fechamentosTxt || "", entM: entM, saiM: saiM,
    u5SemL: u5SemL, u5SemE: u5SemE, u5SemS: u5SemS, dashRaw: dashRaw
  };
}

function enviarEmailPassagem(obj) {
  const meuEmail = "g_dpccdregistro@grupoboticario.com.br,andreb@grupoboticario.com.br,milena.barbosa@grupoboticario.com.br";
  let saudacao = obj.turno === "1º turno" ? "Boa tarde," : (obj.turno === "adm" ? "Boa tarde," : "Boa noite,");
  let corOcupacao = parseFloat(obj.ocupacao) > 90 ? "#ff4d4d" : (parseFloat(obj.ocupacao) > 60 ? "#ffd600" : "#00c853");
 
  let formCardHTML = `<div style="width:180px; background-color:#1c1f2e; padding:15px; border-radius:10px; border:2px solid #3a86ff; text-align:center; font-family:Arial; margin-bottom:10px;"><div style="color:#3a86ff; font-size:11px; font-weight:bold; text-transform:uppercase; margin-bottom:5px;">FORMULÁRIO ATUAL</div><div style="color:white; font-size:36px; font-weight:900;">${obj.formAtual}</div></div>`;
  let dashHTML = `<div style="width:180px; background-color:#1c1f2e; padding:15px; border-radius:10px; border:2px solid #3a86ff; text-align:center; font-family:Arial;"><div style="color:#3a86ff; font-size:11px; font-weight:bold; text-transform:uppercase; margin-bottom:5px;">ACUMULADO</div><div style="color:white; font-size:36px; font-weight:900; margin-bottom:5px;">${obj.qtdPaletes}</div><div style="display:inline-block; border:1.5px solid white; border-radius:4px; padding:2px 10px; color:white; font-size:10px; font-weight:bold; margin-bottom:5px;">OCUPAÇÃO</div><div style="color:${corOcupacao}; font-size:20px; font-weight:bold;">${obj.ocupacao}%</div></div>`;
  let linhasAtividades = obj.texto.split('\n').filter(l => l.trim() !== "");
  let atividadesHTML = linhasAtividades.map(l => `<li>${l.trim()}</li>`).join('');
  let tabelaHTML = `<table style="width:100%;max-width:500px;border-collapse:separate;border-spacing:0 4px;font-family:Arial;background-color:#12141d;padding:10px;border-radius:8px;"><thead><tr><th style="background-color:#3a86ff;color:white;padding:12px;text-align:left;font-size:12px;text-transform:uppercase;border-radius:4px 0 0 0;">${obj.turno.toUpperCase()}</th><th style="background-color:#3a86ff;color:white;padding:12px;text-align:center;font-size:12px;">ENTRADA</th><th style="background-color:#3a86ff;color:white;padding:12px;text-align:center;font-size:12px;">SAÍDA</th><th style="background-color:#3a86ff;color:white;padding:12px;text-align:center;font-size:12px;border-radius:0 4px 0 0;">QTD</th></tr></thead><tbody>${obj.linhasTabelaEmail}</tbody></table>`;
 
  let corpoHTML = `<div style="font-family:Arial;color:#333;"><p style="font-size:14px;">${saudacao}</p><p style="font-size:14px;">Segue o resumo das atividades realizadas no turno de hoje:.</p><ul style="margin: 15px 0; font-size: 14px; color: #000; padding-left: 20px;">${atividadesHTML}</ul><div style="margin-bottom:20px;font-weight:bold;">${obj.fechamentos.replace(/\n/g,'<br>')}</div><table border="0" cellpadding="0" cellspacing="0"><tr><td valign="top" style="padding-right:25px;">${tabelaHTML}</td><td valign="top">${formCardHTML}${dashHTML}</td></tr></table><p style="margin-top:25px;color:#777;">Atte,</p></div>`;
 
  let turnoAssunto = obj.turno === "adm" ? "ADM" : obj.turno;
  MailApp.sendEmail({ to: meuEmail, subject: "Passagem de turno - " + turnoAssunto + " " + obj.data, htmlBody: corpoHTML });
  return "E-mail enviado!";
}

function confirmarRecebimento() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Confirmar Recebimento', 'Digite o número da devolução:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() == ui.Button.OK) {
    var numDevolucao = response.getResponseText().trim();
    if (numDevolucao === "") { ui.alert('Aviso', 'O número da devolução não pode estar vazio.', ui.ButtonSet.OK); return; }
    var idPlanilhaDestino = "1Loe_oSBlZlC_uhq_yB972YERS4uiYfEq0pxaIqlGvIE";
    var spreadsheetDestino;
    try { spreadsheetDestino = SpreadsheetApp.openById(idPlanilhaDestino); } catch (e) { ui.alert('Erro', 'Não foi possível acessar a planilha.', ui.ButtonSet.OK); return; }
    var sheet = null; var abas = spreadsheetDestino.getSheets();
    for (var j = 0; j < abas.length; j++) { if (abas[j].getName().trim().toLowerCase() === "devolução") { sheet = abas[j]; break; } }
    if (!sheet) { ui.alert('Erro', 'Aba "devolução" não encontrada.', ui.ButtonSet.OK); return; }
    var data = sheet.getDataRange().getValues(); var dataAtual = new Date(); var atualizacoes = 0;
    for (var i = 1; i < data.length; i++) {
      var colB = data[i][1] != null ? data[i][1].toString().trim() : ""; 
      var colC = data[i][2] != null ? data[i][2].toString().trim().toUpperCase() : ""; 
      if (colB === numDevolucao && colC.includes("CD REGISTRO")) { sheet.getRange(i + 1, 42).setValue(dataAtual); atualizacoes++; }
    }
    if (atualizacoes > 0) { ui.alert('Sucesso', atualizacoes + ' registro(s) preenchidos!', ui.ButtonSet.OK); } else { ui.alert('Aviso', 'Nenhuma devolução encontrada.', ui.ButtonSet.OK); }
  }
}
