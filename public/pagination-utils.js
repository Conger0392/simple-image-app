(function (global) {
  const DEFAULT_PAGE_SIZE = 20;
  const ALLOWED_PAGE_SIZES = [10, 20, 50];
  const MAX_VISIBLE_PAGES = 5;
  const MIN_TOKEN_BALANCE = 15;
  const DEFAULT_TOKEN_BALANCE = 65;

  function clampPage(page, totalPages) {
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const numericPage = Number(page);
    if (!Number.isFinite(numericPage)) {
      return 1;
    }
    return Math.min(Math.max(1, Math.trunc(numericPage)), safeTotalPages);
  }

  function getVisiblePages(currentPage, totalPages, maxVisible = MAX_VISIBLE_PAGES) {
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const safeCurrentPage = clampPage(currentPage, safeTotalPages);
    const safeMaxVisible = Math.max(1, Number(maxVisible) || 1);
    const visibleCount = Math.min(safeTotalPages, safeMaxVisible);
    const halfWindow = Math.floor(visibleCount / 2);
    let startPage = Math.max(1, safeCurrentPage - halfWindow);
    let endPage = startPage + visibleCount - 1;

    if (endPage > safeTotalPages) {
      endPage = safeTotalPages;
      startPage = Math.max(1, endPage - visibleCount + 1);
    }

    const pages = [];
    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  function normalizePageSize(pageSize) {
    const numericPageSize = Number(pageSize);
    return ALLOWED_PAGE_SIZES.includes(numericPageSize) ? numericPageSize : DEFAULT_PAGE_SIZE;
  }

  function isEligibleToken(token, minimumBalance = MIN_TOKEN_BALANCE) {
    const numericBalance = Number(token?.balance);
    return Number.isFinite(numericBalance) && numericBalance >= minimumBalance;
  }

  function isUsedToken(token, usedTokenIds = new Set(), defaultBalance = DEFAULT_TOKEN_BALANCE) {
    const numericBalance = Number(token?.balance);
    return usedTokenIds.has(token?.id) || (Number.isFinite(numericBalance) && numericBalance < defaultBalance);
  }

  function matchesTokenFilter(token, filter = 'all', usedTokenIds = new Set(), options = {}) {
    const minimumBalance = Number(options.minimumBalance) || MIN_TOKEN_BALANCE;
    const defaultBalance = Number(options.defaultBalance) || DEFAULT_TOKEN_BALANCE;
    if (filter === 'low-balance') {
      const numericBalance = Number(token?.balance);
      return Number.isFinite(numericBalance) && numericBalance < minimumBalance;
    }

    if (!isEligibleToken(token, minimumBalance)) {
      return false;
    }

    const used = isUsedToken(token, usedTokenIds, defaultBalance);
    if (filter === 'used') {
      return used;
    }
    if (filter === 'unused') {
      return !used;
    }
    return true;
  }

  function resolveSelectedTokenId(tokens, currentSelectedTokenId = '', minimumBalance = MIN_TOKEN_BALANCE) {
    const tokenList = Array.isArray(tokens) ? tokens : [];
    const selectedToken = tokenList.find((token) => token?.id === currentSelectedTokenId);
    if (selectedToken) {
      return selectedToken.id;
    }

    const eligibleToken = tokenList.find((token) => isEligibleToken(token, minimumBalance));
    if (eligibleToken) {
      return eligibleToken.id;
    }

    return tokenList[0]?.id || '';
  }

  function getGenerateTokenOptions(tokens, selectedTokenId = '', minimumBalance = MIN_TOKEN_BALANCE) {
    const tokenList = Array.isArray(tokens) ? tokens : [];
    const eligibleTokens = tokenList.filter((token) => isEligibleToken(token, minimumBalance));
    const selectedToken = tokenList.find((token) => token?.id === selectedTokenId);

    if (selectedToken && !eligibleTokens.some((token) => token.id === selectedToken.id)) {
      return [...eligibleTokens, selectedToken];
    }

    if (eligibleTokens.length > 0) {
      return eligibleTokens;
    }

    return selectedToken ? [selectedToken] : [];
  }

  function summarizeHistoryPrompt(prompt, maxLength = 48) {
    const text = String(prompt || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return '无提示词';
    }
    const safeMaxLength = Math.max(1, Number(maxLength) || 48);
    if (text.length <= safeMaxLength) {
      return text;
    }
    return `${text.slice(0, safeMaxLength)}...`;
  }

  function summarizeTokenText(value, maxLength = 18) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return '-';
    }
    const safeMaxLength = Math.max(1, Number(maxLength) || 18);
    if (text.length <= safeMaxLength) {
      return text;
    }
    return `${text.slice(0, safeMaxLength)}...`;
  }


  function buildPaginationState(currentPage, totalPages, totalItems) {
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const safeCurrentPage = clampPage(currentPage, safeTotalPages);
    const safeTotalItems = Math.max(0, Number(totalItems) || 0);
    return {
      currentPage: safeCurrentPage,
      totalPages: safeTotalPages,
      totalItems: safeTotalItems,
      firstPage: 1,
      lastPage: safeTotalPages,
      hasPrevious: safeCurrentPage > 1,
      hasNext: safeCurrentPage < safeTotalPages,
      summaryText: `共 ${safeTotalItems} 条，第 ${safeCurrentPage} / ${safeTotalPages} 页`,
    };
  }
  function shouldOpenTokenMaintenancePanel(editingTokenId) {
    return Boolean(String(editingTokenId || '').trim());
  }

  const api = {
    DEFAULT_PAGE_SIZE,
    ALLOWED_PAGE_SIZES,
    MAX_VISIBLE_PAGES,
    MIN_TOKEN_BALANCE,
    DEFAULT_TOKEN_BALANCE,
    clampPage,
    getVisiblePages,
    normalizePageSize,
    isEligibleToken,
    isUsedToken,
    matchesTokenFilter,
    resolveSelectedTokenId,
    getGenerateTokenOptions,
    summarizeHistoryPrompt,
    summarizeTokenText,
    buildPaginationState,
    shouldOpenTokenMaintenancePanel,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.PaginationUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);



