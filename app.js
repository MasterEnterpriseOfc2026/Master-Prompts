(function () {
  'use strict';

  /* =========================================================
     1. DADOS — catálogo de prompts pré-definidos
     ⚠️  CATEGORIES é definido globalmente em prompts.js
          Certifique-se de que prompts.js é carregado ANTES deste arquivo.
  ========================================================= */

  const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  /* =========================================================
     2. REFERÊNCIAS DE DOM
  ========================================================= */
  const els = {
    app: document.getElementById('app'),
    topbar: document.getElementById('topbar'),
    btnMenu: document.getElementById('btnMenu'),
    btnNewChat: document.getElementById('btnNewChat'),
    overlay: document.getElementById('drawerOverlay'),
    drawer: document.getElementById('drawer'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    drawerNewChat: document.getElementById('drawerNewChat'),
    drawerCategoryList: document.getElementById('drawerCategoryList'),
    btnFilters: document.getElementById('btnFilters'),
    chatArea: document.getElementById('chatArea'),
    emptyState: document.getElementById('emptyState'),
    messages: document.getElementById('messages'),
    inputForm: document.getElementById('inputForm'),
    textInput: document.getElementById('textInput'),
    btnSend: document.getElementById('btnSend'),
    inputBar: document.getElementById('inputBar'),
    toast: document.getElementById('toast'),
    chips: Array.from(document.querySelectorAll('.chip[data-cmd]'))
  };

  const desktopMQ = window.matchMedia('(min-width: 860px)');
  let drawerOpenMobile = false;
  let toastTimer = null;

  /* =========================================================
     3. UTILITÁRIOS
  ========================================================= */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function scrollChatToBottom() {
    requestAnimationFrame(() => {
      els.chatArea.scrollTop = els.chatArea.scrollHeight;
    });
  }

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
    }, 1800);
  }

  function setEmptyStateVisible(visible) {
    els.emptyState.classList.toggle('hidden', !visible);
  }

  /* =========================================================
     4. LOGO (gera o monograma "M" usado nos espaços .logo-mount)
  ========================================================= */
  function logoSVG(size, secondary) {
    const r = Math.round(size * 0.26);
    const fg = secondary ? 'var(--accent)' : '#fff';
    const bg = secondary ? 'none' : 'var(--accent)';
    const strokeW = secondary ? Math.max(2, Math.round(size * 0.045)) : 0;
    return (
      '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size +
      '" role="img" aria-label="Master Prompts">' +
      (secondary
        ? '<rect x="' + strokeW / 2 + '" y="' + strokeW / 2 + '" width="' + (size - strokeW) +
          '" height="' + (size - strokeW) + '" rx="' + r + '" fill="none" stroke="' + fg +
          '" stroke-width="' + strokeW + '"/>'
        : '<rect width="' + size + '" height="' + size + '" rx="' + r + '" fill="' + bg + '"/>') +
      '<text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" ' +
      'font-family="Iowan Old Style, Georgia, serif" font-weight="600" ' +
      'font-size="' + Math.round(size * 0.52) + '" fill="' + fg + '">M</text>' +
      '</svg>'
    );
  }

  function mountLogos() {
    document.querySelectorAll('.logo-mount').forEach((el) => {
      const size = parseInt(el.dataset.size, 10) || 24;
      const secondary = el.dataset.secondary === 'true';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.innerHTML = logoSVG(size, secondary);
    });
  }

  /* =========================================================
     5. SVG ICONS (para substituir emojis)
  ========================================================= */
  function categoryIconSVG(categoryId, size = 20) {
    const icons = {
      'dev': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
        <path d="M8.5 15.5l4-4-4-4 1-1 5 5-5 5z"/>
      </svg>`,
      'roteiros': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
      </svg>`,
      'marketing': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>`,
      'design': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/>
      </svg>`,
      'ia': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-4-5.5c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2zm-4 0c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2z"/>
      </svg>`,
      'copy': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>`,
      'produtividade': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
      </svg>`,
      'fundamentais': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
      </svg>`,
      'raciocinio': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-3h-3v-2h3v-3h2v3h3v2h-3v3zM7 7h2v2H7V7zm4 0h6v2h-6V7z"/>
      </svg>`,
      'refinamento': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>`,
      'controle-saida': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
      </svg>`,
      'avancadas': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>`,
      'modernas': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zM11.5 9.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z"/>
      </svg>`,
      'negocios': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1a6 6 0 0 0-12 0c0 .12.11.56.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-8-5a4 4 0 0 1 4 4c0 .12-.11.56-.18 1H8.18C8.11 5.56 8 5.12 8 5a4 4 0 0 1 4-4zm2 12H10v-2h4v2zm4 0h-2v-2h2v2zm-8 0H8v-2h2v2z"/>
      </svg>`,
      'educacao': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
      </svg>`,
      'dados': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>`,
      'conteudo': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
      </svg>`,
      'rh': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>`,
      'suporte': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
      </svg>`,
      'criatividade': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
      </svg>`,
      'apresentacoes': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm0 16H5V5h14v14zm-7-7l-4 4h8l-4-4zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>`,
      'dev-avancado': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
      </svg>`,
      'pesquisa': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>`,
      'financeiro': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
      </svg>`,
      'agentes': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58 3.51-3.47 9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"/>
      </svg>`,
      'pe-verificacao': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>`,
      'imagem-ia': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/>
      </svg>`,
      'carreira': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
      </svg>`,
      'vendas': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>`,
      'juridico': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>`,
      'produto': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,
      'lideranca': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>`,
      'viagem': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M17.5 15.5L9.25 10l8.25-5.5-1.5-1.5L6 10l10 6.5zM4 10v10h2v-4h3v4h2V10H4zm13 10v-4h-3v4h-2v-4h3v-4h5v8h-2z"/>
      </svg>`,
      'idiomas': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
      </svg>`,
      'bem-estar': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>`
    };
    return icons[categoryId] || `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
    </svg>`;
  }

  function promptIconSVG(iconName, size = 16) {
    const icons = {
      '🔍': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>`,
      '📄': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>`,
      '🐞': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
      </svg>`,
      '🛠️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>`,
      '🎯': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <circle cx="12" cy="12" r="5"/>
      </svg>`,
      '⚡': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>`,
      '🎥': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
      </svg>`,
      '📣': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>`,
      '🪧': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        <path d="M11 7h6v2h-6zm0 4h6v2h-6zm0 4h6v2h-6zM7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7z"/>
      </svg>`,
      '🧾': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>`,
      '✉️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
      </svg>`,
      '🧭': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 6l-2.83 2.83L12 11.66l2.83-2.83z"/>
      </svg>`,
      '🖌️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/>
      </svg>`,
      '🧩': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5C4.88 10.8 6 11.92 6 13.3s-1.12 2.5-2.5 2.5H2V19c0 1.1.9 2 2 2h3.8v-1.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5V21H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
      </svg>`,
      '📐': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z"/>
      </svg>`,
      '🧠': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
      </svg>`,
      '🎭': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        <circle cx="8.5" cy="10.5" r="1.5"/>
        <circle cx="15.5" cy="10.5" r="1.5"/>
        <path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
      </svg>`,
      '⚙️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>`,
      '🪄': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z"/>
      </svg>`,
      '📖': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"/>
      </svg>`,
      '🪪': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM10 8h4v2h-4zm0 4h4v2h-4z"/>
      </svg>`,
      '🗓️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
      </svg>`,
      '📊': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>`,
      '📝': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>`,
      '🎯': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>`,
      '🌳': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M13 9h2l-3-6-3 6h2l-4 7h3v6h4v-6h3z"/>
      </svg>`,
      '📈': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>`,
      '🚀': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9.37 5.51C9.19 6.15 9.1 6.82 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 15.93 19 14 19H5c-1.1 0-2-.9-2-2V7c0-1.93 1.81-3.45 4.37-1.49zm5.3-2.01C15.11 2.29 16.4 2 18 2c0 1.6-.29 2.89-.5 3.33C16.87 7.07 15.5 8 14 8H9.99c.17-.44.47-.88.84-1.27 1.26-1.35 2.74-2.3 3.84-3.23zm2.01 10.64c.51-1.04.82-2.19.82-3.44 0-1.3-.32-2.49-.89-3.56.03-.16.1-.55.19-1.14H18c2.21 0 4 1.79 4 4v1h-5.32z"/>
      </svg>`,
      '💰': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
      </svg>`,
      '⚠️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,
      '🗺️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
      </svg>`,
      '🌟': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>`,
      '💬': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>`,
      '📢': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/>
      </svg>`,
      '🗃️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1a6 6 0 0 0-12 0c0 .12.11.56.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-8-5a4 4 0 0 1 4 4c0 .12-.11.56-.18 1H8.18C8.11 5.56 8 5.12 8 5a4 4 0 0 1 4-4zm2 12H10v-2h4v2zm4 0h-2v-2h2v2zm-8 0H8v-2h2v2z"/>
      </svg>`,
      '🧳': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M17 6h-2V5c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v1H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-1h2v1h-2V5zm1 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-6h-6V9h6v1.5z"/>
      </svg>`,
      '🌍': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>`,
      '💸': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        <line x1="2" y1="19" x2="22" y2="5" stroke="currentColor" stroke-width="1.5"/>
      </svg>`,
      '🔤': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/>
      </svg>`,
      '✏️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>`,
      '🗣️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>`,
      '📒': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>`,
      '📓': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M18 2h-8L4 8v13c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 15H7v-2h6v2zm4-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>`,
      '🧘': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="4" r="2"/>
        <path d="M15.89 8.11C15.5 7.72 14.83 7 13.53 7c-.21 0-1.76.03-3.46.02C8.53 6.99 7 6.45 7 6.45L5 11h2l1.53-3.19c.54.08 1.09.16 1.47.19V11H5c0 4.82 3.34 8.84 8 9.8V22h2v-1.2c4.66-.96 8-4.98 8-9.8h-5V8c.38-.03.93-.11 1.47-.19L21 11h2l-2-4.55c-.5.17-3.14 1.08-5.11 1.66z"/>
      </svg>`,
      '🔗': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
      </svg>`,
      '🧯': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M9.17 6l-2-2H3V2H1v4h2.17l2 2H9.17zM9 8H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H3V10h6v10zm2-14h2v2h-2V6zm4-4l-2 2v2h2V6l3-3-1-3h-4l1 3z"/>
      </svg>`,
      '🌙': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>`,
      '🗂️': `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
      </svg>`,
    };
    return icons[iconName] || `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
    </svg>`;
  }

  /* =========================================================
     6. MARKDOWN-LITE (para mensagens do bot)
  ========================================================= */
  function renderInline(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return out;
  }

  function mdToHtml(text) {
    const lines = text.split('\n');
    let html = '';
    let listType = null;
    let paragraph = [];

    function flushParagraph() {
      if (paragraph.length) {
        html += '<p>' + paragraph.join(' ') + '</p>';
        paragraph = [];
      }
    }
    function closeList() {
      if (listType) {
        html += listType === 'ul' ? '</ul>' : '</ol>';
        listType = null;
      }
    }

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        closeList();
        return;
      }
      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        html += '<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>';
        return;
      }
      if (/^-\s+/.test(line)) {
        flushParagraph();
        if (listType !== 'ul') {
          closeList();
          html += '<ul>';
          listType = 'ul';
        }
        html += '<li>' + renderInline(line.replace(/^-\s+/, '')) + '</li>';
        return;
      }
      if (/^\d+\.\s+/.test(line)) {
        flushParagraph();
        if (listType !== 'ol') {
          closeList();
          html += '<ol>';
          listType = 'ol';
        }
        html += '<li>' + renderInline(line.replace(/^\d+\.\s+/, '')) + '</li>';
        return;
      }
      closeList();
      paragraph.push(renderInline(line));
    });
    flushParagraph();
    closeList();
    return html;
  }

  /* =========================================================
     6. RENDERIZAÇÃO DE MENSAGENS
  ========================================================= */
  function addUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-user';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    els.messages.appendChild(wrap);
    scrollChatToBottom();
  }

  /* =========================================================
     6.1 FAKE STREAMING — texto do bot "digitado" no mesmo
          ritmo do streaming do Claude
  ========================================================= */
  let botResponseQueue = Promise.resolve();

  // Encadeia as respostas do bot para que sempre sejam exibidas em
  // ordem, mesmo que a anterior ainda esteja em "streaming".
  function queueBotResponse(taskFn) {
    botResponseQueue = botResponseQueue.then(taskFn).catch((err) => {
      console.error('Erro ao renderizar mensagem do bot:', err);
    });
    return botResponseQueue;
  }

  function createBotMessageShell() {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-bot';
    const content = document.createElement('div');
    content.className = 'bot-content';
    wrap.appendChild(content);
    els.messages.appendChild(wrap);
    scrollChatToBottom();
    return content;
  }

  // Revela o markdown em pequenas rajadas de palavras, no ritmo
  // aproximado de streaming de texto do Claude (~150-200 chars/s).
  function streamTextIntoElement(el, markdown) {
    return new Promise((resolve) => {
      const parts = markdown.split(/(\s+)/);
      const chunks = [];
      for (let i = 0; i < parts.length; i += 2) {
        chunks.push(parts[i] + (parts[i + 1] || ''));
      }

      let i = 0;
      let revealed = '';
      el.classList.add('streaming');

      function tick() {
        if (i >= chunks.length) {
          el.innerHTML = mdToHtml(markdown);
          el.classList.remove('streaming');
          resolve();
          return;
        }
        const burst = 1 + Math.floor(Math.random() * 2); // 1–2 "palavras" por rajada
        for (let n = 0; n < burst && i < chunks.length; n++, i++) {
          revealed += chunks[i];
        }
        el.innerHTML = mdToHtml(revealed) + '<span class="stream-cursor">▍</span>';
        scrollChatToBottom();
        setTimeout(tick, 35 + Math.random() * 30); // ~35–65ms entre rajadas
      }
      tick();
    });
  }

  function addBotMessage(buildFn) {
    return queueBotResponse(() => {
      const content = createBotMessageShell();
      const result = buildFn(content);
      scrollChatToBottom();
      return result; // se buildFn retornar uma Promise (streaming), a fila aguarda
    });
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-bot';
    wrap.innerHTML =
      '<div class="bot-content"><div class="typing-dots" aria-label="Master Prompts está digitando">' +
      '<span></span><span></span><span></span></div></div>';
    els.messages.appendChild(wrap);
    scrollChatToBottom();
    return () => wrap.remove();
  }

  function addBotTextMessage(markdown) {
    return addBotMessage((content) => {
      const div = document.createElement('div');
      div.className = 'msg-text';
      content.appendChild(div);
      return streamTextIntoElement(div, markdown);
    });
  }

  function injectStreamingStyles() {
    if (document.getElementById('streamingFakeStyles')) return;
    const style = document.createElement('style');
    style.id = 'streamingFakeStyles';
    style.textContent =
      '.stream-cursor{display:inline-block;width:2px;height:1em;margin-left:1px;' +
      'background:currentColor;opacity:.85;vertical-align:-0.15em;' +
      'animation:streamBlink .8s steps(1) infinite;}' +
      '@keyframes streamBlink{0%,49%{opacity:.85}50%,100%{opacity:0}}';
    document.head.appendChild(style);
  }

  function copyPromptText(title, text, btn) {
    const onSuccess = () => {
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<polyline points="20 6 9 17 4 12"/></svg><span>Copiado</span>';
      showToast('Prompt copiado: ' + title);
      trackPromptCopy(title, 'unknown');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
    } else {
      fallbackCopy(text, onSuccess);
    }
  }

  function fallbackCopy(text, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (e) {
      showToast('Não foi possível copiar automaticamente');
    }
    document.body.removeChild(ta);
  }

  function buildBackChip(label, action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = label;
    btn.addEventListener('click', action);
    return btn;
  }

  function renderCategoryMenu() {
    addBotTextMessage('Aqui estão as categorias disponíveis. Toque em uma para ver os prompts:');
    addBotMessage((content) => {
      const wrap = document.createElement('div');
      wrap.className = 'cards-wrap';
      CATEGORIES.forEach((cat) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-card';
        btn.innerHTML =
          '<div class="prompt-card-head">' +
          '<span class="prompt-card-icon" aria-hidden="true">' + categoryIconSVG(cat.id, 20) + '</span>' +
          '<span class="prompt-card-title">' + escapeHtml(cat.name) + '</span></div>' +
          '<div class="prompt-card-body">' + cat.prompts.length + ' prompt' +
          (cat.prompts.length === 1 ? '' : 's') + ' disponíve' + (cat.prompts.length === 1 ? 'l' : 'is') + '</div>';
        btn.addEventListener('click', () => renderCategoryPrompts(cat.id));
        wrap.appendChild(btn);
      });
      content.appendChild(wrap);
    });
  }

  function renderHelp() {
    addBotTextMessage(
      'Comandos disponíveis:\n\n' +
        '- **/prompts** — mostra todas as categorias\n' +
        '- **/ajuda** — mostra esta mensagem\n' +
        '- **/sobre** — sobre o Master Prompts\n' +
        '- **/add** — adiciona prompts a categorias existentes ou cria novas categorias\n' +
        '- **/clear** — remove prompts e categorias adicionados por você (preserva o banco original)\n' +
        '- **/similar [texto]** — busca por similaridade de conteúdo\n\n' +
        'Você também pode digitar uma palavra-chave (ex: "roteiro" ou "anúncio") para buscar prompts diretamente.'
    );
  }

  function renderAbout() {
    addBotTextMessage(
      '**Master Prompts** é um catálogo local de prompts prontos, organizado por categoria, feito para acelerar o seu fluxo de trabalho.\n\n' +
        'Tudo roda localmente, sem enviar dados para nenhum servidor — os prompts ficam só no seu navegador.'
    );
  }

  /* =========================================================
     6.1. PROCESSAMENTO DE LINGUAGEM NATURAL
  ========================================================= */
  function processNaturalLanguageQuery(query) {
    const q = query.toLowerCase().trim();
    
    // Mapeamento de frases comuns para termos de busca
    const phraseMappings = {
      // Frases sobre desenvolvimento
      'como revisar código': ['revisor', 'código', 'bug', 'performance'],
      'preciso de ajuda para debug': ['debug', 'erro', 'problema', 'assistido'],
      'quero refatorar meu código': ['refatoração', 'refatorar', 'legibilidade'],
      'como documentar código': ['documentação', 'documentar', 'parâmetros'],
      
      // Frases sobre roteiros
      'como criar um gancho para vídeo': ['gancho', 'abertura', 'vídeo', 'hook'],
      'preciso de um roteiro curto': ['roteiro', 'curto', 'shorts', 'reels'],
      'quero fazer um vídeo longo': ['roteiro', 'longo', 'vídeo', 'estrutura'],
      'como fazer um call to action': ['cta', 'call-to-action', 'persuasivo'],
      
      // Frases sobre marketing
      'como criar anúncio': ['anúncio', 'copy', 'publicidade', 'marketing'],
      'preciso de página de vendas': ['página', 'vendas', 'headline', 'bullets'],
      'quero sequência de emails': ['email', 'sequência', 'nutrição', 'lançamento'],
      'como posicionar minha marca': ['posicionamento', 'marca', 'branding'],
      
      // Frases sobre design
      'como criar identidade visual': ['identidade', 'visual', 'branding', 'paleta'],
      'preciso de crítica de interface': ['crítica', 'ui', 'interface', 'design'],
      'como fazer wireframe': ['wireframe', 'estrutura', 'layout'],
      
      // Frases sobre IA
      'como melhorar meus prompts': ['prompt', 'engenheiro', 'melhorar', 'ia'],
      'preciso de persona para assistente': ['persona', 'assistente', 'tom'],
      'como criar system prompt': ['system', 'prompt', 'configuração'],
      
      // Frases sobre copywriting
      'como criar headline': ['headline', 'título', 'magnética'],
      'preciso de storytelling': ['storytelling', 'narrativa', 'história'],
      'como escrever bio': ['bio', 'biografia', 'redes sociais'],
      
      // Frases sobre produtividade
      'como planejar minha semana': ['plano', 'ação', 'semanal', 'tarefas'],
      'preciso priorizar tarefas': ['priorização', 'matriz', 'urgente', 'importante'],
      'como resumir reunião': ['resumo', 'reunião', 'ata', 'decisões'],
      
      // Frases sobre engenharia de prompt
      'como fazer zero-shot': ['zero-shot', 'sem exemplos'],
      'preciso de one-shot': ['one-shot', 'exemplo'],
      'como usar few-shot': ['few-shot', 'exemplos', 'múltiplos'],
      'quero usar persona': ['persona', 'papel', 'role'],
      'como dar instruções': ['instruções', 'passo a passo'],
      
      // Frases sobre raciocínio
      'como pensar passo a passo': ['chain-of-thought', 'cot', 'raciocínio'],
      'preciso de consistência': ['self-consistency', 'consistência'],
      'como explorar possibilidades': ['tree-of-thoughts', 'tot', 'árvore'],
      'quero dividir problemas': ['least-to-most', 'subproblemas'],
      'como fazer rascunho': ['scratchpad', 'rascunho', 'cálculos'],
      
      // Frases sobre refinamento
      'como encadear prompts': ['chaining', 'encadeamento', 'etapas'],
      'preciso refinar iterativamente': ['iterative', 'refinamento', 'versões'],
      'como fazer autocrítica': ['self-critique', 'reflexão', 'crítica'],
      'quero usar reason and act': ['react', 'reason', 'act'],
    };
    
    // Verificar se a consulta corresponde a alguma frase mapeada
    for (const [phrase, terms] of Object.entries(phraseMappings)) {
      if (q.includes(phrase) || phrase.includes(q)) {
        return terms;
      }
    }
    
    // Processamento de consultas gerais
    const stopWords = ['como', 'preciso', 'quero', 'para', 'um', 'uma', 'de', 'do', 'da', 'meu', 'minha', 'com'];
    const words = q.split(/\s+/).filter(w => w.length >= 2 && !stopWords.includes(w));
    
    // Expansão de sinônimos para termos comuns
    const synonymMap = {
      'código': ['programação', 'desenvolvimento', 'dev'],
      'vídeo': ['filme', 'conteúdo', 'audiovisual'],
      'anúncio': ['propaganda', 'publicidade', 'ad'],
      'design': ['interface', 'ui', 'ux', 'visual'],
      'ia': ['inteligência artificial', 'chatgpt', 'modelo'],
      'copy': ['copywriting', 'texto', 'redação'],
      'produtividade': ['organização', 'eficiencia', 'gestão'],
      'prompt': ['comando', 'instrução', 'engenharia'],
    };
    
    const expandedTerms = [];
    words.forEach(word => {
      expandedTerms.push(word);
      if (synonymMap[word]) {
        expandedTerms.push(...synonymMap[word]);
      }
    });
    
    // Remover duplicatas e retornar
    return [...new Set(expandedTerms)];
  }

  /* =========================================================
     6.2. SISTEMA DE PESQUISA AVANÇADA
  ========================================================= */
  /* =========================================================
     7. ROTEAMENTO DE COMANDOS
  ========================================================= */
  function handleSubmit(rawText) {
    const text = rawText.trim();
    if (!text) return;

    setEmptyStateVisible(false);
    addUserMessage(text);
    els.textInput.value = '';
    syncSendButtonState();

    const stopTyping = showTyping();
    const delay = 280 + Math.random() * 220;
    setTimeout(() => {
      stopTyping();
      routeCommand(text);
    }, delay);
  }

  /* =========================================================
     8. NOVO CHAT
  ========================================================= */
  function startNewChat() {
    els.messages.innerHTML = '';
    setEmptyStateVisible(true);
    els.textInput.value = '';
    syncSendButtonState();
    if (!drawerOpenMobile) {
      els.textInput.focus({ preventScroll: true });
    }
  }

  /* =========================================================
     9. DRAWER (menu lateral)
  ========================================================= */
  function renderDrawerCategoryList() {
    els.drawerCategoryList.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drawer-cat-row';
      btn.setAttribute('role', 'listitem');
      btn.innerHTML =
        '<span class="drawer-cat-emoji" aria-hidden="true">' + categoryIconSVG(cat.id, 20) + '</span>' +
        '<span class="drawer-cat-name">' + escapeHtml(cat.name) + '</span>' +
        '<span class="drawer-cat-count">' + cat.prompts.length + '</span>';
      btn.addEventListener('click', () => {
        setEmptyStateVisible(false);
        renderCategoryPrompts(cat.id);
        if (!desktopMQ.matches) closeDrawer();
      });
      els.drawerCategoryList.appendChild(btn);
    });
  }

  function getFocusableInDrawer() {
    return Array.from(
      els.drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
  }

  function openDrawer() {
    if (desktopMQ.matches) return;
    drawerOpenMobile = true;
    els.drawer.classList.remove('hidden');
    els.overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      els.drawer.classList.add('show');
      els.overlay.classList.add('show');
    });
    els.drawer.setAttribute('aria-hidden', 'false');
    els.btnMenu.setAttribute('aria-expanded', 'true');
    if ('inert' in HTMLElement.prototype) {
      els.chatArea.inert = true;
      els.inputBar.inert = true;
      els.topbar.inert = true;
    }
    document.addEventListener('keydown', onDrawerKeydown);
    const focusable = getFocusableInDrawer();
    if (focusable.length) focusable[0].focus();
  }

  function closeDrawer() {
    if (desktopMQ.matches) return;
    drawerOpenMobile = false;
    els.drawer.classList.remove('show');
    els.overlay.classList.remove('show');
    els.drawer.setAttribute('aria-hidden', 'true');
    els.btnMenu.setAttribute('aria-expanded', 'false');
    if ('inert' in HTMLElement.prototype) {
      els.chatArea.inert = false;
      els.inputBar.inert = false;
      els.topbar.inert = false;
    }
    document.removeEventListener('keydown', onDrawerKeydown);
    setTimeout(() => {
      if (!drawerOpenMobile && !desktopMQ.matches) {
        els.drawer.classList.add('hidden');
        els.overlay.classList.add('hidden');
      }
    }, 280);
    els.btnMenu.focus();
  }

  function onDrawerKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = getFocusableInDrawer();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* =========================================================
     10. RESPONSIVO (sidebar fixa em telas largas)
  ========================================================= */
  function syncResponsiveLayout() {
    if (desktopMQ.matches) {
      drawerOpenMobile = false;
      els.drawer.classList.remove('show');
      els.overlay.classList.remove('show');
      els.overlay.classList.add('hidden');
      els.drawer.removeAttribute('role');
      els.drawer.removeAttribute('aria-modal');
      els.drawer.setAttribute('aria-hidden', 'false');
      els.btnMenu.setAttribute('aria-expanded', 'false');
      if ('inert' in HTMLElement.prototype) {
        els.chatArea.inert = false;
        els.inputBar.inert = false;
        els.topbar.inert = false;
      }
      document.removeEventListener('keydown', onDrawerKeydown);
    } else {
      els.drawer.setAttribute('role', 'dialog');
      els.drawer.setAttribute('aria-modal', 'true');
      if (!drawerOpenMobile) {
        els.drawer.classList.add('hidden');
        els.drawer.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /* =========================================================
     11. SISTEMA DE FILTROS VISUAIS
  ========================================================= */
  let activeFilters = {
    categories: [],
    type: [],
    difficulty: [],
    status: []
  };

  function initFilters() {
    // Preencher filtros de categorias
    const categoryFiltersEl = document.getElementById('categoryFilters');
    CATEGORIES.forEach(cat => {
      const button = document.createElement('button');
      button.className = 'filter-chip';
      button.type = 'button';
      button.dataset.filter = 'categories';
      button.dataset.value = cat.id;
      button.innerHTML = categoryIconSVG(cat.id, 16) + ' ' + escapeHtml(cat.name);
      button.addEventListener('click', toggleFilter);
      categoryFiltersEl.appendChild(button);
    });

    // Adicionar eventos aos botões de filtro
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', toggleFilter);
    });

    document.getElementById('btnFilters').addEventListener('click', openFilters);
    document.getElementById('btnCloseFilters').addEventListener('click', closeFilters);
    document.getElementById('btnClearFilters').addEventListener('click', clearFilters);
    document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
  }

  function openFilters() {
    document.getElementById('filtersPanel').classList.add('open');
  }

  function closeFilters() {
    document.getElementById('filtersPanel').classList.remove('open');
  }

  function clearFilters() {
    activeFilters = {
      categories: [],
      type: [],
      difficulty: [],
      status: []
    };
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  function applyFilters() {
    closeFilters();
    
    // Se não há filtros ativos, mostrar todas as categorias
    if (Object.values(activeFilters).every(arr => arr.length === 0)) {
      renderCategoryMenu();
      return;
    }
    
    // Filtrar prompts com base nos filtros ativos
    const filteredPrompts = [];
    
    CATEGORIES.forEach(cat => {
      // Verificar filtro de categoria
      if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(cat.id)) {
        return;
      }
      
      cat.prompts.forEach(p => {
        // Verificar outros filtros (simulação - em produção seria baseado em metadados reais)
        let passesFilters = true;
        
        // Simulação de filtro por tipo
        if (activeFilters.type.length > 0) {
          const promptType = getPromptType(p, cat);
          if (!activeFilters.type.includes(promptType)) {
            passesFilters = false;
          }
        }
        
        // Simulação de filtro por dificuldade
        if (activeFilters.difficulty.length > 0) {
          const difficulty = getPromptDifficulty(p);
          if (!activeFilters.difficulty.includes(difficulty)) {
            passesFilters = false;
          }
        }
        
        // Simulação de filtro por status
        if (activeFilters.status.length > 0) {
          const status = getPromptStatus(p);
          if (!activeFilters.status.includes(status)) {
            passesFilters = false;
          }
        }
        
        if (passesFilters) {
          filteredPrompts.push({ cat, p });
        }
      });
    });
    
    // Exibir resultados filtrados
    if (filteredPrompts.length === 0) {
      addBotTextMessage(
        '🔍 Nenhum prompt encontrado com os filtros selecionados.\n\n' +
        'Tente ajustar os filtros ou limpar todos para ver todos os prompts disponíveis.'
      );
      return;
    }
    
    addBotTextMessage(
      '🔍 Encontrei ' + filteredPrompts.length + ' prompt' + (filteredPrompts.length === 1 ? '' : 's') +
      ' com os filtros aplicados:'
    );
    
    addBotMessage((content) => {
      const wrap = document.createElement('div');
      wrap.className = 'cards-wrap';
      
      filteredPrompts.forEach(({ cat, p }) => {
        const card = buildPromptCard(p, cat, []);
        wrap.appendChild(card);
      });
      
      content.appendChild(wrap);
      
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.appendChild(buildBackChip('Ver todas as categorias', () => renderCategoryMenu()));
      content.appendChild(actions);
    });
  }

  // Funções auxiliares para simulação de metadados
  function getPromptType(prompt, category) {
    // Simulação baseada na categoria
    const typeMap = {
      'dev': 'dev',
      'roteiros': 'creative',
      'marketing': 'business',
      'design': 'creative',
      'ia': 'dev',
      'copy': 'creative',
      'produtividade': 'productivity',
      'fundamentais': 'dev',
      'raciocinio': 'dev',
      'refinamento': 'dev'
    };
    return typeMap[category.id] || 'dev';
  }

  function getPromptDifficulty(prompt) {
    // Simulação baseada no título e conteúdo
    const title = prompt.title.toLowerCase();
    const body = prompt.body.toLowerCase();
    
    if (title.includes('avançado') || body.includes('complexo') || body.includes('sofisticado')) {
      return 'advanced';
    } else if (title.includes('intermediário') || body.includes('médio') || body.includes('moderado')) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  function getPromptStatus(prompt) {
    // Simulação baseada no título
    const title = prompt.title.toLowerCase();
    
    if (title.includes('popular') || title.includes('mais usado')) {
      return 'popular';
    } else if (title.includes('novo') || title.includes('recente')) {
      return 'new';
    } else {
      return 'verified';
    }
  }

  /* =========================================================
     12. SISTEMA DE SUGESTÕES CONTEXTUAIS
  ========================================================= */
  let userHistory = {
    viewedCategories: [],
    viewedPrompts: [],
    searchQueries: [],
    lastActivity: null
  };

  function trackCategoryView(categoryId) {
    if (!userHistory.viewedCategories.includes(categoryId)) {
      userHistory.viewedCategories.push(categoryId);
    }
    userHistory.lastActivity = Date.now();
    saveUserHistory();
  }

  function trackPromptView(promptTitle) {
    if (!userHistory.viewedPrompts.includes(promptTitle)) {
      userHistory.viewedPrompts.push(promptTitle);
    }
    userHistory.lastActivity = Date.now();
    saveUserHistory();
  }

  function trackSearchQuery(query) {
    if (query.trim() && !userHistory.searchQueries.includes(query)) {
      userHistory.searchQueries.push(query);
      // Manter apenas as últimas 10 consultas
      if (userHistory.searchQueries.length > 10) {
        userHistory.searchQueries.shift();
      }
    }
    userHistory.lastActivity = Date.now();
    saveUserHistory();
  }

  function saveUserHistory() {
    try {
      localStorage.setItem('masterPromptsUserHistory', JSON.stringify(userHistory));
    } catch (e) {
      console.warn('Não foi possível salvar o histórico do usuário:', e);
    }
  }

  function loadUserHistory() {
    try {
      const saved = localStorage.getItem('masterPromptsUserHistory');
      if (saved) {
        userHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Não foi possível carregar o histórico do usuário:', e);
    }
  }

  function getContextualSuggestions() {
    const suggestions = [];
    
    // Baseado nas categorias visualizadas recentemente
    if (userHistory.viewedCategories.length > 0) {
      const lastCategory = userHistory.viewedCategories[userHistory.viewedCategories.length - 1];
      const category = CATEGORY_BY_ID[lastCategory];
      
      if (category) {
        // Sugerir prompts relacionados da mesma categoria
        category.prompts.slice(0, 3).forEach(p => {
          if (!userHistory.viewedPrompts.includes(p.title)) {
            suggestions.push({
              type: 'related_prompt',
              category: category.name,
              title: p.title,
              icon: p.icon,
              action: () => {
                setEmptyStateVisible(false);
                renderCategoryPrompts(category.id);
                showPromptDetails(p);
              }
            });
          }
        });
        
        // Sugerir categorias similares
        const similarCategories = CATEGORIES.filter(c => 
          c.id !== lastCategory && 
          !userHistory.viewedCategories.includes(c.id)
        ).slice(0, 2);
        
        similarCategories.forEach(cat => {
          suggestions.push({
            type: 'similar_category',
            name: cat.name,
            icon: cat.id,
            action: () => {
              setEmptyStateVisible(false);
              renderCategoryPrompts(cat.id);
            }
          });
        });
      }
    }
    
    // Baseado nas consultas de pesquisa
    if (userHistory.searchQueries.length > 0) {
      const lastQuery = userHistory.searchQueries[userHistory.searchQueries.length - 1];
      
      // Expandir a consulta com termos relacionados
      const expandedTerms = processNaturalLanguageQuery(lastQuery);
      if (expandedTerms.length > 0) {
        suggestions.push({
          type: 'expanded_search',
          query: lastQuery,
          terms: expandedTerms.slice(0, 3),
          action: () => {
            handleSubmit(lastQuery + ' ' + expandedTerms.slice(0, 3).join(' '));
          }
        });
      }
    }
    
    // Sugestões baseadas em padrões de uso
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    if (!userHistory.lastActivity || userHistory.lastActivity < oneDayAgo) {
      // Usuário inativo por mais de um dia - sugerir categorias populares
      suggestions.push({
        type: 'popular_category',
        name: 'Desenvolvimento & Código',
        icon: 'dev',
        reason: 'Categoria mais usada',
        action: () => {
          setEmptyStateVisible(false);
          renderCategoryPrompts('dev');
        }
      });
      
      suggestions.push({
        type: 'popular_category',
        name: 'Produtividade',
        icon: 'produtividade',
        reason: 'Em alta esta semana',
        action: () => {
          setEmptyStateVisible(false);
          renderCategoryPrompts('produtividade');
        }
      });
    }
    
    return suggestions.slice(0, 5); // Limitar a 5 sugestões
  }

  function showContextualSuggestions() {
    const suggestions = getContextualSuggestions();
    
    if (suggestions.length === 0) {
      return;
    }
    
    addBotMessage((content) => {
      const container = document.createElement('div');
      container.className = 'suggestions-container';
      
      const header = document.createElement('div');
      header.className = 'suggestions-header';
      header.innerHTML = '<span class="suggestions-icon">💡</span> <strong>Sugestões para você</strong>';
      container.appendChild(header);
      
      const list = document.createElement('div');
      list.className = 'suggestions-list';
      
      suggestions.forEach((suggestion, index) => {
        const item = document.createElement('button');
        item.className = 'suggestion-item';
        item.type = 'button';
        item.addEventListener('click', suggestion.action);
        
        let icon = '';
        if (suggestion.type === 'related_prompt') {
          icon = promptIconSVG(suggestion.icon, 16);
        } else if (suggestion.type === 'similar_category' || suggestion.type === 'popular_category') {
          icon = categoryIconSVG(suggestion.icon, 16);
        }
        
        let text = '';
        switch (suggestion.type) {
          case 'related_prompt':
            text = `<strong>${escapeHtml(suggestion.title)}</strong> (${escapeHtml(suggestion.category)})`;
            break;
          case 'similar_category':
            text = `Explorar <strong>${escapeHtml(suggestion.name)}</strong>`;
            break;
          case 'popular_category':
            text = `<strong>${escapeHtml(suggestion.name)}</strong> - ${escapeHtml(suggestion.reason)}`;
            break;
          case 'expanded_search':
            text = `Pesquisar por <strong>${escapeHtml(suggestion.query)}</strong> + ${suggestion.terms.map(t => `<em>${escapeHtml(t)}</em>`).join(', ')}`;
            break;
        }
        
        item.innerHTML = `
          <span class="suggestion-icon" aria-hidden="true">${icon}</span>
          <span class="suggestion-text">${text}</span>
          <span class="suggestion-arrow" aria-hidden="true">→</span>
        `;
        
        list.appendChild(item);
      });
      
      container.appendChild(list);
      content.appendChild(container);
    });
  }

  // Modificar funções existentes para rastrear atividades
  function renderCategoryPrompts(categoryId) {
    trackCategoryView(categoryId);
    // ... restante da função existente
    const cat = CATEGORY_BY_ID[categoryId];
    if (!cat) return;
    
    addBotTextMessage(
      '📁 ' + escapeHtml(cat.name) + ' — ' + cat.prompts.length + ' prompt' + (cat.prompts.length === 1 ? '' : 's')
    );
    
    addBotMessage((content) => {
      const wrap = document.createElement('div');
      wrap.className = 'cards-wrap';
      cat.prompts.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        const head = document.createElement('div');
        head.className = 'prompt-card-head';
        head.innerHTML =
          '<span class="prompt-card-icon" aria-hidden="true">' + promptIconSVG(p.icon, 16) + '</span>' +
          '<span class="prompt-card-title">' + escapeHtml(p.title) + '</span>';
        head.appendChild(buildCopyButton(p.title, p.body));
        const body = document.createElement('div');
        body.className = 'prompt-card-body';
        body.textContent = p.body;
        card.appendChild(head);
        card.appendChild(body);
        wrap.appendChild(card);
      });
      content.appendChild(wrap);

      const footer = document.createElement('div');
      footer.className = 'cat-menu-footer';
      footer.textContent = 'Toque em "Copiar" para usar um prompt na sua IA preferida.';
      content.appendChild(footer);

      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.appendChild(buildBackChip('← Ver categorias', () => renderCategoryMenu()));
      content.appendChild(actions);
    });
  }

  function showPromptDetails(prompt) {
    trackPromptView(prompt.title);
    // ... restante da função existente
    addBotMessage((content) => {
      const card = document.createElement('div');
      card.className = 'prompt-card prompt-card-expanded';
      const head = document.createElement('div');
      head.className = 'prompt-card-head';
      head.innerHTML =
        '<span class="prompt-card-icon" aria-hidden="true">' + promptIconSVG(prompt.icon, 20) + '</span>' +
        '<span class="prompt-card-title">' + escapeHtml(prompt.title) + '</span>';
      head.appendChild(buildCopyButton(prompt.title, prompt.body));
      const body = document.createElement('div');
      body.className = 'prompt-card-body';
      body.textContent = prompt.body;
      card.appendChild(head);
      card.appendChild(body);
      content.appendChild(card);
    });
  }

  /* =========================================================
     13. PESQUISA POR SIMILARIDADE DE CONTEÚDO
  ========================================================= */
  function calculateTextSimilarity(text1, text2) {
    // Converte para minúsculas e remove pontuação
    const clean1 = text1.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const clean2 = text2.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Divide em palavras
    const words1 = clean1.split(' ');
    const words2 = clean2.split(' ');
    
    // Cria conjuntos de palavras únicas
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    // Calcula interseção e união
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Coeficiente de Jaccard (similaridade de conjuntos)
    const jaccard = intersection.size / union.size;
    
    // Similaridade de cosseno simplificada (baseada em palavras comuns)
    const commonWords = [...intersection];
    const tf1 = commonWords.map(word => words1.filter(w => w === word).length / words1.length);
    const tf2 = commonWords.map(word => words2.filter(w => w === word).length / words2.length);
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < commonWords.length; i++) {
      dotProduct += tf1[i] * tf2[i];
      magnitude1 += tf1[i] * tf1[i];
      magnitude2 += tf2[i] * tf2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    const cosine = magnitude1 > 0 && magnitude2 > 0 ? dotProduct / (magnitude1 * magnitude2) : 0;
    
    // Combina as métricas (pesos ajustáveis)
    return (jaccard * 0.4) + (cosine * 0.6);
  }

  function findSimilarPrompts(query, limit = 6) {
    const q = query.toLowerCase().trim();
    const results = [];
    
    // Processa a consulta com linguagem natural
    const naturalTerms = processNaturalLanguageQuery(query);
    
    CATEGORIES.forEach(cat => {
      cat.prompts.forEach(p => {
        const title = p.title.toLowerCase();
        const body = p.body.toLowerCase();
        
        // Calcula similaridade com o título
        const titleSimilarity = calculateTextSimilarity(q, title);
        
        // Calcula similaridade com o corpo (amostra das primeiras 100 palavras)
        const bodySample = body.split(' ').slice(0, 100).join(' ');
        const bodySimilarity = calculateTextSimilarity(q, bodySample);
        
        // Verifica correspondência com termos naturais
        let naturalTermScore = 0;
        naturalTerms.forEach(term => {
          if (title.includes(term)) naturalTermScore += 0.3;
          if (body.includes(term)) naturalTermScore += 0.1;
        });
        
        // Combina os scores
        const combinedScore = (titleSimilarity * 0.5) + (bodySimilarity * 0.3) + (naturalTermScore * 0.2);
        
        if (combinedScore > 0.1) { // Threshold mínimo
          results.push({
            cat,
            p,
            score: combinedScore,
            breakdown: {
              titleSimilarity,
              bodySimilarity,
              naturalTermScore
            }
          });
        }
      });
    });
    
    // Ordena por score e limita resultados
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /* =========================================================
     14. INPUT / ENVIO
  ========================================================= */
  function syncSendButtonState() {
    const hasText = els.textInput.value.trim().length > 0;
    els.btnSend.disabled = !hasText;
    els.btnSend.classList.toggle('active', hasText);
  }

  /* =========================================================
     13. EVENTOS
  ========================================================= */
  function bindEvents() {
    els.btnMenu.addEventListener('click', () => {
      if (drawerOpenMobile) closeDrawer();
      else openDrawer();
    });
    els.btnCloseDrawer.addEventListener('click', closeDrawer);
    els.overlay.addEventListener('click', closeDrawer);

    els.btnNewChat.addEventListener('click', startNewChat);
    els.drawerNewChat.addEventListener('click', () => {
      startNewChat();
      if (!desktopMQ.matches) closeDrawer();
    });

    els.inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(els.textInput.value);
    });
    els.textInput.addEventListener('input', syncSendButtonState);

    els.chips.forEach((chip) => {
      chip.addEventListener('click', () => handleSubmit(chip.dataset.cmd));
    });

    desktopMQ.addEventListener('change', syncResponsiveLayout);
    window.addEventListener('resize', () => {
      // no-op: layout handled via CSS + matchMedia listener above
    });
  }

  /* =========================================================
     15. TESTES DE USABILIDADE E MÉTRICAS
  ========================================================= */
  let usabilityMetrics = {
    searchQueries: [],
    searchResults: [],
    filterUsage: [],
    suggestionClicks: [],
    promptCopies: [],
    sessionStart: Date.now(),
    sessionEnd: null
  };

  function trackSearchMetric(query, resultsCount, searchType) {
    usabilityMetrics.searchQueries.push({
      timestamp: Date.now(),
      query: query,
      resultsCount: resultsCount,
      searchType: searchType,
      timeSinceSessionStart: Date.now() - usabilityMetrics.sessionStart
    });
    
    // Limitar histórico para evitar uso excessivo de memória
    if (usabilityMetrics.searchQueries.length > 100) {
      usabilityMetrics.searchQueries.shift();
    }
    
    saveUsabilityMetrics();
  }

  function trackFilterUsage(filterType, filterValue, action) {
    usabilityMetrics.filterUsage.push({
      timestamp: Date.now(),
      filterType: filterType,
      filterValue: filterValue,
      action: action, // 'add' ou 'remove'
      activeFilters: JSON.parse(JSON.stringify(activeFilters))
    });
    
    saveUsabilityMetrics();
  }

  function trackSuggestionClick(suggestionType, suggestionData) {
    usabilityMetrics.suggestionClicks.push({
      timestamp: Date.now(),
      suggestionType: suggestionType,
      suggestionData: suggestionData,
      timeSinceSessionStart: Date.now() - usabilityMetrics.sessionStart
    });
    
    saveUsabilityMetrics();
  }

  function trackPromptCopy(promptTitle, category) {
    usabilityMetrics.promptCopies.push({
      timestamp: Date.now(),
      promptTitle: promptTitle,
      category: category,
      timeSinceSessionStart: Date.now() - usabilityMetrics.sessionStart
    });
    
    saveUsabilityMetrics();
  }

  function saveUsabilityMetrics() {
    try {
      localStorage.setItem('masterPromptsUsabilityMetrics', JSON.stringify(usabilityMetrics));
    } catch (e) {
      console.warn('Não foi possível salvar métricas de usabilidade:', e);
    }
  }

  function loadUsabilityMetrics() {
    try {
      const saved = localStorage.getItem('masterPromptsUsabilityMetrics');
      if (saved) {
        usabilityMetrics = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Não foi possível carregar métricas de usabilidade:', e);
    }
  }

  function calculateUsabilityReport() {
    const now = Date.now();
    const sessionDuration = now - usabilityMetrics.sessionStart;
    
    // Métricas de pesquisa
    const totalSearches = usabilityMetrics.searchQueries.length;
    const naturalLanguageSearches = usabilityMetrics.searchQueries.filter(
      q => q.searchType === 'similarity' || q.searchType === 'natural'
    ).length;
    const keywordSearches = usabilityMetrics.searchQueries.filter(
      q => q.searchType === 'keyword'
    ).length;
    
    // Taxa de sucesso (pelo menos 1 resultado)
    const successfulSearches = usabilityMetrics.searchQueries.filter(
      q => q.resultsCount > 0
    ).length;
    const successRate = totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0;
    
    // Métricas de filtros
    const totalFilterActions = usabilityMetrics.filterUsage.length;
    const uniqueFiltersUsed = new Set(
      usabilityMetrics.filterUsage.map(f => `${f.filterType}:${f.filterValue}`)
    ).size;
    
    // Métricas de sugestões
    const totalSuggestionClicks = usabilityMetrics.suggestionClicks.length;
    
    // Métricas de cópias
    const totalCopies = usabilityMetrics.promptCopies.length;
    
    // Tempo médio para encontrar prompt (estimativa)
    let avgTimeToFind = 0;
    if (usabilityMetrics.promptCopies.length > 0) {
      const times = usabilityMetrics.promptCopies.map(c => c.timeSinceSessionStart);
      avgTimeToFind = times.reduce((a, b) => a + b, 0) / times.length;
    }
    
    return {
      sessionDuration: Math.round(sessionDuration / 1000), // em segundos
      totalSearches,
      naturalLanguageSearches,
      keywordSearches,
      naturalLanguageUsageRate: totalSearches > 0 ? (naturalLanguageSearches / totalSearches) * 100 : 0,
      successRate: Math.round(successRate * 10) / 10, // uma casa decimal
      totalFilterActions,
      uniqueFiltersUsed,
      totalSuggestionClicks,
      totalCopies,
      avgTimeToFind: Math.round(avgTimeToFind / 1000), // em segundos
      timestamp: now
    };
  }

  function showUsabilityReport() {
    const report = calculateUsabilityReport();
    
    addBotMessage((content) => {
      const reportContainer = document.createElement('div');
      reportContainer.className = 'usability-report-container';
      
      const header = document.createElement('div');
      header.className = 'report-header';
      header.innerHTML = '<span class="report-icon">📊</span> <strong>Relatório de Usabilidade</strong>';
      reportContainer.appendChild(header);
      
      const metricsGrid = document.createElement('div');
      metricsGrid.className = 'metrics-grid';
      
      const metrics = [
        { label: 'Duração da sessão', value: `${report.sessionDuration}s`, icon: '⏱️' },
        { label: 'Total de pesquisas', value: report.totalSearches, icon: '🔍' },
        { label: 'Pesquisas linguagem natural', value: report.naturalLanguageSearches, icon: '💬' },
        { label: 'Taxa de uso linguagem natural', value: `${report.naturalLanguageUsageRate.toFixed(1)}%`, icon: '📈' },
        { label: 'Taxa de sucesso', value: `${report.successRate}%`, icon: '✅' },
        { label: 'Ações de filtro', value: report.totalFilterActions, icon: '🎛️' },
        { label: 'Filtros únicos usados', value: report.uniqueFiltersUsed, icon: '✨' },
        { label: 'Cliques em sugestões', value: report.totalSuggestionClicks, icon: '💡' },
        { label: 'Prompts copiados', value: report.totalCopies, icon: '📋' },
        { label: 'Tempo médio para encontrar', value: `${report.avgTimeToFind}s`, icon: '⚡' }
      ];
      
      metrics.forEach(metric => {
        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        
        metricCard.innerHTML = `
          <div class="metric-icon">${metric.icon}</div>
          <div class="metric-content">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
          </div>
        `;
        
        metricsGrid.appendChild(metricCard);
      });
      
      reportContainer.appendChild(metricsGrid);
      
      const insights = document.createElement('div');
      insights.className = 'report-insights';
      
      let insightText = '💡 **Insights:**\n\n';
      
      if (report.naturalLanguageUsageRate > 50) {
        insightText += '• Usuários estão adotando bem a pesquisa por linguagem natural\n';
      }
      
      if (report.successRate > 80) {
        insightText += '• Sistema de pesquisa está encontrando resultados relevantes\n';
      } else if (report.successRate < 50) {
        insightText += '• Oportunidade para melhorar a precisão da pesquisa\n';
      }
      
      if (report.totalFilterActions > 0) {
        insightText += '• Filtros estão sendo utilizados pelos usuários\n';
      }
      
      if (report.totalSuggestionClicks > 0) {
        insightText += '• Sugestões contextuais estão sendo úteis\n';
      }
      
      insights.textContent = insightText;
      reportContainer.appendChild(insights);
      
      content.appendChild(reportContainer);
    });
  }

  function renderSearchResults(query) {
    const q = query.toLowerCase();
    
    // Processar consulta com linguagem natural
    const naturalTerms = processNaturalLanguageQuery(query);
    const words = q.split(/\s+/).filter((w) => w.length >= 2);
    const allTerms = [...new Set([...naturalTerms, ...words])];

    const scored = [];
    const seenTitles = new Set();
    CATEGORIES.forEach((cat) => {
      const catName = cat.name.toLowerCase();
      cat.prompts.forEach((p) => {
        const title = p.title.toLowerCase();
        const body = p.body.toLowerCase();
        let score = 0;
        allTerms.forEach((t) => {
          if (title === t) score += 10;           // título exato
          if (title.startsWith(t)) score += 6;   // começa com o termo
          if (title.includes(t)) score += 4;     // título contém
          if (catName.includes(t)) score += 2;   // nome da categoria contém
          if (body.includes(t)) score += 1;      // corpo contém
        });
        if (score > 0 && !seenTitles.has(title)) {
          seenTitles.add(title);
          scored.push({ cat, p, score });
        }
      });
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 8);

    if (!top.length) {
      // Tenta a busca por similaridade antes de desistir
      const similar = findSimilarPrompts(query, 4);
      if (similar.length > 0) {
        addBotTextMessage(
          '🔍 Nenhum resultado exato para "**' + escapeHtml(query) + '**", mas encontrei prompts relacionados:'
        );
        trackSearchMetric(query, similar.length, 'fallback-similarity');
        addBotMessage((content) => {
          const wrap = document.createElement('div');
          wrap.className = 'cards-wrap';
          similar.forEach(({ cat, p }) => {
            const card = buildPromptCard(p, cat, allTerms);
            wrap.appendChild(card);
          });
          content.appendChild(wrap);
          const actions = document.createElement('div');
          actions.className = 'msg-actions';
          actions.appendChild(buildBackChip('Ver todas as categorias', () => renderCategoryMenu()));
          content.appendChild(actions);
        });
        return;
      }

      addBotTextMessage(
        '🔍 Nenhum prompt encontrado para "**' + escapeHtml(query) + '**".\n\n' +
          'Tente:\n' +
          '- **/prompts** para ver todas as categorias\n' +
          '- Uma palavra-chave diferente (ex: "anúncio", "roteiro", "debug")\n' +
          '- **/similar ' + escapeHtml(query) + '** para busca por similaridade de conteúdo'
      );
      trackSearchMetric(query, 0, 'keyword');
      return;
    }

    const hasMore = scored.length > 8;
    addBotTextMessage(
      '🔍 ' + (hasMore ? 'Top 8 de ' + scored.length : scored.length) +
        ' prompt' + (scored.length === 1 ? '' : 's') +
        ' para "**' + escapeHtml(query) + '**":'
    );
    
    trackSearchMetric(query, top.length, 'keyword');
    
    addBotMessage((content) => {
      const wrap = document.createElement('div');
      wrap.className = 'cards-wrap';
      top.forEach(({ cat, p }) => {
        const card = buildPromptCard(p, cat, allTerms);
        wrap.appendChild(card);
      });
      content.appendChild(wrap);

      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      if (hasMore) {
        actions.appendChild(buildBackChip(
          '🔭 Busca por similaridade',
          () => renderSimilaritySearchResults(query)
        ));
      }
      actions.appendChild(buildBackChip('Ver todas as categorias', () => renderCategoryMenu()));
      content.appendChild(actions);
    });
  }

  /* Constrói um card de prompt com destaque de termos */
  function buildPromptCard(p, cat, highlightTerms) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    const head = document.createElement('div');
    head.className = 'prompt-card-head';

    // Snippet do corpo com destaque
    const bodySnippet = getHighlightedSnippet(p.body, highlightTerms, 120);

    head.innerHTML =
      '<span class="prompt-card-icon" aria-hidden="true">' + promptIconSVG(p.icon, 16) + '</span>' +
      '<span class="prompt-card-title">' + escapeHtml(p.title) +
      '<span class="prompt-card-cat">' +
      categoryIconSVG(cat.id, 11) + ' ' + escapeHtml(cat.name) + '</span></span>';
    head.appendChild(buildCopyButton(p.title, p.body));
    const body = document.createElement('div');
    body.className = 'prompt-card-body';
    body.innerHTML = bodySnippet;
    card.appendChild(head);
    card.appendChild(body);
    return card;
  }

  /* Extrai trecho do texto com os termos destacados */
  function getHighlightedSnippet(text, terms, maxLen) {
    if (!terms || terms.length === 0) {
      return escapeHtml(text.length > maxLen ? text.slice(0, maxLen) + '…' : text);
    }
    // Encontra a posição do primeiro match
    const lower = text.toLowerCase();
    let bestPos = -1;
    for (const t of terms) {
      const idx = lower.indexOf(t);
      if (idx !== -1 && (bestPos === -1 || idx < bestPos)) bestPos = idx;
    }
    let snippet = text;
    let prefix = '';
    if (bestPos > 30) {
      snippet = text.slice(Math.max(0, bestPos - 20));
      prefix = '…';
    }
    if (snippet.length > maxLen) {
      snippet = snippet.slice(0, maxLen) + '…';
    }
    // Destaca os termos no snippet
    let html = escapeHtml(prefix + snippet);
    terms.forEach(t => {
      if (t.length < 2) return;
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      html = html.replace(re, '<mark class="search-highlight">$1</mark>');
    });
    return html;
  }

  function renderSimilaritySearchResults(query) {
    const similarPrompts = findSimilarPrompts(query);
    
    if (similarPrompts.length === 0) {
      addBotTextMessage(
        '🔍 Não encontrei prompts similares para "**' + escapeHtml(query) + '**".\n\n' +
        '💡 **Dica:** Tente reformular sua consulta ou use frases mais descritivas.'
      );
      
      trackSearchMetric(query, 0, 'similarity');
      return;
    }
    
    // Agrupar por categoria para melhor organização
    const groupedByCategory = {};
    similarPrompts.forEach(({ cat, p, score }) => {
      if (!groupedByCategory[cat.id]) {
        groupedByCategory[cat.id] = {
          category: cat,
          prompts: []
        };
      }
      groupedByCategory[cat.id].prompts.push({ prompt: p, score });
    });
    
    addBotTextMessage(
      '🔍 Encontrei ' + similarPrompts.length + ' prompt' + (similarPrompts.length === 1 ? '' : 's') +
      ' similares para "**' + escapeHtml(query) + '**":\n\n' +
      '💡 *Pesquisa por similaridade de conteúdo ativa*'
    );
    
    trackSearchMetric(query, similarPrompts.length, 'similarity');
    
    addBotMessage((content) => {
      // Ordenar categorias pela maior pontuação
      const sortedCategories = Object.values(groupedByCategory)
        .sort((a, b) => {
          const maxScoreA = Math.max(...a.prompts.map(p => p.score));
          const maxScoreB = Math.max(...b.prompts.map(p => p.score));
          return maxScoreB - maxScoreA;
        });
      
      sortedCategories.forEach(({ category, prompts }) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'similarity-category-section';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'similarity-category-header';
        categoryHeader.innerHTML = `
          <span class="category-icon">${categoryIconSVG(category.id, 18)}</span>
          <span class="category-name">${escapeHtml(category.name)}</span>
          <span class="prompt-count">${prompts.length} prompt${prompts.length === 1 ? '' : 's'}</span>
        `;
        categorySection.appendChild(categoryHeader);
        
        const promptsContainer = document.createElement('div');
        promptsContainer.className = 'similarity-prompts-container';
        
        prompts.forEach(({ prompt, score }) => {
          const promptCard = document.createElement('div');
          promptCard.className = 'similarity-prompt-card';
          
          const similarityBadge = document.createElement('div');
          similarityBadge.className = 'similarity-badge';
          similarityBadge.textContent = `${Math.round(score * 100)}% similar`;
          
          const head = document.createElement('div');
          head.className = 'similarity-prompt-head';
          head.innerHTML = `
            <span class="prompt-icon">${promptIconSVG(prompt.icon, 16)}</span>
            <span class="prompt-title">${escapeHtml(prompt.title)}</span>
          `;
          head.appendChild(buildCopyButton(prompt.title, prompt.body));
          
          const body = document.createElement('div');
          body.className = 'similarity-prompt-body';
          body.textContent = prompt.body.length > 150 ? prompt.body.substring(0, 150) + '...' : prompt.body;
          
          promptCard.appendChild(similarityBadge);
          promptCard.appendChild(head);
          promptCard.appendChild(body);
          promptsContainer.appendChild(promptCard);
        });
        
        categorySection.appendChild(promptsContainer);
        content.appendChild(categorySection);
      });
      
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.appendChild(buildBackChip('Ver todas as categorias', () => renderCategoryMenu()));
      content.appendChild(actions);
    });
  }

  function toggleFilter(e) {
    const button = e.currentTarget;
    const filterType = button.dataset.filter;
    const value = button.dataset.value;
    
    button.classList.toggle('active');
    
    if (button.classList.contains('active')) {
      if (!activeFilters[filterType].includes(value)) {
        activeFilters[filterType].push(value);
        trackFilterUsage(filterType, value, 'add');
      }
    } else {
      activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
      trackFilterUsage(filterType, value, 'remove');
    }
  }

  function buildCopyButton(title, body) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copiar prompt: ' + title);
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
      '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>Copiar</span>';
    btn.addEventListener('click', () => copyPromptText(title, body, btn));
    return btn;
  }

  // Adicionar comando para mostrar relatório
  function routeCommand(text) {
    trackSearchQuery(text);
    const lower = text.toLowerCase().trim();

    if (lower.startsWith('/')) {
      if (lower === '/prompts' || lower === '/categorias') {
        renderCategoryMenu();
      } else if (lower === '/ajuda' || lower === '/help') {
        renderHelp();
      } else if (lower === '/sobre' || lower === '/about') {
        renderAbout();
      } else if (lower === '/add' || lower === '/adicionar') {
        renderAddCommand();
      } else if (lower === '/clear' || lower === '/limpar') {
        renderClearCommand();
      } else if (lower === '/similar') {
        const query = text.substring('/similar'.length).trim();
        if (query) {
          renderSimilaritySearchResults(query);
        } else {
          addBotTextMessage(
            '🔍 **Uso:** /similar [sua consulta]\n\n' +
            'Exemplo: `/similar como revisar código`'
          );
        }
      } else if (lower === '/metricas' || lower === '/relatorio') {
        showUsabilityReport();
      } else {
        addBotTextMessage(
          'Comando não reconhecido: **' + escapeHtml(text) + '**\n\nDigite **/ajuda** para ver os comandos disponíveis.'
        );
      }
      return;
    }

    const queryLength = text.trim().length;
    const wordCount = text.trim().split(/\s+/).length;

    // Para qualquer consulta, usa a pesquisa de palavras-chave aprimorada.
    // Para frases longas (> 4 palavras), também tenta similaridade como complemento.
    if (queryLength > 0) {
      renderSearchResults(text);
    }
  }

  /* =========================================================
     16. GERENCIAMENTO DE DADOS DO USUÁRIO (/add e /clear)
  ========================================================= */
  const USER_DATA_KEY = 'masterPromptsUserData';
  let USER_ADDED_CATEGORY_IDS = new Set();
  let USER_ADDED_PROMPTS = {}; // { catId: Set<promptTitle> }

  function loadAndApplyUserData() {
    try {
      const saved = localStorage.getItem(USER_DATA_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);

      if (Array.isArray(data.categories)) {
        data.categories.forEach(function(cat) {
          if (!CATEGORY_BY_ID[cat.id]) {
            CATEGORIES.push(cat);
            CATEGORY_BY_ID[cat.id] = cat;
            USER_ADDED_CATEGORY_IDS.add(cat.id);
          }
        });
      }

      if (data.promptAdditions && typeof data.promptAdditions === 'object') {
        Object.keys(data.promptAdditions).forEach(function(catId) {
          const prompts = data.promptAdditions[catId];
          const cat = CATEGORY_BY_ID[catId];
          if (cat && Array.isArray(prompts)) {
            prompts.forEach(function(p) {
              cat.prompts.push(p);
              if (!USER_ADDED_PROMPTS[catId]) USER_ADDED_PROMPTS[catId] = new Set();
              USER_ADDED_PROMPTS[catId].add(p.title);
            });
          }
        });
      }
    } catch (e) {
      console.warn('Não foi possível carregar dados do usuário:', e);
    }
  }

  function persistUserData() {
    try {
      const savedCats = CATEGORIES.filter(function(c) {
        return USER_ADDED_CATEGORY_IDS.has(c.id);
      });
      const savedPrompts = {};
      Object.keys(USER_ADDED_PROMPTS).forEach(function(catId) {
        const titles = USER_ADDED_PROMPTS[catId];
        const cat = CATEGORY_BY_ID[catId];
        if (cat) {
          savedPrompts[catId] = cat.prompts.filter(function(p) {
            return titles.has(p.title);
          });
        }
      });
      localStorage.setItem(USER_DATA_KEY, JSON.stringify({
        categories: savedCats,
        promptAdditions: savedPrompts
      }));
    } catch (e) {
      console.warn('Não foi possível salvar dados do usuário:', e);
    }
  }

  function commitClearUserData() {
    // Remove categorias criadas pelo usuário
    USER_ADDED_CATEGORY_IDS.forEach(function(id) {
      const idx = CATEGORIES.findIndex(function(c) { return c.id === id; });
      if (idx !== -1) CATEGORIES.splice(idx, 1);
      delete CATEGORY_BY_ID[id];
    });
    USER_ADDED_CATEGORY_IDS = new Set();

    // Remove prompts adicionados pelo usuário nas categorias originais
    Object.keys(USER_ADDED_PROMPTS).forEach(function(catId) {
      const titles = USER_ADDED_PROMPTS[catId];
      const cat = CATEGORY_BY_ID[catId];
      if (cat) {
        cat.prompts = cat.prompts.filter(function(p) { return !titles.has(p.title); });
      }
    });
    USER_ADDED_PROMPTS = {};

    try { localStorage.removeItem(USER_DATA_KEY); } catch (e) {}
  }

  function getUserAddedStats() {
    let catCount = USER_ADDED_CATEGORY_IDS.size;
    let promptCount = 0;
    Object.values(USER_ADDED_PROMPTS).forEach(function(s) { promptCount += s.size; });
    return { catCount, promptCount, total: catCount + promptCount };
  }

  function doAddUserPrompt(catId, prompt) {
    const cat = CATEGORY_BY_ID[catId];
    if (!cat) return;
    cat.prompts.push(prompt);
    if (!USER_ADDED_PROMPTS[catId]) USER_ADDED_PROMPTS[catId] = new Set();
    USER_ADDED_PROMPTS[catId].add(prompt.title);
    persistUserData();
    renderDrawerCategoryList();
  }

  function doAddUserCategory(cat) {
    CATEGORIES.push(cat);
    CATEGORY_BY_ID[cat.id] = cat;
    USER_ADDED_CATEGORY_IDS.add(cat.id);
    persistUserData();
    renderDrawerCategoryList();
  }

  /* --- Renderização do /add --- */

  function renderAddCommand() {
    addBotTextMessage('O que você deseja fazer?');
    addBotMessage(function(content) {
      const wrap = document.createElement('div');
      wrap.className = 'msg-actions';

      const btnExisting = document.createElement('button');
      btnExisting.type = 'button';
      btnExisting.className = 'chip';
      btnExisting.textContent = '📂 Adicionar a categoria existente';
      btnExisting.addEventListener('click', function() { renderPickCategoryForAdd(); });

      const btnNew = document.createElement('button');
      btnNew.type = 'button';
      btnNew.className = 'chip';
      btnNew.textContent = '✨ Criar nova categoria';
      btnNew.addEventListener('click', function() { renderCreateNewCategory(); });

      wrap.appendChild(btnExisting);
      wrap.appendChild(btnNew);
      content.appendChild(wrap);
    });
  }

  function renderPickCategoryForAdd() {
    addUserMessage('Adicionar a categoria existente');
    addBotTextMessage('Selecione a categoria onde deseja adicionar o prompt:');
    addBotMessage(function(content) {
      const wrap = document.createElement('div');
      wrap.className = 'cards-wrap';
      CATEGORIES.forEach(function(cat) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-card';
        btn.innerHTML =
          '<div class="prompt-card-head">' +
          '<span class="prompt-card-icon" aria-hidden="true">' + categoryIconSVG(cat.id, 20) + '</span>' +
          '<span class="prompt-card-title">' + escapeHtml(cat.name) + '</span>' +
          (USER_ADDED_CATEGORY_IDS.has(cat.id)
            ? '<span class="user-badge">sua</span>'
            : '') +
          '</div>' +
          '<div class="prompt-card-body">' + cat.prompts.length + ' prompt' +
          (cat.prompts.length === 1 ? '' : 's') + '</div>';
        btn.addEventListener('click', function() { renderAddPromptForm(cat.id); });
        wrap.appendChild(btn);
      });
      content.appendChild(wrap);
      const back = document.createElement('div');
      back.className = 'msg-actions';
      back.appendChild(buildBackChip('↩ Voltar', function() { renderAddCommand(); }));
      content.appendChild(back);
    });
  }

  function renderAddPromptForm(catId) {
    const cat = CATEGORY_BY_ID[catId];
    if (!cat) return;
    addUserMessage(cat.name);
    addBotTextMessage('Adicione um novo prompt à categoria **' + escapeHtml(cat.name) + '**:');

    addBotMessage(function(content) {
      const form = document.createElement('div');
      form.className = 'user-form';

      // Título
      const titleGroup = document.createElement('div');
      titleGroup.className = 'user-form-group';
      const titleLabel = document.createElement('label');
      titleLabel.className = 'user-form-label';
      titleLabel.textContent = 'Título do prompt';
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'user-form-input';
      titleInput.placeholder = 'Ex: Gerador de Ideias';
      titleGroup.appendChild(titleLabel);
      titleGroup.appendChild(titleInput);

      // Corpo
      const bodyGroup = document.createElement('div');
      bodyGroup.className = 'user-form-group';
      const bodyLabel = document.createElement('label');
      bodyLabel.className = 'user-form-label';
      bodyLabel.textContent = 'Conteúdo do prompt';
      const bodyInput = document.createElement('textarea');
      bodyInput.className = 'user-form-textarea';
      bodyInput.placeholder = 'Cole ou escreva o texto do prompt aqui...';
      bodyInput.rows = 5;
      bodyGroup.appendChild(bodyLabel);
      bodyGroup.appendChild(bodyInput);

      // Ações
      const actions = document.createElement('div');
      actions.className = 'user-form-actions';

      const btnAdd = document.createElement('button');
      btnAdd.type = 'button';
      btnAdd.className = 'btn-primary';
      btnAdd.textContent = 'Adicionar prompt';

      const btnBack = document.createElement('button');
      btnBack.type = 'button';
      btnBack.className = 'btn-secondary';
      btnBack.textContent = 'Cancelar';
      btnBack.addEventListener('click', function() { renderPickCategoryForAdd(); });

      btnAdd.addEventListener('click', function() {
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        if (!title) { showToast('Digite o título do prompt'); return; }
        if (!body) { showToast('Digite o conteúdo do prompt'); return; }

        [titleInput, bodyInput, btnAdd, btnBack].forEach(function(el) { el.disabled = true; });
        form.style.opacity = '0.6';

        doAddUserPrompt(catId, { title: title, icon: '📝', body: body });

        addBotTextMessage('✅ Prompt **"' + escapeHtml(title) + '"** adicionado à categoria **' + escapeHtml(cat.name) + '**!');
        addBotMessage(function(c) {
          const acts = document.createElement('div');
          acts.className = 'msg-actions';
          acts.appendChild(buildBackChip('➕ Adicionar mais', function() { renderAddCommand(); }));
          acts.appendChild(buildBackChip('👁 Ver categoria', function() { renderCategoryPrompts(catId); }));
          c.appendChild(acts);
        });
      });

      actions.appendChild(btnAdd);
      actions.appendChild(btnBack);
      form.appendChild(titleGroup);
      form.appendChild(bodyGroup);
      form.appendChild(actions);
      content.appendChild(form);
      titleInput.focus();
    });
  }

  function renderCreateNewCategory() {
    addUserMessage('Criar nova categoria');
    addBotTextMessage('Vamos criar uma nova categoria! Preencha os dados:');

    addBotMessage(function(content) {
      const form = document.createElement('div');
      form.className = 'user-form';

      // Linha emoji + nome
      const topRow = document.createElement('div');
      topRow.className = 'user-form-row';

      const emojiGroup = document.createElement('div');
      emojiGroup.className = 'user-form-group';
      const emojiLabel = document.createElement('label');
      emojiLabel.className = 'user-form-label';
      emojiLabel.textContent = 'Emoji';
      const emojiInput = document.createElement('input');
      emojiInput.type = 'text';
      emojiInput.className = 'user-form-input user-form-emoji';
      emojiInput.placeholder = '📁';
      emojiInput.maxLength = 4;
      emojiGroup.appendChild(emojiLabel);
      emojiGroup.appendChild(emojiInput);

      const nameGroup = document.createElement('div');
      nameGroup.className = 'user-form-group user-form-group-flex';
      const nameLabel = document.createElement('label');
      nameLabel.className = 'user-form-label';
      nameLabel.textContent = 'Nome da categoria';
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'user-form-input';
      nameInput.placeholder = 'Ex: Meus Prompts Favoritos';
      nameGroup.appendChild(nameLabel);
      nameGroup.appendChild(nameInput);

      topRow.appendChild(emojiGroup);
      topRow.appendChild(nameGroup);

      // Divider
      const divider = document.createElement('div');
      divider.className = 'user-form-divider';
      divider.textContent = 'Primeiro prompt (opcional)';

      // Título do prompt
      const ptitleGroup = document.createElement('div');
      ptitleGroup.className = 'user-form-group';
      const ptitleLabel = document.createElement('label');
      ptitleLabel.className = 'user-form-label';
      ptitleLabel.textContent = 'Título do primeiro prompt';
      const ptitleInput = document.createElement('input');
      ptitleInput.type = 'text';
      ptitleInput.className = 'user-form-input';
      ptitleInput.placeholder = 'Ex: Meu Prompt Especial';
      ptitleGroup.appendChild(ptitleLabel);
      ptitleGroup.appendChild(ptitleInput);

      // Corpo do prompt
      const pbodyGroup = document.createElement('div');
      pbodyGroup.className = 'user-form-group';
      const pbodyLabel = document.createElement('label');
      pbodyLabel.className = 'user-form-label';
      pbodyLabel.textContent = 'Conteúdo do primeiro prompt';
      const pbodyInput = document.createElement('textarea');
      pbodyInput.className = 'user-form-textarea';
      pbodyInput.placeholder = 'Cole ou escreva o texto do prompt...';
      pbodyInput.rows = 4;
      pbodyGroup.appendChild(pbodyLabel);
      pbodyGroup.appendChild(pbodyInput);

      // Ações
      const actions = document.createElement('div');
      actions.className = 'user-form-actions';

      const btnCreate = document.createElement('button');
      btnCreate.type = 'button';
      btnCreate.className = 'btn-primary';
      btnCreate.textContent = 'Criar categoria';

      const btnBack = document.createElement('button');
      btnBack.type = 'button';
      btnBack.className = 'btn-secondary';
      btnBack.textContent = 'Cancelar';
      btnBack.addEventListener('click', function() { renderAddCommand(); });

      btnCreate.addEventListener('click', function() {
        const emoji = emojiInput.value.trim() || '📁';
        const name = nameInput.value.trim();
        if (!name) { showToast('Digite o nome da categoria'); return; }

        const catId = 'user_' + Date.now();
        const newCat = { id: catId, emoji: emoji, name: name, prompts: [] };

        const ptitle = ptitleInput.value.trim();
        const pbody = pbodyInput.value.trim();
        if (ptitle && pbody) {
          newCat.prompts.push({ title: ptitle, icon: '📝', body: pbody });
        }

        [emojiInput, nameInput, ptitleInput, pbodyInput, btnCreate, btnBack].forEach(function(el) { el.disabled = true; });
        form.style.opacity = '0.6';

        doAddUserCategory(newCat);

        addBotTextMessage('✅ Categoria **"' + escapeHtml(name) + '"** criada com sucesso!');
        addBotMessage(function(c) {
          const acts = document.createElement('div');
          acts.className = 'msg-actions';
          acts.appendChild(buildBackChip('➕ Adicionar prompts', function() { renderAddPromptForm(catId); }));
          acts.appendChild(buildBackChip('👁 Ver categoria', function() { renderCategoryPrompts(catId); }));
          c.appendChild(acts);
        });
      });

      actions.appendChild(btnCreate);
      actions.appendChild(btnBack);
      form.appendChild(topRow);
      form.appendChild(divider);
      form.appendChild(ptitleGroup);
      form.appendChild(pbodyGroup);
      form.appendChild(actions);
      content.appendChild(form);
      nameInput.focus();
    });
  }

  /* --- Renderização do /clear --- */

  function renderClearCommand() {
    const stats = getUserAddedStats();

    if (stats.total === 0) {
      addBotTextMessage(
        '✨ Não há nada para limpar!\n\n' +
        'Você ainda não adicionou nenhum prompt ou categoria. ' +
        'O banco de dados original está intacto.\n\n' +
        'Use **/add** para começar a adicionar conteúdo próprio.'
      );
      return;
    }

    const catLabel = stats.catCount === 1
      ? '**1** categoria criada por você'
      : '**' + stats.catCount + '** categorias criadas por você';
    const pLabel = stats.promptCount === 1
      ? '**1** prompt adicionado por você'
      : '**' + stats.promptCount + '** prompts adicionados por você';

    let summary = 'Tem certeza que deseja limpar o conteúdo adicionado?\n\n';
    if (stats.catCount > 0) summary += '- 🗂 ' + catLabel + '\n';
    if (stats.promptCount > 0) summary += '- 📝 ' + pLabel + '\n';
    summary += '\n⚠️ Os prompts originais do banco de dados **não serão afetados**.';

    addBotTextMessage(summary);

    addBotMessage(function(content) {
      const wrap = document.createElement('div');
      wrap.className = 'msg-actions';

      const btnConfirm = document.createElement('button');
      btnConfirm.type = 'button';
      btnConfirm.className = 'chip chip-danger';
      btnConfirm.textContent = '🗑 Confirmar limpeza';

      const btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.className = 'chip';
      btnCancel.textContent = '↩ Cancelar';

      btnConfirm.addEventListener('click', function() {
        btnConfirm.disabled = true;
        btnCancel.disabled = true;
        commitClearUserData();
        renderDrawerCategoryList();
        addBotTextMessage(
          '✅ Limpeza concluída!\n\n' +
          'Todos os itens adicionados foram removidos. ' +
          'O banco de dados original foi restaurado.\n\n' +
          'Use **/add** para adicionar novos prompts quando quiser.'
        );
      });

      btnCancel.addEventListener('click', function() {
        btnConfirm.disabled = true;
        btnCancel.disabled = true;
        addBotTextMessage('Operação cancelada. Seus prompts estão seguros! 😊');
      });

      wrap.appendChild(btnConfirm);
      wrap.appendChild(btnCancel);
      content.appendChild(wrap);
    });
  }

  /* =========================================================
     17. INIT
  ========================================================= */
  function init() {
    injectStreamingStyles();
    mountLogos();
    loadAndApplyUserData();
    renderDrawerCategoryList();
    initFilters();
    loadUserHistory();
    bindEvents();
    syncResponsiveLayout();
    syncSendButtonState();
    
    // Mostrar sugestões contextuais após um breve delay
    setTimeout(() => {
      showContextualSuggestions();
    }, 1500);
    
    if (desktopMQ.matches) {
      els.textInput.focus({ preventScroll: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();