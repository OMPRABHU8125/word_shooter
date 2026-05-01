// ============================================================
// words.js — Curated cyber-themed word lists by difficulty tier
// ============================================================

export const WORDS = {
  easy: [
    'bug', 'bit', 'hex', 'log', 'ram', 'cpu', 'api', 'url', 'ssh', 'dns',
    'tcp', 'sql', 'css', 'dom', 'git', 'npm', 'key', 'net', 'pin', 'zip',
    'tar', 'run', 'var', 'int', 'map', 'set', 'pop', 'arg', 'env', 'uid',
    'byte', 'node', 'ping', 'hash', 'loop', 'null', 'port', 'root', 'sudo',
    'bash', 'code', 'data', 'disk', 'file', 'grep', 'heap', 'json', 'kern',
    'link', 'lock', 'mask', 'pipe', 'poll', 'push', 'scan', 'swap', 'sync',
    'task', 'trap', 'unix', 'void', 'wiki', 'fork', 'bind', 'dump', 'echo',
    'exec', 'flag', 'gzip', 'host', 'init', 'ipv4', 'kill', 'load', 'mail',
    'nano', 'open', 'path', 'read', 'recv', 'seed', 'send', 'sock', 'sort',
    'spin', 'stat', 'stop', 'tail', 'test', 'time', 'type', 'user', 'wait'
  ],

  medium: [
    'cache', 'debug', 'proxy', 'query', 'token', 'crypt', 'block', 'crash',
    'patch', 'parse', 'regex', 'route', 'shell', 'stack', 'queue', 'chmod',
    'clone', 'codec', 'cursor', 'daemon', 'driver', 'encode', 'fetch',
    'frame', 'index', 'input', 'layer', 'merge', 'mkdir', 'mount', 'mutex',
    'nginx', 'oauth', 'pixel', 'redis', 'retry', 'scope', 'shard', 'slice',
    'spawn', 'state', 'stdin', 'store', 'table', 'throw', 'trace', 'trunk',
    'tuple', 'virus', 'yield', 'admin', 'array', 'async', 'await', 'class',
    'const', 'event', 'float', 'graph', 'match', 'print', 'raise', 'super',
    'while', 'break', 'catch', 'defer', 'delta', 'error', 'false', 'final',
    'inner', 'outer', 'panic', 'range', 'shift', 'sleep', 'value', 'watch'
  ],

  hard: [
    'firewall', 'protocol', 'overflow', 'compiler', 'callback', 'abstract',
    'database', 'debugger', 'endpoint', 'function', 'hashmap', 'instance',
    'iterator', 'keystore', 'listener', 'manifest', 'mutation', 'nullable',
    'observer', 'pipeline', 'platform', 'redirect', 'registry', 'resolver',
    'rollback', 'runtime', 'sandbox', 'segment', 'servlet', 'session',
    'sniffer', 'syslog', 'systemd', 'timeout', 'trigger', 'unicode',
    'virtual', 'webhook', 'ansible', 'backend', 'boolean', 'channel',
    'closure', 'context', 'decrypt', 'deployer', 'encrypt', 'exploit',
    'gateway', 'handler', 'inherit', 'jenkins', 'kubectl', 'logging',
    'malware', 'memcache', 'network', 'operand', 'package', 'payload',
    'pointer', 'process', 'promise', 'reboot', 'refactor', 'request',
    'response', 'reverse', 'rootkit', 'routing', 'runloop', 'scanner',
    'service', 'shellcode', 'snapshot', 'spyware', 'storage', 'symlink',
    'testing', 'threads', 'toolkit', 'trojan', 'upstream', 'variable',
    'version', 'watcher', 'xssguard', 'zeromq', 'daemon', 'compose'
  ]
};

/**
 * Get a random word based on difficulty level.
 * @param {number} difficulty — 0 to 1 scale (0 = easy, 1 = hard)
 * @returns {string}
 */
export function getRandomWord(difficulty) {
  let pool;
  if (difficulty < 0.33) {
    pool = WORDS.easy;
  } else if (difficulty < 0.66) {
    pool = WORDS.medium;
  } else {
    pool = WORDS.hard;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get a word that doesn't conflict with active enemy words.
 * Avoids two enemies starting with the same letter when possible.
 * @param {number} difficulty
 * @param {string[]} activeWords — words currently on screen
 * @returns {string}
 */
export function getUniqueWord(difficulty, activeWords) {
  const activeFirstChars = new Set(activeWords.map(w => w[0]));

  // Try up to 20 times to find a non-conflicting word
  for (let i = 0; i < 20; i++) {
    const word = getRandomWord(difficulty);
    if (!activeWords.includes(word) && !activeFirstChars.has(word[0])) {
      return word;
    }
  }

  // Fallback: just avoid exact duplicate
  for (let i = 0; i < 10; i++) {
    const word = getRandomWord(difficulty);
    if (!activeWords.includes(word)) return word;
  }

  return getRandomWord(difficulty);
}
