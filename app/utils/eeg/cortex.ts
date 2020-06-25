/* eslint-disable no-underscore-dangle, camelcase */

/*
 * JS Cortex Wrapper
 * *****************
 *
 * This library is intended to make working with Cortex easier in Javascript.
 * We use it both in the browser and NodeJS code.
 *
 * It makes extensive use of Promises for flow control; all requests return a
 * Promise with their result.
 *
 * For the subscription types in Cortex, we use an event emitter. Each kind of
 * event (mot, eeg, etc) is emitted as its own event that you can listen for
 * whether or not there are any active subscriptions at the time.
 *
 * The API methods are defined by using Cortex"s inspectApi call. We mostly
 * just pass information back and forth without doing much with it, with the
 * exception of the login/auth flow, which we expose as the init() method.
 */
const WebSocket = require('ws');
const EventEmitter = require('events');

const CORTEX_URL = 'wss://localhost:6868';

const safeParse = msg => {
  try {
    return JSON.parse(msg);
  } catch (_) {
    return null;
  }
};

if (global.process) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

class JSONRPCError extends Error {
  constructor(err) {
    super(err.message);
    this.name = this.constructor.name;
    this.message = err.message;
    this.code = err.code;
  }
  toString() {
    return `${super.toString()} (${this.code})`;
  }
}

class Cortex extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.ws = new WebSocket(CORTEX_URL);
    this.msgId = 0;
    this.requests = {};
    this.streams = {};
    this.ws.addEventListener('message', this._onmsg.bind(this));
    this.ws.addEventListener('close', () => {
      this._log('ws: Socket closed');
    });
    this.verbose = options.verbose !== null ? options.verbose : 1;
    this.handleError = error => {
      throw new JSONRPCError(error);
    };

    this.ready = new Promise(
      resolve => this.ws.addEventListener('open', resolve),
      this.handleError
    )
      .then(() => this._log('ws: Socket opened'))
      .then(() => this.call('inspectApi'))
      .then(methods => {
        methods.forEach(m => {
          this.defineMethod(m.methodName, m.params);
        });
        this._log(`rpc: Added ${methods.length} methods from inspectApi`);
        return methods;
      });
  }
  _onmsg(msg) {
    const data = safeParse(msg.data);
    if (!data) return this._warn('unparseable message', msg);

    this._debug('ws: <-', msg.data);

    if ('id' in data) {
      const id = data.id;
      this._log(
        `[${id}] <-`,
        data.result ? 'success' : `error (${data.error.message})`
      );
      if (this.requests[id]) {
        this.requests[id](data.error, data.result);
      } else {
        this._warn('rpc: Got response for unknown id', id);
      }
    } else if ('sid' in data) {
      const dataKeys = Object.keys(data).filter(
        k => k !== 'sid' && k !== 'time' && Array.isArray(data[k])
      );
      dataKeys.forEach(
        k =>
          this.emit(k, data) || this._warn('no listeners for stream event', k)
      );
    } else {
      this._log('rpc: Unrecognised data', data);
    }
  }
  _warn(...msg) {
    if (this.verbose > 0) console.warn('[Cortex WARN]', ...msg);
  }
  _log(...msg) {
    if (this.verbose > 1) console.log('[Cortex LOG]', ...msg);
  }
  _debug(...msg) {
    if (this.verbose > 2) console.debug('[Cortex DEBUG]', ...msg);
  }
  init({ clientId, clientSecret, license, debit } = {}) {
    const token = this.getUserLogin()
      .then(users => {
        if (users.length === 0) {
          return Promise.reject(new Error('No logged in user'));
        }
        return this.requestAccess({ clientId, clientSecret });
      })
      .then(({ accessGranted }) => {
        if (!accessGranted) {
          return Promise.reject(
            new Error('Please approve this application in the EMOTIV app')
          );
        }
        return this.authorize({
          clientId,
          clientSecret,
          license,
          debit
        }).then(({ cortexToken }) => {
          this._log('init: Got auth token');
          this._debug('init: Auth token', cortexToken);
          this.cortexToken = cortexToken;
          return cortexToken;
        });
      });

    return token;
  }
  close() {
    return new Promise(resolve => {
      this.ws.close();
      this.ws.once('close', resolve);
    });
  }
  call(method, params = {}) {
    const id = this.msgId++;
    const msg = JSON.stringify({ jsonrpc: '2.0', method, params, id });
    this.ws.send(msg);
    this._log(`[${id}] -> ${method}`);

    this._debug('ws: ->', msg);
    return new Promise((resolve, reject) => {
      this.requests[id] = (err, data) => {
        delete this.requests[id];
        this._debug('rpc: err', err, 'data', data);
        if (err) return reject(new JSONRPCError(err));
        if (data) return resolve(data);
        return reject(new Error('Invalid JSON-RPC response'));
      };
    });
  }
  defineMethod(methodName, paramDefs = []) {
    if (this[methodName]) return;
    const needsAuth = paramDefs.some(p => p.name === 'cortexToken');
    const requiredParams = paramDefs.filter(p => p.required).map(p => p.name);

    this[methodName] = (params = {}) => {
      if (needsAuth && this.cortexToken && !params.cortexToken) {
        params = Object.assign({}, params, { cortexToken: this.cortexToken });
      }
      const missingParams = requiredParams.filter(p => params[p] == null);
      if (missingParams.length > 0) {
        return this.handleError(
          new Error(
            `Missing required params for ${methodName}: ${missingParams.join(
              ', '
            )}`
          )
        );
      }
      return this.call(methodName, params);
    };
  }
}

Cortex.JSONRPCError = JSONRPCError;

module.exports = Cortex;
