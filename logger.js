const fs = require('node:fs/promises');
const path = require('node:path');

function createLogger(options = {}) {
  const logsDir = options.logsDir || path.join(__dirname, 'logs');
  const consoleSink = options.console || console;
  const entries = [];
  let writeChain = Promise.resolve();

  const emit = (level, input) => {
    const entry = normalizeLogEntry(level, input);
    entries.push(entry);
    writeToConsole(consoleSink, entry);
    writeChain = writeChain
      .then(async () => {
        await fs.mkdir(logsDir, { recursive: true });
        const filePath = path.join(logsDir, `${entry.timestamp.slice(0, 10)}.log`);
        await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
      })
      .catch((error) => {
        writeConsoleLine(consoleSink, 'error', formatPrettyEntry(normalizeLogEntry('ERROR', {
          event: 'logger.write.error',
          message: error.message || String(error),
          traceId: entry.traceId,
        })));
      });
    return entry;
  };

  return {
    info(entry) {
      return emit('INFO', entry);
    },
    warn(entry) {
      return emit('WARN', entry);
    },
    error(entry) {
      return emit('ERROR', entry);
    },
    async flush() {
      await writeChain;
    },
    getEntries() {
      return entries.map((entry) => JSON.parse(JSON.stringify(entry)));
    },
  };
}

function normalizeLogEntry(level, input) {
  const base = input && typeof input === 'object' && !Array.isArray(input)
    ? { ...input }
    : { message: String(input) };

  const normalized = {
    timestamp: String(base.timestamp || new Date().toISOString()),
    level,
  };

  const preserveKeys = new Set(['event', 'route', 'method', 'url', 'traceId', 'endpointType', 'tokenUsage']);
  for (const [key, value] of Object.entries(base)) {
    if (key === 'timestamp' || key === 'level') {
      continue;
    }
    normalized[key] = normalizeValue(value, preserveKeys.has(key) || key === 'payload' || key === 'response');
  }

  return normalized;
}

function normalizeValue(value, preserveText) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (preserveText || value.length <= 12) {
      return value;
    }
    return `${value.slice(0, 6)}...${value.slice(-6)}`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof File !== 'undefined' && value instanceof File) {
    return {
      name: value.name,
      type: value.type,
      size: value.size,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, preserveText));
  }

  if (typeof value === 'object') {
    const normalized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      normalized[key] = normalizeValue(nestedValue, preserveText || key === 'payload' || key === 'response');
    }
    return normalized;
  }

  return String(value);
}

function formatPrettyEntry(entry) {
  const headerParts = [
    `[${entry.timestamp}]`,
    entry.level,
    entry.event || 'log',
  ];

  const lines = [headerParts.join(' ')];
  const preferredKeys = ['traceId', 'route', 'method', 'url', 'statusCode', 'ok', 'durationMs', 'message'];
  const rendered = new Set(['timestamp', 'level', 'event']);

  for (const key of preferredKeys) {
    if (!(key in entry)) {
      continue;
    }
    rendered.add(key);
    lines.push(`  ${key}: ${formatFieldValue(entry[key])}`);
  }

  for (const key of Object.keys(entry)) {
    if (rendered.has(key)) {
      continue;
    }
    lines.push(`  ${key}: ${formatFieldValue(entry[key])}`);
  }

  return lines.join('\n');
}

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const json = JSON.stringify(value, null, 2);
  return `\n${indentMultiline(json, '    ')}`;
}

function indentMultiline(text, indent) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => `${indent}${line}`)
    .join('\n');
}

function writeToConsole(consoleSink, entry) {
  const method = entry.level === 'ERROR'
    ? 'error'
    : entry.level === 'WARN'
      ? 'warn'
      : typeof consoleSink.info === 'function'
        ? 'info'
        : 'log';
  writeConsoleLine(consoleSink, method, formatPrettyEntry(entry));
}

function writeConsoleLine(consoleSink, method, message) {
  const target = consoleSink && typeof consoleSink[method] === 'function'
    ? consoleSink[method].bind(consoleSink)
    : console.log.bind(console);
  try {
    target(message);
  } catch {
  }
}

module.exports = {
  createLogger,
};
