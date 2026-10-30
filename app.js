// Настройки контактов. Меняются здесь — ссылки на кнопках соберутся сами.
const CONFIG = {
  telegram: 'Kazirotti',      // ник без @, сюда ведут все кнопки записи
  whatsapp: '79272577736',    // номер без +
  channelUrl: '',             // ссылка на Telegram-канал, например https://t.me/имя_канала
  reviewsUrl: '',             // ссылка на все отзывы (пост, альбом, Яндекс Карты)
};

const MESSAGES = {
  first: 'Здравствуйте! Хочу записаться на первое занятие.',
  car: 'Здравствуйте! Хочу записаться на занятие.',
  question: 'Здравствуйте! У меня вопрос по занятиям.',
  pack: (name, count) => `Здравствуйте! Хочу пакет «${name}» — ${count} ${plural(count, 'занятие', 'занятия', 'занятий')}.`,
};

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const tgLink = (text) => `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`;
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

const tg = window.Telegram && window.Telegram.WebApp;
const inTelegram = Boolean(tg && tg.initData);

// ---------- Ссылки на кнопках ----------
function linkFor(el) {
  const d = el.dataset;
  if (d.book) return tgLink(MESSAGES[d.book] || MESSAGES.first);
  if (d.pack) return tgLink(MESSAGES.pack(d.pack, Number(d.count)));
  if (d.contact === 'tg') return tgLink(MESSAGES.question);
  if (d.contact === 'wa') return waLink(MESSAGES.question);
  if (d.link === 'channel') return CONFIG.channelUrl;
  if (d.link === 'reviews') return CONFIG.reviewsUrl;
  return '';
}

function openUrl(url) {
  if (inTelegram) {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    // ссылки t.me открываем внутри Telegram, остальные — во внешнем браузере
    if (url.startsWith('https://t.me/')) tg.openTelegramLink(url);
    else tg.openLink(url);
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

document.querySelectorAll('[data-book], [data-pack], [data-contact], [data-link]').forEach((el) => {
  const url = linkFor(el);
  if (!url) { el.hidden = true; return; } // ссылка ещё не задана в CONFIG — кнопку не показываем
  el.href = url;
  el.target = '_blank';
  el.rel = 'noopener';
  el.addEventListener('click', (e) => { e.preventDefault(); openUrl(url); });
});

// ---------- Telegram Mini App ----------
if (inTelegram) {
  tg.ready();
  tg.expand();
  const page = '#F2F4F8';
  tg.setHeaderColor(page);
  tg.setBackgroundColor(page);
  if (tg.isVersionAtLeast('7.10')) tg.setBottomBarColor(page);
  if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes(); // длинная страница не закрывается при прокрутке вверх

  // Нижняя кнопка Telegram «Записаться» видна, когда на экране нет других кнопок записи
  const main = tg.MainButton;
  main.setParams({ text: 'Записаться на первое занятие', color: '#141414', text_color: '#FFFFFF' });
  main.onClick(() => openUrl(tgLink(MESSAGES.first)));

  const bookButtons = document.querySelectorAll('[data-book], [data-pack]');
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
    visible.size ? main.hide() : main.show();
  });
  bookButtons.forEach((b) => io.observe(b));
}

// ---------- Машинка на маршруте А → Б ----------
const route = document.querySelector('.route');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (route && !reduceMotion && 'IntersectionObserver' in window) {
  route.classList.add('will-animate'); // машинка ждёт у точки А
  const ro = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { route.classList.add('is-animated'); ro.disconnect(); }
  }, { threshold: 0.6 });
  ro.observe(route);
}

// ---------- Главный заголовок всегда в три строки ----------
// Если строка не помещается (другой шрифт, узкий экран) — уменьшаем кегль, пока не влезет.
const heroTitle = document.querySelector('.hero__title');
function fitHeroTitle() {
  if (!heroTitle) return;
  heroTitle.style.fontSize = '';
  heroTitle.style.lineHeight = '';
  let size = 40;
  const fits = () => [...heroTitle.children].every((s) => s.scrollWidth <= heroTitle.clientWidth);
  while (!fits() && size > 24) {
    size -= 1;
    heroTitle.style.fontSize = size + 'px';
    heroTitle.style.lineHeight = Math.round(size * 1.2) + 'px';
  }
}
fitHeroTitle();
window.addEventListener('resize', fitHeroTitle);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroTitle);

// ---------- Движение: заголовки и появление блоков ----------
// Всё выключено при prefers-reduced-motion — тогда заголовки и блоки сразу видны.
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Делит текст на слова-спаны. Делим только по обычному пробелу: неразрывные пробелы остаются внутри слова.
function splitWords(root, { direct = false, cls = 'w' } = {}) {
  const nodes = [];
  if (direct) root.childNodes.forEach((n) => { if (n.nodeType === 3) nodes.push(n); });
  else {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) nodes.push(tw.currentNode);
  }
  const words = [];
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/([ \n\t]+)/).forEach((part) => {
      if (!part) return;
      if (/^[ \n\t]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = part;
      frag.appendChild(s);
      words.push(s);
    });
    node.replaceWith(frag);
  });
  return words;
}

// 1) Главный заголовок: слова появляются по очереди при загрузке
function initHeroWords() {
  if (!heroTitle) return;
  splitWords(heroTitle, { cls: 'w w--in' }).forEach((w, i) => w.style.setProperty('--i', i));
}

// 2) Заголовки секций: слова темнеют волной при прокрутке, при прокрутке вверх идут обратно
function initHeadingFill() {
  const hex = (v) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
    return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
  };
  const items = [...document.querySelectorAll('section:not(.hero) h2')].map((h) => {
    const cs = getComputedStyle(h);
    const from = hex(cs.getPropertyValue('--fill-from'));
    const to = hex(cs.getPropertyValue('--fill-to'));
    const words = splitWords(h, { direct: true }); // подпись внутри вложенного <span> (KIA Cerato) не трогаем
    return from && to && words.length ? { h, words, from, to, last: [] } : null;
  }).filter(Boolean);

  const SOFT = 2; // сколько слов красятся одновременно
  let queued = false;
  function update() {
    queued = false;
    const vh = window.innerHeight;
    const start = vh * 0.92, end = vh * 0.5; // заливка идёт, пока заголовок поднимается от 92% до 50% высоты экрана
    const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
    items.forEach((it) => {
      const top = it.h.getBoundingClientRect().top;
      const p = atEnd && top < vh * 0.92 ? 1 : clamp((start - top) / (start - end), 0, 1);
      const pos = p * (it.words.length + SOFT);
      it.words.forEach((w, i) => {
        const f = clamp((pos - i) / SOFT, 0, 1);
        const col = 'rgb(' + it.from.map((c, k) => Math.round(c + (it.to[k] - c) * f)).join(',') + ')';
        if (it.last[i] !== col) { w.style.color = col; it.last[i] = col; }
      });
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
}

// 3) Блоки под заголовками плавно проявляются снизу (один раз)
function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const targets = new Set();
  document.querySelectorAll('section h1, section h2').forEach((h) => {
    let node = h;
    while (node && node.parentElement) {
      for (let s = node.nextElementSibling; s; s = s.nextElementSibling) targets.add(s);
      if (node.parentElement.tagName === 'SECTION') break;
      node = node.parentElement;
    }
  });
  const list = [];
  targets.forEach((el) => {
    if (el.hidden || el.tagName === 'SCRIPT') return;
    if (el.tagName === 'UL' && el.getAttribute('role') === 'list') list.push(...el.children); // карточки списка — по одной
    else list.push(el);
  });
  const base = (el) => (el.closest('.hero') ? 300 : 0); // на первом экране ждём слова заголовка
  const done = (el) => { el.classList.remove('reveal', 'is-in'); el.style.removeProperty('--d'); }; // вернуть собственные transition (кнопки)
  const io = new IntersectionObserver((entries) => {
    let n = 0;
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      const el = e.target;
      io.unobserve(el);
      const delay = base(el) + Math.min(n++, 4) * 70;
      el.style.setProperty('--d', delay + 'ms');
      requestAnimationFrame(() => el.classList.add('is-in'));
      setTimeout(() => done(el), delay + 700);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  list.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initHeroWords();
  initHeadingFill();
  initReveal();
}

