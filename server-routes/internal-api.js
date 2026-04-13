const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

async function handleInternalApiRoutes(context) {
  const {
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
    logError,
    serializeError,
    pickImageUrl,
  } = context;

// Internal management APIs (/api/*)
if (isRoute('GET', '/api/models')) {
  return sendJson(response, 200, {
    defaultModelId: DEFAULT_MODEL_ID,
    groups: getModelGroupsForApi(),
  });
}

if (isRoute('GET', '/api/tokens')) {
  const page = normalizeListPageParam(url.searchParams.get('page'));
  const pageSize = normalizeListPageSizeParam(url.searchParams.get('pageSize'));
  const filter = normalizeTokenFilterParam(url.searchParams.get('filter'));
  const tokens = await readTokenRecords(tokensFile);
  const history = await readJsonArray(historyFile);
  const usedTokenIds = collectUsedTokenIds(history);
  const filteredTokens = filterTokenRecords(tokens, usedTokenIds, filter, normalizeBalance).map((tokenRecord) => ({
    ...mapTokenRecordForApi(tokenRecord),
    isUsed: isUsedTokenRecord(tokenRecord, usedTokenIds, normalizeBalance),
    isEligible: isEligibleTokenRecord(tokenRecord, normalizeBalance),
  }));
  return sendJson(response, 200, buildPaginatedResponse(filteredTokens, page, pageSize));
}

if (isRoute('GET', '/api/history')) {
  const page = normalizeListPageParam(url.searchParams.get('page'));
  const pageSize = normalizeListPageSizeParam(url.searchParams.get('pageSize'));
  const history = await readJsonArray(historyFile);
  history.sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
  return sendJson(response, 200, buildPaginatedResponse(history, page, pageSize));
}

if (isRouteStartsWith('DELETE', '/api/history/')) {
  const historyKey = decodeURIComponent(url.pathname.slice('/api/history/'.length)).trim();
  if (!historyKey) {
    return sendJson(response, 400, { error: 'history id is required' });
  }

  const history = await readJsonArray(historyFile);
  let removeIndex = history.findIndex((item) => String(item?.id || '') === historyKey);

  // Backward compatibility: if no id exists in legacy records, allow deleting by visible index.
  if (removeIndex === -1 && /^\d+$/.test(historyKey)) {
    const sortedWithOriginalIndex = history
      .map((item, index) => ({ item, index }))
      .sort((left, right) => String(right.item?.createdAt || '').localeCompare(String(left.item?.createdAt || '')));
    const target = sortedWithOriginalIndex[Number(historyKey)];
    if (target) {
      removeIndex = target.index;
    }
  }

  if (removeIndex === -1) {
    return sendJson(response, 404, { error: 'history record not found' });
  }

  const [deletedRecord] = history.splice(removeIndex, 1);
  await writeJsonArray(historyFile, history);
  return sendJson(response, 200, {
    success: true,
    deletedId: deletedRecord?.id || null,
  });
}

if (isRouteStartsWith('GET', '/api/tokens/') && isRouteEndsWith('GET', '/balance')) {
  const tokenId = decodeURIComponent(url.pathname.slice('/api/tokens/'.length, -'/balance'.length));
  if (!tokenId) {
    return sendJson(response, 400, { error: 'tokenId is required' });
  }

  const tokens = await readTokenRecords(tokensFile);
  const tokenRecord = tokens.find((item) => item.id === tokenId);
  if (!tokenRecord) {
    return sendJson(response, 404, { error: 'token not found' });
  }

  logInfo(logger, {
    event: 'upstream.request',
    route: '/api/tokens/:id/balance',
    endpointType: 'answers-count',
    method: 'GET',
    url: ANSWERS_COUNT_URL,
    traceId,
    payload: {
      tokenId: tokenRecord.id,
    },
    timestamp: new Date().toISOString(),
  }, logAsJsonLine);

  const upstreamStartAt = Date.now();
  const upstreamResponse = await fetchImpl(ANSWERS_COUNT_URL, {
    method: 'GET',
    headers: buildAuthHeaders(tokenRecord.token),
  });
  const upstreamPayload = await readUpstreamPayload(upstreamResponse);
  (upstreamResponse.ok ? logInfo : logWarn)(logger, {
    event: 'upstream.response',
    route: '/api/tokens/:id/balance',
    endpointType: 'answers-count',
    method: 'GET',
    url: ANSWERS_COUNT_URL,
    traceId,
    statusCode: upstreamResponse.status,
    ok: upstreamResponse.ok,
    durationMs: Date.now() - upstreamStartAt,
    response: upstreamPayload,
    timestamp: new Date().toISOString(),
  }, logAsJsonLine);

  if (!upstreamResponse.ok) {
    return sendJson(response, upstreamResponse.status, upstreamPayload);
  }

  const remoteBalance = Number(upstreamPayload.leftAnswersCount);
  if (Number.isFinite(remoteBalance) && remoteBalance >= 0) {
    tokenRecord.balance = Math.floor(remoteBalance);
    await writeTokenRecords(tokensFile, tokens);
  }

  return sendJson(response, 200, {
    ...upstreamPayload,
    tokenId: tokenRecord.id,
    balance: tokenRecord.balance,
  });
}

if (isRoute('POST', '/api/tokens')) {
  const body = await readJsonBody(request);
  const email = String(body.email || body.name || '').trim();
  const token = String(body.token || body.jwtToken || '').trim();

  if (!email || !token) {
    return sendJson(response, 400, { error: 'email and token are required' });
  }

  const tokens = await readTokenRecords(tokensFile);
  if (tokens.some((item) => item.token === token)) {
    return sendJson(response, 400, { error: 'token already exists' });
  }

  const tokenRecord = {
    id: randomUUID(),
    email,
    password: String(body.password || '').trim(),
    token,
    balance: normalizeBalance(body.balance),
    createdAt: new Date().toISOString(),
  };
  tokens.push(tokenRecord);
  await writeTokenRecords(tokensFile, tokens);
  return sendJson(response, 200, { success: true, data: mapTokenRecordForApi(tokenRecord) });
}

if (isRouteStartsWith('PUT', '/api/tokens/')) {
  const tokenId = decodeURIComponent(url.pathname.slice('/api/tokens/'.length));
  const body = await readJsonBody(request);
  const email = String(body.email || body.name || '').trim();
  const token = String(body.token || body.jwtToken || '').trim();

  if (!email || !token) {
    return sendJson(response, 400, { error: 'email and token are required' });
  }

  const tokens = await readTokenRecords(tokensFile);
  const tokenIndex = tokens.findIndex((item) => item.id === tokenId);
  if (tokenIndex === -1) {
    return sendJson(response, 404, { error: 'token not found' });
  }

  if (tokens.some((item, index) => index !== tokenIndex && item.token === token)) {
    return sendJson(response, 400, { error: 'token already exists' });
  }

  tokens[tokenIndex] = {
    ...tokens[tokenIndex],
    email,
    password: String(body.password || '').trim(),
    token,
    balance: normalizeBalance(body.balance),
  };
  await writeTokenRecords(tokensFile, tokens);
  return sendJson(response, 200, { success: true, data: mapTokenRecordForApi(tokens[tokenIndex]) });
}

if (isRoute('POST', '/api/tokens/import')) {
  const formData = await readFormData(request, url.href);
  const file = formData.get('file');

  if (!file || typeof file.name !== 'string' || file.size <= 0) {
    return sendJson(response, 400, { error: 'csv file is required' });
  }

  if (!/\.csv$/i.test(file.name)) {
    return sendJson(response, 400, { error: 'only .csv files are supported' });
  }

  const importedRows = parseImportedTokenCsv(await file.text());
  if (importedRows.length === 0) {
    return sendJson(response, 400, { error: 'csv must contain at least one token row' });
  }

  const tokens = await readTokenRecords(tokensFile);
  const existingTokenValues = new Set(tokens.map((item) => item.token));
  const appendedTokens = [];

  for (const importedRow of importedRows) {
    if (!importedRow.token || existingTokenValues.has(importedRow.token)) {
      continue;
    }

    appendedTokens.push({
      id: importedRow.id || randomUUID(),
      email: importedRow.email,
      password: importedRow.password,
      token: importedRow.token,
      balance: normalizeBalance(importedRow.balance),
      createdAt: importedRow.createdAt || new Date().toISOString(),
    });
    existingTokenValues.add(importedRow.token);
  }

  tokens.push(...appendedTokens);
  await writeTokenRecords(tokensFile, tokens);
  return sendJson(response, 200, {
    success: true,
    importedCount: appendedTokens.length,
    data: appendedTokens.map(mapTokenRecordForApi),
  });
}

if (isRouteStartsWith('DELETE', '/api/tokens/')) {
  const tokenId = decodeURIComponent(url.pathname.slice('/api/tokens/'.length));
  const tokens = await readTokenRecords(tokensFile);
  const remainingTokens = tokens.filter((item) => item.id !== tokenId);

  if (remainingTokens.length === tokens.length) {
    return sendJson(response, 404, { error: 'token not found' });
  }

  await writeTokenRecords(tokensFile, remainingTokens);
  return sendJson(response, 200, { success: true });
}

if (isRoute('GET', '/api/save-image')) {
  const imageUrl = url.searchParams.get('url');
  if (!imageUrl) {
    return sendJson(response, 400, { error: 'url is required' });
  }

  const remoteResponse = await fetchImpl(imageUrl);
  if (!remoteResponse.ok) {
    return sendJson(response, remoteResponse.status, { error: 'failed to download image' });
  }

  const contentType = remoteResponse.headers.get('content-type') || 'application/octet-stream';
  const extension = contentTypeToExtension(contentType);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = path.join(savedDir, filename);
  const buffer = Buffer.from(await remoteResponse.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return sendJson(response, 200, {
    success: true,
    filename,
    path: filePath,
  });
}

if (isRoute('POST', '/api/generate')) {
  const tokens = await readTokenRecords(tokensFile);
  const history = await readJsonArray(historyFile);
  const formData = await readFormData(request, url.href);
  const tokenId = String(formData.get('tokenId') || '').trim();
  const prompt = String(formData.get('prompt') || '').trim();
  const action = normalizeAction(formData.get('action'));
  const model = resolveModel(formData.get('modelId'), formData.get('version'));
  const referenceImages = collectReferenceImages(formData, action);

  if (!tokenId) {
    return sendJson(response, 400, { error: 'tokenId is required' });
  }

  const tokenRecord = tokens.find((item) => item.id === tokenId);
  if (!tokenRecord) {
    return sendJson(response, 404, { error: 'token not found' });
  }

  const operation = resolveOperation({ action, model, imageCount: referenceImages.length });

  if ((operation.endpoint === 'generate' || operation.endpoint === 'recognize') && !prompt) {
    return sendJson(response, 400, { error: 'prompt is required' });
  }

  const referenceImageNames = [];
  for (const file of referenceImages) {
    referenceImageNames.push(file.name);
    const uploadFilename = `${Date.now()}-${randomUUID()}-${sanitizeFilename(file.name)}`;
    const uploadPath = path.join(uploadsDir, uploadFilename);
    const uploadBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(uploadPath, uploadBuffer);
  }

  const upstreamUrl = resolveUpstreamUrl(operation);
  const upstreamPayloadForLog = buildGenerateUpstreamRequestPayload({
    action,
    model,
    operation,
    prompt,
    referenceImages,
  });
  logInfo(logger, {
    event: 'upstream.request',
    route: '/api/generate',
    endpointType: operation.endpoint,
    method: 'POST',
    url: upstreamUrl,
    traceId,
    payload: upstreamPayloadForLog,
    timestamp: new Date().toISOString(),
  }, logAsJsonLine);

  let upstreamResponse;
  const upstreamStartAt = Date.now();
  try {
    upstreamResponse = await dispatchUpstreamRequest({
      fetchImpl,
      token: tokenRecord.token,
      model,
      operation,
      prompt,
      referenceImages,
    });
  } catch (error) {
    logError(logger, {
      event: 'upstream.error',
      route: '/api/generate',
      endpointType: operation.endpoint,
      method: 'POST',
      url: upstreamUrl,
      traceId,
      payload: upstreamPayloadForLog,
      error: serializeError(error),
      timestamp: new Date().toISOString(),
    }, logAsJsonLine);
    throw error;
  }

  const upstreamPayload = await readUpstreamPayload(upstreamResponse);
  (upstreamResponse.ok ? logInfo : logWarn)(logger, {
    event: 'upstream.response',
    route: '/api/generate',
    endpointType: operation.endpoint,
    method: 'POST',
    url: upstreamUrl,
    traceId,
    statusCode: upstreamResponse.status,
    ok: upstreamResponse.ok,
    durationMs: Date.now() - upstreamStartAt,
    response: upstreamPayload,
    timestamp: new Date().toISOString(),
  }, logAsJsonLine);
  if (!upstreamResponse.ok) {
    return sendJson(response, upstreamResponse.status, upstreamPayload);
  }

  const imageUrl = pickImageUrl(upstreamPayload);
  if (!imageUrl) {
    return sendJson(response, 502, { error: 'image url not found in upstream response', raw: upstreamPayload });
  }

  tokenRecord.balance = Math.max(0, normalizeBalance(tokenRecord.balance) - operation.cost);
  await writeTokenRecords(tokensFile, tokens);

  const historyRecord = {
    id: randomUUID(),
    tokenId: tokenRecord.id,
    tokenName: tokenRecord.email || tokenRecord.name,
    prompt,
    action,
    modelId: model.id,
    modelName: model.name,
    version: model.version || model.id,
    provider: model.provider,
    operationType: operation.type || operation.mode || operation.endpoint,
    referenceImageName: referenceImageNames[0] || '',
    referenceImageNames,
    resultImageUrl: imageUrl,
    createdAt: new Date().toISOString(),
  };
  history.push(historyRecord);
  await writeJsonArray(historyFile, history);

  return sendJson(response, 200, {
    success: true,
    imageUrl,
    historyRecord,
  });
}
}

const DEFAULT_LIST_PAGE = 1;
const DEFAULT_LIST_PAGE_SIZE = 20;
const MAX_LIST_PAGE_SIZE = 50;
const MIN_TOKEN_BALANCE = 15;
const DEFAULT_TOKEN_BALANCE = 65;
const ALLOWED_TOKEN_FILTERS = new Set(['all', 'used', 'unused', 'low-balance']);

function normalizeListPageParam(value) {
  const page = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(page) || page < 1) {
    return DEFAULT_LIST_PAGE;
  }
  return page;
}

function normalizeListPageSizeParam(value) {
  const pageSize = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return DEFAULT_LIST_PAGE_SIZE;
  }
  return Math.min(pageSize, MAX_LIST_PAGE_SIZE);
}

function normalizeTokenFilterParam(value) {
  const filter = String(value || 'all').trim().toLowerCase();
  return ALLOWED_TOKEN_FILTERS.has(filter) ? filter : 'all';
}

function buildPaginatedResponse(items, requestedPage, pageSize) {
  const list = Array.isArray(items) ? items : [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(DEFAULT_LIST_PAGE, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  const pagedItems = list.slice(startIndex, startIndex + pageSize);

  return {
    items: pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

function isUsedTokenRecord(tokenRecord, usedTokenIds, normalizeBalanceFn) {
  const balance = normalizeBalanceFn(tokenRecord?.balance);
  return usedTokenIds.has(tokenRecord?.id) || balance < DEFAULT_TOKEN_BALANCE;
}

function isEligibleTokenRecord(tokenRecord, normalizeBalanceFn) {
  return normalizeBalanceFn(tokenRecord?.balance) >= MIN_TOKEN_BALANCE;
}

function collectUsedTokenIds(history) {
  return new Set((Array.isArray(history) ? history : []).map((item) => String(item?.tokenId || '').trim()).filter(Boolean));
}

function filterTokenRecords(tokens, usedTokenIds, filter, normalizeBalanceFn) {
  const records = Array.isArray(tokens) ? tokens : [];

  return records.filter((tokenRecord) => {
    const balance = normalizeBalanceFn(tokenRecord?.balance);
    if (filter === 'low-balance') {
      return balance < MIN_TOKEN_BALANCE;
    }

    if (!isEligibleTokenRecord(tokenRecord, normalizeBalanceFn)) {
      return false;
    }

    const used = isUsedTokenRecord(tokenRecord, usedTokenIds, normalizeBalanceFn);
    if (filter === 'used') {
      return used;
    }
    if (filter === 'unused') {
      return !used;
    }
    return true;
  });
}

module.exports = {
  handleInternalApiRoutes,
};


