/* Общий скрипт стилей «Лайт» и «Продающий»: шапка, палитры для галереи, мессенджеры, запись и калькулятор. Без библиотек. */
(() => {
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // шапка: тень после прокрутки
  const bar = document.querySelector("[data-s-bar]");
  const onScroll = () => bar && bar.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // палитры для галереи: ?p=Б или postMessage({ palette: "Б" }) из окна галереи
  const pals = body.dataset.sPalettes ? JSON.parse(body.dataset.sPalettes) : null;
  const applyPalette = (k) => {
    if (!pals || !pals[k]) return;
    for (const [v, hex] of Object.entries(pals[k].vars)) document.documentElement.style.setProperty("--c-" + v, hex);
  };
  if (pals) {
    const q = new URLSearchParams(location.search).get("p"); if (q) applyPalette(q);
    addEventListener("message", (e) => { if (e.data && e.data.palette) applyPalette(e.data.palette); });
  }

  // появление секций (только «Продающий»)
  const rev = document.querySelectorAll(".s-reveal");
  if (rev.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add("is-in"));

  // ---- сообщение в мессенджер
  const brand = (document.querySelector(".s-bar__brand") || {}).textContent || "";
  let message = "Здравствуйте! Пишу с сайта «" + brand.trim() + "».";
  const bubble = document.querySelector("[data-s-bubble]");
  const setMessage = (t) => { message = t; if (bubble) bubble.textContent = t; };
  const isSlot = (s) => !s || /\{\{/.test(s);
  const digits = (s) => String(s).replace(/\D/g, "");
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-s-msg]"); if (!a) return;
    e.preventDefault();
    const kind = a.dataset.sMsg;
    if (kind === "whatsapp") {
      const n = body.dataset.wa; const url = (isSlot(n) ? "https://wa.me/" : "https://wa.me/" + digits(n)) + "?text=" + encodeURIComponent(message);
      window.open(url, "_blank", "noopener"); return;
    }
    // Telegram и MAX не принимают готовый текст по ссылке: копируем его и открываем чат
    try { await navigator.clipboard.writeText(message); } catch (_) {}
    const note = a.closest("form, .s-contacts")?.parentElement?.querySelector("[data-s-copied]") || document.querySelector("[data-s-copied]");
    if (note) { note.hidden = false; setTimeout(() => (note.hidden = true), 4000); }
    const tg = body.dataset.tg; const user = isSlot(tg) ? "" : String(tg).replace(/^@|https?:\/\/t\.me\//g, "");
    window.open("https://t.me/" + user, "_blank", "noopener");
  });

  // неразрывные пробелы: сумма не рвётся переносом
  const rub = (n) => Math.round(n).toLocaleString("ru-RU").replace(/[   ]/g, " ") + " ₽";

  // ---- заявка на запись: несколько услуг, текст для WhatsApp, без выдуманных свободных окон
  const booking = document.querySelector("[data-s-booking]");
  if (booking) {
    const daysBox = booking.querySelector("[data-s-days]"), timesBox = booking.querySelector("[data-s-times]");
    const countEl = booking.querySelector("[data-s-count]"), errEl = booking.querySelector("[data-s-err]"), comment = booking.querySelector("[data-s-comment]");
    const closed = (booking.dataset.closed || "").split(",").filter(Boolean).map(Number);
    const slots = (booking.dataset.slots || "").split(",").filter(Boolean);
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], mon = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const monFull = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const today = new Date(); let made = 0;
    for (let i = 0; made < +booking.dataset.days && i < 21; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (closed.includes(d.getDay())) continue;
      const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : wd[d.getDay()] + ", " + d.getDate() + " " + mon[d.getMonth()];
      const full = d.getDate() + " " + monFull[d.getMonth()];
      daysBox.insertAdjacentHTML("beforeend", '<label class="s-chip"><input type="radio" name="day" value="' + made + '" data-full="' + full + '"' + (made === 0 ? " checked" : "") + "><span>" + label + "</span></label>");
      made++;
    }
    const drawTimes = () => {
      const keep = timesBox.querySelector("input:checked")?.value;
      const first = daysBox.querySelector("input:checked")?.value === "0";
      const nowH = today.getHours() + today.getMinutes() / 60;
      timesBox.innerHTML = "";
      let any = false;
      slots.forEach((t) => {
        const [h, m] = t.split(":").map(Number); const past = first && h + m / 60 <= nowH;
        const on = !past && (keep ? keep === t : !any);
        if (!past) any = true;
        timesBox.insertAdjacentHTML("beforeend", '<label class="s-chip"' + (past ? ' aria-disabled="true"' : "") + '><input type="radio" name="time" value="' + t + '"' + (past ? " disabled" : on ? " checked" : "") + "><span>" + t + "</span></label>");
      });
      if (!timesBox.querySelector("input:checked")) { const f = timesBox.querySelector("input:not([disabled])"); if (f) f.checked = true; }
      if (!any) timesBox.insertAdjacentHTML("beforeend", '<p class="s-demo">На сегодня время уже прошло – выберите другую дату.</p>');
    };
    const chosen = () => [...booking.querySelectorAll("input[name=svc]:checked")].map((i) => i.value);
    const build = () => {
      const s = chosen(), d = daysBox.querySelector("input:checked"), t = timesBox.querySelector("input:checked");
      const c = comment.value.trim().replace(/\s*\n\s*/g, " ");
      return ["Здравствуйте! Хочу записаться в VM Avto.", "Услуги:"].concat(s.length ? s.map((x) => "— " + x) : ["— (выберите услуги)"],
        ["Желаемая дата: " + (d ? d.dataset.full : "уточню"), "Удобное время: " + (t ? t.value : "уточню"), "Автомобиль и описание проблемы: " + (c || "напишу ниже"), "Подскажите, пожалуйста, возможность записи и стоимость."]).join("\n");
    };
    const update = () => {
      const n = chosen().length;
      countEl.textContent = "Выбрано услуг: " + n;
      if (n) errEl.hidden = true;
      setMessage(build());
    };
    daysBox.addEventListener("change", () => { drawTimes(); update(); });
    booking.addEventListener("change", update);
    comment.addEventListener("input", update);
    drawTimes(); update();
    // нет выбранных услуг – WhatsApp не открываем (ловим клик раньше общего обработчика)
    document.addEventListener("click", (e) => {
      const a = e.target.closest('[data-s-msg="whatsapp"]'); if (!a || chosen().length) return;
      e.preventDefault(); e.stopImmediatePropagation();
      errEl.hidden = false; booking.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, true);
    // копирование текста заявки вручную
    booking.querySelector("[data-s-copy]").addEventListener("click", async () => {
      const note = booking.querySelector("[data-s-copied]");
      try { await navigator.clipboard.writeText(message); } catch (_) {
        const ta = document.createElement("textarea"); ta.value = message; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (__) {} ta.remove();
      }
      note.hidden = false; setTimeout(() => (note.hidden = true), 3000);
    });
  }

  // ---- калькулятор
  const calc = document.querySelector("[data-s-calc]");
  if (calc) {
    const per = JSON.parse(calc.dataset.per || "{}"); // { "canvas": "area" } – цена варианта умножается на значение поля area
    const totalEl = calc.querySelector("[data-s-total]");
    let shown = 0;
    const animateTo = (v) => {
      if (reduce) { totalEl.textContent = rub(v); shown = v; return; }
      const from = shown, t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 280); totalEl.textContent = rub(from + (v - from) * k); if (k < 1) requestAnimationFrame(step); else shown = v; };
      requestAnimationFrame(step);
    };
    const val = (id) => { const el = calc.querySelector(`input[type=range][name="${id}"]`); return el ? +el.value : 1; };
    const update = () => {
      let total = +calc.dataset.base || 0; const picks = [];
      // поля в порядке, как они стоят в форме: так и сообщение читается по-человечески
      calc.querySelectorAll("input").forEach((el) => {
        if (el.type === "range") {
          calc.querySelector(`[data-s-out="${el.name}"]`).textContent = el.value;
          total += (+el.dataset.price || 0) * +el.value;
          picks.push(el.dataset.say ? el.dataset.say.replace("{v}", el.value) : el.dataset.label.toLowerCase() + " " + el.value + (el.dataset.unit ? " " + el.dataset.unit : ""));
        } else if (el.type === "radio" && el.checked) {
          total += (+el.dataset.price || 0) * (per[el.name] ? val(per[el.name]) : 1);
          picks.push(el.dataset.label.toLowerCase());
        } else if (el.type === "checkbox" && el.checked) {
          total += (+el.dataset.price || 0) * (per[el.name] ? val(per[el.name]) : 1);
          picks.push(el.dataset.label.toLowerCase());
        }
      });
      const min = +calc.dataset.min || 0; let minNote = "";
      if (min && total < min) { total = min; minNote = " (" + calc.dataset.minNote + ")"; }
      animateTo(total);
      setMessage(calc.dataset.message.replace("{выбор}", picks.join(", ")).replace("{итого}", rub(total) + minNote));
    };
    calc.addEventListener("input", update); calc.addEventListener("change", update); update();
  }
})();
