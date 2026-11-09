// MSA Golf Club, версия 4: полоса 9 лунок, удар пальцем, карта лунки.
(function () {
  var tiho = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Полоса 9 лунок: где гость на сайте
  var razdely = Array.prototype.slice.call(document.querySelectorAll('[data-lunka]'));
  var tochki = Array.prototype.slice.call(document.querySelectorAll('#lunkiRyad i'));
  var myachL = document.getElementById('lunkiMyach');
  var imyaL = document.getElementById('lunkiImya');
  var proshlo = '';
  function verh(el) { return el.getBoundingClientRect().top + scrollY; }
  function lunki() {
    if (!razdely.length || !myachL) return;
    var linia = scrollY + innerHeight * 0.45;
    var tek = razdely[0];
    razdely.forEach(function (s) { if (verh(s) <= linia) tek = s; });
    var n = +tek.dataset.lunka;
    // Начало каждой лунки: первый раздел с её номером
    var nachalo = {};
    razdely.forEach(function (s) { var k = +s.dataset.lunka; if (!(k in nachalo)) nachalo[k] = verh(s); });
    var p = 0;
    if (nachalo[n + 1]) p = Math.min(1, Math.max(0, (linia - nachalo[n]) / (nachalo[n + 1] - nachalo[n])));
    var a = tochki[n - 1], b = tochki[Math.min(n, 8)];
    var x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * p;
    myachL.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    var metka = n + '|' + tek.dataset.imya;
    if (metka !== proshlo) {
      proshlo = metka;
      imyaL.innerHTML = '<b>Лунка ' + n + '</b> · ' + tek.dataset.imya;
      tochki.forEach(function (t, i) { t.classList.toggle('proshli', i < n); });
    }
  }
  var zhdu = false;
  addEventListener('scroll', function () { if (!zhdu) { zhdu = true; requestAnimationFrame(function () { zhdu = false; lunki(); }); } }, { passive: true });
  addEventListener('resize', lunki);
  addEventListener('load', lunki);
  lunki();

  // 2. Удар пальцем
  var svg = document.getElementById('udarSvg');
  if (svg) {
    var myach = document.getElementById('udarMyach');
    var ten = document.getElementById('udarTen');
    var pricel = document.getElementById('udarPricel');
    var tyaga = document.getElementById('udarTyaga');
    var status = document.getElementById('udarStatus');
    var schetEl = document.getElementById('udarSchet');
    var zapis = document.getElementById('udarZapis');
    var podskazka = document.getElementById('udarPodskazka');
    var flag = document.getElementById('udarFlag');
    var TI = { x: 72, y: 214 }, LUNKA = { x: 326, y: 97 };
    var MAX = 110, K = 3;
    var tyanu = false, letit = false, udarov = 0, popal = false, sila = null;

    function tochka(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    function masshtab(y) { return 0.55 + 0.45 * Math.min(1, Math.max(0, (y - 60) / (TI.y - 60))); }
    function postavit(x, y, zemlyaY, s) {
      myach.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')');
      ten.setAttribute('cx', x.toFixed(1)); ten.setAttribute('cy', (zemlyaY + 8 * s).toFixed(1));
      ten.setAttribute('rx', (10 * s).toFixed(1)); ten.setAttribute('ry', (3.5 * s).toFixed(1));
    }
    function nazad() { postavit(TI.x, TI.y, TI.y, 1); myach.style.opacity = 1; ten.style.opacity = 1; }
    function duga(cel) {
      var dx = cel.x - TI.x, dy = cel.y - TI.y, d = Math.hypot(dx, dy);
      return { x: (TI.x + cel.x) / 2, y: (TI.y + cel.y) / 2 - d * 0.55 };
    }
    function slovo(n) {
      if (n === 1) return 'с первого удара';
      var o = n % 10, s = n % 100;
      var f = (o === 1 && s !== 11) ? 'удар' : (o >= 2 && o <= 4 && (s < 12 || s > 14)) ? 'удара' : 'ударов';
      return 'за ' + n + ' ' + f;
    }
    function pokazPricel(cel) {
      var c = duga(cel);
      pricel.setAttribute('d', 'M' + TI.x + ' ' + TI.y + ' Q ' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + cel.x.toFixed(1) + ' ' + cel.y.toFixed(1));
    }
    function itog(cel) {
      var doLunki = Math.hypot(cel.x - LUNKA.x, cel.y - LUNKA.y);
      var dalnost = Math.hypot(cel.x - TI.x, cel.y - TI.y), nuzhno = Math.hypot(LUNKA.x - TI.x, LUNKA.y - TI.y);
      if (doLunki < 22) {
        popal = true;
        status.innerHTML = '<b>В лунку ' + slovo(udarov) + '.</b> Гольф требует точности, а не силы.';
        zapis.hidden = false;
        if (!tiho && flag.animate) flag.animate([{ transform: 'skewY(0)' }, { transform: 'skewY(-12deg)' }, { transform: 'skewY(6deg)' }, { transform: 'skewY(0)' }], { duration: 700 });
        myach.style.opacity = 0; ten.style.opacity = 0;
        setTimeout(nazad, 1600);
        return;
      }
      if (cel.x < -10 || cel.x > 410 || cel.y < -10) status.textContent = 'Мяч улетел за поле. Тяните слабее.';
      else if (doLunki < 45) status.textContent = 'Совсем рядом. Ещё чуть точнее.';
      else if (dalnost < nuzhno - 30) status.textContent = 'Недолёт. Тяните сильнее.';
      else if (dalnost > nuzhno + 30) status.textContent = 'Перелёт. Тяните слабее.';
      else status.textContent = 'Мимо. Цельтесь на флажок.';
      setTimeout(function () { if (!letit) nazad(); }, 900);
    }
    function udar(cel) {
      if (popal) { popal = false; udarov = 0; }
      udarov++;
      schetEl.textContent = 'Ударов: ' + udarov;
      pricel.setAttribute('d', ''); tyaga.setAttribute('opacity', 0);
      if (tiho) { postavit(cel.x, cel.y, cel.y, masshtab(cel.y)); itog(cel); return; }
      letit = true;
      var c = duga(cel), t0 = performance.now(), dl = 950;
      (function kadr(now) {
        var t = Math.min(1, (now - t0) / dl), u = 1 - t;
        var x = u * u * TI.x + 2 * u * t * c.x + t * t * cel.x;
        var y = u * u * TI.y + 2 * u * t * c.y + t * t * cel.y;
        var zy = TI.y + (cel.y - TI.y) * t;
        postavit(x, y, zy, masshtab(zy) * (1 + 0.25 * Math.sin(Math.PI * t)));
        if (t < 1) requestAnimationFrame(kadr); else { letit = false; itog(cel); }
      })(t0);
    }
    function nachat(e) {
      if (letit) return;
      tyanu = true; sila = null;
      podskazka.classList.add('skryt');
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    myach.addEventListener('pointerdown', nachat);
    svg.addEventListener('pointermove', function (e) {
      if (!tyanu) return;
      var p = tochka(e), vx = TI.x - p.x, vy = TI.y - p.y, d = Math.hypot(vx, vy);
      if (d > MAX) { vx *= MAX / d; vy *= MAX / d; }
      sila = { x: vx, y: vy };
      tyaga.setAttribute('x1', TI.x); tyaga.setAttribute('y1', TI.y);
      tyaga.setAttribute('x2', (TI.x - vx).toFixed(1)); tyaga.setAttribute('y2', (TI.y - vy).toFixed(1));
      tyaga.setAttribute('opacity', 0.8);
      pokazPricel({ x: TI.x + vx * K, y: TI.y + vy * K });
    });
    function otpustit() {
      if (!tyanu) return;
      tyanu = false;
      if (!sila || Math.hypot(sila.x, sila.y) < 12) { pricel.setAttribute('d', ''); tyaga.setAttribute('opacity', 0); return; }
      udar({ x: TI.x + sila.x * K, y: TI.y + sila.y * K });
    }
    svg.addEventListener('pointerup', otpustit);
    svg.addEventListener('pointercancel', otpustit);
    document.getElementById('udarAvto').addEventListener('click', function () {
      if (letit) return;
      podskazka.classList.add('skryt');
      udar({ x: LUNKA.x + (Math.random() - 0.5) * 60, y: LUNKA.y + (Math.random() - 0.5) * 30 });
    });
  }

  // 3. Карта лунки: касание по зоне
  var ZONY = [
    ['Старт', 'Здесь начинается каждая лунка. Мяч можно поставить на подставку, ти. Первый удар обычно самый дальний.'],
    ['Фервей', 'Ровная короткая трава от старта до грина. Задача: держать мяч на ней, отсюда бить проще всего.'],
    ['Раф', 'Высокая трава по краям фервея. Мяч в ней сидит глубже, и удар выходит труднее.'],
    ['Бункер', 'Яма с песком у грина или у фервея. Из песка мяч выбивают высоким ударом, обычно клюшкой ведж.'],
    ['Грин', 'Самая короткая трава и лунка с флажком. Здесь мяч не бьют, а катят клюшкой паттер.']
  ];
  var info = document.getElementById('klInfo');
  if (info) {
    var knopki = document.querySelectorAll('.kl-tochka');
    knopki.forEach(function (k) {
      k.addEventListener('click', function () {
        var i = +k.dataset.zona;
        knopki.forEach(function (o) { o.setAttribute('aria-pressed', o === k ? 'true' : 'false'); });
        document.getElementById('klNomer').textContent = (i + 1) + ' из 5';
        document.getElementById('klZag').textContent = ZONY[i][0];
        document.getElementById('klTekst').textContent = ZONY[i][1];
        if (!tiho) { info.classList.remove('mig'); void info.offsetWidth; info.classList.add('mig'); }
      });
    });
  }
})();
