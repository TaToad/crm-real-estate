# Веб-шрифты

По умолчанию используй системные шрифты. Если действительно нужен веб-шрифт — фирменный или для китайского, японского, корейского, тайского, арабского текста с недостаточной системной поддержкой, — соблюдай правила:

- **Загружай таблицу стилей один раз в `<head>`, никогда внутри компонента слайда.** Все слайды одновременно монтируются для ленты миниатюр, сетки обзора и печати PDF. `<style>@import</style>` или `<link>` внутри `Page` регистрирует весь набор `@font-face` заново для каждого слайда. Подключай его один раз с проверкой повторного подключения на верхнем уровне `index.tsx`, вне компонента или эффекта. **Включай идентификатор презентации в `id` элемента**, например `osd-webfont-<slide-id>`. Главная страница одновременно монтирует слайды всех презентаций; общий `osd-webfont` позволит первой презентации заблокировать шрифты остальных:

  ```tsx
  const FONT_HREF = 'https://fonts.googleapis.com/css2?family=...&display=swap';
  const FONT_LINK_ID = 'osd-webfont-q2-roadmap'; // суффикс — идентификатор каталога презентации
  if (typeof document !== 'undefined') {
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== FONT_HREF) link.href = FONT_HREF;
  }
  ```

- **Создавай или обновляй, а не только создавай при отсутствии.** HMR повторно выполняет модуль, сохраняя прежние `<link>` / `<style>`. Проверка `if (!document.getElementById(id)) { … }` пропускает обновлённое содержимое, и изменения видны только после полной перезагрузки. То же правило относится к добавляемым `<style>` с `@keyframes`:

  ```tsx
  const STYLE_ID = 'osd-styles-q2-roadmap';
  const css = `@keyframes rise { from { opacity: 0 } to { opacity: 1 } }`;
  if (typeof document !== 'undefined') {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }
  ```

- **Запрашивай только используемые значения насыщенности.** Каждое дополнительное значение умножает число правил `@font-face`.
- **Шрифты CJK велики.** Семейство Google Fonts для китайского, японского и корейского письма регистрирует сотни подмножеств через `unicode-range`: например, Noto Sans TC — около 105 на каждую насыщенность. Экспорт PDF ждёт загрузки шрифтов. Если текст презентации фиксирован, добавь в URL `&text=<уникальные символы>`, чтобы запросить небольшое подмножество с одним начертанием вместо полного набора.
