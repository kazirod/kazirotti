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
