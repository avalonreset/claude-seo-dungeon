/**
 * WebSocket client for communicating with the bridge server.
 */
export class BridgeClient {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.requestId = 0;
  }

  connect(url = 'ws://localhost:3001') {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const handler = this.handlers.get(data.id);
        if (handler) {
          if (data.type === 'stream') {
            handler.onStream?.(data.content);
          } else if (data.type === 'result') {
            handler.resolve(data);
            this.handlers.delete(data.id);
          } else if (data.type === 'error') {
            handler.reject(new Error(data.message));
            this.handlers.delete(data.id);
          }
        }
      };
    });
  }

  /**
   * Send a command to Claude CLI via the bridge.
   * @param {string} command - The prompt/command to send
   * @param {object} opts - Options like { onStream }
   * @returns {Promise<object>} The result
   */
  send(command, opts = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.handlers.set(id, { resolve, reject, onStream: opts.onStream });
      this.ws.send(JSON.stringify({ id, command }));
    });
  }

  /**
   * Run an SEO audit on a domain.
   */
  audit(domain, onStream) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.handlers.set(id, { resolve, reject, onStream });
      this.ws.send(JSON.stringify({ id, type: 'audit', command: domain }));
    });
  }

  /**
   * Fix a specific SEO issue.
   */
  fix(issue, onStream) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.handlers.set(id, { resolve, reject, onStream });
      this.ws.send(JSON.stringify({ id, type: 'fix', command: `${issue.title}: ${issue.description}` }));
    });
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

// Singleton
export const bridge = new BridgeClient();
