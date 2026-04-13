    const DENSITY_STORAGE_KEY = 'simple-image-app-density';
    const DEFAULT_DENSITY = 'comfortable';
    const DEFAULT_TOKEN_BALANCE = 65;
    const MIN_TOKEN_BALANCE = 15;
    const DEFAULT_ACTION = 'generate';
    const ACTION_LABELS = {
      generate: '标准生成',
      tryon: '试衣',
      faceswap: '换脸',
      style: 'Style transfer',
    };
    const ORDERED_UPLOAD_CONFIGS = {
      tryon: {
        title: '试衣图片顺序',
        description: '严格按照顺序发送：第1张为人物图，第2张为服饰图(消耗30)',
        slots: ['第1张（人物图）', '第2张（服饰图）'],
      },
      faceswap: {
        title: '换脸图片顺序',
        description: '严格按照顺序发送：会将第一张的脸替换至第二张图片(消耗10)。',
        slots: ['第1张（脸图）', '第2张（底图）'],
      },
    };
    const STYLE_IMAGE_BASE_URL = 'https://storage.yandexcloud.net/chatai/common/images/style-prompt/';
    const STYLE_PROMPT_PRESETS = [
      {
        id: 'lenspilot-camera',
        label: 'lenspilot-camera',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures',
      },
      {
        id: 'ghibli-studio',
        label: 'ghibli-studio',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting',
      },
      {
        id: 'disney',
        label: 'disney',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color',
      },
      {
        id: 'pixar',
        label: 'pixar',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting',
      },
      {
        id: 'toy-story',
        label: 'toy-story',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes',
      },
      {
        id: 'chibi',
        label: 'chibi',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes, Convert this image to chibi style with tiny, cute bodies and large, shiny eyes',
      },
      {
        id: 'manga',
        label: 'manga',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes, Convert this image to chibi style with tiny, cute bodies and large, shiny eyes, Make this image a manga illustration with screentone shading and detailed black-and-white linework',
      },
      {
        id: 'cyberpunk',
        label: 'cyberpunk',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes, Convert this image to chibi style with tiny, cute bodies and large, shiny eyes, Make this image a manga illustration with screentone shading and detailed black-and-white linework, Transform this image into a shiny pop-art trading card with bold borders and collectible card style, Restyle this image in cyberpunk, full of rain-soaked streets, neon signage, and futuristic energy',
      },
      {
        id: 'minimalist-sticker',
        label: 'minimalist-sticker',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes, Convert this image to chibi style with tiny, cute bodies and large, shiny eyes, Make this image a manga illustration with screentone shading and detailed black-and-white linework, Transform this image into a shiny pop-art trading card with bold borders and collectible card style, Restyle this image in cyberpunk, full of rain-soaked streets, neon signage, and futuristic energy, Transform this image into a minimalist sticker, using bold outlines, tiny details, and a cute vibe',
      },
      {
        id: 'infographic',
        label: 'infographic',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes, Convert this image to chibi style with tiny, cute bodies and large, shiny eyes, Make this image a manga illustration with screentone shading and detailed black-and-white linework, Transform this image into a shiny pop-art trading card with bold borders and collectible card style, Restyle this image in cyberpunk, full of rain-soaked streets, neon signage, and futuristic energy, Transform this image into a minimalist sticker, using bold outlines, tiny details, and a cute vibe, Transform this image into a minimalist sticker, using bold outlines, tiny details, and a cute vibe, Make this image look like playful doodle art, with random sketches, squiggles, and hand-drawn icons, Turn this image into a clean, informative infographic with icons, labels, and easy-to-read layout',
      },
      {
        id: 'fantasy-storybook',
        label: 'fantasy-storybook',
        prompt: 'Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Make this image look like it was shot with a LensPilot camera, with unique analog textures, Transform this image into a gentle, detailed Studio Ghibli-style scene with magical backgrounds and warm lighting, Make this image look like a bright, lively Disney animation frame with expressive faces and glossy color, Turn this image into a Pixar movie style with 3D modeling, shiny materials, and cinematic lighting, Transform this image into a "Toy Story" animated movie universe scene with playful toy-like shapes, Convert this image to chibi style with tiny, cute bodies and large, shiny eyes, Make this image a manga illustration with screentone shading and detailed black-and-white linework, Transform this image into a shiny pop-art trading card with bold borders and collectible card style, Restyle this image in cyberpunk, full of rain-soaked streets, neon signage, and futuristic energy, Transform this image into a minimalist sticker, using bold outlines, tiny details, and a cute vibe, Transform this image into a minimalist sticker, using bold outlines, tiny details, and a cute vibe, Make this image look like playful doodle art, with random sketches, squiggles, and hand-drawn icons, Turn this image into a clean, informative infographic with icons, labels, and easy-to-read layout, Transform this image into a fantasy storybook illustration with enchanting scenery and magical lighting',
      },
    ].map((preset) => ({
      ...preset,
      imgurl: `${STYLE_IMAGE_BASE_URL}${preset.id}.jpg`,
    }));
    const STYLE_IMAGE_URL = STYLE_PROMPT_PRESETS[0]?.imgurl || '';
    const paginationUtils = window.PaginationUtils || {
      DEFAULT_PAGE_SIZE: 10,
      MIN_TOKEN_BALANCE,
      DEFAULT_TOKEN_BALANCE,
      clampPage(page, totalPages) {
        const safeTotalPages = Math.max(1, Number(totalPages) || 1);
        const numericPage = Number(page);
        if (!Number.isFinite(numericPage)) {
          return 1;
        }
        return Math.min(Math.max(1, Math.trunc(numericPage)), safeTotalPages);
      },
      getVisiblePages(currentPage, totalPages, maxVisible = 5) {
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
        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
      },
      normalizePageSize(pageSize) {
        const numericPageSize = Number(pageSize);
        return [5, 10, 20].includes(numericPageSize) ? numericPageSize : 10;
      },
      isEligibleToken(token, minimumBalance = MIN_TOKEN_BALANCE) {
        const numericBalance = Number(token?.balance);
        return Number.isFinite(numericBalance) && numericBalance >= minimumBalance;
      },
      isUsedToken(token, usedTokenIds = new Set(), defaultBalance = DEFAULT_TOKEN_BALANCE) {
        const numericBalance = Number(token?.balance);
        return usedTokenIds.has(token?.id) || (Number.isFinite(numericBalance) && numericBalance < defaultBalance);
      },
      matchesTokenFilter(token, filter = 'all', usedTokenIds = new Set(), options = {}) {
        const minimumBalance = Number(options.minimumBalance) || MIN_TOKEN_BALANCE;
        const defaultBalance = Number(options.defaultBalance) || DEFAULT_TOKEN_BALANCE;
        if (filter === 'low-balance') {
          const numericBalance = Number(token?.balance);
          return Number.isFinite(numericBalance) && numericBalance < minimumBalance;
        }
        if (!this.isEligibleToken(token, minimumBalance)) {
          return false;
        }
        const used = this.isUsedToken(token, usedTokenIds, defaultBalance);
        if (filter === 'used') {
          return used;
        }
        if (filter === 'unused') {
          return !used;
        }
        return true;
      },
      resolveSelectedTokenId(tokens, currentSelectedTokenId = '', minimumBalance = MIN_TOKEN_BALANCE) {
        const tokenList = Array.isArray(tokens) ? tokens : [];
        const selectedToken = tokenList.find((token) => token?.id === currentSelectedTokenId);
        if (selectedToken) {
          return selectedToken.id;
        }
        const eligibleToken = tokenList.find((token) => this.isEligibleToken(token, minimumBalance));
        if (eligibleToken) {
          return eligibleToken.id;
        }
        return tokenList[0]?.id || '';
      },
      getGenerateTokenOptions(tokens, selectedTokenId = '', minimumBalance = MIN_TOKEN_BALANCE) {
        const tokenList = Array.isArray(tokens) ? tokens : [];
        const eligibleTokens = tokenList.filter((token) => this.isEligibleToken(token, minimumBalance));
        const selectedToken = tokenList.find((token) => token?.id === selectedTokenId);
        if (selectedToken && !eligibleTokens.some((token) => token.id === selectedToken.id)) {
          return [...eligibleTokens, selectedToken];
        }
        if (eligibleTokens.length > 0) {
          return eligibleTokens;
        }
        return selectedToken ? [selectedToken] : [];
      },
      summarizeHistoryPrompt(prompt, maxLength = 48) {
        const text = String(prompt || '').replace(/\s+/g, ' ').trim();
        if (!text) {
          return '未知';
        }
        const safeMaxLength = Math.max(1, Number(maxLength) || 48);
        if (text.length <= safeMaxLength) {
          return text;
        }
        return `${text.slice(0, safeMaxLength)}...`;
      },
      summarizeTokenText(value, maxLength = 18) {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        if (!text) {
          return '-';
        }
        const safeMaxLength = Math.max(1, Number(maxLength) || 18);
        if (text.length <= safeMaxLength) {
          return text;
        }
        return `${text.slice(0, safeMaxLength)}...`;
      },
      shouldOpenTokenMaintenancePanel(editingTokenId) {
        return Boolean(String(editingTokenId || '').trim());
      },
    };
    const {
      DEFAULT_PAGE_SIZE,
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
    } = paginationUtils;
    const state = {
      tokens: [],
      history: [],
      currentResult: null,
      tokenPage: 1,
      tokenPageSize: DEFAULT_PAGE_SIZE,
      tokenFilter: 'all',
      selectedTokenId: '',
      historyPage: 1,
      historyPageSize: DEFAULT_PAGE_SIZE,
      selectedHistoryId: '',
      density: DEFAULT_DENSITY,
      models: [],
      modelGroups: [],
      selectedModelId: '',
      selectedAction: DEFAULT_ACTION,
      orderedReferenceImages: {
        tryon: [null, null],
        faceswap: [null, null],
      },
      orderedPreviewUrls: {
        tryon: [null, null],
        faceswap: [null, null],
      },
      styleConfig: {
        imageUrl: STYLE_IMAGE_URL,
        prompt: '',
      },
    };
    const byId = (id) => document.getElementById(id);
    const elements = {
      tokenMaintenancePanel: byId('token-maintenance-panel'),
      tokenForm: byId('token-form'),
      tokenEditId: byId('token-edit-id'),
      tokenEmail: byId('token-email'),
      tokenPassword: byId('token-password'),
      tokenValue: byId('token-value'),
      tokenBalance: byId('token-balance'),
      tokenSubmitButton: byId('token-submit-button'),
      tokenCancelButton: byId('token-cancel-button'),
      tokenImportFile: byId('token-import-file'),
      tokenImportButton: byId('token-import-button'),
      tokenStatus: byId('token-status'),
      tokenList: byId('token-list'),
      tokenPagination: byId('token-pagination'),
      tokenPageSize: byId('token-page-size'),
      tokenFilterGroup: byId('token-filter-group'),
      tokenTotalCount: byId('token-total-count'),
      generateForm: byId('generate-form'),
      generateToken: byId('generate-token'),
      selectedTokenDisplay: byId('selected-token-display'),
      generateVersion: byId('generate-version'),
      modelHint: byId('model-hint'),
      generateActionInput: byId('generate-action'),
      actionButtons: byId('action-buttons'),
      refreshBalanceButton: byId('refresh-balance-button'),
      prompt: byId('prompt'),
      referenceImage: byId('reference-image'),
      referenceImageSummary: byId('reference-image-summary'),
      generateButton: byId('generate-button'),
      generateStatus: byId('generate-status'),
      resultBox: byId('result-box'),
      historyList: byId('history-list'),
      historyTotalCount: byId('history-total-count'),
      historyPagination: byId('history-pagination'),
      historyDetailModal: byId('history-detail-modal'),
      historyDetailBody: byId('history-detail-body'),
      styleConfigModal: byId('style-config-modal'),
      styleConfigClose: byId('style-config-close'),
      styleConfigCancel: byId('style-config-cancel'),
      styleConfigApply: byId('style-config-apply'),
      stylePromptInput: byId('style-prompt'),
      stylePreviewImage: byId('style-preview-image'),
      styleQuickPresets: byId('style-quick-presets'),
      orderedUploadModal: byId('ordered-upload-modal'),
      orderedUploadTitle: byId('ordered-upload-title'),
      orderedUploadDescription: byId('ordered-upload-description'),
      orderedUploadSlot1Label: byId('ordered-upload-slot-1-label'),
      orderedUploadSlot2Label: byId('ordered-upload-slot-2-label'),
      orderedUploadSlot1Input: byId('ordered-upload-slot-1'),
      orderedUploadSlot2Input: byId('ordered-upload-slot-2'),
      orderedUploadSlot1Summary: byId('ordered-upload-slot-1-summary'),
      orderedUploadSlot2Summary: byId('ordered-upload-slot-2-summary'),
      orderedUploadSlot1Preview: byId('ordered-upload-slot-1-preview'),
      orderedUploadSlot2Preview: byId('ordered-upload-slot-2-preview'),
      orderedUploadSwap: byId('ordered-upload-swap'),
      orderedUploadApply: byId('ordered-upload-apply'),
      orderedUploadClose: byId('ordered-upload-close'),
      orderedUploadCancel: byId('ordered-upload-cancel'),
      densityToggle: byId('density-toggle'),
    };
    function applyDensity(density) {
      state.density = density === 'comfortable' ? 'comfortable' : 'compact';
      document.body.classList.toggle('density-comfortable', state.density === 'comfortable');
      document.body.classList.toggle('density-compact', state.density === 'compact');
      if (elements.densityToggle) {
        for (const button of elements.densityToggle.querySelectorAll('[data-density]')) {
          button.classList.toggle('active', button.dataset.density === state.density);
        }
      }
      try {
        localStorage.setItem(DENSITY_STORAGE_KEY, state.density);
      } catch { }
    }
    function loadDensityPreference() {
      return DEFAULT_DENSITY;
    }
    function setStatus(element, message, isError = false) {
      element.textContent = message || '';
      element.classList.toggle('error', Boolean(isError));
    }
    async function requestJson(url, options) {
      const response = await fetch(url, options);
      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
      }
      return payload;
    }
    function getActionLabel(action) {
      return ACTION_LABELS[action] || ACTION_LABELS.generate;
    }
    function setSelectedAction(action) {
      const normalizedAction = ACTION_LABELS[action] ? action : DEFAULT_ACTION;
      state.selectedAction = normalizedAction;
      elements.generateActionInput.value = normalizedAction;
      for (const button of elements.actionButtons.querySelectorAll('[data-action-choice]')) {
        button.classList.toggle('active', button.dataset.actionChoice === normalizedAction);
      }
      updateReferenceInputState();
      updateReferenceImageSummary();
    }

    function updateStylePreviewImage(imageUrl = state.styleConfig.imageUrl) {
      if (!elements.stylePreviewImage) {
        return;
      }
      const normalizedImageUrl = String(imageUrl || '').trim();
      if (!normalizedImageUrl) {
        elements.stylePreviewImage.removeAttribute('src');
        return;
      }
      elements.stylePreviewImage.src = normalizedImageUrl;
    }
    function openStyleConfigModal() {
      if (!elements.styleConfigModal) {
        return;
      }
      elements.stylePromptInput.value = state.styleConfig.prompt || '';
      updateStylePreviewImage(state.styleConfig.imageUrl);
      renderStylePromptPresets();
      elements.styleConfigModal.hidden = false;
    }
    function closeStyleConfigModal() {
      if (!elements.styleConfigModal) {
        return;
      }
      elements.styleConfigModal.hidden = true;
    }
    function isOrderedUploadAction(action = state.selectedAction) {
      return action === 'tryon' || action === 'faceswap';
    }
    function getOrderedUploadConfig(action = state.selectedAction) {
      return ORDERED_UPLOAD_CONFIGS[action] || ORDERED_UPLOAD_CONFIGS.tryon;
    }
    function isImageLikeFile(file) {
      return Boolean(file && typeof file.name === 'string' && Number(file.size) > 0);
    }
    function ensureOrderedPreviewState(action) {
      if (!isOrderedUploadAction(action)) {
        return [null, null];
      }
      if (!Array.isArray(state.orderedPreviewUrls[action])) {
        state.orderedPreviewUrls[action] = [null, null];
      }
      return state.orderedPreviewUrls[action];
    }
    function revokePreviewUrl(previewUrl) {
      if (!previewUrl || typeof URL?.revokeObjectURL !== 'function') {
        return;
      }
      URL.revokeObjectURL(previewUrl);
    }
    function setOrderedUploadSlotPreview(action, slotIndex, file) {
      if (!isOrderedUploadAction(action)) {
        return;
      }
      const previewState = ensureOrderedPreviewState(action);
      revokePreviewUrl(previewState[slotIndex]);
      if (isImageLikeFile(file) && typeof URL?.createObjectURL === 'function') {
        previewState[slotIndex] = URL.createObjectURL(file);
        return;
      }
      previewState[slotIndex] = null;
    }
    function renderOrderedUploadPreview(imageElement, previewUrl, labelText) {
      if (!imageElement) {
        return;
      }
      const shell = imageElement.closest('.ordered-upload-preview-shell');
      if (previewUrl) {
        imageElement.src = previewUrl;
        imageElement.alt = `${labelText}预览`;
        imageElement.hidden = false;
        shell?.classList.add('has-image');
        return;
      }
      imageElement.removeAttribute('src');
      imageElement.hidden = true;
      shell?.classList.remove('has-image');
    }
    function cleanupOrderedUploadPreviews() {
      for (const action of Object.keys(state.orderedPreviewUrls)) {
        const previewUrls = state.orderedPreviewUrls[action] || [];
        for (const previewUrl of previewUrls) {
          revokePreviewUrl(previewUrl);
        }
        state.orderedPreviewUrls[action] = [null, null];
      }
    }
    function getOrderedReferenceImages(action = state.selectedAction) {
      if (!isOrderedUploadAction(action)) {
        return [];
      }
      const files = state.orderedReferenceImages[action] || [];
      return files.filter((file) => isImageLikeFile(file));
    }
    function updateReferenceInputState() {
      if (!elements.referenceImage) {
        return;
      }
      elements.referenceImage.disabled = isOrderedUploadAction();
    }
    function renderOrderedUploadModal(action = state.selectedAction) {
      if (!elements.orderedUploadModal || !isOrderedUploadAction(action)) {
        return;
      }
      const config = getOrderedUploadConfig(action);
      const files = state.orderedReferenceImages[action] || [null, null];
      const previewUrls = ensureOrderedPreviewState(action);
      elements.orderedUploadTitle.textContent = config.title;
      elements.orderedUploadDescription.textContent = config.description;
      elements.orderedUploadSlot1Label.textContent = config.slots[0];
      elements.orderedUploadSlot2Label.textContent = config.slots[1];
      elements.orderedUploadSlot1Summary.textContent = isImageLikeFile(files[0]) ? `已选择: ${files[0].name}` : '未选择';
      elements.orderedUploadSlot2Summary.textContent = isImageLikeFile(files[1]) ? `已选择: ${files[1].name}` : '未选择';
      renderOrderedUploadPreview(elements.orderedUploadSlot1Preview, previewUrls[0], config.slots[0]);
      renderOrderedUploadPreview(elements.orderedUploadSlot2Preview, previewUrls[1], config.slots[1]);
      elements.orderedUploadSlot1Input.value = '';
      elements.orderedUploadSlot2Input.value = '';
    }
    function openOrderedUploadModal(action = state.selectedAction) {
      if (!elements.orderedUploadModal || !isOrderedUploadAction(action)) {
        return;
      }
      renderOrderedUploadModal(action);
      elements.orderedUploadModal.hidden = false;
    }
    function closeOrderedUploadModal() {
      if (!elements.orderedUploadModal) {
        return;
      }
      elements.orderedUploadModal.hidden = true;
    }
    function setOrderedUploadSlotFile(action, slotIndex, file) {
      if (!isOrderedUploadAction(action)) {
        return;
      }
      if (!Array.isArray(state.orderedReferenceImages[action])) {
        state.orderedReferenceImages[action] = [null, null];
      }
      const normalizedFile = isImageLikeFile(file) ? file : null;
      state.orderedReferenceImages[action][slotIndex] = normalizedFile;
      setOrderedUploadSlotPreview(action, slotIndex, normalizedFile);
    }
    function handleOrderedUploadSlotChange(slotIndex, event) {
      const action = state.selectedAction;
      const file = event.target.files?.[0] || null;
      setOrderedUploadSlotFile(action, slotIndex, file);
      renderOrderedUploadModal(action);
      updateReferenceImageSummary();
    }
    function swapOrderedUploadImages() {
      const action = state.selectedAction;
      if (!isOrderedUploadAction(action)) {
        return;
      }
      const files = state.orderedReferenceImages[action] || [null, null];
      const previewUrls = ensureOrderedPreviewState(action);
      state.orderedReferenceImages[action] = [files[1] || null, files[0] || null];
      state.orderedPreviewUrls[action] = [previewUrls[1] || null, previewUrls[0] || null];
      renderOrderedUploadModal(action);
      updateReferenceImageSummary();
      setStatus(elements.generateStatus, '已交换第1张和第2张的发送顺序。');
    }
    function applyOrderedUploadConfig() {
      const action = state.selectedAction;
      const files = getOrderedReferenceImages(action);
      if (files.length < 2) {
        setStatus(elements.generateStatus, '请在弹窗中选择两张图片并确认顺序。', true);
        return;
      }
      updateReferenceImageSummary();
      closeOrderedUploadModal();
      setStatus(elements.generateStatus, '已应用顺序上传设置。');
    }
    function applyStyleConfig() {
      const prompt = String(elements.stylePromptInput.value || '').trim();
      state.styleConfig.prompt = prompt;
      renderStylePromptPresets(prompt);
      if (state.selectedAction === 'style' && !elements.prompt.value.trim() && prompt) {
        elements.prompt.value = prompt;
      }
      setStatus(elements.generateStatus, '风格设置已应用。');
      closeStyleConfigModal();
    }
    function renderStylePromptPresets(activePrompt = '') {
      if (!elements.styleQuickPresets) {
        return;
      }
      const normalizedPrompt = String(activePrompt || elements.stylePromptInput?.value || '').trim();
      elements.styleQuickPresets.innerHTML = STYLE_PROMPT_PRESETS.map((preset) => {
        const isActive = normalizedPrompt && normalizedPrompt === preset.prompt;
        const activeClass = isActive ? ' active' : '';
        return `<button class="ghost${activeClass}" type="button" data-style-prompt-preset="${preset.id}">${escapeHtml(preset.label)}</button>`;
      }).join('');
    }
    function applyStylePromptPreset(presetId) {
      const preset = STYLE_PROMPT_PRESETS.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }
      state.styleConfig.prompt = preset.prompt;
      state.styleConfig.imageUrl = preset.imgurl;
      elements.stylePromptInput.value = preset.prompt;
      elements.prompt.value = preset.prompt;
      updateStylePreviewImage(preset.imgurl);
      renderStylePromptPresets(preset.prompt);
      setStatus(elements.generateStatus, `已应用风格预设：${preset.label}`);
    }
    function getSelectedReferenceImages(action = state.selectedAction) {
      if (isOrderedUploadAction(action)) {
        return getOrderedReferenceImages(action);
      }
      return Array.from(elements.referenceImage.files || []);
    }
    function updateReferenceImageSummary() {
      if (!elements.referenceImageSummary) {
        return;
      }
      if (isOrderedUploadAction()) {
        const action = state.selectedAction;
        const config = getOrderedUploadConfig(action);
        const files = state.orderedReferenceImages[action] || [null, null];
      const previewUrls = ensureOrderedPreviewState(action);
        const slot1Name = isImageLikeFile(files[0]) ? files[0].name : '未设置';
        const slot2Name = isImageLikeFile(files[1]) ? files[1].name : '未设置';
        elements.referenceImageSummary.textContent = `${config.slots[0]}: ${slot1Name}；${config.slots[1]}: ${slot2Name}`;
        return;
      }
      const files = getSelectedReferenceImages();
      if (files.length === 0) {
        elements.referenceImageSummary.textContent = '当前未选择图片';
        return;
      }
      if (files.length === 1) {
        elements.referenceImageSummary.textContent = `已选择 1 张：${files[0].name}`;
        return;
      }
      elements.referenceImageSummary.textContent = `已选择 ${files.length} 张图片`;
    }
    function resolveSelectedModel() {
      return state.models.find((model) => model.id === state.selectedModelId)
        || state.models.find((model) => model.id === elements.generateVersion.value)
        || state.models[0]
        || null;
    }
    function renderModelOptions() {
      if (!Array.isArray(state.modelGroups) || state.modelGroups.length === 0) {
        elements.generateVersion.innerHTML = '<option value="">暂无可用模型</option>';
        elements.generateVersion.value = '';
        state.selectedModelId = '';
        return;
      }

      elements.generateVersion.innerHTML = state.modelGroups.map((group) => {
        const options = group.models.map((model) => {
          return `<option value=\"${model.id}\">${escapeHtml(model.name)}（消耗 ${escapeHtml(model.cost)}）</option>`;
        }).join('');
        return `<optgroup label="${escapeHtml(group.label || group.key)}">${options}</optgroup>`;
      }).join('');

      const hasCurrentModel = state.models.some((model) => model.id === state.selectedModelId);
      if (!hasCurrentModel) {
        state.selectedModelId = state.models[0]?.id || '';
      }
      elements.generateVersion.value = state.selectedModelId;
    }
    async function loadModels() {
      const payload = await requestJson('/api/models');
      state.modelGroups = Array.isArray(payload.groups) ? payload.groups : [];
      state.models = state.modelGroups.flatMap((group) => Array.isArray(group.models) ? group.models : []);
      state.selectedModelId = payload.defaultModelId || state.models[0]?.id || '';
      renderModelOptions();
    }
    async function refreshSelectedTokenBalance() {
      const tokenId = state.selectedTokenId || elements.generateToken.value;
      if (!tokenId) {
        setStatus(elements.generateStatus, '请选择模型。', true);
        return;
      }
      elements.refreshBalanceButton.disabled = true;
      setStatus(elements.generateStatus, '正在生成图片...');
      try {
        const payload = await requestJson(`/api/tokens/${encodeURIComponent(tokenId)}/balance`);
        await loadTokens();
        setStatus(elements.generateStatus, `余额已刷新：${payload.leftAnswersCount}`);
      } catch (error) {
        setStatus(elements.generateStatus, error.message, true);
      } finally {
        elements.refreshBalanceButton.disabled = false;
      }
    }
    function escapeHtml(value) {
      return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }
    function maskToken(token) {
      if (!token) return '';
      if (token.length <= 10) return token;
      return `${token.slice(0, 6)}...${token.slice(-4)}`;
    }
    function formatTime(value) {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString('zh-CN');
    }
    function findTokenById(tokenId) {
      return state.tokens.find((token) => token.id === tokenId) || null;
    }
    function findHistoryItemById(historyId) {
      return state.history.find((item) => String(item?.id || '') === String(historyId || '')) || null;
    }
    function getResultImageUrl(record) {
      return record?.resultImageUrl || record?.imageUrl || '';
    }
    function summarizePrompt(prompt) {
      const text = String(prompt || '').replace(/\s+/g, ' ').trim();
      if (!text) return '无提示词';
      if (text.length <= 80) return text;
      return `${text.slice(0, 80)}...`;
    }
    function setActiveTab(tabName) {
      const nextTab = tabName === 'history' ? 'history' : 'workbench';
      state.activeTab = nextTab;
      for (const button of document.querySelectorAll('[data-app-tab]')) {
        const isActive = button.dataset.appTab === nextTab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
      for (const panel of document.querySelectorAll('[data-tab-panel]')) {
        const isActive = panel.dataset.tabPanel === nextTab;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      }
    }
    function renderSelectedTokenDisplay() {
      const selectedToken = findTokenById(state.selectedTokenId);
      if (!selectedToken) {
        elements.selectedTokenDisplay.classList.add('is-empty');
        elements.selectedTokenDisplay.textContent = '请先在左侧选择令牌';
        return;
      }
      const used = Boolean(selectedToken.isUsed);
      elements.selectedTokenDisplay.classList.remove('is-empty');
      elements.selectedTokenDisplay.innerHTML = `
        <strong>${escapeHtml(selectedToken.name)}</strong>
        <span class="muted">余额：${escapeHtml(selectedToken.balance)}</span>
        <span class="badge ${used ? 'used' : 'unused'}">${used ? '已使用' : '未使用'}</span>
        <span class="muted">${escapeHtml(maskToken(selectedToken.token))}</span>
      `;
    }
    function renderPagination(container, currentPage, totalPages, dataAttributeName, totalItems, jumpTarget) {
      if (!container) return;
      if (totalItems <= 0) {
        container.innerHTML = '';
        return;
      }
      const pageButtons = getVisiblePages(currentPage, totalPages).map((page) => {
        return `<button class="ghost ${page === currentPage ? 'active' : ''}" type="button" ${dataAttributeName}="${page}">${page}</button>`;
      }).join('');
      container.innerHTML = `
        <span class="pagination-summary">共 ${totalItems} 条</span>
        <button class="ghost" type="button" ${dataAttributeName}="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
        <div class="pagination-pages">${pageButtons}</div>
        <button class="ghost" type="button" ${dataAttributeName}="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
        <div class="pagination-jump">
          <span class="pagination-summary">跳转至</span>
          <input class="pagination-jump-input" type="number" min="1" max="${totalPages}" value="${currentPage}" data-page-jump-input="${jumpTarget}" aria-label="跳转页码">
          <span class="pagination-summary">页</span>
          <button class="ghost" type="button" data-page-jump-target="${jumpTarget}">跳转</button>
        </div>
      `;
    }
    function renderTokens() {
      state.selectedTokenId = resolveSelectedTokenId(state.tokens, state.selectedTokenId, MIN_TOKEN_BALANCE);
      const generateTokens = getGenerateTokenOptions(state.tokens, state.selectedTokenId, MIN_TOKEN_BALANCE);

      for (const button of elements.tokenFilterGroup.querySelectorAll('[data-token-filter]')) {
        button.classList.toggle('active', button.dataset.tokenFilter === state.tokenFilter);
      }

      elements.tokenTotalCount.textContent = `总计：${state.tokenTotalItems}，当前页：${state.tokens.length}`;
      if (generateTokens.length === 0) {
        state.selectedTokenId = '';
        elements.generateToken.innerHTML = '<option value="">暂无可用令牌</option>';
        elements.generateToken.value = '';
        renderSelectedTokenDisplay();
      } else {
        elements.generateToken.innerHTML = generateTokens.map((token) => {
          const lowBalanceSuffix = token.isEligible === false ? '，当前选中' : '';
          return `<option value="${token.id}">${escapeHtml(token.name)}（余额 ${escapeHtml(token.balance)}${lowBalanceSuffix}）</option>`;
        }).join('');
        elements.generateToken.value = state.selectedTokenId;
        renderSelectedTokenDisplay();
      }

      if (state.tokens.length === 0) {
        elements.tokenList.innerHTML = '<p class="empty">当前筛选条件下没有令牌。</p>';
        renderPagination(elements.tokenPagination, state.tokenPage, state.tokenTotalPages, 'data-token-page', state.tokenTotalItems, 'token');
        return;
      }

      elements.tokenList.innerHTML = state.tokens.map((token) => {
        const used = Boolean(token.isUsed);
        const isSelected = token.id === state.selectedTokenId;
        return `
          <div class="token-item selectable ${isSelected ? 'selected' : ''}" data-select-token="${token.id}">
            <div class="token-meta">
              <div class="history-summary-line">
                <strong class="token-name">${escapeHtml(token.name)}</strong>
                <span class="badge ${used ? 'used' : 'unused'}">${used ? '已使用' : '未使用'}</span>
              </div>
              <div class="token-meta-grid muted">
                <span>余额：${escapeHtml(token.balance)}</span>
                <span>创建时间：${escapeHtml(formatTime(token.createdAt))}</span>
                <span>邮箱：${escapeHtml(summarizeTokenText(token.email || token.name, 24))}</span>
                <span>令牌：${escapeHtml(summarizeTokenText(maskToken(token.token), 22))}</span>
              </div>
            </div>
            <div class="token-actions">
              <button class="ghost" type="button" data-copy-token="${token.id}">复制</button>
              <button class="ghost" type="button" data-edit-token="${token.id}">编辑</button>
              <button class="danger" type="button" data-delete-token="${token.id}">删除</button>
            </div>
          </div>
        `;
      }).join('');
      renderPagination(elements.tokenPagination, state.tokenPage, state.tokenTotalPages, 'data-token-page', state.tokenTotalItems, 'token');
    }
    function renderResult() {
      if (!state.currentResult) {
        elements.resultBox.innerHTML = '<p class="empty">还没有生成图片。</p>';
        return;
      }
      const imageUrl = getResultImageUrl(state.currentResult);
      elements.resultBox.innerHTML = `
        <div class="result-card">
          <div class="thumbnail-shell result-thumbnail-shell">
            <img class="result-image" src="${escapeHtml(imageUrl)}" alt="生成结果" onload="this.parentElement.classList.add('is-loaded')" onerror="this.parentElement.classList.add('is-error')">
          </div>
          <div class="result-content">
            <div class="history-summary-line">
              <strong>${escapeHtml(state.currentResult.tokenName || '')}</strong>
              <span class="muted">${escapeHtml(formatTime(state.currentResult.createdAt))}</span>
            </div>
            <div class="result-meta">
              <span><strong>模型：</strong>${escapeHtml(state.currentResult.modelName || state.currentResult.version || '未知')}</span>
              <span><strong>操作类型：</strong>${escapeHtml(getActionLabel(state.currentResult.action || DEFAULT_ACTION))}</span>
              <span><strong>提示词：</strong>${escapeHtml(summarizePrompt(state.currentResult.prompt || ''))}</span>
              <span><strong>参考图：</strong>${escapeHtml(state.currentResult.referenceImageName || '无')}</span>
              <span><strong>图片链接：</strong><a href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer">打开图片</a></span>
            </div>
            <div class="result-actions">
              <button class="secondary" type="button" data-save-image="${encodeURIComponent(imageUrl)}">保存图片到本地</button>
            </div>
          </div>
        </div>
      `;
    }
    function renderHistory() {
      elements.historyTotalCount.textContent = `总记录：${state.historyTotalItems} 条`;
      if (state.history.length === 0) {
        elements.historyList.innerHTML = '<p class="empty">暂无历史记录。</p>';
        elements.historyPagination.innerHTML = '';
        closeHistoryDetail();
        return;
      }

      elements.historyList.innerHTML = state.history.map((item) => {
        const imageUrl = getResultImageUrl(item);
        const historyId = String(item.id || '');
        return `
          <article class="history-item">
            <div class="thumbnail-shell history-thumbnail-shell">
              <img class="history-thumbnail" src="${escapeHtml(imageUrl)}" alt="历史缩略图" onload="this.parentElement.classList.add('is-loaded')" onerror="this.parentElement.classList.add('is-error')">
            </div>
            <div class="history-content">
              <div class="history-summary-line">
                <strong>${escapeHtml(item.tokenName || '未知')}</strong>
                <span class="muted">${escapeHtml(formatTime(item.createdAt))}</span>
              </div>
              <div class="history-meta">
                <span>${escapeHtml(item.modelName || item.version || '未知')}</span>
                <span>${escapeHtml(item.referenceImageName ? `参考图：${item.referenceImageName}` : '无参考图')}</span>
                <span>${escapeHtml(summarizeHistoryPrompt(item.prompt))}</span>
              </div>
              <div class="history-actions">
                <button class="ghost" type="button" data-history-detail="${historyId}">详情</button>
                <button class="ghost" type="button" data-delete-history="${historyId}">删除</button>
                <a class="history-open-link" href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer">打开图片</a>
              </div>
            </div>
          </article>
        `;
      }).join('');

      renderPagination(elements.historyPagination, state.historyPage, state.historyTotalPages, 'data-history-page', state.historyTotalItems, 'history');
      if (!state.selectedHistoryId || !findHistoryItemById(state.selectedHistoryId)) {
        closeHistoryDetail();
      } else if (!elements.historyDetailModal.hidden) {
        renderHistoryDetail();
      }
    }
    function setSelectedToken(tokenId) {
      if (!state.tokens.some((token) => token.id === tokenId)) {
        return;
      }
      state.selectedTokenId = tokenId;
      renderTokens();
    }
    async function setTokenFilter(filter) {
      state.tokenFilter = ['all', 'unused', 'used', 'low-balance'].includes(filter) ? filter : 'all';
      state.tokenPage = 1;
      await loadTokens({ resetPage: true });
    }
    async function copyToken(tokenId) {
      const token = state.tokens.find((item) => item.id === tokenId);
      if (!token?.token) {
        setStatus(elements.tokenStatus, '没有可复制的令牌。', true);
        return;
      }
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(token.token);
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = token.token;
          tempInput.setAttribute('readonly', 'readonly');
          tempInput.style.position = 'fixed';
          tempInput.style.opacity = '0';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
        setStatus(elements.tokenStatus, `已复制令牌：${token.name}。`);
      } catch (error) {
        setStatus(elements.tokenStatus, error.message || '复制失败。', true);
      }
    }
    async function setTokenPage(page) {
      state.tokenPage = clampPage(page, state.tokenTotalPages);
      await loadTokens();
    }
    async function setTokenPageSize(size) {
      state.tokenPageSize = normalizePageSize(size);
      elements.tokenPageSize.value = String(state.tokenPageSize);
      state.tokenPage = 1;
      await loadTokens({ resetPage: true });
    }
    async function setHistoryPage(page) {
      state.historyPage = clampPage(page, state.historyTotalPages);
      await loadHistory();
    }
    async function setHistoryPageSize(size) {
      state.historyPageSize = normalizePageSize(size);
      elements.historyPageSize.value = String(state.historyPageSize);
      state.historyPage = 1;
      await loadHistory({ resetPage: true });
    }
    async function handlePageJump(target) {
      const input = document.querySelector(`[data-page-jump-input="${target}"]`);
      if (!input) {
        return;
      }
      if (target === 'token') {
        await setTokenPage(input.value);
        input.value = state.tokenPage;
        return;
      }
      if (target === 'history') {
        await setHistoryPage(input.value);
        input.value = state.historyPage;
      }
    }
    function openHistoryDetail(historyId) {
      const normalizedHistoryId = String(historyId || '').trim();
      if (!normalizedHistoryId || !findHistoryItemById(normalizedHistoryId)) {
        return;
      }
      state.selectedHistoryId = normalizedHistoryId;
      renderHistoryDetail();
      elements.historyDetailModal.hidden = false;
    }
    function closeHistoryDetail() {
      state.selectedHistoryId = '';
      elements.historyDetailModal.hidden = true;
      elements.historyDetailBody.innerHTML = '';
    }
    function renderHistoryDetail() {
      const item = findHistoryItemById(state.selectedHistoryId);
      if (!item) {
        closeHistoryDetail();
        return;
      }
      const imageUrl = getResultImageUrl(item);
      elements.historyDetailBody.innerHTML = `
        <div class="detail-grid">
          <div class="history-summary-line">
            <strong>${escapeHtml(item.tokenName || '未知')}</strong>
            <span class="muted">${escapeHtml(formatTime(item.createdAt))}</span>
          </div>
          <div class="thumbnail-shell detail-image-shell">
            <img class="result-image" src="${escapeHtml(imageUrl)}" alt="历史结果图片" onload="this.parentElement.classList.add('is-loaded')" onerror="this.parentElement.classList.add('is-error')">
          </div>
          <div class="result-meta">
            <span><strong>模型：</strong>${escapeHtml(item.modelName || item.version || '未知')}</span>
            <span><strong>操作类型：</strong>${escapeHtml(getActionLabel(item.action || DEFAULT_ACTION))}</span>
            <span><strong>参考图：</strong>${escapeHtml(item.referenceImageName || '无')}</span>
            <span><strong>图片链接：</strong><a href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer">打开图片</a></span>
          </div>
          <div>
            <div class="section-title">完整提示词</div>
            <pre class="detail-prompt">${escapeHtml(item.prompt || '无提示词')}</pre>
          </div>
          <div class="result-actions">
            <button class="secondary" type="button" data-save-image="${encodeURIComponent(imageUrl)}">保存图片到本地</button>
            <button class="ghost" type="button" data-close-history-detail>关闭</button>
          </div>
        </div>
      `;
    }
    function setTokenMaintenancePanelOpen(isOpen) {
      if (!elements.tokenMaintenancePanel) return;
      elements.tokenMaintenancePanel.open = Boolean(isOpen);
    }
    function resetTokenForm() {
      elements.tokenEditId.value = '';
      elements.tokenForm.reset();
      elements.tokenBalance.value = '65';
      elements.tokenSubmitButton.textContent = '新增令牌';
      elements.tokenCancelButton.hidden = true;
      setTokenMaintenancePanelOpen(false);
    }
    function editToken(tokenId) {
      const token = state.tokens.find((item) => item.id === tokenId);
      if (!token) return;
      elements.tokenEditId.value = token.id;
      elements.tokenEmail.value = token.email || token.name || '';
      elements.tokenPassword.value = token.password || '';
      elements.tokenValue.value = token.token || '';
      elements.tokenBalance.value = String(token.balance ?? 65);
      elements.tokenSubmitButton.textContent = '更新令牌';
      elements.tokenCancelButton.hidden = false;
      setTokenMaintenancePanelOpen(shouldOpenTokenMaintenancePanel(token.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    async function loadTokens(options = {}) {
      if (options.resetPage) {
        state.tokenPage = 1;
      }
      if (options.page) {
        state.tokenPage = Number(options.page) || state.tokenPage;
      }
      const query = new URLSearchParams({
        page: String(state.tokenPage),
        pageSize: String(state.tokenPageSize),
        filter: state.tokenFilter,
      });
      const payload = await requestJson(`/api/tokens?${query.toString()}`);
      state.tokens = Array.isArray(payload.items) ? payload.items : [];
      state.tokenPage = clampPage(payload.page, payload.totalPages || 1);
      state.tokenTotalItems = Number(payload.totalItems) || 0;
      state.tokenTotalPages = Math.max(1, Number(payload.totalPages) || 1);
      renderTokens();
    }
    async function loadHistory(options = {}) {
      if (options.resetPage) {
        state.historyPage = 1;
      }
      if (options.page) {
        state.historyPage = Number(options.page) || state.historyPage;
      }
      const query = new URLSearchParams({
        page: String(state.historyPage),
        pageSize: String(state.historyPageSize),
      });
      const payload = await requestJson(`/api/history?${query.toString()}`);
      state.history = Array.isArray(payload.items) ? payload.items : [];
      state.historyPage = clampPage(payload.page, payload.totalPages || 1);
      state.historyTotalItems = Number(payload.totalItems) || 0;
      state.historyTotalPages = Math.max(1, Number(payload.totalPages) || 1);
      if (options.syncCurrentResult || !state.currentResult) {
        state.currentResult = state.history[0] || null;
      }
      renderResult();
      renderHistory();
    }
    async function addOrUpdateToken(event) {
      event.preventDefault();
      const editingId = elements.tokenEditId.value.trim();
      setStatus(elements.tokenStatus, editingId ? '正在更新令牌...' : '正在新增令牌...');
      try {
        await requestJson(editingId ? `/api/tokens/${encodeURIComponent(editingId)}` : '/api/tokens', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: elements.tokenEmail.value.trim(),
            password: elements.tokenPassword.value.trim(),
            token: elements.tokenValue.value.trim(),
            balance: Number(elements.tokenBalance.value || 65),
          }),
        });
        resetTokenForm();
        await loadTokens();
        setStatus(elements.tokenStatus, editingId ? '令牌更新成功。' : '令牌新增成功。');
      } catch (error) {
        setStatus(elements.tokenStatus, error.message, true);
      }
    }
    async function importTokens() {
      const file = elements.tokenImportFile.files[0];
      if (!file) {
        setStatus(elements.tokenStatus, '请先选择 CSV 文件。', true);
        return;
      }
      setStatus(elements.tokenStatus, '正在导入 CSV...');
      elements.tokenImportButton.disabled = true;
      try {
        const formData = new FormData();
        formData.set('file', file);
        const payload = await requestJson('/api/tokens/import', {
          method: 'POST',
          body: formData,
        });
        elements.tokenImportFile.value = '';
        await loadTokens();
        setStatus(elements.tokenStatus, `导入完成：新增 ${payload.importedCount} 个令牌。`);
      } catch (error) {
        setStatus(elements.tokenStatus, error.message, true);
      } finally {
        elements.tokenImportButton.disabled = false;
      }
    }
    async function deleteToken(tokenId) {
      setStatus(elements.tokenStatus, '正在删除令牌...');
      try {
        await requestJson(`/api/tokens/${encodeURIComponent(tokenId)}`, {
          method: 'DELETE',
        });
        await loadTokens();
        if (elements.tokenEditId.value === tokenId) {
          resetTokenForm();
        }
        setStatus(elements.tokenStatus, '令牌已删除。');
      } catch (error) {
        setStatus(elements.tokenStatus, error.message, true);
      }
    }
    async function deleteHistoryRecord(historyKey) {
      const normalizedHistoryKey = String(historyKey || '').trim();
      if (!normalizedHistoryKey) {
        setStatus(elements.generateStatus, '无效的历史记录。', true);
        return;
      }
      if (!window.confirm('确定删除这条历史记录吗？')) {
        return;
      }
      if (!window.confirm('删除后无法恢复，是否继续？')) {
        return;
      }
      setStatus(elements.generateStatus, '正在删除历史记录...');
      try {
        await requestJson(`/api/history/${encodeURIComponent(normalizedHistoryKey)}`, {
          method: 'DELETE',
        });
        closeHistoryDetail();
        await loadHistory({ syncCurrentResult: true });
        setStatus(elements.generateStatus, '历史记录已删除。');
      } catch (error) {
        setStatus(elements.generateStatus, error.message || '删除历史记录失败。', true);
      }
    }
    async function generateImage(event) {
      event.preventDefault();
      const tokenId = state.selectedTokenId || elements.generateToken.value;
      let prompt = elements.prompt.value.trim();
      const model = resolveSelectedModel();
      const action = state.selectedAction || DEFAULT_ACTION;
      const selectedImages = getSelectedReferenceImages(action);
      const styleImageUrl = String(state.styleConfig.imageUrl || '').trim();
      if (action === 'style' && !prompt) {
        const modalPrompt = String(elements.stylePromptInput?.value || '').trim();
        if (modalPrompt) {
          prompt = modalPrompt;
          elements.prompt.value = modalPrompt;
        }
      }

      if (!tokenId) {
        setStatus(elements.generateStatus, '请选择令牌。', true);
        return;
      }
      if (!model) {
        setStatus(elements.generateStatus, '请选择模型。', true);
        return;
      }
      if ((action === 'tryon' || action === 'faceswap') && selectedImages.length < 2) {
        setStatus(elements.generateStatus, '试衣/换脸需要按顺序上传两张图片。', true);
        openOrderedUploadModal(action);
        return;
      }
      if (action === 'style' && selectedImages.length < 1) {
        setStatus(elements.generateStatus, '风格转换至少需要 1 张参考图。', true);
        return;
      }
      const requiresPrompt = action === 'style' || (action === 'generate' && selectedImages.length < 2);
      if (requiresPrompt && !prompt) {
        setStatus(elements.generateStatus, '该操作需要填写提示词。', true);
        return;
      }

      const formData = new FormData();
      formData.set('tokenId', tokenId);
      formData.set('prompt', prompt);
      formData.set('modelId', model.id);
      formData.set('action', action);
      formData.set('styleImageUrl', styleImageUrl);
      if (isOrderedUploadAction(action)) {
        const orderedImages = state.orderedReferenceImages[action] || [];
        if (isImageLikeFile(orderedImages[0])) {
          formData.set('orderedReferenceImage1', orderedImages[0]);
        }
        if (isImageLikeFile(orderedImages[1])) {
          formData.set('orderedReferenceImage2', orderedImages[1]);
        }
      } else {
        for (const imageFile of selectedImages) {
          formData.append('referenceImages', imageFile);
        }
      }

      elements.generateButton.disabled = true;
      setStatus(elements.generateStatus, '正在生成图片...');
      try {
        const payload = await requestJson('/api/generate', {
          method: 'POST',
          body: formData,
        });
        state.currentResult = payload.historyRecord;
        await Promise.all([loadTokens(), loadHistory({ resetPage: true, syncCurrentResult: true })]);
        renderResult();
        setStatus(elements.generateStatus, '生成成功。');
      } catch (error) {
        setStatus(elements.generateStatus, error.message, true);
      } finally {
        elements.generateButton.disabled = false;
      }
    }
    async function saveImage(encodedImageUrl) {
      setStatus(elements.generateStatus, '正在保存图片到本地...');
      try {
        const payload = await requestJson(`/api/save-image?url=${encodedImageUrl}`);
        setStatus(elements.generateStatus, `图片已保存到：${payload.path}`);
      } catch (error) {
        setStatus(elements.generateStatus, error.message, true);
      }
    }
    function bindDomEvents() {
      document.addEventListener('click', async (event) => {
        const appTabButton = event.target.closest('[data-app-tab]');
        if (appTabButton) {
          setActiveTab(appTabButton.dataset.appTab);
          return;
        }
        const deleteButton = event.target.closest('[data-delete-token]');
        if (deleteButton) {
          await deleteToken(deleteButton.dataset.deleteToken);
          return;
        }
        const editButton = event.target.closest('[data-edit-token]');
        if (editButton) {
          editToken(editButton.dataset.editToken);
          return;
        }
        const copyButton = event.target.closest('[data-copy-token]');
        if (copyButton) {
          await copyToken(copyButton.dataset.copyToken);
          return;
        }
        const selectTokenButton = event.target.closest('[data-select-token]');
        if (selectTokenButton) {
          setSelectedToken(selectTokenButton.dataset.selectToken);
          return;
        }
        const filterButton = event.target.closest('[data-token-filter]');
        if (filterButton) {
          await setTokenFilter(filterButton.dataset.tokenFilter);
          return;
        }
        const saveButton = event.target.closest('[data-save-image]');
        if (saveButton) {
          await saveImage(saveButton.dataset.saveImage);
          return;
        }
        const refreshBalanceButton = event.target.closest('#refresh-balance-button');
        if (refreshBalanceButton) {
          await refreshSelectedTokenBalance();
          return;
        }
        const actionChoice = event.target.closest('[data-action-choice]');
        if (actionChoice) {
          const selectedChoice = actionChoice.dataset.actionChoice;
          const nextAction = state.selectedAction === selectedChoice ? DEFAULT_ACTION : selectedChoice;
          setSelectedAction(nextAction);
          if (nextAction === 'style') {
            openStyleConfigModal();
          }
          if (nextAction === 'tryon' || nextAction === 'faceswap') {
            openOrderedUploadModal(nextAction);
          }
          return;
        }
        const stylePromptPresetChoice = event.target.closest('[data-style-prompt-preset]');
        if (stylePromptPresetChoice) {
          applyStylePromptPreset(stylePromptPresetChoice.dataset.stylePromptPreset);
          return;
        }
        const pageButton = event.target.closest('[data-history-page]');
        if (pageButton) {
          await setHistoryPage(pageButton.dataset.historyPage);
          return;
        }
        const tokenPageButton = event.target.closest('[data-token-page]');
        if (tokenPageButton) {
          await setTokenPage(tokenPageButton.dataset.tokenPage);
          return;
        }
        const pageJumpButton = event.target.closest('[data-page-jump-target]');
        if (pageJumpButton) {
          await handlePageJump(pageJumpButton.dataset.pageJumpTarget);
          return;
        }
        const historyDetailButton = event.target.closest('[data-history-detail]');
        if (historyDetailButton) {
          openHistoryDetail(historyDetailButton.dataset.historyDetail);
          return;
        }
        const deleteHistoryButton = event.target.closest('[data-delete-history]');
        if (deleteHistoryButton) {
          await deleteHistoryRecord(deleteHistoryButton.dataset.deleteHistory);
          return;
        }
        const closeHistoryDetailButton = event.target.closest('[data-close-history-detail]');
        if (closeHistoryDetailButton) {
          closeHistoryDetail();
          return;
        }
        const densityButton = event.target.closest('[data-density]');
        if (densityButton) {
          applyDensity(densityButton.dataset.density);
        }
      });
      elements.historyDetailModal.addEventListener('click', (event) => {
        if (event.target === elements.historyDetailModal) {
          closeHistoryDetail();
        }
      });
      elements.styleConfigModal.addEventListener('click', (event) => {
        if (event.target === elements.styleConfigModal) {
          closeStyleConfigModal();
        }
      });
      elements.orderedUploadModal.addEventListener('click', (event) => {
        if (event.target === elements.orderedUploadModal) {
          closeOrderedUploadModal();
        }
      });
      document.addEventListener('keydown', (event) => {
        const jumpInput = event.target.closest('[data-page-jump-input]');
        if (jumpInput && event.key === 'Enter') {
          event.preventDefault();
          void handlePageJump(jumpInput.dataset.pageJumpInput);
          return;
        }
        if (event.key === 'Escape') {
          if (!elements.historyDetailModal.hidden) {
            closeHistoryDetail();
          }
          if (elements.styleConfigModal && !elements.styleConfigModal.hidden) {
            closeStyleConfigModal();
          }
          if (elements.orderedUploadModal && !elements.orderedUploadModal.hidden) {
            closeOrderedUploadModal();
          }
        }
      });
      elements.tokenForm.addEventListener('submit', addOrUpdateToken);
      elements.generateForm.addEventListener('submit', generateImage);
      elements.tokenImportButton.addEventListener('click', importTokens);
      elements.tokenCancelButton.addEventListener('click', resetTokenForm);
      elements.generateToken.addEventListener('change', (event) => {
        state.selectedTokenId = event.target.value || '';
        renderSelectedTokenDisplay();
        renderTokens();
      });
      elements.generateVersion.addEventListener('change', (event) => {
        state.selectedModelId = event.target.value || '';
      });
      elements.referenceImage.addEventListener('change', () => {
        updateReferenceImageSummary();
      });
      elements.orderedUploadSlot1Input.addEventListener('change', (event) => {
        handleOrderedUploadSlotChange(0, event);
      });
      elements.orderedUploadSlot2Input.addEventListener('change', (event) => {
        handleOrderedUploadSlotChange(1, event);
      });
      elements.stylePromptInput.addEventListener('input', () => {
        renderStylePromptPresets(elements.stylePromptInput.value);
      });
      elements.styleConfigApply.addEventListener('click', applyStyleConfig);
      elements.styleConfigClose.addEventListener('click', closeStyleConfigModal);
      elements.styleConfigCancel.addEventListener('click', closeStyleConfigModal);
      elements.orderedUploadSwap.addEventListener('click', swapOrderedUploadImages);
      elements.orderedUploadApply.addEventListener('click', applyOrderedUploadConfig);
      elements.orderedUploadClose.addEventListener('click', closeOrderedUploadModal);
      elements.orderedUploadCancel.addEventListener('click', closeOrderedUploadModal);
      elements.tokenPageSize.value = String(state.tokenPageSize);
      elements.tokenPageSize.addEventListener('change', (event) => {
        setTokenPageSize(event.target.value);
      });
      window.addEventListener('beforeunload', cleanupOrderedUploadPreviews);
    }
    function initializeApp() {
      applyDensity(loadDensityPreference());
      resetTokenForm();
      setSelectedAction(DEFAULT_ACTION);
      updateReferenceInputState();
      updateReferenceImageSummary();
      updateStylePreviewImage(state.styleConfig.imageUrl);
      renderStylePromptPresets();
      Promise.all([loadModels(), loadTokens(), loadHistory()]).catch((error) => {
        setStatus(elements.generateStatus, error.message, true);
      });
    }

    bindDomEvents();
    initializeApp();















