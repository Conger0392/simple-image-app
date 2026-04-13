const { randomUUID } = require('node:crypto');

function logCompat(logger, level, entry) {
  if (!logger) {
    return;
  }
  const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
  if (typeof logger[method] === 'function') {
    logger[method]({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  }
}

function logCompatRequest(logger, { route, method, traceId, payload }) {
  logCompat(logger, 'INFO', {
    event: 'compat.request',
    route,
    method,
    traceId,
    payload,
  });
}

function sendCompatJson({ logger, sendJson, response, route, method, traceId, startedAt, statusCode, payload, logFields }) {
  logCompat(logger, statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO', {
    event: 'compat.response',
    route,
    method,
    traceId,
    statusCode,
    durationMs: Date.now() - startedAt,
    response: payload,
    ...(logFields || {}),
  });
  return sendJson(response, statusCode, payload);
}

function logCompatError(logger, { route, method, traceId, startedAt, payload, serializeError, error }) {
  logCompat(logger, 'ERROR', {
    event: 'compat.error',
    route,
    method,
    traceId,
    durationMs: Date.now() - startedAt,
    payload,
    error: serializeError(error),
  });
}

async function handleCompatApiRoutes(context) {
  const {
    request,
    response,
    traceId,
    isRoute,
    tokensFile,
    fetchImpl,
    logger,
    DEFAULT_COMPAT_MODEL,
    DEFAULT_COMPAT_IMAGE_MODEL,
    MODELS_BY_ID,
    sendJson,
    verifyCompatApiKey,
    getCompatModelList,
    readJsonBody,
    resolveCompatChatModel,
    buildCompatPrompt,
    readTokenRecords,
    acquireCompatToken,
    runCompatChatRequest,
    normalizeBalance,
    writeTokenRecords,
    sendOpenAiCompatStream,
    normalizeCompatImageAction,
    getCompatImageActionCost,
    runCompatImageGeneration,
    runCompatImageActionRequest,
    sendAnthropicCompatStream,
    extractAnthropicSystemPrompt,
    serializeError,
  } = context;

  if (isRoute('GET', '/v1/models')) {
    const route = '/v1/models';
    const method = 'GET';
    const startedAt = Date.now();
    const authError = verifyCompatApiKey(request.headers);
    if (authError) {
      return sendCompatJson({ logger, sendJson, response, route, method, traceId, startedAt, statusCode: 401, payload: authError });
    }
    return sendCompatJson({
      logger,
      sendJson,
      response,
      route,
      method,
      traceId,
      startedAt,
      statusCode: 200,
      payload: {
        object: 'list',
        data: getCompatModelList(),
      },
    });
  }

  if (isRoute('POST', '/v1/chat/completions')) {
    const route = '/v1/chat/completions';
    const method = 'POST';
    const startedAt = Date.now();
    const authError = verifyCompatApiKey(request.headers);
    if (authError) {
      return sendCompatJson({ logger, sendJson, response, route, method, traceId, startedAt, statusCode: 401, payload: authError });
    }

    const reqData = await readJsonBody(request);
    logCompatRequest(logger, { route, method, traceId, payload: reqData });

    try {
      const modelName = String(reqData.model || DEFAULT_COMPAT_MODEL).trim() || DEFAULT_COMPAT_MODEL;
      const modelConfig = resolveCompatChatModel(modelName);
      const messages = Array.isArray(reqData.messages) ? reqData.messages : [];
      const prompt = buildCompatPrompt({
        system: '',
        messages,
      });
      if (!prompt) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 400,
          payload: { error: { message: 'messages is required', type: 'invalid_request_error' } },
        });
      }

      const tokens = await readTokenRecords(tokensFile);
      const tokenSelection = await acquireCompatToken({
        fetchImpl,
        tokens,
        tokensFile,
        cost: modelConfig.cost,
        traceId,
        logger,
        route,
      });
      if (!tokenSelection) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 503,
          payload: { error: { message: 'no token with enough balance', type: 'insufficient_quota' } },
        });
      }
      const { tokenRecord } = tokenSelection;
      const balanceBefore = normalizeBalance(tokenRecord.balance);

      const chatResult = await runCompatChatRequest({
        fetchImpl,
        token: tokenRecord.token,
        modelConfig,
        prompt,
        traceId,
        logger,
        route,
      });
      const answer = chatResult.answer;

      tokenRecord.balance = Math.max(0, normalizeBalance(tokenRecord.balance) - modelConfig.cost);
      const tokenUsage = {
        tokenId: tokenRecord.id,
        email: tokenRecord.email || '',
        balanceBefore,
        balanceAfter: normalizeBalance(tokenRecord.balance),
        cost: modelConfig.cost,
      };
      await writeTokenRecords(tokensFile, tokens);

      if (reqData.stream) {
        const streamPayload = {
          id: `chatcmpl-${randomUUID()}`,
          model: modelName,
          text: answer,
          stream: true,
        };
        logCompat(logger, 'INFO', {
          event: 'compat.response',
          route,
          method,
          traceId,
          statusCode: 200,
          durationMs: Date.now() - startedAt,
          response: streamPayload,
          tokenUsage,
        });
        return sendOpenAiCompatStream(response, streamPayload);
      }

      return sendCompatJson({
        logger,
        sendJson,
        response,
        route,
        method,
        traceId,
        startedAt,
        statusCode: 200,
        payload: {
          id: `chatcmpl-${randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: answer },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: prompt.length,
            completion_tokens: answer.length,
            total_tokens: prompt.length + answer.length,
          },
        },
        logFields: { tokenUsage },
      });
    } catch (error) {
      logCompatError(logger, { route, method, traceId, startedAt, payload: reqData, serializeError, error });
      throw error;
    }
  }

  if (isRoute('POST', '/v1/images/generations')) {
    const route = '/v1/images/generations';
    const method = 'POST';
    const startedAt = Date.now();
    const authError = verifyCompatApiKey(request.headers);
    if (authError) {
      return sendCompatJson({ logger, sendJson, response, route, method, traceId, startedAt, statusCode: 401, payload: authError });
    }

    const reqData = await readJsonBody(request);
    logCompatRequest(logger, { route, method, traceId, payload: reqData });

    try {
      const action = normalizeCompatImageAction(reqData.action);
      const prompt = String(reqData.prompt || '').trim();
      if (action === 'generate' && !prompt) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 400,
          payload: { error: { message: 'prompt is required', type: 'invalid_request_error' } },
        });
      }

      const modelId = String(reqData.model || DEFAULT_COMPAT_IMAGE_MODEL).trim() || DEFAULT_COMPAT_IMAGE_MODEL;
      const model = MODELS_BY_ID.get(modelId) || MODELS_BY_ID.get(DEFAULT_COMPAT_IMAGE_MODEL);
      if (!model) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 400,
          payload: { error: { message: `unsupported image model: ${modelId}`, type: 'invalid_request_error' } },
        });
      }

      const tokens = await readTokenRecords(tokensFile);
      const requiredCost = action === 'generate' ? model.cost : getCompatImageActionCost(action, model);
      const tokenSelection = await acquireCompatToken({
        fetchImpl,
        tokens,
        tokensFile,
        cost: requiredCost,
        traceId,
        logger,
        route,
      });
      if (!tokenSelection) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 503,
          payload: { error: { message: 'no token with enough balance', type: 'insufficient_quota' } },
        });
      }
      const { tokenRecord } = tokenSelection;
      const balanceBefore = normalizeBalance(tokenRecord.balance);

      const imageResult = action === 'generate'
        ? await runCompatImageGeneration({
          fetchImpl,
          token: tokenRecord.token,
          model,
          prompt,
          image: reqData.image,
          images: reqData.images,
          traceId,
          logger,
          route,
        })
        : await runCompatImageActionRequest({
          fetchImpl,
          token: tokenRecord.token,
          action,
          model,
          prompt,
          image: reqData.image,
          images: reqData.images,
          traceId,
          logger,
          route,
        });
      const imageUrl = imageResult.imageUrl;
      const usedModel = imageResult.model;

      tokenRecord.balance = Math.max(0, normalizeBalance(tokenRecord.balance) - usedModel.cost);
      const tokenUsage = {
        tokenId: tokenRecord.id,
        email: tokenRecord.email || '',
        balanceBefore,
        balanceAfter: normalizeBalance(tokenRecord.balance),
        cost: usedModel.cost,
      };
      await writeTokenRecords(tokensFile, tokens);

      return sendCompatJson({
        logger,
        sendJson,
        response,
        route,
        method,
        traceId,
        startedAt,
        statusCode: 200,
        payload: {
          created: Math.floor(Date.now() / 1000),
          data: [{ url: imageUrl }],
        },
        logFields: { tokenUsage },
      });
    } catch (error) {
      logCompatError(logger, { route, method, traceId, startedAt, payload: reqData, serializeError, error });
      throw error;
    }
  }

  if (isRoute('POST', '/v1/messages')) {
    const route = '/v1/messages';
    const method = 'POST';
    const startedAt = Date.now();
    const authError = verifyCompatApiKey(request.headers);
    if (authError) {
      return sendCompatJson({ logger, sendJson, response, route, method, traceId, startedAt, statusCode: 401, payload: authError });
    }

    const reqData = await readJsonBody(request);
    logCompatRequest(logger, { route, method, traceId, payload: reqData });

    try {
      const modelName = String(reqData.model || 'claude-3-5-sonnet-latest').trim() || 'claude-3-5-sonnet-latest';
      const modelConfig = resolveCompatChatModel(modelName);
      const messages = Array.isArray(reqData.messages) ? reqData.messages : [];
      const prompt = buildCompatPrompt({
        system: extractAnthropicSystemPrompt(reqData.system),
        messages,
      });
      if (!prompt) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 400,
          payload: {
            type: 'error',
            error: { type: 'invalid_request_error', message: 'messages is required' },
          },
        });
      }

      const tokens = await readTokenRecords(tokensFile);
      const tokenSelection = await acquireCompatToken({
        fetchImpl,
        tokens,
        tokensFile,
        cost: modelConfig.cost,
        traceId,
        logger,
        route,
      });
      if (!tokenSelection) {
        return sendCompatJson({
          logger,
          sendJson,
          response,
          route,
          method,
          traceId,
          startedAt,
          statusCode: 503,
          payload: {
            type: 'error',
            error: { type: 'insufficient_quota', message: 'no token with enough balance' },
          },
        });
      }
      const { tokenRecord } = tokenSelection;
      const balanceBefore = normalizeBalance(tokenRecord.balance);

      const chatResult = await runCompatChatRequest({
        fetchImpl,
        token: tokenRecord.token,
        modelConfig,
        prompt,
        traceId,
        logger,
        route,
      });
      const answer = chatResult.answer;

      tokenRecord.balance = Math.max(0, normalizeBalance(tokenRecord.balance) - modelConfig.cost);
      const tokenUsage = {
        tokenId: tokenRecord.id,
        email: tokenRecord.email || '',
        balanceBefore,
        balanceAfter: normalizeBalance(tokenRecord.balance),
        cost: modelConfig.cost,
      };
      await writeTokenRecords(tokensFile, tokens);

      if (reqData.stream) {
        const streamPayload = {
          id: `msg_${Date.now()}`,
          model: modelName,
          prompt,
          text: answer,
          stream: true,
        };
        logCompat(logger, 'INFO', {
          event: 'compat.response',
          route,
          method,
          traceId,
          statusCode: 200,
          durationMs: Date.now() - startedAt,
          response: streamPayload,
          tokenUsage,
        });
        return sendAnthropicCompatStream(response, streamPayload);
      }

      return sendCompatJson({
        logger,
        sendJson,
        response,
        route,
        method,
        traceId,
        startedAt,
        statusCode: 200,
        payload: {
          id: `msg_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          model: modelName,
          content: [{ type: 'text', text: answer }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: prompt.length,
            output_tokens: answer.length,
          },
        },
        logFields: { tokenUsage },
      });
    } catch (error) {
      logCompatError(logger, { route, method, traceId, startedAt, payload: reqData, serializeError, error });
      throw error;
    }
  }
}

module.exports = {
  handleCompatApiRoutes,
};
