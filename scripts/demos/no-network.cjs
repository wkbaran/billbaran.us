// Preloaded (node --require) when a demo runs an app's own CLI: any outbound
// HTTP(S) request fails at once, so the build can never touch a live data API.
const { EventEmitter } = require('node:events');
for (const mod of ['http', 'https']) {
  const m = require(mod);
  const refuse = () => {
    const req = new EventEmitter();
    req.setTimeout = () => req;
    req.end = () => req;
    req.destroy = () => req;
    process.nextTick(() => req.emit('error', new Error('network disabled for demo build')));
    return req;
  };
  m.get = refuse;
  m.request = refuse;
}
globalThis.fetch = async () => { throw new Error('network disabled for demo build'); };
