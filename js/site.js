// MSA Golf Club: движение по прокрутке. Сквозная нить: путь мяча от первого удара до лунки.
(function () {
  var root = document.documentElement;

  // Тема
  var tema = document.querySelector('.tema');
  tema.addEventListener('click', function () {
    var light = root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
    root.dataset.theme = light ? 'dark' : 'light';
    try { localStorage.setItem('msa-tema', root.dataset.theme); } catch (e) {}
  });

  // Линии высот поля, как на карте гольф-поля
  var relief = document.getElementById('relief');
  if (relief) {
    var d = '';
    var centers = [[880, 300], [260, 640]];
    centers.forEach(function (c, ci) {
      for (var k = 1; k <= 9; k++) {
        var r = 40 + k * 46;
        var pts = [];
        for (var a = 0; a <= 64; a++) {
          var t = a / 64 * Math.PI * 2;
          var w = 1 + 0.12 * Math.sin(3 * t + k * 0.7 + ci) + 0.07 * Math.sin(5 * t - k * 0.4);
          pts.push([c[0] + Math.cos(t) * r * w * 1.35, c[1] + Math.sin(t) * r * w]);
        }
        d += '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z"/>';
      }
    });
    relief.innerHTML = '<g id="reliefG">' + d + '</g>';
  }

  // Слова цитат: каждое слово в своём span
  document.querySelectorAll('.citata p').forEach(function (p) {
    p.innerHTML = p.textContent.split(' ').map(function (w) { return '<span class="sl">' + w + '</span>'; }).join(' ');
  });

  // Шапка плотнеет после первого экрана, полоска пути
  var shapka = document.getElementById('shapka');
  var put = document.getElementById('put');
  var plav = document.getElementById('plav');
  var heroEl = document.getElementById('hero');
  var finalEl = document.getElementById('scenaFinal');
  function naScroll() {
    shapka.classList.toggle('plotno', scrollY > 40);
    if (plav) {
      var pokazat = scrollY > heroEl.offsetHeight - 120 && finalEl.getBoundingClientRect().top > innerHeight - 80;
      if (pokazat !== plav.classList.contains('vidno')) {
        plav.classList.toggle('vidno', pokazat);
        plav.tabIndex = pokazat ? 0 : -1;
        plav.setAttribute('aria-hidden', pokazat ? 'false' : 'true');
      }
    }
    var max = document.documentElement.scrollHeight - innerHeight;
    if (put) put.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  }
  addEventListener('scroll', naScroll, { passive: true });
  naScroll();

  var tiho = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Наклон карточек за пальцем или мышью
  if (!tiho && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.karta').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  function start() {
    if (tiho || !window.gsap || !window.ScrollTrigger) {
      document.querySelectorAll('.citata .sl').forEach(function (s) { s.style.opacity = 1; });
      var m = document.getElementById('myach'); if (m) m.style.display = 'none';
      return;
    }
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    // Адресная строка телефона прячется при листании: не пересчитывать всё заново
    ScrollTrigger.config({ ignoreMobileResize: true });
    var shirokiy = innerWidth >= 960;
    // Появление: элемент проявляется сразу у нижнего края экрана, без пустых мест
    function poyavlenie(sel, ot) {
      gsap.utils.toArray(sel).forEach(function (el) {
        gsap.from(el, Object.assign({ y: 32, opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 80%', scrub: 0.4 } }, ot || {}));
      });
    }
    var ease = 'power3.out';

    // 1. Первый удар: дуга от кнопки к арке
    var hero = document.getElementById('hero');
    var startBtn = document.getElementById('start');
    var arka = document.getElementById('arka');
    var dugaPut = document.getElementById('dugaPut');
    var myach = document.getElementById('myach');
    function stroimDugu() {
      var h = hero.getBoundingClientRect();
      var s = startBtn.getBoundingClientRect();
      var a = arka.getBoundingClientRect();
      var x1 = s.right - h.left - 24, y1 = s.top - h.top - 18;
      var x2 = a.left - h.left + a.width * 0.5, y2 = a.top - h.top + a.height * 0.86;
      if (innerWidth < 960) { x2 = a.left - h.left + a.width * 0.7; y2 = a.top - h.top - 20; }
      var cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - Math.max(160, Math.abs(x2 - x1) * 0.5);
      dugaPut.setAttribute('d', 'M' + x1 + ' ' + y1 + ' Q ' + cx + ' ' + cy + ' ' + x2 + ' ' + y2);
      gsap.set(myach, { x: x1, y: y1 });
    }
    stroimDugu();
    var len = dugaPut.getTotalLength();
    gsap.set(dugaPut, { strokeDashoffset: 0 });

    var heroTl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=' + (innerWidth >= 960 ? 900 : 500), scrub: 0.8, pin: innerWidth >= 960, invalidateOnRefresh: true, onRefresh: stroimDugu }
    });
    heroTl
      .to(myach, { motionPath: { path: dugaPut, align: dugaPut, alignOrigin: [0.5, 0.5] }, rotation: 540, ease: 'power1.inOut', duration: 1 }, 0)
      .fromTo(dugaPut, { strokeDasharray: '2 10', opacity: 0 }, { opacity: 0.8, duration: 0.2 }, 0)
      .to('#arka', { rotateY: -10, rotateX: 4, scale: 1.06, ease: 'none', duration: 1 }, 0)
      .to('#arka img', { yPercent: -10, scale: 1.08, ease: 'none', duration: 1 }, 0)
      .to('#zag .slovo', { yPercent: -40, opacity: 0.25, stagger: 0.04, ease: 'none', duration: 0.6 }, 0.4)
      .to('.hero .pod, .hero .fishki', { y: -60, opacity: 0, ease: 'none', duration: 0.5 }, 0.45)
      .to('#reliefG', { rotation: 8, scale: 1.12, transformOrigin: '50% 50%', ease: 'none', duration: 1 }, 0)
      .to('.flazhok .tkan', { skewY: -8, scaleX: 0.9, ease: 'sine.inOut', duration: 0.5, yoyo: true, repeat: 1 }, 0.5)
      .to(myach, { scale: 0.4, opacity: 0, duration: 0.15 }, 0.9);

    // Флажок колышется сам, тихо
    gsap.to('.flazhok .tkan', { skewY: 4, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    // Линии рисуются при входе
    gsap.from('#reliefG path', { strokeDasharray: 3000, strokeDashoffset: 3000, duration: 2.4, ease: 'power2.out', stagger: 0.04 });

    // Общий показ заголовков и абзацев по прокрутке
    poyavlenie('.pokaz');

    // 2. Карточки встают из глубины (на компьютере), на телефоне просто поднимаются
    if (shirokiy) {
      gsap.from('.karta', {
        y: 140, z: -260, rotateX: 28, opacity: 0, stagger: 0.12, ease: 'none',
        scrollTrigger: { trigger: '.karty', start: 'top 95%', end: 'top 55%', scrub: 0.8 }
      });
    } else {
      poyavlenie('.karta', { y: 48, scale: 0.96 });
    }

    // Слова цитат загораются
    ['#citata1', '#citata2'].forEach(function (id) {
      gsap.to(id + ' .sl', { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: id, start: 'top 90%', end: 'bottom 65%', scrub: 0.4 } });
    });

    // 3. Дорожка: лента едет вбок на компьютере, мяч катится к лунке
    var mm = gsap.matchMedia();
    var farveiM = document.getElementById('farveiM');
    mm.add('(min-width: 960px)', function () {
      var lenta = document.getElementById('lenta');
      var okno = document.querySelector('#dorozhka .okno');
      function sdvig() { return -(lenta.scrollWidth - okno.clientWidth + 80); }
      var tl = gsap.timeline({ scrollTrigger: { trigger: '#scenaKak', start: 'top top', end: function () { return '+=' + Math.abs(sdvig()); }, scrub: 0.8, pin: true, invalidateOnRefresh: true } });
      tl.to(lenta, { x: sdvig, ease: 'none' }, 0)
        .to(farveiM, { left: 'calc(100% - 58px)', rotation: 720, ease: 'none' }, 0);
      gsap.from('.shag', { rotateY: -18, opacity: 0.3, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#scenaKak', start: 'top 70%', end: 'top top', scrub: 0.6 } });
    });
    mm.add('(max-width: 959px)', function () {
      poyavlenie('.shag', { y: 48, scale: 0.96 });
      gsap.to(farveiM, { left: 'calc(100% - 58px)', rotation: 720, ease: 'none', scrollTrigger: { trigger: '#lenta', start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
    });

    // 4. Портрет раскрывается шторкой, внутри параллакс
    if (shirokiy) {
      gsap.fromTo('#portret', { clipPath: 'inset(42% 12% 42% 12% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: '#portret', start: 'top 90%', end: 'top 30%', scrub: 0.7 } });
    } else {
      poyavlenie('#portret', { y: 40, scale: 0.94 });
    }
    gsap.fromTo('#portret img', { yPercent: -12, scale: 1.2 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '#portret', start: 'top bottom', end: 'bottom top', scrub: true } });
    // Цифры считаются
    document.querySelectorAll('.schet b[data-do]').forEach(function (b) {
      var to = +b.dataset.do, plus = b.dataset.plus || '', from = to > 2000 && to < 2100 ? 1990 : 0, o = { v: from };
      gsap.to(o, { v: to, ease: 'none', scrollTrigger: { trigger: b, start: 'top 100%', end: 'top 70%', scrub: 0.4 },
        onUpdate: function () { b.textContent = Math.round(o.v) + (o.v >= to ? plus : ''); } });
    });
    poyavlenie('.schet div');

    // 5. Поле приближается
    gsap.fromTo('#poleFoto img', { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: '#poleFoto', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('#poleFoto h2', { y: 48, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#poleFoto', start: 'top 85%', end: 'top 45%', scrub: 0.4 } });
    poyavlenie('.galereya', { x: 48, y: 0 });
    poyavlenie('.vrem li', { y: 24 });
    poyavlenie('.partnery li');
    poyavlenie('.ig', { x: 48, y: 0 });

    // 6. Бегущая строка от прокрутки
    gsap.fromTo('#beg', { xPercent: 0 }, { xPercent: -35, ease: 'none', scrollTrigger: { trigger: '#beg', start: 'top bottom', end: 'bottom top', scrub: 0.4 } });

    // 7. Вопросы
    poyavlenie('.voprosy details', { y: 24 });

    // 8. Мяч катится и падает в лунку, флажок вздрагивает
    var fin = gsap.timeline({ scrollTrigger: { trigger: '#grin', start: 'top 90%', end: 'top 35%', scrub: 0.8 } });
    fin.fromTo('#finalM', { left: 0, bottom: 60, rotation: 0 }, { left: 'calc(50% - 9px)', bottom: 34, rotation: 540, ease: 'power1.in', duration: 0.8 })
      .to('#finalM', { scale: 0.3, opacity: 0, duration: 0.15 })
      .to('#shtok', { rotation: 6, duration: 0.08, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<');

    addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
