import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import destr from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/destr/dist/index.mjs';
import { defineEventHandler, handleCacheHeaders, splitCookiesString, createEvent, fetchWithEvent, isEvent, eventHandler, setHeaders, sendRedirect, proxyRequest, getRequestURL, setResponseStatus, getResponseHeader, setResponseHeaders, send, getRequestHeader, removeResponseHeader, createError, appendResponseHeader, setResponseHeader, createApp, createRouter as createRouter$1, toNodeListener, lazyEventHandler } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/nitropack/node_modules/h3/dist/index.mjs';
import { createHooks } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/hookable/dist/index.mjs';
import { createFetch, Headers as Headers$1 } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/ofetch/dist/node.mjs';
import { fetchNodeRequestHandler, callNodeRequestHandler } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/node-mock-http/dist/index.mjs';
import { parseURL, withoutBase, joinURL, getQuery, withQuery, decodePath, withLeadingSlash, withoutTrailingSlash } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/ufo/dist/index.mjs';
import { createStorage, prefixStorage } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unstorage/drivers/fs.mjs';
import unstorage_47drivers_47fs_45lite from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unstorage/drivers/fs-lite.mjs';
import { digest } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/ohash/dist/index.mjs';
import { klona } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/klona/dist/index.mjs';
import defu, { defuFn } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/defu/dist/defu.mjs';
import { snakeCase } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/scule/dist/index.mjs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unctx/dist/index.mjs';
import { toRouteMatcher, createRouter } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/radix3/dist/index.mjs';
import _Fw9auKuNYkyAV10smX4s6LtqhhUsYhiqMVByM1txbw from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/vinxi/lib/app-fetch.js';
import _QBsNiqmZfFiwbRHSSHbTtbZFCVqcaLJnlLdqybh5O8 from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/vinxi/lib/app-manifest.js';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/pathe/dist/index.mjs';
import { parseSetCookie } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/cookie-es/dist/index.mjs';
import { sharedConfig, lazy, createComponent, catchError, onCleanup } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/solid-js/dist/server.js';
import { renderToString, isServer, getRequestEvent, ssrElement, escape, mergeProps, ssr, createComponent as createComponent$1, ssrHydrationKey, NoHydration, ssrAttribute } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/solid-js/web/dist/server.js';
import { provideRequestEvent } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/solid-js/web/storage/dist/storage.js';
import { eventHandler as eventHandler$1, H3Event, getRequestIP, parseCookies, getResponseStatus, getResponseStatusText, getCookie, setCookie, getResponseHeader as getResponseHeader$1, setResponseHeader as setResponseHeader$1, removeResponseHeader as removeResponseHeader$1, getResponseHeaders, getRequestURL as getRequestURL$1, getRequestWebStream, setResponseStatus as setResponseStatus$1, appendResponseHeader as appendResponseHeader$1, setHeader, sendRedirect as sendRedirect$1 } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/h3/dist/index.mjs';
import { fromJSON, Feature, crossSerializeStream, getCrossReferenceHeader, toCrossJSONStream } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/seroval/dist/esm/production/index.mjs';
import { AbortSignalPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/seroval-plugins/dist/esm/production/web.mjs';

const serverAssets = [{"baseName":"server","dir":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));
storage.mount('root', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/workspace/Farsight.Rpc/Farsight.Rpc.Web"}));
storage.mount('src', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/workspace/Farsight.Rpc/Farsight.Rpc.Web"}));
storage.mount('build', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/.vinxi"}));
storage.mount('cache', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/.vinxi/cache"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const inlineAppConfig = {};



const appConfig$1 = defuFn(inlineAppConfig);

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/"
  },
  "nitro": {
    "routeRules": {
      "/_build/assets/**": {
        "headers": {
          "cache-control": "public, immutable, max-age=31536000"
        }
      }
    }
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  {
    return _sharedRuntimeConfig;
  }
}
_deepFreeze(klona(appConfig$1));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

const nitroAsyncContext = getContext("nitro-app", {
  asyncContext: true,
  AsyncLocalStorage: AsyncLocalStorage 
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$0 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const appConfig = {"name":"vinxi","routers":[{"name":"public","type":"static","base":"/","dir":"./public","root":"/workspace/Farsight.Rpc/Farsight.Rpc.Web","order":0,"outDir":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/.vinxi/build/public"},{"name":"ssr","type":"http","link":{"client":"client"},"handler":"src/entry-server.tsx","extensions":["js","jsx","ts","tsx"],"target":"server","root":"/workspace/Farsight.Rpc/Farsight.Rpc.Web","base":"/","outDir":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/.vinxi/build/ssr","order":1},{"name":"client","type":"client","base":"/_build","handler":"src/entry-client.tsx","extensions":["js","jsx","ts","tsx"],"target":"browser","root":"/workspace/Farsight.Rpc/Farsight.Rpc.Web","outDir":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/.vinxi/build/client","order":2},{"name":"server-fns","type":"http","base":"/_server","handler":"node_modules/@solidjs/start/dist/runtime/server-handler.js","target":"server","root":"/workspace/Farsight.Rpc/Farsight.Rpc.Web","outDir":"/workspace/Farsight.Rpc/Farsight.Rpc.Web/.vinxi/build/server-fns","order":3}],"server":{"compressPublicAssets":{"brotli":true},"routeRules":{"/_build/assets/**":{"headers":{"cache-control":"public, immutable, max-age=31536000"}}},"experimental":{"asyncContext":true},"prerender":{}},"root":"/workspace/Farsight.Rpc/Farsight.Rpc.Web"};
					const buildManifest = {"ssr":{"virtual:$vinxi/handler/ssr":{"file":"ssr.js","name":"ssr","src":"virtual:$vinxi/handler/ssr","isEntry":true}},"client":{"_EndpointForm-jIATFrG2.js":{"file":"assets/EndpointForm-jIATFrG2.js","name":"EndpointForm","imports":["_auth-gpJMB9pH.js"]},"_api-Cxp6B5Vu.js":{"file":"assets/api-Cxp6B5Vu.js","name":"api","imports":["_auth-gpJMB9pH.js"]},"_auth-gpJMB9pH.js":{"file":"assets/auth-gpJMB9pH.js","name":"auth"},"_components-CXbdzZni.js":{"file":"assets/components-CXbdzZni.js","name":"components","imports":["_auth-gpJMB9pH.js","_routing-CDknN625.js"]},"_routing-CDknN625.js":{"file":"assets/routing-CDknN625.js","name":"routing","imports":["_auth-gpJMB9pH.js"]},"src/routes/admin.tsx?pick=default&pick=$css":{"file":"assets/admin-MXnfNDXC.js","name":"admin","src":"src/routes/admin.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js"]},"src/routes/applications.tsx?pick=default&pick=$css":{"file":"assets/applications-BJJQOqY0.js","name":"applications","src":"src/routes/applications.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js"]},"src/routes/chains.tsx?pick=default&pick=$css":{"file":"assets/chains-DcVx3YcT.js","name":"chains","src":"src/routes/chains.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js"]},"src/routes/endpoints/edit.tsx?pick=default&pick=$css":{"file":"assets/edit-60SXpZzx.js","name":"edit","src":"src/routes/endpoints/edit.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_EndpointForm-jIATFrG2.js","_api-Cxp6B5Vu.js","_routing-CDknN625.js"]},"src/routes/endpoints/index.tsx?pick=default&pick=$css":{"file":"assets/index-F80NEF7X.js","name":"index","src":"src/routes/endpoints/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js","_components-CXbdzZni.js","_routing-CDknN625.js"]},"src/routes/endpoints/new.tsx?pick=default&pick=$css":{"file":"assets/new-DnxmdIhE.js","name":"new","src":"src/routes/endpoints/new.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_EndpointForm-jIATFrG2.js","_api-Cxp6B5Vu.js","_routing-CDknN625.js"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"assets/index-DTcYxbtf.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js","_components-CXbdzZni.js","_routing-CDknN625.js"]},"src/routes/login.tsx?pick=default&pick=$css":{"file":"assets/login-DlYzXFu7.js","name":"login","src":"src/routes/login.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js","_routing-CDknN625.js"]},"src/routes/providers-admin.tsx?pick=default&pick=$css":{"file":"assets/providers-admin-CNtHpKvh.js","name":"providers-admin","src":"src/routes/providers-admin.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_auth-gpJMB9pH.js","_api-Cxp6B5Vu.js"]},"virtual:$vinxi/handler/client":{"file":"assets/client-BDo9y854.js","name":"client","src":"virtual:$vinxi/handler/client","isEntry":true,"imports":["_auth-gpJMB9pH.js","_routing-CDknN625.js","_components-CXbdzZni.js"],"dynamicImports":["src/routes/admin.tsx?pick=default&pick=$css","src/routes/applications.tsx?pick=default&pick=$css","src/routes/chains.tsx?pick=default&pick=$css","src/routes/endpoints/edit.tsx?pick=default&pick=$css","src/routes/endpoints/index.tsx?pick=default&pick=$css","src/routes/endpoints/new.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/login.tsx?pick=default&pick=$css","src/routes/providers-admin.tsx?pick=default&pick=$css"],"css":["assets/client-CfwEKjV3.css"]}},"server-fns":{"_server-fns-CT9cwr8v.js":{"file":"assets/server-fns-CT9cwr8v.js","name":"server-fns","dynamicImports":["src/app.tsx"]},"src/app.tsx":{"file":"assets/app-1j3tNlt-.js","name":"app","src":"src/app.tsx","isDynamicEntry":true,"imports":["_server-fns-CT9cwr8v.js"],"css":["assets/app-CfwEKjV3.css"]},"virtual:$vinxi/handler/server-fns":{"file":"server-fns.js","name":"server-fns","src":"virtual:$vinxi/handler/server-fns","isEntry":true,"imports":["_server-fns-CT9cwr8v.js"]}}};

					const routeManifest = {"ssr":{},"client":{},"server-fns":{}};

        function createProdApp(appConfig) {
          return {
            config: { ...appConfig, buildManifest, routeManifest },
            getRouter(name) {
              return appConfig.routers.find(router => router.name === name)
            }
          }
        }

        function plugin(app) {
          const prodApp = createProdApp(appConfig);
          globalThis.app = prodApp;
        }

const chunks = {};
			 



			 function app() {
				 globalThis.$$chunks = chunks;
			 }

const plugins = [
  plugin,
_Fw9auKuNYkyAV10smX4s6LtqhhUsYhiqMVByM1txbw,
_QBsNiqmZfFiwbRHSSHbTtbZFCVqcaLJnlLdqybh5O8,
app
];

const assets = {
  "/_build/.vite/manifest.json": {
    "type": "application/json",
    "encoding": null,
    "etag": "\"1262-C6IjnXe7g7gqIHKIPR3WX4cVfZI\"",
    "mtime": "2026-04-08T22:53:09.027Z",
    "size": 4706,
    "path": "../../.output/public/_build/.vite/manifest.json"
  },
  "/_server/assets/app-CfwEKjV3.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"430-SrJF1pnsHmmDfbFcTQ50dL3Mf/c\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 1072,
    "path": "../../.output/public/_server/assets/app-CfwEKjV3.css.br"
  },
  "/_build/.vite/manifest.json.gz": {
    "type": "application/json",
    "encoding": "gzip",
    "etag": "\"2a4-V8LuvGAPGB9MwFz24NGtyiTzYwA\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 676,
    "path": "../../.output/public/_build/.vite/manifest.json.gz"
  },
  "/_server/assets/app-CfwEKjV3.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"508-bWK0uGZWQl3uvd4wQjCzV/KOrBc\"",
    "mtime": "2026-04-08T22:53:09.093Z",
    "size": 1288,
    "path": "../../.output/public/_server/assets/app-CfwEKjV3.css.gz"
  },
  "/_build/assets/EndpointForm-jIATFrG2.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"373-VSl7mw2njG+Q2OkoiSYR6zdsEWA\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 883,
    "path": "../../.output/public/_build/assets/EndpointForm-jIATFrG2.js.br"
  },
  "/_build/.vite/manifest.json.br": {
    "type": "application/json",
    "encoding": "br",
    "etag": "\"26b-pXTDiU9oT5Y2zG5a4tLw3gjVesk\"",
    "mtime": "2026-04-08T22:53:09.096Z",
    "size": 619,
    "path": "../../.output/public/_build/.vite/manifest.json.br"
  },
  "/_build/assets/EndpointForm-jIATFrG2.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"f8d-vlA7NkVPA/N/nxLbGvNQvGbUoOQ\"",
    "mtime": "2026-04-08T22:53:09.030Z",
    "size": 3981,
    "path": "../../.output/public/_build/assets/EndpointForm-jIATFrG2.js"
  },
  "/_build/assets/admin-MXnfNDXC.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"58c-VGbj32ydR4ghTjCE5WVsewuXNCM\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 1420,
    "path": "../../.output/public/_build/assets/admin-MXnfNDXC.js.gz"
  },
  "/_build/assets/EndpointForm-jIATFrG2.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"3ed-++S9rWRTK338GaSIQDBDcNkt64A\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 1005,
    "path": "../../.output/public/_build/assets/EndpointForm-jIATFrG2.js.gz"
  },
  "/_server/assets/app-CfwEKjV3.css": {
    "type": "text/css; charset=utf-8",
    "encoding": null,
    "etag": "\"c55-7T4jCV4084Wlr5i+VJdA0xVrREc\"",
    "mtime": "2026-04-08T22:53:09.053Z",
    "size": 3157,
    "path": "../../.output/public/_server/assets/app-CfwEKjV3.css"
  },
  "/_build/assets/admin-MXnfNDXC.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"dae-+0aiBsqKbEjvScftqp5yvsM2pCg\"",
    "mtime": "2026-04-08T22:53:09.031Z",
    "size": 3502,
    "path": "../../.output/public/_build/assets/admin-MXnfNDXC.js"
  },
  "/_build/assets/api-Cxp6B5Vu.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"37a-I/MNWgTHhQKFNPbbnfIZSamEOxQ\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 890,
    "path": "../../.output/public/_build/assets/api-Cxp6B5Vu.js.br"
  },
  "/_build/assets/admin-MXnfNDXC.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"4b3-wo3VZar79WJ2Y+4H8gb25DwkT1Q\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 1203,
    "path": "../../.output/public/_build/assets/admin-MXnfNDXC.js.br"
  },
  "/_build/assets/api-Cxp6B5Vu.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"3ff-VeJCG5JAn4QPPZwZq38UJcie5Cc\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 1023,
    "path": "../../.output/public/_build/assets/api-Cxp6B5Vu.js.gz"
  },
  "/_build/assets/applications-BJJQOqY0.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"71d-tfMJWtJze3cCocL99pWp5HMqRBs\"",
    "mtime": "2026-04-08T22:53:09.026Z",
    "size": 1821,
    "path": "../../.output/public/_build/assets/applications-BJJQOqY0.js"
  },
  "/_build/assets/api-Cxp6B5Vu.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"a6c-OoG5Q9QS6Jhtyq78jzWdT92cbDI\"",
    "mtime": "2026-04-08T22:53:09.034Z",
    "size": 2668,
    "path": "../../.output/public/_build/assets/api-Cxp6B5Vu.js"
  },
  "/_build/assets/auth-gpJMB9pH.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"63ab-ULnVLWFqdvqArGhKs6Ug04BVR5U\"",
    "mtime": "2026-04-08T22:53:09.031Z",
    "size": 25515,
    "path": "../../.output/public/_build/assets/auth-gpJMB9pH.js"
  },
  "/_build/assets/applications-BJJQOqY0.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"38c-dqYL1G0pRS3+z037KpGbaEz+sv8\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 908,
    "path": "../../.output/public/_build/assets/applications-BJJQOqY0.js.gz"
  },
  "/_build/assets/chains-DcVx3YcT.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"6dd-bYgm/W7OMGwzEu5HwWbYXA55oMk\"",
    "mtime": "2026-04-08T22:53:09.028Z",
    "size": 1757,
    "path": "../../.output/public/_build/assets/chains-DcVx3YcT.js"
  },
  "/_build/assets/applications-BJJQOqY0.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"315-NCHwVIC0urLVtCqmjDX/wAoRCpg\"",
    "mtime": "2026-04-08T22:53:09.097Z",
    "size": 789,
    "path": "../../.output/public/_build/assets/applications-BJJQOqY0.js.br"
  },
  "/_build/assets/auth-gpJMB9pH.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"22d2-mJkNAHGc03VnC4AOuqRg/fWw+8c\"",
    "mtime": "2026-04-08T22:53:09.101Z",
    "size": 8914,
    "path": "../../.output/public/_build/assets/auth-gpJMB9pH.js.br"
  },
  "/_build/assets/chains-DcVx3YcT.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"37e-KbMKs5BI+pmMfwYdWuFREeo8K2U\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 894,
    "path": "../../.output/public/_build/assets/chains-DcVx3YcT.js.gz"
  },
  "/_build/assets/chains-DcVx3YcT.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"311-Ddv/rQpbOSu0kx9CKVLwPCRMhjQ\"",
    "mtime": "2026-04-08T22:53:09.094Z",
    "size": 785,
    "path": "../../.output/public/_build/assets/chains-DcVx3YcT.js.br"
  },
  "/_build/assets/client-BDo9y854.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"4a7a-kTJtFK0K09K0jv0kBj8ZeoTHbqg\"",
    "mtime": "2026-04-08T22:53:09.029Z",
    "size": 19066,
    "path": "../../.output/public/_build/assets/client-BDo9y854.js"
  },
  "/_build/assets/auth-gpJMB9pH.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"2652-s6jj/0BssmzCWGylcFq4br2GebQ\"",
    "mtime": "2026-04-08T22:53:09.096Z",
    "size": 9810,
    "path": "../../.output/public/_build/assets/auth-gpJMB9pH.js.gz"
  },
  "/_build/assets/client-BDo9y854.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"1b34-6f0hXFZQngJMc+y5hovidZSGu84\"",
    "mtime": "2026-04-08T22:53:09.115Z",
    "size": 6964,
    "path": "../../.output/public/_build/assets/client-BDo9y854.js.gz"
  },
  "/_build/assets/client-BDo9y854.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"1873-rhM5JHPiA7BGV1iwJ0fhGU5lUwo\"",
    "mtime": "2026-04-08T22:53:09.121Z",
    "size": 6259,
    "path": "../../.output/public/_build/assets/client-BDo9y854.js.br"
  },
  "/_build/assets/client-CfwEKjV3.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"430-SrJF1pnsHmmDfbFcTQ50dL3Mf/c\"",
    "mtime": "2026-04-08T22:53:09.116Z",
    "size": 1072,
    "path": "../../.output/public/_build/assets/client-CfwEKjV3.css.br"
  },
  "/_build/assets/client-CfwEKjV3.css": {
    "type": "text/css; charset=utf-8",
    "encoding": null,
    "etag": "\"c55-7T4jCV4084Wlr5i+VJdA0xVrREc\"",
    "mtime": "2026-04-08T22:53:09.033Z",
    "size": 3157,
    "path": "../../.output/public/_build/assets/client-CfwEKjV3.css"
  },
  "/_build/assets/client-CfwEKjV3.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"508-bWK0uGZWQl3uvd4wQjCzV/KOrBc\"",
    "mtime": "2026-04-08T22:53:09.114Z",
    "size": 1288,
    "path": "../../.output/public/_build/assets/client-CfwEKjV3.css.gz"
  },
  "/_build/assets/components-CXbdzZni.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33b-/gEbsSdH/8lug5Sw45kjHPUS6BE\"",
    "mtime": "2026-04-08T22:53:09.020Z",
    "size": 827,
    "path": "../../.output/public/_build/assets/components-CXbdzZni.js"
  },
  "/_build/assets/edit-60SXpZzx.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"3f0-xChyoUBVW+N8n6TcaCoO60444CE\"",
    "mtime": "2026-04-08T22:53:09.115Z",
    "size": 1008,
    "path": "../../.output/public/_build/assets/edit-60SXpZzx.js.br"
  },
  "/_build/assets/edit-60SXpZzx.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"986-Q+E0xL4koSq2dqqmI5lupNs4uog\"",
    "mtime": "2026-04-08T22:53:09.023Z",
    "size": 2438,
    "path": "../../.output/public/_build/assets/edit-60SXpZzx.js"
  },
  "/_build/assets/edit-60SXpZzx.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"4a5-mpnOFu85eK/wICZabx2GDwV3dDY\"",
    "mtime": "2026-04-08T22:53:09.114Z",
    "size": 1189,
    "path": "../../.output/public/_build/assets/edit-60SXpZzx.js.gz"
  },
  "/_build/assets/index-DTcYxbtf.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"1716-qowf48WoXBlfoXlyPy5vCJYrEyc\"",
    "mtime": "2026-04-08T22:53:09.023Z",
    "size": 5910,
    "path": "../../.output/public/_build/assets/index-DTcYxbtf.js"
  },
  "/_build/assets/index-DTcYxbtf.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"857-vheu8luvGzVa8N9O5lE9vXDVU2U\"",
    "mtime": "2026-04-08T22:53:09.119Z",
    "size": 2135,
    "path": "../../.output/public/_build/assets/index-DTcYxbtf.js.gz"
  },
  "/_build/assets/index-DTcYxbtf.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"728-enLRFkDfdeiHagZwQ0ky8tAeBCw\"",
    "mtime": "2026-04-08T22:53:09.120Z",
    "size": 1832,
    "path": "../../.output/public/_build/assets/index-DTcYxbtf.js.br"
  },
  "/_build/assets/index-F80NEF7X.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"45d-Ug8Co+r27JVRs5uZ6v/LyygqhSI\"",
    "mtime": "2026-04-08T22:53:09.118Z",
    "size": 1117,
    "path": "../../.output/public/_build/assets/index-F80NEF7X.js.br"
  },
  "/_build/assets/index-F80NEF7X.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"c58-+K/L3FEceIgIcP/kQattB8fDlzU\"",
    "mtime": "2026-04-08T22:53:09.021Z",
    "size": 3160,
    "path": "../../.output/public/_build/assets/index-F80NEF7X.js"
  },
  "/_build/assets/index-F80NEF7X.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"525-PQkR72rGM8AoPENoJrba8O68bXw\"",
    "mtime": "2026-04-08T22:53:09.116Z",
    "size": 1317,
    "path": "../../.output/public/_build/assets/index-F80NEF7X.js.gz"
  },
  "/_build/assets/login-DlYzXFu7.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"553-cDzP//XfvqY4yUbKac98V5AsXbw\"",
    "mtime": "2026-04-08T22:53:09.025Z",
    "size": 1363,
    "path": "../../.output/public/_build/assets/login-DlYzXFu7.js"
  },
  "/_build/assets/login-DlYzXFu7.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"27a-EJdKto45qOL/uJkixuf8yEPLLhY\"",
    "mtime": "2026-04-08T22:53:09.120Z",
    "size": 634,
    "path": "../../.output/public/_build/assets/login-DlYzXFu7.js.br"
  },
  "/_build/assets/login-DlYzXFu7.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"307-pl1mNZeA2htMWDwl7D3HrqQykUg\"",
    "mtime": "2026-04-08T22:53:09.120Z",
    "size": 775,
    "path": "../../.output/public/_build/assets/login-DlYzXFu7.js.gz"
  },
  "/_build/assets/new-DnxmdIhE.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"379-YuR46Tm4AkpdigVD2YhxwSi1Se8\"",
    "mtime": "2026-04-08T22:53:09.124Z",
    "size": 889,
    "path": "../../.output/public/_build/assets/new-DnxmdIhE.js.br"
  },
  "/_build/assets/new-DnxmdIhE.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"41e-t62iOi5gQnk+aM95unV6ABI8UUw\"",
    "mtime": "2026-04-08T22:53:09.121Z",
    "size": 1054,
    "path": "../../.output/public/_build/assets/new-DnxmdIhE.js.gz"
  },
  "/_build/assets/providers-admin-CNtHpKvh.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"9be-yOHBwqtpTpSjk16weE75d+eGoiM\"",
    "mtime": "2026-04-08T22:53:09.035Z",
    "size": 2494,
    "path": "../../.output/public/_build/assets/providers-admin-CNtHpKvh.js"
  },
  "/_build/assets/new-DnxmdIhE.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"7ae-mFOzb+xH4wJ9/C5s/b9yquuQtCs\"",
    "mtime": "2026-04-08T22:53:09.036Z",
    "size": 1966,
    "path": "../../.output/public/_build/assets/new-DnxmdIhE.js"
  },
  "/_build/assets/providers-admin-CNtHpKvh.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"45d-CmuRB1Ld6B4brdV8o0bF4r75A6w\"",
    "mtime": "2026-04-08T22:53:09.124Z",
    "size": 1117,
    "path": "../../.output/public/_build/assets/providers-admin-CNtHpKvh.js.gz"
  },
  "/_build/assets/providers-admin-CNtHpKvh.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"39b-eHCInB47Cw47pO+/Rr/W5zqcPOg\"",
    "mtime": "2026-04-08T22:53:09.124Z",
    "size": 923,
    "path": "../../.output/public/_build/assets/providers-admin-CNtHpKvh.js.br"
  },
  "/_build/assets/routing-CDknN625.js": {
    "type": "text/javascript; charset=utf-8",
    "encoding": null,
    "etag": "\"1eb9-HLZGTC6L8QvQGI3igvK0Va070ME\"",
    "mtime": "2026-04-08T22:53:09.020Z",
    "size": 7865,
    "path": "../../.output/public/_build/assets/routing-CDknN625.js"
  },
  "/_build/assets/routing-CDknN625.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"d16-BvswelsYX97KgrsGef6919Hwn1Q\"",
    "mtime": "2026-04-08T22:53:09.131Z",
    "size": 3350,
    "path": "../../.output/public/_build/assets/routing-CDknN625.js.br"
  },
  "/_build/assets/routing-CDknN625.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"e4a-/RCNNqQvG1hrFNc8/whZZYky4Pw\"",
    "mtime": "2026-04-08T22:53:09.125Z",
    "size": 3658,
    "path": "../../.output/public/_build/assets/routing-CDknN625.js.gz"
  }
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _ddrqq7 = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
function We$1(e) {
  let r;
  const t = W(e), n = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(t, { ...n, body: e.node.req.body }) : new Request(t, { ...n, get body() {
    return r || (r = Ge(e), r);
  } });
}
function _e$1(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: We$1(e), url: W(e) }, e.web.request;
}
function Ne() {
  return Qe();
}
const U = /* @__PURE__ */ Symbol("$HTTPEvent");
function Me(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[U]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function u(e) {
  return function(...r) {
    var _a;
    let t = r[0];
    if (Me(t)) r[0] = t instanceof H3Event || t.__is_event__ ? t : t[U];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (t = Ne(), !t) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      r.unshift(t);
    }
    return e(...r);
  };
}
const W = u(getRequestURL$1), je = u(getRequestIP), S$1 = u(setResponseStatus$1), P = u(getResponseStatus), De = u(getResponseStatusText), y = u(getResponseHeaders), k$1 = u(getResponseHeader$1), Be$1 = u(setResponseHeader$1), _ = u(appendResponseHeader$1), ze = u(parseCookies), Je = u(getCookie), Xe = u(setCookie), h = u(setHeader), Ge = u(getRequestWebStream), Ke = u(removeResponseHeader$1), Ve = u(_e$1);
function Ze() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Qe() {
  return Ze().use().event;
}
const b$1 = "Invariant Violation", { setPrototypeOf: Ye = function(e, r) {
  return e.__proto__ = r, e;
} } = Object;
let T$1 = class T extends Error {
  constructor(r = b$1) {
    super(typeof r == "number" ? `${b$1}: ${r} (see https://github.com/apollographql/invariant-packages)` : r);
    __publicField$1(this, "framesToPop", 1);
    __publicField$1(this, "name", b$1);
    Ye(this, T.prototype);
  }
};
function et(e, r) {
  if (!e) throw new T$1(r);
}
const v = "solidFetchEvent";
function tt(e) {
  return { request: Ve(e), response: at(e), clientAddress: je(e), locals: {}, nativeEvent: e };
}
function rt(e) {
  return { ...e };
}
function st(e) {
  if (!e.context[v]) {
    const r = tt(e);
    e.context[v] = r;
  }
  return e.context[v];
}
function E(e, r) {
  for (const [t, n] of r.entries()) _(e, t, n);
}
class nt {
  constructor(r) {
    __publicField$1(this, "event");
    this.event = r;
  }
  get(r) {
    const t = k$1(this.event, r);
    return Array.isArray(t) ? t.join(", ") : t || null;
  }
  has(r) {
    return this.get(r) !== null;
  }
  set(r, t) {
    return Be$1(this.event, r, t);
  }
  delete(r) {
    return Ke(this.event, r);
  }
  append(r, t) {
    _(this.event, r, t);
  }
  getSetCookie() {
    const r = k$1(this.event, "Set-Cookie");
    return Array.isArray(r) ? r : [r];
  }
  forEach(r) {
    return Object.entries(y(this.event)).forEach(([t, n]) => r(Array.isArray(n) ? n.join(", ") : n, t, this));
  }
  entries() {
    return Object.entries(y(this.event)).map(([r, t]) => [r, Array.isArray(t) ? t.join(", ") : t])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(y(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(y(this.event)).map((r) => Array.isArray(r) ? r.join(", ") : r)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function at(e) {
  return { get status() {
    return P(e);
  }, set status(r) {
    S$1(e, r);
  }, get statusText() {
    return De(e);
  }, set statusText(r) {
    S$1(e, P(e), r);
  }, headers: new nt(e) };
}
const N = [{ page: true, path: "/admin", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/admin.tsx" }, { page: true, path: "/applications", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/applications.tsx" }, { page: true, path: "/chains", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/chains.tsx" }, { page: true, path: "/endpoints/edit", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/endpoints/edit.tsx" }, { page: true, path: "/endpoints/", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/endpoints/index.tsx" }, { page: true, path: "/endpoints/new", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/endpoints/new.tsx" }, { page: true, path: "/", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/index.tsx" }, { page: true, path: "/login", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/login.tsx" }, { page: true, path: "/providers-admin", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/providers-admin.tsx" }], ot = it(N.filter((e) => e.page));
function it(e) {
  function r(t, n, a, o) {
    const i = Object.values(t).find((c) => a.startsWith(c.id + "/"));
    return i ? (r(i.children || (i.children = []), n, a.slice(i.id.length)), t) : (t.push({ ...n, id: a, path: a.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), t);
  }
  return e.sort((t, n) => t.path.length - n.path.length).reduce((t, n) => r(t, n, n.path, n.path), []);
}
function ct(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
createRouter({ routes: N.reduce((e, r) => {
  if (!ct(r)) return e;
  let t = r.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (n, a) => `**:${a}`).split("/").map((n) => n.startsWith(":") || n.startsWith("*") ? n : encodeURIComponent(n)).join("/");
  if (/:[^/]*\?/g.test(t)) throw new Error(`Optional parameters are not supported in API routes: ${t}`);
  if (e[t]) throw new Error(`Duplicate API routes for "${t}" found at "${e[t].route.path}" and "${r.path}"`);
  return e[t] = { route: r }, e;
}, {}) });
var lt = " ";
const pt = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(lt), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function dt(e, r) {
  let { tag: t, attrs: { key: n, ...a } = { key: void 0 }, children: o } = e;
  return pt[t]({ attrs: { ...a, nonce: r }, key: n, children: o });
}
function ft(e, r, t, n = "default") {
  return lazy(async () => {
    var _a;
    {
      const o = (await e.import())[n], c = (await ((_a = r.inputs) == null ? void 0 : _a[e.src].assets())).filter((l) => l.tag === "style" || l.attrs.rel === "stylesheet");
      return { default: (l) => [...c.map((g) => dt(g)), createComponent(o, l)] };
    }
  });
}
function M() {
  function e(t) {
    return { ...t, ...t.$$route ? t.$$route.require().route : void 0, info: { ...t.$$route ? t.$$route.require().route.info : {}, filesystem: true }, component: t.$component && ft(t.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: t.children ? t.children.map(e) : void 0 };
  }
  return ot.map(e);
}
let q$1;
const Ct = isServer ? () => getRequestEvent().routes : () => q$1 || (q$1 = M());
function ht(e) {
  const r = Je(e.nativeEvent, "flash");
  if (r) try {
    let t = JSON.parse(r);
    if (!t || !t.result) return;
    const n = [...t.input.slice(0, -1), new Map(t.input[t.input.length - 1])], a = t.error ? new Error(t.result) : t.result;
    return { input: n, url: t.url, pending: false, result: t.thrown ? void 0 : a, error: t.thrown ? a : void 0 };
  } catch (t) {
    console.error(t);
  } finally {
    Xe(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function gt(e) {
  const r = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await r.json(), assets: [...await r.inputs[r.handler].assets()], router: { submission: ht(e) }, routes: M(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const mt = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function Rt(e) {
  return e.status && mt.has(e.status) ? e.status : 302;
}
const yt = {}, F$1 = [AbortSignalPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin], St = 64, j = Feature.RegExp;
function D(e) {
  const r = new TextEncoder().encode(e), t = r.length, n = t.toString(16), a = "00000000".substring(0, 8 - n.length) + n, o = new TextEncoder().encode(`;0x${a};`), i = new Uint8Array(12 + t);
  return i.set(o), i.set(r, 12), i;
}
function H$1(e, r) {
  return new ReadableStream({ start(t) {
    crossSerializeStream(r, { scopeId: e, plugins: F$1, onSerialize(n, a) {
      t.enqueue(D(a ? `(${getCrossReferenceHeader(e)},${n})` : n));
    }, onDone() {
      t.close();
    }, onError(n) {
      t.error(n);
    } });
  } });
}
function wt(e) {
  return new ReadableStream({ start(r) {
    toCrossJSONStream(e, { disabledFeatures: j, depthLimit: St, plugins: F$1, onParse(t) {
      r.enqueue(D(JSON.stringify(t)));
    }, onDone() {
      r.close();
    }, onError(t) {
      r.error(t);
    } });
  } });
}
async function A(e) {
  return fromJSON(JSON.parse(e), { plugins: F$1, disabledFeatures: j });
}
async function bt(e) {
  const r = st(e), t = r.request, n = t.headers.get("X-Server-Id"), a = t.headers.get("X-Server-Instance"), o = t.headers.has("X-Single-Flight"), i = new URL(t.url);
  let c, d;
  if (n) et(typeof n == "string", "Invalid server function"), [c, d] = decodeURIComponent(n).split("#");
  else if (c = i.searchParams.get("id"), d = i.searchParams.get("name"), !c || !d) return new Response(null, { status: 404 });
  const l = yt[c];
  let g;
  if (!l) return new Response(null, { status: 404 });
  g = await l.importer();
  const B = g[l.functionName];
  let f = [];
  if (!a || e.method === "GET") {
    const s = i.searchParams.get("args");
    if (s) {
      const p = await A(s);
      for (const m of p) f.push(m);
    }
  }
  if (e.method === "POST") {
    const s = t.headers.get("content-type"), p = e.node.req, m = p instanceof ReadableStream, z = p.body instanceof ReadableStream, J = m && p.locked || z && p.body.locked, X = m ? p : p.body, w = J ? t : new Request(t, { ...t, body: X });
    t.headers.get("x-serialized") ? f = await A(await w.text()) : (s == null ? void 0 : s.startsWith("multipart/form-data")) || (s == null ? void 0 : s.startsWith("application/x-www-form-urlencoded")) ? f.push(await w.formData()) : (s == null ? void 0 : s.startsWith("application/json")) && (f = await w.json());
  }
  try {
    let s = await provideRequestEvent(r, async () => (sharedConfig.context = { event: r }, r.locals.serverFunctionMeta = { id: c + "#" + d }, B(...f)));
    if (o && a && (s = await L(r, s)), s instanceof Response) {
      if (s.headers && s.headers.has("X-Content-Raw")) return s;
      a && (s.headers && E(e, s.headers), s.status && (s.status < 300 || s.status >= 400) && S$1(e, s.status), s.customBody ? s = await s.customBody() : s.body == null && (s = null));
    }
    if (!a) return C(s, t, f);
    return h(e, "x-serialized", "true"), h(e, "content-type", "text/javascript"), H$1(a, s);
    return wt(s);
  } catch (s) {
    if (s instanceof Response) o && a && (s = await L(r, s)), s.headers && E(e, s.headers), s.status && (!a || s.status < 300 || s.status >= 400) && S$1(e, s.status), s.customBody ? s = s.customBody() : s.body == null && (s = null), h(e, "X-Error", "true");
    else if (a) {
      const p = s instanceof Error ? s.message : typeof s == "string" ? s : "true";
      h(e, "X-Error", p.replace(/[\r\n]+/g, ""));
    } else s = C(s, t, f, true);
    return a ? (h(e, "x-serialized", "true"), h(e, "content-type", "text/javascript"), H$1(a, s)) : s;
  }
}
function C(e, r, t, n) {
  const a = new URL(r.url), o = e instanceof Error;
  let i = 302, c;
  return e instanceof Response ? (c = new Headers(e.headers), e.headers.has("Location") && (c.set("Location", new URL(e.headers.get("Location"), a.origin + "").toString()), i = Rt(e))) : c = new Headers({ Location: new URL(r.headers.get("referer")).toString() }), e && c.append("Set-Cookie", `flash=${encodeURIComponent(JSON.stringify({ url: a.pathname + a.search, result: o ? e.message : e, thrown: n, error: o, input: [...t.slice(0, -1), [...t[t.length - 1].entries()]] }))}; Secure; HttpOnly;`), new Response(null, { status: i, headers: c });
}
let x$1;
function vt(e) {
  var _a;
  const r = new Headers(e.request.headers), t = ze(e.nativeEvent), n = e.response.headers.getSetCookie();
  r.delete("cookie");
  let a = false;
  return ((_a = e.nativeEvent.node) == null ? void 0 : _a.req) && (a = true, e.nativeEvent.node.req.headers.cookie = ""), n.forEach((o) => {
    if (!o) return;
    const { maxAge: i, expires: c, name: d, value: l } = parseSetCookie(o);
    if (i != null && i <= 0) {
      delete t[d];
      return;
    }
    if (c != null && c.getTime() <= Date.now()) {
      delete t[d];
      return;
    }
    t[d] = l;
  }), Object.entries(t).forEach(([o, i]) => {
    r.append("cookie", `${o}=${i}`), a && (e.nativeEvent.node.req.headers.cookie += `${o}=${i};`);
  }), r;
}
async function L(e, r) {
  let t, n = new URL(e.request.headers.get("referer")).toString();
  r instanceof Response && (r.headers.has("X-Revalidate") && (t = r.headers.get("X-Revalidate").split(",")), r.headers.has("Location") && (n = new URL(r.headers.get("Location"), new URL(e.request.url).origin + "").toString()));
  const a = rt(e);
  return a.request = new Request(n, { headers: vt(e) }), await provideRequestEvent(a, async () => {
    await gt(a), x$1 || (x$1 = (await import('../build/app-1j3tNlt-.mjs')).default), a.router.dataOnly = t || true, a.router.previousUrl = e.request.headers.get("referer");
    try {
      renderToString(() => {
        sharedConfig.context.event = a, x$1();
      });
    } catch (c) {
      console.log(c);
    }
    const o = a.router.data;
    if (!o) return r;
    let i = false;
    for (const c in o) o[c] === void 0 ? delete o[c] : i = true;
    return i && (r instanceof Response ? r.customBody && (o._$value = r.customBody()) : (o._$value = r, r = new Response(null, { status: 200 })), r.customBody = () => o, r.headers.set("X-Single-Flight", "true")), r;
  });
}
const Lt = eventHandler$1(bt);

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
const te = isServer ? (e) => {
  const t = getRequestEvent();
  return t.response.status = e.code, t.response.statusText = e.text, onCleanup(() => !t.nativeEvent.handled && !t.complete && (t.response.status = 200)), null;
} : (e) => null;
var re = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">500 | Internal Server Error</span>'];
const se = (e) => {
  let t = false;
  const r = catchError(() => e.children, (s) => {
    console.error(s), t = !!s;
  });
  return t ? [ssr(re, ssrHydrationKey()), createComponent$1(te, { code: 500 })] : r;
};
var ne = " ";
const ae = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(ne), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function oe(e, t) {
  let { tag: r, attrs: { key: s, ...a } = { key: void 0 }, children: n } = e;
  return ae[r]({ attrs: { ...a, nonce: t }, key: s, children: n });
}
var $ = ["<script", ">", "<\/script>"], x = ["<script", ' type="module"', "><\/script>"];
const ie = ssr("<!DOCTYPE html>");
function ce(e) {
  const t = getRequestEvent(), r = t.nonce;
  return createComponent$1(NoHydration, { get children() {
    return [ie, createComponent$1(se, { get children() {
      return createComponent$1(e.document, { get assets() {
        return t.assets.map((s) => oe(s));
      }, get scripts() {
        return r ? [ssr($, ssrHydrationKey() + ssrAttribute("nonce", escape(r, true), false), `window.manifest = ${JSON.stringify(t.manifest)}`), ssr(x, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))] : [ssr($, ssrHydrationKey(), `window.manifest = ${JSON.stringify(t.manifest)}`), ssr(x, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))];
      } });
    } })];
  } });
}
function ue(e) {
  let t;
  const r = F(e), s = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(r, { ...s, body: e.node.req.body }) : new Request(r, { ...s, get body() {
    return t || (t = ye(e), t);
  } });
}
function pe(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: ue(e), url: F(e) }, e.web.request;
}
function le() {
  return we();
}
const q = /* @__PURE__ */ Symbol("$HTTPEvent");
function de(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[q]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function o(e) {
  return function(...t) {
    var _a;
    let r = t[0];
    if (de(r)) t[0] = r instanceof H3Event || r.__is_event__ ? r : r[q];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (r = le(), !r) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      t.unshift(r);
    }
    return e(...t);
  };
}
const F = o(getRequestURL$1), he = o(getRequestIP), S = o(setResponseStatus$1), T = o(getResponseStatus), fe = o(getResponseStatusText), m = o(getResponseHeaders), H = o(getResponseHeader$1), ge = o(setResponseHeader$1), me = o(appendResponseHeader$1), Re = o(sendRedirect$1), ye = o(getRequestWebStream), be = o(removeResponseHeader$1), Ee = o(pe);
function ve() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function we() {
  return ve().use().event;
}
const k = [{ page: true, path: "/admin", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/admin.tsx" }, { page: true, path: "/applications", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/applications.tsx" }, { page: true, path: "/chains", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/chains.tsx" }, { page: true, path: "/endpoints/edit", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/endpoints/edit.tsx" }, { page: true, path: "/endpoints/", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/endpoints/index.tsx" }, { page: true, path: "/endpoints/new", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/endpoints/new.tsx" }, { page: true, path: "/", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/index.tsx" }, { page: true, path: "/login", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/login.tsx" }, { page: true, path: "/providers-admin", filePath: "/workspace/Farsight.Rpc/Farsight.Rpc.Web/src/routes/providers-admin.tsx" }];
$e(k.filter((e) => e.page));
function $e(e) {
  function t(r, s, a, n) {
    const c = Object.values(r).find((i) => a.startsWith(i.id + "/"));
    return c ? (t(c.children || (c.children = []), s, a.slice(c.id.length)), r) : (r.push({ ...s, id: a, path: a.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), r);
  }
  return e.sort((r, s) => r.path.length - s.path.length).reduce((r, s) => t(r, s, s.path, s.path), []);
}
function xe(e, t) {
  const r = Te.lookup(e);
  if (r && r.route) {
    const s = r.route, a = t === "HEAD" ? s.$HEAD || s.$GET : s[`$${t}`];
    if (a === void 0) return;
    const n = s.page === true && s.$component !== void 0;
    return { handler: a, params: r.params, isPage: n };
  }
}
function Se(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
const Te = createRouter({ routes: k.reduce((e, t) => {
  if (!Se(t)) return e;
  let r = t.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (s, a) => `**:${a}`).split("/").map((s) => s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s)).join("/");
  if (/:[^/]*\?/g.test(r)) throw new Error(`Optional parameters are not supported in API routes: ${r}`);
  if (e[r]) throw new Error(`Duplicate API routes for "${r}" found at "${e[r].route.path}" and "${t.path}"`);
  return e[r] = { route: t }, e;
}, {}) }), b = "solidFetchEvent";
function He(e) {
  return { request: Ee(e), response: qe(e), clientAddress: he(e), locals: {}, nativeEvent: e };
}
function Ae(e) {
  if (!e.context[b]) {
    const t = He(e);
    e.context[b] = t;
  }
  return e.context[b];
}
class Pe {
  constructor(t) {
    __publicField(this, "event");
    this.event = t;
  }
  get(t) {
    const r = H(this.event, t);
    return Array.isArray(r) ? r.join(", ") : r || null;
  }
  has(t) {
    return this.get(t) !== null;
  }
  set(t, r) {
    return ge(this.event, t, r);
  }
  delete(t) {
    return be(this.event, t);
  }
  append(t, r) {
    me(this.event, t, r);
  }
  getSetCookie() {
    const t = H(this.event, "Set-Cookie");
    return Array.isArray(t) ? t : [t];
  }
  forEach(t) {
    return Object.entries(m(this.event)).forEach(([r, s]) => t(Array.isArray(s) ? s.join(", ") : s, r, this));
  }
  entries() {
    return Object.entries(m(this.event)).map(([t, r]) => [t, Array.isArray(r) ? r.join(", ") : r])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(m(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(m(this.event)).map((t) => Array.isArray(t) ? t.join(", ") : t)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function qe(e) {
  return { get status() {
    return T(e);
  }, set status(t) {
    S(e, t);
  }, get statusText() {
    return fe(e);
  }, set statusText(t) {
    S(e, T(e), t);
  }, headers: new Pe(e) };
}
const Fe = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function ke(e) {
  return e.status && Fe.has(e.status) ? e.status : 302;
}
function Ce(e, t, r = {}, s) {
  return eventHandler$1({ handler: (a) => {
    const n = Ae(a);
    return provideRequestEvent(n, async () => {
      const c = xe(new URL(n.request.url).pathname, n.request.method);
      if (c) {
        const h = await c.handler.import(), R = n.request.method === "HEAD" ? h.HEAD || h.GET : h[n.request.method];
        n.params = c.params || {}, sharedConfig.context = { event: n };
        const v = await R(n);
        if (v !== void 0) return v;
        if (n.request.method !== "GET") throw new Error(`API handler for ${n.request.method} "${n.request.url}" did not return a response.`);
        if (!c.isPage) return;
      }
      const i = await t(n), f = typeof r == "function" ? await r(i) : { ...r };
      f.mode, f.nonce && (i.nonce = f.nonce);
      {
        const h = renderToString(() => (sharedConfig.context.event = i, e(i)), f);
        if (i.complete = true, i.response && i.response.headers.get("Location")) {
          const R = ke(i.response);
          return Re(a, i.response.headers.get("Location"), R);
        }
        return h;
      }
    });
  } });
}
function We(e, t, r) {
  return Ce(e, _e, t);
}
async function _e(e) {
  const t = globalThis.MANIFEST.client;
  return Object.assign(e, { manifest: await t.json(), assets: [...await t.inputs[t.handler].assets()], routes: [], complete: false, $islands: /* @__PURE__ */ new Set() });
}
var Ie = ['<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Farsight RPC</title>', "</head>"], Oe = ["<html", ' lang="en">', '<body><div id="app">', "</div><!--$-->", "<!--/--></body></html>"];
const Be = We(() => createComponent$1(ce, { document: ({ assets: e, children: t, scripts: r }) => ssr(Oe, ssrHydrationKey(), createComponent$1(NoHydration, { get children() {
  return ssr(Ie, escape(e));
} }), escape(t), escape(r)) }));

const handlers = [
  { route: '', handler: _ddrqq7, lazy: false, middleware: true, method: undefined },
  { route: '/_server', handler: Lt, lazy: false, middleware: true, method: undefined },
  { route: '/', handler: Be, lazy: false, middleware: true, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter$1({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => callNodeRequestHandler(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return fetchNodeRequestHandler(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  {
    const _handler = h3App.handler;
    h3App.handler = (event) => {
      const ctx = { event };
      return nitroAsyncContext.callAsync(ctx, () => _handler(event));
    };
  }
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

const nitroApp = useNitroApp();
const localFetch = nitroApp.localFetch;
const closePrerenderer = () => nitroApp.hooks.callHook("close");
trapUnhandledNodeErrors();

export { Ct as C, closePrerenderer as c, localFetch as l };
//# sourceMappingURL=nitro.mjs.map
