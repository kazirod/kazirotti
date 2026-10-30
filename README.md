# Kazirotti

Сайт частного автоинструктора Ильи Казирода — Telegram Mini App и обычный мобильный сайт.

- Сайт: https://kazirod.github.io/kazirotti/
- Запись: Telegram [@Kazirotti](https://t.me/Kazirotti)

## Как поменять контакты и ссылки
Открой `app.js` и поправь объект `CONFIG` в начале файла:
- `telegram` — ник без @, сюда ведут все кнопки записи;
- `whatsapp` — номер без +;
- `channelUrl` — ссылка на Telegram-канал (пока пусто — кнопка «Перейти в канал» скрыта);
- `reviewsUrl` — ссылка на все отзывы (пока пусто — кнопка «Все отзывы» скрыта).

## Как подключить к боту
1. В [@BotFather](https://t.me/BotFather): `/newbot` (или возьми существующего бота).
2. `/mybots` → бот → **Bot Settings** → **Menu Button** → вставь `https://kazirod.github.io/kazirotti/` и название кнопки, например «Записаться».
3. Для отдельной ссылки на мини-апп: `/newapp` → выбери бота → та же ссылка. Получится ссылка вида `t.me/<бот>/<имя>`.
