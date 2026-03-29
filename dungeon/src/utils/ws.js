/**
 * WebSocket client for communicating with the bridge server.
 * Auto-reconnects on disconnect and exposes connection state.
 */
export class BridgeClient {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.requestId = 0;
    this.connected = false;
    this._url = 'ws://localhost:3001';
    this._reconnectTimer = null;
    this._onStatusChange = []; // callbacks: (connected: boolean) => void
  }

  /** Register a callback that fires whenever connection status changes. */
  onStatusChange(fn) {
    this._onStatusChange.push(fn);
    fn(this.connected); // fire immediately with current state
  }

  _setConnected(val) {
    if (this.connected === val) return;
    this.connected = val;
    for (const fn of this._onStatusChange) {
      try { fn(val); } catch (_) {}
    }
  }

  connect(url) {
    if (url) this._url = url;
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this._url);

      this.ws.onopen = () => {
        this._setConnected(true);
        this._clearReconnect();
        resolve();
      };

      this.ws.onerror = (err) => {
        if (!this.connected) reject(err);
      };

      this.ws.onclose = () => {
        this._setConnected(false);
        // Reject all pending handlers so callers don't hang forever
        for (const [id, handler] of this.handlers) {
          handler.reject(new Error('Bridge connection lost'));
          this.handlers.delete(id);
        }
        this._scheduleReconnect();
      };

      this.ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch (e) { console.warn('WS: bad JSON', e); return; }
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

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setInterval(() => {
      if (this.connected) { this._clearReconnect(); return; }
      console.log('Bridge: attempting reconnect...');
      try {
        this.connect().catch(() => {}); // swallow — onclose will retry again
      } catch (_) {}
    }, 3000);
  }

  _clearReconnect() {
    if (this._reconnectTimer) {
      clearInterval(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  _ensureOpen() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Bridge server is not connected. Start it with: npm run server');
    }
  }

  /**
   * Send a command to Claude CLI via the bridge.
   */
  send(command, opts = {}) {
    return new Promise((resolve, reject) => {
      try { this._ensureOpen(); } catch (e) { return reject(e); }
      const id = ++this.requestId;
      this.handlers.set(id, { resolve, reject, onStream: opts.onStream });
      this.ws.send(JSON.stringify({ id, command }));
    });
  }

  /**
   * Run an SEO audit on a domain.
   */
  audit(domain, projectPath, onStream, model) {
    return new Promise((resolve, reject) => {
      try { this._ensureOpen(); } catch (e) { return reject(e); }
      const id = ++this.requestId;
      this.activeAuditId = id;
      this.handlers.set(id, { resolve, reject, onStream });
      this.ws.send(JSON.stringify({ id, type: 'audit', command: domain, projectPath, model }));
    });
  }

  /**
   * Fix a specific SEO issue in the project.
   */
  fix(issue, projectPath, onStream, model) {
    return new Promise((resolve, reject) => {
      try { this._ensureOpen(); } catch (e) { return reject(e); }
      const id = ++this.requestId;
      this.handlers.set(id, { resolve, reject, onStream });
      this.ws.send(JSON.stringify({
        id,
        type: 'fix',
        command: `${issue.title}: ${issue.description}`,
        projectPath,
        model
      }));
    });
  }

  /**
   * Commit the current fix to git.
   */
  commit(message, projectPath, onStream, model) {
    return new Promise((resolve, reject) => {
      try { this._ensureOpen(); } catch (e) { return reject(e); }
      const id = ++this.requestId;
      this.handlers.set(id, { resolve, reject, onStream });
      this.ws.send(JSON.stringify({ id, type: 'commit', command: message, projectPath, model }));
    });
  }

  /**
   * Cancel a running request by its ID.
   */
  cancel(id) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ id, type: 'cancel' }));
    }
    const handler = this.handlers.get(id);
    if (handler) {
      handler.reject(new Error('Cancelled by user'));
      this.handlers.delete(id);
    }
  }

  /**
   * Cancel all pending requests.
   */
  cancelAll() {
    for (const [id] of this.handlers) {
      this.cancel(id);
    }
  }

  disconnect() {
    this._clearReconnect();
    if (this.ws) this.ws.close();
  }
}

// Singleton
export const bridge = new BridgeClient();
