const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { handleInternalApiRoutes } = require('./server-routes/internal-api');
const { handleCompatApiRoutes } = require('./server-routes/compat-api');
const { createLogger } = require('./logger');

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const DEFAULT_TOKEN_CSV_HEADERS = ['id', 'email', 'password', 'jwtToken', 'balance', 'createdAt', 'isAgreeShareImages'];
const DEFAULT_BALANCE = 65;

const CHATAIBOT_API_BASE = 'https://chataibot.pro/api';
const GENERATE_URL = `${CHATAIBOT_API_BASE}/image/generate`;
const RECOGNIZE_URL = `${CHATAIBOT_API_BASE}/file/recognize`;
const MERGE_URL = `${CHATAIBOT_API_BASE}/file/merge`;
const ANSWERS_COUNT_URL = `${CHATAIBOT_API_BASE}/user/answers-count/v2`;
const MESSAGE_CONTEXT_URL = `${CHATAIBOT_API_BASE}/message/context`;
const MESSAGE_URL = `${CHATAIBOT_API_BASE}/message`;
const USER_UPDATE_URL = `${CHATAIBOT_API_BASE}/user/update`;

const COMPAT_API_KEY = 'sk-nTaKktSNUXykSZNCvqkfJ1ty3JYqgypq1NfdjZPH2XIpRweg';
const DEFAULT_COMPAT_MODEL = 'gpt-4.1-mini';
const DEFAULT_COMPAT_IMAGE_MODEL = 'google-nano-banana';
const COMPAT_CHAT_MODELS = {
  'gpt-4.1-mini': { upstreamModels: ['gpt-4.1-mini', 'gpt-3.5-turbo-0125'], cost: 2 },
  'gpt-4o-mini': { upstreamModels: ['gpt-4o-mini', 'gpt-3.5-turbo-0125'], cost: 2 },
  'claude-3-5-sonnet-latest': { upstreamModels: ['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307', 'gpt-3.5-turbo-0125'], cost: 2 },
};

const COMPAT_IMAGE_FALLBACK_MODEL_IDS = [
  'google-nano-banana',
  // 'google-nano-banana-pro',
  'qwen-lora',
];

const COMPAT_IMAGE_ACTION_COSTS = {
  tryon: 30,
  faceswap: 10,
};

const IMAGE_MODELS = [
  {
    id: 'gpt-image-1-high',
    name: 'gpt image 1 high',
    group: 'OPENAI',
    provider: 'GPT_IMAGE_HIGH',
    version: '',
    editMode: 'edit_gpt_high',
    mergeMode: 'merge_gpt_high',
    cost: 50,
  },
  {
    id: 'gpt-image-1',
    name: 'gpt image 1',
    group: 'OPENAI',
    provider: 'GPT_IMAGE',
    version: '',
    editMode: 'edit_gpt',
    mergeMode: 'merge_gpt',
    cost: 15,
  },
  {
    id: 'gpt-image-1-5',
    name: 'gpt image 1.5',
    group: 'OPENAI',
    provider: 'GPT_IMAGE_1_5',
    version: '',
    editMode: 'edit_gpt_1_5',
    mergeMode: 'merge_gpt_1_5',
    cost: 12,
  },
  {
    id: 'gpt-image-1-5-high',
    name: 'gpt image 1.5 high',
    group: 'OPENAI',
    provider: 'GPT_IMAGE_1_5_HIGH',
    version: '',
    editMode: 'edit_gpt_1_5_high',
    mergeMode: 'merge_gpt_1_5_high',
    cost: 40,
  },
  // {
  //   id: 'google-nano-banana-pro',
  //   name: 'google nano banana-pro',
  //   group: 'GOOGLE',
  //   provider: 'GOOGLE',
  //   version: 'nano-banana-pro',
  //   editMode: 'edit_google_nano_banana_pro',
  //   mergeMode: 'merge_google_nano_banana_pro',
  //   cost: 60,
  // },
  {
    id: 'google-nano-banana',
    name: 'google nano banana',
    group: 'GOOGLE',
    provider: 'GOOGLE',
    version: 'nano-banana',
    editMode: 'edit_google_nano_banana',
    mergeMode: 'merge_google_nano_banana',
    cost: 15,
  },
  {
    id: 'google-nano-banana-2',
    name: 'google nano banana-2',
    group: 'GOOGLE',
    provider: 'GOOGLE',
    version: 'nano-banana-2',
    editMode: 'edit_google_nano_banana_2',
    mergeMode: 'merge_google_nano_banana_2',
    cost: 30,
  },
  {
    id: 'qwen-lora',
    name: 'qwen lora',
    group: 'QWEN',
    provider: 'QWEN',
    version: 'lora',
    editMode: 'edit_qwen_lora',
    mergeMode: 'merge_qwen_lora',
    cost: 2,
  },
  {
    id: 'bytedance-seedream-4',
    name: 'bytedance seedream-4',
    group: 'BYTEDANCE',
    provider: 'BYTEDANCE',
    version: 'seedream-4',
    editMode: '',
    mergeMode: '',
    cost: 12,
  },
  {
    id: 'bytedance-seedream-5-lite',
    name: 'bytedance seedream-5-lite',
    group: 'BYTEDANCE',
    provider: 'BYTEDANCE',
    version: 'seedream-5-lite',
    editMode: '',
    mergeMode: '',
    cost: 14,
  },
  {
    id: 'flux-schnell',
    name: 'Flux schnell',
    group: 'FLUX',
    provider: 'FLUX',
    version: 'schnell',
    editMode: '',
    mergeMode: '',
    cost: 2,
  },
  {
    id: 'flux-pro',
    name: 'Flux 1.1pro',
    group: 'FLUX',
    provider: 'FLUX',
    version: 'pro',
    editMode: '',
    mergeMode: '',
    cost: 10,
  },
  {
    id: 'flux-ultra',
    name: 'Flux ultra',
    group: 'FLUX',
    provider: 'FLUX',
    version: 'ultra',
    editMode: '',
    mergeMode: '',
    cost: 12,
  },
  {
    id: 'flux-kontext-max',
    name: 'flux kontext max',
    group: 'FLUX',
    provider: 'FLUX',
    version: 'kontext-max',
    editMode: 'edit_flux_kontext_max',
    mergeMode: '',
    cost: 30,
  },
  {
    id: 'ideogram-3-turbo',
    name: 'Ideogram 3 Turbo',
    group: 'IDEOGRAM',
    provider: 'IDEOGRAM_TURBO',
    version: '',
    editMode: '',
    mergeMode: '',
    cost: 4,
  },
  {
    id: 'ideogram-3',
    name: 'Ideogram 3',
    group: 'IDEOGRAM',
    provider: 'IDEOGRAM',
    version: '',
    editMode: '',
    mergeMode: '',
    cost: 8,
  },
  {
    id: 'midjourney-6-1',
    name: 'Midjourney 6.1',
    group: 'MIDJOURNEY',
    provider: 'MIDJOURNEY',
    version: '6.1',
    editMode: '',
    mergeMode: '',
    cost: 20,
  },
  {
    id: 'midjourney-7',
    name: 'Midjourney 7',
    group: 'MIDJOURNEY',
    provider: 'MIDJOURNEY',
    version: '7',
    editMode: '',
    mergeMode: '',
    cost: 20,
  },
  {
    id: 'recraft-v3',
    name: 'Recraft v3',
    group: 'RECRAFT',
    provider: 'RECRAFT',
    version: 'v3',
    editMode: '',
    mergeMode: '',
    cost: 20,
  },
  {
    id: 'grok-xai',
    name: 'Grok xAI',
    group: 'GROK',
    provider: 'GROK',
    version: 'seedream-5-lite',
    editMode: '',
    mergeMode: '',
    cost: 14,
  },
];

const DEFAULT_MODEL_ID = 'google-nano-banana';
const MODELS_BY_ID = new Map(IMAGE_MODELS.map((model) => [model.id, model]));
const MODELS_BY_VERSION = new Map(
  IMAGE_MODELS
    .filter((model) => model.version)
    .map((model) => [model.version, model]),
);

const MERGE_ACTION_CONFIGS = {
  faceswap: {
    type: 'faceswap',
    cost: 10,
  },
  tryon: {
    type: 'fashion',
    cost: 30,
  },
};

function createApp(options = {}) {
  const tokensFile = options.tokensFile || path.join(DEFAULT_DATA_DIR, 'jwt_tokens.csv');
  const historyFile = options.historyFile || path.join(DEFAULT_DATA_DIR, 'history.json');
  const savedDir = options.savedDir || path.join(DEFAULT_DATA_DIR, 'saved');
  const uploadsDir = options.uploadsDir || path.join(DEFAULT_DATA_DIR, 'uploads');
  const publicDir = options.publicDir || path.join(__dirname, 'public');
  const fetchImpl = options.fetchImpl || fetch;
  const logsDir = options.logsDir || path.join(__dirname, 'logs');
  const logger = options.logger || createLogger({ logsDir, console });
  const logAsJsonLine = false;

  return http.createServer(async (request, response) => {
    const traceId = resolveTraceId(request.headers['x-trace-id']);
    response.setHeader('x-trace-id', traceId);

    try {
      const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);

      await ensureTokenCsvFile(tokensFile);
      await ensureJsonFile(historyFile);
      await fs.mkdir(savedDir, { recursive: true });
      await fs.mkdir(uploadsDir, { recursive: true });

      const isRoute = (method, pathname) => request.method === method && url.pathname === pathname;
      const isRouteStartsWith = (method, prefix) => request.method === method && url.pathname.startsWith(prefix);
      const isRouteEndsWith = (method, suffix) => request.method === method && url.pathname.endsWith(suffix);

      // Static page and public assets
      if (isRoute('GET', '/')) {
        return sendFile(response, path.join(publicDir, 'index.html'), 'text/html; charset=utf-8');
      }

      if (request.method === 'GET') {
        const publicAssetPath = resolvePublicAssetPath(publicDir, url.pathname);
        if (publicAssetPath) {
          return sendFile(response, publicAssetPath.filePath, publicAssetPath.contentType);
        }
      }

      const routeContext = {
        request,
        response,
        url,
        traceId,
        isRoute,
        isRouteStartsWith,
        isRouteEndsWith,
        tokensFile,
        historyFile,
        savedDir,
        uploadsDir,
        fetchImpl,
        logger,
        logAsJsonLine,
        DEFAULT_MODEL_ID,
        ANSWERS_COUNT_URL,
        DEFAULT_COMPAT_MODEL,
        DEFAULT_COMPAT_IMAGE_MODEL,
        MODELS_BY_ID,
        sendJson,
        getModelGroupsForApi,
        readTokenRecords,
        mapTokenRecordForApi,
        readJsonArray,
        writeJsonArray,
        logInfo,
        logWarn,
        buildAuthHeaders,
        readUpstreamPayload,
        summarizeUpstreamPayload,
        writeTokenRecords,
        readJsonBody,
        normalizeBalance,
        readFormData,
        parseImportedTokenCsv,
        contentTypeToExtension,
        normalizeAction,
        resolveModel,
        collectReferenceImages,
        resolveOperation,
        sanitizeFilename,
        resolveUpstreamUrl,
        buildGenerateUpstreamRequestPayload,
        summarizePayloadForLog,
        dispatchUpstreamRequest,
        logUpstreamRequest,
        logUpstreamResponse,
        logUpstreamError,
        logError,
        serializeError,
        pickImageUrl,
        verifyCompatApiKey,
        getCompatModelList,
        resolveCompatChatModel,
        buildCompatPrompt,
        acquireCompatToken,
        runCompatChatRequest,
        sendOpenAiCompatStream,
        normalizeCompatImageAction,
        getCompatImageActionCost,
        runCompatImageGeneration,
        runCompatImageActionRequest,
        sendAnthropicCompatStream,
        extractAnthropicSystemPrompt,
      };

      await handleInternalApiRoutes(routeContext);
      if (response.writableEnded) {
        return;
      }

      await handleCompatApiRoutes(routeContext);
      if (response.writableEnded) {
        return;
      }

      response.statusCode = 404;
      response.end('Not Found');
    } catch (error) {
      logError(logger, {
        event: 'request.error',
        method: request.method,
        path: request.url,
        traceId,
        error: serializeError(error),
        timestamp: new Date().toISOString(),
      }, logAsJsonLine);
      sendJson(response, 500, { error: error.message });
    }
  });
}

function getModelGroupsForApi() {
  const groups = new Map();
  for (const model of IMAGE_MODELS) {
    if (!groups.has(model.group)) {
      groups.set(model.group, {
        key: model.group,
        label: model.group,
        models: [],
      });
    }

    groups.get(model.group).models.push({
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version,
      editMode: model.editMode,
      mergeMode: model.mergeMode,
      cost: model.cost,
    });
  }
  return Array.from(groups.values());
}

function resolveModel(modelIdInput, versionInput) {
  const modelId = String(modelIdInput || '').trim();
  if (modelId && MODELS_BY_ID.has(modelId)) {
    return MODELS_BY_ID.get(modelId);
  }

  const version = String(versionInput || '').trim();
  if (version && MODELS_BY_VERSION.has(version)) {
    return MODELS_BY_VERSION.get(version);
  }

  return MODELS_BY_ID.get(DEFAULT_MODEL_ID);
}

function normalizeAction(actionInput) {
  const action = String(actionInput || 'generate').trim().toLowerCase();
  if (action === 'tryon' || action === 'faceswap' || action === 'style' || action === 'generate') {
    return action;
  }
  return 'generate';
}

function collectReferenceImages(formData, actionInput = 'generate') {
  const action = normalizeAction(actionInput);
  if (action === 'tryon' || action === 'faceswap') {
    const orderedImages = collectOrderedReferenceImages(formData);
    if (orderedImages.length > 0) {
      return orderedImages;
    }
  }

  const images = [];
  for (const file of formData.getAll('referenceImages')) {
    if (isImageFile(file)) {
      images.push(file);
    }
  }

  const singleImage = formData.get('referenceImage');
  if (images.length === 0 && isImageFile(singleImage)) {
    images.push(singleImage);
  }

  return images;
}

function collectOrderedReferenceImages(formData) {
  const orderedImages = [];
  const orderedFieldNames = ['orderedReferenceImage1', 'orderedReferenceImage2'];
  for (const fieldName of orderedFieldNames) {
    const file = formData.get(fieldName);
    if (isImageFile(file)) {
      orderedImages.push(file);
    }
  }
  return orderedImages;
}

function isImageFile(value) {
  return Boolean(value && typeof value.name === 'string' && value.size > 0);
}

function resolveOperation({ action, model, imageCount }) {
  const mergeAction = MERGE_ACTION_CONFIGS[action];
  if (mergeAction) {
    if (imageCount < 2) {
      throw new Error(`${action} requires at least 2 images`);
    }

    return {
      endpoint: 'merge',
      type: mergeAction.type,
      cost: mergeAction.cost,
    };
  }

  if (action === 'style') {
    if (imageCount < 1) {
      throw new Error('style requires at least 1 image');
    }
    if (!model.editMode) {
      throw new Error(`model ${model.id} does not support style editing`);
    }

    return {
      endpoint: 'recognize',
      mode: model.editMode,
      cost: model.cost,
    };
  }

  if (imageCount >= 2) {
    if (!model.mergeMode) {
      throw new Error(`model ${model.id} does not support merge mode`);
    }

    return {
      endpoint: 'merge',
      type: model.mergeMode,
      cost: model.cost,
    };
  }

  if (imageCount >= 1) {
    if (!model.editMode) {
      throw new Error(`model ${model.id} does not support edit mode`);
    }

    return {
      endpoint: 'recognize',
      mode: model.editMode,
      cost: model.cost,
    };
  }

  return {
    endpoint: 'generate',
    generationType: model.provider,
    version: model.version,
    cost: model.cost,
  };
}

async function dispatchUpstreamRequest({ fetchImpl, token, model, operation, prompt, referenceImages }) {
  if (operation.endpoint === 'generate') {
    const payload = {
      text: prompt,
      from: 1,
      generationType: operation.generationType,
      isInternational: true,
    };

    if (operation.version) {
      payload.version = operation.version;
    }

    return fetchImpl(GENERATE_URL, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  const upstreamForm = new FormData();
  upstreamForm.set('lang', 'en');
  upstreamForm.set('from', '1');
  upstreamForm.set('isInternational', 'true');

  for (const image of referenceImages) {
    upstreamForm.append('images', image, image.name);
  }

  if (operation.endpoint === 'recognize') {
    upstreamForm.set('mode', operation.mode);
    upstreamForm.set('chatContextId', '-2');
    if (prompt) {
      upstreamForm.set('caption', prompt);
    }

    return fetchImpl(RECOGNIZE_URL, {
      method: 'POST',
      headers: buildAuthHeaders(token),
      body: upstreamForm,
    });
  }

  upstreamForm.set('type', operation.type);
  return fetchImpl(MERGE_URL, {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: upstreamForm,
  });
}

function resolveUpstreamUrl(operation) {
  if (operation.endpoint === 'generate') {
    return GENERATE_URL;
  }
  if (operation.endpoint === 'recognize') {
    return RECOGNIZE_URL;
  }
  return MERGE_URL;
}

function buildGenerateUpstreamRequestPayload({ action, model, operation, prompt, referenceImages }) {
  const base = {
    action,
    modelId: model.id,
    modelName: model.name,
    provider: model.provider,
    endpointType: operation.endpoint,
    prompt,
    referenceImageCount: referenceImages.length,
    referenceImageNames: referenceImages.map((file) => file.name),
  };

  if (operation.endpoint === 'generate') {
    return {
      ...base,
      generationType: operation.generationType,
      version: operation.version || '',
      text: prompt,
      from: 1,
      isInternational: true,
    };
  }

  if (operation.endpoint === 'recognize') {
    return {
      ...base,
      mode: operation.mode,
      chatContextId: -2,
      caption: prompt || '',
      lang: 'en',
      from: 1,
      isInternational: true,
    };
  }

  return {
    ...base,
    type: operation.type,
    lang: 'en',
    from: 1,
    isInternational: true,
  };
}

function summarizeUpstreamPayload(payload) {
  const summary = {
    imageUrl: pickImageUrl(payload),
    payload: summarizePayloadForLog(payload),
  };

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload.traceId) {
      summary.traceId = payload.traceId;
    } else if (payload.requestId) {
      summary.requestId = payload.requestId;
    }
    if (payload.leftAnswersCount !== undefined) {
      summary.leftAnswersCount = Number(payload.leftAnswersCount);
    }
    if (payload.error) {
      summary.error = String(payload.error);
    }
  }

  return summary;
}

function summarizePayloadForLog(value, depth = 0) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > 240 ? `${value.slice(0, 240)}...` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof File) {
    return {
      name: value.name,
      type: value.type,
      size: value.size,
    };
  }

  if (Array.isArray(value)) {
    const maxArrayLength = 8;
    const nextItems = value.slice(0, maxArrayLength).map((item) => summarizePayloadForLog(item, depth + 1));
    if (value.length > maxArrayLength) {
      nextItems.push(`... (${value.length - maxArrayLength} more items)`);
    }
    return nextItems;
  }

  if (typeof value === 'object') {
    if (depth >= 3) {
      return '[max-depth-reached]';
    }

    const entries = Object.entries(value).slice(0, 20);
    const normalized = {};
    for (const [key, nestedValue] of entries) {
      normalized[key] = summarizePayloadForLog(nestedValue, depth + 1);
    }
    const totalKeys = Object.keys(value).length;
    if (totalKeys > entries.length) {
      normalized.__truncatedKeys = totalKeys - entries.length;
    }
    return normalized;
  }

  return String(value);
}

function serializeError(error) {
  if (!error) {
    return { message: 'unknown error' };
  }

  return {
    message: error.message || String(error),
    name: error.name || 'Error',
    stack: error.stack || '',
  };
}

function resolveTraceId(headerValue) {
  if (Array.isArray(headerValue)) {
    const first = String(headerValue[0] || '').trim();
    return first || randomUUID();
  }
  const normalized = String(headerValue || '').trim();
  return normalized || randomUUID();
}

function logInfo(logger, entry) {
  if (!logger || typeof logger.info !== 'function') {
    return;
  }
  logger.info(entry);
}

function logWarn(logger, entry) {
  if (logger && typeof logger.warn === 'function') {
    logger.warn(entry);
    return;
  }
  logInfo(logger, { ...entry, level: 'WARN' });
}

function logError(logger, entry) {
  if (!logger || typeof logger.error !== 'function') {
    return;
  }
  logger.error(entry);
}

function logUpstreamRequest(logger, entry) {
  logInfo(logger, {
    ...entry,
    event: 'upstream.request',
    timestamp: entry.timestamp || new Date().toISOString(),
  });
}

function logUpstreamResponse(logger, entry) {
  const writer = entry && entry.ok === false ? logWarn : logInfo;
  writer(logger, {
    ...entry,
    event: 'upstream.response',
    timestamp: entry.timestamp || new Date().toISOString(),
  });
}

function logUpstreamError(logger, entry) {
  logError(logger, {
    ...entry,
    event: 'upstream.error',
    timestamp: entry.timestamp || new Date().toISOString(),
  });
}

async function ensureTokenCsvFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, `${DEFAULT_TOKEN_CSV_HEADERS.join(',')}\n`, 'utf8');
  }
}

async function ensureJsonFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf8');
  }
}

async function readTokenRecords(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((value) => String(value || '').trim());
  const bodyRows = rows.slice(1);
  const records = [];
  let needsRewrite = headers.join(',') !== DEFAULT_TOKEN_CSV_HEADERS.join(',');

  for (let index = 0; index < bodyRows.length; index += 1) {
    const row = bodyRows[index];
    if (row.every((value) => !String(value || '').trim())) {
      continue;
    }

    const objectRow = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex] || '']));
    const normalizedRecord = normalizeTokenRecord(objectRow, records.length);
    if (!normalizedRecord.token) {
      needsRewrite = true;
      continue;
    }

    if (
      String(objectRow.id || '').trim() !== normalizedRecord.id
      || String(objectRow.email || objectRow.name || '').trim() !== normalizedRecord.email
      || String(objectRow.password || '').trim() !== normalizedRecord.password
      || String(objectRow.jwtToken || objectRow.token || '').trim() !== normalizedRecord.token
      || String(objectRow.balance || '').trim() !== String(normalizedRecord.balance)
      || String(objectRow.createdAt || '').trim() !== normalizedRecord.createdAt
      || normalizeShareSetting(objectRow.isAgreeShareImages) !== normalizedRecord.isAgreeShareImages
    ) {
      needsRewrite = true;
    }

    records.push(normalizedRecord);
  }

  if (needsRewrite) {
    await writeTokenRecords(filePath, records);
  }

  return records;
}

function normalizeTokenRecord(row, index) {
  const email = String(row.email || row.name || '').trim();
  const password = String(row.password || '').trim();
  const token = String(row.jwtToken || row.token || '').trim();
  const createdAt = String(row.createdAt || '').trim() || new Date().toISOString();

  return {
    id: String(row.id || '').trim() || randomUUID(),
    email,
    password,
    token,
    balance: normalizeBalance(row.balance),
    createdAt,
    isAgreeShareImages: normalizeShareSetting(row.isAgreeShareImages),
    name: email || `Token ${index + 1}`,
  };
}

function mapTokenRecordForApi(record) {
  return {
    id: record.id,
    name: record.email || record.name,
    email: record.email,
    password: record.password,
    token: record.token,
    balance: record.balance,
    createdAt: record.createdAt,
    isAgreeShareImages: record.isAgreeShareImages,
  };
}

async function writeTokenRecords(filePath, records) {
  const lines = [DEFAULT_TOKEN_CSV_HEADERS.join(',')];
  for (const record of records) {
    lines.push([
      escapeCsvField(record.id),
      escapeCsvField(record.email),
      escapeCsvField(record.password),
      escapeCsvField(record.token),
      escapeCsvField(String(normalizeBalance(record.balance))),
      escapeCsvField(record.createdAt),
      escapeCsvField(
        record.isAgreeShareImages === null || record.isAgreeShareImages === undefined
          ? ''
          : String(record.isAgreeShareImages),
      ),
    ].join(','));
  }
  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
}

async function readJsonArray(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array`);
  }
  return parsed;
}

async function writeJsonArray(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

async function readFormData(request, url) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);
  const formRequest = new Request(url, {
    method: request.method,
    headers: { 'content-type': request.headers['content-type'] || '' },
    body,
  });
  return formRequest.formData();
}

async function sendFile(response, filePath, contentType) {
  const content = await fs.readFile(filePath);
  response.statusCode = 200;
  response.setHeader('Content-Type', contentType);
  response.end(content);
}

function resolvePublicAssetPath(publicDir, pathname) {
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
  };

  const extension = path.extname(pathname || '').toLowerCase();
  if (!contentTypes[extension]) {
    return null;
  }

  const safeRelativePath = pathname.replace(/^\/+/, '');
  const filePath = path.join(publicDir, safeRelativePath);
  if (!filePath.startsWith(publicDir)) {
    return null;
  }

  return {
    filePath,
    contentType: contentTypes[extension],
  };
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function buildAuthHeaders(token) {
  return {
    Accept: 'application/json, text/plain, */*',
    Cookie: `token=${token}`,
  };
}

async function readUpstreamPayload(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return { raw: await response.text() };
}

function pickImageUrl(payload) {
  return collectImageUrls(payload)[0] || '';
}

function collectImageUrls(payload) {
  if (!payload) {
    return [];
  }

  if (typeof payload === 'string') {
    return isProbablyImageUrl(payload) ? [payload] : [];
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => collectImageUrls(item));
  }

  if (typeof payload !== 'object') {
    return [];
  }

  const directCandidates = [
    payload.imageUrl,
    payload.imageUrl1500px,
    payload.imageUrl1200px,
    payload.url,
    payload.image,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate) {
      return [candidate];
    }
  }

  if (Array.isArray(payload.images)) {
    const imageUrls = payload.images.flatMap((item) => collectImageUrls(item));
    if (imageUrls.length > 0) {
      return imageUrls;
    }
  }

  if (payload.data) {
    const dataUrls = collectImageUrls(payload.data);
    if (dataUrls.length > 0) {
      return dataUrls;
    }
  }

  return [];
}

function isProbablyImageUrl(value) {
  return /^https?:\/\//i.test(value);
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function contentTypeToExtension(contentType) {
  if (contentType.includes('image/png')) {
    return '.png';
  }
  if (contentType.includes('image/jpeg')) {
    return '.jpg';
  }
  if (contentType.includes('image/webp')) {
    return '.webp';
  }
  return '.bin';
}

function parseImportedTokenCsv(content) {
  const rows = parseCsv(content);
  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0].map((value) => String(value || '').trim());
  return rows.slice(1)
    .filter((row) => row.some((value) => String(value || '').trim()))
    .map((row, index) => normalizeTokenRecord(
      Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex] || ''])),
      index,
    ));
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (character === '"') {
      if (inQuotes && content[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && character === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (!inQuotes && (character === '\n' || character === '\r')) {
      if (character === '\r' && content[index + 1] === '\n') {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += character;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function escapeCsvField(value) {
  const text = String(value || '');
  if (!/[",\n\r]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function normalizeBalance(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return DEFAULT_BALANCE;
  }
  return Math.floor(numericValue);
}

function normalizeShareSetting(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return null;
}

function verifyCompatApiKey(headers) {
  if (!COMPAT_API_KEY) {
    return null;
  }

  const authorization = String(headers.authorization || '').trim();
  if (authorization.startsWith('Bearer ')) {
    const bearerToken = authorization.slice(7).trim();
    if (bearerToken === COMPAT_API_KEY) {
      return null;
    }
  }

  const xApiKey = String(headers['x-api-key'] || '').trim();
  if (xApiKey === COMPAT_API_KEY) {
    return null;
  }

  return {
    error: {
      message: 'Invalid API key',
      type: 'invalid_request_error',
    },
  };
}

function resolveCompatChatModel(modelName) {
  const selected = COMPAT_CHAT_MODELS[modelName] || COMPAT_CHAT_MODELS[DEFAULT_COMPAT_MODEL];
  return {
    ...selected,
    upstreamModels: Array.isArray(selected.upstreamModels) ? selected.upstreamModels : [],
  };
}

function buildCompatImageModelCandidates(requestedModel) {
  const candidates = [];
  const seen = new Set();

  const pushCandidate = (modelId) => {
    if (!modelId || seen.has(modelId)) {
      return;
    }
    const model = MODELS_BY_ID.get(modelId);
    if (!model) {
      return;
    }
    seen.add(modelId);
    candidates.push(model);
  };

  pushCandidate(requestedModel.id);
  pushCandidate(DEFAULT_COMPAT_IMAGE_MODEL);
  for (const modelId of COMPAT_IMAGE_FALLBACK_MODEL_IDS) {
    pushCandidate(modelId);
  }
  return candidates;
}

function getCompatModelList() {
  const models = [];
  const seen = new Set();

  for (const modelId of Object.keys(COMPAT_CHAT_MODELS)) {
    if (seen.has(modelId)) {
      continue;
    }
    seen.add(modelId);
    models.push({
      id: modelId,
      object: 'model',
      created: 1700000000,
      owned_by: 'chataibot-chat',
    });
  }

  for (const model of IMAGE_MODELS) {
    if (seen.has(model.id)) {
      continue;
    }
    seen.add(model.id);
    models.push({
      id: model.id,
      object: 'model',
      created: 1700000000,
      owned_by: 'chataibot-image',
    });
  }

  return models;
}

function normalizeCompatImageAction(actionInput) {
  const action = String(actionInput || 'generate').trim().toLowerCase();
  if (action === 'generate' || action === 'style' || action === 'tryon' || action === 'faceswap') {
    return action;
  }
  return 'generate';
}

function getCompatImageActionCost(action, model) {
  return COMPAT_IMAGE_ACTION_COSTS[action] || model.cost;
}

async function refreshCompatTokenBalance({ fetchImpl, tokenRecord, traceId, logger, route }) {
  const currentBalance = normalizeBalance(tokenRecord.balance);
  const { response, payload } = await fetchCompatUpstreamPayload({
    fetchImpl,
    logger,
    route,
    endpointType: 'answers-count',
    url: ANSWERS_COUNT_URL,
    traceId,
    requestOptions: {
      method: 'GET',
      headers: buildCompatUpstreamHeaders(tokenRecord.token, traceId, false),
    },
    requestPayload: { tokenId: tokenRecord.id },
  });
  if (!response.ok) {
    return { ok: false, changed: false };
  }

  const remoteBalance = Number(payload.leftAnswersCount);
  if (!Number.isFinite(remoteBalance) || remoteBalance < 0) {
    return { ok: false, changed: false };
  }

  tokenRecord.balance = Math.floor(remoteBalance);
  return {
    ok: true,
    changed: tokenRecord.balance !== currentBalance,
  };
}

async function ensureCompatShareDisabled({ fetchImpl, tokenRecord, traceId, logger, route }) {
  if (tokenRecord.isAgreeShareImages === false) {
    return { ok: true, changed: false };
  }

  const requestPayload = { isAgreeShareImages: false };
  const { response } = await fetchCompatUpstreamPayload({
    fetchImpl,
    logger,
    route,
    endpointType: 'user-update',
    url: USER_UPDATE_URL,
    traceId,
    requestOptions: {
      method: 'POST',
      headers: buildCompatUpstreamHeaders(tokenRecord.token, traceId),
      body: JSON.stringify(requestPayload),
    },
    requestPayload,
  });
  if (!response.ok) {
    return { ok: false, changed: false };
  }

  tokenRecord.isAgreeShareImages = false;
  return { ok: true, changed: true };
}

async function acquireCompatToken({
  fetchImpl,
  tokens,
  tokensFile,
  cost,
  traceId,
  logger,
  route,
}) {
  let changed = false;
  for (const tokenRecord of tokens) {
    if (normalizeBalance(tokenRecord.balance) < cost) {
      continue;
    }

    const balanceResult = await refreshCompatTokenBalance({ fetchImpl, tokenRecord, traceId, logger, route });
    changed = changed || balanceResult.changed;
    if (!balanceResult.ok || normalizeBalance(tokenRecord.balance) < cost) {
      continue;
    }

    const shareResult = await ensureCompatShareDisabled({ fetchImpl, tokenRecord, traceId, logger, route });
    changed = changed || shareResult.changed;
    if (!shareResult.ok) {
      continue;
    }

    if (changed) {
      await writeTokenRecords(tokensFile, tokens);
    }
    return { tokenRecord };
  }

  if (changed) {
    await writeTokenRecords(tokensFile, tokens);
  }
  return null;
}

function extractAnthropicSystemPrompt(systemField) {
  if (typeof systemField === 'string') {
    return systemField;
  }
  if (!Array.isArray(systemField)) {
    return '';
  }
  return systemField
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (part && typeof part === 'object') {
        return String(part.text || '');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function extractTextFromMessageContent(content) {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (!part || typeof part !== 'object') {
          return '';
        }
        if (typeof part.text === 'string') {
          return part.text;
        }
        if (typeof part.input_text === 'string') {
          return part.input_text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return content.text.trim();
  }

  return '';
}

function buildCompatPrompt({ system, messages }) {
  const lines = [];
  if (system) {
    lines.push(`[system]\n${system}`);
  }

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      continue;
    }
    const role = String(message.role || 'user').trim() || 'user';
    const text = extractTextFromMessageContent(message.content);
    if (!text) {
      continue;
    }
    if (role === 'system') {
      if (!system) {
        lines.unshift(`[system]\n${text}`);
      }
      continue;
    }
    lines.push(`[${role}]\n${text}`);
  }

  return lines.join('\n\n').trim();
}

function buildCompatUpstreamHeaders(token, traceId, includeJsonContentType = true) {
  const headers = {
    ...buildAuthHeaders(token),
    'x-distribution-channel': 'web',
    'x-trace-id': traceId,
  };
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function fetchCompatUpstreamPayload({
  fetchImpl,
  logger,
  route,
  endpointType,
  url,
  traceId,
  requestOptions,
  requestPayload,
}) {
  const method = String(requestOptions.method || 'GET').toUpperCase();
  logUpstreamRequest(logger, {
    route,
    endpointType,
    method,
    url,
    traceId,
    payload: requestPayload,
  });

  const startedAt = Date.now();
  let response;
  try {
    response = await fetchImpl(url, requestOptions);
  } catch (error) {
    logUpstreamError(logger, {
      route,
      endpointType,
      method,
      url,
      traceId,
      payload: requestPayload,
      error: serializeError(error),
    });
    throw error;
  }

  const payload = await readUpstreamPayload(response);
  logUpstreamResponse(logger, {
    route,
    endpointType,
    method,
    url,
    traceId,
    statusCode: response.status,
    ok: response.ok,
    durationMs: Date.now() - startedAt,
    response: payload,
  });

  return { response, payload };
}

async function runCompatChatRequest({ fetchImpl, token, modelConfig, prompt, traceId, logger, route }) {
  const errors = [];
  for (const upstreamModel of modelConfig.upstreamModels) {
    const contextRequestPayload = {
      title: prompt.slice(0, 30) || 'chat',
      chatModel: upstreamModel,
      from: 1,
    };
    const { response: contextResponse, payload: contextPayload } = await fetchCompatUpstreamPayload({
      fetchImpl,
      logger,
      route,
      endpointType: 'message-context',
      url: MESSAGE_CONTEXT_URL,
      traceId,
      requestOptions: {
        method: 'POST',
        headers: buildCompatUpstreamHeaders(token, traceId),
        body: JSON.stringify(contextRequestPayload),
      },
      requestPayload: contextRequestPayload,
    });
    if (!contextResponse.ok) {
      const summary = typeof contextPayload.raw === 'string' ? contextPayload.raw : JSON.stringify(contextPayload);
      errors.push(`context(${upstreamModel}): ${summary.slice(0, 240)}`);
      continue;
    }

    const chatId = Number(contextPayload.id);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      errors.push(`context(${upstreamModel}): missing chatId`);
      continue;
    }

    const messageRequestPayload = {
      text: prompt,
      chatModel: upstreamModel,
      from: 1,
      isInternational: true,
      chatId,
    };
    const { response: messageResponse, payload: messagePayload } = await fetchCompatUpstreamPayload({
      fetchImpl,
      logger,
      route,
      endpointType: 'message',
      url: MESSAGE_URL,
      traceId,
      requestOptions: {
        method: 'POST',
        headers: buildCompatUpstreamHeaders(token, traceId),
        body: JSON.stringify(messageRequestPayload),
      },
      requestPayload: messageRequestPayload,
    });
    if (!messageResponse.ok) {
      const summary = typeof messagePayload.raw === 'string' ? messagePayload.raw : JSON.stringify(messagePayload);
      errors.push(`message(${upstreamModel}): ${summary.slice(0, 240)}`);
      continue;
    }

    const answer = extractTextFromMessageContent(messagePayload.answer || messagePayload.text || '');
    if (!answer) {
      errors.push(`message(${upstreamModel}): empty answer`);
      continue;
    }

    return {
      answer,
      upstreamModel,
    };
  }

  throw new Error(`upstream chat failed: ${errors.join(' | ').slice(0, 800)}`);
}

async function runCompatImageGeneration({ fetchImpl, token, model, prompt, image, images, traceId, logger, route }) {
  const errors = [];
  const candidates = buildCompatImageModelCandidates(model);
  for (const candidateModel of candidates) {
    const payload = {
      text: prompt,
      from: 1,
      generationType: candidateModel.provider,
      isInternational: true,
    };
    if (candidateModel.version) {
      payload.version = candidateModel.version;
    }

    const singleImage = typeof image === 'string' ? image.trim() : '';
    if (singleImage) {
      payload.image = singleImage;
    }
    if (Array.isArray(images)) {
      const validImages = images
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
      if (validImages.length > 0) {
        payload.images = validImages;
      }
    }

    const { response: upstreamResponse, payload: upstreamPayload } = await fetchCompatUpstreamPayload({
      fetchImpl,
      logger,
      route,
      endpointType: 'image-generate',
      url: GENERATE_URL,
      traceId,
      requestOptions: {
        method: 'POST',
        headers: buildCompatUpstreamHeaders(token, traceId),
        body: JSON.stringify(payload),
      },
      requestPayload: payload,
    });
    if (!upstreamResponse.ok) {
      const summary = typeof upstreamPayload.raw === 'string' ? upstreamPayload.raw : JSON.stringify(upstreamPayload);
      errors.push(`image(${candidateModel.id}): ${summary.slice(0, 220)}`);
      continue;
    }

    const imageUrl = pickImageUrl(upstreamPayload);
    if (!imageUrl) {
      errors.push(`image(${candidateModel.id}): missing imageUrl`);
      continue;
    }

    return {
      imageUrl,
      model: candidateModel,
    };
  }

  throw new Error(`upstream image generate failed: ${errors.join(' | ').slice(0, 800)}`);
}

function collectCompatImageUrls({ image, images }) {
  const result = [];
  const pushUrl = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return;
    }
    result.push(normalized);
  };

  pushUrl(image);
  if (Array.isArray(images)) {
    for (const item of images) {
      pushUrl(item);
    }
  }
  return result;
}

async function downloadCompatImageUrlsAsFiles(fetchImpl, urls) {
  const files = [];
  for (let index = 0; index < urls.length; index += 1) {
    const imageUrl = urls[index];
    const response = await fetchImpl(imageUrl);
    if (!response.ok) {
      throw new Error(`failed to download image: ${imageUrl}`);
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const extension = contentTypeToExtension(contentType);
    const buffer = Buffer.from(await response.arrayBuffer());
    files.push(new File([buffer], `compat-image-${index + 1}${extension}`, { type: contentType }));
  }
  return files;
}

async function runCompatImageActionRequest({
  fetchImpl,
  token,
  action,
  model,
  prompt,
  image,
  images,
  traceId,
  logger,
  route,
}) {
  const imageUrls = collectCompatImageUrls({ image, images });

  if (action === 'style') {
    if (imageUrls.length < 1) {
      throw new Error('style requires at least one image url');
    }
    if (!model.editMode) {
      throw new Error(`model ${model.id} does not support style mode`);
    }

    const files = await downloadCompatImageUrlsAsFiles(fetchImpl, imageUrls);
    const upstreamForm = new FormData();
    upstreamForm.set('mode', model.editMode);
    upstreamForm.set('chatContextId', '-2');
    upstreamForm.set('lang', 'en');
    upstreamForm.set('from', '1');
    upstreamForm.set('isInternational', 'true');
    if (prompt) {
      upstreamForm.set('caption', prompt);
    }
    for (const file of files) {
      upstreamForm.append('images', file, file.name);
    }

    const requestPayload = {
      mode: model.editMode,
      chatContextId: -2,
      lang: 'en',
      from: 1,
      isInternational: true,
      caption: prompt || '',
      images: imageUrls,
    };
    const { response, payload } = await fetchCompatUpstreamPayload({
      fetchImpl,
      logger,
      route,
      endpointType: 'file-recognize',
      url: RECOGNIZE_URL,
      traceId,
      requestOptions: {
        method: 'POST',
        headers: buildCompatUpstreamHeaders(token, traceId, false),
        body: upstreamForm,
      },
      requestPayload,
    });
    if (!response.ok) {
      const summary = typeof payload.raw === 'string' ? payload.raw : JSON.stringify(payload);
      throw new Error(`upstream style failed: ${summary.slice(0, 400)}`);
    }
    const imageUrl = pickImageUrl(payload);
    if (!imageUrl) {
      throw new Error('image url not found in upstream style response');
    }
    return { imageUrl, model };
  }

  if (action === 'tryon' || action === 'faceswap') {
    if (imageUrls.length < 2) {
      throw new Error(`${action} requires at least two image urls`);
    }

    const files = await downloadCompatImageUrlsAsFiles(fetchImpl, imageUrls);
    const upstreamForm = new FormData();
    upstreamForm.set('lang', 'en');
    upstreamForm.set('from', '1');
    upstreamForm.set('type', action === 'tryon' ? 'fashion' : 'faceswap');
    upstreamForm.set('isInternational', 'true');
    for (const file of files) {
      upstreamForm.append('images', file, file.name);
    }

    const requestPayload = {
      lang: 'en',
      from: 1,
      type: action === 'tryon' ? 'fashion' : 'faceswap',
      isInternational: true,
      images: imageUrls,
    };
    const { response, payload } = await fetchCompatUpstreamPayload({
      fetchImpl,
      logger,
      route,
      endpointType: action === 'tryon' ? 'file-merge-fashion' : 'file-merge-faceswap',
      url: MERGE_URL,
      traceId,
      requestOptions: {
        method: 'POST',
        headers: buildCompatUpstreamHeaders(token, traceId, false),
        body: upstreamForm,
      },
      requestPayload,
    });
    if (!response.ok) {
      const summary = typeof payload.raw === 'string' ? payload.raw : JSON.stringify(payload);
      throw new Error(`upstream ${action} failed: ${summary.slice(0, 400)}`);
    }
    const imageUrl = pickImageUrl(payload);
    if (!imageUrl) {
      throw new Error(`image url not found in upstream ${action} response`);
    }

    return {
      imageUrl,
      model: {
        ...model,
        cost: getCompatImageActionCost(action, model),
      },
    };
  }

  throw new Error(`unsupported image action: ${action}`);
}

function splitTextForStream(text, chunkSize = 32) {
  if (!text) {
    return [];
  }
  const chunks = [];
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }
  return chunks;
}

function sendOpenAiCompatStream(response, { id, model, text }) {
  const created = Math.floor(Date.now() / 1000);
  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');

  const writeChunk = (payload) => {
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  writeChunk({
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
  });

  for (const chunk of splitTextForStream(text, 20)) {
    writeChunk({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
    });
  }

  writeChunk({
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
  });

  response.write('data: [DONE]\n\n');
  response.end();
}

function sendAnthropicCompatStream(response, { id, model, prompt, text }) {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');

  const writeEvent = (eventName, payload) => {
    response.write(`event: ${eventName}\n`);
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  writeEvent('message_start', {
    type: 'message_start',
    message: {
      id,
      type: 'message',
      role: 'assistant',
      model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: prompt.length, output_tokens: 0 },
    },
  });

  writeEvent('content_block_start', {
    type: 'content_block_start',
    index: 0,
    content_block: { type: 'text', text: '' },
  });

  for (const chunk of splitTextForStream(text, 20)) {
    writeEvent('content_block_delta', {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: chunk },
    });
  }

  writeEvent('content_block_stop', {
    type: 'content_block_stop',
    index: 0,
  });

  writeEvent('message_delta', {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: text.length },
  });

  writeEvent('message_stop', { type: 'message_stop' });
  response.end();
}

if (require.main === module) {
  const port = Number(process.env.PORT || 13000);
  const server = createApp();
  server.listen(port, () => {
    console.log(`simple-image-app listening on http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
