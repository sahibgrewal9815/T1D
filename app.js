/* Khurak — carb counter + insulin dose helper for type 1 diabetes */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => (Math.round(n * 10) / 10).toString();
  const num = v => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : null; };

  // ---------- storage ----------
  const K = { set: "kh_settings", plate: "kh_plate", log: "kh_log", mine: "kh_myfoods", recent: "kh_recent" };
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const DEFAULTS = {
    perMeal: false, icr: null,
    icrMeal: { breakfast: null, lunch: null, snack: null, dinner: null },
    step: 1, corrOn: false, bgUnit: "mgdl", target: null, isf: null,
    warnAbove: 15, iobHours: 3
  };
  let S = Object.assign({}, DEFAULTS, load(K.set, {}));
  S.icrMeal = Object.assign({}, DEFAULTS.icrMeal, S.icrMeal || {});
  let plate = load(K.plate, []);
  let log = load(K.log, []);
  let mine = load(K.mine, []);
  let recent = load(K.recent, []);

  const MEALS = [["breakfast", "Breakfast"], ["lunch", "Lunch"], ["snack", "Snack"], ["dinner", "Dinner"]];
  const autoMeal = () => { const h = new Date().getHours(); return h >= 5 && h < 11 ? "breakfast" : h < 16 && h >= 11 ? "lunch" : h >= 16 && h < 19 ? "snack" : "dinner"; };
  let meal = autoMeal();

  // ---------- food lookup ----------
  const toObj = r => ({ id: r[0], n: r[1], alt: r[2], cat: r[3], u: r[4], h: r[5], o: r[6], rich: !!r[7] });
  let ALL = [];
  const rebuild = () => { ALL = FOODS.map(toObj).concat(mine.map(m => Object.assign({ cat: "mine", alt: "" }, m))); };
  rebuild();
  const byId = id => ALL.find(f => f.id === id);

  function carbsFor(food, src, sizeIdx, qty) {
    const base = src === "out" ? (food.o ?? food.h) : (food.h ?? food.o);
    const sizes = UNITS[food.u] && UNITS[food.u].sizes;
    const mult = sizes ? sizes[sizeIdx][1] : 1;
    return base * mult * qty;
  }
  function portionText(item) {
    const f = byId(item.id);
    if (!f) return item.label || "";
    const sizes = UNITS[f.u] && UNITS[f.u].sizes;
    const bits = [];
    if (f.h != null && f.o != null) bits.push(item.src === "out" ? "dhaba/bought" : "home");
    if (sizes) bits.push(sizes[item.size][0].toLowerCase());
    const q = item.qty !== 1 ? item.qty + " ×" : "";
    return [q, bits.join(", ")].filter(Boolean).join(" ");
  }

  // ---------- dose maths ----------
  const lowLimit = () => S.bgUnit === "mmol" ? 3.9 : 70;
  const highLimit = () => S.bgUnit === "mmol" ? 13.9 : 250;
  const icrNow = () => S.perMeal ? (num(S.icrMeal[meal]) || num(S.icr)) : num(S.icr);
  const roundStep = (x, st) => Math.round(x / st) * st;

  function calc() {
    const carbs = plate.reduce((a, i) => a + i.carbs, 0);
    const icr = icrNow();
    const bg = S.corrOn ? num($("#bgNow").value) : null;
    const r = { carbs, icr, bg, food: 0, corr: 0, total: 0, rounded: 0, low: false, ready: false, notes: [] };
    if (!icr || icr <= 0) return r;
    r.food = carbs / icr;
    if (bg != null) {
      if (bg < lowLimit()) { r.low = true; return r; }
      const t = num(S.target), isf = num(S.isf);
      if (t && isf) r.corr = (bg - t) / isf;
    }
    r.total = Math.max(0, r.food + r.corr);
    r.rounded = roundStep(r.total, S.step);
    r.ready = carbs > 0 || r.corr > 0;
    return r;
  }

  function lastDose() {
    const h = num(S.iobHours) || 3;
    const cut = Date.now() - h * 3600e3;
    return log.find(e => e.taken > 0 && e.t > cut);
  }

  // ---------- rendering ----------
  function renderMeals() {
    $("#meals").innerHTML = MEALS.map(([k, l]) =>
      `<button class="chip" aria-pressed="${k === meal}" data-meal="${k}">${l}</button>`).join("");
  }

  function renderPlate() {
    const ul = $("#plate");
    ul.innerHTML = plate.map((it, i) => `
      <li>
        <button class="what" data-edit="${i}"><span>${esc(it.name)}</span><span class="muted small">${esc(portionText(it))}</span></button>
        <span class="g">${fmt(it.carbs)} g</span>
        <button class="x" data-del="${i}" aria-label="Remove ${esc(it.name)}">×</button>
      </li>`).join("");
    $("#plateEmpty").classList.toggle("hide", plate.length > 0);
    $("#quick").innerHTML = QUICK_EXTRAS.map(id => byId(id)).filter(Boolean)
      .map(f => `<button class="chip add" data-quick="${f.id}">+ ${esc(shortName(f.n))}</button>`).join("");
    save(K.plate, plate);
  }
  const shortName = n => n.replace(/\s*\(.*\)/, "").replace("Chai with 1 tsp sugar", "Chai + sugar");

  let lastShown = null;
  function renderDose() {
    const r = calc();
    const icr = r.icr;
    $("#setupCard").classList.toggle("hide", !!icr);
    $("#bgCard").classList.toggle("hide", !S.corrOn);
    $("#bgHint").textContent = S.target && S.isf ? S.bgUnit === "mmol" ? "mmol/L" : "mg/dL" : "set target and correction factor in Settings";
    $("#ratioLabel").textContent = icr ? `1 unit : ${fmt(icr)} g` : "";

    $("#penCarbs").textContent = `${fmt(r.carbs)} g`;
    const win = $("#penWindow");
    let unitsTxt = "–", lbl = "", sub = "carbs on your plate";
    if (!icr) sub = "set your carb ratio";
    else if (r.low) { unitsTxt = "Low"; sub = "treat the low first"; }
    else if (r.ready) {
      unitsTxt = fmt(r.rounded); lbl = r.rounded === 1 ? "unit" : "units";
      sub = `carbs · ${fmt(r.carbs)} ÷ ${fmt(icr)} = ${fmt(r.food)}` + (r.corr ? ` ${r.corr > 0 ? "+" : "−"} ${fmt(Math.abs(r.corr))} corr.` : "");
    }
    $("#penUnits").textContent = unitsTxt;
    $("#penUnitsLbl").textContent = lbl;
    $("#penSub").textContent = sub;
    win.classList.toggle("na", !(r.ready && !r.low));
    if (unitsTxt !== lastShown && r.ready) { win.classList.remove("bump"); void win.offsetWidth; win.classList.add("bump"); }
    lastShown = unitsTxt;
    $("#penSave").disabled = !(icr && (r.ready || plate.length) && !r.low);

    // notes
    const notes = [];
    if (r.low) notes.push(["warn", `<b>Your sugar is low (${fmt(r.bg)}).</b> Treat it first with about 15 g of fast sugar (glucose, juice, 3 tsp sugar in water), recheck in 15 minutes, then work out the meal dose.`]);
    if (r.bg != null && r.bg >= highLimit()) notes.push(["amber", `<b>Sugar is high.</b> Check for ketones and follow your team's sick-day / high sugar plan. Avoid hard exercise until it comes down.`]);
    const ld = lastDose();
    if (ld && r.corr > 0) notes.push(["amber", `You logged <b>${fmt(ld.taken)} units at ${timeStr(ld.t)}</b>. That insulin may still be working, so this correction could be too much. The correction part is ${fmt(r.corr)} units.`]);
    const wa = num(S.warnAbove);
    if (r.ready && wa && r.rounded > wa) notes.push(["warn", `<b>${fmt(r.rounded)} units is more than your usual limit of ${fmt(wa)}.</b> Double-check the foods and amounts before injecting.`]);
    if (plate.some(i => i.rich) && r.carbs > 0) notes.push(["amber", `Oily, buttery or creamy food on this plate. Sugar can rise again 3–5 hours later. Ask your team whether to split the dose for meals like this.`]);
    if (r.ready && r.carbs > 0 && r.carbs < 10 && !r.corr) notes.push(["ok", `Under 10 g of carbs. Many people don't need insulin for a snack this small; follow what your team told you.`]);
    $("#notes").innerHTML = notes.map(([c, t]) => `<div class="note ${c}">${t}</div>`).join("");
    const serious = notes.filter(([c, t]) => c === "warn" || (c === "amber" && !t.startsWith("Oily"))).length;
    if (serious && r.ready && !r.low) $("#penSub").textContent = "⚠ read the note on screen first";
    return r;
  }

  // ---------- search ----------
  let cat = null;
  function renderCats() {
    const cats = CATS.concat(mine.length ? [["mine", "My foods"]] : []);
    $("#cats").innerHTML = cats.map(([k, l]) => `<button class="chip" aria-pressed="${k === cat}" data-cat="${k}">${l}</button>`).join("");
  }
  function foodMeta(f) {
    const u = UNITS[f.u];
    const v = f.h ?? f.o;
    return `${fmt(v)} g${u && u.label ? " / " + u.label : ""}`;
  }
  function renderResults() {
    const q = $("#q").value.trim().toLowerCase();
    let list;
    if (q) {
      const words = q.split(/\s+/);
      list = ALL.filter(f => { const hay = (f.n + " " + f.alt).toLowerCase(); return words.every(w => hay.includes(w)); });
    } else if (cat) list = ALL.filter(f => f.cat === cat);
    else list = recent.map(byId).filter(Boolean);
    const head = !q && !cat && list.length ? `<li class="muted small" style="padding:4px 2px">Recently added</li>` : "";
    $("#results").innerHTML = head + list.slice(0, 60).map(f =>
      `<li><button data-food="${f.id}"><span>${esc(f.n)}</span><span class="meta">${foodMeta(f)}</span></button></li>`).join("")
      + (q && !list.length ? `<li class="muted" style="padding:10px 2px">No match for "${esc(q)}". Add it with "Add my own food" below.</li>` : "");
  }

  // ---------- sheets ----------
  const sheet = $("#sheet"), scrim = $("#scrim");
  function openSheet(html, bind) {
    sheet.onclick = null; sheet.oninput = null;
    sheet.innerHTML = html;
    sheet.classList.add("open"); scrim.classList.add("open");
    bind && bind(sheet);
    const first = sheet.querySelector("input,button"); first && setTimeout(() => first.focus({ preventScroll: true }), 50);
  }
  function closeSheet() { sheet.classList.remove("open"); scrim.classList.remove("open"); }
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

  function foodSheet(food, editIdx) {
    const ex = editIdx != null ? plate[editIdx] : null;
    const both = food.h != null && food.o != null;
    let src = ex ? ex.src : (food.h != null ? "home" : "out");
    const sizes = UNITS[food.u] && UNITS[food.u].sizes;
    let size = ex ? ex.size : (sizes ? 1 : 0);
    let qty = ex ? ex.qty : 1;
    let override = ex && ex.override ? ex.carbs : null;

    const html = `
      <h3>${esc(food.n)}</h3>
      <p class="muted small" style="margin:0">${food.cat === "mine" ? "Your food" : "Typical values"}${food.rich ? " · oily / rich" : ""}</p>
      ${both ? `<div class="seg" role="group" aria-label="Where it's from">
        <button data-src="home" aria-pressed="${src === "home"}">Made at home</button>
        <button data-src="out" aria-pressed="${src === "out"}">Dhaba / bought</button></div>`
        : `<p class="small muted" style="margin:10px 0 0">${food.h != null ? "Home-style portion" : "Dhaba / shop portion"}</p>`}
      ${sizes ? `<div class="sizes" role="group" aria-label="Size">${sizes.map((s, i) =>
        `<button class="chip" data-size="${i}" aria-pressed="${i === size}">${s[0]}</button>`).join("")}</div>` : ""}
      <div class="qty"><button data-q="-1" aria-label="Less">−</button><output id="qOut"></output><button data-q="1" aria-label="More">+</button>
        <span class="muted small">${UNITS[food.u].label ? "× " + UNITS[food.u].label : "× portion"}</span></div>
      <p class="big" id="cOut"></p>
      <label class="field"><span>Know it's different? Type the carbs (g)</span>
        <input type="number" inputmode="decimal" id="cOverride" placeholder="leave empty to use the estimate" value="${override != null ? fmt(override) : ""}"></label>
      <button class="btn pink" id="addBtn">${ex ? "Update" : "Add to plate"}</button>
      ${ex ? `<button class="btn danger" id="rmBtn">Remove from plate</button>` : ""}`;

    openSheet(html, sh => {
      const upd = () => {
        $("#qOut", sh).textContent = fmt(qty);
        const est = carbsFor(food, src, size, qty);
        const ov = num($("#cOverride", sh).value);
        $("#cOut", sh).textContent = `${fmt(ov != null ? ov : est)} g carbs`;
        $$("[data-src]", sh).forEach(b => b.setAttribute("aria-pressed", b.dataset.src === src));
        $$("[data-size]", sh).forEach(b => b.setAttribute("aria-pressed", +b.dataset.size === size));
      };
      sh.onclick = e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.src) { src = b.dataset.src; $("#cOverride", sh).value = ""; }
        if (b.dataset.size) { size = +b.dataset.size; $("#cOverride", sh).value = ""; }
        if (b.dataset.q) { qty = Math.max(0.5, qty + 0.5 * +b.dataset.q); $("#cOverride", sh).value = ""; }
        if (b.id === "addBtn") {
          const ov = num($("#cOverride", sh).value);
          const item = { id: food.id, name: food.n, src, size, qty, rich: food.rich,
            carbs: ov != null ? ov : carbsFor(food, src, size, qty), override: ov != null };
          if (ex) plate[editIdx] = item; else plate.push(item);
          recent = [food.id].concat(recent.filter(x => x !== food.id)).slice(0, 12); save(K.recent, recent);
          closeSheet(); renderPlate(); renderDose(); renderResults();
          return;
        }
        if (b.id === "rmBtn") { plate.splice(editIdx, 1); closeSheet(); renderPlate(); renderDose(); return; }
        upd();
      };
      $("#cOverride", sh).oninput = upd;
      upd();
    });
  }

  function labelSheet() {
    openSheet(`
      <h3>Packaged food</h3>
      <p class="muted small" style="margin:0">Look for "Carbohydrate" per 100 g on the pack.</p>
      <label class="field"><span>What is it?</span><input type="text" id="lName" placeholder="e.g. Kurkure, Bournvita"></label>
      <div class="row">
        <label class="field"><span>Carbs per 100 g</span><input type="number" inputmode="decimal" id="lPer"></label>
        <label class="field"><span>Grams you'll eat</span><input type="number" inputmode="decimal" id="lG"></label>
      </div>
      <p class="big" id="lOut">0 g carbs</p>
      <button class="btn pink" id="lAdd">Add to plate</button>`, sh => {
      const c = () => { const p = num($("#lPer", sh).value), g = num($("#lG", sh).value); return p && g ? p * g / 100 : 0; };
      sh.oninput = () => { $("#lOut", sh).textContent = `${fmt(c())} g carbs`; };
      $("#lAdd", sh).onclick = () => {
        const v = c(); if (!v) return;
        const name = $("#lName", sh).value.trim() || "Packaged food";
        plate.push({ id: null, name, label: `${fmt(num($("#lG", sh).value))} g`, carbs: v, qty: 1, override: true, rich: false });
        closeSheet(); renderPlate(); renderDose();
      };
    });
  }

  function customSheet() {
    openSheet(`
      <h3>Add my own food</h3>
      <p class="muted small" style="margin:0">For mom's recipes, your usual dhaba, or anything missing.</p>
      <label class="field"><span>Name</span><input type="text" id="mName" placeholder="e.g. Mom's methi paratha"></label>
      <label class="field"><span>Measured as</span>
        <select id="mUnit"><option value="pc">1 piece (small / medium / large)</option><option value="bowl">1 katori (200 ml)</option>
        <option value="glass">1 glass (250 ml)</option><option value="plate">1 plate</option><option value="fix">1 fixed portion</option></select></label>
      <div class="row">
        <label class="field"><span>Carbs, home (g)</span><input type="number" inputmode="decimal" id="mH"></label>
        <label class="field"><span>Carbs, bought (g)</span><input type="number" inputmode="decimal" id="mO" placeholder="optional"></label>
      </div>
      <div class="switch"><label for="mRich">Oily / buttery / creamy</label><input type="checkbox" id="mRich"></div>
      <p class="muted small">Tip: a medium home roti is about 15 g. If yours uses about 1½ rotis' worth of atta, it's about 22 g.</p>
      <button class="btn pink" id="mSave">Save food</button>`, sh => {
      $("#mSave", sh).onclick = () => {
        const n = $("#mName", sh).value.trim(); const h = num($("#mH", sh).value); const o = num($("#mO", sh).value);
        if (!n || (h == null && o == null)) { toast("Add a name and at least one carb number"); return; }
        mine.push({ id: "my_" + Date.now(), n, u: $("#mUnit", sh).value, h: h ?? null, o: o ?? null, rich: $("#mRich", sh).checked });
        save(K.mine, mine); rebuild(); renderCats(); renderMine();
        closeSheet(); toast("Saved to My foods");
        cat = "mine"; $("#q").value = ""; renderCats(); renderResults();
      };
    });
  }

  function saveSheet() {
    const r = calc();
    const suggested = r.ready ? r.rounded : 0;
    const icr = r.icr;
    const unitTxt = S.bgUnit === "mmol" ? "mmol/L" : "mg/dL";
    openSheet(`
      <h3>Save this meal</h3>
      <p class="muted small" style="margin:0">${MEALS.find(m => m[0] === meal)[1]} · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      <ul class="breakdown">
        <li><span>Carbs</span><span>${fmt(r.carbs)} g</span></li>
        <li><span>Food dose (${fmt(r.carbs)} ÷ ${fmt(icr)})</span><span>${fmt(r.food)} u</span></li>
        ${r.bg != null ? `<li><span>Correction (sugar ${fmt(r.bg)} ${unitTxt})</span><span>${r.corr >= 0 ? "+" : "−"}${fmt(Math.abs(r.corr))} u</span></li>` : ""}
        <li class="total"><span>Suggested, rounded to ${S.step == 0.5 ? "½" : "1"} unit</span><span>${fmt(suggested)} u</span></li>
      </ul>
      <label class="field"><span>Units you actually took</span><input type="number" inputmode="decimal" id="sTaken" value="${fmt(suggested)}" step="${S.step}"></label>
      <button class="btn pink" id="sSave">Save to log</button>
      <button class="btn ghost" id="sKeep">Save and keep plate</button>`, sh => {
      const doSave = clear => {
        const taken = num($("#sTaken", sh).value) ?? 0;
        log.unshift({ t: Date.now(), meal, carbs: r.carbs, bg: r.bg, icr, suggested, taken,
          items: plate.map(i => i.name + (i.qty !== 1 ? " ×" + i.qty : "")) });
        save(K.log, log);
        if (clear) { plate = []; $("#bgNow").value = ""; renderPlate(); }
        closeSheet(); renderDose(); renderLog(); toast("Saved to log");
      };
      $("#sSave", sh).onclick = () => doSave(true);
      $("#sKeep", sh).onclick = () => doSave(false);
    });
  }

  // ---------- log ----------
  const timeStr = t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  function renderLog() {
    if (!log.length) { $("#logList").innerHTML = `<div class="card"><p class="empty">Nothing saved yet. After you work out a dose, tap Save and it shows up here with the time, carbs and units.</p></div>`; return; }
    const days = {};
    log.forEach((e, i) => { const k = new Date(e.t).toDateString(); (days[k] = days[k] || []).push([e, i]); });
    const today = new Date().toDateString(), yest = new Date(Date.now() - 864e5).toDateString();
    $("#logList").innerHTML = Object.entries(days).slice(0, 30).map(([d, arr]) => {
      const c = arr.reduce((a, [e]) => a + e.carbs, 0), u = arr.reduce((a, [e]) => a + (e.taken || 0), 0);
      const title = d === today ? "Today" : d === yest ? "Yesterday" : new Date(arr[0][0].t).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      return `<div class="card day"><h2><span>${title}</span><span class="muted small">${fmt(c)} g · ${fmt(u)} u</span></h2>
        ${arr.map(([e, i]) => `<div class="entry"><div class="t">${timeStr(e.t)}</div>
          <div class="body"><div>${MEALS.find(m => m[0] === e.meal)?.[1] || ""} · ${fmt(e.carbs)} g${e.bg != null ? ` · sugar ${fmt(e.bg)}` : ""}</div>
          <div class="items">${esc((e.items || []).join(", "))}</div></div>
          <div class="u">${fmt(e.taken)} u</div><button class="x" data-logdel="${i}" aria-label="Delete entry">×</button></div>`).join("")}</div>`;
    }).join("");
  }

  // ---------- settings ----------
  function fillSettings() {
    $("#perMeal").checked = S.perMeal;
    $("#icrOne").value = S.icr ?? "";
    $$("#icrMealWrap input").forEach(i => i.value = S.icrMeal[i.dataset.meal] ?? "");
    $("#icrOneWrap").classList.toggle("hide", S.perMeal);
    $("#icrMealWrap").classList.toggle("hide", !S.perMeal);
    $("#step").value = String(S.step);
    $("#corrOn").checked = S.corrOn;
    $("#corrWrap").classList.toggle("hide", !S.corrOn);
    $("#bgUnit").value = S.bgUnit;
    $("#target").value = S.target ?? ""; $("#isf").value = S.isf ?? "";
    $("#target").placeholder = S.bgUnit === "mmol" ? "e.g. 6.5" : "e.g. 120";
    $("#isf").placeholder = S.bgUnit === "mmol" ? "e.g. 2.5" : "e.g. 50";
    $("#warnAbove").value = S.warnAbove ?? ""; $("#iobHours").value = S.iobHours ?? "";
  }
  function readSettings() {
    S.perMeal = $("#perMeal").checked;
    S.icr = num($("#icrOne").value);
    $$("#icrMealWrap input").forEach(i => S.icrMeal[i.dataset.meal] = num(i.value));
    if (S.perMeal && !S.icr) S.icr = S.icrMeal.lunch || S.icrMeal.dinner || S.icrMeal.breakfast || S.icrMeal.snack;
    S.step = +$("#step").value;
    S.corrOn = $("#corrOn").checked;
    S.bgUnit = $("#bgUnit").value;
    S.target = num($("#target").value); S.isf = num($("#isf").value);
    S.warnAbove = num($("#warnAbove").value); S.iobHours = num($("#iobHours").value) || 3;
    save(K.set, S);
    $("#icrOneWrap").classList.toggle("hide", S.perMeal);
    $("#icrMealWrap").classList.toggle("hide", !S.perMeal);
    $("#corrWrap").classList.toggle("hide", !S.corrOn);
    $("#target").placeholder = S.bgUnit === "mmol" ? "e.g. 6.5" : "e.g. 120";
    $("#isf").placeholder = S.bgUnit === "mmol" ? "e.g. 2.5" : "e.g. 50";
    renderDose();
  }
  function renderMine() {
    $("#mineList").innerHTML = mine.length ? mine.map((m, i) =>
      `<li><span>${esc(m.n)} <span class="muted small">${m.h != null ? fmt(m.h) + " g home" : ""}${m.h != null && m.o != null ? " · " : ""}${m.o != null ? fmt(m.o) + " g bought" : ""}</span></span>
       <button class="x" data-minedel="${i}" aria-label="Delete ${esc(m.n)}">×</button></li>`).join("")
      : `<li class="muted small" style="border:0">None yet.</li>`;
  }

  // ---------- misc ----------
  let tt;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 1800); }

  function showView(v) {
    ["calc", "log", "set"].forEach(x => $("#view-" + x).classList.toggle("hide", x !== v));
    $$(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
    $("#pen").classList.toggle("hide", v !== "calc");
    if (v === "log") renderLog();
    if (v === "set") { fillSettings(); renderMine(); }
    window.scrollTo(0, 0);
  }

  // ---------- events ----------
  document.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || sheet.contains(b)) return;
    const d = b.dataset;
    if (d.meal) { meal = d.meal; renderMeals(); renderDose(); }
    else if (d.view) showView(d.view);
    else if (d.cat) { cat = cat === d.cat ? null : d.cat; $("#q").value = ""; renderCats(); renderResults(); }
    else if (d.food) foodSheet(byId(d.food));
    else if (d.quick) foodSheet(byId(d.quick));
    else if (d.edit != null) { const it = plate[+d.edit]; const f = it.id && byId(it.id); if (f) foodSheet(f, +d.edit); }
    else if (d.del != null) { plate.splice(+d.del, 1); renderPlate(); renderDose(); }
    else if (d.logdel != null) { if (confirm("Delete this log entry?")) { log.splice(+d.logdel, 1); save(K.log, log); renderLog(); renderDose(); } }
    else if (d.minedel != null) { if (confirm("Delete this food?")) { mine.splice(+d.minedel, 1); save(K.mine, mine); rebuild(); renderMine(); renderCats(); } }
  });
  $("#q").addEventListener("input", () => { if ($("#q").value) { cat = null; renderCats(); } renderResults(); });
  $("#bgNow").addEventListener("input", renderDose);
  $("#penSave").addEventListener("click", saveSheet);
  $("#openLabel").addEventListener("click", labelSheet);
  $("#openCustom").addEventListener("click", customSheet);
  $("#openCustom2").addEventListener("click", customSheet);
  $("#setupSave").addEventListener("click", () => {
    const v = num($("#setupIcr").value);
    if (!v || v <= 0) { toast("Enter a number like 10"); return; }
    S.icr = v; save(K.set, S); renderDose(); toast("Ratio saved");
  });
  $("#view-set").addEventListener("input", readSettings);
  $("#view-set").addEventListener("change", () => { readSettings(); fillSettings(); });

  $("#exportBtn").addEventListener("click", () => {
    const data = { app: "khurak-t1d", v: 1, exported: new Date().toISOString(), settings: S, log, mine };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
    a.download = `khurak-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.log)) throw 0;
      if (!confirm(`Restore backup with ${d.log.length} log entries? This replaces what's on this phone.`)) return;
      S = Object.assign({}, DEFAULTS, d.settings || {}); log = d.log; mine = d.mine || [];
      save(K.set, S); save(K.log, log); save(K.mine, mine); rebuild();
      renderCats(); renderLog(); renderDose(); toast("Backup restored");
    } catch { toast("That file isn't a Khurak backup"); }
    e.target.value = "";
  });

  // ---------- go ----------
  renderMeals(); renderCats(); renderPlate(); renderResults(); renderDose();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
