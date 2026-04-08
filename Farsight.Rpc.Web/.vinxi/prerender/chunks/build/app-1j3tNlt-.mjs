import { createComponent, isServer, ssr, ssrHydrationKey, escape, getRequestEvent, delegateEvents, ssrElement, mergeProps as mergeProps$1 } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/solid-js/web/dist/server.js';
import { C as Ct$1 } from '../nitro/nitro.mjs';
import { Suspense, createSignal, onMount, onCleanup, Show, mergeProps, splitProps, createMemo, children, getOwner, sharedConfig, useContext, createRenderEffect, on, runWithOwner, createContext, untrack, createRoot, startTransition, resetErrorBoundaries, batch, createComponent as createComponent$1 } from 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/solid-js/dist/server.js';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/destr/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/nitropack/node_modules/h3/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/hookable/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/ofetch/dist/node.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/node-mock-http/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/ufo/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unstorage/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unstorage/drivers/fs.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/ohash/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/klona/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/defu/dist/defu.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/scule/dist/index.mjs';
import 'node:async_hooks';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/unctx/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/radix3/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/vinxi/lib/app-fetch.js';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/vinxi/lib/app-manifest.js';
import 'node:fs';
import 'node:url';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/pathe/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/cookie-es/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/solid-js/web/storage/dist/storage.js';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/h3/dist/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/seroval/dist/esm/production/index.mjs';
import 'file:///workspace/Farsight.Rpc/Farsight.Rpc.Web/node_modules/seroval-plugins/dist/esm/production/web.mjs';

function de() {
  let e = /* @__PURE__ */ new Set();
  function t(n) {
    return e.add(n), () => e.delete(n);
  }
  let r = false;
  function o(n, a) {
    if (r) return !(r = false);
    const s = { to: n, options: a, defaultPrevented: false, preventDefault: () => s.defaultPrevented = true };
    for (const i of e) i.listener({ ...s, from: i.location, retry: (c) => {
      c && (r = true), i.navigate(n, { ...a, resolve: false });
    } });
    return !s.defaultPrevented;
  }
  return { subscribe: t, confirm: o };
}
let J;
function Z() {
  (!window.history.state || window.history.state._depth == null) && window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, ""), J = window.history.state._depth;
}
isServer || Z();
function Ne(e) {
  return { ...e, _depth: window.history.state && window.history.state._depth };
}
function Me(e, t) {
  let r = false;
  return () => {
    const o = J;
    Z();
    const n = o == null ? null : J - o;
    if (r) {
      r = false;
      return;
    }
    n && t(n) ? (r = true, window.history.go(-n)) : e();
  };
}
const He = /^(?:[a-z0-9]+:)?\/\//i, Ve = /^\/+|(\/)\/+$/g, fe = "http://sr";
function O(e, t = false) {
  const r = e.replace(Ve, "$1");
  return r ? t || /^[?#]/.test(r) ? r : "/" + r : "";
}
function W(e, t, r) {
  if (He.test(t)) return;
  const o = O(e), n = r && O(r);
  let a = "";
  return !n || t.startsWith("/") ? a = o : n.toLowerCase().indexOf(o.toLowerCase()) !== 0 ? a = o + n : a = n, (a || "/") + O(t, !a);
}
function ze(e, t) {
  if (e == null) throw new Error(t);
  return e;
}
function Je(e, t) {
  return O(e).replace(/\/*(\*.*)?$/g, "") + O(t);
}
function me(e) {
  const t = {};
  return e.searchParams.forEach((r, o) => {
    o in t ? Array.isArray(t[o]) ? t[o].push(r) : t[o] = [t[o], r] : t[o] = r;
  }), t;
}
function Ge(e, t, r) {
  const [o, n] = e.split("/*", 2), a = o.split("/").filter(Boolean), s = a.length;
  return (i) => {
    const c = i.split("/").filter(Boolean), u = c.length - s;
    if (u < 0 || u > 0 && n === void 0 && !t) return null;
    const f = { path: s ? "" : "/", params: {} }, v = (m) => r === void 0 ? void 0 : r[m];
    for (let m = 0; m < s; m++) {
      const g = a[m], y = g[0] === ":", l = y ? c[m] : c[m].toLowerCase(), h = y ? g.slice(1) : g.toLowerCase();
      if (y && z(l, v(h))) f.params[h] = l;
      else if (y || !z(l, h)) return null;
      f.path += `/${l}`;
    }
    if (n) {
      const m = u ? c.slice(-u).join("/") : "";
      if (z(m, v(n))) f.params[n] = m;
      else return null;
    }
    return f;
  };
}
function z(e, t) {
  const r = (o) => o === e;
  return t === void 0 ? true : typeof t == "string" ? r(t) : typeof t == "function" ? t(e) : Array.isArray(t) ? t.some(r) : t instanceof RegExp ? t.test(e) : false;
}
function Xe(e) {
  const [t, r] = e.pattern.split("/*", 2), o = t.split("/").filter(Boolean);
  return o.reduce((n, a) => n + (a.startsWith(":") ? 2 : 3), o.length - (r === void 0 ? 0 : 1));
}
function pe(e) {
  const t = /* @__PURE__ */ new Map(), r = getOwner();
  return new Proxy({}, { get(o, n) {
    return t.has(n) || runWithOwner(r, () => t.set(n, createMemo(() => e()[n]))), t.get(n)();
  }, getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  }, ownKeys() {
    return Reflect.ownKeys(e());
  }, has(o, n) {
    return n in e();
  } });
}
function ge(e) {
  let t = /(\/?\:[^\/]+)\?/.exec(e);
  if (!t) return [e];
  let r = e.slice(0, t.index), o = e.slice(t.index + t[0].length);
  const n = [r, r += t[1]];
  for (; t = /^(\/\:[^\/]+)\?/.exec(o); ) n.push(r += t[1]), o = o.slice(t[0].length);
  return ge(o).reduce((a, s) => [...a, ...n.map((i) => i + s)], []);
}
const Ye = 100, we = createContext(), ee = createContext(), N = () => ze(useContext(we), "<A> and 'use' router primitives can be only used inside a Route."), Qe = () => useContext(ee) || N().base, Ze = (e) => {
  const t = Qe();
  return createMemo(() => t.resolvePath(e()));
}, et = (e) => {
  const t = N();
  return createMemo(() => {
    const r = e();
    return r !== void 0 ? t.renderPath(r) : r;
  });
}, ve = () => N().navigatorFactory(), be = () => N().location;
function tt(e, t = "") {
  const { component: r, preload: o, load: n, children: a, info: s } = e, i = !a || Array.isArray(a) && !a.length, c = { key: e, component: r, preload: o || n, info: s };
  return ye(e.path).reduce((u, f) => {
    for (const v of ge(f)) {
      const m = Je(t, v);
      let g = i ? m : m.split("/*", 1)[0];
      g = g.split("/").map((y) => y.startsWith(":") || y.startsWith("*") ? y : encodeURIComponent(y)).join("/"), u.push({ ...c, originalPath: f, pattern: g, matcher: Ge(g, !i, e.matchFilters) });
    }
    return u;
  }, []);
}
function nt(e, t = 0) {
  return { routes: e, score: Xe(e[e.length - 1]) * 1e4 - t, matcher(r) {
    const o = [];
    for (let n = e.length - 1; n >= 0; n--) {
      const a = e[n], s = a.matcher(r);
      if (!s) return null;
      o.unshift({ ...s, route: a });
    }
    return o;
  } };
}
function ye(e) {
  return Array.isArray(e) ? e : [e];
}
function Re(e, t = "", r = [], o = []) {
  const n = ye(e);
  for (let a = 0, s = n.length; a < s; a++) {
    const i = n[a];
    if (i && typeof i == "object") {
      i.hasOwnProperty("path") || (i.path = "");
      const c = tt(i, t);
      for (const u of c) {
        r.push(u);
        const f = Array.isArray(i.children) && i.children.length === 0;
        if (i.children && !f) Re(i.children, u.pattern, r, o);
        else {
          const v = nt([...r], o.length);
          o.push(v);
        }
        r.pop();
      }
    }
  }
  return r.length ? o : o.sort((a, s) => s.score - a.score);
}
function T(e, t) {
  for (let r = 0, o = e.length; r < o; r++) {
    const n = e[r].matcher(t);
    if (n) return n;
  }
  return [];
}
function rt(e, t, r) {
  const o = new URL(fe), n = createMemo((f) => {
    const v = e();
    try {
      return new URL(v, o);
    } catch {
      return console.error(`Invalid path ${v}`), f;
    }
  }, o, { equals: (f, v) => f.href === v.href }), a = createMemo(() => n().pathname), s = createMemo(() => n().search, true), i = createMemo(() => n().hash), c = () => "", u = on(s, () => me(n()));
  return { get pathname() {
    return a();
  }, get search() {
    return s();
  }, get hash() {
    return i();
  }, get state() {
    return t();
  }, get key() {
    return c();
  }, query: r ? r(u) : pe(u) };
}
let C;
function ot() {
  return C;
}
function at(e, t, r, o = {}) {
  const { signal: [n, a], utils: s = {} } = e, i = s.parsePath || ((d) => d), c = s.renderPath || ((d) => d), u = s.beforeLeave || de(), f = W("", o.base || "");
  if (f === void 0) throw new Error(`${f} is not a valid base path`);
  f && !n().value && a({ value: f, replace: true, scroll: false });
  const [v, m] = createSignal(false);
  let g;
  const y = (d, p) => {
    p.value === l() && p.state === b() || (g === void 0 && m(true), C = d, g = p, startTransition(() => {
      g === p && (h(g.value), w(g.state), resetErrorBoundaries(), isServer || S[1]((P) => P.filter((U) => U.pending)));
    }).finally(() => {
      g === p && batch(() => {
        C = void 0, d === "navigate" && Se(g), m(false), g = void 0;
      });
    }));
  }, [l, h] = createSignal(n().value), [b, w] = createSignal(n().state), E = rt(l, b, s.queryWrapper), A = [], S = createSignal(isServer ? xe() : []), q = createMemo(() => typeof o.transformUrl == "function" ? T(t(), o.transformUrl(E.pathname)) : T(t(), E.pathname)), te = () => {
    const d = q(), p = {};
    for (let P = 0; P < d.length; P++) Object.assign(p, d[P].params);
    return p;
  }, Le = s.paramsWrapper ? s.paramsWrapper(te, t) : pe(te), ne = { pattern: f, path: () => f, outlet: () => null, resolvePath(d) {
    return W(f, d);
  } };
  return createRenderEffect(on(n, (d) => y("native", d), { defer: true })), { base: ne, location: E, params: Le, isRouting: v, renderPath: c, parsePath: i, navigatorFactory: Ee, matches: q, beforeLeave: u, preloadRoute: Ce, singleFlight: o.singleFlight === void 0 ? true : o.singleFlight, submissions: S };
  function Ae(d, p, P) {
    untrack(() => {
      if (typeof p == "number") {
        p && (s.go ? s.go(p) : console.warn("Router integration does not support relative routing"));
        return;
      }
      const U = !p || p[0] === "?", { replace: $, resolve: F, scroll: B, state: _ } = { replace: false, resolve: !U, scroll: true, ...P }, k = F ? d.resolvePath(p) : W(U && E.pathname || "", p);
      if (k === void 0) throw new Error(`Path '${p}' is not a routable path`);
      if (A.length >= Ye) throw new Error("Too many redirects");
      const re = l();
      if (k !== re || _ !== b()) if (isServer) {
        const oe = getRequestEvent();
        oe && (oe.response = { status: 302, headers: new Headers({ Location: k }) }), a({ value: k, replace: $, scroll: B, state: _ });
      } else u.confirm(k, P) && (A.push({ value: re, replace: $, scroll: B, state: b() }), y("navigate", { value: k, state: _ }));
    });
  }
  function Ee(d) {
    return d = d || useContext(ee) || ne, (p, P) => Ae(d, p, P);
  }
  function Se(d) {
    const p = A[0];
    p && (a({ ...d, replace: p.replace, scroll: p.scroll }), A.length = 0);
  }
  function Ce(d, p) {
    const P = T(t(), d.pathname), U = C;
    C = "preload";
    for (let $ in P) {
      const { route: F, params: B } = P[$];
      F.component && F.component.preload && F.component.preload();
      const { preload: _ } = F;
      p && _ && runWithOwner(r(), () => _({ params: B, location: { pathname: d.pathname, search: d.search, hash: d.hash, query: me(d), state: null, key: "" }, intent: "preload" }));
    }
    C = U;
  }
  function xe() {
    const d = getRequestEvent();
    return d && d.router && d.router.submission ? [d.router.submission] : [];
  }
}
function st(e, t, r, o) {
  const { base: n, location: a, params: s } = e, { pattern: i, component: c, preload: u } = o().route, f = createMemo(() => o().path);
  c && c.preload && c.preload();
  const v = u ? u({ params: s, location: a, intent: C || "initial" }) : void 0;
  return { parent: t, pattern: i, path: f, outlet: () => c ? createComponent$1(c, { params: s, location: a, data: v, get children() {
    return r();
  } }) : r(), resolvePath(g) {
    return W(n.path(), g, f());
  } };
}
const Pe = (e) => (t) => {
  const { base: r } = t, o = children(() => t.children), n = createMemo(() => Re(o(), t.base || ""));
  let a;
  const s = at(e, n, () => a, { base: r, singleFlight: t.singleFlight, transformUrl: t.transformUrl });
  return e.create && e.create(s), createComponent(we.Provider, { value: s, get children() {
    return createComponent(it, { routerState: s, get root() {
      return t.root;
    }, get preload() {
      return t.rootPreload || t.rootLoad;
    }, get children() {
      return [(a = getOwner()) && null, createComponent(ct, { routerState: s, get branches() {
        return n();
      } })];
    } });
  } });
};
function it(e) {
  const t = e.routerState.location, r = e.routerState.params, o = createMemo(() => e.preload && untrack(() => {
    e.preload({ params: r, location: t, intent: ot() || "initial" });
  }));
  return createComponent(Show, { get when() {
    return e.root;
  }, keyed: true, get fallback() {
    return e.children;
  }, children: (n) => createComponent(n, { params: r, location: t, get data() {
    return o();
  }, get children() {
    return e.children;
  } }) });
}
function ct(e) {
  if (isServer) {
    const n = getRequestEvent();
    if (n && n.router && n.router.dataOnly) {
      ut(n, e.routerState, e.branches);
      return;
    }
    n && ((n.router || (n.router = {})).matches || (n.router.matches = e.routerState.matches().map(({ route: a, path: s, params: i }) => ({ path: a.originalPath, pattern: a.pattern, match: s, params: i, info: a.info }))));
  }
  const t = [];
  let r;
  const o = createMemo(on(e.routerState.matches, (n, a, s) => {
    let i = a && n.length === a.length;
    const c = [];
    for (let u = 0, f = n.length; u < f; u++) {
      const v = a && a[u], m = n[u];
      s && v && m.route.key === v.route.key ? c[u] = s[u] : (i = false, t[u] && t[u](), createRoot((g) => {
        t[u] = g, c[u] = st(e.routerState, c[u - 1] || e.routerState.base, ae(() => o()[u + 1]), () => {
          var _a;
          const y = e.routerState.matches();
          return (_a = y[u]) != null ? _a : y[0];
        });
      }));
    }
    return t.splice(n.length).forEach((u) => u()), s && i ? s : (r = c[0], c);
  }));
  return ae(() => o() && r)();
}
const ae = (e) => () => createComponent(Show, { get when() {
  return e();
}, keyed: true, children: (t) => createComponent(ee.Provider, { value: t, get children() {
  return t.outlet();
} }) });
function ut(e, t, r) {
  const o = new URL(e.request.url), n = T(r, new URL(e.router.previousUrl || e.request.url).pathname), a = T(r, o.pathname);
  for (let s = 0; s < a.length; s++) {
    (!n[s] || a[s].route !== n[s].route) && (e.router.dataOnly = true);
    const { route: i, params: c } = a[s];
    i.preload && i.preload({ params: c, location: t.location, intent: "preload" });
  }
}
function lt([e, t], r, o) {
  return [e, o ? (n) => t(o(n)) : t];
}
function ht(e) {
  let t = false;
  const r = (n) => typeof n == "string" ? { value: n } : n, o = lt(createSignal(r(e.get()), { equals: (n, a) => n.value === a.value && n.state === a.state }), void 0, (n) => (!t && e.set(n), sharedConfig.registry && !sharedConfig.done && (sharedConfig.done = true), n));
  return e.init && onCleanup(e.init((n = e.get()) => {
    t = true, o[1](r(n)), t = false;
  })), Pe({ signal: o, create: e.create, utils: e.utils });
}
function dt(e, t, r) {
  return e.addEventListener(t, r), () => e.removeEventListener(t, r);
}
function ft(e, t) {
  const r = e && document.getElementById(e);
  r ? r.scrollIntoView() : t && window.scrollTo(0, 0);
}
function mt(e) {
  const t = new URL(e);
  return t.pathname + t.search;
}
function pt(e) {
  let t;
  const r = { value: e.url || (t = getRequestEvent()) && mt(t.request.url) || "" };
  return Pe({ signal: [() => r, (o) => Object.assign(r, o)] })(e);
}
const gt = /* @__PURE__ */ new Map();
function wt({ preload: e = true, explicitLinks: t = false, actionBase: r = "/_server", transformUrl: o } = {}) {
  return (n) => {
    const a = n.base.path(), s = n.navigatorFactory(n.base);
    let i, c;
    function u(l) {
      return l.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function f(l) {
      if (l.defaultPrevented || l.button !== 0 || l.metaKey || l.altKey || l.ctrlKey || l.shiftKey) return;
      const h = l.composedPath().find((q) => q instanceof Node && q.nodeName.toUpperCase() === "A");
      if (!h || t && !h.hasAttribute("link")) return;
      const b = u(h), w = b ? h.href.baseVal : h.href;
      if ((b ? h.target.baseVal : h.target) || !w && !h.hasAttribute("state")) return;
      const A = (h.getAttribute("rel") || "").split(/\s+/);
      if (h.hasAttribute("download") || A && A.includes("external")) return;
      const S = b ? new URL(w, document.baseURI) : new URL(w);
      if (!(S.origin !== window.location.origin || a && S.pathname && !S.pathname.toLowerCase().startsWith(a.toLowerCase()))) return [h, S];
    }
    function v(l) {
      const h = f(l);
      if (!h) return;
      const [b, w] = h, E = n.parsePath(w.pathname + w.search + w.hash), A = b.getAttribute("state");
      l.preventDefault(), s(E, { resolve: false, replace: b.hasAttribute("replace"), scroll: !b.hasAttribute("noscroll"), state: A ? JSON.parse(A) : void 0 });
    }
    function m(l) {
      const h = f(l);
      if (!h) return;
      const [b, w] = h;
      o && (w.pathname = o(w.pathname)), n.preloadRoute(w, b.getAttribute("preload") !== "false");
    }
    function g(l) {
      clearTimeout(i);
      const h = f(l);
      if (!h) return c = null;
      const [b, w] = h;
      c !== b && (o && (w.pathname = o(w.pathname)), i = setTimeout(() => {
        n.preloadRoute(w, b.getAttribute("preload") !== "false"), c = b;
      }, 20));
    }
    function y(l) {
      if (l.defaultPrevented) return;
      let h = l.submitter && l.submitter.hasAttribute("formaction") ? l.submitter.getAttribute("formaction") : l.target.getAttribute("action");
      if (!h) return;
      if (!h.startsWith("https://action/")) {
        const w = new URL(h, fe);
        if (h = n.parsePath(w.pathname + w.search), !h.startsWith(r)) return;
      }
      if (l.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const b = gt.get(h);
      if (b) {
        l.preventDefault();
        const w = new FormData(l.target, l.submitter);
        b.call({ r: n, f: l.target }, l.target.enctype === "multipart/form-data" ? w : new URLSearchParams(w));
      }
    }
    delegateEvents(["click", "submit"]), document.addEventListener("click", v), e && (document.addEventListener("mousemove", g, { passive: true }), document.addEventListener("focusin", m, { passive: true }), document.addEventListener("touchstart", m, { passive: true })), document.addEventListener("submit", y), onCleanup(() => {
      document.removeEventListener("click", v), e && (document.removeEventListener("mousemove", g), document.removeEventListener("focusin", m), document.removeEventListener("touchstart", m)), document.removeEventListener("submit", y);
    });
  };
}
function vt(e) {
  if (isServer) return pt(e);
  const t = () => {
    const o = window.location.pathname.replace(/^\/+/, "/") + window.location.search, n = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return { value: o + window.location.hash, state: n };
  }, r = de();
  return ht({ get: t, set({ value: o, replace: n, scroll: a, state: s }) {
    n ? window.history.replaceState(Ne(s), "", o) : window.history.pushState(s, "", o), ft(decodeURIComponent(window.location.hash.slice(1)), a), Z();
  }, init: (o) => dt(window, "popstate", Me(o, (n) => {
    if (n) return !r.confirm(n);
    {
      const a = t();
      return !r.confirm(a.value, { state: a.state });
    }
  })), create: wt({ preload: e.preload, explicitLinks: e.explicitLinks, actionBase: e.actionBase, transformUrl: e.transformUrl }), utils: { go: (o) => window.history.go(o), beforeLeave: r } })(e);
}
function bt(e) {
  e = mergeProps({ inactiveClass: "inactive", activeClass: "active" }, e);
  const [, t] = splitProps(e, ["href", "state", "class", "activeClass", "inactiveClass", "end"]), r = Ze(() => e.href), o = et(r), n = be(), a = createMemo(() => {
    const s = r();
    if (s === void 0) return [false, false];
    const i = O(s.split(/[?#]/, 1)[0]).toLowerCase(), c = decodeURI(O(n.pathname).toLowerCase());
    return [e.end ? i === c : c.startsWith(i + "/") || c === i, i === c];
  });
  return ssrElement("a", mergeProps$1(t, { get href() {
    return o() || e.href;
  }, get state() {
    return JSON.stringify(e.state);
  }, get classList() {
    return { ...e.class && { [e.class]: true }, [e.inactiveClass]: !a()[0], [e.activeClass]: a()[0], ...t.classList };
  }, link: true, get "aria-current"() {
    return a()[1] ? "page" : void 0;
  } }), void 0, true);
}
function Rt() {
  return "" ;
}
function G() {
  return Rt().length > 0;
}
function Pt(e) {
  return () => {
  };
}
const Lt = (e) => {
  const t = ve(), [r, o] = createSignal(false);
  return onMount(() => {
    if (!G()) {
      t("/login", { replace: true });
      return;
    }
    o(true);
  }), createComponent(Show, { get when() {
    return r();
  }, get children() {
    return e.children;
  } });
};
var At = ["<div", ' class="shell">', "</div>"], Et = ["<span", ' class="muted">Admin</span>'], St = ["<div", ' class="shell"><header class="topbar"><div class="row"><div class="brand">Farsight RPC</div><nav class="nav">', '</nav></div><div class="topbar-actions"><!--$-->', '<!--/--><button class="button ghost" type="button">Logout</button></div></header><main class="content">', "</main></div>"];
const Ct = [{ href: "/", label: "Dashboard" }, { href: "/applications", label: "Applications" }, { href: "/chains", label: "Chains" }, { href: "/providers-admin", label: "Providers" }, { href: "/endpoints", label: "Endpoints" }, { href: "/admin", label: "API Keys" }], xt = (e) => {
  const t = be();
  ve();
  const [r, o] = createSignal(false);
  return onMount(() => {
    o(G());
    const n = Pt();
    onCleanup(n);
  }), t.pathname === "/login" ? ssr(At, ssrHydrationKey(), escape(e.children)) : createComponent(Lt, { get children() {
    return ssr(St, ssrHydrationKey(), escape(Ct.map((n) => createComponent(bt, { get href() {
      return n.href;
    }, get classList() {
      return { active: t.pathname === n.href };
    }, get children() {
      return n.label;
    } }))), escape(createComponent(Show, { get when() {
      return r();
    }, get children() {
      return ssr(Et, ssrHydrationKey());
    } })), escape(e.children));
  } });
};
function Wt() {
  return createComponent(vt, { root: (e) => createComponent(xt, { get children() {
    return createComponent(Suspense, { get children() {
      return e.children;
    } });
  } }), get children() {
    return createComponent(Ct$1, {});
  } });
}

export { Wt as default };
//# sourceMappingURL=app-1j3tNlt-.mjs.map
