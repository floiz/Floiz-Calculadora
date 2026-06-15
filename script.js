

    const PAX_TYPES = ["ADT","CHD","INF"];

    // ---------- helpers ----------
    function showToast(msg){
      const t = document.getElementById("toast");
      t.textContent = msg || "OK";
      t.classList.add("show");
      setTimeout(()=>t.classList.remove("show"), 1400);
    }
    // ---- Rentabilização (uso interno): controla campos e gera bloco para OBS (RF) ----
    function getRentData(){
      const enabled = !!document.getElementById("rentab")?.checked;
      const multa = enabled && !!document.getElementById("rent_tipo_multa")?.checked;
      const diftar = enabled && !!document.getElementById("rent_tipo_diftar")?.checked;
      const diftax = enabled && !!document.getElementById("rent_tipo_diftax")?.checked;
      const anyType = !!(multa || diftar || diftax);

      const v = (id)=> (document.getElementById(id)?.value || "").trim();
      return {
        enabled,
        multa, diftar, diftax,
        anyType,
        multa_pago: v("rent_pago_cia_multa"),
        multa_cobrar: v("rent_cobrar_ag_multa"),
        diftar_pago: v("rent_pago_cia_diftar"),
        diftar_cobrar: v("rent_cobrar_ag_diftar"),
        diftax_pago: v("rent_pago_cia_diftax"),
        diftax_cobrar: v("rent_cobrar_ag_diftax"),
        multa_lucro: v("rent_lucro_multa"),
        diftar_lucro: v("rent_lucro_diftar"),
        diftax_lucro: v("rent_lucro_diftax"),
      };
    }

    function toggleRentUI(){
      const panel = document.getElementById("rentPanel");
      const blocks = document.getElementById("rentBlocks");
      if(!panel || !blocks) return;

      const rd = getRentData();
      panel.style.display = rd.enabled ? "block" : "none";
      blocks.style.display = (rd.enabled && rd.anyType) ? "block" : "none";

      const setDisp = (id, on)=>{ const el=document.getElementById(id); if(el) el.style.display = on ? "block" : "none"; };
      setDisp("rentBlock_multa", rd.enabled && rd.multa);
      setDisp("rentBlock_diftar", rd.enabled && rd.diftar);
      setDisp("rentBlock_diftax", rd.enabled && rd.diftax);

      const clearVals = (ids)=> ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });

      // se desmarcar rentabilização, limpa tudo (evita vazamento)
      if(!rd.enabled){
        for(const id of ["rent_tipo_multa","rent_tipo_diftar","rent_tipo_diftax"]){
          const el = document.getElementById(id);
          if(el) el.checked = false;
        }
        clearVals([
          "rent_pago_cia_multa_adt","rent_pago_cia_multa_chd","rent_pago_cia_multa_inf","rent_cobrar_ag_multa","rent_lucro_multa",
          "rent_pago_cia_diftar_adt","rent_pago_cia_diftar_chd","rent_pago_cia_diftar_inf","rent_cobrar_ag_diftar","rent_lucro_diftar",
          "rent_pago_cia_diftax_adt","rent_pago_cia_diftax_chd","rent_pago_cia_diftax_inf","rent_cobrar_ag_diftax","rent_lucro_diftax",
        ]);
      } else {
        // se desmarcar um tipo, limpa só aquele bloco
        if(!rd.multa) clearVals(["rent_pago_cia_multa_adt","rent_pago_cia_multa_chd","rent_pago_cia_multa_inf","rent_cobrar_ag_multa","rent_lucro_multa"]);
        if(!rd.diftar) clearVals(["rent_pago_cia_diftar_adt","rent_pago_cia_diftar_chd","rent_pago_cia_diftar_inf","rent_cobrar_ag_diftar","rent_lucro_diftar"]);
        if(!rd.diftax) clearVals(["rent_pago_cia_diftax_adt","rent_pago_cia_diftax_chd","rent_pago_cia_diftax_inf","rent_cobrar_ag_diftax","rent_lucro_diftax"]);
      }
      // saída: formulário de rentabilização (SICA)
      const btnRF = document.getElementById("btnCopiarRentForm");
      if(btnRF){
        btnRF.disabled = false;
        btnRF.title = "Copiar formulário para Rentabilização";
      }
      // saída (SICA): ocultar quando Rentabilização estiver desabilitado
      const outSica = document.getElementById("outRentSicaSection");
      if(outSica) outSica.style.display = rd.enabled ? "block" : "none";
      try{ syncOutputTabs(); }catch(e){}

    }

    function calcRentAutoTotals(mode, calc){
      const out = { multa:0, diftar:0, diftax:0, cur: (mode==="INTER") ? (calc.cur || getInterCurrency()) : "BRL" };
      const rows = (calc && calc.rows) ? calc.rows : [];
      for(const r of rows){
        const qty = Number(r.qty || 0) || 0;
        if(mode === "INTER"){
          out.diftar += (Number(r.fare || 0) || 0) * qty;
          out.diftax += (Number(r.tax || 0) || 0) * qty;
          out.multa  += (Number(r.pen || 0) || 0) * qty;
        } else {
          out.diftar += (Number(r.diffFare || 0) || 0) * qty;
          out.diftax += (Number(r.diffTax || 0) || 0) * qty;
          out.multa  += (Number(r.pen || 0) || 0) * qty;
        }
      }
      return out;
    }

    
    
    function calcRentAutoTotalsByPax(mode, calc){
      const cur = (mode==="INTER") ? (calc.cur || getInterCurrency()) : "BRL";
      const out = {
        cur,
        ADT:{multa:0, diftar:0, diftax:0},
        CHD:{multa:0, diftar:0, diftax:0},
        INF:{multa:0, diftar:0, diftax:0},
      };
      const rows = (calc && calc.rows) ? calc.rows : [];
      for(const r of rows){
        const t = String(r.t || "").toUpperCase();
        if(!out[t]) continue;
        const qty = Number(r.qty || 0) || 0;
        if(mode === "INTER"){
          out[t].diftar += (Number(r.fare || 0) || 0) * qty;
          out[t].diftax += (Number(r.tax || 0) || 0) * qty;
          out[t].multa  += (Number(r.pen || 0) || 0) * qty;
        } else {
          out[t].diftar += (Number(r.diffFare || 0) || 0) * qty;
          out[t].diftax += (Number(r.diffTax || 0) || 0) * qty;
          out[t].multa  += (Number(r.pen || 0) || 0) * qty;
        }
      }
      return out;
    }

// ---------- RENTABILIZAÇÃO por PAX (rateio) ----------
    function round2(n){
      const x = Number(n || 0);
      return Math.round((x + Number.EPSILON) * 100) / 100;
    }

    function getPaxFlatList(){
      const store = getPaxStore();
      const out = [];
      const order = ["ADT","CHD","INF"];
      for(const t of order){
        const arr = Array.isArray(store[t]) ? store[t] : [];
        for(let i=0;i<arr.length;i++){
          const p = arr[i] || {};
          out.push({
            type: t,
            idx: i+1,
            name: normalizePaxName(p.name || ""),
            ticket: ensureTicketHyphen(String(p.ticket || "")),
          });
        }
      }
      return out;
    }

    function getRentPerPax(mode, calc){
      const rd = getRentData();
      const cur = (mode === "INTER") ? (calc.cur || getInterCurrency()) : "BRL";
      const pax = getPaxFlatList();
      const byType = {};
      const rows = (calc && calc.rows) ? calc.rows : [];
      for(const r of rows){ byType[r.t] = r; }

      const paidNum = (cat, pax)=> parseBRNumber((document.getElementById(`rent_pago_cia_${cat}_${pax}`)?.value || "").trim());
      const paidTotals = {
        multa: { ADT: paidNum("multa","adt"), CHD: paidNum("multa","chd"), INF: paidNum("multa","inf") },
        diftar: { ADT: paidNum("diftar","adt"), CHD: paidNum("diftar","chd"), INF: paidNum("diftar","inf") },
        diftax: { ADT: paidNum("diftax","adt"), CHD: paidNum("diftax","chd"), INF: paidNum("diftax","inf") },
      };

      // Base cobrar por pax (por tipo de pax)
      const out = pax.map(p=>{
        const r = byType[p.type] || {};
        const cob = {
          multa: Number(r.pen || 0) || 0,
          diftar: Number((mode==="INTER" ? r.fare : r.diffFare) || 0) || 0,
          diftax: Number((mode==="INTER" ? r.tax  : r.diffTax ) || 0) || 0,
        };
        return {
          ...p,
          cob,
          pago: {multa:0, diftar:0, diftax:0},
          cobrar: 0,
          pagoTotal: 0,
          lucro: 0,
        };
      });

      // "Pago na CIA" é informado POR PAX por tipo (ADT/CHD/INF). Cada passageiro do tipo recebe o mesmo valor.
      const cats = ["multa","diftar","diftax"];
      const types = ["ADT","CHD","INF"];
      for(const cat of cats){
        if(!rd[cat]) continue;

        for(const t of types){
          const perVal = Number((paidTotals[cat] && paidTotals[cat][t]) || 0) || 0;
          for(let i=0;i<out.length;i++){
            if(out[i].type === t){
              out[i].pago[cat] = round2(perVal);
            }
          }
        }
      }



// Totais por pax
      for(const r of out){
        let cobSum = 0, pagSum = 0;
        if(rd.multa){ cobSum += r.cob.multa;  pagSum += r.pago.multa; }
        if(rd.diftar){ cobSum += r.cob.diftar; pagSum += r.pago.diftar; }
        if(rd.diftax){ cobSum += r.cob.diftax; pagSum += r.pago.diftax; }
        r.cobrar = cobSum;
        r.pagoTotal = pagSum;
        r.lucro = cobSum - pagSum;
      }

      // Totais gerais
      const totals = {cobrar:0, pago:0, lucro:0};
      for(const r of out){
        totals.cobrar += r.cobrar;
        totals.pago += r.pagoTotal;
        totals.lucro += r.lucro;
      }

      return { enabled: rd.enabled && rd.anyType, cur, rows: out, totals, sel: {multa:rd.multa, diftar:rd.diftar, diftax:rd.diftax} };
    }

    function buildRentPaxTableRF(mode, calc, colspan){
      const rp = getRentPerPax(mode, calc);
      if(!rp.enabled || !rp.rows.length) return "";
      const fmt = (mode === "INTER") ? fmtCur : fmtBRL;

      let head = `
        <tr>
          <td style="background-color:#a99ac5;color:white;padding:6px;"><b>PAX</b></td>
          <td style="background-color:#a99ac5;color:white;padding:6px;"><b>Bilhete</b></td>
          <td style="background-color:#a99ac5;color:white;padding:6px;text-align:left;"><b>Cobrar do cliente (auto)</b></td>
          <td style="background-color:#a99ac5;color:white;padding:6px;text-align:left;"><b>Pagar na CIA (informado)</b></td>
          <td style="background-color:#a99ac5;color:white;padding:6px;text-align:left;"><b>Lucro (Cobrar – Pagar)</b></td>
        </tr>
      `;
      let body = "";
      for(let i=0;i<rp.rows.length;i++){
        const p = rp.rows[i];
        const compCliente = [];
        const compCia = [];
        if(rp.sel.diftar){ compCliente.push(`Dif.tar ${stripHtml(fmt(p.cob.diftar))}`); compCia.push(`Dif.tar ${stripHtml(fmt(p.pago.diftar))}`); }
        if(rp.sel.multa){  compCliente.push(`Multa ${stripHtml(fmt(p.cob.multa))}`);  compCia.push(`Multa ${stripHtml(fmt(p.pago.multa))}`); }
        if(rp.sel.diftax){ compCliente.push(`Dif.taxa ${stripHtml(fmt(p.cob.diftax))}`); compCia.push(`Dif.taxa ${stripHtml(fmt(p.pago.diftax))}`); }
        const comp = [`Cobrar do cliente: ${compCliente.join(" + ") || "-"}`, `Pagar na CIA: ${compCia.join(" + ") || "-"}`];
body += `<tr>
          <td>${escAttr(p.name || (`${p.type}${p.idx}`))}</td>
          <td>${escAttr(maskRFText(p.ticket || "-"))}</td>
          <td align="right">${escAttr(fmt(p.cobrar))}</td>
          <td align="right">${escAttr(fmt(p.pagoTotal))}</td>
          <td align="right"><b>${escAttr(fmt(p.lucro))}</b></td>
        </tr>
        <tr><td colspan="5"><span style="color:#666">${escAttr(comp.join(" • "))}</span></td></tr>`;
        if(i < rp.rows.length-1){
          body += `<tr><td colspan="5" style="color:#999;font-size:12px;line-height:14px;">----------------------------------------</td></tr>`;
        }
      }

      const foot = `<tr>
        <td colspan="2" align="right"><b>TOTAL</b></td>
        <td align="right"><b>${escAttr(fmt(rp.totals.cobrar))}</b></td>
        <td align="right"><b>${escAttr(fmt(rp.totals.pago))}</b></td>
        <td align="right"><b>${escAttr(fmt(rp.totals.lucro))}</b></td>
      </tr>`;

      return `
        <tr><td colspan="${colspan}"><b>Rentabilização por PAX</b> <span style="color:#666">(dividido por tipo de PAX)</span></td></tr>
        <tr><td colspan="${colspan}">
          <table border="1" cellspacing="0" cellpadding="3" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 13px;">
            ${head}
            ${body}
            ${foot}
          </table>
        </td></tr>
      `;
    }

    function buildRentPaxTableSica(mode, calc){
      const rp = getRentPerPax(mode, calc);
      if(!rp.enabled || !rp.rows.length) return "";
      const fmt = (mode === "INTER") ? fmtCur : fmtBRL;
      const cur = rp.cur;

      const th = (txt, right=false)=>`<th style="padding:6px;border:1px solid #d9d9e6;background:#eef2ff;font-weight:700;${right?'text-align:right;':''}">${txt}</th>`;
      const td = (txt, right=false)=>`<td style="padding:5px 6px;border:1px solid #d9d9e6;${right?'text-align:right;white-space:nowrap;':''}">${txt}</td>`;

      let rows = "";
      for(let i=0;i<rp.rows.length;i++){
        const p = rp.rows[i];
        const compCliente = [];
        const compCia = [];
        if(rp.sel.diftar){ compCliente.push(`Dif.tar ${stripHtml(fmt(p.cob.diftar))}`); compCia.push(`Dif.tar ${stripHtml(fmt(p.pago.diftar))}`); }
        if(rp.sel.multa){  compCliente.push(`Multa ${stripHtml(fmt(p.cob.multa))}`);  compCia.push(`Multa ${stripHtml(fmt(p.pago.multa))}`); }
        if(rp.sel.diftax){ compCliente.push(`Dif.taxa ${stripHtml(fmt(p.cob.diftax))}`); compCia.push(`Dif.taxa ${stripHtml(fmt(p.pago.diftax))}`); }
        const comp = [`Cobrar do cliente: ${compCliente.join(" + ") || "-"}`, `Pagar na CIA: ${compCia.join(" + ") || "-"}`];
rows += `<tr>
          ${td(`<b>${escapeHtml(p.name || (`${p.type}${p.idx}`))}</b><div style="color:#666;font-size:11px">${escapeHtml(p.ticket || "-")}</div>`)}
          ${td(escapeHtml(comp.join(" • ")) )}
          ${td(escapeHtml(stripHtml(fmt(p.cobrar))), true)}
          ${td(escapeHtml(stripHtml(fmt(p.pagoTotal))), true)}
          ${td(`<b style="color:${p.lucro>=0?'#0a7a33':'#b42318'}">${escapeHtml(stripHtml(fmt(p.lucro)))}</b>`, true)}
        </tr>`;
      }

      const totalRow = `<tr>
        ${td(`<b>TOTAL</b>`, false)}
        ${td(``, false)}
        ${td(`<b>${escapeHtml(stripHtml(fmt(rp.totals.cobrar)))}</b>`, true)}
        ${td(`<b>${escapeHtml(stripHtml(fmt(rp.totals.pago)))}</b>`, true)}
        ${td(`<b>${escapeHtml(stripHtml(fmt(rp.totals.lucro)))}</b>`, true)}
      </tr>`;

      return `
        <div style="height:10px;"></div>
        <div style="font-weight:700;margin:0 0 6px 0;">Rentabilização por passageiro <span style="color:#666;font-weight:400">(dividido por tipo de PAX)</span></div>
        <table width="760" style="width:760px;max-width:760px;border-collapse:collapse;">
          <tr>
            ${th("PAX")}
            ${th("Composição (Cliente × CIA)", false)}
            ${th(`Cobrar do cliente (auto) • ${escapeHtml(cur)}`, true)}
            ${th(`Pagar na CIA (informado) • ${escapeHtml(cur)}`, true)}
            ${th(`Lucro (Cobrar – Pagar) • ${escapeHtml(cur)}`, true)}
          </tr>
          ${rows}
          ${totalRow}
        </table>
      `;
    }

function updateRentComputed(mode, calc){
      const rd = getRentData();
      const kpis = document.getElementById("rentKpis");
      if(!rd.enabled){
        if(kpis) kpis.style.display = "none";
        return;
      }

      const auto = calcRentAutoTotals(mode, calc);

      const setVal = (id, val)=>{
        const el = document.getElementById(id);
        if(!el) return;
        el.value = val;
      };

      const setOrClear = (on, id, val)=> setVal(id, on ? val : "");

      // Cobrar (auto)
      setOrClear(rd.multa, "rent_cobrar_ag_multa", fmtNumPT(auto.multa));
      setOrClear(rd.diftar, "rent_cobrar_ag_diftar", fmtNumPT(auto.diftar));
      setOrClear(rd.diftax, "rent_cobrar_ag_diftax", fmtNumPT(auto.diftax));

      // Pago na CIA é informado POR PAX (ADT/CHD/INF). Total = valor_por_pax * quantidade_do_tipo.
      const paidRaw = (cat, pax)=> (document.getElementById(`rent_pago_cia_${cat}_${pax}`)?.value || "").trim();
      const paidPer = (cat, pax)=> parseBRNumber(paidRaw(cat, pax));

      const qtyByType = (()=>{
        const q = {ADT:0, CHD:0, INF:0};
        const rows = (calc && Array.isArray(calc.rows)) ? calc.rows : [];
        for(const r of rows){
          const t = String(r.t||"").toUpperCase();
          if(!(t in q)) continue;
          q[t] += (Number(r.qty||0) || 0);
        }
        return q;
      })();

      const paidBy = (cat)=>{
        const adtPer = paidPer(cat,"adt");
        const chdPer = paidPer(cat,"chd");
        const infPer = paidPer(cat,"inf");
        const any = !!(paidRaw(cat,"adt") || paidRaw(cat,"chd") || paidRaw(cat,"inf"));

        const totADT = adtPer * (qtyByType.ADT || 0);
        const totCHD = chdPer * (qtyByType.CHD || 0);
        const totINF = infPer * (qtyByType.INF || 0);
        const total = totADT + totCHD + totINF;

        return { per:{ADT:adtPer, CHD:chdPer, INF:infPer}, tot:{ADT:totADT, CHD:totCHD, INF:totINF}, total, any };
      };

      const pM = paidBy("multa");
      const pT = paidBy("diftar");
      const pX = paidBy("diftax");

      const fmtSum = (n)=> (mode==="INTER") ? fmtCur(n) : fmtBRL(n);

      // Atualiza "Total pago na CIA" em cada bloco
      const setPaidTotalTxt = (cat, p)=>{
        const el = document.getElementById(`rent_pago_cia_${cat}_total`);
        if(!el) return;
        el.textContent = p.any ? fmtSum(p.total) : "—";
      };
      setPaidTotalTxt("multa", pM);
      setPaidTotalTxt("diftar", pT);
      setPaidTotalTxt("diftax", pX);

      const lM = auto.multa  - pM.total;
      const lT = auto.diftar - pT.total;
      const lX = auto.diftax - pX.total;

      setOrClear(rd.multa, "rent_lucro_multa", fmtNumPT(lM));
      setOrClear(rd.diftar, "rent_lucro_diftar", fmtNumPT(lT));
      setOrClear(rd.diftax, "rent_lucro_diftax", fmtNumPT(lX));

      // Resumo por tipo de PAX (ADT/CHD/INF)
      const autoBy = calcRentAutoTotalsByPax(mode, calc);
      const setBreak = (cat, p, elId)=>{
        const el = document.getElementById(elId);
        if(!el) return;
        if(!rd[cat]){ el.innerHTML = ""; return; }
        const mapPaidTot = (p && p.tot) ? p.tot : {ADT:0, CHD:0, INF:0};
        const mapPaidPer = (p && p.per) ? p.per : {ADT:0, CHD:0, INF:0};
        const order = ["ADT","CHD","INF"];
        const lines = [];
        for(const t of order){
          const a = (autoBy[t] && autoBy[t][cat]) ? autoBy[t][cat] : 0;
          const ppTot = (mapPaidTot[t] || 0);
          const ppPer = (mapPaidPer[t] || 0);
          const qty = (qtyByType && qtyByType[t]) ? qtyByType[t] : 0;

          // mostrar só se existir quantidade no cálculo OU se foi preenchido pago (por pax)
          const hasQty = qty > 0;
          if(!hasQty && ppPer===0 && a===0) continue;

          const luc = a - ppTot;
          const suf = (hasQty && ppPer !== 0) ? ` <span style="color:#8ea0b7">(${fmtSum(ppPer)}/pax × ${qty})</span>` : "";
          lines.push(`<b>${t}</b>: Cobrar ${fmtSum(a)} &nbsp;|&nbsp; Pago ${fmtSum(ppTot)}${suf} &nbsp;|&nbsp; Lucro ${fmtSum(luc)}`);
        }
        el.innerHTML = lines.length ? (`<b>Por tipo de PAX</b><br>` + lines.join("<br>")) : "";
      };
      setBreak("multa",  pM, "rent_break_multa");
      setBreak("diftar", pT, "rent_break_diftar");
      setBreak("diftax", pX, "rent_break_diftax");

      // KPIs (somente tipos selecionados)
      let sumCob = 0, sumPago = 0, sumLuc = 0;
      if(rd.multa){ sumCob += auto.multa;   sumPago += pM.total; sumLuc += lM; }
      if(rd.diftar){ sumCob += auto.diftar; sumPago += pT.total; sumLuc += lT; }
      if(rd.diftax){ sumCob += auto.diftax; sumPago += pX.total; sumLuc += lX; }

      const sumCobEl = document.getElementById("rent_sum_cobrar");
      const sumPagoEl = document.getElementById("rent_sum_pago");
      const sumLucEl  = document.getElementById("rent_sum_lucro");
      if(sumCobEl) sumCobEl.textContent = (rd.anyType ? fmtSum(sumCob) : "—");
      if(sumPagoEl) sumPagoEl.textContent = (rd.anyType ? fmtSum(sumPago) : "—");
      if(sumLucEl)  sumLucEl.textContent  = (rd.anyType ? fmtSum(sumLuc) : "—");

      // INTER: mostrar também o lucro total convertido em BRL (usando o câmbio informado)
      const brlBox = document.getElementById("rent_box_lucro_brl");
      const brlEl  = document.getElementById("rent_sum_lucro_brl");
      if(mode === "INTER"){
        if(brlBox) brlBox.style.display = "block";
        const fx = Number(calc && calc.fx ? calc.fx : 0) || 0;
        if(brlEl) brlEl.textContent = (rd.anyType && fx > 0) ? fmtBRL(sumLuc * fx) : (rd.anyType ? "Informe o câmbio" : "—");
      }else{
        if(brlBox) brlBox.style.display = "none";
        if(brlEl) brlEl.textContent = "—";
      }

      if(kpis) kpis.style.display = (rd.anyType ? "grid" : "none");
    }

    function placeRentPanel(){
      const sec = document.getElementById("rentSection");
      const aN = document.getElementById("rentAnchorNac");
      const aI = document.getElementById("rentAnchorInter");
      if(!sec || !aN || !aI) return;

      // Decide based on the selected tab (robust even when panels are hidden)
      const tabNac = document.getElementById("tabNac");
      const nacOn = tabNac ? (tabNac.getAttribute("aria-selected")==="true") : true;
      const isInter = !nacOn;

      (isInter ? aI : aN).appendChild(sec);
    }



    function brToHtml(s){
      return (s || "").trim()
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/\n/g,"<br/>");
    }
    function parseBRNumber(v){
      if(v === null || v === undefined) return 0;
      let s = String(v).trim();
      // normaliza diferentes caracteres de sinal (ex.: U+2212) para o hífen padrão
      s = s.replace(/[\u2212\u2013\u2014]/g, "-");
      if(!s) return 0;
      let x = s.replace(/[^\d,.\-]/g, "");
      if(x.includes(".") && x.includes(",")){
        x = x.replace(/\./g,"").replace(",",".");
      }else{
        x = x.replace(",",".");
      }
      const n = parseFloat(x);
      return Number.isFinite(n) ? n : 0;
    }
    function fmtBRL(n){
      return new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(n || 0);
    }
    function safeCurrency(code){
      const c = String(code || "USD").toUpperCase().replace(/[^A-Z]/g,"").slice(0,3);
      return c.length === 3 ? c : "USD";
    }
    function getInterCurrency(){
      const sel = document.getElementById("inter_cur").value;
      if(sel === "OTHER"){
        return safeCurrency(document.getElementById("inter_cur_other").value);
      }
      return safeCurrency(sel);
    }
    function fmtCur(n){
      const cur = getInterCurrency();
      try{
        return new Intl.NumberFormat("en-US", {style:"currency", currency: cur}).format(n || 0);
      }catch(e){
        return `${cur} ${(n||0).toFixed(2)}`;
      }
    }

    

function fmtUSD(n){
  try{
    return new Intl.NumberFormat("en-US", {style:"currency", currency:"USD"}).format(n || 0);
  }catch(e){
    return `USD ${(n||0).toFixed(2)}`;
  }
}
function fmtNumPT(n){
      const x = Number(n);
      const v = Number.isFinite(x) ? x : 0;
      return new Intl.NumberFormat("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}).format(v);
    }

    function intVal(id){
      const v = parseInt(String(document.getElementById(id).value||"0").replace(/[^\d\-]/g,""),10);
      return Number.isFinite(v) ? v : 0;
    }
    function val(id){ return parseBRNumber(document.getElementById(id).value); }
    function getActiveMode(){
      if(document.getElementById("tabNac").getAttribute("aria-selected")==="true") return "NAC";
      return "INTER";
    }
    function setPill(ok, text){
      const pill = document.getElementById("statusPill");
      if(!pill) return;
      pill.textContent = text;
      pill.style.borderColor = ok ? "rgba(61,220,151,.45)" : "rgba(255,204,102,.45)";
      pill.style.background = ok ? "rgba(61,220,151,.14)" : "rgba(255,204,102,.12)";
    }
    function escapeHtml(s){
      return String(s || "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }
    function ciaFullNameForAgency(ciaRaw){
      const c = String(ciaRaw || "").trim();
      const u = c.toUpperCase();
      if(u === "AD" || u === "AZUL") return "Azul";
      if(u === "LA" || u === "LATAM") return "LATAM";
      if(u === "G3" || u === "GOL") return "GOL";
      return c;
    }

    function escAttr(s){
      // safer for RF-ish environments
      return escapeHtml(s).replace(/`/g,"");
    }function escAttr(s){
      // safer for RF-ish environments
      return escapeHtml(s).replace(/`/g,"");
    }

    function normalizePaxName(name){
      return (name || "").toString().trim().toUpperCase();
    }

    // For typing: keep spaces (do not trim), only uppercase
    function normalizePaxNameInput(name){
      return (name || "").toString().toUpperCase();
    }


    function minifyRF(h){
      return String(h || "")
        .replace(/[\r\n]+/g, "")
        .replace(/>\s+</g, "><")
        .trim();
    }

    function maskRFText(s){
      const el = document.getElementById("rf_mask_numbers");
      const on = el ? el.checked : true;
      if(!on) return String(s || "");
      let out = String(s || "");
      // Proteção anti-detector de cartão: mascara apenas sequências longas "puras" (13–19 dígitos).
      // Observação: bilhete vem no formato 957-1234567890 (com hífen), então NÃO será mascarado.
      out = out.replace(/\b\d{13,19}\b/g, (m)=>`******${m.slice(-4)}`);
      return out;
    }

    function ensureTicketHyphen(s){
      let out = String(s || "").trim();
      out = out.replace(/(\d{3})\s*-\s*(\d{10})/g, "$1-$2");
      out = out.replace(/\b(\d{3})\s*(\d{10})\b/g, "$1-$2");
      return out;
    }

    function joinTicketOac(tks, oac){
      const a = String(tks || "").trim();
      const b = String(oac || "").trim();
      if(a && b) return `${a} / ${b}`;
      return a || b || "";
    }

    function toIntSafe(v){
      const n = parseInt(String(v ?? "").replace(/[^\d]/g,""), 10);
      return Number.isFinite(n) ? n : 0;
    }

    
    function applyPaxTypeVisibility(){
      const adt = Math.max(0, toIntSafe(document.getElementById("paxq_adt")?.value));
      const chd = Math.max(0, toIntSafe(document.getElementById("paxq_chd")?.value));
      const inf = Math.max(0, toIntSafe(document.getElementById("paxq_inf")?.value));
      const qty = {ADT:adt, CHD:chd, INF:inf};

      // Campos de valores (NAC / INTER)
      for(const row of document.querySelectorAll(".paxTypeRow")){
        const t = String(row.getAttribute("data-pax-type") || "").toUpperCase();
        const show = (qty[t] || 0) > 0;
        row.classList.toggle("hidden", !show);
      }

      // Rentabilização: esconder inputs de tipos não usados
      for(const cell of document.querySelectorAll(".rentPaxCell")){
        const t = String(cell.getAttribute("data-pax-type") || "").toUpperCase();
        const show = (qty[t] || 0) > 0;
        cell.classList.toggle("hidden", !show);
      }

      // Ajusta colunas do grid da rent (evita “buracos”)
      for(const grid of document.querySelectorAll('[data-role="rent-paid-grid"]')){
        const visible = Array.from(grid.querySelectorAll(".rentPaxCell")).filter(el => !el.classList.contains("hidden"));
        const n = Math.max(1, visible.length);
        grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
      }
    }

function setHiddenQtyAll(adt, chd, inf){
      for(const [t,val] of [["ADT",adt],["CHD",chd],["INF",inf]]){
        const a = String(Math.max(0, val|0));
        const n1 = document.getElementById(`nac_qty_${t}`); if(n1) n1.value = a;
        const n2 = document.getElementById(`inter_qty_${t}`); if(n2) n2.value = a;
      }
    }

    function getPaxStore(){
      const el = document.getElementById("pax_json");
      if(!el) return { ADT:[], CHD:[], INF:[] };
      const raw = String(el.value || "").trim();
      if(!raw) return { ADT:[], CHD:[], INF:[] };
      try{
        const obj = JSON.parse(raw);
        return {
          ADT: Array.isArray(obj.ADT) ? obj.ADT : [],
          CHD: Array.isArray(obj.CHD) ? obj.CHD : [],
          INF: Array.isArray(obj.INF) ? obj.INF : [],
        };
      }catch(e){
        return { ADT:[], CHD:[], INF:[] };
      }
    }

    function setPaxStore(store){
      const el = document.getElementById("pax_json");
      if(!el) return;
      el.value = JSON.stringify(store);
    }

    function reconcileArray(arr, n){
      const out = [];
      for(let i=0;i<n;i++){
        const cur = arr && arr[i] ? arr[i] : {};
        out.push({
          name: normalizePaxName(cur.name || ""),
          ticket: ensureTicketHyphen(String(cur.ticket || "")),
        });
      }
      return out;
    }

    function renderPaxFields(){
      const adt = Math.max(0, toIntSafe(document.getElementById("paxq_adt")?.value));
      const chd = Math.max(0, toIntSafe(document.getElementById("paxq_chd")?.value));
      const inf = Math.max(0, toIntSafe(document.getElementById("paxq_inf")?.value));
      const total = adt + chd + inf;

      const tag = document.getElementById("paxTotalTag");
      if(tag) tag.textContent = `Total: ${total}`;

      setHiddenQtyAll(adt, chd, inf);

      
      applyPaxTypeVisibility();
const store = getPaxStore();
      store.ADT = reconcileArray(store.ADT, adt);
      store.CHD = reconcileArray(store.CHD, chd);
      store.INF = reconcileArray(store.INF, inf);
      setPaxStore(store);

      const wrap = document.getElementById("paxFields");
      if(!wrap) return;

      const buildSection = (label, key, n)=> {
        if(n <= 0) return "";
        const rows = Array.from({length:n}).map((_,i)=>{
          const p = store[key][i] || {name:"", ticket:""};
          const idx = i+1;
          return `
            <div class="paxRow">
              <div>
                <label>Nome ${key}${idx}</label>
                <input data-role="pax-name" data-type="${key}" data-idx="${i}" value="${escapeHtml(normalizePaxName(p.name))}" placeholder="Ex.: SILVA/JOAO MR" />
              </div>
              <div>
                <label>Bilhete ${key}${idx}</label>
                <input data-role="pax-ticket" data-type="${key}" data-idx="${i}" value="${escapeHtml(p.ticket)}" placeholder="957-1234567890" />
              </div>
            </div>
          `;
        }).join("");
        return `
          <div style="margin-top:8px">
            <div class="paxSecTitle"><span>${label}</span><span class="paxTag">${key}</span></div>
            ${rows}
          </div>
        `;
      };

      wrap.innerHTML =
        buildSection("Adultos", "ADT", adt) +
        buildSection("Crianças", "CHD", chd) +
        buildSection("Infants", "INF", inf);

      syncAggregateFromStore();
    }

    function syncAggregateFromStore(){
      const store = getPaxStore();
      const order = ["ADT","CHD","INF"];
      const names = [];
      const tks = [];
      for(const k of order){
        for(const p of store[k]){
          const nm = normalizePaxName(p.name);
          const tk = ensureTicketHyphen(String(p.ticket||"").trim());
          if(nm) names.push(nm);
          if(tk) tks.push(tk);
        }
      }
      const paxEl = document.getElementById("pax");
      const tksEl = document.getElementById("tks");
      if(paxEl) paxEl.value = names.join("; ");
      if(tksEl) tksEl.value = tks.join("; ");
      updateAll();
    }

    function updatePaxStoreFromInput(target){
      const role = target?.getAttribute?.("data-role");
      if(!role) return;
      const type = target.getAttribute("data-type");
      const idx = parseInt(target.getAttribute("data-idx") || "-1", 10);
      if(!type || idx < 0) return;

      const store = getPaxStore();
      if(!store[type] || !store[type][idx]) return;

      if(role === "pax-name"){
        const upRaw = normalizePaxNameInput(target.value);
        if(upRaw !== target.value) target.value = upRaw; // keep spaces while typing
        store[type][idx].name = normalizePaxName(upRaw); // store trimmed + upper
      }else if(role === "pax-ticket"){
        const f = ensureTicketHyphen(target.value);
        if(f !== target.value) target.value = f;
        store[type][idx].ticket = f;
      }
      setPaxStore(store);
      syncAggregateFromStore();
    }

    function validateBeforeGenerate(){
      renderPaxFields();

      const adt = Math.max(0, toIntSafe(document.getElementById("paxq_adt")?.value));
      const chd = Math.max(0, toIntSafe(document.getElementById("paxq_chd")?.value));
      const inf = Math.max(0, toIntSafe(document.getElementById("paxq_inf")?.value));
      const total = adt + chd + inf;
      const errors = [];
      const ciaRaw = String(document.getElementById("cia")?.value || "");      const isNoTicket = /(^|[\s,\/])(?:AD|AZUL)($|[\s,\/])/i.test(ciaRaw.trim());

      if(total <= 0){
        errors.push("Informe ao menos 1 passageiro (QTD ADT/CHD/INF).");
        return errors;
      }

      const store = getPaxStore();
      const checkType = (key, n)=>{
        for(let i=0;i<n;i++){
          const p = store[key] && store[key][i] ? store[key][i] : {};
          const nm = String(p.name||"").trim();
          const tk = ensureTicketHyphen(String(p.ticket||"").trim());
          if(!nm){
            errors.push(`Informe o nome do ${key}${i+1}.`);
            return false;
          }
          if(!isNoTicket){
            if(!/^\d{3}-\d{10}$/.test(tk)){
              errors.push(`Informe o bilhete do ${key}${i+1} no formato 957-1234567890.`);
              return false;
            }
          }
        }
        return true;
      };
      if(!checkType("ADT", adt)) return errors;
      if(!checkType("CHD", chd)) return errors;
      if(!checkType("INF", inf)) return errors;

      if(getActiveMode() === "INTER"){
        const fx = val("inter_fx");
        if(fx <= 0) errors.push("INTER: informe o câmbio (Moeda → BRL).");

        const cur = getInterCurrency();
        if(cur !== "USD"){
          const fxUSD = val("inter_fx_usd");
          const hasFee = ["ADT","CHD","INF"].some(t => val(`inter_fee_${t}`) > 0);
          if(hasFee && fxUSD <= 0) errors.push("INTER: RC está em USD — informe o câmbio (USD → BRL).");
        }
      }

      return errors;
    }

    function chunk4(s){
      const m = String(s || "").match(/.{1,4}/g);
      return m ? m.join("-") : "";
    }
    function cleanB64Url(s){
      // mantém os caracteres válidos do base64url (inclui '-' e '_')
      return String(s || "")
        .replace(/\s+/g,"")
        .replace(/[^A-Za-z0-9\-_]/g,"");
    }
    function dechunkLegacy4(s){
      // remove SOMENTE os separadores inseridos pelo chunk4 (um '-' após cada bloco de 4 chars),
      // preservando '-' legítimo do base64url dentro do conteúdo.
      const x = cleanB64Url(s);
      let out = "";
      let cnt = 0;
      for(let i=0;i<x.length;i++){
        const ch = x[i];
        if(ch === "-" && cnt === 4){ cnt = 0; continue; } // separador
        out += ch;
        cnt++;
        if(cnt > 4){ cnt = 1; } // segurança (se vier sem separador)
      }
      return out;
    }
    function b64UrlEncode(str){
      const b64 = btoa(unescape(encodeURIComponent(String(str || ""))));
      return b64.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    }
    function b64UrlDecode(b64url){
      let b64 = String(b64url || "").replace(/-/g,"+").replace(/_/g,"/");
      while(b64.length % 4) b64 += "=";
      return decodeURIComponent(escape(atob(b64)));
    }
    function getStatePayload(){
      // legado (CRR1/RA1): salva TODOS os campos (fica grande). Mantido só por compatibilidade.
      const data = { v: 1, mode: getActiveMode(), fields: {} };
      for(const el of document.querySelectorAll("input, select, textarea")){
        if(!el.id) continue;
        if(el.id === "obsCode" || el.id === "raCode") continue;
        if(el.type === "checkbox"){ data.fields[el.id] = !!el.checked; }
        else{ data.fields[el.id] = el.value; }
      }
      return data;
    }

    function getStatePayloadV2(){
      // CRR2: salva SOMENTE o que foi preenchido (ou diferente do padrão) e só do modo atual (NAC/INTER).
      const mode = getActiveMode();
      const COMMON = new Set(["cia","prazo","loc","novo_loc","op_rf","agencia","filial","familia","pax","tks","bag","parcelamento","paxq_adt","paxq_chd","paxq_inf","pax_json","oac","rentab","rent_tipo_multa","rent_tipo_diftar","rent_tipo_diftax","rent_pago_cia_multa_adt","rent_pago_cia_multa_chd","rent_pago_cia_multa_inf","rent_pago_cia_diftar_adt","rent_pago_cia_diftar_chd","rent_pago_cia_diftar_inf","rent_pago_cia_diftax_adt","rent_pago_cia_diftax_chd","rent_pago_cia_diftax_inf"]);
      const DEFAULTS = {
        // checkboxes
        "rf_include_racode": true,
        "rf_mask_numbers": true,
        "rf_include_tks": true,

        // selects / defaults úteis
        "prazo":"Imediato",
        "parcelamento":"Sim",
        "nac_fp":"Faturado",
        "inter_fp":"Faturado",
        "inter_cur":"USD",
        "inter_incentivo":"Não",
        "inter_tipo":"Manual",

        // qty defaults
        "nac_qty_ADT":"1","nac_qty_CHD":"0","nac_qty_INF":"0",
        "inter_qty_ADT":"1","inter_qty_CHD":"0","inter_qty_INF":"0",
      };

      const fields = {};
      // Para manter o CRR curto: não incluir campos gigantes (máscaras do GDS). Esses campos continuam no e-mail/OP.
      const SKIP_CRR = new Set(["pax","tks"]); 
      for(const el of document.querySelectorAll("input, select, textarea")){
        if(!el.id) continue;
        if(el.id === "obsCode" || el.id === "raCode") continue;

        const id = el.id;
        if(SKIP_CRR && SKIP_CRR.has(id)) continue;
        const isCommon = COMMON.has(id);
        const isRF = id.startsWith("rf_");
        const isNac = id.startsWith("nac_");
        const isInter = id.startsWith("inter_");

        const relevant = isRF || isCommon || (mode === "NAC" ? isNac : isInter);
        if(!relevant) continue;

        if(el.type === "checkbox"){
          const cur = !!el.checked;
          const def = (id in DEFAULTS) ? !!DEFAULTS[id] : false;
          if(cur !== def) fields[id] = cur;
          continue;
        }

        const v = String(el.value ?? "");
        if(!v.trim()) continue;

        if(id in DEFAULTS && v === String(DEFAULTS[id])) continue;
        fields[id] = v;
      }

      return { v: 2, m: mode, f: fields };
    }

    
    // ----- LZ-String (compactação offline para CRR3) -----
    // Implementação baseada em lz-string (pieroxy). Usamos apenas compressToEncodedURIComponent / decompressFromEncodedURIComponent.
    const LZString = (function(){
      const f = String.fromCharCode;
      const keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
      const baseReverseDic = {};

      function getBaseValue(alphabet, character) {
        if(!baseReverseDic[alphabet]) {
          baseReverseDic[alphabet] = {};
          for (let i=0; i<alphabet.length; i++) baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
        return baseReverseDic[alphabet][character];
      }

      function _compress(uncompressed, bitsPerChar, getCharFromInt) {
        if (uncompressed == null) return "";
        let i, value;
        const context_dictionary = {};
        const context_dictionaryToCreate = {};
        let context_c = "";
        let context_wc = "";
        let context_w = "";
        let context_enlargeIn = 2;
        let context_dictSize = 3;
        let context_numBits = 2;
        const context_data = [];
        let context_data_val = 0;
        let context_data_position = 0;

        function writeBit(bit){
          context_data_val = (context_data_val << 1) | bit;
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
        }
        function writeBits(numBits, val){
          for (i=0;i<numBits;i++){
            writeBit(val & 1);
            val >>= 1;
          }
        }

        for (let ii=0; ii<uncompressed.length; ii++){
          context_c = uncompressed.charAt(ii);
          if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
            context_dictionary[context_c] = context_dictSize++;
            context_dictionaryToCreate[context_c] = true;
          }

          context_wc = context_w + context_c;
          if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
            context_w = context_wc;
          } else {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0) < 256) {
                writeBits(context_numBits, 0);
                value = context_w.charCodeAt(0);
                writeBits(8, value);
              } else {
                writeBits(context_numBits, 1);
                value = context_w.charCodeAt(0);
                writeBits(16, value);
              }
              context_enlargeIn--;
              if (context_enlargeIn === 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              writeBits(context_numBits, value);
            }

            context_enlargeIn--;
            if (context_enlargeIn === 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }

            context_dictionary[context_wc] = context_dictSize++;
            context_w = String(context_c);
          }
        }

        if (context_w !== "") {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              writeBits(context_numBits, 0);
              value = context_w.charCodeAt(0);
              writeBits(8, value);
            } else {
              writeBits(context_numBits, 1);
              value = context_w.charCodeAt(0);
              writeBits(16, value);
            }
            context_enlargeIn--;
            if (context_enlargeIn === 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            writeBits(context_numBits, value);
          }

          context_enlargeIn--;
          if (context_enlargeIn === 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
        }

        writeBits(context_numBits, 2);

        while (true) {
          context_data_val = (context_data_val << 1);
          if (context_data_position === bitsPerChar - 1) {
            context_data.push(getCharFromInt(context_data_val));
            break;
          } else context_data_position++;
        }

        return context_data.join("");
      }

      function _decompress(length, resetValue, getNextValue) {
        const dictionary = [];
        let next;
        let enlargeIn = 4;
        let dictSize = 4;
        let numBits = 3;
        let entry = "";
        const result = [];
        let i;
        let w;
        let bits, resb, maxpower, power;
        const data = { val: getNextValue(0), position: resetValue, index: 1 };

        for (i=0; i<3; i++) dictionary[i] = i;

        function readBits(nbits){
          bits = 0;
          maxpower = Math.pow(2, nbits);
          power = 1;
          while (power !== maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          return bits;
        }

        next = readBits(2);
        switch (next) {
          case 0:
            w = f(readBits(8));
            break;
          case 1:
            w = f(readBits(16));
            break;
          case 2:
            return "";
          default:
            return null;
        }

        dictionary[3] = w;
        result.push(w);

        while (true) {
          if (data.index > length) return null;

          const c = readBits(numBits);

          switch (c) {
            case 0:
              dictionary[dictSize++] = f(readBits(8));
              next = dictSize - 1;
              enlargeIn--;
              break;
            case 1:
              dictionary[dictSize++] = f(readBits(16));
              next = dictSize - 1;
              enlargeIn--;
              break;
            case 2:
              return result.join("");
            default:
              next = c;
          }

          if (enlargeIn === 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }

          if (dictionary[next]) {
            entry = dictionary[next];
          } else {
            if (next === dictSize) entry = w + w.charAt(0);
            else return null;
          }
          result.push(entry);

          dictionary[dictSize++] = w + entry.charAt(0);
          enlargeIn--;

          w = entry;

          if (enlargeIn === 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }
        }
      }

      return {
        compressToEncodedURIComponent: function(input){
          if (input == null) return "";
          return _compress(input, 6, function(a){ return keyStrUriSafe.charAt(a); });
        },
        decompressFromEncodedURIComponent: function(input){
          if (input == null) return "";
          if (input === "") return null;
          input = input.replace(/ /g, "+");
          return _decompress(input.length, 32, function(index){ return getBaseValue(keyStrUriSafe, input.charAt(index)); });
        }
      };
    })();


    // ----- CRR4: mesmo conteúdo do CRR3, mas com chaves compactadas (reduz bem o tamanho) -----
    // Mapeia ids de campos -> índice base36 (ex.: "cia" -> "a") antes de compactar.
    const CRR4_KEYS = ["themeSel","rentab","op_rf","agencia","filial","rent_tipo_multa","rent_tipo_diftar","rent_tipo_diftax","rent_pago_cia_multa_adt","rent_pago_cia_multa_chd","rent_pago_cia_multa_inf","rent_cobrar_ag_multa","rent_lucro_multa","rent_pago_cia_diftar_adt","rent_pago_cia_diftar_chd","rent_pago_cia_diftar_inf","rent_cobrar_ag_diftar","rent_lucro_diftar","rent_pago_cia_diftax_adt","rent_pago_cia_diftax_chd","rent_pago_cia_diftax_inf","rent_cobrar_ag_diftax","rent_lucro_diftax","cia","prazo","loc","oac","novo_loc","paxq_adt","paxq_chd","paxq_inf","pax_json","familia","pax","tks","bag","parcelamento","nac_fp","nac_link","nac_qty_ADT","nac_old_ADT","nac_new_ADT","nac_tax_ADT","nac_du_ADT","nac_pen_ADT","nac_qty_CHD","nac_old_CHD","nac_new_CHD","nac_tax_CHD","nac_du_CHD","nac_pen_CHD","nac_qty_INF","nac_old_INF","nac_new_INF","nac_tax_INF","nac_du_INF","nac_pen_INF","nac_services_on","nac_services_brl","nac_folio_on","nac_folio_text","nac_folio_agencia","nac_voos","nac_regras","inter_cur","inter_cur_other","inter_fx","inter_fx_usd","inter_incentivo","inter_tipo","inter_fp","inter_link","inter_qty_ADT","inter_fare_ADT","inter_tax_ADT","inter_du_ADT","inter_pen_ADT","inter_fee_ADT","inter_qty_CHD","inter_fare_CHD","inter_tax_CHD","inter_du_CHD","inter_pen_CHD","inter_fee_CHD","inter_qty_INF","inter_fare_INF","inter_tax_INF","inter_du_INF","inter_pen_INF","inter_fee_INF","inter_endosso_on","inter_endosso_text","inter_endosso_agencia","inter_original","inter_voos","inter_interno","rf_include_racode","rf_mask_numbers","rf_include_tks"];
    const CRR4_ID2K = {};
    const CRR4_K2ID = {};
    for(let i=0;i<CRR4_KEYS.length;i++){ 
      const id = CRR4_KEYS[i];
      const k = i.toString(36);
      CRR4_ID2K[id] = k;
      CRR4_K2ID[k] = id;
    }

    function _compactNumberMaybe(s){
      if(typeof s !== "string") return null;
      let x = s.trim();
      x = x.replace(/[\u2212\u2013\u2014]/g, "-");
      if(!x) return null;
      // aceita "300", "300.5", "300,50", "1.234,56"
      if(x.includes(",") && x.includes(".")){ x = x.replace(/\./g,"").replace(",","."); }
      else if(x.includes(",") && !x.includes(".")){ x = x.replace(",","."); }
      if(!/^[-+]?\d+(?:\.\d+)?$/.test(x)) return null;
      const n = Number(x);
      if(!isFinite(n)) return null;
      return n;
    }

    function getStatePayloadV4(){
      const p = getStatePayloadV2(); // base
      const modeStr = String(p.m || p.mode || "NAC").toUpperCase();
      const mode = (modeStr === "INTER") ? 1 : 0;
      const src = p.f || p.fields || {};
      const out = {};
      for(const [id,val] of Object.entries(src)){
        const k = CRR4_ID2K[id] || id; // fallback (ainda funciona, só fica maior)
        let v = val;
        if(typeof v === "boolean") v = v ? 1 : 0;
        else if(typeof v === "string"){
          const n = _compactNumberMaybe(v);
          if(n !== null) v = n;
        }
        out[k] = v;
      }
      return { v: 4, m: mode, f: out };
    }

function buildCRRCode(){
      // padrão agora: CRR4 (compactado + chaves curtas)
      const payload = getStatePayloadV4();
      const json = JSON.stringify(payload);
      const packed = LZString.compressToEncodedURIComponent(json);
      return "CRR4-" + packed;
    }


// ===== CRR5 (curto via Cloudflare Worker + Upstash) =====
// Mantém o CRR4 local como fallback/offline.
const CRR5_API = "https://crr-api.rexturfacilita.workers.dev/".replace(/\/+$/,"");

function extractCRR5(text){
  const compact = String(text || "").replace(/\s+/g,"");
  const mm = compact.match(/CRR5-([A-Za-z0-9]{6,64})/i);
  if(!mm) return null;
  return `CRR5-${mm[1].toLowerCase()}`;
}

async function saveCRR5FromCRR4(crr4){
  const r = await fetch(`${CRR5_API}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: String(crr4 || "") }),
  });
  if(!r.ok) throw new Error("Falha ao salvar CRR curto");
  const data = await r.json().catch(()=>null);
  if(!data || !data.id) throw new Error("Resposta inválida do servidor");
  return `CRR5-${String(data.id).toLowerCase()}`;
}

async function loadCRR5ToCRR4(crr5){
  const id = String(crr5 || "").trim().replace(/^CRR5-/i,"").toLowerCase();
  const r = await fetch(`${CRR5_API}/load?id=${encodeURIComponent(id)}`);
  if(!r.ok) throw new Error("CRR curto não encontrado (ou expirou)");
  const data = await r.json().catch(()=>null);
  if(!data || typeof data.payload !== "string") throw new Error("Resposta inválida do servidor");
  return data.payload;
}

const __CRR5_CACHE = new Map(); // key: CRR4 -> CRR5

function getCRRCodeForEmail(){
  const ta = document.getElementById("raCode");
  const c5 = extractCRR5(ta ? ta.value : "");
  return c5 || buildCRRCode();
}

function invalidateCRR5OnEdit(){
  const ta = document.getElementById("raCode");
  if(!ta) return;
  // se estava "travado" em CRR5, destrava para obrigar gerar um novo após qualquer ajuste
  if(ta.dataset && ta.dataset.manual === "1" && extractCRR5(ta.value)){
    ta.dataset.manual = "0";
    ta.dataset.sig = "";
  }
}

async function ensureCRR5Current(){
  const crr4 = buildCRRCode();
  const ta = document.getElementById("raCode");
  const existing5 = extractCRR5(ta ? ta.value : "");

  // Reaproveita CRR5 se ele foi gerado para este mesmo CRR4 (assinatura)
  if(existing5 && ta && ta.dataset && ta.dataset.sig === crr4){
    __CRR5_CACHE.set(crr4, existing5);
    return existing5;
  }

  const cached = __CRR5_CACHE.get(crr4);
  if(cached){
    if(ta){
      ta.dataset.manual = "1";
      ta.dataset.sig = crr4;
      ta.value = cached;
    }
    return cached;
  }

  const crr5 = await saveCRR5FromCRR4(crr4);
  __CRR5_CACHE.set(crr4, crr5);
  if(ta){
    ta.dataset.manual = "1";
    ta.dataset.sig = crr4;
    ta.value = crr5;
  }
  return crr5;
}



    function loadCRRCode(code){
      // aceita CRR colado puro, dentro de texto maior (OBS RF / e-mail), com quebras de linha, etc.
      let full = String(code || "");
      const compact = full.replace(/\s+/g,"");
      const mm = compact.match(/(?:CRR4|CRR3|CRR2|CRR1|RA1)-[A-Za-z0-9\-_$\+]+/i);
      let c = mm ? mm[0] : compact.trim();

      const up = c.toUpperCase();
      const prefix =
        up.startsWith("CRR4-") ? "CRR4-" :
        (up.startsWith("CRR3-") ? "CRR3-" :
        (up.startsWith("CRR2-") ? "CRR2-" :
        (up.startsWith("CRR1-") ? "CRR1-" :
        (up.startsWith("RA1-") ? "RA1-" : ""))));
      if(!prefix) throw new Error("Código inválido");

      // CRR2 pode vir sem hífen, CRR1/RA1 vinha "chunkado" — unchunk resolve ambos
      const raw = (prefix === "CRR1-" || prefix === "RA1-")
        ? dechunkLegacy4(c.slice(prefix.length))
        : (prefix === "CRR2-" ? cleanB64Url(c.slice(prefix.length)) : c.slice(prefix.length));
      if(!raw || raw.length < 16) throw new Error("Código incompleto");

      let payloadText = "";
      try{
        if(prefix === "CRR4-" || prefix === "CRR3-"){
          payloadText = LZString.decompressFromEncodedURIComponent(raw);
          if(payloadText == null) throw new Error("Falha ao decodificar");
        } else {
          payloadText = b64UrlDecode(raw);
        }
      }catch(e){
        throw new Error("Falha ao decodificar");
      }

      let payload = null;
      try{
        payload = JSON.parse(payloadText);
      }catch(e){
        throw new Error("Conteúdo inválido");
      }

      // Normaliza formatos (v1 vs v2)
      let mode = payload.mode || payload.m || "NAC";
      let fields = payload.fields || payload.f || {};

      // CRR4: traduz chaves compactadas -> ids reais e normaliza modo (0/1)
      if(payload && payload.v === 4){
        const decoded = {};
        for(const [k,v] of Object.entries(fields)){
          const id = CRR4_K2ID[k] || k;
          decoded[id] = v;
        }
        fields = decoded;
        mode = (payload.m === 1 || payload.m === "1") ? "INTER" : "NAC";
      }


      // reseta tudo antes de aplicar (garante que campos omitidos voltem ao padrão)
      const silentClear = true;
      clearAll(silentClear);

      // aplica modo primeiro (pra mostrar os campos certos)
      if(String(mode).toUpperCase() === "INTER") {
        switchTab("tabInter");
      } else {
        switchTab("tabNac");
      }

      // aplica campos
      for(const [k,v] of Object.entries(fields)){
        const el = document.getElementById(k);
        if(!el) continue;

        if(el.type === "checkbox"){
          // CRR4 usa 1/0 para compactar booleanos
          el.checked = (v === true || v === 1 || v === "1" || v === "true" || v === "on" || v === "yes");
          continue;
        }
        if(el.type === "radio"){
          // normaliza (alguns valores podem vir como número no CRR4)
          el.checked = (String(el.value) === String(v));
          continue;
        }
        if(["loc","novo_loc","oac","familia"].includes(k) && typeof v === "string"){ el.value = v.toUpperCase(); }
        else{ el.value = v; }
      }

      // migração: CRR antigos (campos únicos) -> novo formato por tipo (preenche em ADT como padrão)
      const migrateOne = (oldId, newId)=>{
        if(!(oldId in fields)) return;
        if((newId in fields)) return;
        const el = document.getElementById(newId);
        if(!el) return;
        if(String(el.value || "").trim()) return;
        el.value = fields[oldId];
      };
      migrateOne("rent_pago_cia_multa","rent_pago_cia_multa_adt");
      migrateOne("rent_pago_cia_diftar","rent_pago_cia_diftar_adt");
      migrateOne("rent_pago_cia_diftax","rent_pago_cia_diftax_adt");

      renderPaxFields();
      updateAll();
      showToast("Cálculo carregado!");
      return true;
    }


    // Compatibilidade: aceitar funções antigas
    function buildRACode(){ return buildCRRCode(); }
    function loadRACode(code){ return loadCRRCode(code); }


    // ---------- calculations ----------
    function calcNac(){
      let total = 0;
      let paxCount = 0;
      const rows = [];
      for(const t of PAX_TYPES){
        const qty = intVal(`nac_qty_${t}`);
        if(qty <= 0) continue;
        paxCount += qty;
        const oldFare = val(`nac_old_${t}`);
        const newFare = val(`nac_new_${t}`);
        const diffFare = newFare - oldFare;
        const diffTax  = val(`nac_tax_${t}`);
        const du       = val(`nac_du_${t}`);
        const pen      = val(`nac_pen_${t}`);
        const perPax = diffFare + diffTax + du + pen;
        total += perPax * qty;
        rows.push({t, qty, oldFare, newFare, diffFare, diffTax, du, pen, perPax, totalTipo: perPax*qty});
      }
      const servicesOn = !!document.getElementById("nac_services_on")?.checked;
      const services = servicesOn ? val("nac_services_brl") : 0;
      const totalNet = Math.max(0, total - services);
      const avg = paxCount > 0 ? totalNet / paxCount : 0;
      document.getElementById("nac_total_brl").textContent = fmtBRL(totalNet);
      const _avgEl = document.getElementById("nac_total_avg"); if(_avgEl) _avgEl.textContent = fmtBRL(avg);
      return {totalBRL: totalNet, totalBRLGross: total, servicesBRL: services, avgBRL: avg, paxCount, rows};
    }

    function calcInter(){
  let totalCur = 0;
  let paxCount = 0;
  const rows = [];
  const cur = getInterCurrency();
  const fx = val("inter_fx"); // 1 CUR -> BRL
  const fxUSD = val("inter_fx_usd"); // 1 USD -> BRL (para RC)
  let hasFeeUSD = false;

  for(const t of PAX_TYPES){
    const qty = intVal(`inter_qty_${t}`);
    if(qty <= 0) continue;
    paxCount += qty;

    const fare = val(`inter_fare_${t}`);
    const tax  = val(`inter_tax_${t}`);
    const du   = val(`inter_du_${t}`);
    const pen  = val(`inter_pen_${t}`);

    const feeUSD = val(`inter_fee_${t}`); // RC sempre em USD
    if(feeUSD) hasFeeUSD = true;

    let feeCur = feeUSD;
    if(cur !== "USD"){
      // converte USD -> CUR via BRL: (USD->BRL)/(CUR->BRL)
      feeCur = (fx > 0 && fxUSD > 0) ? feeUSD * (fxUSD / fx) : 0;
    }

    const perPax = fare + tax + du + pen + feeCur;
    totalCur += perPax * qty;
    rows.push({t, qty, fare, tax, du, pen, feeUSD, feeCur, perPax, totalTipo: perPax*qty});
  }

  const totalBRL = fx > 0 ? totalCur * fx : 0;
  document.getElementById("inter_total_cur").textContent = fmtCur(totalCur);
  document.getElementById("inter_total_brl").textContent = fmtBRL(totalBRL);

  const rcNeedsUsdFx = (cur !== "USD" && hasFeeUSD && !(fxUSD > 0));
  return {totalCur, fx, fxUSD, totalBRL, paxCount, cur, rows, rcNeedsUsdFx};
}

// ---------- common ----------
    function getCommon(){
      return {
        cia: document.getElementById("cia").value.trim(),
        prazo: (document.getElementById("prazo") ? document.getElementById("prazo").value.trim() : "Imediato"),
        loc: document.getElementById("loc").value.trim().toUpperCase(),
        novo_loc: (document.getElementById("novo_loc") ? document.getElementById("novo_loc").value.trim().toUpperCase() : ""),
        pax: document.getElementById("pax").value.trim(),
        tks: document.getElementById("tks").value.trim(),
        oac: (document.getElementById("oac") ? document.getElementById("oac").value.trim().toUpperCase() : ""),
        familia: document.getElementById("familia").value.trim().toUpperCase(),
        bag: document.getElementById("bag").value.trim(),
        parcelamento: document.getElementById("parcelamento").value.trim(),
        rentab: !!(document.getElementById("rentab") && document.getElementById("rentab").checked),
      };
    }

    
    function buildPaxTicketPairsHtml(common){
      // Preferir o cadastro por PAX (Nome/Bilhete) para vincular corretamente.
      const store = getPaxStore();
      const ciaRaw = String(common?.cia || "");      const isNoTicket = /(^|[\s,\/])(?:AD|AZUL)($|[\s,\/])/i.test(ciaRaw.trim());
      const pairs = [];
      function push(arr){
        for(const it of (arr || [])){
          const n = String(it?.name || "").trim();
          const t = String(it?.ticket || "").trim();
          if(!n && !t) continue;
          const nn = n || "(sem nome)";
          if(isNoTicket){
            pairs.push(`${escapeHtml(nn)}`);
          } else {
            const tt = t || "(sem bilhete)";
            pairs.push(`${escapeHtml(nn)} — ${escapeHtml(tt)}`);
          }
        }
      }
      push(store.ADT); push(store.CHD); push(store.INF);

      if(pairs.length){
        return pairs.join("<br>");
      }
      // Fallback (quando não preenchido por PAX)
      const p = String(common?.pax || "").trim();
      const t = String(common?.tks || "").trim();
      if(p && t){
        const names = p.split(/\r?\n/).map(s=> String(s||"").trim()).filter(Boolean);
        const tks = t.split(/[;\r?\n]+/).map(s=> String(s||"").trim()).filter(Boolean);
        if(names.length > 1 && names.length === tks.length){
          return names.map((n,i)=> `${escapeHtml(n)} — ${escapeHtml(tks[i])}`).join("<br>");
        }
        return `${escapeHtml(p)} — ${escapeHtml(t)}`;
      }
      return escapeHtml(p || t || "");
    }
// ---------- email templates (Outlook) ----------
    function buildEmailSectionBlock(title, content, opts){
      const o = opts || {};
      const strong = !!o.strong;
      const isHtml = !!o.html;
      const useMono = o.mono !== false;
      const value = String(content || "").trim();
      const emptyHtml = `<span style="color:#999">${escapeHtml(o.emptyLabel || "-")}</span>`;
      const bodyHtml = isHtml ? (value || emptyHtml) : (value ? brToHtml(value) : emptyHtml);
      const headerBg = strong ? "#6d28d9" : "#efe8ff";
      const headerColor = strong ? "#ffffff" : "#4c1d95";
      const bodyBg = strong ? "#f7f3ff" : "#fbf9ff";
      const border = strong ? "#d9c8f2" : "#e4daf8";
      const marginTop = strong ? 22 : 18;
      const bodyFont = useMono ? 'Consolas, &quot;Courier New&quot;, monospace' : 'Arial, sans-serif';
      const bodyFontSize = useMono ? '14px' : '13px';
      const bodyLineHeight = useMono ? '1.55' : '1.5';
      const extraBodyStyle = o.bodyStyle ? `; ${o.bodyStyle}` : '';
      return `
        <table border="0" cellspacing="0" cellpadding="0" width="760" style="width:760px; max-width:760px; margin:${marginTop}px 0 0; mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse;">
          <tr>
            <td style="padding:0;">
              <div style="padding:10px 12px; background:${headerBg}; color:${headerColor}; font-weight:900; border-radius:12px; letter-spacing:.3px; border:${strong ? 'none' : '1px solid ' + border};">${escapeHtml(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;">
              <div style="padding:14px 14px; border:1px solid ${border}; border-radius:12px; background:${bodyBg}; font-family:${bodyFont}; font-size:${bodyFontSize}; line-height:${bodyLineHeight}${extraBodyStyle}">${bodyHtml}</div>
            </td>
          </tr>
        </table>
      `.trim();
    }
    function buildEmailHtmlNac(){
      const common = getCommon();
      const calc = calcNac();
      const crr = getCRRCodeForEmail();
      const crrEmailHtml = escapeHtml(crr) + (common.rentab ? "<br/>@#" : "");
      const fp = document.getElementById("nac_fp").value;
      const link = document.getElementById("nac_link").value.trim();
      const voos = document.getElementById("nac_voos").value.trim();
      const folioOn = !!(document.getElementById("nac_folio_on") && document.getElementById("nac_folio_on").checked);
      const folioAgencyOn = !!(document.getElementById("nac_folio_agencia") && document.getElementById("nac_folio_agencia").checked);
      const folio = (document.getElementById("nac_folio_text") ? document.getElementById("nac_folio_text").value.trim() : "");
      const folioRow = (folioOn && folio && folioAgencyOn) ? `<tr><td style="background-color:#efe9f8; padding:6px 8px; border:1px solid #e6def3;"><b>Fólio</b></td><td style="background-color:#ffffff; padding:6px 8px; border:1px solid #e6def3;">${escapeHtml(folio)}</td></tr>` : "";

      const regrasUserRaw = document.getElementById("nac_regras").value.trim();
      const isAzul = /(^|[\s,\/])(?:AD|AZUL)($|[\s,\/])/i.test(String(common.cia||"").trim());
      const isLatamGol = /(^|[\s,\/])(?:LA|LATAM|G3|GOL)($|[\s,\/])/i.test(String(common.cia||"").trim());
      const regrasUser = (function(){
        let t = regrasUserRaw || "";
        if(!isAzul && !isLatamGol) return t;

        // Se o usuário colou alguma regra automática no campo "Regras",
        // removemos daqui para não duplicar (ela já aparece na lista de bullets).
        const lines = t.split(/\r?\n/).filter(l => {
          const n = (l || "").toLowerCase();

          const isAz = n.includes("reemiss") && n.includes("azul") && (n.includes("crédito") || n.includes("credito"));
          const isLG = n.includes("novo loc") && n.includes("localizador original") && n.includes("cancel");

          return !(isAz || isLG);
        });

        return lines.join("\n").trim();
      })();

const servicesRow = (calc.servicesBRL && calc.servicesBRL > 0)
        ? `
            <tr>
              <td colspan="8" style="text-align:right"><b>Serviços (abatimento)</b></td>
              <td style="text-align:right"><b>-${fmtBRL(calc.servicesBRL)}</b></td>
            </tr>
          `
        : "";

      const paxRows = calc.rows.map(r => `
        <tr>
          <td><b>${r.t}</b> <span style="display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:#EDE9FE;border:1px solid #C4B5FD;color:#111827;font-size:12px;font-weight:700;line-height:18px;">x${r.qty}</span></td>
          <td style="text-align:right">${fmtBRL(r.oldFare)}</td>
          <td style="text-align:right">${fmtBRL(r.newFare)}</td>
          <td style="text-align:right">${fmtBRL(r.diffFare)}</td>
          <td style="text-align:right">${fmtBRL(r.diffTax)}</td>
          <td style="text-align:right">${fmtBRL(r.du)}</td>
          <td style="text-align:right">${fmtBRL(r.pen)}</td>
          <td style="text-align:right"><b>${fmtBRL(r.perPax)}</b></td>
          <td style="text-align:right"><b>${fmtBRL(r.totalTipo)}</b></td>
        </tr>
      `);

      const payLabel = "Faturado ou Cartão de Crédito";
      const linkHref = link ? ( /^https?:\/\//i.test(link) ? link : `https://${link}` ) : "";
      const linkLine = `
        <p style="margin:8px 0 0">Forma de pagamento: <b>${payLabel}</b></p>
        ${link ? `<p style="margin:6px 0 0">Link de pagamento: <b><a href="${escapeHtml(linkHref)}" target="_blank" rel="noopener">${escapeHtml(link)}</a></b></p>` : ""}
      `.trim();

      const azulRuleLi = isAzul ? `<li>${escapeHtml(AZUL_RULE_TEXT)}</li>` : "";
      const latamGolRuleLi = (isLatamGol && !isAzul) ? `<li>${escapeHtml(LATAM_GOL_RULE_TEXT)}</li>` : "";
      const regrasPadrao = `
        <ul style="margin:8px 0 0; padding-left:18px">
          ${azulRuleLi}
          ${latamGolRuleLi}
<li>Solicitações com menos de <b>2h</b> do embarque original poderão acarretar em multa de <b>no show</b>.</li>
        </ul>
      `;
const regrasExtra = regrasUser ? `<p style="margin:8px 0 0"><b>Observações:</b><br/>${brToHtml(regrasUser)}</p>` : "";

      return `
        <div style="font-family:Arial, sans-serif; font-size:13px; color:#0b0f17">
          <p>Segue abaixo cálculo de reemissão conforme solicitado.</p>
          

          <table border="1" cellspacing="0" cellpadding="6" width="760" style="width:760px; max-width:760px; margin:0; mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border:1px solid #c7ced9">
            <tr><td colspan="2" style="background-color:#d9cce3; font-weight:bold; text-align:center; padding:8px; font-size:14px;">CÁLCULO DE REEMISSÃO NACIONAL</td></tr>
            <tr><td colspan="2" style="text-align:center; padding:8px;"><b>ATENÇÃO:</b> CONFIRA TODOS OS DADOS ANTES DE APROVAR A REEMISSÃO.<br/>VALORES SUJEITOS A ALTERAÇÃO</td></tr>
            <tr><td style="width:32%"><b>Cia Aérea</b></td><td>${escapeHtml(ciaFullNameForAgency(common.cia))}</td></tr>
            <tr><td><b>Prazo</b></td><td>${escapeHtml(common.prazo)}</td></tr>
            <tr><td><b>Localizador</b></td><td>${escapeHtml(common.loc)}</td></tr>
            ${common.novo_loc ? `<tr><td><b>Novo LOC</b></td><td>${escapeHtml(common.novo_loc)}</td></tr>` : ""}
            <tr><td><b>Passageiro(s) / Bilhete(s)</b></td><td>${buildPaxTicketPairsHtml(common)}</td></tr>${common.oac ? `<tr><td><b>OAC</b></td><td>${escapeHtml(common.oac)}</td></tr>` : ``}
            <tr><td><b>Família Tarifária</b></td><td>${escapeHtml(common.familia)}</td></tr>
            <tr><td><b>Bagagem</b></td><td>${escapeHtml(common.bag)}</td></tr>
<tr><td><b>Permite parcelamento?</b></td><td>${escapeHtml(common.parcelamento)}</td></tr>
          ${folioRow}
          </table>

          <p style="margin:12px 0 6px"><b>Descritivo de valores (por pax)</b></p>
          <table border="1" cellspacing="0" cellpadding="6" width="760" style="width:760px; max-width:760px; margin:0; mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border:1px solid #c7ced9">
            <tr>
              <th style="background-color:#a99ac5; color:white; text-align:left">Tipo</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Tarifa antiga</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Tarifa nova</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Dif. tarifa</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Dif. taxa</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">DU/Rav</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Multa</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Total por pax</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Total (tipo)</th>
            </tr>
            ${paxRows.join("") || `<tr><td colspan="9">Sem valores informados.</td></tr>`}
            ${servicesRow}
            <tr>
              <td colspan="8" style="text-align:right; background-color:#d9cce3"><b>TOTAL A PAGAR (BRL)</b></td>
              <td style="text-align:right; background-color:#d9cce3"><b>${fmtBRL(calc.totalBRL)}</b></td>
            </tr>
          </table>

          ${linkLine}
          <p style="margin:6px 0 0"><i>*Após o preenchimento, responda o e-mail para darmos continuidade ao processo</i></p>
          <p style="margin:6px 0 0">Em respeito a LGPD, não é permitido trafegar informações que envolvam dados de cartão de crédito.</p>

          ${buildEmailSectionBlock("VOOS SIMULADOS", voos, { strong:true })}
          ${buildEmailSectionBlock("REGRAS", `${regrasPadrao}${regrasExtra}`, { html:true, mono:false, bodyStyle:'padding:14px 16px;' })}
          <p style="margin:6px 0 0; font-size:9px; color:#999">${crrEmailHtml}</p>
        </div>
      `.trim();
    }

    function buildEmailHtmlInter(){
      const common = getCommon();
      const calc = calcInter();
      const crr = getCRRCodeForEmail();
      const crrEmailHtml = escapeHtml(crr) + (common.rentab ? "<br/>@#" : "");
      const incentivo = document.getElementById("inter_incentivo").value;
      const tipo = document.getElementById("inter_tipo").value;
      const fp = document.getElementById("inter_fp").value;
      const link = document.getElementById("inter_link").value.trim();

      const original = document.getElementById("inter_original").value.trim();
      const voos = document.getElementById("inter_voos").value.trim();
      const interno = document.getElementById("inter_interno").value.trim();

      const endossoOn = !!(document.getElementById("inter_endosso_on") && document.getElementById("inter_endosso_on").checked);
      const endossoAgencyOn = !!(document.getElementById("inter_endosso_agencia") && document.getElementById("inter_endosso_agencia").checked);
      const endosso = (document.getElementById("inter_endosso_text") ? document.getElementById("inter_endosso_text").value.trim() : "");
      const endossoRow = (endossoOn && endosso && endossoAgencyOn) ? `<tr><td style="background-color:#efe9f8; padding:6px 8px; border:1px solid #e6def3;"><b>Endosso</b></td><td style="background-color:#ffffff; padding:6px 8px; border:1px solid #e6def3;">${escapeHtml(endosso)}</td></tr>` : "";

      const isAzul = /(^|[\s,\/])(?:AD|AZUL)($|[\s,\/])/i.test(String(common.cia||"").trim());
      const azulMsg = "";


      const servicesRow = (calc.servicesBRL && calc.servicesBRL > 0)
        ? `
            <tr>
              <td colspan="8" style="text-align:right"><b>Serviços (abatimento)</b></td>
              <td style="text-align:right"><b>-${fmtBRL(calc.servicesBRL)}</b></td>
            </tr>
          `
        : "";

      const paxRows = calc.rows.map(r => `
        <tr>
          <td><b>${r.t}</b> <span style="display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:#EDE9FE;border:1px solid #C4B5FD;color:#111827;font-size:12px;font-weight:700;line-height:18px;">x${r.qty}</span></td>
          <td style="text-align:right">${fmtCur(r.fare)}</td>
          <td style="text-align:right">${fmtCur(r.tax)}</td>
          <td style="text-align:right">${fmtCur(r.du)}</td>
          <td style="text-align:right">${fmtCur(r.pen)}</td>
          <td style="text-align:right">${fmtUSD(r.feeUSD)}</td>
          <td style="text-align:right"><b>${fmtCur(r.perPax)}</b></td>
          <td style="text-align:right"><b>${fmtCur(r.totalTipo)}</b></td>
        </tr>
      `);

      const payLabel = "Faturado ou Cartão de Crédito";
      const linkHref = link ? ( /^https?:\/\//i.test(link) ? link : `https://${link}` ) : "";
      const linkLine = `
        <p style="margin:8px 0 0">Forma de pagamento: <b>${payLabel}</b></p>
        ${link ? `<p style="margin:6px 0 0">Link de pagamento: <b><a href="${escapeHtml(linkHref)}" target="_blank" rel="noopener">${escapeHtml(link)}</a></b></p>` : ""}
      `.trim();

      const fxLine = calc.fx > 0
        ? `<p style="margin:6px 0 0"><b>Câmbio informado:</b> 1 ${escapeHtml(calc.cur)} = ${calc.fx.toFixed(4).replace(".",",")} BRL • <b>Total (BRL):</b> ${fmtBRL(calc.totalBRL)}</p>`
        : `<p style="margin:6px 0 0; color:#6b4b00"><b>Atenção:</b> informe o câmbio (Moeda → BRL) para gerar o total em BRL.</p>`;

      return `
        <div style="font-family:Arial, sans-serif; font-size:13px; color:#0b0f17">
          <p>Segue abaixo cálculo de reemissão conforme solicitado.</p>
          ${azulMsg}

          <table border="1" cellspacing="0" cellpadding="6" width="760" style="width:760px; max-width:760px; margin:0; mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border:1px solid #c7ced9">
            <tr><td colspan="2" style="background-color:#d9cce3; font-weight:bold; text-align:center; padding:8px; font-size:14px;">CÁLCULO DE REEMISSÃO INTERNACIONAL</td></tr>
            <tr><td colspan="2" style="text-align:center; padding:8px;"><b>ATENÇÃO:</b> CONFIRA TODOS OS DADOS ANTES DE APROVAR A REEMISSÃO.<br/>VALORES SUJEITOS A ALTERAÇÃO</td></tr>
            <tr><td style="width:32%"><b>Cia Aérea</b></td><td>${escapeHtml(ciaFullNameForAgency(common.cia))}</td></tr>
            <tr><td><b>Prazo</b></td><td>${escapeHtml(common.prazo)}</td></tr>
            <tr><td><b>Localizador do Cálculo</b></td><td>${escapeHtml(common.loc)}</td></tr>
            ${common.novo_loc ? `<tr><td><b>Novo LOC</b></td><td>${escapeHtml(common.novo_loc)}</td></tr>` : ""}
            <tr><td><b>Passageiro(s) / Bilhete(s)</b></td><td>${buildPaxTicketPairsHtml(common)}</td></tr>
            <tr><td><b>Família Tarifária</b></td><td>${escapeHtml(common.familia)}</td></tr>
            <tr><td><b>Bagagem</b></td><td>${escapeHtml(common.bag)}</td></tr>
            <tr><td><b>Permite parcelamento?</b></td><td>${escapeHtml(common.parcelamento)}</td></tr>
            <tr><td><b>Moeda</b></td><td>${escapeHtml(calc.cur)}</td></tr>
            <tr><td><b>Recuperação de incentivo?</b></td><td>${escapeHtml(incentivo)}</td></tr>
          ${endossoRow}
          </table>

          <p style="margin:12px 0 6px"><b>Descritivo de valores (por pax) — ${escapeHtml(calc.cur)} <span style="font-weight:700; color:#475569">(RC em USD)</span></b></p>
          <table border="1" cellspacing="0" cellpadding="6" width="760" style="width:760px; max-width:760px; margin:0; mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border:1px solid #c7ced9">
            <tr>
              <th style="background-color:#a99ac5; color:white; text-align:left">Tipo</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Dif. tarifa</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Dif. taxa</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">DU/Rav</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Multa</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">RC (USD)</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Total por pax</th>
              <th class="right" style="background-color:#a99ac5; color:white; text-align:right">Total (tipo)</th>
            </tr>
            ${paxRows.join("") || `<tr><td colspan="8">Sem valores informados.</td></tr>`}
            <tr>
              <td colspan="7" style="text-align:right; background-color:#d9cce3"><b>TOTAL (${escapeHtml(calc.cur)})</b></td>
              <td style="text-align:right; background-color:#d9cce3"><b>${fmtCur(calc.totalCur)}</b></td>
            </tr>
          </table>

          ${fxLine}
          <p style="margin:6px 0 0"><b>Tipo de cálculo:</b> ${escapeHtml(tipo)}</p>

          ${linkLine}
          <p style="margin:6px 0 0"><i>*Após o preenchimento, responda o e-mail para darmos continuidade ao processo</i></p>
          <p style="margin:6px 0 0">Em respeito a LGPD, não é permitido trafegar informações que envolvam dados de cartão de crédito.</p>

          ${buildEmailSectionBlock("VOOS SIMULADOS", voos, { strong:true })}
          ${buildEmailSectionBlock("CÁLCULO - USO INTERNO", interno)}
          ${buildEmailSectionBlock("BILHETE ORIGINAL", original)}
          <p style="margin:6px 0 0; font-size:9px; color:#999">${crrEmailHtml}</p>
        </div>
      `.trim();
    }

    // ---------- RF OBS CODE (HTML simples) ----------
    function buildOpTitle(mode, c){
  const base = mode === "NAC" ? "OP (RF) — REEMISSÃO NAC" : "OP (RF) — REEMISSÃO INTER";
  const loc = (c && c.loc) ? String(c.loc).trim() : "";
  const cia = (c && c.cia) ? String(c.cia).trim() : "";
  const extra = `${loc ? " • LOC: " + loc : ""}${cia ? " • CIA: " + cia : ""}`;
  return base + extra;
}

function rfHeader(mode){
  // Removido (título agora vai dentro da faixa roxa da tabela)
  return "";
}

    function buildRfObsNac(){
      const c = getCommon();
      const calc = calcNac();

      const fp = document.getElementById("nac_fp").value;
      const pay = (fp === "Link de pagamento") ? "Link de pagamento (enviado à agência)" : "Faturado";

      const folioOn = !!(document.getElementById("nac_folio_on") && document.getElementById("nac_folio_on").checked);
      const folio = (document.getElementById("nac_folio_text") ? document.getElementById("nac_folio_text").value.trim() : "");
      const folioRow = (folioOn && folio) ? `<tr><td style="padding:6px; background-color:#efe9f8;"><strong>Fólio:</strong></td><td style="padding:6px;">${escAttr(folio)}</td></tr>` : "";


      let valueRows = "";
      for(const r of calc.rows){
        valueRows += `
          <tr><td colspan="2" style="background-color:#f3f4f6; font-weight:bold; padding:6px;">${escAttr(r.t)} (qtd ${r.qty})</td></tr>
          <tr><td style="padding:6px;">Tarifa Antiga (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtBRL(r.oldFare))}</td></tr>
          <tr><td style="padding:6px;">Tarifa Nova (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtBRL(r.newFare))}</td></tr>
          <tr><td style="padding:6px;">Diferença de tarifa (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtBRL(r.diffFare))}</td></tr>
          <tr><td style="padding:6px;">Diferença de taxa (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtBRL(r.diffTax))}</td></tr>
          <tr><td style="padding:6px;">DU/Rav (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtBRL(r.du))}</td></tr>
          <tr><td style="padding:6px;">Multa (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtBRL(r.pen))}</td></tr>
          <tr><td style="padding:6px;"><b>Total (por pax)</b></td><td style="padding:6px; text-align:left;"><b>${escAttr(fmtBRL(r.perPax))}</b></td></tr>
          
        `;
      }
      if(!valueRows){
        valueRows = `<tr><td colspan="2">Sem valores informados.</td></tr>`;
      }

      if(calc.servicesBRL && calc.servicesBRL > 0){
        valueRows += `
          <tr><td style="padding:6px;">Serviços (abatimento):</td><td style="padding:6px; text-align:left;"><b>-${escAttr(fmtBRL(calc.servicesBRL))}</b></td></tr>
        `;
      }

      valueRows += `
        <tr><td style="padding:6px;"><b>TOTAL A COBRAR (BRL)</b></td><td style="padding:6px; text-align:left;"><b>${escAttr(fmtBRL(calc.totalBRL))}</b></td></tr>
      `;

      // ---- Rentabilização (uso interno) ----
      const rd = getRentData();
      const rentTipos = [rd.multa ? "Multa" : "", rd.diftar ? "Dif. tarifa" : "", rd.diftax ? "Dif. taxa" : ""].filter(Boolean).join("; ");
      const autoRent = calcRentAutoTotals("NAC", calc);

      const paidRaw = (cat, pax)=> (document.getElementById(`rent_pago_cia_${cat}_${pax}`)?.value || "").trim();
      const paidNum = (cat, pax)=> parseBRNumber(paidRaw(cat, pax));

      const qtyByType = (()=>{
        const q = {ADT:0, CHD:0, INF:0};
        const rows = (calc && Array.isArray(calc.rows)) ? calc.rows : [];
        for(const r of rows){
          const t = String(r.t||"").toUpperCase();
          if(!(t in q)) continue;
          q[t] += (Number(r.qty||0) || 0);
        }
        return q;
      })();

      const paidBy = (cat)=>{
        const adt = paidNum(cat,"adt") * (qtyByType.ADT || 0);
        const chd = paidNum(cat,"chd") * (qtyByType.CHD || 0);
        const inf = paidNum(cat,"inf") * (qtyByType.INF || 0);
        const any = !!(paidRaw(cat,"adt") || paidRaw(cat,"chd") || paidRaw(cat,"inf"));
        return {adt, chd, inf, total:(adt+chd+inf), any};
      };

      const pM = paidBy("multa");  const mLuc = autoRent.multa  - pM.total;
      const pT = paidBy("diftar"); const tLuc = autoRent.diftar - pT.total;
      const pX = paidBy("diftax"); const xLuc = autoRent.diftax - pX.total;

      let lucroTotal = 0;
      if(rd.multa) lucroTotal += mLuc;
      if(rd.diftar) lucroTotal += tLuc;
      if(rd.diftax) lucroTotal += xLuc;

      // --- RENT (mais claro: Cobrar do cliente × Pagar na CIA) ---
      const cobBy = (cat)=>{
        const out = {adt:0, chd:0, inf:0, total:0};
        const rows = (calc && Array.isArray(calc.rows)) ? calc.rows : [];
        for(const r of rows){
          const t = String(r.t||"").toUpperCase();
          const qty = Number(r.qty||0) || 0;
          if(qty<=0) continue;
          let per = 0;
          if(cat==="multa") per = Number(r.pen||0) || 0;
          if(cat==="diftar") per = Number(r.diffFare||0) || 0;
          if(cat==="diftax") per = Number(r.diffTax||0) || 0;
          const v = per * qty;
          if(t==="ADT") out.adt += v;
          if(t==="CHD") out.chd += v;
          if(t==="INF") out.inf += v;
          out.total += v;
        }
        return out;
      };

      const cobM = cobBy("multa");
      const cobT = cobBy("diftar");
      const cobX = cobBy("diftax");

      // totais selecionados
      let sumCob = 0, sumPago = 0;
      if(rd.multa){  sumCob += cobM.total; sumPago += pM.total; }
      if(rd.diftar){ sumCob += cobT.total; sumPago += pT.total; }
      if(rd.diftax){ sumCob += cobX.total; sumPago += pX.total; }
      lucroTotal = sumCob - sumPago;

      const rentItemTable = (title, cob, paid)=>{
        const showAdt = (qtyByType.ADT||0) > 0;
        const showChd = (qtyByType.CHD||0) > 0;
        const showInf = (qtyByType.INF||0) > 0;

        const row = (tp, cobV, paidV)=>{
          const q = (qtyByType[tp]||0);
          const tpLabel = q ? `${tp} (qtd ${q})` : tp;
          return `<tr>
            <td style="padding:6px;border:1px solid #e5e7eb;"><b>${escAttr(tpLabel)}</b></td>
            <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${escAttr(fmtBRL(cobV))}</td>
            <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${escAttr(fmtBRL(paidV))}</td>
          </tr>`;
        };

        let body = "";
        if(showAdt) body += row("ADT", cob.adt, paid.adt);
        if(showChd) body += row("CHD", cob.chd, paid.chd);
        if(showInf) body += row("INF", cob.inf, paid.inf);

        body += `<tr>
          <td style="padding:6px;border:1px solid #e5e7eb;"><b>Total</b></td>
          <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;"><b>${escAttr(fmtBRL(cob.total))}</b></td>
          <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;"><b>${escAttr(fmtBRL(paid.total))}</b></td>
        </tr>`;

        return `
          <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;margin:4px 0 8px 0;">
            <tr><td colspan="3" style="background-color:#a99ac5;color:white;font-weight:bold;padding:6px;">${escAttr(title)} (BRL) — total por tipo de PAX</td></tr>
            <tr>
              <th style="background:#eef2ff;padding:6px;border:1px solid #e5e7eb;text-align:left;">Tipo PAX (qtd)</th>
              <th style="background:#eef2ff;padding:6px;border:1px solid #e5e7eb;text-align:right;">Cobrar do cliente (auto)</th>
              <th style="background:#eef2ff;padding:6px;border:1px solid #e5e7eb;text-align:right;">Pagar na CIA (informado)</th>
            </tr>
            ${body}
          </table>
        `;
      };

      const rentBlock = (rd.enabled && rd.anyType) ? (`
        <tr><td colspan="2" style="background-color:#f4cccc; font-weight:bold; padding:6px;">RENTABILIZAÇÃO</td></tr>
        <tr><td style="padding:6px;"><b>Tipo</b></td><td style="padding:6px;">${escAttr(rentTipos || "-")}</td></tr>
        <tr><td style="padding:6px;"><b>Moeda</b></td><td style="padding:6px;">BRL</td></tr>
        ${rd.multa ? `<tr><td colspan="2" style="padding:0 6px;">${rentItemTable("MULTA", cobM, pM)}</td></tr>` : ""}
        ${rd.diftar ? `<tr><td colspan="2" style="padding:0 6px;">${rentItemTable("DIF. TARIFA", cobT, pT)}</td></tr>` : ""}
        ${rd.diftax ? `<tr><td colspan="2" style="padding:0 6px;">${rentItemTable("DIF. TAXA", cobX, pX)}</td></tr>` : ""}
        
      `) : "";

      return (
        rfHeader("NAC") +
        `<table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;">
          <tr><td colspan="2" style="background-color:#d9cce3; font-weight:bold; text-align:center; padding:8px;">${escAttr(buildOpTitle("NAC", c))}</td></tr>
${c.novo_loc ? `<tr><td style="padding:6px;"><strong>Novo LOC:</strong></td><td style="padding:6px;">${escAttr(c.novo_loc)}</td></tr>` : ""}
          <tr><td style="padding:6px;"><strong>Passageiro(s):</strong></td><td style="padding:6px;">${buildPaxTicketPairsHtml(c)}</td></tr>
          ${c.oac ? `<tr><td style="padding:6px;"><strong>OAC:</strong></td><td style="padding:6px;">${escAttr(c.oac)}</td></tr>` : ""}
          <tr><td style="padding:6px;"><strong>Família Tarifária:</strong></td><td style="padding:6px;">${escAttr(c.familia)}</td></tr>
          <tr><td style="padding:6px;"><strong>Bagagem:</strong></td><td style="padding:6px;">${escAttr(c.bag)}</td></tr>
${folioRow}
<tr><th style="background-color:#a99ac5; color:white; text-align:left; padding:6px;">Descritivo</th><th style="background-color:#a99ac5; color:white; text-align:left; padding:6px;">Valores</th></tr>
          ${valueRows}
          ${rentBlock}
        </table>`
      );
    }


    function buildRfObsInter(){
      const c = getCommon();
      const calc = calcInter();
      const incentivo = document.getElementById("inter_incentivo").value;
      const tipo = document.getElementById("inter_tipo").value;

      const internoRF = (document.getElementById("inter_interno") ? document.getElementById("inter_interno").value.trim() : "");
      const internoHtml = internoRF ? escAttr(maskRFText(internoRF)).split("\n").join("<br>") : "";

      const endossoOn = !!(document.getElementById("inter_endosso_on") && document.getElementById("inter_endosso_on").checked);
      const endossoText = (document.getElementById("inter_endosso_text") ? document.getElementById("inter_endosso_text").value.trim() : "");
      const endossoRow = (endossoOn && endossoText) ? `<tr><td style="padding:6px; background-color:#efe9f8;"><strong>Endosso:</strong></td><td style="padding:6px;">${escAttr(endossoText)}</td></tr>` : "";


      const fp = document.getElementById("inter_fp").value;
      const pay = (fp === "Link de pagamento") ? "Link de pagamento (enviado à agência)" : "Faturado";

      const fxText = (calc.fx > 0) ? `1 ${calc.cur} = ${calc.fx.toFixed(4).replace(".",",")} BRL` : `Câmbio não informado`;
      const rcFxText = (calc.cur !== "USD" && calc.fxUSD > 0) ? `1 USD = ${calc.fxUSD.toFixed(4).replace(".",",")} BRL` : (calc.cur !== "USD" ? "USD→BRL (RC) não informado" : "");

      let valueRows = "";
      for(const r of calc.rows){
        const rcCell = (r.feeUSD && r.feeUSD > 0) ? escAttr(fmtUSD(r.feeUSD)) : "USD INFORMAR";
        valueRows += `
          <tr><td colspan="2" style="background-color:#f3f4f6; font-weight:bold; padding:6px;">${escAttr(r.t)} (qtd ${r.qty})</td></tr>
          <tr><td style="padding:6px;">Diferença de tarifa (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtCur(r.fare))}</td></tr>
          <tr><td style="padding:6px;">Diferença de taxa (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtCur(r.tax))}</td></tr>
          <tr><td style="padding:6px;">DU/Rav (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtCur(r.du))}</td></tr>
          <tr><td style="padding:6px;">Multa (por pax):</td><td style="padding:6px; text-align:left;">${escAttr(fmtCur(r.pen))}</td></tr>
          <tr><td style="padding:6px;">RC (USD) (por pax):</td><td style="padding:6px; text-align:left;">${rcCell}</td></tr>
          <tr><td style="padding:6px;"><b>Total (por pax)</b></td><td style="padding:6px; text-align:left;"><b>${escAttr(fmtCur(r.perPax))}</b></td></tr>
          
        `;
      }
      if(!valueRows){
        valueRows = `<tr><td colspan="2">Sem valores informados.</td></tr>`;
      }

      valueRows += `
        <tr><td style="padding:6px;"><b>TOTAL (${escAttr(calc.cur)})</b></td><td style="padding:6px; text-align:left;"><b>${escAttr(fmtCur(calc.totalCur))}</b></td></tr>
        <tr><td><b>TOTAL A COBRAR (BRL)</b></td><td style="padding:6px; text-align:left;"><b>${escAttr(fmtBRL(calc.totalBRL))}</b></td></tr>
      `;

      // ---- Rentabilização (uso interno) ----
      const rd = getRentData();
      const rentTipos = [rd.multa ? "Multa" : "", rd.diftar ? "Dif. tarifa" : "", rd.diftax ? "Dif. taxa" : ""].filter(Boolean).join("; ");
      const autoRent = calcRentAutoTotals("INTER", calc);

      const paidRaw = (cat, pax)=> (document.getElementById(`rent_pago_cia_${cat}_${pax}`)?.value || "").trim();
      const paidNum = (cat, pax)=> parseBRNumber(paidRaw(cat, pax));

      const qtyByType = (()=>{
        const q = {ADT:0, CHD:0, INF:0};
        const rows = (calc && Array.isArray(calc.rows)) ? calc.rows : [];
        for(const r of rows){
          const t = String(r.t||"").toUpperCase();
          if(!(t in q)) continue;
          q[t] += (Number(r.qty||0) || 0);
        }
        return q;
      })();

      const paidBy = (cat)=>{
        const adt = paidNum(cat,"adt") * (qtyByType.ADT || 0);
        const chd = paidNum(cat,"chd") * (qtyByType.CHD || 0);
        const inf = paidNum(cat,"inf") * (qtyByType.INF || 0);
        const any = !!(paidRaw(cat,"adt") || paidRaw(cat,"chd") || paidRaw(cat,"inf"));
        return {adt, chd, inf, total:(adt+chd+inf), any};
      };
      const fmtPaid = (p)=>{
        if(!p.any) return "-";
        return `ADT ${fmtCur(p.adt)} | CHD ${fmtCur(p.chd)} | INF ${fmtCur(p.inf)} | Total ${fmtCur(p.total)}`;
      };

      const pM = paidBy("multa");  const mPaid = pM.total;  const mLuc = autoRent.multa  - mPaid;
      const pT = paidBy("diftar"); const tPaid = pT.total;  const tLuc = autoRent.diftar - tPaid;
      const pX = paidBy("diftax"); const xPaid = pX.total;  const xLuc = autoRent.diftax - xPaid;

      let lucroTotal = 0;
      if(rd.multa) lucroTotal += mLuc;
      if(rd.diftar) lucroTotal += tLuc;
      if(rd.diftax) lucroTotal += xLuc;

      // --- RENT (mais claro: Cobrar do cliente × Pagar na CIA) ---
      const cobBy = (cat)=>{
        const out = {adt:0, chd:0, inf:0, total:0};
        const rows = (calc && Array.isArray(calc.rows)) ? calc.rows : [];
        for(const r of rows){
          const t = String(r.t||"").toUpperCase();
          const qty = Number(r.qty||0) || 0;
          if(qty<=0) continue;
          let per = 0;
          if(cat==="multa") per = Number(r.pen||0) || 0;
          if(cat==="diftar") per = Number(r.fare||0) || 0;
          if(cat==="diftax") per = Number(r.tax||0) || 0;
          const v = per * qty;
          if(t==="ADT") out.adt += v;
          if(t==="CHD") out.chd += v;
          if(t==="INF") out.inf += v;
          out.total += v;
        }
        return out;
      };

      const cobM = cobBy("multa");
      const cobT = cobBy("diftar");
      const cobX = cobBy("diftax");

      // totais selecionados
      let sumCob = 0, sumPago = 0;
      if(rd.multa){  sumCob += cobM.total; sumPago += pM.total; }
      if(rd.diftar){ sumCob += cobT.total; sumPago += pT.total; }
      if(rd.diftax){ sumCob += cobX.total; sumPago += pX.total; }
      lucroTotal = sumCob - sumPago;

      const rentItemTable = (title, cob, paid)=>{
        const showAdt = (qtyByType.ADT||0) > 0;
        const showChd = (qtyByType.CHD||0) > 0;
        const showInf = (qtyByType.INF||0) > 0;

        const row = (tp, cobV, paidV)=>{
          const q = (qtyByType[tp]||0);
          const tpLabel = q ? `${tp} (qtd ${q})` : tp;
          return `<tr>
            <td style="padding:6px;border:1px solid #e5e7eb;"><b>${escAttr(tpLabel)}</b></td>
            <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${escAttr(fmtCur(cobV))}</td>
            <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${escAttr(fmtCur(paidV))}</td>
          </tr>`;
        };

        let body = "";
        if(showAdt) body += row("ADT", cob.adt, paid.adt);
        if(showChd) body += row("CHD", cob.chd, paid.chd);
        if(showInf) body += row("INF", cob.inf, paid.inf);

        body += `<tr>
          <td style="padding:6px;border:1px solid #e5e7eb;"><b>Total</b></td>
          <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;"><b>${escAttr(fmtCur(cob.total))}</b></td>
          <td style="padding:6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;"><b>${escAttr(fmtCur(paid.total))}</b></td>
        </tr>`;

        return `
          <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;margin:4px 0 8px 0;">
            <tr><td colspan="3" style="background-color:#a99ac5;color:white;font-weight:bold;padding:6px;">${escAttr(title)} (${escAttr(calc.cur)}) — total por tipo de PAX</td></tr>
            <tr>
              <th style="background:#eef2ff;padding:6px;border:1px solid #e5e7eb;text-align:left;">Tipo PAX (qtd)</th>
              <th style="background:#eef2ff;padding:6px;border:1px solid #e5e7eb;text-align:right;">Cobrar do cliente (auto)</th>
              <th style="background:#eef2ff;padding:6px;border:1px solid #e5e7eb;text-align:right;">Pagar na CIA (informado)</th>
            </tr>
            ${body}
          </table>
        `;
      };

      const rentRows = (rd.enabled && rd.anyType) ? (`
        <tr><td colspan="2" style="background-color:#f4cccc; font-weight:bold; padding:6px;">RENTABILIZAÇÃO</td></tr>
        <tr><td style="padding:6px;"><b>Tipo</b></td><td style="padding:6px;">${escAttr(rentTipos || "-")}</td></tr>
        <tr><td style="padding:6px;"><b>Moeda</b></td><td style="padding:6px;">${escAttr(calc.cur)}</td></tr>
        ${rd.multa ? `<tr><td colspan="2" style="padding:0 6px;">${rentItemTable("MULTA", cobM, pM)}</td></tr>` : ""}
        ${rd.diftar ? `<tr><td colspan="2" style="padding:0 6px;">${rentItemTable("DIF. TARIFA", cobT, pT)}</td></tr>` : ""}
        ${rd.diftax ? `<tr><td colspan="2" style="padding:0 6px;">${rentItemTable("DIF. TAXA", cobX, pX)}</td></tr>` : ""}
        
      `) : "";

      return (
        rfHeader("INTER") +
        `<table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;">
          <tr><td colspan="2" style="background-color:#d9cce3; font-weight:bold; text-align:center; padding:8px;">${escAttr(buildOpTitle("INTER", c))}</td></tr>
${c.novo_loc ? `<tr><td style="padding:6px;"><strong>Novo LOC:</strong></td><td style="padding:6px;">${escAttr(c.novo_loc)}</td></tr>` : ""}
          <tr><td style="padding:6px;"><strong>Passageiro(s):</strong></td><td style="padding:6px;">${buildPaxTicketPairsHtml(c)}</td></tr>
          
          ${c.oac ? `<tr><td style="padding:6px;"><strong>OAC:</strong></td><td style="padding:6px;">${escAttr(c.oac)}</td></tr>` : ""}
          <tr><td style="padding:6px;"><strong>Família Tarifária:</strong></td><td style="padding:6px;">${escAttr(c.familia)}</td></tr>
          <tr><td style="padding:6px;"><strong>Bagagem:</strong></td><td style="padding:6px;">${escAttr(c.bag)}</td></tr>
${endossoRow}
<tr><td style="padding:6px;"><strong>Moeda:</strong></td><td style="padding:6px;">${escAttr(calc.cur)} • <strong>Câmbio:</strong> ${escAttr(fxText)}</td></tr>
          ${(calc.cur !== "USD") ? `<tr><td style="padding:6px;"><strong>Câmbio USD→BRL (RC):</strong></td><td style="padding:6px;">${escAttr(rcFxText)}</td></tr>` : ""}
          <tr><td style="padding:6px;"><strong>Incentivo:</strong></td><td style="padding:6px;">${escAttr(incentivo)} • <strong>Tipo cálculo:</strong> ${escAttr(tipo)}</td></tr>
<tr><th style="background-color:#a99ac5; color:white; text-align:left; padding:6px;">Descritivo</th><th style="background-color:#a99ac5; color:white; text-align:left; padding:6px;">Valores</th></tr>
          ${valueRows}
          ${internoRF ? `<tr><td colspan="2" style="background-color:#f3f4f6; font-weight:bold; padding:6px;">CÁLCULO — USO INTERNO</td></tr><tr><td colspan="2" style="padding:6px;">${internoHtml}</td></tr>` : ""}
          ${rentRows}
        </table>`
      );
    }


    function buildRfObsCode(){
      const mode = getActiveMode();
      const raw = (mode === "NAC") ? buildRfObsNac() : buildRfObsInter();
      return minifyRF(raw);
    }

    // ---------- formulário SICA (rentabilização) ----------
    function buildSicaFormHtml(){
      const rd = getRentData();

      const mode = getActiveMode();
      const calc = (mode === "NAC") ? calcNac() : calcInter();
      const auto = calcRentAutoTotals(mode, calc);

      const fmt = (n)=> (mode === "INTER") ? fmtCur(n) : fmtBRL(n);
      const cur = (mode === "INTER") ? getInterCurrency() : "BRL";
      const hasVal = (n)=> Math.abs(Number(n || 0)) > 0.000001;

      const paidRaw = (cat, pax)=> (document.getElementById(`rent_pago_cia_${cat}_${pax}`)?.value || "").trim();
      const paidNum = (cat, pax)=> parseBRNumber(paidRaw(cat, pax));

      // Pago na CIA é informado POR PAX (ADT/CHD/INF). Total = valor_por_pax * quantidade_do_tipo.
      const qtyByType = (()=>{
        const q = {ADT:0, CHD:0, INF:0};
        const rows = (calc && Array.isArray(calc.rows)) ? calc.rows : [];
        for(const r of rows){
          const t = String(r.t||"").toUpperCase();
          if(!(t in q)) continue;
          q[t] += (Number(r.qty||0) || 0);
        }
        return q;
      })();

      const paidTotal = (cat)=> (
        paidNum(cat,"adt") * (qtyByType.ADT || 0) +
        paidNum(cat,"chd") * (qtyByType.CHD || 0) +
        paidNum(cat,"inf") * (qtyByType.INF || 0)
      );
      const anyPaid = (cat)=> !!(paidRaw(cat,"adt") || paidRaw(cat,"chd") || paidRaw(cat,"inf"));

      // Valores "cliente" (cobrado) vêm do recálculo (auto)
      const rcUsdTotal = (mode === "INTER") ? ((calc && Array.isArray(calc.rows)) ? calc.rows.reduce((s,r)=> s + (Number(r.feeUSD||0) * Number(r.qty||0)), 0) : 0) : 0;
      const rcCurTotal = (mode === "INTER") ? ((calc && Array.isArray(calc.rows)) ? calc.rows.reduce((s,r)=> s + (Number(r.feeCur||0) * Number(r.qty||0)), 0) : 0) : 0;

      const cob = { multa: auto.multa, diftar: auto.diftar, diftax: auto.diftax, rc: rcCurTotal };
      // O que entra na tabela SICA:
      // Mostra sempre Multa / Dif. tarifa / Dif. taxa (mesmo que o item não esteja marcado),
      // para evitar esquecimento na abertura do SICA. Quando o item NÃO estiver marcado,
      // assumimos 'pago na CIA' = 'cobrado' (lucro zero).
      const sel = { diftar:true, multa:true, diftax:true };
      const selRC = (mode === "INTER");
      const isSel = { diftar: !!rd.diftar, multa: !!rd.multa, diftax: !!rd.diftax };

      // Nosso valor (pago na CIA):
      // - Se o item estiver marcado e houver 'pago na CIA' preenchido (por pax), usa.
      // - Caso contrário, assume pago = cobrado.
      const pago = {
        multa:  (isSel.multa  && anyPaid("multa"))  ? paidTotal("multa")  : cob.multa,
        diftar: (isSel.diftar && anyPaid("diftar")) ? paidTotal("diftar") : cob.diftar,
        diftax: (isSel.diftax && anyPaid("diftax")) ? paidTotal("diftax") : cob.diftax,
        rc: cob.rc,
      };

      let sumCob = 0, sumPago = 0;
      if(sel.multa){  sumCob += cob.multa;  sumPago += pago.multa; }
      if(sel.diftar){ sumCob += cob.diftar; sumPago += pago.diftar; }
      if(sel.diftax){ sumCob += cob.diftax; sumPago += pago.diftax; }
      if(selRC){ sumCob += cob.rc; sumPago += pago.rc; }

      const lucro = sumCob - sumPago;

      const today = new Date().toLocaleDateString("pt-BR");
      const op = (document.getElementById("op_rf")?.value || "").trim();
      const loc = (document.getElementById("loc")?.value || "").trim();
      const novoLoc = (document.getElementById("novo_loc")?.value || "").trim();
      const cia = (document.getElementById("cia")?.value || "").trim();
      const agencia = (document.getElementById("agencia")?.value || "").trim();
      const filial = (document.getElementById("filial")?.value || "LOT").trim();

      const row = (label, v1, v2, bold=false)=>{
        const td = (txt, alignRight=false)=>{
          return `<td style="padding:5px 6px;border:1px solid #d9d9e6;${alignRight?'text-align:right;white-space:nowrap;':''}">${txt}</td>`;
        };
        return `<tr>${td(bold?`<b>${label}</b>`:label)}${td(v1, true)}${td(v2, true)}</tr>`;
      };

      const obsTxt = (Math.abs(lucro) < 0.005)
        ? "SEM RENTABILIZAÇÃO / reemissão feita direto na cia"
        : `RENTABILIZADO ${stripHtml(fmt(lucro))}${(mode==="INTER" && calc.fx>0)?(" ("+stripHtml(fmtBRL(lucro*calc.fx))+" )"):""} / reemissão feita direto na cia`;

      const html =
`<div style="font-family:Segoe UI,Arial,sans-serif;font-size:11px;color:#111;background:#fff;border:1px solid #e6e6ef;border-radius:10px;padding:10px;box-sizing:border-box;width:760px;max-width:760px;margin:0;">
  <div style="text-align:center;font-weight:800;letter-spacing:.3px;margin:0 0 10px 0;">FORMULÁRIO DE RENTABILIDADE</div>

  <table width="760" style="width:760px;max-width:760px;border-collapse:collapse;">
    <tr>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;"><b>Data</b></td>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;">${escapeHtml(today)}</td>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;"><b>OP</b></td>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;">${escapeHtml(op || "-")}</td>
    </tr>
    <tr>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;"><b>Localizador/Cia</b></td>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;">${escapeHtml((loc||"-") + (cia?(" / "+cia):""))}</td>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;"><b>Filial</b></td>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;">${escapeHtml(filial || "-")}</td>
    </tr>
    ${novoLoc ? `<tr>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;"><b>Novo LOC</b></td>
      <td colspan="3" style="padding:5px 6px;border:1px solid #d9d9e6;">${escapeHtml(novoLoc)}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:5px 6px;border:1px solid #d9d9e6;"><b>Agência</b></td>
      <td colspan="3" style="padding:5px 6px;border:1px solid #d9d9e6;">${escapeHtml(agencia || "-")}</td>
    </tr>
  </table>

  <div style="height:10px;"></div>

  <table width="760" style="width:760px;max-width:760px;border-collapse:collapse;">
    <tr>
      <td style="padding:6px;border:1px solid #d9d9e6;background:#eef2ff;font-weight:700;">Itens</td>
      <td style="padding:6px;border:1px solid #d9d9e6;background:#eef2ff;font-weight:700;text-align:right;">Valor Cliente (cobrado no SICA) • ${escapeHtml(cur)}</td>
      <td style="padding:6px;border:1px solid #d9d9e6;background:#eef2ff;font-weight:700;text-align:right;">Nosso Valor (pago na CIA) • ${escapeHtml(cur)}</td>
    </tr>
    ${sel.diftar ? row("Dif. tarifa", fmt(cob.diftar), fmt(pago.diftar)) : ""}
    ${sel.multa  ? row("Multa", fmt(cob.multa), fmt(pago.multa)) : ""}
    ${sel.diftax ? row("Dif. taxa", fmt(cob.diftax), fmt(pago.diftax)) : ""}
    ${selRC ? ((cur === "USD") ? row("RC/FEE", fmt(cob.rc), fmt(pago.rc)) : (row("RC/FEE (USD)", fmtUSD(rcUsdTotal), fmtUSD(rcUsdTotal)) + row(`RC/FEE (${cur})`, fmt(cob.rc), fmt(pago.rc)))) : ""}
    ${row("Total", fmt(sumCob), fmt(sumPago), true)}
    ${mode === "INTER" && calc.fx > 0 ? row("Total (BRL)", `<b>${fmtBRL(sumCob * calc.fx)}</b>`, `<b>${fmtBRL(sumPago * calc.fx)}</b>`, true) : ""}
    ${row("Lucro", `<b style="color:${lucro>=0?'#0a7a33':'#b42318'}">${fmt(lucro)}</b>`, "", true)}
    ${mode === "INTER" && calc.fx > 0 ? row("Lucro (BRL)", `<b style="color:${(lucro*calc.fx)>=0?'#0a7a33':'#b42318'}">${fmtBRL(lucro * calc.fx)}</b>`, "", true) : ""}
  </table>

  <div style="margin-top:10px;">
    <b>Observações:</b> ${escapeHtml(obsTxt)}
  </div>

  ${buildRentPaxTableSica(mode, calc)}
</div>`;
      return html;
    }


    // ---------- subject ----------
    function suggestedSubject(){
      const mode = getActiveMode();
      const loc = (document.getElementById("loc").value || "").trim();
      const cia = (document.getElementById("cia").value || "").trim();
      if(mode === "NAC") return `Cálculo de reemissão NAC${loc ? " — " + loc : ""}${cia ? " — " + cia : ""}`.trim();
      const cur = getInterCurrency();
      return `Cálculo de reemissão INTER (${cur})${loc ? " — " + loc : ""}${cia ? " — " + cia : ""}`.trim();
    }

    // ---------- copy ----------
    async function copyHtmlToClipboard(html){
      // 1) Melhor opção (quando permitido): ClipboardItem com text/html
      try{
        if(navigator.clipboard && window.ClipboardItem){
          const item = new ClipboardItem({
            "text/html": new Blob([html], {type:"text/html"}),
            "text/plain": new Blob([stripHtml(html)], {type:"text/plain"})
          });
          await navigator.clipboard.write([item]);
          showToast("Copiado (HTML)!");
          return true;
        }
      }catch(e){}

      // 2) Fallback que funciona bem em arquivo local (file://): seleciona e copia HTML renderizado
      try{
        const tmp = document.createElement("div");
        tmp.style.position = "fixed";
        tmp.style.left = "-9999px";
        tmp.style.top = "0";
        tmp.style.width = "900px";
        tmp.style.height = "auto";
        tmp.style.overflow = "hidden";
        tmp.setAttribute("contenteditable","true");
        tmp.style.background = "#fff";
        tmp.style.padding = "8px";
        tmp.innerHTML = html;
        document.body.appendChild(tmp);
        tmp.focus();

        const range = document.createRange();
        range.selectNodeContents(tmp);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const ok = document.execCommand("copy");
        sel.removeAllRanges();
        document.body.removeChild(tmp);

        if(ok){
          showToast("Copiado (HTML)!");
          return true;
        }
      }catch(e){}

      // 3) Último fallback: copia texto simples
      try{
        await navigator.clipboard.writeText(stripHtml(html));
        showToast("Copiado (texto)!");
        return true;
      }catch(e){}

      return false;
    }
    function stripHtml(html){
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      return (tmp.innerText || tmp.textContent || "").trim();
    }

    // ---------- UI ----------
    function switchTab(which){
      const nacOn = (which === "tabNac");
      document.getElementById("tabNac").setAttribute("aria-selected", nacOn ? "true" : "false");
      document.getElementById("tabInter").setAttribute("aria-selected", nacOn ? "false" : "true");
      document.getElementById("panelNac").classList.toggle("hidden", !nacOn);
      document.getElementById("panelInter").classList.toggle("hidden", nacOn);
      const oacW = document.getElementById("oacWrap");
      if(oacW) oacW.classList.toggle("hidden", !nacOn);
      placeRentPanel();
      updateAll({silent:true});
      renderPaxFields();
      try{ localStorage.setItem("ra_calc_last_mode", nacOn ? "NAC" : "INTER"); }catch(e){}
    }

    function rentCurrencyCode(){ return (getActiveMode()==="INTER") ? getInterCurrency() : "BRL"; }
    function setRentCurrencyLabels(){
      const cur = rentCurrencyCode();
      for(const s of document.querySelectorAll(".rentCur")){ s.textContent = cur; }
    }

    function switchOutputTab(name){
      const target = String(name || "agency").toLowerCase();
      const allowed = new Set(["agency","cco","rent","crr"]);
      const next = allowed.has(target) ? target : "agency";
      for(const btn of document.querySelectorAll(".outputTabBtn")){
        const on = btn.getAttribute("data-output-tab") === next;
        btn.setAttribute("aria-selected", on ? "true" : "false");
      }
      for(const panel of document.querySelectorAll(".outputPanel")){
        panel.classList.toggle("is-active", panel.getAttribute("data-output-panel") === next);
      }
      try{ localStorage.setItem("ra_output_last_tab", next); }catch(e){}
    }

    function syncOutputTabs(){
      const rentSection = document.getElementById("outRentSicaSection");
      const rentBtn = document.getElementById("outTabBtnRent");
      const rentVisible = !!(rentSection && rentSection.style.display !== "none");
      if(rentBtn) rentBtn.style.display = rentVisible ? "inline-flex" : "none";
      const active = document.querySelector('.outputTabBtn[aria-selected="true"]');
      const activeName = active ? active.getAttribute("data-output-tab") : "agency";
      if(activeName === "rent" && !rentVisible){
        switchOutputTab("agency");
      }
    }

    const AZUL_RULE_TEXT = "Em reemissões Azul, o serviço pago previamente será utilizado como crédito no recalculo de reemissão e é necessário a nova compra do mesmo.";
const LATAM_GOL_RULE_TEXT = "Se reemitido através de um novo LOC, o localizador original deverá ser cancelado após a reemissão.";
let __lastCiaForAzul = "";

function normalizeCia(v){
  return String(v || "").trim().toUpperCase();
}
function isAzulCia(v){
  const c = normalizeCia(v);
  return c === "AD" || c === "AZUL";
}
function syncCiaNacSelector(){
  const sel = document.getElementById("ciaNacSelector");
  const input = document.getElementById("cia");
  const hint = document.getElementById("ciaHint");
  if(!sel || !input) return;
  const nacOn = (getActiveMode && getActiveMode() === "NAC");
  sel.classList.toggle("hidden", !nacOn);
  const val = normalizeCia(input.value);
  const inList = (val === "" || val === "G3" || val === "LA" || val === "AD" || val === "AZUL");
  input.style.display = (nacOn && inList) ? "none" : "";
  if(hint) hint.style.display = nacOn ? "block" : "none";

  for(const btn of sel.querySelectorAll(".airBtn")){
    const b = normalizeCia(btn.dataset.cia);
    const active = (val === b) || (val === "AZUL" && b === "AD");
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  }
}
function isLatamOrGolCia(v){
  const c = normalizeCia(v);
  return c === "LA" || c === "LATAM" || c === "G3" || c === "GOL";
}

let __lastCiaForAutoRules = "";
function maybeInjectAutoRuleFromCia(){
  // DESATIVADO: não preencher automaticamente o campo "Regras / observações".
  // As regras padrão por cia (AZUL / LATAM / GOL) aparecem somente no e-mail.
}

function updateAll(arg){
      // arg pode ser Event (listeners) ou um objeto {silent:true}. Não trate Event como silent.
      const silent = (arg === true) || (arg && arg.silent === true);

      syncCiaNacSelector();
      // regras automáticas por cia aparecem apenas no e-mail (não preencher textarea)
      toggleRentUI();
      setRentCurrencyLabels();

      // NAC: Serviços (abatimento) — apenas mostra/esconde o campo
      const _svcOn = document.getElementById("nac_services_on");
      const _svcWrap = document.getElementById("nac_services_wrap");
      if(_svcOn && _svcWrap){ _svcWrap.style.display = _svcOn.checked ? "block" : "none"; }

      // NAC: Fólio (texto livre)
      const _folOn = document.getElementById("nac_folio_on");
      const _folWrap = document.getElementById("nac_folio_wrap");
      if(_folOn && _folWrap){ _folWrap.style.display = _folOn.checked ? "block" : "none"; }

      // INTER: Endosso (texto livre)
      const _endOn = document.getElementById("inter_endosso_on");
      const _endWrap = document.getElementById("inter_endosso_wrap");
      if(_endOn && _endWrap){ _endWrap.style.display = _endOn.checked ? "block" : "none"; }

      const mode = getActiveMode();
      if(mode === "NAC"){
        const c = calcNac();
        setPill(true, `NAC • Total: ${fmtBRL(c.totalBRL)}`);
        updateRentComputed("NAC", c);
      }else{
        const c = calcInter();
        const ok = (c.fx > 0) && !c.rcNeedsUsdFx;
        const msg = ok
          ? `INTER • Total: ${fmtBRL(c.totalBRL)} (${c.cur})`
          : (c.fx <= 0 ? "INTER • Informe o câmbio" : "INTER • Informe o câmbio USD → BRL (RC)");
        setPill(ok, msg);
        updateRentComputed("INTER", c);
      }

      // "Outra moeda" (INTER)
      const interCurEl = document.getElementById("inter_cur");
      const otherWrap = document.getElementById("inter_cur_other_wrap");
      if(interCurEl && otherWrap){
        otherWrap.classList.toggle("hidden", interCurEl.value !== "OTHER");
      }

      // Exibe câmbio USD→BRL (RC) apenas quando a moeda não é USD
      const usdWrap = document.getElementById("inter_fx_usd_wrap");
      if(usdWrap){
        const cur = getInterCurrency();
        usdWrap.classList.toggle("hidden", cur === "USD");
      }

      // keep OBS code updated live (se existir)
      const obs = document.getElementById("obsCode");
      if(obs){
        obs.value = buildRfObsCode();
      }

      // keep CRR updated live (evita copiar CRR desatualizado)
      const raTA = document.getElementById("raCode");
      if(raTA){
        const manual = (raTA.dataset && raTA.dataset.manual === "1") || (document.activeElement === raTA);
        if(!manual){
          const code = buildCRRCode();
          if(code && code !== raTA.value) raTA.value = code;
        }
      }

      // formulário SICA (rentabilização) — só atualiza o preview se existir
      const rfp = document.getElementById("rentFormPreview");
      if(rfp && document.activeElement !== rfp){
        rfp.innerHTML = buildSicaFormHtml();
      }
      syncOutputTabs();

      // sem toast aqui (senão spamma a cada digitação)
      return;
    }

    function generateEmail(){
      const errs = validateBeforeGenerate();
      if(errs.length){ setPill(false, "Atenção: revisar dados"); showToast(errs[0]); return ""; }

      // garante que cálculos e ocultações estejam atualizados
      try{ updateAll(); }catch(e){}
      try{ renderPaxFields(); }catch(e){}

      const mode = getActiveMode();
      const html = (mode === "NAC") ? buildEmailHtmlNac() : buildEmailHtmlInter();
      const pv = document.getElementById("preview");
      if(pv) pv.innerHTML = html;

      const subj = suggestedSubject();
      const sp = document.getElementById("subjectPill");
      if(sp) sp.textContent = "Assunto: " + (subj || "—");

      // atualiza OBS também
      const obs = document.getElementById("obsCode");
      if(obs) obs.value = buildRfObsCode();

      // formulário SICA (rentabilização) — só preview (sem textarea de código)
      const sicaHtml = buildSicaFormHtml();
      const rfp = document.getElementById("rentFormPreview");
      if(rfp && document.activeElement !== rfp){
        rfp.innerHTML = sicaHtml || "";
      }

      showToast("Preview atualizado!");
      return html;
    }

function clearAll(silent){
      const ids = Array.from(document.querySelectorAll("input, textarea")).map(e=>e.id);
      for(const id of ids){
        const el = document.getElementById(id);
        if(!el) continue;
        if(id.includes("_qty_")) continue;
        if(id === "obsCode") continue;
        el.value = "";
      }
      document.getElementById("nac_qty_ADT").value = "1";
      document.getElementById("inter_qty_ADT").value = "1";
      document.getElementById("nac_qty_CHD").value = "0";
      document.getElementById("nac_qty_INF").value = "0";
      document.getElementById("inter_qty_CHD").value = "0";
      document.getElementById("inter_qty_INF").value = "0";
      document.getElementById("inter_cur").value = "USD";
      document.getElementById("inter_cur_other").value = "";
      document.getElementById("preview").innerHTML = "";
            const raTA0 = document.getElementById("raCode");
      if(raTA0){ raTA0.dataset.manual = "0"; raTA0.dataset.sig = ""; }
document.getElementById("paxq_adt").value = "1";
      document.getElementById("paxq_chd").value = "0";
      document.getElementById("paxq_inf").value = "0";
      document.getElementById("pax_json").value = "";
      const _fol = document.getElementById("nac_folio_on"); if(_fol) _fol.checked = false;
      const _folAg = document.getElementById("nac_folio_agencia"); if(_folAg) _folAg.checked = false;
      const _end = document.getElementById("inter_endosso_on"); if(_end) _end.checked = false;
      const _endAg = document.getElementById("inter_endosso_agencia"); if(_endAg) _endAg.checked = false;
      const _endT = document.getElementById("inter_endosso_text"); if(_endT) _endT.value = "";
      updateAll();
      renderPaxFields();
      if(!silent) showToast("Limpo!");
    }

    function saveLocal(){
      const data = {};
      for(const el of document.querySelectorAll("input, select, textarea")){
        if(!el.id) continue;
        if(el.id === "obsCode" || el.id === "raCode") continue;
        if(el.type === "checkbox"){
          data[el.id] = !!el.checked;
        }else{
          data[el.id] = el.value;
        }
      }
      localStorage.setItem("ra_reemissao_v3", JSON.stringify(data));
      showToast("Salvo no navegador!");
    }

    function loadLocal(){
      const raw = localStorage.getItem("ra_reemissao_v3");
      if(!raw){ showToast("Nada salvo ainda."); return; }
      try{
        const data = JSON.parse(raw);
        for(const [k,v] of Object.entries(data)){
          const el = document.getElementById(k);
          if(!el) continue;
          if(el.type === "checkbox") el.checked = !!v;
          else el.value = v;
        }
        updateAll();
        renderPaxFields();
        showToast("Carregado!");
      }catch(e){
        showToast("Erro ao carregar.");
      }
    }

    // wire tabs
    document.getElementById("tabNac").addEventListener("click", ()=>switchTab("tabNac"));
    document.getElementById("tabInter").addEventListener("click", ()=>switchTab("tabInter"));
    for(const btn of document.querySelectorAll(".outputTabBtn")){
      btn.addEventListener("click", ()=>switchOutputTab(btn.getAttribute("data-output-tab") || "agency"));
    }
    // restaura última aba usada (NAC / INTER)
    try{
      const last = localStorage.getItem("ra_calc_last_mode");
      if(last === "INTER") switchTab("tabInter");
      else if(last === "NAC") switchTab("tabNac");
    }catch(e){}
    try{
      const lastOut = localStorage.getItem("ra_output_last_tab") || "agency";
      switchOutputTab(lastOut);
    }catch(e){ switchOutputTab("agency"); }

    // NAC: seletor de cia (GOL/LATAM/AZUL)
    for(const btn of document.querySelectorAll("#ciaNacSelector .airBtn")){
      btn.addEventListener("click", ()=>{
        const ciaEl = document.getElementById("cia");
        if(ciaEl){ ciaEl.value = normalizeCia(btn.dataset.cia || ""); }
        syncCiaNacSelector();
        updateAll();
      });
    }
    // estado inicial do seletor
    syncCiaNacSelector();

    // buttons
    let lastEmailHtml = "";
    document.getElementById("btnGerar").addEventListener("click", async ()=>{
      try{ await ensureCRR5Current(); }
      catch(e){ showToast((e && e.message) ? e.message : "Falha ao gerar CRR5."); return; }
      lastEmailHtml = generateEmail();
    });

    document.getElementById("btnCopiarHtml").addEventListener("click", async ()=>{
      try{ await ensureCRR5Current(); }
      catch(e){ showToast((e && e.message) ? e.message : "Falha ao gerar CRR5."); return; }
      lastEmailHtml = generateEmail();
      if(!lastEmailHtml){ return; }
      const ok = await copyHtmlToClipboard(lastEmailHtml);
      if(!ok) showToast("Não deu pra copiar automático. Copie pelo preview.");
    });

    document.getElementById("btnCopiarObs").addEventListener("click", async ()=>{
      const errs = validateBeforeGenerate();
      if(errs.length){ setPill(false, "Atenção: revisar dados"); showToast(errs[0]); return; }
      const code = buildRfObsCode();
      document.getElementById("obsCode").value = code;
      try{
        await navigator.clipboard.writeText(code);
        showToast("Código OBS copiado!");
      }catch(e){
        showToast("Não deu pra copiar. Copie do campo de código.");
      }
    });
    document.getElementById("btnCopiarRentForm").addEventListener("click", async ()=>{
      const htmlForm = buildSicaFormHtml();
      if(!htmlForm){
        showToast("Nada para copiar no formulário de rentabilização.");
        return;
      }
      const rfp = document.getElementById("rentFormPreview");
      if(rfp && document.activeElement !== rfp) rfp.innerHTML = htmlForm;

      const ok = await copyHtmlToClipboard(htmlForm);
      if(!ok) showToast("Não deu pra copiar automático. Copie pelo preview.");
    });
// CRR
    // (botão "Copiar CRR" removido)

document.getElementById("btnGerarCRR5") && document.getElementById("btnGerarCRR5").addEventListener("click", async ()=>{
      try{
        const crr5 = await ensureCRR5Current();
        try{ await navigator.clipboard.writeText(crr5); showToast("CRR5 copiado!"); }
        catch(e){ showToast("CRR5 gerado. Copie do campo."); }
      }catch(e){ showToast((e && e.message) ? e.message : "Falha ao gerar CRR5."); }
    });

document.getElementById("btnCarregarRACode").addEventListener("click", async ()=>{
      const code = (document.getElementById("raCode").value || "").trim();
      try{
        const c5 = extractCRR5(code);
        if(c5){
          const crr4 = await loadCRR5ToCRR4(c5);
          loadCRRCode(crr4);
          // mantém o CRR5 visível e marca assinatura para reuso
          const rc = document.getElementById("raCode");
          const sig = buildCRRCode();
          __CRR5_CACHE.set(sig, c5);
          if(rc){ rc.dataset.manual = "1"; rc.dataset.sig = sig; rc.value = c5; }
        }else{
          loadCRRCode(code);
          const rc = document.getElementById("raCode");
          if(rc){ rc.dataset.manual = "0"; rc.dataset.sig = ""; rc.value = buildCRRCode(); }
        }
        lastEmailHtml = generateEmail();
      }catch(e){
        showToast((e && e.message) ? e.message : "Código inválido.");
      }
    });
    document.getElementById("btnLimpar").addEventListener("click", clearAll);
    function forceUpperKeepCursor(el){
      if(!el || typeof el.value !== "string") return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const up = el.value.toUpperCase();
      if(up !== el.value){
        el.value = up;
        try{ el.setSelectionRange(start, end); }catch(e){}
      }
    }
// reactive calc
    for(const el of document.querySelectorAll("input, select, textarea")){
      if(el.id === "obsCode" || el.id === "raCode") continue;
      el.addEventListener("input", ()=>{ invalidateCRR5OnEdit(); updateAll(); });
      el.addEventListener("change", ()=>{ invalidateCRR5OnEdit(); updateAll(); });
    }

    // uppercase automático em campos-chave
    for(const id of ["cia","loc","novo_loc","oac","familia"]){
      const el = document.getElementById(id);
      if(!el) continue;
      el.addEventListener("input", ()=>forceUpperKeepCursor(el));
      el.addEventListener("blur", ()=>{ el.value = (el.value||"").trim().toUpperCase(); });
    }

    // init

    // dica aleatória (a cada abertura)
    const tipEl = document.getElementById("tipBox");
    if(tipEl){
      const tips = [
        '<b>Dica:</b> o RF costuma aceitar melhor HTML simples (sem CSS). O botão <b>Copiar código OBS (RF)</b> já monta tudo em <code>&lt;table&gt;</code> (tabela simples com estilos inline).',
        '<b>Dica:</b> Se o RF acusar “cartão”, use bilhete no formato <b>957-1234567890</b> (hífen após 3 dígitos).',
        '<b>Dica:</b> Use o <b>CRR</b> para reabrir o cálculo no outro PC/colaborador sem redigitar tudo.',
        '<b>Dica:</b> Para CCO, prefira colar o <b>código OBS (RF)</b> direto na OP — fica claro e padronizado.'
      ];
      tipEl.innerHTML = tips[Math.floor(Math.random()*tips.length)];
    }

    placeRentPanel();

    const rentabEl = document.getElementById("rentab");
    if(rentabEl) rentabEl.addEventListener("change", ()=>{ toggleRentUI(); updateAll(); });
    for(const id of ["rent_tipo_multa","rent_tipo_diftar","rent_tipo_diftax","rent_pago_cia","rent_cobrar_ag"]){
      const el = document.getElementById(id);
      if(!el) continue;
      el.addEventListener("input", ()=>{ invalidateCRR5OnEdit(); updateAll(); });
      el.addEventListener("change", ()=>{ invalidateCRR5OnEdit(); updateAll(); });
    }

    updateAll();
    syncOutputTabs();
    renderPaxFields();

    // PAX listeners
    for(const id of ["paxq_adt","paxq_chd","paxq_inf"]){
      const el = document.getElementById(id);
      if(el){
        el.addEventListener("input", renderPaxFields);
        el.addEventListener("change", renderPaxFields);
      }
    }
    const box = document.getElementById("paxBox");
    if(box){
      box.addEventListener("input", (e)=> updatePaxStoreFromInput(e.target));
      box.addEventListener("change", (e)=> updatePaxStoreFromInput(e.target));
      box.addEventListener("blur", (e)=> updatePaxStoreFromInput(e.target), true);
    }


    // evita sobrescrever quando você está colando um CRR
    const raTA = document.getElementById("raCode");
    if(raTA){
      raTA.addEventListener("focus", ()=>{ raTA.dataset.manual = "1"; });
      raTA.addEventListener("paste", ()=>{ raTA.dataset.manual = "1"; });
      raTA.addEventListener("blur", ()=>{ raTA.dataset.manual = "0"; if(!raTA.value.trim()) raTA.value = buildCRRCode(); });
    }
  
    try{
      const hsh = (window.location.hash || "").replace(/^#/, "").trim();
      if(hsh && /^(?:CRR1|RA1)-/i.test(hsh)){
        loadCRRCode(hsh);
      }
    }catch(e){}


    // ----- Tema (Claro / Escuro) -----
    (function initTheme(){
      const key = "ra_calc_theme";
      const sel = document.getElementById("themeSel");
      const icon = document.getElementById("themeIcon");

      const apply = (v)=>{
        const theme = (v === "light") ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(key, theme);
        if(sel) sel.value = theme;
        if(icon) icon.textContent = (theme === "light") ? "☀️" : "🌙";
      };

      // inicia com preferencia salva
      const saved = localStorage.getItem(key) || "dark";
      apply(saved);

      if(sel){
        sel.addEventListener("change", () => apply(sel.value || "dark"));
      }
    })();
document.addEventListener("DOMContentLoaded", () => {
  const pnrInputElement = document.getElementById("pnrInput");
  if (pnrInputElement) {
    pnrInputElement.addEventListener("input", (e) => {
      const rawText = e.target.value;
      if (!rawText.trim()) return;
      processAndFillPNR(rawText);
    });
  }
});

function processAndFillPNR(raw) {
  let localizador = null;
  let ciaAerea = "";
  let adtList = [];
  let chdList = [];
  let infList = [];

  // Normaliza quebras de linha para evitar diferenças entre GDS
  const texto = raw.replace(/\r\n/g, "\n");

  // 1. CAPTURA DO LOCALIZADOR
  const rpLine = texto.match(/^RP\/.*$/m);
  if (rpLine) {
    const locMatch = rpLine[0].match(/\s([A-Z0-9]{6})\s*$/);
    if (locMatch) localizador = locMatch[1];
  }

  if (!localizador) {
    const anyLoc = texto.match(/\b[A-Z0-9]{6}\b/g);
    if (anyLoc) {
      for (const possibleLoc of anyLoc) {
        if (
          !/^(FLIGHT|FLGHT|STATUS|CLASS|ETKTS|E-TKT|BOOKED)$/i.test(possibleLoc) &&
          !/^\d+$/.test(possibleLoc) &&
          !/^[A-Za-z]+$/.test(possibleLoc)
        ) {
          localizador = possibleLoc;
          break;
        }
      }
    }
  }

  if (localizador) {
    const locField = document.getElementById("loc");
    if (locField) {
      locField.value = localizador.toUpperCase();
      if (typeof forceUpperKeepCursor === "function") {
        forceUpperKeepCursor(locField);
      }
    }
  }

  // =========================================================================
  // 2. CAPTURA DOS BILHETES (FA PAX ...) - CORRIGIDO
  // =========================================================================
  const etBilhetesPorPassageiro = {};
  const emdBilhetesPorPassageiro = {};

  // Primeiro, isolamos todas as linhas FA PAX e removemos quebras de linha internas e espaços duplicados
  // Isso junta o "/P2" que cai na linha de baixo de volta ao bilhete correspondente
  const linhasFA = texto.match(/FA\s+PAX\s+[\s\S]*?(?=\n\s*\d+\s+FA|\n\s*\d+\s+[A-Z]{2}\s+\d|\n\s*\d+\s+FB|\n\s*\d+\s+FE|\n\/SSR|$)/gi);

  if (linhasFA) {
    linhasFA.forEach(linhaBruta => {
      // Limpa espaços e quebras internas para análise contínua
      const linhaLimpa = linhaBruta.replace(/\s+/g, "");

      const ticketMatch = linhaLimpa.match(/(\d{3}-\d{10,})/);
      const tipoMatch = linhaLimpa.match(/\/(ET|DT)[A-Z0-9]*/i);
      const paxMatch = linhaLimpa.match(/\/P(\d+)/i);

      if (ticketMatch && tipoMatch && paxMatch) {
        const numero = ensureTicketHyphen(ticketMatch[1]);
        const tipo = tipoMatch[1].toUpperCase().slice(0, 2); // Garante extrair ET ou DT
        const paxNum = parseInt(paxMatch[1], 10);

        if (tipo === "ET") {
          if (!etBilhetesPorPassageiro[paxNum]) etBilhetesPorPassageiro[paxNum] = [];
          if (!etBilhetesPorPassageiro[paxNum].includes(numero)) {
            etBilhetesPorPassageiro[paxNum].push(numero);
          }
        } else if (tipo === "DT") {
          if (!emdBilhetesPorPassageiro[paxNum]) emdBilhetesPorPassageiro[paxNum] = [];
          if (!emdBilhetesPorPassageiro[paxNum].includes(numero)) {
            emdBilhetesPorPassageiro[paxNum].push(numero);
          }
        }
      }
    });
  }

  // =========================================================================
  // 3. CAPTURA DOS PASSAGEIROS (ADT, CHD, INF) – Múltiplos por linha
  // =========================================================================
  const paxRegex = /(\d+)\.\s*([A-ZÀ-Ü ]+\/[A-ZÀ-Ü ]+)(?:\s+(MR|MRS|MS|MISS|CHD|INF|IN|CH))?/gi;
  let paxMatch;

  while ((paxMatch = paxRegex.exec(texto)) !== null) {
    const numeroPax = parseInt(paxMatch[1], 10);
    const nomeCompleto = normalizePaxName(paxMatch[2]);
    const tipoBruto = (paxMatch[3] || "").toUpperCase().trim();

    const etTickets = etBilhetesPorPassageiro[numeroPax] || [];
    const emdTickets = emdBilhetesPorPassageiro[numeroPax] || [];

    const paxObjeto = {
      number: numeroPax,
      name: nomeCompleto,
      ticket: etTickets[0] || "",      // principal: Primeiro ETKT encontrado para este Px
      etickets: etTickets,             // todos ETKT
      emds: emdTickets                 // todos EMD
    };

    if (tipoBruto === "INF" || tipoBruto === "IN") {
      infList.push(paxObjeto);
    } else if (tipoBruto === "CHD" || tipoBruto === "CH") {
      chdList.push(paxObjeto);
    } else {
      adtList.push(paxObjeto);
    }
  }

  // 4. CAPTURA DA COMPANHIA AÉREA PELO SEGMENTO
  const segRegex = /^\s*\d+\s+([A-Z0-9]{2})\s*\d{1,4}/m;
  const segMatch = segRegex.exec(texto);
  if (segMatch && segMatch[1]) {
    ciaAerea = segMatch[1].toUpperCase().trim();
    const ciaField = document.getElementById("cia");
    if (ciaField) {
      ciaField.value = ciaAerea;
      if (typeof syncCiaNacSelector === "function") syncCiaNacSelector();
    }
  }

  // 5. ATUALIZAÇÃO DAS QUANTIDADES
  if (adtList.length > 0 || chdList.length > 0 || infList.length > 0) {
    const fieldAdt = document.getElementById("paxq_adt");
    const fieldChd = document.getElementById("paxq_chd");
    const fieldInf = document.getElementById("paxq_inf");

    if (fieldAdt) fieldAdt.value = adtList.length;
    if (fieldChd) fieldChd.value = chdList.length;
    if (fieldInf) fieldInf.value = infList.length;

    const novoStore = {
      ADT: adtList,
      CHD: chdList,
      INF: infList
    };
    if (typeof setPaxStore === "function") {
      setPaxStore(novoStore);
    }

    if (typeof renderPaxFields === "function") renderPaxFields();
    if (typeof syncAggregateFromStore === "function") syncAggregateFromStore();
    if (typeof updateAll === "function") {
      if (typeof invalidateCRR5OnEdit === "function") invalidateCRR5OnEdit();
      updateAll();
    }

    if (typeof showToast === "function") {
      showToast("PNR importado com sucesso!");
    }
  }
}

// Helpers
function normalizePaxName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function ensureTicketHyphen(ticket) {
  const clean = ticket.replace(/\s+/g, "");
  const m = clean.match(/^(\d{3})-?(\d{8,})$/);
  if (m) return `${m[1]}-${m[2]}`;
  return clean;
}
