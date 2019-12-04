/*!
 * lab.js -- Building blocks for online experiments
 * (c) 2015- Felix Henninger
 */
!(function(t, n) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = n())
    : 'function' == typeof define && define.amd
    ? define('lab', [], n)
    : 'object' == typeof exports
    ? (exports.lab = n())
    : (t.lab = n());
})(window, function() {
  return (function(t) {
    var n = {};
    function e(r) {
      if (n[r]) return n[r].exports;
      var o = (n[r] = { i: r, l: !1, exports: {} });
      return t[r].call(o.exports, o, o.exports, e), (o.l = !0), o.exports;
    }
    return (
      (e.m = t),
      (e.c = n),
      (e.d = function(t, n, r) {
        e.o(t, n) || Object.defineProperty(t, n, { enumerable: !0, get: r });
      }),
      (e.r = function(t) {
        'undefined' != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(t, '__esModule', { value: !0 });
      }),
      (e.t = function(t, n) {
        if ((1 & n && (t = e(t)), 8 & n)) return t;
        if (4 & n && 'object' == typeof t && t && t.__esModule) return t;
        var r = Object.create(null);
        if (
          (e.r(r),
          Object.defineProperty(r, 'default', { enumerable: !0, value: t }),
          2 & n && 'string' != typeof t)
        )
          for (var o in t)
            e.d(
              r,
              o,
              function(n) {
                return t[n];
              }.bind(null, o)
            );
        return r;
      }),
      (e.n = function(t) {
        var n =
          t && t.__esModule
            ? function() {
                return t.default;
              }
            : function() {
                return t;
              };
        return e.d(n, 'a', n), n;
      }),
      (e.o = function(t, n) {
        return Object.prototype.hasOwnProperty.call(t, n);
      }),
      (e.p = ''),
      e((e.s = 250))
    );
  })([
    function(t, n, e) {
      var r = e(2),
        o = e(31),
        i = e(21),
        a = e(22),
        u = e(32),
        s = function(t, n, e) {
          var c,
            f,
            l,
            p,
            h = t & s.F,
            d = t & s.G,
            v = t & s.S,
            y = t & s.P,
            g = t & s.B,
            m = d ? r : v ? r[n] || (r[n] = {}) : (r[n] || {}).prototype,
            b = d ? o : o[n] || (o[n] = {}),
            w = b.prototype || (b.prototype = {});
          for (c in (d && (e = n), e))
            (l = ((f = !h && m && void 0 !== m[c]) ? m : e)[c]),
              (p =
                g && f
                  ? u(l, r)
                  : y && 'function' == typeof l
                  ? u(Function.call, l)
                  : l),
              m && a(m, c, l, t & s.U),
              b[c] != l && i(b, c, p),
              y && w[c] != l && (w[c] = l);
        };
      (r.core = o),
        (s.F = 1),
        (s.G = 2),
        (s.S = 4),
        (s.P = 8),
        (s.B = 16),
        (s.W = 32),
        (s.U = 64),
        (s.R = 128),
        (t.exports = s);
    },
    function(t, n, e) {
      var r = e(4);
      t.exports = function(t) {
        if (!r(t)) throw TypeError(t + ' is not an object!');
        return t;
      };
    },
    function(t, n) {
      var e = (t.exports =
        'undefined' != typeof window && window.Math == Math
          ? window
          : 'undefined' != typeof self && self.Math == Math
          ? self
          : Function('return this')());
      'number' == typeof __g && (__g = e);
    },
    function(t, n) {
      t.exports = function(t) {
        try {
          return !!t();
        } catch (t) {
          return !0;
        }
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return 'object' == typeof t ? null !== t : 'function' == typeof t;
      };
    },
    function(t, n, e) {
      var r = e(89)('wks'),
        o = e(53),
        i = e(2).Symbol,
        a = 'function' == typeof i;
      (t.exports = function(t) {
        return r[t] || (r[t] = (a && i[t]) || (a ? i : o)('Symbol.' + t));
      }).store = r;
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S + r.F * !e(8), 'Object', { defineProperty: e(9).f });
    },
    function(t, n, e) {
      for (
        var r = e(11),
          o = e(54),
          i = e(22),
          a = e(2),
          u = e(21),
          s = e(74),
          c = e(5),
          f = c('iterator'),
          l = c('toStringTag'),
          p = s.Array,
          h = {
            CSSRuleList: !0,
            CSSStyleDeclaration: !1,
            CSSValueList: !1,
            ClientRectList: !1,
            DOMRectList: !1,
            DOMStringList: !1,
            DOMTokenList: !0,
            DataTransferItemList: !1,
            FileList: !1,
            HTMLAllCollection: !1,
            HTMLCollection: !1,
            HTMLFormElement: !1,
            HTMLSelectElement: !1,
            MediaList: !0,
            MimeTypeArray: !1,
            NamedNodeMap: !1,
            NodeList: !0,
            PaintRequestList: !1,
            Plugin: !1,
            PluginArray: !1,
            SVGLengthList: !1,
            SVGNumberList: !1,
            SVGPathSegList: !1,
            SVGPointList: !1,
            SVGStringList: !1,
            SVGTransformList: !1,
            SourceBufferList: !1,
            StyleSheetList: !0,
            TextTrackCueList: !1,
            TextTrackList: !1,
            TouchList: !1
          },
          d = o(h),
          v = 0;
        v < d.length;
        v++
      ) {
        var y,
          g = d[v],
          m = h[g],
          b = a[g],
          w = b && b.prototype;
        if (w && (w[f] || u(w, f, p), w[l] || u(w, l, g), (s[g] = p), m))
          for (y in r) w[y] || i(w, y, r[y], !0);
      }
    },
    function(t, n, e) {
      t.exports = !e(3)(function() {
        return (
          7 !=
          Object.defineProperty({}, 'a', {
            get: function() {
              return 7;
            }
          }).a
        );
      });
    },
    function(t, n, e) {
      var r = e(1),
        o = e(168),
        i = e(38),
        a = Object.defineProperty;
      n.f = e(8)
        ? Object.defineProperty
        : function(t, n, e) {
            if ((r(t), (n = i(n, !0)), r(e), o))
              try {
                return a(t, n, e);
              } catch (t) {}
            if ('get' in e || 'set' in e)
              throw TypeError('Accessors not supported!');
            return 'value' in e && (t[n] = e.value), t;
          };
    },
    function(t, n, e) {
      var r = e(40),
        o = Math.min;
      t.exports = function(t) {
        return t > 0 ? o(r(t), 9007199254740991) : 0;
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(50),
        o = e(191),
        i = e(74),
        a = e(26);
      (t.exports = e(132)(
        Array,
        'Array',
        function(t, n) {
          (this._t = a(t)), (this._i = 0), (this._k = n);
        },
        function() {
          var t = this._t,
            n = this._k,
            e = this._i++;
          return !t || e >= t.length
            ? ((this._t = void 0), o(1))
            : o(0, 'keys' == n ? e : 'values' == n ? t[e] : [e, t[e]]);
        },
        'values'
      )),
        (i.Arguments = i.Array),
        r('keys'),
        r('values'),
        r('entries');
    },
    function(t, n, e) {
      var r = e(39);
      t.exports = function(t) {
        return Object(r(t));
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(131)(!0);
      e(132)(
        String,
        'String',
        function(t) {
          (this._t = String(t)), (this._i = 0);
        },
        function() {
          var t,
            n = this._t,
            e = this._i;
          return e >= n.length
            ? { value: void 0, done: !0 }
            : ((t = r(n, e)), (this._i += t.length), { value: t, done: !1 });
        }
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(1);
      r(r.P + r.F * !e(35)([].map, !0), 'Array', {
        map: function(t) {
          return o(this, t, arguments[1]);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(2),
        o = e(25),
        i = e(8),
        a = e(0),
        u = e(22),
        s = e(48).KEY,
        c = e(3),
        f = e(89),
        l = e(71),
        p = e(53),
        h = e(5),
        d = e(169),
        v = e(120),
        y = e(254),
        g = e(92),
        m = e(1),
        b = e(4),
        w = e(26),
        x = e(38),
        O = e(52),
        S = e(56),
        _ = e(172),
        j = e(27),
        k = e(9),
        E = e(54),
        P = j.f,
        A = k.f,
        T = _.f,
        R = r.Symbol,
        M = r.JSON,
        F = M && M.stringify,
        C = h('_hidden'),
        I = h('toPrimitive'),
        L = {}.propertyIsEnumerable,
        N = f('symbol-registry'),
        D = f('symbols'),
        B = f('op-symbols'),
        U = Object.prototype,
        z = 'function' == typeof R,
        q = r.QObject,
        G = !q || !q.prototype || !q.prototype.findChild,
        V =
          i &&
          c(function() {
            return (
              7 !=
              S(
                A({}, 'a', {
                  get: function() {
                    return A(this, 'a', { value: 7 }).a;
                  }
                })
              ).a
            );
          })
            ? function(t, n, e) {
                var r = P(U, n);
                r && delete U[n], A(t, n, e), r && t !== U && A(U, n, r);
              }
            : A,
        W = function(t) {
          var n = (D[t] = S(R.prototype));
          return (n._k = t), n;
        },
        H =
          z && 'symbol' == typeof R.iterator
            ? function(t) {
                return 'symbol' == typeof t;
              }
            : function(t) {
                return t instanceof R;
              },
        $ = function(t, n, e) {
          return (
            t === U && $(B, n, e),
            m(t),
            (n = x(n, !0)),
            m(e),
            o(D, n)
              ? (e.enumerable
                  ? (o(t, C) && t[C][n] && (t[C][n] = !1),
                    (e = S(e, { enumerable: O(0, !1) })))
                  : (o(t, C) || A(t, C, O(1, {})), (t[C][n] = !0)),
                V(t, n, e))
              : A(t, n, e)
          );
        },
        J = function(t, n) {
          m(t);
          for (var e, r = y((n = w(n))), o = 0, i = r.length; i > o; )
            $(t, (e = r[o++]), n[e]);
          return t;
        },
        Y = function(t) {
          var n = L.call(this, (t = x(t, !0)));
          return (
            !(this === U && o(D, t) && !o(B, t)) &&
            (!(n || !o(this, t) || !o(D, t) || (o(this, C) && this[C][t])) || n)
          );
        },
        X = function(t, n) {
          if (((t = w(t)), (n = x(n, !0)), t !== U || !o(D, n) || o(B, n))) {
            var e = P(t, n);
            return (
              !e || !o(D, n) || (o(t, C) && t[C][n]) || (e.enumerable = !0), e
            );
          }
        },
        K = function(t) {
          for (var n, e = T(w(t)), r = [], i = 0; e.length > i; )
            o(D, (n = e[i++])) || n == C || n == s || r.push(n);
          return r;
        },
        Q = function(t) {
          for (
            var n, e = t === U, r = T(e ? B : w(t)), i = [], a = 0;
            r.length > a;

          )
            !o(D, (n = r[a++])) || (e && !o(U, n)) || i.push(D[n]);
          return i;
        };
      z ||
        (u(
          (R = function() {
            if (this instanceof R)
              throw TypeError('Symbol is not a constructor!');
            var t = p(arguments.length > 0 ? arguments[0] : void 0),
              n = function(e) {
                this === U && n.call(B, e),
                  o(this, C) && o(this[C], t) && (this[C][t] = !1),
                  V(this, t, O(1, e));
              };
            return i && G && V(U, t, { configurable: !0, set: n }), W(t);
          }).prototype,
          'toString',
          function() {
            return this._k;
          }
        ),
        (j.f = X),
        (k.f = $),
        (e(57).f = _.f = K),
        (e(80).f = Y),
        (e(91).f = Q),
        i && !e(49) && u(U, 'propertyIsEnumerable', Y, !0),
        (d.f = function(t) {
          return W(h(t));
        })),
        a(a.G + a.W + a.F * !z, { Symbol: R });
      for (
        var Z = 'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'.split(
            ','
          ),
          tt = 0;
        Z.length > tt;

      )
        h(Z[tt++]);
      for (var nt = E(h.store), et = 0; nt.length > et; ) v(nt[et++]);
      a(a.S + a.F * !z, 'Symbol', {
        for: function(t) {
          return o(N, (t += '')) ? N[t] : (N[t] = R(t));
        },
        keyFor: function(t) {
          if (!H(t)) throw TypeError(t + ' is not a symbol!');
          for (var n in N) if (N[n] === t) return n;
        },
        useSetter: function() {
          G = !0;
        },
        useSimple: function() {
          G = !1;
        }
      }),
        a(a.S + a.F * !z, 'Object', {
          create: function(t, n) {
            return void 0 === n ? S(t) : J(S(t), n);
          },
          defineProperty: $,
          defineProperties: J,
          getOwnPropertyDescriptor: X,
          getOwnPropertyNames: K,
          getOwnPropertySymbols: Q
        }),
        M &&
          a(
            a.S +
              a.F *
                (!z ||
                  c(function() {
                    var t = R();
                    return (
                      '[null]' != F([t]) ||
                      '{}' != F({ a: t }) ||
                      '{}' != F(Object(t))
                    );
                  })),
            'JSON',
            {
              stringify: function(t) {
                for (var n, e, r = [t], o = 1; arguments.length > o; )
                  r.push(arguments[o++]);
                if (((e = n = r[1]), (b(n) || void 0 !== t) && !H(t)))
                  return (
                    g(n) ||
                      (n = function(t, n) {
                        if (
                          ('function' == typeof e && (n = e.call(this, t, n)),
                          !H(n))
                        )
                          return n;
                      }),
                    (r[1] = n),
                    F.apply(M, r)
                  );
              }
            }
          ),
        R.prototype[I] || e(21)(R.prototype, I, R.prototype.valueOf),
        l(R, 'Symbol'),
        l(Math, 'Math', !0),
        l(r.JSON, 'JSON', !0);
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(0),
        i = e(35)([].forEach, !0);
      r(r.P + r.F * !i, 'Array', {
        forEach: function(t) {
          return o(this, t, arguments[1]);
        }
      });
    },
    function(t, n, e) {
      e(120)('asyncIterator');
    },
    function(t, n) {
      t.exports = function(t) {
        if ('function' != typeof t) throw TypeError(t + ' is not a function!');
        return t;
      };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Array', { isArray: e(92) });
    },
    function(t, n, e) {
      'use strict';
      var r = e(32),
        o = e(0),
        i = e(12),
        a = e(187),
        u = e(136),
        s = e(10),
        c = e(137),
        f = e(138);
      o(
        o.S +
          o.F *
            !e(95)(function(t) {
              Array.from(t);
            }),
        'Array',
        {
          from: function(t) {
            var n,
              e,
              o,
              l,
              p = i(t),
              h = 'function' == typeof this ? this : Array,
              d = arguments.length,
              v = d > 1 ? arguments[1] : void 0,
              y = void 0 !== v,
              g = 0,
              m = f(p);
            if (
              (y && (v = r(v, d > 2 ? arguments[2] : void 0, 2)),
              void 0 == m || (h == Array && u(m)))
            )
              for (e = new h((n = s(p.length))); n > g; g++)
                c(e, g, y ? v(p[g], g) : p[g]);
            else
              for (l = m.call(p), e = new h(); !(o = l.next()).done; g++)
                c(e, g, y ? a(l, v, [o.value, g], !0) : o.value);
            return (e.length = g), e;
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(9),
        o = e(52);
      t.exports = e(8)
        ? function(t, n, e) {
            return r.f(t, n, o(1, e));
          }
        : function(t, n, e) {
            return (t[n] = e), t;
          };
    },
    function(t, n, e) {
      var r = e(2),
        o = e(21),
        i = e(25),
        a = e(53)('src'),
        u = Function.toString,
        s = ('' + u).split('toString');
      (e(31).inspectSource = function(t) {
        return u.call(t);
      }),
        (t.exports = function(t, n, e, u) {
          var c = 'function' == typeof e;
          c && (i(e, 'name') || o(e, 'name', n)),
            t[n] !== e &&
              (c && (i(e, a) || o(e, a, t[n] ? '' + t[n] : s.join(String(n)))),
              t === r
                ? (t[n] = e)
                : u
                ? t[n]
                  ? (t[n] = e)
                  : o(t, n, e)
                : (delete t[n], o(t, n, e)));
        })(Function.prototype, 'toString', function() {
          return ('function' == typeof this && this[a]) || u.call(this);
        });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(3),
        i = e(39),
        a = /"/g,
        u = function(t, n, e, r) {
          var o = String(i(t)),
            u = '<' + n;
          return (
            '' !== e &&
              (u += ' ' + e + '="' + String(r).replace(a, '&quot;') + '"'),
            u + '>' + o + '</' + n + '>'
          );
        };
      t.exports = function(t, n) {
        var e = {};
        (e[t] = n(u)),
          r(
            r.P +
              r.F *
                o(function() {
                  var n = ''[t]('"');
                  return n !== n.toLowerCase() || n.split('"').length > 3;
                }),
            'String',
            e
          );
      };
    },
    function(t, n) {
      t.exports = function() {
        throw new Error('define cannot be used indirect');
      };
    },
    function(t, n) {
      var e = {}.hasOwnProperty;
      t.exports = function(t, n) {
        return e.call(t, n);
      };
    },
    function(t, n, e) {
      var r = e(79),
        o = e(39);
      t.exports = function(t) {
        return r(o(t));
      };
    },
    function(t, n, e) {
      var r = e(80),
        o = e(52),
        i = e(26),
        a = e(38),
        u = e(25),
        s = e(168),
        c = Object.getOwnPropertyDescriptor;
      n.f = e(8)
        ? c
        : function(t, n) {
            if (((t = i(t)), (n = a(n, !0)), s))
              try {
                return c(t, n);
              } catch (t) {}
            if (u(t, n)) return o(!r.f.call(t, n), t[n]);
          };
    },
    function(t, n, e) {
      var r = e(25),
        o = e(12),
        i = e(121)('IE_PROTO'),
        a = Object.prototype;
      t.exports =
        Object.getPrototypeOf ||
        function(t) {
          return (
            (t = o(t)),
            r(t, i)
              ? t[i]
              : 'function' == typeof t.constructor && t instanceof t.constructor
              ? t.constructor.prototype
              : t instanceof Object
              ? a
              : null
          );
        };
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(2);
      r(r.P + r.F * !e(35)([].filter, !0), 'Array', {
        filter: function(t) {
          return o(this, t, arguments[1]);
        }
      });
    },
    function(t, n) {
      var e = Array.isArray;
      t.exports = e;
    },
    function(t, n) {
      var e = (t.exports = { version: '2.5.7' });
      'number' == typeof __e && (__e = e);
    },
    function(t, n, e) {
      var r = e(18);
      t.exports = function(t, n, e) {
        if ((r(t), void 0 === n)) return t;
        switch (e) {
          case 1:
            return function(e) {
              return t.call(n, e);
            };
          case 2:
            return function(e, r) {
              return t.call(n, e, r);
            };
          case 3:
            return function(e, r, o) {
              return t.call(n, e, r, o);
            };
        }
        return function() {
          return t.apply(n, arguments);
        };
      };
    },
    function(t, n) {
      var e = {}.toString;
      t.exports = function(t) {
        return e.call(t).slice(8, -1);
      };
    },
    function(t, n, e) {
      var r = e(12),
        o = e(54);
      e(41)('keys', function() {
        return function(t) {
          return o(r(t));
        };
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(3);
      t.exports = function(t, n) {
        return (
          !!t &&
          r(function() {
            n ? t.call(null, function() {}, 1) : t.call(null);
          })
        );
      };
    },
    function(t, n, e) {
      'use strict';
      var r,
        o,
        i,
        a,
        u = e(49),
        s = e(2),
        c = e(32),
        f = e(81),
        l = e(0),
        p = e(4),
        h = e(18),
        d = e(64),
        v = e(65),
        y = e(98),
        g = e(142).set,
        m = e(143)(),
        b = e(144),
        w = e(195),
        x = e(99),
        O = e(196),
        S = s.TypeError,
        _ = s.process,
        j = _ && _.versions,
        k = (j && j.v8) || '',
        E = s.Promise,
        P = 'process' == f(_),
        A = function() {},
        T = (o = b.f),
        R = !!(function() {
          try {
            var t = E.resolve(1),
              n = ((t.constructor = {})[e(5)('species')] = function(t) {
                t(A, A);
              });
            return (
              (P || 'function' == typeof PromiseRejectionEvent) &&
              t.then(A) instanceof n &&
              0 !== k.indexOf('6.6') &&
              -1 === x.indexOf('Chrome/66')
            );
          } catch (t) {}
        })(),
        M = function(t) {
          var n;
          return !(!p(t) || 'function' != typeof (n = t.then)) && n;
        },
        F = function(t, n) {
          if (!t._n) {
            t._n = !0;
            var e = t._c;
            m(function() {
              for (
                var r = t._v,
                  o = 1 == t._s,
                  i = 0,
                  a = function(n) {
                    var e,
                      i,
                      a,
                      u = o ? n.ok : n.fail,
                      s = n.resolve,
                      c = n.reject,
                      f = n.domain;
                    try {
                      u
                        ? (o || (2 == t._h && L(t), (t._h = 1)),
                          !0 === u
                            ? (e = r)
                            : (f && f.enter(),
                              (e = u(r)),
                              f && (f.exit(), (a = !0))),
                          e === n.promise
                            ? c(S('Promise-chain cycle'))
                            : (i = M(e))
                            ? i.call(e, s, c)
                            : s(e))
                        : c(r);
                    } catch (t) {
                      f && !a && f.exit(), c(t);
                    }
                  };
                e.length > i;

              )
                a(e[i++]);
              (t._c = []), (t._n = !1), n && !t._h && C(t);
            });
          }
        },
        C = function(t) {
          g.call(s, function() {
            var n,
              e,
              r,
              o = t._v,
              i = I(t);
            if (
              (i &&
                ((n = w(function() {
                  P
                    ? _.emit('unhandledRejection', o, t)
                    : (e = s.onunhandledrejection)
                    ? e({ promise: t, reason: o })
                    : (r = s.console) &&
                      r.error &&
                      r.error('Unhandled promise rejection', o);
                })),
                (t._h = P || I(t) ? 2 : 1)),
              (t._a = void 0),
              i && n.e)
            )
              throw n.v;
          });
        },
        I = function(t) {
          return 1 !== t._h && 0 === (t._a || t._c).length;
        },
        L = function(t) {
          g.call(s, function() {
            var n;
            P
              ? _.emit('rejectionHandled', t)
              : (n = s.onrejectionhandled) && n({ promise: t, reason: t._v });
          });
        },
        N = function(t) {
          var n = this;
          n._d ||
            ((n._d = !0),
            ((n = n._w || n)._v = t),
            (n._s = 2),
            n._a || (n._a = n._c.slice()),
            F(n, !0));
        },
        D = function(t) {
          var n,
            e = this;
          if (!e._d) {
            (e._d = !0), (e = e._w || e);
            try {
              if (e === t) throw S("Promise can't be resolved itself");
              (n = M(t))
                ? m(function() {
                    var r = { _w: e, _d: !1 };
                    try {
                      n.call(t, c(D, r, 1), c(N, r, 1));
                    } catch (t) {
                      N.call(r, t);
                    }
                  })
                : ((e._v = t), (e._s = 1), F(e, !1));
            } catch (t) {
              N.call({ _w: e, _d: !1 }, t);
            }
          }
        };
      R ||
        ((E = function(t) {
          d(this, E, 'Promise', '_h'), h(t), r.call(this);
          try {
            t(c(D, this, 1), c(N, this, 1));
          } catch (t) {
            N.call(this, t);
          }
        }),
        ((r = function(t) {
          (this._c = []),
            (this._a = void 0),
            (this._s = 0),
            (this._d = !1),
            (this._v = void 0),
            (this._h = 0),
            (this._n = !1);
        }).prototype = e(66)(E.prototype, {
          then: function(t, n) {
            var e = T(y(this, E));
            return (
              (e.ok = 'function' != typeof t || t),
              (e.fail = 'function' == typeof n && n),
              (e.domain = P ? _.domain : void 0),
              this._c.push(e),
              this._a && this._a.push(e),
              this._s && F(this, !1),
              e.promise
            );
          },
          catch: function(t) {
            return this.then(void 0, t);
          }
        })),
        (i = function() {
          var t = new r();
          (this.promise = t),
            (this.resolve = c(D, t, 1)),
            (this.reject = c(N, t, 1));
        }),
        (b.f = T = function(t) {
          return t === E || t === a ? new i(t) : o(t);
        })),
        l(l.G + l.W + l.F * !R, { Promise: E }),
        e(71)(E, 'Promise'),
        e(61)('Promise'),
        (a = e(31).Promise),
        l(l.S + l.F * !R, 'Promise', {
          reject: function(t) {
            var n = T(this);
            return (0, n.reject)(t), n.promise;
          }
        }),
        l(l.S + l.F * (u || !R), 'Promise', {
          resolve: function(t) {
            return O(u && this === a ? E : this, t);
          }
        }),
        l(
          l.S +
            l.F *
              !(
                R &&
                e(95)(function(t) {
                  E.all(t).catch(A);
                })
              ),
          'Promise',
          {
            all: function(t) {
              var n = this,
                e = T(n),
                r = e.resolve,
                o = e.reject,
                i = w(function() {
                  var e = [],
                    i = 0,
                    a = 1;
                  v(t, !1, function(t) {
                    var u = i++,
                      s = !1;
                    e.push(void 0),
                      a++,
                      n.resolve(t).then(function(t) {
                        s || ((s = !0), (e[u] = t), --a || r(e));
                      }, o);
                  }),
                    --a || r(e);
                });
              return i.e && o(i.v), e.promise;
            },
            race: function(t) {
              var n = this,
                e = T(n),
                r = e.reject,
                o = w(function() {
                  v(t, !1, function(t) {
                    n.resolve(t).then(e.resolve, r);
                  });
                });
              return o.e && r(o.v), e.promise;
            }
          }
        );
    },
    function(t, n) {
      t.exports = function(t) {
        var n = typeof t;
        return null != t && ('object' == n || 'function' == n);
      };
    },
    function(t, n, e) {
      var r = e(4);
      t.exports = function(t, n) {
        if (!r(t)) return t;
        var e, o;
        if (n && 'function' == typeof (e = t.toString) && !r((o = e.call(t))))
          return o;
        if ('function' == typeof (e = t.valueOf) && !r((o = e.call(t))))
          return o;
        if (!n && 'function' == typeof (e = t.toString) && !r((o = e.call(t))))
          return o;
        throw TypeError("Can't convert object to primitive value");
      };
    },
    function(t, n) {
      t.exports = function(t) {
        if (void 0 == t) throw TypeError("Can't call method on  " + t);
        return t;
      };
    },
    function(t, n) {
      var e = Math.ceil,
        r = Math.floor;
      t.exports = function(t) {
        return isNaN((t = +t)) ? 0 : (t > 0 ? r : e)(t);
      };
    },
    function(t, n, e) {
      var r = e(0),
        o = e(31),
        i = e(3);
      t.exports = function(t, n) {
        var e = (o.Object || {})[t] || Object[t],
          a = {};
        (a[t] = n(e)),
          r(
            r.S +
              r.F *
                i(function() {
                  e(1);
                }),
            'Object',
            a
          );
      };
    },
    function(t, n, e) {
      var r = Date.prototype,
        o = r.toString,
        i = r.getTime;
      new Date(NaN) + '' != 'Invalid Date' &&
        e(22)(r, 'toString', function() {
          var t = i.call(this);
          return t == t ? o.call(this) : 'Invalid Date';
        });
    },
    function(t, n, e) {
      var r = e(32),
        o = e(79),
        i = e(12),
        a = e(10),
        u = e(139);
      t.exports = function(t, n) {
        var e = 1 == t,
          s = 2 == t,
          c = 3 == t,
          f = 4 == t,
          l = 6 == t,
          p = 5 == t || l,
          h = n || u;
        return function(n, u, d) {
          for (
            var v,
              y,
              g = i(n),
              m = o(g),
              b = r(u, d, 3),
              w = a(m.length),
              x = 0,
              O = e ? h(n, w) : s ? h(n, 0) : void 0;
            w > x;
            x++
          )
            if ((p || x in m) && ((y = b((v = m[x]), x, g)), t))
              if (e) O[x] = y;
              else if (y)
                switch (t) {
                  case 3:
                    return !0;
                  case 5:
                    return v;
                  case 6:
                    return x;
                  case 2:
                    O.push(v);
                }
              else if (f) return !1;
          return l ? -1 : c || f ? f : O;
        };
      };
    },
    function(t, n, e) {
      'use strict';
      e(193);
      var r = e(1),
        o = e(96),
        i = e(8),
        a = /./.toString,
        u = function(t) {
          e(22)(RegExp.prototype, 'toString', t, !0);
        };
      e(3)(function() {
        return '/a/b' != a.call({ source: 'a', flags: 'b' });
      })
        ? u(function() {
            var t = r(this);
            return '/'.concat(
              t.source,
              '/',
              'flags' in t
                ? t.flags
                : !i && t instanceof RegExp
                ? o.call(t)
                : void 0
            );
          })
        : 'toString' != a.name &&
          u(function() {
            return a.call(this);
          });
    },
    function(t, n, e) {
      'use strict';
      if (e(8)) {
        var r = e(49),
          o = e(2),
          i = e(3),
          a = e(0),
          u = e(101),
          s = e(146),
          c = e(32),
          f = e(64),
          l = e(52),
          p = e(21),
          h = e(66),
          d = e(40),
          v = e(10),
          y = e(201),
          g = e(55),
          m = e(38),
          b = e(25),
          w = e(81),
          x = e(4),
          O = e(12),
          S = e(136),
          _ = e(56),
          j = e(28),
          k = e(57).f,
          E = e(138),
          P = e(53),
          A = e(5),
          T = e(43),
          R = e(90),
          M = e(98),
          F = e(11),
          C = e(74),
          I = e(95),
          L = e(61),
          N = e(141),
          D = e(190),
          B = e(9),
          U = e(27),
          z = B.f,
          q = U.f,
          G = o.RangeError,
          V = o.TypeError,
          W = o.Uint8Array,
          H = Array.prototype,
          $ = s.ArrayBuffer,
          J = s.DataView,
          Y = T(0),
          X = T(2),
          K = T(3),
          Q = T(4),
          Z = T(5),
          tt = T(6),
          nt = R(!0),
          et = R(!1),
          rt = F.values,
          ot = F.keys,
          it = F.entries,
          at = H.lastIndexOf,
          ut = H.reduce,
          st = H.reduceRight,
          ct = H.join,
          ft = H.sort,
          lt = H.slice,
          pt = H.toString,
          ht = H.toLocaleString,
          dt = A('iterator'),
          vt = A('toStringTag'),
          yt = P('typed_constructor'),
          gt = P('def_constructor'),
          mt = u.CONSTR,
          bt = u.TYPED,
          wt = u.VIEW,
          xt = T(1, function(t, n) {
            return kt(M(t, t[gt]), n);
          }),
          Ot = i(function() {
            return 1 === new W(new Uint16Array([1]).buffer)[0];
          }),
          St =
            !!W &&
            !!W.prototype.set &&
            i(function() {
              new W(1).set({});
            }),
          _t = function(t, n) {
            var e = d(t);
            if (e < 0 || e % n) throw G('Wrong offset!');
            return e;
          },
          jt = function(t) {
            if (x(t) && bt in t) return t;
            throw V(t + ' is not a typed array!');
          },
          kt = function(t, n) {
            if (!(x(t) && yt in t))
              throw V('It is not a typed array constructor!');
            return new t(n);
          },
          Et = function(t, n) {
            return Pt(M(t, t[gt]), n);
          },
          Pt = function(t, n) {
            for (var e = 0, r = n.length, o = kt(t, r); r > e; ) o[e] = n[e++];
            return o;
          },
          At = function(t, n, e) {
            z(t, n, {
              get: function() {
                return this._d[e];
              }
            });
          },
          Tt = function(t) {
            var n,
              e,
              r,
              o,
              i,
              a,
              u = O(t),
              s = arguments.length,
              f = s > 1 ? arguments[1] : void 0,
              l = void 0 !== f,
              p = E(u);
            if (void 0 != p && !S(p)) {
              for (a = p.call(u), r = [], n = 0; !(i = a.next()).done; n++)
                r.push(i.value);
              u = r;
            }
            for (
              l && s > 2 && (f = c(f, arguments[2], 2)),
                n = 0,
                e = v(u.length),
                o = kt(this, e);
              e > n;
              n++
            )
              o[n] = l ? f(u[n], n) : u[n];
            return o;
          },
          Rt = function() {
            for (var t = 0, n = arguments.length, e = kt(this, n); n > t; )
              e[t] = arguments[t++];
            return e;
          },
          Mt =
            !!W &&
            i(function() {
              ht.call(new W(1));
            }),
          Ft = function() {
            return ht.apply(Mt ? lt.call(jt(this)) : jt(this), arguments);
          },
          Ct = {
            copyWithin: function(t, n) {
              return D.call(
                jt(this),
                t,
                n,
                arguments.length > 2 ? arguments[2] : void 0
              );
            },
            every: function(t) {
              return Q(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            fill: function(t) {
              return N.apply(jt(this), arguments);
            },
            filter: function(t) {
              return Et(
                this,
                X(jt(this), t, arguments.length > 1 ? arguments[1] : void 0)
              );
            },
            find: function(t) {
              return Z(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            findIndex: function(t) {
              return tt(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            forEach: function(t) {
              Y(jt(this), t, arguments.length > 1 ? arguments[1] : void 0);
            },
            indexOf: function(t) {
              return et(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            includes: function(t) {
              return nt(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            join: function(t) {
              return ct.apply(jt(this), arguments);
            },
            lastIndexOf: function(t) {
              return at.apply(jt(this), arguments);
            },
            map: function(t) {
              return xt(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            reduce: function(t) {
              return ut.apply(jt(this), arguments);
            },
            reduceRight: function(t) {
              return st.apply(jt(this), arguments);
            },
            reverse: function() {
              for (
                var t, n = jt(this).length, e = Math.floor(n / 2), r = 0;
                r < e;

              )
                (t = this[r]), (this[r++] = this[--n]), (this[n] = t);
              return this;
            },
            some: function(t) {
              return K(
                jt(this),
                t,
                arguments.length > 1 ? arguments[1] : void 0
              );
            },
            sort: function(t) {
              return ft.call(jt(this), t);
            },
            subarray: function(t, n) {
              var e = jt(this),
                r = e.length,
                o = g(t, r);
              return new (M(e, e[gt]))(
                e.buffer,
                e.byteOffset + o * e.BYTES_PER_ELEMENT,
                v((void 0 === n ? r : g(n, r)) - o)
              );
            }
          },
          It = function(t, n) {
            return Et(this, lt.call(jt(this), t, n));
          },
          Lt = function(t) {
            jt(this);
            var n = _t(arguments[1], 1),
              e = this.length,
              r = O(t),
              o = v(r.length),
              i = 0;
            if (o + n > e) throw G('Wrong length!');
            for (; i < o; ) this[n + i] = r[i++];
          },
          Nt = {
            entries: function() {
              return it.call(jt(this));
            },
            keys: function() {
              return ot.call(jt(this));
            },
            values: function() {
              return rt.call(jt(this));
            }
          },
          Dt = function(t, n) {
            return (
              x(t) &&
              t[bt] &&
              'symbol' != typeof n &&
              n in t &&
              String(+n) == String(n)
            );
          },
          Bt = function(t, n) {
            return Dt(t, (n = m(n, !0))) ? l(2, t[n]) : q(t, n);
          },
          Ut = function(t, n, e) {
            return !(Dt(t, (n = m(n, !0))) && x(e) && b(e, 'value')) ||
              b(e, 'get') ||
              b(e, 'set') ||
              e.configurable ||
              (b(e, 'writable') && !e.writable) ||
              (b(e, 'enumerable') && !e.enumerable)
              ? z(t, n, e)
              : ((t[n] = e.value), t);
          };
        mt || ((U.f = Bt), (B.f = Ut)),
          a(a.S + a.F * !mt, 'Object', {
            getOwnPropertyDescriptor: Bt,
            defineProperty: Ut
          }),
          i(function() {
            pt.call({});
          }) &&
            (pt = ht = function() {
              return ct.call(this);
            });
        var zt = h({}, Ct);
        h(zt, Nt),
          p(zt, dt, Nt.values),
          h(zt, {
            slice: It,
            set: Lt,
            constructor: function() {},
            toString: pt,
            toLocaleString: Ft
          }),
          At(zt, 'buffer', 'b'),
          At(zt, 'byteOffset', 'o'),
          At(zt, 'byteLength', 'l'),
          At(zt, 'length', 'e'),
          z(zt, vt, {
            get: function() {
              return this[bt];
            }
          }),
          (t.exports = function(t, n, e, s) {
            var c = t + ((s = !!s) ? 'Clamped' : '') + 'Array',
              l = 'get' + t,
              h = 'set' + t,
              d = o[c],
              g = d || {},
              m = d && j(d),
              b = !d || !u.ABV,
              O = {},
              S = d && d.prototype,
              E = function(t, e) {
                z(t, e, {
                  get: function() {
                    return (function(t, e) {
                      var r = t._d;
                      return r.v[l](e * n + r.o, Ot);
                    })(this, e);
                  },
                  set: function(t) {
                    return (function(t, e, r) {
                      var o = t._d;
                      s &&
                        (r =
                          (r = Math.round(r)) < 0
                            ? 0
                            : r > 255
                            ? 255
                            : 255 & r),
                        o.v[h](e * n + o.o, r, Ot);
                    })(this, e, t);
                  },
                  enumerable: !0
                });
              };
            b
              ? ((d = e(function(t, e, r, o) {
                  f(t, d, c, '_d');
                  var i,
                    a,
                    u,
                    s,
                    l = 0,
                    h = 0;
                  if (x(e)) {
                    if (
                      !(
                        e instanceof $ ||
                        'ArrayBuffer' == (s = w(e)) ||
                        'SharedArrayBuffer' == s
                      )
                    )
                      return bt in e ? Pt(d, e) : Tt.call(d, e);
                    (i = e), (h = _t(r, n));
                    var g = e.byteLength;
                    if (void 0 === o) {
                      if (g % n) throw G('Wrong length!');
                      if ((a = g - h) < 0) throw G('Wrong length!');
                    } else if ((a = v(o) * n) + h > g) throw G('Wrong length!');
                    u = a / n;
                  } else (u = y(e)), (i = new $((a = u * n)));
                  for (
                    p(t, '_d', { b: i, o: h, l: a, e: u, v: new J(i) });
                    l < u;

                  )
                    E(t, l++);
                })),
                (S = d.prototype = _(zt)),
                p(S, 'constructor', d))
              : (i(function() {
                  d(1);
                }) &&
                  i(function() {
                    new d(-1);
                  }) &&
                  I(function(t) {
                    new d(), new d(null), new d(1.5), new d(t);
                  }, !0)) ||
                ((d = e(function(t, e, r, o) {
                  var i;
                  return (
                    f(t, d, c),
                    x(e)
                      ? e instanceof $ ||
                        'ArrayBuffer' == (i = w(e)) ||
                        'SharedArrayBuffer' == i
                        ? void 0 !== o
                          ? new g(e, _t(r, n), o)
                          : void 0 !== r
                          ? new g(e, _t(r, n))
                          : new g(e)
                        : bt in e
                        ? Pt(d, e)
                        : Tt.call(d, e)
                      : new g(y(e))
                  );
                })),
                Y(m !== Function.prototype ? k(g).concat(k(m)) : k(g), function(
                  t
                ) {
                  t in d || p(d, t, g[t]);
                }),
                (d.prototype = S),
                r || (S.constructor = d));
            var P = S[dt],
              A = !!P && ('values' == P.name || void 0 == P.name),
              T = Nt.values;
            p(d, yt, !0),
              p(S, bt, c),
              p(S, wt, !0),
              p(S, gt, d),
              (s ? new d(1)[vt] == c : vt in S) ||
                z(S, vt, {
                  get: function() {
                    return c;
                  }
                }),
              (O[c] = d),
              a(a.G + a.W + a.F * (d != g), O),
              a(a.S, c, { BYTES_PER_ELEMENT: n }),
              a(
                a.S +
                  a.F *
                    i(function() {
                      g.of.call(d, 1);
                    }),
                c,
                { from: Tt, of: Rt }
              ),
              'BYTES_PER_ELEMENT' in S || p(S, 'BYTES_PER_ELEMENT', n),
              a(a.P, c, Ct),
              L(c),
              a(a.P + a.F * St, c, { set: Lt }),
              a(a.P + a.F * !A, c, Nt),
              r || S.toString == pt || (S.toString = pt),
              a(
                a.P +
                  a.F *
                    i(function() {
                      new d(1).slice();
                    }),
                c,
                { slice: It }
              ),
              a(
                a.P +
                  a.F *
                    (i(function() {
                      return (
                        [1, 2].toLocaleString() !=
                        new d([1, 2]).toLocaleString()
                      );
                    }) ||
                      !i(function() {
                        S.toLocaleString.call([1, 2]);
                      })),
                c,
                { toLocaleString: Ft }
              ),
              (C[c] = A ? P : T),
              r || A || p(S, dt, T);
          });
      } else t.exports = function() {};
    },
    function(t, n, e) {
      var r = e(197),
        o = e(0),
        i = e(89)('metadata'),
        a = i.store || (i.store = new (e(199))()),
        u = function(t, n, e) {
          var o = a.get(t);
          if (!o) {
            if (!e) return;
            a.set(t, (o = new r()));
          }
          var i = o.get(n);
          if (!i) {
            if (!e) return;
            o.set(n, (i = new r()));
          }
          return i;
        };
      t.exports = {
        store: a,
        map: u,
        has: function(t, n, e) {
          var r = u(n, e, !1);
          return void 0 !== r && r.has(t);
        },
        get: function(t, n, e) {
          var r = u(n, e, !1);
          return void 0 === r ? void 0 : r.get(t);
        },
        set: function(t, n, e, r) {
          u(e, r, !0).set(t, n);
        },
        keys: function(t, n) {
          var e = u(t, n, !1),
            r = [];
          return (
            e &&
              e.forEach(function(t, n) {
                r.push(n);
              }),
            r
          );
        },
        key: function(t) {
          return void 0 === t || 'symbol' == typeof t ? t : String(t);
        },
        exp: function(t) {
          o(o.S, 'Reflect', t);
        }
      };
    },
    function(t, n, e) {
      var r = (function(t) {
        'use strict';
        var n,
          e = Object.prototype,
          r = e.hasOwnProperty,
          o = 'function' == typeof Symbol ? Symbol : {},
          i = o.iterator || '@@iterator',
          a = o.asyncIterator || '@@asyncIterator',
          u = o.toStringTag || '@@toStringTag';
        function s(t, n, e, r) {
          var o = n && n.prototype instanceof v ? n : v,
            i = Object.create(o.prototype),
            a = new E(r || []);
          return (
            (i._invoke = (function(t, n, e) {
              var r = f;
              return function(o, i) {
                if (r === p) throw new Error('Generator is already running');
                if (r === h) {
                  if ('throw' === o) throw i;
                  return A();
                }
                for (e.method = o, e.arg = i; ; ) {
                  var a = e.delegate;
                  if (a) {
                    var u = _(a, e);
                    if (u) {
                      if (u === d) continue;
                      return u;
                    }
                  }
                  if ('next' === e.method) e.sent = e._sent = e.arg;
                  else if ('throw' === e.method) {
                    if (r === f) throw ((r = h), e.arg);
                    e.dispatchException(e.arg);
                  } else 'return' === e.method && e.abrupt('return', e.arg);
                  r = p;
                  var s = c(t, n, e);
                  if ('normal' === s.type) {
                    if (((r = e.done ? h : l), s.arg === d)) continue;
                    return { value: s.arg, done: e.done };
                  }
                  'throw' === s.type &&
                    ((r = h), (e.method = 'throw'), (e.arg = s.arg));
                }
              };
            })(t, e, a)),
            i
          );
        }
        function c(t, n, e) {
          try {
            return { type: 'normal', arg: t.call(n, e) };
          } catch (t) {
            return { type: 'throw', arg: t };
          }
        }
        t.wrap = s;
        var f = 'suspendedStart',
          l = 'suspendedYield',
          p = 'executing',
          h = 'completed',
          d = {};
        function v() {}
        function y() {}
        function g() {}
        var m = {};
        m[i] = function() {
          return this;
        };
        var b = Object.getPrototypeOf,
          w = b && b(b(P([])));
        w && w !== e && r.call(w, i) && (m = w);
        var x = (g.prototype = v.prototype = Object.create(m));
        function O(t) {
          ['next', 'throw', 'return'].forEach(function(n) {
            t[n] = function(t) {
              return this._invoke(n, t);
            };
          });
        }
        function S(t) {
          var n;
          this._invoke = function(e, o) {
            function i() {
              return new Promise(function(n, i) {
                !(function n(e, o, i, a) {
                  var u = c(t[e], t, o);
                  if ('throw' !== u.type) {
                    var s = u.arg,
                      f = s.value;
                    return f && 'object' == typeof f && r.call(f, '__await')
                      ? Promise.resolve(f.__await).then(
                          function(t) {
                            n('next', t, i, a);
                          },
                          function(t) {
                            n('throw', t, i, a);
                          }
                        )
                      : Promise.resolve(f).then(
                          function(t) {
                            (s.value = t), i(s);
                          },
                          function(t) {
                            return n('throw', t, i, a);
                          }
                        );
                  }
                  a(u.arg);
                })(e, o, n, i);
              });
            }
            return (n = n ? n.then(i, i) : i());
          };
        }
        function _(t, e) {
          var r = t.iterator[e.method];
          if (r === n) {
            if (((e.delegate = null), 'throw' === e.method)) {
              if (
                t.iterator.return &&
                ((e.method = 'return'),
                (e.arg = n),
                _(t, e),
                'throw' === e.method)
              )
                return d;
              (e.method = 'throw'),
                (e.arg = new TypeError(
                  "The iterator does not provide a 'throw' method"
                ));
            }
            return d;
          }
          var o = c(r, t.iterator, e.arg);
          if ('throw' === o.type)
            return (
              (e.method = 'throw'), (e.arg = o.arg), (e.delegate = null), d
            );
          var i = o.arg;
          return i
            ? i.done
              ? ((e[t.resultName] = i.value),
                (e.next = t.nextLoc),
                'return' !== e.method && ((e.method = 'next'), (e.arg = n)),
                (e.delegate = null),
                d)
              : i
            : ((e.method = 'throw'),
              (e.arg = new TypeError('iterator result is not an object')),
              (e.delegate = null),
              d);
        }
        function j(t) {
          var n = { tryLoc: t[0] };
          1 in t && (n.catchLoc = t[1]),
            2 in t && ((n.finallyLoc = t[2]), (n.afterLoc = t[3])),
            this.tryEntries.push(n);
        }
        function k(t) {
          var n = t.completion || {};
          (n.type = 'normal'), delete n.arg, (t.completion = n);
        }
        function E(t) {
          (this.tryEntries = [{ tryLoc: 'root' }]),
            t.forEach(j, this),
            this.reset(!0);
        }
        function P(t) {
          if (t) {
            var e = t[i];
            if (e) return e.call(t);
            if ('function' == typeof t.next) return t;
            if (!isNaN(t.length)) {
              var o = -1,
                a = function e() {
                  for (; ++o < t.length; )
                    if (r.call(t, o)) return (e.value = t[o]), (e.done = !1), e;
                  return (e.value = n), (e.done = !0), e;
                };
              return (a.next = a);
            }
          }
          return { next: A };
        }
        function A() {
          return { value: n, done: !0 };
        }
        return (
          (y.prototype = x.constructor = g),
          (g.constructor = y),
          (g[u] = y.displayName = 'GeneratorFunction'),
          (t.isGeneratorFunction = function(t) {
            var n = 'function' == typeof t && t.constructor;
            return (
              !!n &&
              (n === y || 'GeneratorFunction' === (n.displayName || n.name))
            );
          }),
          (t.mark = function(t) {
            return (
              Object.setPrototypeOf
                ? Object.setPrototypeOf(t, g)
                : ((t.__proto__ = g), u in t || (t[u] = 'GeneratorFunction')),
              (t.prototype = Object.create(x)),
              t
            );
          }),
          (t.awrap = function(t) {
            return { __await: t };
          }),
          O(S.prototype),
          (S.prototype[a] = function() {
            return this;
          }),
          (t.AsyncIterator = S),
          (t.async = function(n, e, r, o) {
            var i = new S(s(n, e, r, o));
            return t.isGeneratorFunction(e)
              ? i
              : i.next().then(function(t) {
                  return t.done ? t.value : i.next();
                });
          }),
          O(x),
          (x[u] = 'Generator'),
          (x[i] = function() {
            return this;
          }),
          (x.toString = function() {
            return '[object Generator]';
          }),
          (t.keys = function(t) {
            var n = [];
            for (var e in t) n.push(e);
            return (
              n.reverse(),
              function e() {
                for (; n.length; ) {
                  var r = n.pop();
                  if (r in t) return (e.value = r), (e.done = !1), e;
                }
                return (e.done = !0), e;
              }
            );
          }),
          (t.values = P),
          (E.prototype = {
            constructor: E,
            reset: function(t) {
              if (
                ((this.prev = 0),
                (this.next = 0),
                (this.sent = this._sent = n),
                (this.done = !1),
                (this.delegate = null),
                (this.method = 'next'),
                (this.arg = n),
                this.tryEntries.forEach(k),
                !t)
              )
                for (var e in this)
                  't' === e.charAt(0) &&
                    r.call(this, e) &&
                    !isNaN(+e.slice(1)) &&
                    (this[e] = n);
            },
            stop: function() {
              this.done = !0;
              var t = this.tryEntries[0].completion;
              if ('throw' === t.type) throw t.arg;
              return this.rval;
            },
            dispatchException: function(t) {
              if (this.done) throw t;
              var e = this;
              function o(r, o) {
                return (
                  (u.type = 'throw'),
                  (u.arg = t),
                  (e.next = r),
                  o && ((e.method = 'next'), (e.arg = n)),
                  !!o
                );
              }
              for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                var a = this.tryEntries[i],
                  u = a.completion;
                if ('root' === a.tryLoc) return o('end');
                if (a.tryLoc <= this.prev) {
                  var s = r.call(a, 'catchLoc'),
                    c = r.call(a, 'finallyLoc');
                  if (s && c) {
                    if (this.prev < a.catchLoc) return o(a.catchLoc, !0);
                    if (this.prev < a.finallyLoc) return o(a.finallyLoc);
                  } else if (s) {
                    if (this.prev < a.catchLoc) return o(a.catchLoc, !0);
                  } else {
                    if (!c)
                      throw new Error('try statement without catch or finally');
                    if (this.prev < a.finallyLoc) return o(a.finallyLoc);
                  }
                }
              }
            },
            abrupt: function(t, n) {
              for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                var o = this.tryEntries[e];
                if (
                  o.tryLoc <= this.prev &&
                  r.call(o, 'finallyLoc') &&
                  this.prev < o.finallyLoc
                ) {
                  var i = o;
                  break;
                }
              }
              i &&
                ('break' === t || 'continue' === t) &&
                i.tryLoc <= n &&
                n <= i.finallyLoc &&
                (i = null);
              var a = i ? i.completion : {};
              return (
                (a.type = t),
                (a.arg = n),
                i
                  ? ((this.method = 'next'), (this.next = i.finallyLoc), d)
                  : this.complete(a)
              );
            },
            complete: function(t, n) {
              if ('throw' === t.type) throw t.arg;
              return (
                'break' === t.type || 'continue' === t.type
                  ? (this.next = t.arg)
                  : 'return' === t.type
                  ? ((this.rval = this.arg = t.arg),
                    (this.method = 'return'),
                    (this.next = 'end'))
                  : 'normal' === t.type && n && (this.next = n),
                d
              );
            },
            finish: function(t) {
              for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                var e = this.tryEntries[n];
                if (e.finallyLoc === t)
                  return this.complete(e.completion, e.afterLoc), k(e), d;
              }
            },
            catch: function(t) {
              for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                var e = this.tryEntries[n];
                if (e.tryLoc === t) {
                  var r = e.completion;
                  if ('throw' === r.type) {
                    var o = r.arg;
                    k(e);
                  }
                  return o;
                }
              }
              throw new Error('illegal catch attempt');
            },
            delegateYield: function(t, e, r) {
              return (
                (this.delegate = { iterator: P(t), resultName: e, nextLoc: r }),
                'next' === this.method && (this.arg = n),
                d
              );
            }
          }),
          t
        );
      })(t.exports);
      try {
        regeneratorRuntime = r;
      } catch (t) {
        Function('r', 'regeneratorRuntime = r')(r);
      }
    },
    function(t, n, e) {
      var r = e(53)('meta'),
        o = e(4),
        i = e(25),
        a = e(9).f,
        u = 0,
        s =
          Object.isExtensible ||
          function() {
            return !0;
          },
        c = !e(3)(function() {
          return s(Object.preventExtensions({}));
        }),
        f = function(t) {
          a(t, r, { value: { i: 'O' + ++u, w: {} } });
        },
        l = (t.exports = {
          KEY: r,
          NEED: !1,
          fastKey: function(t, n) {
            if (!o(t))
              return 'symbol' == typeof t
                ? t
                : ('string' == typeof t ? 'S' : 'P') + t;
            if (!i(t, r)) {
              if (!s(t)) return 'F';
              if (!n) return 'E';
              f(t);
            }
            return t[r].i;
          },
          getWeak: function(t, n) {
            if (!i(t, r)) {
              if (!s(t)) return !0;
              if (!n) return !1;
              f(t);
            }
            return t[r].w;
          },
          onFreeze: function(t) {
            return c && l.NEED && s(t) && !i(t, r) && f(t), t;
          }
        });
    },
    function(t, n) {
      t.exports = !1;
    },
    function(t, n, e) {
      var r = e(5)('unscopables'),
        o = Array.prototype;
      void 0 == o[r] && e(21)(o, r, {}),
        (t.exports = function(t) {
          o[r][t] = !0;
        });
    },
    function(t, n) {
      (function(n) {
        t.exports = n;
      }.call(this, {}));
    },
    function(t, n) {
      t.exports = function(t, n) {
        return {
          enumerable: !(1 & t),
          configurable: !(2 & t),
          writable: !(4 & t),
          value: n
        };
      };
    },
    function(t, n) {
      var e = 0,
        r = Math.random();
      t.exports = function(t) {
        return 'Symbol('.concat(
          void 0 === t ? '' : t,
          ')_',
          (++e + r).toString(36)
        );
      };
    },
    function(t, n, e) {
      var r = e(170),
        o = e(122);
      t.exports =
        Object.keys ||
        function(t) {
          return r(t, o);
        };
    },
    function(t, n, e) {
      var r = e(40),
        o = Math.max,
        i = Math.min;
      t.exports = function(t, n) {
        return (t = r(t)) < 0 ? o(t + n, 0) : i(t, n);
      };
    },
    function(t, n, e) {
      var r = e(1),
        o = e(171),
        i = e(122),
        a = e(121)('IE_PROTO'),
        u = function() {},
        s = function() {
          var t,
            n = e(119)('iframe'),
            r = i.length;
          for (
            n.style.display = 'none',
              e(123).appendChild(n),
              n.src = 'javascript:',
              (t = n.contentWindow.document).open(),
              t.write('<script>document.F=Object</script>'),
              t.close(),
              s = t.F;
            r--;

          )
            delete s.prototype[i[r]];
          return s();
        };
      t.exports =
        Object.create ||
        function(t, n) {
          var e;
          return (
            null !== t
              ? ((u.prototype = r(t)),
                (e = new u()),
                (u.prototype = null),
                (e[a] = t))
              : (e = s()),
            void 0 === n ? e : o(e, n)
          );
        };
    },
    function(t, n, e) {
      var r = e(170),
        o = e(122).concat('length', 'prototype');
      n.f =
        Object.getOwnPropertyNames ||
        function(t) {
          return r(t, o);
        };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Object', { create: e(56) });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Object', { setPrototypeOf: e(124).set });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(189);
      r(r.P + r.F * !e(35)([].reduce, !0), 'Array', {
        reduce: function(t) {
          return o(this, t, arguments.length, arguments[1], !1);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(2),
        o = e(9),
        i = e(8),
        a = e(5)('species');
      t.exports = function(t) {
        var n = r[t];
        i &&
          n &&
          !n[a] &&
          o.f(n, a, {
            configurable: !0,
            get: function() {
              return this;
            }
          });
      };
    },
    function(t, n, e) {
      e(97)('replace', 2, function(t, n, e) {
        return [
          function(r, o) {
            'use strict';
            var i = t(this),
              a = void 0 == r ? void 0 : r[n];
            return void 0 !== a ? a.call(r, i, o) : e.call(String(i), r, o);
          },
          e
        ];
      });
    },
    function(t, n, e) {
      e(97)('split', 2, function(t, n, r) {
        'use strict';
        var o = e(94),
          i = r,
          a = [].push;
        if (
          'c' == 'abbc'.split(/(b)*/)[1] ||
          4 != 'test'.split(/(?:)/, -1).length ||
          2 != 'ab'.split(/(?:ab)*/).length ||
          4 != '.'.split(/(.?)(.?)/).length ||
          '.'.split(/()()/).length > 1 ||
          ''.split(/.?/).length
        ) {
          var u = void 0 === /()??/.exec('')[1];
          r = function(t, n) {
            var e = String(this);
            if (void 0 === t && 0 === n) return [];
            if (!o(t)) return i.call(e, t, n);
            var r,
              s,
              c,
              f,
              l,
              p = [],
              h =
                (t.ignoreCase ? 'i' : '') +
                (t.multiline ? 'm' : '') +
                (t.unicode ? 'u' : '') +
                (t.sticky ? 'y' : ''),
              d = 0,
              v = void 0 === n ? 4294967295 : n >>> 0,
              y = new RegExp(t.source, h + 'g');
            for (
              u || (r = new RegExp('^' + y.source + '$(?!\\s)', h));
              (s = y.exec(e)) &&
              !(
                (c = s.index + s[0].length) > d &&
                (p.push(e.slice(d, s.index)),
                !u &&
                  s.length > 1 &&
                  s[0].replace(r, function() {
                    for (l = 1; l < arguments.length - 2; l++)
                      void 0 === arguments[l] && (s[l] = void 0);
                  }),
                s.length > 1 && s.index < e.length && a.apply(p, s.slice(1)),
                (f = s[0].length),
                (d = c),
                p.length >= v)
              );

            )
              y.lastIndex === s.index && y.lastIndex++;
            return (
              d === e.length
                ? (!f && y.test('')) || p.push('')
                : p.push(e.slice(d)),
              p.length > v ? p.slice(0, v) : p
            );
          };
        } else
          '0'.split(void 0, 0).length &&
            (r = function(t, n) {
              return void 0 === t && 0 === n ? [] : i.call(this, t, n);
            });
        return [
          function(e, o) {
            var i = t(this),
              a = void 0 == e ? void 0 : e[n];
            return void 0 !== a ? a.call(e, i, o) : r.call(String(i), e, o);
          },
          r
        ];
      });
    },
    function(t, n) {
      t.exports = function(t, n, e, r) {
        if (!(t instanceof n) || (void 0 !== r && r in t))
          throw TypeError(e + ': incorrect invocation!');
        return t;
      };
    },
    function(t, n, e) {
      var r = e(32),
        o = e(187),
        i = e(136),
        a = e(1),
        u = e(10),
        s = e(138),
        c = {},
        f = {};
      ((n = t.exports = function(t, n, e, l, p) {
        var h,
          d,
          v,
          y,
          g = p
            ? function() {
                return t;
              }
            : s(t),
          m = r(e, l, n ? 2 : 1),
          b = 0;
        if ('function' != typeof g) throw TypeError(t + ' is not iterable!');
        if (i(g)) {
          for (h = u(t.length); h > b; b++)
            if ((y = n ? m(a((d = t[b]))[0], d[1]) : m(t[b])) === c || y === f)
              return y;
        } else
          for (v = g.call(t); !(d = v.next()).done; )
            if ((y = o(v, m, d.value, n)) === c || y === f) return y;
      }).BREAK = c),
        (n.RETURN = f);
    },
    function(t, n, e) {
      var r = e(22);
      t.exports = function(t, n, e) {
        for (var o in n) r(t, o, n[o], e);
        return t;
      };
    },
    function(t, n, e) {
      var r = e(151),
        o = e(152);
      t.exports = function(t, n, e, i) {
        var a = !e;
        e || (e = {});
        for (var u = -1, s = n.length; ++u < s; ) {
          var c = n[u],
            f = i ? i(e[c], t[c], c, e, t) : void 0;
          void 0 === f && (f = t[c]), a ? o(e, c, f) : r(e, c, f);
        }
        return e;
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return (
          t.webpackPolyfill ||
            ((t.deprecate = function() {}),
            (t.paths = []),
            t.children || (t.children = []),
            Object.defineProperty(t, 'loaded', {
              enumerable: !0,
              get: function() {
                return t.l;
              }
            }),
            Object.defineProperty(t, 'id', {
              enumerable: !0,
              get: function() {
                return t.i;
              }
            }),
            (t.webpackPolyfill = 1)),
          t
        );
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        for (var e = -1, r = null == t ? 0 : t.length, o = Array(r); ++e < r; )
          o[e] = n(t[e], e, t);
        return o;
      };
    },
    function(t, n, e) {
      var r = e(113),
        o = e(215),
        i = e(114),
        a = '[object Object]',
        u = Function.prototype,
        s = Object.prototype,
        c = u.toString,
        f = s.hasOwnProperty,
        l = c.call(Object);
      t.exports = function(t) {
        if (!i(t) || r(t) != a) return !1;
        var n = o(t);
        if (null === n) return !0;
        var e = f.call(n, 'constructor') && n.constructor;
        return 'function' == typeof e && e instanceof e && c.call(e) == l;
      };
    },
    function(t, n, e) {
      var r = e(9).f,
        o = e(25),
        i = e(5)('toStringTag');
      t.exports = function(t, n, e) {
        t &&
          !o((t = e ? t : t.prototype), i) &&
          r(t, i, { configurable: !0, value: n });
      };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S + r.F, 'Object', { assign: e(174) });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(39),
        i = e(3),
        a = e(125),
        u = '[' + a + ']',
        s = RegExp('^' + u + u + '*'),
        c = RegExp(u + u + '*$'),
        f = function(t, n, e) {
          var o = {},
            u = i(function() {
              return !!a[t]() || '​' != '​'[t]();
            }),
            s = (o[t] = u ? n(l) : a[t]);
          e && (o[e] = s), r(r.P + r.F * u, 'String', o);
        },
        l = (f.trim = function(t, n) {
          return (
            (t = String(o(t))),
            1 & n && (t = t.replace(s, '')),
            2 & n && (t = t.replace(c, '')),
            t
          );
        });
      t.exports = f;
    },
    function(t, n) {
      t.exports = {};
    },
    function(t, n, e) {
      var r = e(4);
      t.exports = function(t, n) {
        if (!r(t) || t._t !== n)
          throw TypeError('Incompatible receiver, ' + n + ' required!');
        return t;
      };
    },
    function(t, n, e) {
      var r = e(30),
        o = e(440),
        i = e(441),
        a = e(157);
      t.exports = function(t, n) {
        return r(t) ? t : o(t, n) ? [t] : i(a(t));
      };
    },
    function(t, n, e) {
      var r = e(165),
        o = e(224),
        i = e(226);
      t.exports = function(t, n) {
        return i(o(t, n, r), t + '');
      };
    },
    function(t, n, e) {
      var r = e(113),
        o = e(37),
        i = '[object AsyncFunction]',
        a = '[object Function]',
        u = '[object GeneratorFunction]',
        s = '[object Proxy]';
      t.exports = function(t) {
        if (!o(t)) return !1;
        var n = r(t);
        return n == a || n == u || n == i || n == s;
      };
    },
    function(t, n, e) {
      var r = e(33);
      t.exports = Object('z').propertyIsEnumerable(0)
        ? Object
        : function(t) {
            return 'String' == r(t) ? t.split('') : Object(t);
          };
    },
    function(t, n) {
      n.f = {}.propertyIsEnumerable;
    },
    function(t, n, e) {
      var r = e(33),
        o = e(5)('toStringTag'),
        i =
          'Arguments' ==
          r(
            (function() {
              return arguments;
            })()
          );
      t.exports = function(t) {
        var n, e, a;
        return void 0 === t
          ? 'Undefined'
          : null === t
          ? 'Null'
          : 'string' ==
            typeof (e = (function(t, n) {
              try {
                return t[n];
              } catch (t) {}
            })((n = Object(t)), o))
          ? e
          : i
          ? r(n)
          : 'Object' == (a = r(n)) && 'function' == typeof n.callee
          ? 'Arguments'
          : a;
      };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.P, 'Function', { bind: e(175) });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(134);
      r(r.P + r.F * e(135)('includes'), 'String', {
        includes: function(t) {
          return !!~o(this, t, 'includes').indexOf(
            t,
            arguments.length > 1 ? arguments[1] : void 0
          );
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(90)(!0);
      r(r.P, 'Array', {
        includes: function(t) {
          return o(this, t, arguments.length > 1 ? arguments[1] : void 0);
        }
      }),
        e(50)('includes');
    },
    function(t, n, e) {
      var r = e(159);
      t.exports = function(t) {
        return null != t && t.length ? r(t, 1) : [];
      };
    },
    function(t, n, e) {
      var r = e(477)();
      t.exports = r;
    },
    function(t, n) {
      t.exports = function(t) {
        for (var n = -1, e = null == t ? 0 : t.length, r = {}; ++n < e; ) {
          var o = t[n];
          r[o[0]] = o[1];
        }
        return r;
      };
    },
    function(t, n) {
      var e;
      e = (function() {
        return this;
      })();
      try {
        e = e || new Function('return this')();
      } catch (t) {
        'object' == typeof window && (e = window);
      }
      t.exports = e;
    },
    function(t, n, e) {
      var r = e(31),
        o = e(2),
        i = o['__core-js_shared__'] || (o['__core-js_shared__'] = {});
      (t.exports = function(t, n) {
        return i[t] || (i[t] = void 0 !== n ? n : {});
      })('versions', []).push({
        version: r.version,
        mode: e(49) ? 'pure' : 'global',
        copyright: '© 2018 Denis Pushkarev (zloirock.ru)'
      });
    },
    function(t, n, e) {
      var r = e(26),
        o = e(10),
        i = e(55);
      t.exports = function(t) {
        return function(n, e, a) {
          var u,
            s = r(n),
            c = o(s.length),
            f = i(a, c);
          if (t && e != e) {
            for (; c > f; ) if ((u = s[f++]) != u) return !0;
          } else
            for (; c > f; f++)
              if ((t || f in s) && s[f] === e) return t || f || 0;
          return !t && -1;
        };
      };
    },
    function(t, n) {
      n.f = Object.getOwnPropertySymbols;
    },
    function(t, n, e) {
      var r = e(33);
      t.exports =
        Array.isArray ||
        function(t) {
          return 'Array' == r(t);
        };
    },
    function(t, n, e) {
      var r = e(9).f,
        o = Function.prototype,
        i = /^\s*function ([^ (]*)/;
      'name' in o ||
        (e(8) &&
          r(o, 'name', {
            configurable: !0,
            get: function() {
              try {
                return ('' + this).match(i)[1];
              } catch (t) {
                return '';
              }
            }
          }));
    },
    function(t, n, e) {
      var r = e(4),
        o = e(33),
        i = e(5)('match');
      t.exports = function(t) {
        var n;
        return r(t) && (void 0 !== (n = t[i]) ? !!n : 'RegExp' == o(t));
      };
    },
    function(t, n, e) {
      var r = e(5)('iterator'),
        o = !1;
      try {
        var i = [7][r]();
        (i.return = function() {
          o = !0;
        }),
          Array.from(i, function() {
            throw 2;
          });
      } catch (t) {}
      t.exports = function(t, n) {
        if (!n && !o) return !1;
        var e = !1;
        try {
          var i = [7],
            a = i[r]();
          (a.next = function() {
            return { done: (e = !0) };
          }),
            (i[r] = function() {
              return a;
            }),
            t(i);
        } catch (t) {}
        return e;
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(1);
      t.exports = function() {
        var t = r(this),
          n = '';
        return (
          t.global && (n += 'g'),
          t.ignoreCase && (n += 'i'),
          t.multiline && (n += 'm'),
          t.unicode && (n += 'u'),
          t.sticky && (n += 'y'),
          n
        );
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(21),
        o = e(22),
        i = e(3),
        a = e(39),
        u = e(5);
      t.exports = function(t, n, e) {
        var s = u(t),
          c = e(a, s, ''[t]),
          f = c[0],
          l = c[1];
        i(function() {
          var n = {};
          return (
            (n[s] = function() {
              return 7;
            }),
            7 != ''[t](n)
          );
        }) &&
          (o(String.prototype, t, f),
          r(
            RegExp.prototype,
            s,
            2 == n
              ? function(t, n) {
                  return l.call(t, this, n);
                }
              : function(t) {
                  return l.call(t, this);
                }
          ));
      };
    },
    function(t, n, e) {
      var r = e(1),
        o = e(18),
        i = e(5)('species');
      t.exports = function(t, n) {
        var e,
          a = r(t).constructor;
        return void 0 === a || void 0 == (e = r(a)[i]) ? n : o(e);
      };
    },
    function(t, n, e) {
      var r = e(2).navigator;
      t.exports = (r && r.userAgent) || '';
    },
    function(t, n, e) {
      'use strict';
      var r = e(2),
        o = e(0),
        i = e(22),
        a = e(66),
        u = e(48),
        s = e(65),
        c = e(64),
        f = e(4),
        l = e(3),
        p = e(95),
        h = e(71),
        d = e(126);
      t.exports = function(t, n, e, v, y, g) {
        var m = r[t],
          b = m,
          w = y ? 'set' : 'add',
          x = b && b.prototype,
          O = {},
          S = function(t) {
            var n = x[t];
            i(
              x,
              t,
              'delete' == t
                ? function(t) {
                    return !(g && !f(t)) && n.call(this, 0 === t ? 0 : t);
                  }
                : 'has' == t
                ? function(t) {
                    return !(g && !f(t)) && n.call(this, 0 === t ? 0 : t);
                  }
                : 'get' == t
                ? function(t) {
                    return g && !f(t) ? void 0 : n.call(this, 0 === t ? 0 : t);
                  }
                : 'add' == t
                ? function(t) {
                    return n.call(this, 0 === t ? 0 : t), this;
                  }
                : function(t, e) {
                    return n.call(this, 0 === t ? 0 : t, e), this;
                  }
            );
          };
        if (
          'function' == typeof b &&
          (g ||
            (x.forEach &&
              !l(function() {
                new b().entries().next();
              })))
        ) {
          var _ = new b(),
            j = _[w](g ? {} : -0, 1) != _,
            k = l(function() {
              _.has(1);
            }),
            E = p(function(t) {
              new b(t);
            }),
            P =
              !g &&
              l(function() {
                for (var t = new b(), n = 5; n--; ) t[w](n, n);
                return !t.has(-0);
              });
          E ||
            (((b = n(function(n, e) {
              c(n, b, t);
              var r = d(new m(), n, b);
              return void 0 != e && s(e, y, r[w], r), r;
            })).prototype = x),
            (x.constructor = b)),
            (k || P) && (S('delete'), S('has'), y && S('get')),
            (P || j) && S(w),
            g && x.clear && delete x.clear;
        } else
          (b = v.getConstructor(n, t, y, w)), a(b.prototype, e), (u.NEED = !0);
        return (
          h(b, t),
          (O[t] = b),
          o(o.G + o.W + o.F * (b != m), O),
          g || v.setStrong(b, t, y),
          b
        );
      };
    },
    function(t, n, e) {
      for (
        var r,
          o = e(2),
          i = e(21),
          a = e(53),
          u = a('typed_array'),
          s = a('view'),
          c = !(!o.ArrayBuffer || !o.DataView),
          f = c,
          l = 0,
          p = 'Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array'.split(
            ','
          );
        l < 9;

      )
        (r = o[p[l++]])
          ? (i(r.prototype, u, !0), i(r.prototype, s, !0))
          : (f = !1);
      t.exports = { ABV: c, CONSTR: f, TYPED: u, VIEW: s };
    },
    function(t, n, e) {
      var r = e(27),
        o = e(28),
        i = e(25),
        a = e(0),
        u = e(4),
        s = e(1);
      a(a.S, 'Reflect', {
        get: function t(n, e) {
          var a,
            c,
            f = arguments.length < 3 ? n : arguments[2];
          return s(n) === f
            ? n[e]
            : (a = r.f(n, e))
            ? i(a, 'value')
              ? a.value
              : void 0 !== a.get
              ? a.get.call(f)
              : void 0
            : u((c = o(n)))
            ? t(c, e, f)
            : void 0;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(207)(!0);
      r(r.S, 'Object', {
        entries: function(t) {
          return o(t);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      t.exports =
        e(49) ||
        !e(3)(function() {
          var t = Math.random();
          __defineSetter__.call(null, t, function() {}), delete e(2)[t];
        });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0);
      t.exports = function(t) {
        r(r.S, t, {
          of: function() {
            for (var t = arguments.length, n = new Array(t); t--; )
              n[t] = arguments[t];
            return new this(n);
          }
        });
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(18),
        i = e(32),
        a = e(65);
      t.exports = function(t) {
        r(r.S, t, {
          from: function(t) {
            var n,
              e,
              r,
              u,
              s = arguments[1];
            return (
              o(this),
              (n = void 0 !== s) && o(s),
              void 0 == t
                ? new this()
                : ((e = []),
                  n
                    ? ((r = 0),
                      (u = i(s, arguments[2], 2)),
                      a(t, !1, function(t) {
                        e.push(u(t, r++));
                      }))
                    : a(t, !1, e.push, e),
                  new this(e))
            );
          }
        });
      };
    },
    function(t, n, e) {
      var r = e(108);
      t.exports = function(t, n) {
        for (var e = t.length; e--; ) if (r(t[e][0], n)) return e;
        return -1;
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        return t === n || (t != t && n != n);
      };
    },
    function(t, n) {
      t.exports = function(t) {
        var n = [];
        if (null != t) for (var e in Object(t)) n.push(e);
        return n;
      };
    },
    function(t, n, e) {
      var r = e(423),
        o = 'object' == typeof self && self && self.Object === Object && self,
        i = r || o || Function('return this')();
      t.exports = i;
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n, e) {
      var r = e(456),
        o = e(114);
      t.exports = function(t) {
        return o(t) && r(t);
      };
    },
    function(t, n) {
      var e = Object.prototype.toString;
      t.exports = function(t) {
        return e.call(t);
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return null != t && 'object' == typeof t;
      };
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n, e) {
      var r = e(444),
        o = e(223)(function(t, n) {
          return null == t ? {} : r(t, n);
        });
      t.exports = o;
    },
    function(t, n, e) {
      var r = e(150),
        o = 1,
        i = 4;
      t.exports = function(t) {
        return r(t, o | i);
      };
    },
    function(t, n, e) {
      var r = e(69),
        o = e(150),
        i = e(457),
        a = e(76),
        u = e(67),
        s = e(461),
        c = e(223),
        f = e(155),
        l = c(function(t, n) {
          var e = {};
          if (null == t) return e;
          var c = !1;
          (n = r(n, function(n) {
            return (n = a(n, t)), c || (c = n.length > 1), n;
          })),
            u(t, f(t), e),
            c && (e = o(e, 7, s));
          for (var l = n.length; l--; ) i(e, n[l]);
          return e;
        });
      t.exports = l;
    },
    function(t, n, e) {
      var r = e(4),
        o = e(2).document,
        i = r(o) && r(o.createElement);
      t.exports = function(t) {
        return i ? o.createElement(t) : {};
      };
    },
    function(t, n, e) {
      var r = e(2),
        o = e(31),
        i = e(49),
        a = e(169),
        u = e(9).f;
      t.exports = function(t) {
        var n = o.Symbol || (o.Symbol = i ? {} : r.Symbol || {});
        '_' == t.charAt(0) || t in n || u(n, t, { value: a.f(t) });
      };
    },
    function(t, n, e) {
      var r = e(89)('keys'),
        o = e(53);
      t.exports = function(t) {
        return r[t] || (r[t] = o(t));
      };
    },
    function(t, n) {
      t.exports = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(
        ','
      );
    },
    function(t, n, e) {
      var r = e(2).document;
      t.exports = r && r.documentElement;
    },
    function(t, n, e) {
      var r = e(4),
        o = e(1),
        i = function(t, n) {
          if ((o(t), !r(n) && null !== n))
            throw TypeError(n + ": can't set as prototype!");
        };
      t.exports = {
        set:
          Object.setPrototypeOf ||
          ('__proto__' in {}
            ? (function(t, n, r) {
                try {
                  (r = e(32)(
                    Function.call,
                    e(27).f(Object.prototype, '__proto__').set,
                    2
                  ))(t, []),
                    (n = !(t instanceof Array));
                } catch (t) {
                  n = !0;
                }
                return function(t, e) {
                  return i(t, e), n ? (t.__proto__ = e) : r(t, e), t;
                };
              })({}, !1)
            : void 0),
        check: i
      };
    },
    function(t, n) {
      t.exports = '\t\n\v\f\r   ᠎             　\u2028\u2029\ufeff';
    },
    function(t, n, e) {
      var r = e(4),
        o = e(124).set;
      t.exports = function(t, n, e) {
        var i,
          a = n.constructor;
        return (
          a !== e &&
            'function' == typeof a &&
            (i = a.prototype) !== e.prototype &&
            r(i) &&
            o &&
            o(t, i),
          t
        );
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(40),
        o = e(39);
      t.exports = function(t) {
        var n = String(o(this)),
          e = '',
          i = r(t);
        if (i < 0 || i == 1 / 0) throw RangeError("Count can't be negative");
        for (; i > 0; (i >>>= 1) && (n += n)) 1 & i && (e += n);
        return e;
      };
    },
    function(t, n) {
      t.exports =
        Math.sign ||
        function(t) {
          return 0 == (t = +t) || t != t ? t : t < 0 ? -1 : 1;
        };
    },
    function(t, n) {
      var e = Math.expm1;
      t.exports =
        !e ||
        e(10) > 22025.465794806718 ||
        e(10) < 22025.465794806718 ||
        -2e-17 != e(-2e-17)
          ? function(t) {
              return 0 == (t = +t)
                ? t
                : t > -1e-6 && t < 1e-6
                ? t + (t * t) / 2
                : Math.exp(t) - 1;
            }
          : e;
    },
    function(t, n, e) {
      'use strict';
      e(73)('trim', function(t) {
        return function() {
          return t(this, 3);
        };
      });
    },
    function(t, n, e) {
      var r = e(40),
        o = e(39);
      t.exports = function(t) {
        return function(n, e) {
          var i,
            a,
            u = String(o(n)),
            s = r(e),
            c = u.length;
          return s < 0 || s >= c
            ? t
              ? ''
              : void 0
            : (i = u.charCodeAt(s)) < 55296 ||
              i > 56319 ||
              s + 1 === c ||
              (a = u.charCodeAt(s + 1)) < 56320 ||
              a > 57343
            ? t
              ? u.charAt(s)
              : i
            : t
            ? u.slice(s, s + 2)
            : a - 56320 + ((i - 55296) << 10) + 65536;
        };
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(49),
        o = e(0),
        i = e(22),
        a = e(21),
        u = e(74),
        s = e(133),
        c = e(71),
        f = e(28),
        l = e(5)('iterator'),
        p = !([].keys && 'next' in [].keys()),
        h = function() {
          return this;
        };
      t.exports = function(t, n, e, d, v, y, g) {
        s(e, n, d);
        var m,
          b,
          w,
          x = function(t) {
            if (!p && t in j) return j[t];
            switch (t) {
              case 'keys':
              case 'values':
                return function() {
                  return new e(this, t);
                };
            }
            return function() {
              return new e(this, t);
            };
          },
          O = n + ' Iterator',
          S = 'values' == v,
          _ = !1,
          j = t.prototype,
          k = j[l] || j['@@iterator'] || (v && j[v]),
          E = k || x(v),
          P = v ? (S ? x('entries') : E) : void 0,
          A = ('Array' == n && j.entries) || k;
        if (
          (A &&
            (w = f(A.call(new t()))) !== Object.prototype &&
            w.next &&
            (c(w, O, !0), r || 'function' == typeof w[l] || a(w, l, h)),
          S &&
            k &&
            'values' !== k.name &&
            ((_ = !0),
            (E = function() {
              return k.call(this);
            })),
          (r && !g) || (!p && !_ && j[l]) || a(j, l, E),
          (u[n] = E),
          (u[O] = h),
          v)
        )
          if (
            ((m = {
              values: S ? E : x('values'),
              keys: y ? E : x('keys'),
              entries: P
            }),
            g)
          )
            for (b in m) b in j || i(j, b, m[b]);
          else o(o.P + o.F * (p || _), n, m);
        return m;
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(56),
        o = e(52),
        i = e(71),
        a = {};
      e(21)(a, e(5)('iterator'), function() {
        return this;
      }),
        (t.exports = function(t, n, e) {
          (t.prototype = r(a, { next: o(1, e) })), i(t, n + ' Iterator');
        });
    },
    function(t, n, e) {
      var r = e(94),
        o = e(39);
      t.exports = function(t, n, e) {
        if (r(n)) throw TypeError('String#' + e + " doesn't accept regex!");
        return String(o(t));
      };
    },
    function(t, n, e) {
      var r = e(5)('match');
      t.exports = function(t) {
        var n = /./;
        try {
          '/./'[t](n);
        } catch (e) {
          try {
            return (n[r] = !1), !'/./'[t](n);
          } catch (t) {}
        }
        return !0;
      };
    },
    function(t, n, e) {
      var r = e(74),
        o = e(5)('iterator'),
        i = Array.prototype;
      t.exports = function(t) {
        return void 0 !== t && (r.Array === t || i[o] === t);
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(9),
        o = e(52);
      t.exports = function(t, n, e) {
        n in t ? r.f(t, n, o(0, e)) : (t[n] = e);
      };
    },
    function(t, n, e) {
      var r = e(81),
        o = e(5)('iterator'),
        i = e(74);
      t.exports = e(31).getIteratorMethod = function(t) {
        if (void 0 != t) return t[o] || t['@@iterator'] || i[r(t)];
      };
    },
    function(t, n, e) {
      var r = e(323);
      t.exports = function(t, n) {
        return new (r(t))(n);
      };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.P, 'Array', { fill: e(141) }), e(50)('fill');
    },
    function(t, n, e) {
      'use strict';
      var r = e(12),
        o = e(55),
        i = e(10);
      t.exports = function(t) {
        for (
          var n = r(this),
            e = i(n.length),
            a = arguments.length,
            u = o(a > 1 ? arguments[1] : void 0, e),
            s = a > 2 ? arguments[2] : void 0,
            c = void 0 === s ? e : o(s, e);
          c > u;

        )
          n[u++] = t;
        return n;
      };
    },
    function(t, n, e) {
      var r,
        o,
        i,
        a = e(32),
        u = e(176),
        s = e(123),
        c = e(119),
        f = e(2),
        l = f.process,
        p = f.setImmediate,
        h = f.clearImmediate,
        d = f.MessageChannel,
        v = f.Dispatch,
        y = 0,
        g = {},
        m = function() {
          var t = +this;
          if (g.hasOwnProperty(t)) {
            var n = g[t];
            delete g[t], n();
          }
        },
        b = function(t) {
          m.call(t.data);
        };
      (p && h) ||
        ((p = function(t) {
          for (var n = [], e = 1; arguments.length > e; )
            n.push(arguments[e++]);
          return (
            (g[++y] = function() {
              u('function' == typeof t ? t : Function(t), n);
            }),
            r(y),
            y
          );
        }),
        (h = function(t) {
          delete g[t];
        }),
        'process' == e(33)(l)
          ? (r = function(t) {
              l.nextTick(a(m, t, 1));
            })
          : v && v.now
          ? (r = function(t) {
              v.now(a(m, t, 1));
            })
          : d
          ? ((i = (o = new d()).port2),
            (o.port1.onmessage = b),
            (r = a(i.postMessage, i, 1)))
          : f.addEventListener &&
            'function' == typeof postMessage &&
            !f.importScripts
          ? ((r = function(t) {
              f.postMessage(t + '', '*');
            }),
            f.addEventListener('message', b, !1))
          : (r =
              'onreadystatechange' in c('script')
                ? function(t) {
                    s.appendChild(c('script')).onreadystatechange = function() {
                      s.removeChild(this), m.call(t);
                    };
                  }
                : function(t) {
                    setTimeout(a(m, t, 1), 0);
                  })),
        (t.exports = { set: p, clear: h });
    },
    function(t, n, e) {
      var r = e(2),
        o = e(142).set,
        i = r.MutationObserver || r.WebKitMutationObserver,
        a = r.process,
        u = r.Promise,
        s = 'process' == e(33)(a);
      t.exports = function() {
        var t,
          n,
          e,
          c = function() {
            var r, o;
            for (s && (r = a.domain) && r.exit(); t; ) {
              (o = t.fn), (t = t.next);
              try {
                o();
              } catch (r) {
                throw (t ? e() : (n = void 0), r);
              }
            }
            (n = void 0), r && r.enter();
          };
        if (s)
          e = function() {
            a.nextTick(c);
          };
        else if (!i || (r.navigator && r.navigator.standalone))
          if (u && u.resolve) {
            var f = u.resolve(void 0);
            e = function() {
              f.then(c);
            };
          } else
            e = function() {
              o.call(r, c);
            };
        else {
          var l = !0,
            p = document.createTextNode('');
          new i(c).observe(p, { characterData: !0 }),
            (e = function() {
              p.data = l = !l;
            });
        }
        return function(r) {
          var o = { fn: r, next: void 0 };
          n && (n.next = o), t || ((t = o), e()), (n = o);
        };
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(18);
      t.exports.f = function(t) {
        return new (function(t) {
          var n, e;
          (this.promise = new t(function(t, r) {
            if (void 0 !== n || void 0 !== e)
              throw TypeError('Bad Promise constructor');
            (n = t), (e = r);
          })),
            (this.resolve = r(n)),
            (this.reject = r(e));
        })(t);
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(198),
        o = e(75);
      t.exports = e(100)(
        'Set',
        function(t) {
          return function() {
            return t(this, arguments.length > 0 ? arguments[0] : void 0);
          };
        },
        {
          add: function(t) {
            return r.def(o(this, 'Set'), (t = 0 === t ? 0 : t), t);
          }
        },
        r
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(2),
        o = e(8),
        i = e(49),
        a = e(101),
        u = e(21),
        s = e(66),
        c = e(3),
        f = e(64),
        l = e(40),
        p = e(10),
        h = e(201),
        d = e(57).f,
        v = e(9).f,
        y = e(141),
        g = e(71),
        m = 'prototype',
        b = 'Wrong index!',
        w = r.ArrayBuffer,
        x = r.DataView,
        O = r.Math,
        S = r.RangeError,
        _ = r.Infinity,
        j = w,
        k = O.abs,
        E = O.pow,
        P = O.floor,
        A = O.log,
        T = O.LN2,
        R = o ? '_b' : 'buffer',
        M = o ? '_l' : 'byteLength',
        F = o ? '_o' : 'byteOffset';
      function C(t, n, e) {
        var r,
          o,
          i,
          a = new Array(e),
          u = 8 * e - n - 1,
          s = (1 << u) - 1,
          c = s >> 1,
          f = 23 === n ? E(2, -24) - E(2, -77) : 0,
          l = 0,
          p = t < 0 || (0 === t && 1 / t < 0) ? 1 : 0;
        for (
          (t = k(t)) != t || t === _
            ? ((o = t != t ? 1 : 0), (r = s))
            : ((r = P(A(t) / T)),
              t * (i = E(2, -r)) < 1 && (r--, (i *= 2)),
              (t += r + c >= 1 ? f / i : f * E(2, 1 - c)) * i >= 2 &&
                (r++, (i /= 2)),
              r + c >= s
                ? ((o = 0), (r = s))
                : r + c >= 1
                ? ((o = (t * i - 1) * E(2, n)), (r += c))
                : ((o = t * E(2, c - 1) * E(2, n)), (r = 0)));
          n >= 8;
          a[l++] = 255 & o, o /= 256, n -= 8
        );
        for (
          r = (r << n) | o, u += n;
          u > 0;
          a[l++] = 255 & r, r /= 256, u -= 8
        );
        return (a[--l] |= 128 * p), a;
      }
      function I(t, n, e) {
        var r,
          o = 8 * e - n - 1,
          i = (1 << o) - 1,
          a = i >> 1,
          u = o - 7,
          s = e - 1,
          c = t[s--],
          f = 127 & c;
        for (c >>= 7; u > 0; f = 256 * f + t[s], s--, u -= 8);
        for (
          r = f & ((1 << -u) - 1), f >>= -u, u += n;
          u > 0;
          r = 256 * r + t[s], s--, u -= 8
        );
        if (0 === f) f = 1 - a;
        else {
          if (f === i) return r ? NaN : c ? -_ : _;
          (r += E(2, n)), (f -= a);
        }
        return (c ? -1 : 1) * r * E(2, f - n);
      }
      function L(t) {
        return (t[3] << 24) | (t[2] << 16) | (t[1] << 8) | t[0];
      }
      function N(t) {
        return [255 & t];
      }
      function D(t) {
        return [255 & t, (t >> 8) & 255];
      }
      function B(t) {
        return [255 & t, (t >> 8) & 255, (t >> 16) & 255, (t >> 24) & 255];
      }
      function U(t) {
        return C(t, 52, 8);
      }
      function z(t) {
        return C(t, 23, 4);
      }
      function q(t, n, e) {
        v(t[m], n, {
          get: function() {
            return this[e];
          }
        });
      }
      function G(t, n, e, r) {
        var o = h(+e);
        if (o + n > t[M]) throw S(b);
        var i = t[R]._b,
          a = o + t[F],
          u = i.slice(a, a + n);
        return r ? u : u.reverse();
      }
      function V(t, n, e, r, o, i) {
        var a = h(+e);
        if (a + n > t[M]) throw S(b);
        for (var u = t[R]._b, s = a + t[F], c = r(+o), f = 0; f < n; f++)
          u[s + f] = c[i ? f : n - f - 1];
      }
      if (a.ABV) {
        if (
          !c(function() {
            w(1);
          }) ||
          !c(function() {
            new w(-1);
          }) ||
          c(function() {
            return new w(), new w(1.5), new w(NaN), 'ArrayBuffer' != w.name;
          })
        ) {
          for (
            var W,
              H = ((w = function(t) {
                return f(this, w), new j(h(t));
              })[m] = j[m]),
              $ = d(j),
              J = 0;
            $.length > J;

          )
            (W = $[J++]) in w || u(w, W, j[W]);
          i || (H.constructor = w);
        }
        var Y = new x(new w(2)),
          X = x[m].setInt8;
        Y.setInt8(0, 2147483648),
          Y.setInt8(1, 2147483649),
          (!Y.getInt8(0) && Y.getInt8(1)) ||
            s(
              x[m],
              {
                setInt8: function(t, n) {
                  X.call(this, t, (n << 24) >> 24);
                },
                setUint8: function(t, n) {
                  X.call(this, t, (n << 24) >> 24);
                }
              },
              !0
            );
      } else
        (w = function(t) {
          f(this, w, 'ArrayBuffer');
          var n = h(t);
          (this._b = y.call(new Array(n), 0)), (this[M] = n);
        }),
          (x = function(t, n, e) {
            f(this, x, 'DataView'), f(t, w, 'DataView');
            var r = t[M],
              o = l(n);
            if (o < 0 || o > r) throw S('Wrong offset!');
            if (o + (e = void 0 === e ? r - o : p(e)) > r)
              throw S('Wrong length!');
            (this[R] = t), (this[F] = o), (this[M] = e);
          }),
          o &&
            (q(w, 'byteLength', '_l'),
            q(x, 'buffer', '_b'),
            q(x, 'byteLength', '_l'),
            q(x, 'byteOffset', '_o')),
          s(x[m], {
            getInt8: function(t) {
              return (G(this, 1, t)[0] << 24) >> 24;
            },
            getUint8: function(t) {
              return G(this, 1, t)[0];
            },
            getInt16: function(t) {
              var n = G(this, 2, t, arguments[1]);
              return (((n[1] << 8) | n[0]) << 16) >> 16;
            },
            getUint16: function(t) {
              var n = G(this, 2, t, arguments[1]);
              return (n[1] << 8) | n[0];
            },
            getInt32: function(t) {
              return L(G(this, 4, t, arguments[1]));
            },
            getUint32: function(t) {
              return L(G(this, 4, t, arguments[1])) >>> 0;
            },
            getFloat32: function(t) {
              return I(G(this, 4, t, arguments[1]), 23, 4);
            },
            getFloat64: function(t) {
              return I(G(this, 8, t, arguments[1]), 52, 8);
            },
            setInt8: function(t, n) {
              V(this, 1, t, N, n);
            },
            setUint8: function(t, n) {
              V(this, 1, t, N, n);
            },
            setInt16: function(t, n) {
              V(this, 2, t, D, n, arguments[2]);
            },
            setUint16: function(t, n) {
              V(this, 2, t, D, n, arguments[2]);
            },
            setInt32: function(t, n) {
              V(this, 4, t, B, n, arguments[2]);
            },
            setUint32: function(t, n) {
              V(this, 4, t, B, n, arguments[2]);
            },
            setFloat32: function(t, n) {
              V(this, 4, t, z, n, arguments[2]);
            },
            setFloat64: function(t, n) {
              V(this, 8, t, U, n, arguments[2]);
            }
          });
      g(w, 'ArrayBuffer'),
        g(x, 'DataView'),
        u(x[m], a.VIEW, !0),
        (n.ArrayBuffer = w),
        (n.DataView = x);
    },
    function(t, n, e) {
      var r = e(27),
        o = e(0),
        i = e(1);
      o(o.S, 'Reflect', {
        getOwnPropertyDescriptor: function(t, n) {
          return r.f(i(t), n);
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Reflect', {
        has: function(t, n) {
          return n in t;
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Reflect', { ownKeys: e(203) });
    },
    function(t, n, e) {
      var r = e(211),
        o = e(418),
        i = e(151),
        a = e(421),
        u = e(422),
        s = e(212),
        c = e(213),
        f = e(424),
        l = e(426),
        p = e(428),
        h = e(155),
        d = e(429),
        v = e(430),
        y = e(431),
        g = e(214),
        m = e(30),
        b = e(216),
        w = e(434),
        x = e(37),
        O = e(435),
        S = e(153),
        _ = 1,
        j = 2,
        k = 4,
        E = '[object Arguments]',
        P = '[object Function]',
        A = '[object GeneratorFunction]',
        T = '[object Object]',
        R = {};
      (R[E] = R['[object Array]'] = R['[object ArrayBuffer]'] = R[
        '[object DataView]'
      ] = R['[object Boolean]'] = R['[object Date]'] = R[
        '[object Float32Array]'
      ] = R['[object Float64Array]'] = R['[object Int8Array]'] = R[
        '[object Int16Array]'
      ] = R['[object Int32Array]'] = R['[object Map]'] = R[
        '[object Number]'
      ] = R[T] = R['[object RegExp]'] = R['[object Set]'] = R[
        '[object String]'
      ] = R['[object Symbol]'] = R['[object Uint8Array]'] = R[
        '[object Uint8ClampedArray]'
      ] = R['[object Uint16Array]'] = R['[object Uint32Array]'] = !0),
        (R['[object Error]'] = R[P] = R['[object WeakMap]'] = !1),
        (t.exports = function t(n, e, M, F, C, I) {
          var L,
            N = e & _,
            D = e & j,
            B = e & k;
          if ((M && (L = C ? M(n, F, C, I) : M(n)), void 0 !== L)) return L;
          if (!x(n)) return n;
          var U = m(n);
          if (U) {
            if (((L = v(n)), !N)) return c(n, L);
          } else {
            var z = d(n),
              q = z == P || z == A;
            if (b(n)) return s(n, N);
            if (z == T || z == E || (q && !C)) {
              if (((L = D || q ? {} : g(n)), !N))
                return D ? l(n, u(L, n)) : f(n, a(L, n));
            } else {
              if (!R[z]) return C ? n : {};
              L = y(n, z, N);
            }
          }
          I || (I = new r());
          var G = I.get(n);
          if (G) return G;
          if ((I.set(n, L), O(n)))
            return (
              n.forEach(function(r) {
                L.add(t(r, e, M, r, n, I));
              }),
              L
            );
          if (w(n))
            return (
              n.forEach(function(r, o) {
                L.set(o, t(r, e, M, o, n, I));
              }),
              L
            );
          var V = B ? (D ? h : p) : D ? keysIn : S,
            W = U ? void 0 : V(n);
          return (
            o(W || n, function(r, o) {
              W && (r = n[(o = r)]), i(L, o, t(r, e, M, o, n, I));
            }),
            L
          );
        });
    },
    function(t, n, e) {
      var r = e(152),
        o = e(108),
        i = Object.prototype.hasOwnProperty;
      t.exports = function(t, n, e) {
        var a = t[n];
        (i.call(t, n) && o(a, e) && (void 0 !== e || n in t)) || r(t, n, e);
      };
    },
    function(t, n, e) {
      var r = e(419);
      t.exports = function(t, n, e) {
        '__proto__' == n && r
          ? r(t, n, {
              configurable: !0,
              enumerable: !0,
              value: e,
              writable: !0
            })
          : (t[n] = e);
      };
    },
    function(t, n, e) {
      var r = e(154)(Object.keys, Object);
      t.exports = r;
    },
    function(t, n) {
      t.exports = function(t, n) {
        return function(e) {
          return t(n(e));
        };
      };
    },
    function(t, n) {
      t.exports = function(t) {
        var n = [];
        if (null != t) for (var e in Object(t)) n.push(e);
        return n;
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n, e) {
      var r = e(448),
        o = e(449);
      t.exports = function t(n, e, i, a, u) {
        var s = -1,
          c = n.length;
        for (i || (i = o), u || (u = []); ++s < c; ) {
          var f = n[s];
          e > 0 && i(f)
            ? e > 1
              ? t(f, e - 1, i, a, u)
              : r(u, f)
            : a || (u[u.length] = f);
        }
        return u;
      };
    },
    function(t, n, e) {
      var r = e(30);
      t.exports = function() {
        if (!arguments.length) return [];
        var t = arguments[0];
        return r(t) ? t : [t];
      };
    },
    function(t, n, e) {
      var r = e(227);
      t.exports = function(t, n) {
        return !(null == t || !t.length) && r(t, n, 0) > -1;
      };
    },
    function(t, n) {
      t.exports = function(t, n, e) {
        for (var r = -1, o = null == t ? 0 : t.length; ++r < o; )
          if (e(n, t[r])) return !0;
        return !1;
      };
    },
    function(t, n, e) {
      var r = e(227);
      t.exports = function(t, n) {
        return !(null == t || !t.length) && r(t, n, 0) > -1;
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return function(n) {
          return t(n);
        };
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n, e) {
      var r;
      /*!
       * UAParser.js v0.7.18
       * Lightweight JavaScript-based User-Agent string parser
       * https://github.com/faisalman/ua-parser-js
       *
       * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
       * Dual licensed under GPLv2 or MIT
       */
      /*!
       * UAParser.js v0.7.18
       * Lightweight JavaScript-based User-Agent string parser
       * https://github.com/faisalman/ua-parser-js
       *
       * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
       * Dual licensed under GPLv2 or MIT
       */
      !(function(o, i) {
        'use strict';
        var a = 'model',
          u = 'name',
          s = 'type',
          c = 'vendor',
          f = 'version',
          l = 'mobile',
          p = 'tablet',
          h = {
            extend: function(t, n) {
              var e = {};
              for (var r in t)
                n[r] && n[r].length % 2 == 0
                  ? (e[r] = n[r].concat(t[r]))
                  : (e[r] = t[r]);
              return e;
            },
            has: function(t, n) {
              return (
                'string' == typeof t &&
                -1 !== n.toLowerCase().indexOf(t.toLowerCase())
              );
            },
            lowerize: function(t) {
              return t.toLowerCase();
            },
            major: function(t) {
              return 'string' == typeof t
                ? t.replace(/[^\d\.]/g, '').split('.')[0]
                : void 0;
            },
            trim: function(t) {
              return t.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
            }
          },
          d = {
            rgx: function(t, n) {
              for (var e, r, o, i, a, u, s = 0; s < n.length && !a; ) {
                var c = n[s],
                  f = n[s + 1];
                for (e = r = 0; e < c.length && !a; )
                  if ((a = c[e++].exec(t)))
                    for (o = 0; o < f.length; o++)
                      (u = a[++r]),
                        'object' == typeof (i = f[o]) && i.length > 0
                          ? 2 == i.length
                            ? 'function' == typeof i[1]
                              ? (this[i[0]] = i[1].call(this, u))
                              : (this[i[0]] = i[1])
                            : 3 == i.length
                            ? 'function' != typeof i[1] ||
                              (i[1].exec && i[1].test)
                              ? (this[i[0]] = u
                                  ? u.replace(i[1], i[2])
                                  : void 0)
                              : (this[i[0]] = u
                                  ? i[1].call(this, u, i[2])
                                  : void 0)
                            : 4 == i.length &&
                              (this[i[0]] = u
                                ? i[3].call(this, u.replace(i[1], i[2]))
                                : void 0)
                          : (this[i] = u || void 0);
                s += 2;
              }
            },
            str: function(t, n) {
              for (var e in n)
                if ('object' == typeof n[e] && n[e].length > 0) {
                  for (var r = 0; r < n[e].length; r++)
                    if (h.has(n[e][r], t)) return '?' === e ? void 0 : e;
                } else if (h.has(n[e], t)) return '?' === e ? void 0 : e;
              return t;
            }
          },
          v = {
            browser: {
              oldsafari: {
                version: {
                  '1.0': '/8',
                  1.2: '/1',
                  1.3: '/3',
                  '2.0': '/412',
                  '2.0.2': '/416',
                  '2.0.3': '/417',
                  '2.0.4': '/419',
                  '?': '/'
                }
              }
            },
            device: {
              amazon: { model: { 'Fire Phone': ['SD', 'KF'] } },
              sprint: {
                model: { 'Evo Shift 4G': '7373KT' },
                vendor: { HTC: 'APA', Sprint: 'Sprint' }
              }
            },
            os: {
              windows: {
                version: {
                  ME: '4.90',
                  'NT 3.11': 'NT3.51',
                  'NT 4.0': 'NT4.0',
                  2000: 'NT 5.0',
                  XP: ['NT 5.1', 'NT 5.2'],
                  Vista: 'NT 6.0',
                  7: 'NT 6.1',
                  8: 'NT 6.2',
                  8.1: 'NT 6.3',
                  10: ['NT 6.4', 'NT 10.0'],
                  RT: 'ARM'
                }
              }
            }
          },
          y = {
            browser: [
              [
                /(opera\smini)\/([\w\.-]+)/i,
                /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,
                /(opera).+version\/([\w\.]+)/i,
                /(opera)[\/\s]+([\w\.]+)/i
              ],
              [u, f],
              [/(opios)[\/\s]+([\w\.]+)/i],
              [[u, 'Opera Mini'], f],
              [/\s(opr)\/([\w\.]+)/i],
              [[u, 'Opera'], f],
              [
                /(kindle)\/([\w\.]+)/i,
                /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]*)/i,
                /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                /(?:ms|\()(ie)\s([\w\.]+)/i,
                /(rekonq)\/([\w\.]*)/i,
                /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark)\/([\w\.-]+)/i
              ],
              [u, f],
              [/(trident).+rv[:\s]([\w\.]+).+like\sgecko/i],
              [[u, 'IE'], f],
              [/(edge|edgios|edgea)\/((\d+)?[\w\.]+)/i],
              [[u, 'Edge'], f],
              [/(yabrowser)\/([\w\.]+)/i],
              [[u, 'Yandex'], f],
              [/(puffin)\/([\w\.]+)/i],
              [[u, 'Puffin'], f],
              [/((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i],
              [[u, 'UCBrowser'], f],
              [/(comodo_dragon)\/([\w\.]+)/i],
              [[u, /_/g, ' '], f],
              [/(micromessenger)\/([\w\.]+)/i],
              [[u, 'WeChat'], f],
              [/(qqbrowserlite)\/([\w\.]+)/i],
              [u, f],
              [/(QQ)\/([\d\.]+)/i],
              [u, f],
              [/m?(qqbrowser)[\/\s]?([\w\.]+)/i],
              [u, f],
              [/(BIDUBrowser)[\/\s]?([\w\.]+)/i],
              [u, f],
              [/(2345Explorer)[\/\s]?([\w\.]+)/i],
              [u, f],
              [/(MetaSr)[\/\s]?([\w\.]+)/i],
              [u],
              [/(LBBROWSER)/i],
              [u],
              [/xiaomi\/miuibrowser\/([\w\.]+)/i],
              [f, [u, 'MIUI Browser']],
              [/;fbav\/([\w\.]+);/i],
              [f, [u, 'Facebook']],
              [/headlesschrome(?:\/([\w\.]+)|\s)/i],
              [f, [u, 'Chrome Headless']],
              [/\swv\).+(chrome)\/([\w\.]+)/i],
              [[u, /(.+)/, '$1 WebView'], f],
              [/((?:oculus|samsung)browser)\/([\w\.]+)/i],
              [[u, /(.+(?:g|us))(.+)/, '$1 $2'], f],
              [/android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i],
              [f, [u, 'Android Browser']],
              [/(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i],
              [u, f],
              [/(dolfin)\/([\w\.]+)/i],
              [[u, 'Dolphin'], f],
              [/((?:android.+)crmo|crios)\/([\w\.]+)/i],
              [[u, 'Chrome'], f],
              [/(coast)\/([\w\.]+)/i],
              [[u, 'Opera Coast'], f],
              [/fxios\/([\w\.-]+)/i],
              [f, [u, 'Firefox']],
              [/version\/([\w\.]+).+?mobile\/\w+\s(safari)/i],
              [f, [u, 'Mobile Safari']],
              [/version\/([\w\.]+).+?(mobile\s?safari|safari)/i],
              [f, u],
              [
                /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i
              ],
              [[u, 'GSA'], f],
              [/webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i],
              [u, [f, d.str, v.browser.oldsafari.version]],
              [/(konqueror)\/([\w\.]+)/i, /(webkit|khtml)\/([\w\.]+)/i],
              [u, f],
              [/(navigator|netscape)\/([\w\.-]+)/i],
              [[u, 'Netscape'], f],
              [
                /(swiftfox)/i,
                /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([\w\.-]+)$/i,
                /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,
                /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                /(links)\s\(([\w\.]+)/i,
                /(gobrowser)\/?([\w\.]*)/i,
                /(ice\s?browser)\/v?([\w\._]+)/i,
                /(mosaic)[\/\s]([\w\.]+)/i
              ],
              [u, f]
            ],
            cpu: [
              [/(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i],
              [['architecture', 'amd64']],
              [/(ia32(?=;))/i],
              [['architecture', h.lowerize]],
              [/((?:i[346]|x)86)[;\)]/i],
              [['architecture', 'ia32']],
              [/windows\s(ce|mobile);\sppc;/i],
              [['architecture', 'arm']],
              [/((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i],
              [['architecture', /ower/, '', h.lowerize]],
              [/(sun4\w)[;\)]/i],
              [['architecture', 'sparc']],
              [
                /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
              ],
              [['architecture', h.lowerize]]
            ],
            device: [
              [/\((ipad|playbook);[\w\s\);-]+(rim|apple)/i],
              [a, c, [s, p]],
              [/applecoremedia\/[\w\.]+ \((ipad)/],
              [a, [c, 'Apple'], [s, p]],
              [/(apple\s{0,1}tv)/i],
              [[a, 'Apple TV'], [c, 'Apple']],
              [
                /(archos)\s(gamepad2?)/i,
                /(hp).+(touchpad)/i,
                /(hp).+(tablet)/i,
                /(kindle)\/([\w\.]+)/i,
                /\s(nook)[\w\s]+build\/(\w+)/i,
                /(dell)\s(strea[kpr\s\d]*[\dko])/i
              ],
              [c, a, [s, p]],
              [/(kf[A-z]+)\sbuild\/.+silk\//i],
              [a, [c, 'Amazon'], [s, p]],
              [/(sd|kf)[0349hijorstuw]+\sbuild\/.+silk\//i],
              [[a, d.str, v.device.amazon.model], [c, 'Amazon'], [s, l]],
              [/\((ip[honed|\s\w*]+);.+(apple)/i],
              [a, c, [s, l]],
              [/\((ip[honed|\s\w*]+);/i],
              [a, [c, 'Apple'], [s, l]],
              [
                /(blackberry)[\s-]?(\w+)/i,
                /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]*)/i,
                /(hp)\s([\w\s]+\w)/i,
                /(asus)-?(\w+)/i
              ],
              [c, a, [s, l]],
              [/\(bb10;\s(\w+)/i],
              [a, [c, 'BlackBerry'], [s, l]],
              [
                /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
              ],
              [a, [c, 'Asus'], [s, p]],
              [
                /(sony)\s(tablet\s[ps])\sbuild\//i,
                /(sony)?(?:sgp.+)\sbuild\//i
              ],
              [[c, 'Sony'], [a, 'Xperia Tablet'], [s, p]],
              [/android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i],
              [a, [c, 'Sony'], [s, l]],
              [/\s(ouya)\s/i, /(nintendo)\s([wids3u]+)/i],
              [c, a, [s, 'console']],
              [/android.+;\s(shield)\sbuild/i],
              [a, [c, 'Nvidia'], [s, 'console']],
              [/(playstation\s[34portablevi]+)/i],
              [a, [c, 'Sony'], [s, 'console']],
              [/(sprint\s(\w+))/i],
              [
                [c, d.str, v.device.sprint.vendor],
                [a, d.str, v.device.sprint.model],
                [s, l]
              ],
              [/(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i],
              [c, a, [s, p]],
              [
                /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,
                /(zte)-(\w*)/i,
                /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]*)/i
              ],
              [c, [a, /_/g, ' '], [s, l]],
              [/(nexus\s9)/i],
              [a, [c, 'HTC'], [s, p]],
              [/d\/huawei([\w\s-]+)[;\)]/i, /(nexus\s6p)/i],
              [a, [c, 'Huawei'], [s, l]],
              [/(microsoft);\s(lumia[\s\w]+)/i],
              [c, a, [s, l]],
              [/[\s\(;](xbox(?:\sone)?)[\s\);]/i],
              [a, [c, 'Microsoft'], [s, 'console']],
              [/(kin\.[onetw]{3})/i],
              [[a, /\./g, ' '], [c, 'Microsoft'], [s, l]],
              [
                /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?:?(\s4g)?)[\w\s]+build\//i,
                /mot[\s-]?(\w*)/i,
                /(XT\d{3,4}) build\//i,
                /(nexus\s6)/i
              ],
              [a, [c, 'Motorola'], [s, l]],
              [/android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i],
              [a, [c, 'Motorola'], [s, p]],
              [/hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i],
              [[c, h.trim], [a, h.trim], [s, 'smarttv']],
              [/hbbtv.+maple;(\d+)/i],
              [[a, /^/, 'SmartTV'], [c, 'Samsung'], [s, 'smarttv']],
              [/\(dtv[\);].+(aquos)/i],
              [a, [c, 'Sharp'], [s, 'smarttv']],
              [
                /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
                /((SM-T\w+))/i
              ],
              [[c, 'Samsung'], a, [s, p]],
              [/smart-tv.+(samsung)/i],
              [c, [s, 'smarttv'], a],
              [
                /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
                /(sam[sung]*)[\s-]*(\w+-?[\w-]*)/i,
                /sec-((sgh\w+))/i
              ],
              [[c, 'Samsung'], a, [s, l]],
              [/sie-(\w*)/i],
              [a, [c, 'Siemens'], [s, l]],
              [/(maemo|nokia).*(n900|lumia\s\d+)/i, /(nokia)[\s_-]?([\w-]*)/i],
              [[c, 'Nokia'], a, [s, l]],
              [/android\s3\.[\s\w;-]{10}(a\d{3})/i],
              [a, [c, 'Acer'], [s, p]],
              [/android.+([vl]k\-?\d{3})\s+build/i],
              [a, [c, 'LG'], [s, p]],
              [/android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i],
              [[c, 'LG'], a, [s, p]],
              [/(lg) netcast\.tv/i],
              [c, a, [s, 'smarttv']],
              [
                /(nexus\s[45])/i,
                /lg[e;\s\/-]+(\w*)/i,
                /android.+lg(\-?[\d\w]+)\s+build/i
              ],
              [a, [c, 'LG'], [s, l]],
              [/android.+(ideatab[a-z0-9\-\s]+)/i],
              [a, [c, 'Lenovo'], [s, p]],
              [/linux;.+((jolla));/i],
              [c, a, [s, l]],
              [/((pebble))app\/[\d\.]+\s/i],
              [c, a, [s, 'wearable']],
              [/android.+;\s(oppo)\s?([\w\s]+)\sbuild/i],
              [c, a, [s, l]],
              [/crkey/i],
              [[a, 'Chromecast'], [c, 'Google']],
              [/android.+;\s(glass)\s\d/i],
              [a, [c, 'Google'], [s, 'wearable']],
              [/android.+;\s(pixel c)\s/i],
              [a, [c, 'Google'], [s, p]],
              [/android.+;\s(pixel xl|pixel)\s/i],
              [a, [c, 'Google'], [s, l]],
              [
                /android.+;\s(\w+)\s+build\/hm\1/i,
                /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,
                /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d?\w?)[\s_]*(?:plus)?)\s+build/i,
                /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+))\s+build/i
              ],
              [[a, /_/g, ' '], [c, 'Xiaomi'], [s, l]],
              [/android.+(mi[\s\-_]*(?:pad)(?:[\s_]*[\w\s]+))\s+build/i],
              [[a, /_/g, ' '], [c, 'Xiaomi'], [s, p]],
              [/android.+;\s(m[1-5]\snote)\sbuild/i],
              [a, [c, 'Meizu'], [s, p]],
              [
                /android.+a000(1)\s+build/i,
                /android.+oneplus\s(a\d{4})\s+build/i
              ],
              [a, [c, 'OnePlus'], [s, l]],
              [/android.+[;\/]\s*(RCT[\d\w]+)\s+build/i],
              [a, [c, 'RCA'], [s, p]],
              [/android.+[;\/\s]+(Venue[\d\s]{2,7})\s+build/i],
              [a, [c, 'Dell'], [s, p]],
              [/android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i],
              [a, [c, 'Verizon'], [s, p]],
              [/android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i],
              [[c, 'Barnes & Noble'], a, [s, p]],
              [/android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i],
              [a, [c, 'NuVision'], [s, p]],
              [/android.+;\s(k88)\sbuild/i],
              [a, [c, 'ZTE'], [s, p]],
              [/android.+[;\/]\s*(gen\d{3})\s+build.*49h/i],
              [a, [c, 'Swiss'], [s, l]],
              [/android.+[;\/]\s*(zur\d{3})\s+build/i],
              [a, [c, 'Swiss'], [s, p]],
              [/android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i],
              [a, [c, 'Zeki'], [s, p]],
              [
                /(android).+[;\/]\s+([YR]\d{2})\s+build/i,
                /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(\w{5})\sbuild/i
              ],
              [[c, 'Dragon Touch'], a, [s, p]],
              [/android.+[;\/]\s*(NS-?\w{0,9})\sbuild/i],
              [a, [c, 'Insignia'], [s, p]],
              [/android.+[;\/]\s*((NX|Next)-?\w{0,9})\s+build/i],
              [a, [c, 'NextBook'], [s, p]],
              [
                /android.+[;\/]\s*(Xtreme\_)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
              ],
              [[c, 'Voice'], a, [s, l]],
              [/android.+[;\/]\s*(LVTEL\-)?(V1[12])\s+build/i],
              [[c, 'LvTel'], a, [s, l]],
              [/android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i],
              [a, [c, 'Envizen'], [s, p]],
              [/android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(\w{1,9})\s+build/i],
              [c, a, [s, p]],
              [/android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i],
              [a, [c, 'MachSpeed'], [s, p]],
              [/android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i],
              [c, a, [s, p]],
              [/android.+[;\/]\s*TU_(1491)\s+build/i],
              [a, [c, 'Rotor'], [s, p]],
              [/android.+(KS(.+))\s+build/i],
              [a, [c, 'Amazon'], [s, p]],
              [/android.+(Gigaset)[\s\-]+(Q\w{1,9})\s+build/i],
              [c, a, [s, p]],
              [/\s(tablet|tab)[;\/]/i, /\s(mobile)(?:[;\/]|\ssafari)/i],
              [[s, h.lowerize], c, a],
              [/(android[\w\.\s\-]{0,9});.+build/i],
              [a, [c, 'Generic']]
            ],
            engine: [
              [/windows.+\sedge\/([\w\.]+)/i],
              [f, [u, 'EdgeHTML']],
              [
                /(presto)\/([\w\.]+)/i,
                /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,
                /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,
                /(icab)[\/\s]([23]\.[\d\.]+)/i
              ],
              [u, f],
              [/rv\:([\w\.]{1,9}).+(gecko)/i],
              [f, u]
            ],
            os: [
              [/microsoft\s(windows)\s(vista|xp)/i],
              [u, f],
              [
                /(windows)\snt\s6\.2;\s(arm)/i,
                /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s\w]*)/i,
                /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
              ],
              [u, [f, d.str, v.os.windows.version]],
              [/(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i],
              [[u, 'Windows'], [f, d.str, v.os.windows.version]],
              [/\((bb)(10);/i],
              [[u, 'BlackBerry'], f],
              [
                /(blackberry)\w*\/?([\w\.]*)/i,
                /(tizen)[\/\s]([\w\.]+)/i,
                /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]*)/i,
                /linux;.+(sailfish);/i
              ],
              [u, f],
              [/(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]*)/i],
              [[u, 'Symbian'], f],
              [/\((series40);/i],
              [u],
              [/mozilla.+\(mobile;.+gecko.+firefox/i],
              [[u, 'Firefox OS'], f],
              [
                /(nintendo|playstation)\s([wids34portablevu]+)/i,
                /(mint)[\/\s\(]?(\w*)/i,
                /(mageia|vectorlinux)[;\s]/i,
                /(joli|[kxln]?ubuntu|debian|suse|opensuse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]*)/i,
                /(hurd|linux)\s?([\w\.]*)/i,
                /(gnu)\s?([\w\.]*)/i
              ],
              [u, f],
              [/(cros)\s[\w]+\s([\w\.]+\w)/i],
              [[u, 'Chromium OS'], f],
              [/(sunos)\s?([\w\.\d]*)/i],
              [[u, 'Solaris'], f],
              [/\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]*)/i],
              [u, f],
              [/(haiku)\s(\w+)/i],
              [u, f],
              [
                /cfnetwork\/.+darwin/i,
                /ip[honead]{2,4}(?:.*os\s([\w]+)\slike\smac|;\sopera)/i
              ],
              [[f, /_/g, '.'], [u, 'iOS']],
              [/(mac\sos\sx)\s?([\w\s\.]*)/i, /(macintosh|mac(?=_powerpc)\s)/i],
              [[u, 'Mac OS'], [f, /_/g, '.']],
              [
                /((?:open)?solaris)[\/\s-]?([\w\.]*)/i,
                /(aix)\s((\d)(?=\.|\)|\s)[\w\.])*/i,
                /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                /(unix)\s?([\w\.]*)/i
              ],
              [u, f]
            ]
          },
          g = function(t, n) {
            if (
              ('object' == typeof t && ((n = t), (t = void 0)),
              !(this instanceof g))
            )
              return new g(t, n).getResult();
            var e =
                t ||
                (o && o.navigator && o.navigator.userAgent
                  ? o.navigator.userAgent
                  : ''),
              r = n ? h.extend(y, n) : y;
            return (
              (this.getBrowser = function() {
                var t = { name: void 0, version: void 0 };
                return (
                  d.rgx.call(t, e, r.browser), (t.major = h.major(t.version)), t
                );
              }),
              (this.getCPU = function() {
                var t = { architecture: void 0 };
                return d.rgx.call(t, e, r.cpu), t;
              }),
              (this.getDevice = function() {
                var t = { vendor: void 0, model: void 0, type: void 0 };
                return d.rgx.call(t, e, r.device), t;
              }),
              (this.getEngine = function() {
                var t = { name: void 0, version: void 0 };
                return d.rgx.call(t, e, r.engine), t;
              }),
              (this.getOS = function() {
                var t = { name: void 0, version: void 0 };
                return d.rgx.call(t, e, r.os), t;
              }),
              (this.getResult = function() {
                return {
                  ua: this.getUA(),
                  browser: this.getBrowser(),
                  engine: this.getEngine(),
                  os: this.getOS(),
                  device: this.getDevice(),
                  cpu: this.getCPU()
                };
              }),
              (this.getUA = function() {
                return e;
              }),
              (this.setUA = function(t) {
                return (e = t), this;
              }),
              this
            );
          };
        (g.VERSION = '0.7.18'),
          (g.BROWSER = { NAME: u, MAJOR: 'major', VERSION: f }),
          (g.CPU = { ARCHITECTURE: 'architecture' }),
          (g.DEVICE = {
            MODEL: a,
            VENDOR: c,
            TYPE: s,
            CONSOLE: 'console',
            MOBILE: l,
            SMARTTV: 'smarttv',
            TABLET: p,
            WEARABLE: 'wearable',
            EMBEDDED: 'embedded'
          }),
          (g.ENGINE = { NAME: u, VERSION: f }),
          (g.OS = { NAME: u, VERSION: f }),
          void 0 !== n
            ? (void 0 !== t && t.exports && (n = t.exports = g),
              (n.UAParser = g))
            : e(51)
            ? void 0 ===
                (r = function() {
                  return g;
                }.call(n, e, n, t)) || (t.exports = r)
            : o && (o.UAParser = g);
        var m = o && (o.jQuery || o.Zepto);
        if (void 0 !== m) {
          var b = new g();
          (m.ua = b.getResult()),
            (m.ua.get = function() {
              return b.getUA();
            }),
            (m.ua.set = function(t) {
              b.setUA(t);
              var n = b.getResult();
              for (var e in n) m.ua[e] = n[e];
            });
        }
      })('object' == typeof window ? window : this);
    },
    function(t, n, e) {
      var r = e(500),
        o = e(165);
      t.exports = function(t) {
        return r(t, o);
      };
    },
    function(t, n, e) {
      t.exports =
        !e(8) &&
        !e(3)(function() {
          return (
            7 !=
            Object.defineProperty(e(119)('div'), 'a', {
              get: function() {
                return 7;
              }
            }).a
          );
        });
    },
    function(t, n, e) {
      n.f = e(5);
    },
    function(t, n, e) {
      var r = e(25),
        o = e(26),
        i = e(90)(!1),
        a = e(121)('IE_PROTO');
      t.exports = function(t, n) {
        var e,
          u = o(t),
          s = 0,
          c = [];
        for (e in u) e != a && r(u, e) && c.push(e);
        for (; n.length > s; ) r(u, (e = n[s++])) && (~i(c, e) || c.push(e));
        return c;
      };
    },
    function(t, n, e) {
      var r = e(9),
        o = e(1),
        i = e(54);
      t.exports = e(8)
        ? Object.defineProperties
        : function(t, n) {
            o(t);
            for (var e, a = i(n), u = a.length, s = 0; u > s; )
              r.f(t, (e = a[s++]), n[e]);
            return t;
          };
    },
    function(t, n, e) {
      var r = e(26),
        o = e(57).f,
        i = {}.toString,
        a =
          'object' == typeof window && window && Object.getOwnPropertyNames
            ? Object.getOwnPropertyNames(window)
            : [];
      t.exports.f = function(t) {
        return a && '[object Window]' == i.call(t)
          ? (function(t) {
              try {
                return o(t);
              } catch (t) {
                return a.slice();
              }
            })(t)
          : o(r(t));
      };
    },
    function(t, n, e) {
      var r = e(4),
        o = e(48).onFreeze;
      e(41)('freeze', function(t) {
        return function(n) {
          return t && r(n) ? t(o(n)) : n;
        };
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(54),
        o = e(91),
        i = e(80),
        a = e(12),
        u = e(79),
        s = Object.assign;
      t.exports =
        !s ||
        e(3)(function() {
          var t = {},
            n = {},
            e = Symbol(),
            r = 'abcdefghijklmnopqrst';
          return (
            (t[e] = 7),
            r.split('').forEach(function(t) {
              n[t] = t;
            }),
            7 != s({}, t)[e] || Object.keys(s({}, n)).join('') != r
          );
        })
          ? function(t, n) {
              for (
                var e = a(t), s = arguments.length, c = 1, f = o.f, l = i.f;
                s > c;

              )
                for (
                  var p,
                    h = u(arguments[c++]),
                    d = f ? r(h).concat(f(h)) : r(h),
                    v = d.length,
                    y = 0;
                  v > y;

                )
                  l.call(h, (p = d[y++])) && (e[p] = h[p]);
              return e;
            }
          : s;
    },
    function(t, n, e) {
      'use strict';
      var r = e(18),
        o = e(4),
        i = e(176),
        a = [].slice,
        u = {};
      t.exports =
        Function.bind ||
        function(t) {
          var n = r(this),
            e = a.call(arguments, 1),
            s = function() {
              var r = e.concat(a.call(arguments));
              return this instanceof s
                ? (function(t, n, e) {
                    if (!(n in u)) {
                      for (var r = [], o = 0; o < n; o++) r[o] = 'a[' + o + ']';
                      u[n] = Function(
                        'F,a',
                        'return new F(' + r.join(',') + ')'
                      );
                    }
                    return u[n](t, e);
                  })(n, r.length, r)
                : i(n, r, t);
            };
          return o(n.prototype) && (s.prototype = n.prototype), s;
        };
    },
    function(t, n) {
      t.exports = function(t, n, e) {
        var r = void 0 === e;
        switch (n.length) {
          case 0:
            return r ? t() : t.call(e);
          case 1:
            return r ? t(n[0]) : t.call(e, n[0]);
          case 2:
            return r ? t(n[0], n[1]) : t.call(e, n[0], n[1]);
          case 3:
            return r ? t(n[0], n[1], n[2]) : t.call(e, n[0], n[1], n[2]);
          case 4:
            return r
              ? t(n[0], n[1], n[2], n[3])
              : t.call(e, n[0], n[1], n[2], n[3]);
        }
        return t.apply(e, n);
      };
    },
    function(t, n, e) {
      var r = e(2).parseInt,
        o = e(73).trim,
        i = e(125),
        a = /^[-+]?0[xX]/;
      t.exports =
        8 !== r(i + '08') || 22 !== r(i + '0x16')
          ? function(t, n) {
              var e = o(String(t), 3);
              return r(e, n >>> 0 || (a.test(e) ? 16 : 10));
            }
          : r;
    },
    function(t, n, e) {
      var r = e(2).parseFloat,
        o = e(73).trim;
      t.exports =
        1 / r(e(125) + '-0') != -1 / 0
          ? function(t) {
              var n = o(String(t), 3),
                e = r(n);
              return 0 === e && '-' == n.charAt(0) ? -0 : e;
            }
          : r;
    },
    function(t, n, e) {
      'use strict';
      var r = e(2),
        o = e(25),
        i = e(33),
        a = e(126),
        u = e(38),
        s = e(3),
        c = e(57).f,
        f = e(27).f,
        l = e(9).f,
        p = e(73).trim,
        h = r.Number,
        d = h,
        v = h.prototype,
        y = 'Number' == i(e(56)(v)),
        g = 'trim' in String.prototype,
        m = function(t) {
          var n = u(t, !1);
          if ('string' == typeof n && n.length > 2) {
            var e,
              r,
              o,
              i = (n = g ? n.trim() : p(n, 3)).charCodeAt(0);
            if (43 === i || 45 === i) {
              if (88 === (e = n.charCodeAt(2)) || 120 === e) return NaN;
            } else if (48 === i) {
              switch (n.charCodeAt(1)) {
                case 66:
                case 98:
                  (r = 2), (o = 49);
                  break;
                case 79:
                case 111:
                  (r = 8), (o = 55);
                  break;
                default:
                  return +n;
              }
              for (var a, s = n.slice(2), c = 0, f = s.length; c < f; c++)
                if ((a = s.charCodeAt(c)) < 48 || a > o) return NaN;
              return parseInt(s, r);
            }
          }
          return +n;
        };
      if (!h(' 0o1') || !h('0b1') || h('+0x1')) {
        h = function(t) {
          var n = arguments.length < 1 ? 0 : t,
            e = this;
          return e instanceof h &&
            (y
              ? s(function() {
                  v.valueOf.call(e);
                })
              : 'Number' != i(e))
            ? a(new d(m(n)), e, h)
            : m(n);
        };
        for (
          var b,
            w = e(8)
              ? c(d)
              : 'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'.split(
                  ','
                ),
            x = 0;
          w.length > x;
          x++
        )
          o(d, (b = w[x])) && !o(h, b) && l(h, b, f(d, b));
        (h.prototype = v), (v.constructor = h), e(22)(r, 'Number', h);
      }
    },
    function(t, n, e) {
      var r = e(33);
      t.exports = function(t, n) {
        if ('number' != typeof t && 'Number' != r(t)) throw TypeError(n);
        return +t;
      };
    },
    function(t, n, e) {
      var r = e(4),
        o = Math.floor;
      t.exports = function(t) {
        return !r(t) && isFinite(t) && o(t) === t;
      };
    },
    function(t, n) {
      t.exports =
        Math.log1p ||
        function(t) {
          return (t = +t) > -1e-8 && t < 1e-8
            ? t - (t * t) / 2
            : Math.log(1 + t);
        };
    },
    function(t, n, e) {
      var r = e(128),
        o = Math.pow,
        i = o(2, -52),
        a = o(2, -23),
        u = o(2, 127) * (2 - a),
        s = o(2, -126);
      t.exports =
        Math.fround ||
        function(t) {
          var n,
            e,
            o = Math.abs(t),
            c = r(t);
          return o < s
            ? c *
                (function(t) {
                  return t + 1 / i - 1 / i;
                })(o / s / a) *
                s *
                a
            : (e = (n = (1 + a / i) * o) - (n - o)) > u || e != e
            ? c * (1 / 0)
            : c * e;
        };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.P, 'String', { repeat: e(127) });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(10),
        i = e(134),
        a = ''.startsWith;
      r(r.P + r.F * e(135)('startsWith'), 'String', {
        startsWith: function(t) {
          var n = i(this, t, 'startsWith'),
            e = o(
              Math.min(arguments.length > 1 ? arguments[1] : void 0, n.length)
            ),
            r = String(t);
          return a ? a.call(n, r, e) : n.slice(e, e + r.length) === r;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(317);
      r(r.P + r.F * (Date.prototype.toISOString !== o), 'Date', {
        toISOString: o
      });
    },
    function(t, n, e) {
      var r = e(1);
      t.exports = function(t, n, e, o) {
        try {
          return o ? n(r(e)[0], e[1]) : n(e);
        } catch (n) {
          var i = t.return;
          throw (void 0 !== i && r(i.call(t)), n);
        }
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(18),
        i = e(12),
        a = e(3),
        u = [].sort,
        s = [1, 2, 3];
      r(
        r.P +
          r.F *
            (a(function() {
              s.sort(void 0);
            }) ||
              !a(function() {
                s.sort(null);
              }) ||
              !e(35)(u)),
        'Array',
        {
          sort: function(t) {
            return void 0 === t ? u.call(i(this)) : u.call(i(this), o(t));
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(18),
        o = e(12),
        i = e(79),
        a = e(10);
      t.exports = function(t, n, e, u, s) {
        r(n);
        var c = o(t),
          f = i(c),
          l = a(c.length),
          p = s ? l - 1 : 0,
          h = s ? -1 : 1;
        if (e < 2)
          for (;;) {
            if (p in f) {
              (u = f[p]), (p += h);
              break;
            }
            if (((p += h), s ? p < 0 : l <= p))
              throw TypeError('Reduce of empty array with no initial value');
          }
        for (; s ? p >= 0 : l > p; p += h) p in f && (u = n(u, f[p], p, c));
        return u;
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(12),
        o = e(55),
        i = e(10);
      t.exports =
        [].copyWithin ||
        function(t, n) {
          var e = r(this),
            a = i(e.length),
            u = o(t, a),
            s = o(n, a),
            c = arguments.length > 2 ? arguments[2] : void 0,
            f = Math.min((void 0 === c ? a : o(c, a)) - s, a - u),
            l = 1;
          for (
            s < u && u < s + f && ((l = -1), (s += f - 1), (u += f - 1));
            f-- > 0;

          )
            s in e ? (e[u] = e[s]) : delete e[u], (u += l), (s += l);
          return e;
        };
    },
    function(t, n) {
      t.exports = function(t, n) {
        return { value: n, done: !!t };
      };
    },
    function(t, n, e) {
      var r = e(2),
        o = e(126),
        i = e(9).f,
        a = e(57).f,
        u = e(94),
        s = e(96),
        c = r.RegExp,
        f = c,
        l = c.prototype,
        p = /a/g,
        h = /a/g,
        d = new c(p) !== p;
      if (
        e(8) &&
        (!d ||
          e(3)(function() {
            return (
              (h[e(5)('match')] = !1),
              c(p) != p || c(h) == h || '/a/i' != c(p, 'i')
            );
          }))
      ) {
        c = function(t, n) {
          var e = this instanceof c,
            r = u(t),
            i = void 0 === n;
          return !e && r && t.constructor === c && i
            ? t
            : o(
                d
                  ? new f(r && !i ? t.source : t, n)
                  : f(
                      (r = t instanceof c) ? t.source : t,
                      r && i ? s.call(t) : n
                    ),
                e ? this : l,
                c
              );
        };
        for (
          var v = function(t) {
              (t in c) ||
                i(c, t, {
                  configurable: !0,
                  get: function() {
                    return f[t];
                  },
                  set: function(n) {
                    f[t] = n;
                  }
                });
            },
            y = a(f),
            g = 0;
          y.length > g;

        )
          v(y[g++]);
        (l.constructor = c), (c.prototype = l), e(22)(r, 'RegExp', c);
      }
      e(61)('RegExp');
    },
    function(t, n, e) {
      e(8) &&
        'g' != /./g.flags &&
        e(9).f(RegExp.prototype, 'flags', { configurable: !0, get: e(96) });
    },
    function(t, n, e) {
      e(97)('search', 1, function(t, n, e) {
        return [
          function(e) {
            'use strict';
            var r = t(this),
              o = void 0 == e ? void 0 : e[n];
            return void 0 !== o ? o.call(e, r) : new RegExp(e)[n](String(r));
          },
          e
        ];
      });
    },
    function(t, n) {
      t.exports = function(t) {
        try {
          return { e: !1, v: t() };
        } catch (t) {
          return { e: !0, v: t };
        }
      };
    },
    function(t, n, e) {
      var r = e(1),
        o = e(4),
        i = e(144);
      t.exports = function(t, n) {
        if ((r(t), o(n) && n.constructor === t)) return n;
        var e = i.f(t);
        return (0, e.resolve)(n), e.promise;
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(198),
        o = e(75);
      t.exports = e(100)(
        'Map',
        function(t) {
          return function() {
            return t(this, arguments.length > 0 ? arguments[0] : void 0);
          };
        },
        {
          get: function(t) {
            var n = r.getEntry(o(this, 'Map'), t);
            return n && n.v;
          },
          set: function(t, n) {
            return r.def(o(this, 'Map'), 0 === t ? 0 : t, n);
          }
        },
        r,
        !0
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(9).f,
        o = e(56),
        i = e(66),
        a = e(32),
        u = e(64),
        s = e(65),
        c = e(132),
        f = e(191),
        l = e(61),
        p = e(8),
        h = e(48).fastKey,
        d = e(75),
        v = p ? '_s' : 'size',
        y = function(t, n) {
          var e,
            r = h(n);
          if ('F' !== r) return t._i[r];
          for (e = t._f; e; e = e.n) if (e.k == n) return e;
        };
      t.exports = {
        getConstructor: function(t, n, e, c) {
          var f = t(function(t, r) {
            u(t, f, n, '_i'),
              (t._t = n),
              (t._i = o(null)),
              (t._f = void 0),
              (t._l = void 0),
              (t[v] = 0),
              void 0 != r && s(r, e, t[c], t);
          });
          return (
            i(f.prototype, {
              clear: function() {
                for (var t = d(this, n), e = t._i, r = t._f; r; r = r.n)
                  (r.r = !0), r.p && (r.p = r.p.n = void 0), delete e[r.i];
                (t._f = t._l = void 0), (t[v] = 0);
              },
              delete: function(t) {
                var e = d(this, n),
                  r = y(e, t);
                if (r) {
                  var o = r.n,
                    i = r.p;
                  delete e._i[r.i],
                    (r.r = !0),
                    i && (i.n = o),
                    o && (o.p = i),
                    e._f == r && (e._f = o),
                    e._l == r && (e._l = i),
                    e[v]--;
                }
                return !!r;
              },
              forEach: function(t) {
                d(this, n);
                for (
                  var e,
                    r = a(t, arguments.length > 1 ? arguments[1] : void 0, 3);
                  (e = e ? e.n : this._f);

                )
                  for (r(e.v, e.k, this); e && e.r; ) e = e.p;
              },
              has: function(t) {
                return !!y(d(this, n), t);
              }
            }),
            p &&
              r(f.prototype, 'size', {
                get: function() {
                  return d(this, n)[v];
                }
              }),
            f
          );
        },
        def: function(t, n, e) {
          var r,
            o,
            i = y(t, n);
          return (
            i
              ? (i.v = e)
              : ((t._l = i = {
                  i: (o = h(n, !0)),
                  k: n,
                  v: e,
                  p: (r = t._l),
                  n: void 0,
                  r: !1
                }),
                t._f || (t._f = i),
                r && (r.n = i),
                t[v]++,
                'F' !== o && (t._i[o] = i)),
            t
          );
        },
        getEntry: y,
        setStrong: function(t, n, e) {
          c(
            t,
            n,
            function(t, e) {
              (this._t = d(t, n)), (this._k = e), (this._l = void 0);
            },
            function() {
              for (var t = this._k, n = this._l; n && n.r; ) n = n.p;
              return this._t && (this._l = n = n ? n.n : this._t._f)
                ? f(0, 'keys' == t ? n.k : 'values' == t ? n.v : [n.k, n.v])
                : ((this._t = void 0), f(1));
            },
            e ? 'entries' : 'values',
            !e,
            !0
          ),
            l(n);
        }
      };
    },
    function(t, n, e) {
      'use strict';
      var r,
        o = e(43)(0),
        i = e(22),
        a = e(48),
        u = e(174),
        s = e(200),
        c = e(4),
        f = e(3),
        l = e(75),
        p = a.getWeak,
        h = Object.isExtensible,
        d = s.ufstore,
        v = {},
        y = function(t) {
          return function() {
            return t(this, arguments.length > 0 ? arguments[0] : void 0);
          };
        },
        g = {
          get: function(t) {
            if (c(t)) {
              var n = p(t);
              return !0 === n
                ? d(l(this, 'WeakMap')).get(t)
                : n
                ? n[this._i]
                : void 0;
            }
          },
          set: function(t, n) {
            return s.def(l(this, 'WeakMap'), t, n);
          }
        },
        m = (t.exports = e(100)('WeakMap', y, g, s, !0, !0));
      f(function() {
        return 7 != new m().set((Object.freeze || Object)(v), 7).get(v);
      }) &&
        (u((r = s.getConstructor(y, 'WeakMap')).prototype, g),
        (a.NEED = !0),
        o(['delete', 'has', 'get', 'set'], function(t) {
          var n = m.prototype,
            e = n[t];
          i(n, t, function(n, o) {
            if (c(n) && !h(n)) {
              this._f || (this._f = new r());
              var i = this._f[t](n, o);
              return 'set' == t ? this : i;
            }
            return e.call(this, n, o);
          });
        }));
    },
    function(t, n, e) {
      'use strict';
      var r = e(66),
        o = e(48).getWeak,
        i = e(1),
        a = e(4),
        u = e(64),
        s = e(65),
        c = e(43),
        f = e(25),
        l = e(75),
        p = c(5),
        h = c(6),
        d = 0,
        v = function(t) {
          return t._l || (t._l = new y());
        },
        y = function() {
          this.a = [];
        },
        g = function(t, n) {
          return p(t.a, function(t) {
            return t[0] === n;
          });
        };
      (y.prototype = {
        get: function(t) {
          var n = g(this, t);
          if (n) return n[1];
        },
        has: function(t) {
          return !!g(this, t);
        },
        set: function(t, n) {
          var e = g(this, t);
          e ? (e[1] = n) : this.a.push([t, n]);
        },
        delete: function(t) {
          var n = h(this.a, function(n) {
            return n[0] === t;
          });
          return ~n && this.a.splice(n, 1), !!~n;
        }
      }),
        (t.exports = {
          getConstructor: function(t, n, e, i) {
            var c = t(function(t, r) {
              u(t, c, n, '_i'),
                (t._t = n),
                (t._i = d++),
                (t._l = void 0),
                void 0 != r && s(r, e, t[i], t);
            });
            return (
              r(c.prototype, {
                delete: function(t) {
                  if (!a(t)) return !1;
                  var e = o(t);
                  return !0 === e
                    ? v(l(this, n)).delete(t)
                    : e && f(e, this._i) && delete e[this._i];
                },
                has: function(t) {
                  if (!a(t)) return !1;
                  var e = o(t);
                  return !0 === e ? v(l(this, n)).has(t) : e && f(e, this._i);
                }
              }),
              c
            );
          },
          def: function(t, n, e) {
            var r = o(i(n), !0);
            return !0 === r ? v(t).set(n, e) : (r[t._i] = e), t;
          },
          ufstore: v
        });
    },
    function(t, n, e) {
      var r = e(40),
        o = e(10);
      t.exports = function(t) {
        if (void 0 === t) return 0;
        var n = r(t),
          e = o(n);
        if (n !== e) throw RangeError('Wrong length!');
        return e;
      };
    },
    function(t, n, e) {
      e(45)('Uint8', 1, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      var r = e(57),
        o = e(91),
        i = e(1),
        a = e(2).Reflect;
      t.exports =
        (a && a.ownKeys) ||
        function(t) {
          var n = r.f(i(t)),
            e = o.f;
          return e ? n.concat(e(t)) : n;
        };
    },
    function(t, n, e) {
      'use strict';
      var r = e(92),
        o = e(4),
        i = e(10),
        a = e(32),
        u = e(5)('isConcatSpreadable');
      t.exports = function t(n, e, s, c, f, l, p, h) {
        for (var d, v, y = f, g = 0, m = !!p && a(p, h, 3); g < c; ) {
          if (g in s) {
            if (
              ((d = m ? m(s[g], g, e) : s[g]),
              (v = !1),
              o(d) && (v = void 0 !== (v = d[u]) ? !!v : r(d)),
              v && l > 0)
            )
              y = t(n, e, d, i(d.length), y, l - 1) - 1;
            else {
              if (y >= 9007199254740991) throw TypeError();
              n[y] = d;
            }
            y++;
          }
          g++;
        }
        return y;
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(206),
        i = e(99);
      r(r.P + r.F * /Version\/10\.\d+(\.\d+)? Safari\//.test(i), 'String', {
        padStart: function(t) {
          return o(this, t, arguments.length > 1 ? arguments[1] : void 0, !0);
        }
      });
    },
    function(t, n, e) {
      var r = e(10),
        o = e(127),
        i = e(39);
      t.exports = function(t, n, e, a) {
        var u = String(i(t)),
          s = u.length,
          c = void 0 === e ? ' ' : String(e),
          f = r(n);
        if (f <= s || '' == c) return u;
        var l = f - s,
          p = o.call(c, Math.ceil(l / c.length));
        return p.length > l && (p = p.slice(0, l)), a ? p + u : u + p;
      };
    },
    function(t, n, e) {
      var r = e(54),
        o = e(26),
        i = e(80).f;
      t.exports = function(t) {
        return function(n) {
          for (var e, a = o(n), u = r(a), s = u.length, c = 0, f = []; s > c; )
            i.call(a, (e = u[c++])) && f.push(t ? [e, a[e]] : a[e]);
          return f;
        };
      };
    },
    function(t, n, e) {
      var r = e(81),
        o = e(209);
      t.exports = function(t) {
        return function() {
          if (r(this) != t) throw TypeError(t + "#toJSON isn't generic");
          return o(this);
        };
      };
    },
    function(t, n, e) {
      var r = e(65);
      t.exports = function(t, n) {
        var e = [];
        return r(t, !1, e.push, e, n), e;
      };
    },
    function(t, n) {
      t.exports =
        Math.scale ||
        function(t, n, e, r, o) {
          return 0 === arguments.length ||
            t != t ||
            n != n ||
            e != e ||
            r != r ||
            o != o
            ? NaN
            : t === 1 / 0 || t === -1 / 0
            ? t
            : ((t - n) * (o - r)) / (e - n) + r;
        };
    },
    function(t, n, e) {
      var r = e(413),
        o = e(414),
        i = e(415),
        a = e(416),
        u = e(417);
      function s(t) {
        var n = -1,
          e = null == t ? 0 : t.length;
        for (this.clear(); ++n < e; ) {
          var r = t[n];
          this.set(r[0], r[1]);
        }
      }
      (s.prototype.clear = r),
        (s.prototype.delete = o),
        (s.prototype.get = i),
        (s.prototype.has = a),
        (s.prototype.set = u),
        (t.exports = s);
    },
    function(t, n, e) {
      (function(t) {
        var r = e(110),
          o = n && !n.nodeType && n,
          i = o && 'object' == typeof t && t && !t.nodeType && t,
          a = i && i.exports === o ? r.Buffer : void 0,
          u = a ? a.allocUnsafe : void 0;
        t.exports = function(t, n) {
          if (n) return t.slice();
          var e = t.length,
            r = u ? u(e) : new t.constructor(e);
          return t.copy(r), r;
        };
      }.call(this, e(68)(t)));
    },
    function(t, n) {
      t.exports = function(t, n) {
        var e = -1,
          r = t.length;
        for (n || (n = Array(r)); ++e < r; ) n[e] = t[e];
        return n;
      };
    },
    function(t, n, e) {
      var r = e(432),
        o = e(215),
        i = e(433);
      t.exports = function(t) {
        return 'function' != typeof t.constructor || i(t) ? {} : r(o(t));
      };
    },
    function(t, n, e) {
      var r = e(154)(Object.getPrototypeOf, Object);
      t.exports = r;
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n, e) {
      var r = e(219),
        o = e(443),
        i = e(76);
      t.exports = function(t, n, e) {
        for (var a = -1, u = n.length, s = {}; ++a < u; ) {
          var c = n[a],
            f = r(t, c);
          e(f, c) && o(s, i(c, t), f);
        }
        return s;
      };
    },
    function(t, n, e) {
      var r = e(76),
        o = e(111);
      t.exports = function(t, n) {
        for (var e = 0, i = (n = r(n, t)).length; null != t && e < i; )
          t = t[o(n[e++])];
        return e && e == i ? t : void 0;
      };
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n) {
      var e = 9007199254740991,
        r = /^(?:0|[1-9]\d*)$/;
      t.exports = function(t, n) {
        var o = typeof t;
        return (
          !!(n = null == n ? e : n) &&
          ('number' == o || ('symbol' != o && r.test(t))) &&
          t > -1 &&
          t % 1 == 0 &&
          t < n
        );
      };
    },
    function(t, n) {
      var e = 9007199254740991;
      t.exports = function(t) {
        return 'number' == typeof t && t > -1 && t % 1 == 0 && t <= e;
      };
    },
    function(t, n, e) {
      var r = e(85),
        o = e(224),
        i = e(226);
      t.exports = function(t) {
        return i(o(t, void 0, r), t + '');
      };
    },
    function(t, n, e) {
      var r = e(225),
        o = Math.max;
      t.exports = function(t, n, e) {
        return (
          (n = o(void 0 === n ? t.length - 1 : n, 0)),
          function() {
            for (
              var i = arguments, a = -1, u = o(i.length - n, 0), s = Array(u);
              ++a < u;

            )
              s[a] = i[n + a];
            a = -1;
            for (var c = Array(n + 1); ++a < n; ) c[a] = i[a];
            return (c[n] = e(s)), r(t, this, c);
          }
        );
      };
    },
    function(t, n) {
      t.exports = function(t, n, e) {
        switch (e.length) {
          case 0:
            return t.call(n);
          case 1:
            return t.call(n, e[0]);
          case 2:
            return t.call(n, e[0], e[1]);
          case 3:
            return t.call(n, e[0], e[1], e[2]);
        }
        return t.apply(n, e);
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n) {
      t.exports = function(t, n, e) {
        for (var r = e - 1, o = t.length; ++r < o; ) if (t[r] === n) return r;
        return -1;
      };
    },
    function(t, n, e) {
      var r = e(160),
        o = e(161),
        i = e(162),
        a = e(69),
        u = e(164),
        s = e(163),
        c = 200;
      t.exports = function(t, n, e, f) {
        var l = -1,
          p = o,
          h = !0,
          d = t.length,
          v = [],
          y = n.length;
        if (!d) return v;
        e && (n = a(n, u(e))),
          f
            ? ((p = i), (h = !1))
            : n.length >= c && ((p = s), (h = !1), (n = new r(n)));
        t: for (; ++l < d; ) {
          var g = t[l],
            m = null == e ? g : e(g);
          if (((g = f || 0 !== g ? g : 0), h && m == m)) {
            for (var b = y; b--; ) if (n[b] === m) continue t;
            v.push(g);
          } else p(n, m, f) || v.push(g);
        }
        return v;
      };
    },
    function(t, n, e) {
      var r = e(152),
        o = e(108);
      t.exports = function(t, n, e) {
        ((void 0 === e || o(t[n], e)) && (void 0 !== e || n in t)) ||
          r(t, n, e);
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        if ('__proto__' != n) return t[n];
      };
    },
    function(t, n, e) {
      var r = e(77),
        o = e(115);
      t.exports = function(t) {
        return r(function(n, e) {
          var r = -1,
            i = e.length,
            a = i > 1 ? e[i - 1] : void 0,
            u = i > 2 ? e[2] : void 0;
          for (
            a = t.length > 3 && 'function' == typeof a ? (i--, a) : void 0,
              u && o(e[0], e[1], u) && ((a = i < 3 ? void 0 : a), (i = 1)),
              n = Object(n);
            ++r < i;

          ) {
            var s = e[r];
            s && t(n, s, r, a);
          }
          return n;
        });
      };
    },
    function(t, n, e) {
      var r = e(113),
        o = e(114),
        i = e(70),
        a = '[object DOMException]',
        u = '[object Error]';
      t.exports = function(t) {
        if (!o(t)) return !1;
        var n = r(t);
        return (
          n == u ||
          n == a ||
          ('string' == typeof t.message && 'string' == typeof t.name && !i(t))
        );
      };
    },
    function(t, n) {
      t.exports = /<%=([\s\S]+?)%>/g;
    },
    function(t, n, e) {
      var r = e(150),
        o = 1,
        i = 4;
      t.exports = function(t, n) {
        return r(t, o | i, (n = 'function' == typeof n ? n : void 0));
      };
    },
    function(t, n, e) {
      t.exports = e(436);
    },
    function(t, n, e) {
      var r = e(37),
        o = e(437),
        i = e(217),
        a = 'Expected a function',
        u = Math.max,
        s = Math.min;
      t.exports = function(t, n, e) {
        var c,
          f,
          l,
          p,
          h,
          d,
          v = 0,
          y = !1,
          g = !1,
          m = !0;
        if ('function' != typeof t) throw new TypeError(a);
        function b(n) {
          var e = c,
            r = f;
          return (c = f = void 0), (v = n), (p = t.apply(r, e));
        }
        function w(t) {
          var e = t - d;
          return void 0 === d || e >= n || e < 0 || (g && t - v >= l);
        }
        function x() {
          var t = o();
          if (w(t)) return O(t);
          h = setTimeout(
            x,
            (function(t) {
              var e = n - (t - d);
              return g ? s(e, l - (t - v)) : e;
            })(t)
          );
        }
        function O(t) {
          return (h = void 0), m && c ? b(t) : ((c = f = void 0), p);
        }
        function S() {
          var t = o(),
            e = w(t);
          if (((c = arguments), (f = this), (d = t), e)) {
            if (void 0 === h)
              return (function(t) {
                return (v = t), (h = setTimeout(x, n)), y ? b(t) : p;
              })(d);
            if (g) return (h = setTimeout(x, n)), b(d);
          }
          return void 0 === h && (h = setTimeout(x, n)), p;
        }
        return (
          (n = i(n) || 0),
          r(e) &&
            ((y = !!e.leading),
            (l = (g = 'maxWait' in e) ? u(i(e.maxWait) || 0, n) : l),
            (m = 'trailing' in e ? !!e.trailing : m)),
          (S.cancel = function() {
            void 0 !== h && clearTimeout(h), (v = 0), (c = d = f = h = void 0);
          }),
          (S.flush = function() {
            return void 0 === h ? p : O(o());
          }),
          S
        );
      };
    },
    function(t, n, e) {
      var r = e(156),
        o = e(438),
        i = e(439);
      t.exports = function(t, n) {
        return i(t, o(r(n)));
      };
    },
    function(t, n, e) {
      var r = e(451);
      t.exports = function(t) {
        return t && t.length ? r(t) : [];
      };
    },
    function(t, n, e) {
      var r = e(69),
        o = e(454),
        i = e(77),
        a = e(455),
        u = i(function(t) {
          var n = r(t, a);
          return n.length && n[0] === t[0] ? o(n) : [];
        });
      t.exports = u;
    },
    function(t, n, e) {
      var r = e(228),
        o = e(159),
        i = e(77),
        a = e(112),
        u = i(function(t, n) {
          return a(t) ? r(t, o(n, 1, a, !0)) : [];
        });
      t.exports = u;
    },
    function(t, n, e) {
      var r,
        o =
          o ||
          (function(t) {
            'use strict';
            if (
              !(
                void 0 === t ||
                ('undefined' != typeof navigator &&
                  /MSIE [1-9]\./.test(navigator.userAgent))
              )
            ) {
              var n = function() {
                  return t.URL || t.webkitURL || t;
                },
                e = t.document.createElementNS(
                  'http://www.w3.org/1999/xhtml',
                  'a'
                ),
                r = 'download' in e,
                o = /constructor/i.test(t.HTMLElement) || t.safari,
                i = /CriOS\/[\d]+/.test(navigator.userAgent),
                a = function(n) {
                  (t.setImmediate || t.setTimeout)(function() {
                    throw n;
                  }, 0);
                },
                u = function(t) {
                  setTimeout(function() {
                    'string' == typeof t ? n().revokeObjectURL(t) : t.remove();
                  }, 4e4);
                },
                s = function(t) {
                  return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
                    t.type
                  )
                    ? new Blob([String.fromCharCode(65279), t], {
                        type: t.type
                      })
                    : t;
                },
                c = function(c, f, l) {
                  l || (c = s(c));
                  var p,
                    h = this,
                    d = 'application/octet-stream' === c.type,
                    v = function() {
                      !(function(t, n, e) {
                        for (var r = (n = [].concat(n)).length; r--; ) {
                          var o = t['on' + n[r]];
                          if ('function' == typeof o)
                            try {
                              o.call(t, e || t);
                            } catch (t) {
                              a(t);
                            }
                        }
                      })(h, 'writestart progress write writeend'.split(' '));
                    };
                  if (((h.readyState = h.INIT), r))
                    return (
                      (p = n().createObjectURL(c)),
                      void setTimeout(function() {
                        (e.href = p),
                          (e.download = f),
                          (function(t) {
                            var n = new MouseEvent('click');
                            t.dispatchEvent(n);
                          })(e),
                          v(),
                          u(p),
                          (h.readyState = h.DONE);
                      })
                    );
                  !(function() {
                    if ((i || (d && o)) && t.FileReader) {
                      var e = new FileReader();
                      return (
                        (e.onloadend = function() {
                          var n = i
                            ? e.result
                            : e.result.replace(
                                /^data:[^;]*;/,
                                'data:attachment/file;'
                              );
                          t.open(n, '_blank') || (t.location.href = n),
                            (n = void 0),
                            (h.readyState = h.DONE),
                            v();
                        }),
                        e.readAsDataURL(c),
                        void (h.readyState = h.INIT)
                      );
                    }
                    p || (p = n().createObjectURL(c)),
                      d
                        ? (t.location.href = p)
                        : t.open(p, '_blank') || (t.location.href = p);
                    (h.readyState = h.DONE), v(), u(p);
                  })();
                },
                f = c.prototype;
              return 'undefined' != typeof navigator &&
                navigator.msSaveOrOpenBlob
                ? function(t, n, e) {
                    return (
                      (n = n || t.name || 'download'),
                      e || (t = s(t)),
                      navigator.msSaveOrOpenBlob(t, n)
                    );
                  }
                : ((f.abort = function() {}),
                  (f.readyState = f.INIT = 0),
                  (f.WRITING = 1),
                  (f.DONE = 2),
                  (f.error = f.onwritestart = f.onprogress = f.onwrite = f.onabort = f.onerror = f.onwriteend = null),
                  function(t, n, e) {
                    return new c(t, n || t.name || 'download', e);
                  });
            }
          })(
            ('undefined' != typeof self && self) ||
              ('undefined' != typeof window && window) ||
              this.content
          );
      /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */ t.exports
        ? (t.exports.saveAs = o)
        : null !== e(24) &&
          null !== e(51) &&
          (void 0 ===
            (r = function() {
              return o;
            }.call(n, e, n, t)) ||
            (t.exports = r));
    },
    function(t, n, e) {
      var r = e(228),
        o = e(77),
        i = e(112),
        a = o(function(t, n) {
          return i(t) ? r(t, n) : [];
        });
      t.exports = a;
    },
    function(t, n, e) {
      var r = e(159),
        o = e(462),
        i = e(77),
        a = e(115),
        u = i(function(t, n) {
          if (null == t) return [];
          var e = n.length;
          return (
            e > 1 && a(t, n[0], n[1])
              ? (n = [])
              : e > 2 && a(n[0], n[1], n[2]) && (n = [n[0]]),
            o(t, r(n, 1), [])
          );
        });
      t.exports = u;
    },
    function(t, n, e) {
      var r = e(468),
        o = e(231)(function(t, n, e) {
          r(t, n, e);
        });
      t.exports = o;
    },
    function(t, n, e) {
      var r = e(480),
        o = e(217);
      t.exports = function(t, n, e) {
        return (
          void 0 === e && ((e = n), (n = void 0)),
          void 0 !== e && (e = (e = o(e)) == e ? e : 0),
          void 0 !== n && (n = (n = o(n)) == n ? n : 0),
          r(o(t), n, e)
        );
      };
    },
    function(t, n, e) {
      var r = e(481),
        o = e(482),
        i = e(483),
        a = e(484),
        u = e(485),
        s = e(486),
        c = e(487);
      (c.alea = r),
        (c.xor128 = o),
        (c.xorwow = i),
        (c.xorshift7 = a),
        (c.xor4096 = u),
        (c.tychei = s),
        (t.exports = c);
    },
    function(t, n, e) {
      var r = e(489),
        o = e(490),
        i = e(491),
        a = e(492),
        u = e(493),
        s = e(232),
        c = e(115),
        f = e(153),
        l = e(233),
        p = e(494),
        h = e(157),
        d = /\b__p \+= '';/g,
        v = /\b(__p \+=) '' \+/g,
        y = /(__e\(.*?\)|\b__t\)) \+\n'';/g,
        g = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,
        m = /($^)/,
        b = /['\n\r\u2028\u2029\\]/g;
      t.exports = function(t, n, e) {
        var w = p.imports._.templateSettings || p;
        e && c(t, n, e) && (n = void 0), (t = h(t)), (n = r({}, n, w, a));
        var x,
          O,
          S = r({}, n.imports, w.imports, a),
          _ = f(S),
          j = i(S, _),
          k = 0,
          E = n.interpolate || m,
          P = "__p += '",
          A = RegExp(
            (n.escape || m).source +
              '|' +
              E.source +
              '|' +
              (E === l ? g : m).source +
              '|' +
              (n.evaluate || m).source +
              '|$',
            'g'
          ),
          T = 'sourceURL' in n ? '//# sourceURL=' + n.sourceURL + '\n' : '';
        t.replace(A, function(n, e, r, o, i, a) {
          return (
            r || (r = o),
            (P += t.slice(k, a).replace(b, u)),
            e && ((x = !0), (P += "' +\n__e(" + e + ") +\n'")),
            i && ((O = !0), (P += "';\n" + i + ";\n__p += '")),
            r && (P += "' +\n((__t = (" + r + ")) == null ? '' : __t) +\n'"),
            (k = a + n.length),
            n
          );
        }),
          (P += "';\n");
        var R = n.variable;
        R || (P = 'with (obj) {\n' + P + '\n}\n'),
          (P = (O ? P.replace(d, '') : P).replace(v, '$1').replace(y, '$1;')),
          (P =
            'function(' +
            (R || 'obj') +
            ') {\n' +
            (R ? '' : 'obj || (obj = {});\n') +
            "var __t, __p = ''" +
            (x ? ', __e = _.escape' : '') +
            (O
              ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n"
              : ';\n') +
            P +
            'return __p\n}');
        var M = o(function() {
          return Function(_, T + 'return ' + P).apply(void 0, j);
        });
        if (((M.source = P), s(M))) throw M;
        return M;
      };
    },
    function(t, n, e) {
      var r = e(113),
        o = e(30),
        i = e(114),
        a = '[object String]';
      t.exports = function(t) {
        return 'string' == typeof t || (!o(t) && i(t) && r(t) == a);
      };
    },
    function(t, n, e) {
      'use strict';
      (function(t) {
        e(13),
          e(20),
          e(44),
          e(42),
          e(17),
          e(15),
          e(14),
          e(19),
          e(7),
          e(16),
          e(63),
          e(60);
        var r = e(37),
          o = e.n(r);
        function i(t) {
          return (
            (function(t) {
              if (Array.isArray(t)) return t;
            })(t) ||
            (function(t) {
              if (
                Symbol.iterator in Object(t) ||
                '[object Arguments]' === Object.prototype.toString.call(t)
              )
                return Array.from(t);
            })(t) ||
            (function() {
              throw new TypeError(
                'Invalid attempt to destructure non-iterable instance'
              );
            })()
          );
        }
        var a = function(t, n) {
          return t.reduce(function(t, n) {
            return t[n];
          }, n);
        };
        n.a = function fromObject(n, e) {
          var r = e || window.lab;
          if (void 0 === r)
            throw new Error(
              "Couldn't find library in global scope, and no root object available"
            );
          var u = i(n.type.split('.')).slice(1),
            s = a(u, r);
          return (
            s.metadata.nestedComponents.forEach(function(t) {
              n[t] &&
                (Array.isArray(n[t])
                  ? (n[t] = n[t].map(function(t) {
                      return fromObject(t, r);
                    }))
                  : o()(n[t]) && (n[t] = fromObject(n[t], r)));
            }),
            n.plugins &&
              (n.plugins = n.plugins.map(function(n) {
                try {
                  var e = i((n.path || n.type).split('.')),
                    o = e[0],
                    u = e.slice(1);
                  return new (a(u, 'global' === o ? t || window : r))(n);
                } catch (t) {
                  throw new Error(
                    "Couldn't instantiate plugin ".concat(n.type, '. ') +
                      'Error: '.concat(t.message)
                  );
                }
              })),
            new s(n)
          );
        };
      }.call(this, e(88)));
    },
    function(t, n, e) {
      e(251), (t.exports = e(502));
    },
    function(t, n) {
      !(function(t) {
        'use strict';
        if (!t.fetch) {
          var n = {
            searchParams: 'URLSearchParams' in t,
            iterable: 'Symbol' in t && 'iterator' in Symbol,
            blob:
              'FileReader' in t &&
              'Blob' in t &&
              (function() {
                try {
                  return new Blob(), !0;
                } catch (t) {
                  return !1;
                }
              })(),
            formData: 'FormData' in t,
            arrayBuffer: 'ArrayBuffer' in t
          };
          if (n.arrayBuffer)
            var e = [
                '[object Int8Array]',
                '[object Uint8Array]',
                '[object Uint8ClampedArray]',
                '[object Int16Array]',
                '[object Uint16Array]',
                '[object Int32Array]',
                '[object Uint32Array]',
                '[object Float32Array]',
                '[object Float64Array]'
              ],
              r = function(t) {
                return t && DataView.prototype.isPrototypeOf(t);
              },
              o =
                ArrayBuffer.isView ||
                function(t) {
                  return t && e.indexOf(Object.prototype.toString.call(t)) > -1;
                };
          (f.prototype.append = function(t, n) {
            (t = u(t)), (n = s(n));
            var e = this.map[t];
            this.map[t] = e ? e + ',' + n : n;
          }),
            (f.prototype.delete = function(t) {
              delete this.map[u(t)];
            }),
            (f.prototype.get = function(t) {
              return (t = u(t)), this.has(t) ? this.map[t] : null;
            }),
            (f.prototype.has = function(t) {
              return this.map.hasOwnProperty(u(t));
            }),
            (f.prototype.set = function(t, n) {
              this.map[u(t)] = s(n);
            }),
            (f.prototype.forEach = function(t, n) {
              for (var e in this.map)
                this.map.hasOwnProperty(e) && t.call(n, this.map[e], e, this);
            }),
            (f.prototype.keys = function() {
              var t = [];
              return (
                this.forEach(function(n, e) {
                  t.push(e);
                }),
                c(t)
              );
            }),
            (f.prototype.values = function() {
              var t = [];
              return (
                this.forEach(function(n) {
                  t.push(n);
                }),
                c(t)
              );
            }),
            (f.prototype.entries = function() {
              var t = [];
              return (
                this.forEach(function(n, e) {
                  t.push([e, n]);
                }),
                c(t)
              );
            }),
            n.iterable && (f.prototype[Symbol.iterator] = f.prototype.entries);
          var i = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];
          (y.prototype.clone = function() {
            return new y(this, { body: this._bodyInit });
          }),
            v.call(y.prototype),
            v.call(m.prototype),
            (m.prototype.clone = function() {
              return new m(this._bodyInit, {
                status: this.status,
                statusText: this.statusText,
                headers: new f(this.headers),
                url: this.url
              });
            }),
            (m.error = function() {
              var t = new m(null, { status: 0, statusText: '' });
              return (t.type = 'error'), t;
            });
          var a = [301, 302, 303, 307, 308];
          (m.redirect = function(t, n) {
            if (-1 === a.indexOf(n))
              throw new RangeError('Invalid status code');
            return new m(null, { status: n, headers: { location: t } });
          }),
            (t.Headers = f),
            (t.Request = y),
            (t.Response = m),
            (t.fetch = function(t, e) {
              return new Promise(function(r, o) {
                var i = new y(t, e),
                  a = new XMLHttpRequest();
                (a.onload = function() {
                  var t = {
                    status: a.status,
                    statusText: a.statusText,
                    headers: (function(t) {
                      var n = new f();
                      return (
                        t
                          .replace(/\r?\n[\t ]+/g, ' ')
                          .split(/\r?\n/)
                          .forEach(function(t) {
                            var e = t.split(':'),
                              r = e.shift().trim();
                            if (r) {
                              var o = e.join(':').trim();
                              n.append(r, o);
                            }
                          }),
                        n
                      );
                    })(a.getAllResponseHeaders() || '')
                  };
                  t.url =
                    'responseURL' in a
                      ? a.responseURL
                      : t.headers.get('X-Request-URL');
                  var n = 'response' in a ? a.response : a.responseText;
                  r(new m(n, t));
                }),
                  (a.onerror = function() {
                    o(new TypeError('Network request failed'));
                  }),
                  (a.ontimeout = function() {
                    o(new TypeError('Network request failed'));
                  }),
                  a.open(i.method, i.url, !0),
                  'include' === i.credentials
                    ? (a.withCredentials = !0)
                    : 'omit' === i.credentials && (a.withCredentials = !1),
                  'responseType' in a && n.blob && (a.responseType = 'blob'),
                  i.headers.forEach(function(t, n) {
                    a.setRequestHeader(n, t);
                  }),
                  a.send(void 0 === i._bodyInit ? null : i._bodyInit);
              });
            }),
            (t.fetch.polyfill = !0);
        }
        function u(t) {
          if (
            ('string' != typeof t && (t = String(t)),
            /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(t))
          )
            throw new TypeError('Invalid character in header field name');
          return t.toLowerCase();
        }
        function s(t) {
          return 'string' != typeof t && (t = String(t)), t;
        }
        function c(t) {
          var e = {
            next: function() {
              var n = t.shift();
              return { done: void 0 === n, value: n };
            }
          };
          return (
            n.iterable &&
              (e[Symbol.iterator] = function() {
                return e;
              }),
            e
          );
        }
        function f(t) {
          (this.map = {}),
            t instanceof f
              ? t.forEach(function(t, n) {
                  this.append(n, t);
                }, this)
              : Array.isArray(t)
              ? t.forEach(function(t) {
                  this.append(t[0], t[1]);
                }, this)
              : t &&
                Object.getOwnPropertyNames(t).forEach(function(n) {
                  this.append(n, t[n]);
                }, this);
        }
        function l(t) {
          if (t.bodyUsed) return Promise.reject(new TypeError('Already read'));
          t.bodyUsed = !0;
        }
        function p(t) {
          return new Promise(function(n, e) {
            (t.onload = function() {
              n(t.result);
            }),
              (t.onerror = function() {
                e(t.error);
              });
          });
        }
        function h(t) {
          var n = new FileReader(),
            e = p(n);
          return n.readAsArrayBuffer(t), e;
        }
        function d(t) {
          if (t.slice) return t.slice(0);
          var n = new Uint8Array(t.byteLength);
          return n.set(new Uint8Array(t)), n.buffer;
        }
        function v() {
          return (
            (this.bodyUsed = !1),
            (this._initBody = function(t) {
              if (((this._bodyInit = t), t))
                if ('string' == typeof t) this._bodyText = t;
                else if (n.blob && Blob.prototype.isPrototypeOf(t))
                  this._bodyBlob = t;
                else if (n.formData && FormData.prototype.isPrototypeOf(t))
                  this._bodyFormData = t;
                else if (
                  n.searchParams &&
                  URLSearchParams.prototype.isPrototypeOf(t)
                )
                  this._bodyText = t.toString();
                else if (n.arrayBuffer && n.blob && r(t))
                  (this._bodyArrayBuffer = d(t.buffer)),
                    (this._bodyInit = new Blob([this._bodyArrayBuffer]));
                else {
                  if (
                    !n.arrayBuffer ||
                    (!ArrayBuffer.prototype.isPrototypeOf(t) && !o(t))
                  )
                    throw new Error('unsupported BodyInit type');
                  this._bodyArrayBuffer = d(t);
                }
              else this._bodyText = '';
              this.headers.get('content-type') ||
                ('string' == typeof t
                  ? this.headers.set('content-type', 'text/plain;charset=UTF-8')
                  : this._bodyBlob && this._bodyBlob.type
                  ? this.headers.set('content-type', this._bodyBlob.type)
                  : n.searchParams &&
                    URLSearchParams.prototype.isPrototypeOf(t) &&
                    this.headers.set(
                      'content-type',
                      'application/x-www-form-urlencoded;charset=UTF-8'
                    ));
            }),
            n.blob &&
              ((this.blob = function() {
                var t = l(this);
                if (t) return t;
                if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
                if (this._bodyArrayBuffer)
                  return Promise.resolve(new Blob([this._bodyArrayBuffer]));
                if (this._bodyFormData)
                  throw new Error('could not read FormData body as blob');
                return Promise.resolve(new Blob([this._bodyText]));
              }),
              (this.arrayBuffer = function() {
                return this._bodyArrayBuffer
                  ? l(this) || Promise.resolve(this._bodyArrayBuffer)
                  : this.blob().then(h);
              })),
            (this.text = function() {
              var t = l(this);
              if (t) return t;
              if (this._bodyBlob)
                return (function(t) {
                  var n = new FileReader(),
                    e = p(n);
                  return n.readAsText(t), e;
                })(this._bodyBlob);
              if (this._bodyArrayBuffer)
                return Promise.resolve(
                  (function(t) {
                    for (
                      var n = new Uint8Array(t), e = new Array(n.length), r = 0;
                      r < n.length;
                      r++
                    )
                      e[r] = String.fromCharCode(n[r]);
                    return e.join('');
                  })(this._bodyArrayBuffer)
                );
              if (this._bodyFormData)
                throw new Error('could not read FormData body as text');
              return Promise.resolve(this._bodyText);
            }),
            n.formData &&
              (this.formData = function() {
                return this.text().then(g);
              }),
            (this.json = function() {
              return this.text().then(JSON.parse);
            }),
            this
          );
        }
        function y(t, n) {
          var e = (n = n || {}).body;
          if (t instanceof y) {
            if (t.bodyUsed) throw new TypeError('Already read');
            (this.url = t.url),
              (this.credentials = t.credentials),
              n.headers || (this.headers = new f(t.headers)),
              (this.method = t.method),
              (this.mode = t.mode),
              e ||
                null == t._bodyInit ||
                ((e = t._bodyInit), (t.bodyUsed = !0));
          } else this.url = String(t);
          if (
            ((this.credentials = n.credentials || this.credentials || 'omit'),
            (!n.headers && this.headers) || (this.headers = new f(n.headers)),
            (this.method = (function(t) {
              var n = t.toUpperCase();
              return i.indexOf(n) > -1 ? n : t;
            })(n.method || this.method || 'GET')),
            (this.mode = n.mode || this.mode || null),
            (this.referrer = null),
            ('GET' === this.method || 'HEAD' === this.method) && e)
          )
            throw new TypeError('Body not allowed for GET or HEAD requests');
          this._initBody(e);
        }
        function g(t) {
          var n = new FormData();
          return (
            t
              .trim()
              .split('&')
              .forEach(function(t) {
                if (t) {
                  var e = t.split('='),
                    r = e.shift().replace(/\+/g, ' '),
                    o = e.join('=').replace(/\+/g, ' ');
                  n.append(decodeURIComponent(r), decodeURIComponent(o));
                }
              }),
            n
          );
        }
        function m(t, n) {
          n || (n = {}),
            (this.type = 'default'),
            (this.status = void 0 === n.status ? 200 : n.status),
            (this.ok = this.status >= 200 && this.status < 300),
            (this.statusText = 'statusText' in n ? n.statusText : 'OK'),
            (this.headers = new f(n.headers)),
            (this.url = n.url || ''),
            this._initBody(t);
        }
      })('undefined' != typeof self ? self : this);
    },
    function(t, n, e) {
      'use strict';
      (function(t) {
        if ((e(253), e(409), e(410), t._babelPolyfill))
          throw new Error('only one instance of babel-polyfill is allowed');
        t._babelPolyfill = !0;
        var n = 'defineProperty';
        function r(t, e, r) {
          t[e] || Object[n](t, e, { writable: !0, configurable: !0, value: r });
        }
        r(String.prototype, 'padLeft', ''.padStart),
          r(String.prototype, 'padRight', ''.padEnd),
          'pop,reverse,shift,keys,values,entries,indexOf,every,some,forEach,map,filter,find,findIndex,includes,join,slice,concat,push,splice,unshift,sort,lastIndexOf,reduce,reduceRight,copyWithin,fill'
            .split(',')
            .forEach(function(t) {
              [][t] && r(Array, t, Function.call.bind([][t]));
            });
      }.call(this, e(88)));
    },
    function(t, n, e) {
      e(15),
        e(58),
        e(6),
        e(255),
        e(256),
        e(257),
        e(34),
        e(258),
        e(173),
        e(259),
        e(260),
        e(261),
        e(262),
        e(263),
        e(72),
        e(264),
        e(59),
        e(266),
        e(82),
        e(93),
        e(267),
        e(268),
        e(269),
        e(179),
        e(270),
        e(271),
        e(272),
        e(273),
        e(274),
        e(275),
        e(276),
        e(277),
        e(278),
        e(279),
        e(280),
        e(281),
        e(282),
        e(283),
        e(284),
        e(285),
        e(286),
        e(287),
        e(288),
        e(289),
        e(290),
        e(291),
        e(292),
        e(293),
        e(294),
        e(295),
        e(296),
        e(297),
        e(298),
        e(299),
        e(130),
        e(13),
        e(300),
        e(301),
        e(83),
        e(184),
        e(185),
        e(302),
        e(303),
        e(304),
        e(305),
        e(306),
        e(307),
        e(308),
        e(309),
        e(310),
        e(311),
        e(312),
        e(313),
        e(314),
        e(315),
        e(316),
        e(186),
        e(42),
        e(318),
        e(19),
        e(20),
        e(320),
        e(321),
        e(322),
        e(188),
        e(16),
        e(14),
        e(29),
        e(324),
        e(325),
        e(60),
        e(326),
        e(327),
        e(328),
        e(329),
        e(140),
        e(330),
        e(331),
        e(332),
        e(11),
        e(192),
        e(44),
        e(193),
        e(333),
        e(62),
        e(194),
        e(63),
        e(36),
        e(197),
        e(145),
        e(199),
        e(334),
        e(335),
        e(336),
        e(337),
        e(202),
        e(338),
        e(339),
        e(340),
        e(341),
        e(342),
        e(343),
        e(344),
        e(345),
        e(346),
        e(347),
        e(348),
        e(349),
        e(102),
        e(147),
        e(350),
        e(148),
        e(351),
        e(149),
        e(352),
        e(353),
        e(354),
        e(84),
        e(355),
        e(356),
        e(357),
        e(205),
        e(358),
        e(359),
        e(360),
        e(361),
        e(17),
        e(362),
        e(363),
        e(364),
        e(103),
        e(365),
        e(366),
        e(367),
        e(368),
        e(369),
        e(370),
        e(371),
        e(372),
        e(373),
        e(374),
        e(375),
        e(376),
        e(377),
        e(378),
        e(379),
        e(380),
        e(381),
        e(382),
        e(383),
        e(384),
        e(385),
        e(386),
        e(387),
        e(388),
        e(389),
        e(390),
        e(391),
        e(392),
        e(393),
        e(394),
        e(395),
        e(396),
        e(397),
        e(398),
        e(399),
        e(400),
        e(401),
        e(402),
        e(403),
        e(404),
        e(405),
        e(406),
        e(407),
        e(408),
        e(7),
        (t.exports = e(31));
    },
    function(t, n, e) {
      var r = e(54),
        o = e(91),
        i = e(80);
      t.exports = function(t) {
        var n = r(t),
          e = o.f;
        if (e)
          for (var a, u = e(t), s = i.f, c = 0; u.length > c; )
            s.call(t, (a = u[c++])) && n.push(a);
        return n;
      };
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S + r.F * !e(8), 'Object', { defineProperties: e(171) });
    },
    function(t, n, e) {
      var r = e(26),
        o = e(27).f;
      e(41)('getOwnPropertyDescriptor', function() {
        return function(t, n) {
          return o(r(t), n);
        };
      });
    },
    function(t, n, e) {
      var r = e(12),
        o = e(28);
      e(41)('getPrototypeOf', function() {
        return function(t) {
          return o(r(t));
        };
      });
    },
    function(t, n, e) {
      e(41)('getOwnPropertyNames', function() {
        return e(172).f;
      });
    },
    function(t, n, e) {
      var r = e(4),
        o = e(48).onFreeze;
      e(41)('seal', function(t) {
        return function(n) {
          return t && r(n) ? t(o(n)) : n;
        };
      });
    },
    function(t, n, e) {
      var r = e(4),
        o = e(48).onFreeze;
      e(41)('preventExtensions', function(t) {
        return function(n) {
          return t && r(n) ? t(o(n)) : n;
        };
      });
    },
    function(t, n, e) {
      var r = e(4);
      e(41)('isFrozen', function(t) {
        return function(n) {
          return !r(n) || (!!t && t(n));
        };
      });
    },
    function(t, n, e) {
      var r = e(4);
      e(41)('isSealed', function(t) {
        return function(n) {
          return !r(n) || (!!t && t(n));
        };
      });
    },
    function(t, n, e) {
      var r = e(4);
      e(41)('isExtensible', function(t) {
        return function(n) {
          return !!r(n) && (!t || t(n));
        };
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Object', { is: e(265) });
    },
    function(t, n) {
      t.exports =
        Object.is ||
        function(t, n) {
          return t === n ? 0 !== t || 1 / t == 1 / n : t != t && n != n;
        };
    },
    function(t, n, e) {
      'use strict';
      var r = e(81),
        o = {};
      (o[e(5)('toStringTag')] = 'z'),
        o + '' != '[object z]' &&
          e(22)(
            Object.prototype,
            'toString',
            function() {
              return '[object ' + r(this) + ']';
            },
            !0
          );
    },
    function(t, n, e) {
      'use strict';
      var r = e(4),
        o = e(28),
        i = e(5)('hasInstance'),
        a = Function.prototype;
      i in a ||
        e(9).f(a, i, {
          value: function(t) {
            if ('function' != typeof this || !r(t)) return !1;
            if (!r(this.prototype)) return t instanceof this;
            for (; (t = o(t)); ) if (this.prototype === t) return !0;
            return !1;
          }
        });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(177);
      r(r.G + r.F * (parseInt != o), { parseInt: o });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(178);
      r(r.G + r.F * (parseFloat != o), { parseFloat: o });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(40),
        i = e(180),
        a = e(127),
        u = (1).toFixed,
        s = Math.floor,
        c = [0, 0, 0, 0, 0, 0],
        f = 'Number.toFixed: incorrect invocation!',
        l = function(t, n) {
          for (var e = -1, r = n; ++e < 6; )
            (r += t * c[e]), (c[e] = r % 1e7), (r = s(r / 1e7));
        },
        p = function(t) {
          for (var n = 6, e = 0; --n >= 0; )
            (e += c[n]), (c[n] = s(e / t)), (e = (e % t) * 1e7);
        },
        h = function() {
          for (var t = 6, n = ''; --t >= 0; )
            if ('' !== n || 0 === t || 0 !== c[t]) {
              var e = String(c[t]);
              n = '' === n ? e : n + a.call('0', 7 - e.length) + e;
            }
          return n;
        },
        d = function(t, n, e) {
          return 0 === n
            ? e
            : n % 2 == 1
            ? d(t, n - 1, e * t)
            : d(t * t, n / 2, e);
        };
      r(
        r.P +
          r.F *
            ((!!u &&
              ('0.000' !== (8e-5).toFixed(3) ||
                '1' !== (0.9).toFixed(0) ||
                '1.25' !== (1.255).toFixed(2) ||
                '1000000000000000128' !== (0xde0b6b3a7640080).toFixed(0))) ||
              !e(3)(function() {
                u.call({});
              })),
        'Number',
        {
          toFixed: function(t) {
            var n,
              e,
              r,
              u,
              s = i(this, f),
              c = o(t),
              v = '',
              y = '0';
            if (c < 0 || c > 20) throw RangeError(f);
            if (s != s) return 'NaN';
            if (s <= -1e21 || s >= 1e21) return String(s);
            if ((s < 0 && ((v = '-'), (s = -s)), s > 1e-21))
              if (
                ((e =
                  (n =
                    (function(t) {
                      for (var n = 0, e = t; e >= 4096; )
                        (n += 12), (e /= 4096);
                      for (; e >= 2; ) (n += 1), (e /= 2);
                      return n;
                    })(s * d(2, 69, 1)) - 69) < 0
                    ? s * d(2, -n, 1)
                    : s / d(2, n, 1)),
                (e *= 4503599627370496),
                (n = 52 - n) > 0)
              ) {
                for (l(0, e), r = c; r >= 7; ) l(1e7, 0), (r -= 7);
                for (l(d(10, r, 1), 0), r = n - 1; r >= 23; )
                  p(1 << 23), (r -= 23);
                p(1 << r), l(1, 1), p(2), (y = h());
              } else l(0, e), l(1 << -n, 0), (y = h() + a.call('0', c));
            return (y =
              c > 0
                ? v +
                  ((u = y.length) <= c
                    ? '0.' + a.call('0', c - u) + y
                    : y.slice(0, u - c) + '.' + y.slice(u - c))
                : v + y);
          }
        }
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(3),
        i = e(180),
        a = (1).toPrecision;
      r(
        r.P +
          r.F *
            (o(function() {
              return '1' !== a.call(1, void 0);
            }) ||
              !o(function() {
                a.call({});
              })),
        'Number',
        {
          toPrecision: function(t) {
            var n = i(this, 'Number#toPrecision: incorrect invocation!');
            return void 0 === t ? a.call(n) : a.call(n, t);
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Number', { EPSILON: Math.pow(2, -52) });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(2).isFinite;
      r(r.S, 'Number', {
        isFinite: function(t) {
          return 'number' == typeof t && o(t);
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Number', { isInteger: e(181) });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Number', {
        isNaN: function(t) {
          return t != t;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(181),
        i = Math.abs;
      r(r.S, 'Number', {
        isSafeInteger: function(t) {
          return o(t) && i(t) <= 9007199254740991;
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Number', { MAX_SAFE_INTEGER: 9007199254740991 });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Number', { MIN_SAFE_INTEGER: -9007199254740991 });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(178);
      r(r.S + r.F * (Number.parseFloat != o), 'Number', { parseFloat: o });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(177);
      r(r.S + r.F * (Number.parseInt != o), 'Number', { parseInt: o });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(182),
        i = Math.sqrt,
        a = Math.acosh;
      r(
        r.S +
          r.F *
            !(a && 710 == Math.floor(a(Number.MAX_VALUE)) && a(1 / 0) == 1 / 0),
        'Math',
        {
          acosh: function(t) {
            return (t = +t) < 1
              ? NaN
              : t > 94906265.62425156
              ? Math.log(t) + Math.LN2
              : o(t - 1 + i(t - 1) * i(t + 1));
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(0),
        o = Math.asinh;
      r(r.S + r.F * !(o && 1 / o(0) > 0), 'Math', {
        asinh: function t(n) {
          return isFinite((n = +n)) && 0 != n
            ? n < 0
              ? -t(-n)
              : Math.log(n + Math.sqrt(n * n + 1))
            : n;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = Math.atanh;
      r(r.S + r.F * !(o && 1 / o(-0) < 0), 'Math', {
        atanh: function(t) {
          return 0 == (t = +t) ? t : Math.log((1 + t) / (1 - t)) / 2;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(128);
      r(r.S, 'Math', {
        cbrt: function(t) {
          return o((t = +t)) * Math.pow(Math.abs(t), 1 / 3);
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        clz32: function(t) {
          return (t >>>= 0)
            ? 31 - Math.floor(Math.log(t + 0.5) * Math.LOG2E)
            : 32;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = Math.exp;
      r(r.S, 'Math', {
        cosh: function(t) {
          return (o((t = +t)) + o(-t)) / 2;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(129);
      r(r.S + r.F * (o != Math.expm1), 'Math', { expm1: o });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', { fround: e(183) });
    },
    function(t, n, e) {
      var r = e(0),
        o = Math.abs;
      r(r.S, 'Math', {
        hypot: function(t, n) {
          for (var e, r, i = 0, a = 0, u = arguments.length, s = 0; a < u; )
            s < (e = o(arguments[a++]))
              ? ((i = i * (r = s / e) * r + 1), (s = e))
              : (i += e > 0 ? (r = e / s) * r : e);
          return s === 1 / 0 ? 1 / 0 : s * Math.sqrt(i);
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = Math.imul;
      r(
        r.S +
          r.F *
            e(3)(function() {
              return -5 != o(4294967295, 5) || 2 != o.length;
            }),
        'Math',
        {
          imul: function(t, n) {
            var e = +t,
              r = +n,
              o = 65535 & e,
              i = 65535 & r;
            return (
              0 |
              (o * i +
                ((((65535 & (e >>> 16)) * i + o * (65535 & (r >>> 16))) <<
                  16) >>>
                  0))
            );
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        log10: function(t) {
          return Math.log(t) * Math.LOG10E;
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', { log1p: e(182) });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        log2: function(t) {
          return Math.log(t) / Math.LN2;
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', { sign: e(128) });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(129),
        i = Math.exp;
      r(
        r.S +
          r.F *
            e(3)(function() {
              return -2e-17 != !Math.sinh(-2e-17);
            }),
        'Math',
        {
          sinh: function(t) {
            return Math.abs((t = +t)) < 1
              ? (o(t) - o(-t)) / 2
              : (i(t - 1) - i(-t - 1)) * (Math.E / 2);
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(0),
        o = e(129),
        i = Math.exp;
      r(r.S, 'Math', {
        tanh: function(t) {
          var n = o((t = +t)),
            e = o(-t);
          return n == 1 / 0 ? 1 : e == 1 / 0 ? -1 : (n - e) / (i(t) + i(-t));
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        trunc: function(t) {
          return (t > 0 ? Math.floor : Math.ceil)(t);
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(55),
        i = String.fromCharCode,
        a = String.fromCodePoint;
      r(r.S + r.F * (!!a && 1 != a.length), 'String', {
        fromCodePoint: function(t) {
          for (var n, e = [], r = arguments.length, a = 0; r > a; ) {
            if (((n = +arguments[a++]), o(n, 1114111) !== n))
              throw RangeError(n + ' is not a valid code point');
            e.push(
              n < 65536
                ? i(n)
                : i(55296 + ((n -= 65536) >> 10), (n % 1024) + 56320)
            );
          }
          return e.join('');
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(26),
        i = e(10);
      r(r.S, 'String', {
        raw: function(t) {
          for (
            var n = o(t.raw),
              e = i(n.length),
              r = arguments.length,
              a = [],
              u = 0;
            e > u;

          )
            a.push(String(n[u++])), u < r && a.push(String(arguments[u]));
          return a.join('');
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(131)(!1);
      r(r.P, 'String', {
        codePointAt: function(t) {
          return o(this, t);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(10),
        i = e(134),
        a = ''.endsWith;
      r(r.P + r.F * e(135)('endsWith'), 'String', {
        endsWith: function(t) {
          var n = i(this, t, 'endsWith'),
            e = arguments.length > 1 ? arguments[1] : void 0,
            r = o(n.length),
            u = void 0 === e ? r : Math.min(o(e), r),
            s = String(t);
          return a ? a.call(n, s, u) : n.slice(u - s.length, u) === s;
        }
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('anchor', function(t) {
        return function(n) {
          return t(this, 'a', 'name', n);
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('big', function(t) {
        return function() {
          return t(this, 'big', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('blink', function(t) {
        return function() {
          return t(this, 'blink', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('bold', function(t) {
        return function() {
          return t(this, 'b', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('fixed', function(t) {
        return function() {
          return t(this, 'tt', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('fontcolor', function(t) {
        return function(n) {
          return t(this, 'font', 'color', n);
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('fontsize', function(t) {
        return function(n) {
          return t(this, 'font', 'size', n);
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('italics', function(t) {
        return function() {
          return t(this, 'i', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('link', function(t) {
        return function(n) {
          return t(this, 'a', 'href', n);
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('small', function(t) {
        return function() {
          return t(this, 'small', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('strike', function(t) {
        return function() {
          return t(this, 'strike', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('sub', function(t) {
        return function() {
          return t(this, 'sub', '', '');
        };
      });
    },
    function(t, n, e) {
      'use strict';
      e(23)('sup', function(t) {
        return function() {
          return t(this, 'sup', '', '');
        };
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Date', {
        now: function() {
          return new Date().getTime();
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(12),
        i = e(38);
      r(
        r.P +
          r.F *
            e(3)(function() {
              return (
                null !== new Date(NaN).toJSON() ||
                1 !==
                  Date.prototype.toJSON.call({
                    toISOString: function() {
                      return 1;
                    }
                  })
              );
            }),
        'Date',
        {
          toJSON: function(t) {
            var n = o(this),
              e = i(n);
            return 'number' != typeof e || isFinite(e) ? n.toISOString() : null;
          }
        }
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(3),
        o = Date.prototype.getTime,
        i = Date.prototype.toISOString,
        a = function(t) {
          return t > 9 ? t : '0' + t;
        };
      t.exports =
        r(function() {
          return '0385-07-25T07:06:39.999Z' != i.call(new Date(-5e13 - 1));
        }) ||
        !r(function() {
          i.call(new Date(NaN));
        })
          ? function() {
              if (!isFinite(o.call(this)))
                throw RangeError('Invalid time value');
              var t = this,
                n = t.getUTCFullYear(),
                e = t.getUTCMilliseconds(),
                r = n < 0 ? '-' : n > 9999 ? '+' : '';
              return (
                r +
                ('00000' + Math.abs(n)).slice(r ? -6 : -4) +
                '-' +
                a(t.getUTCMonth() + 1) +
                '-' +
                a(t.getUTCDate()) +
                'T' +
                a(t.getUTCHours()) +
                ':' +
                a(t.getUTCMinutes()) +
                ':' +
                a(t.getUTCSeconds()) +
                '.' +
                (e > 99 ? e : '0' + a(e)) +
                'Z'
              );
            }
          : i;
    },
    function(t, n, e) {
      var r = e(5)('toPrimitive'),
        o = Date.prototype;
      r in o || e(21)(o, r, e(319));
    },
    function(t, n, e) {
      'use strict';
      var r = e(1),
        o = e(38);
      t.exports = function(t) {
        if ('string' !== t && 'number' !== t && 'default' !== t)
          throw TypeError('Incorrect hint');
        return o(r(this), 'number' != t);
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(137);
      r(
        r.S +
          r.F *
            e(3)(function() {
              function t() {}
              return !(Array.of.call(t) instanceof t);
            }),
        'Array',
        {
          of: function() {
            for (
              var t = 0,
                n = arguments.length,
                e = new ('function' == typeof this ? this : Array)(n);
              n > t;

            )
              o(e, t, arguments[t++]);
            return (e.length = n), e;
          }
        }
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(26),
        i = [].join;
      r(r.P + r.F * (e(79) != Object || !e(35)(i)), 'Array', {
        join: function(t) {
          return i.call(o(this), void 0 === t ? ',' : t);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(123),
        i = e(33),
        a = e(55),
        u = e(10),
        s = [].slice;
      r(
        r.P +
          r.F *
            e(3)(function() {
              o && s.call(o);
            }),
        'Array',
        {
          slice: function(t, n) {
            var e = u(this.length),
              r = i(this);
            if (((n = void 0 === n ? e : n), 'Array' == r))
              return s.call(this, t, n);
            for (
              var o = a(t, e),
                c = a(n, e),
                f = u(c - o),
                l = new Array(f),
                p = 0;
              p < f;
              p++
            )
              l[p] = 'String' == r ? this.charAt(o + p) : this[o + p];
            return l;
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(4),
        o = e(92),
        i = e(5)('species');
      t.exports = function(t) {
        var n;
        return (
          o(t) &&
            ('function' != typeof (n = t.constructor) ||
              (n !== Array && !o(n.prototype)) ||
              (n = void 0),
            r(n) && null === (n = n[i]) && (n = void 0)),
          void 0 === n ? Array : n
        );
      };
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(3);
      r(r.P + r.F * !e(35)([].some, !0), 'Array', {
        some: function(t) {
          return o(this, t, arguments[1]);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(4);
      r(r.P + r.F * !e(35)([].every, !0), 'Array', {
        every: function(t) {
          return o(this, t, arguments[1]);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(189);
      r(r.P + r.F * !e(35)([].reduceRight, !0), 'Array', {
        reduceRight: function(t) {
          return o(this, t, arguments.length, arguments[1], !0);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(90)(!1),
        i = [].indexOf,
        a = !!i && 1 / [1].indexOf(1, -0) < 0;
      r(r.P + r.F * (a || !e(35)(i)), 'Array', {
        indexOf: function(t) {
          return a ? i.apply(this, arguments) || 0 : o(this, t, arguments[1]);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(26),
        i = e(40),
        a = e(10),
        u = [].lastIndexOf,
        s = !!u && 1 / [1].lastIndexOf(1, -0) < 0;
      r(r.P + r.F * (s || !e(35)(u)), 'Array', {
        lastIndexOf: function(t) {
          if (s) return u.apply(this, arguments) || 0;
          var n = o(this),
            e = a(n.length),
            r = e - 1;
          for (
            arguments.length > 1 && (r = Math.min(r, i(arguments[1]))),
              r < 0 && (r = e + r);
            r >= 0;
            r--
          )
            if (r in n && n[r] === t) return r || 0;
          return -1;
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.P, 'Array', { copyWithin: e(190) }), e(50)('copyWithin');
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(5),
        i = !0;
      'find' in [] &&
        Array(1).find(function() {
          i = !1;
        }),
        r(r.P + r.F * i, 'Array', {
          find: function(t) {
            return o(this, t, arguments.length > 1 ? arguments[1] : void 0);
          }
        }),
        e(50)('find');
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(43)(6),
        i = 'findIndex',
        a = !0;
      i in [] &&
        Array(1)[i](function() {
          a = !1;
        }),
        r(r.P + r.F * a, 'Array', {
          findIndex: function(t) {
            return o(this, t, arguments.length > 1 ? arguments[1] : void 0);
          }
        }),
        e(50)(i);
    },
    function(t, n, e) {
      e(61)('Array');
    },
    function(t, n, e) {
      e(97)('match', 1, function(t, n, e) {
        return [
          function(e) {
            'use strict';
            var r = t(this),
              o = void 0 == e ? void 0 : e[n];
            return void 0 !== o ? o.call(e, r) : new RegExp(e)[n](String(r));
          },
          e
        ];
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(200),
        o = e(75);
      e(100)(
        'WeakSet',
        function(t) {
          return function() {
            return t(this, arguments.length > 0 ? arguments[0] : void 0);
          };
        },
        {
          add: function(t) {
            return r.def(o(this, 'WeakSet'), t, !0);
          }
        },
        r,
        !1,
        !0
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(101),
        i = e(146),
        a = e(1),
        u = e(55),
        s = e(10),
        c = e(4),
        f = e(2).ArrayBuffer,
        l = e(98),
        p = i.ArrayBuffer,
        h = i.DataView,
        d = o.ABV && f.isView,
        v = p.prototype.slice,
        y = o.VIEW;
      r(r.G + r.W + r.F * (f !== p), { ArrayBuffer: p }),
        r(r.S + r.F * !o.CONSTR, 'ArrayBuffer', {
          isView: function(t) {
            return (d && d(t)) || (c(t) && y in t);
          }
        }),
        r(
          r.P +
            r.U +
            r.F *
              e(3)(function() {
                return !new p(2).slice(1, void 0).byteLength;
              }),
          'ArrayBuffer',
          {
            slice: function(t, n) {
              if (void 0 !== v && void 0 === n) return v.call(a(this), t);
              for (
                var e = a(this).byteLength,
                  r = u(t, e),
                  o = u(void 0 === n ? e : n, e),
                  i = new (l(this, p))(s(o - r)),
                  c = new h(this),
                  f = new h(i),
                  d = 0;
                r < o;

              )
                f.setUint8(d++, c.getUint8(r++));
              return i;
            }
          }
        ),
        e(61)('ArrayBuffer');
    },
    function(t, n, e) {
      var r = e(0);
      r(r.G + r.W + r.F * !e(101).ABV, { DataView: e(146).DataView });
    },
    function(t, n, e) {
      e(45)('Int8', 1, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      e(45)(
        'Uint8',
        1,
        function(t) {
          return function(n, e, r) {
            return t(this, n, e, r);
          };
        },
        !0
      );
    },
    function(t, n, e) {
      e(45)('Int16', 2, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      e(45)('Uint16', 2, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      e(45)('Int32', 4, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      e(45)('Uint32', 4, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      e(45)('Float32', 4, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      e(45)('Float64', 8, function(t) {
        return function(n, e, r) {
          return t(this, n, e, r);
        };
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(18),
        i = e(1),
        a = (e(2).Reflect || {}).apply,
        u = Function.apply;
      r(
        r.S +
          r.F *
            !e(3)(function() {
              a(function() {});
            }),
        'Reflect',
        {
          apply: function(t, n, e) {
            var r = o(t),
              s = i(e);
            return a ? a(r, n, s) : u.call(r, n, s);
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(0),
        o = e(56),
        i = e(18),
        a = e(1),
        u = e(4),
        s = e(3),
        c = e(175),
        f = (e(2).Reflect || {}).construct,
        l = s(function() {
          function t() {}
          return !(f(function() {}, [], t) instanceof t);
        }),
        p = !s(function() {
          f(function() {});
        });
      r(r.S + r.F * (l || p), 'Reflect', {
        construct: function(t, n) {
          i(t), a(n);
          var e = arguments.length < 3 ? t : i(arguments[2]);
          if (p && !l) return f(t, n, e);
          if (t == e) {
            switch (n.length) {
              case 0:
                return new t();
              case 1:
                return new t(n[0]);
              case 2:
                return new t(n[0], n[1]);
              case 3:
                return new t(n[0], n[1], n[2]);
              case 4:
                return new t(n[0], n[1], n[2], n[3]);
            }
            var r = [null];
            return r.push.apply(r, n), new (c.apply(t, r))();
          }
          var s = e.prototype,
            h = o(u(s) ? s : Object.prototype),
            d = Function.apply.call(t, h, n);
          return u(d) ? d : h;
        }
      });
    },
    function(t, n, e) {
      var r = e(9),
        o = e(0),
        i = e(1),
        a = e(38);
      o(
        o.S +
          o.F *
            e(3)(function() {
              Reflect.defineProperty(r.f({}, 1, { value: 1 }), 1, { value: 2 });
            }),
        'Reflect',
        {
          defineProperty: function(t, n, e) {
            i(t), (n = a(n, !0)), i(e);
            try {
              return r.f(t, n, e), !0;
            } catch (t) {
              return !1;
            }
          }
        }
      );
    },
    function(t, n, e) {
      var r = e(0),
        o = e(27).f,
        i = e(1);
      r(r.S, 'Reflect', {
        deleteProperty: function(t, n) {
          var e = o(i(t), n);
          return !(e && !e.configurable) && delete t[n];
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(1),
        i = function(t) {
          (this._t = o(t)), (this._i = 0);
          var n,
            e = (this._k = []);
          for (n in t) e.push(n);
        };
      e(133)(i, 'Object', function() {
        var t,
          n = this._k;
        do {
          if (this._i >= n.length) return { value: void 0, done: !0 };
        } while (!((t = n[this._i++]) in this._t));
        return { value: t, done: !1 };
      }),
        r(r.S, 'Reflect', {
          enumerate: function(t) {
            return new i(t);
          }
        });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(28),
        i = e(1);
      r(r.S, 'Reflect', {
        getPrototypeOf: function(t) {
          return o(i(t));
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(1),
        i = Object.isExtensible;
      r(r.S, 'Reflect', {
        isExtensible: function(t) {
          return o(t), !i || i(t);
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(1),
        i = Object.preventExtensions;
      r(r.S, 'Reflect', {
        preventExtensions: function(t) {
          o(t);
          try {
            return i && i(t), !0;
          } catch (t) {
            return !1;
          }
        }
      });
    },
    function(t, n, e) {
      var r = e(9),
        o = e(27),
        i = e(28),
        a = e(25),
        u = e(0),
        s = e(52),
        c = e(1),
        f = e(4);
      u(u.S, 'Reflect', {
        set: function t(n, e, u) {
          var l,
            p,
            h = arguments.length < 4 ? n : arguments[3],
            d = o.f(c(n), e);
          if (!d) {
            if (f((p = i(n)))) return t(p, e, u, h);
            d = s(0);
          }
          if (a(d, 'value')) {
            if (!1 === d.writable || !f(h)) return !1;
            if ((l = o.f(h, e))) {
              if (l.get || l.set || !1 === l.writable) return !1;
              (l.value = u), r.f(h, e, l);
            } else r.f(h, e, s(0, u));
            return !0;
          }
          return void 0 !== d.set && (d.set.call(h, u), !0);
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(124);
      o &&
        r(r.S, 'Reflect', {
          setPrototypeOf: function(t, n) {
            o.check(t, n);
            try {
              return o.set(t, n), !0;
            } catch (t) {
              return !1;
            }
          }
        });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(204),
        i = e(12),
        a = e(10),
        u = e(18),
        s = e(139);
      r(r.P, 'Array', {
        flatMap: function(t) {
          var n,
            e,
            r = i(this);
          return (
            u(t),
            (n = a(r.length)),
            (e = s(r, 0)),
            o(e, r, r, n, 0, 1, t, arguments[1]),
            e
          );
        }
      }),
        e(50)('flatMap');
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(204),
        i = e(12),
        a = e(10),
        u = e(40),
        s = e(139);
      r(r.P, 'Array', {
        flatten: function() {
          var t = arguments[0],
            n = i(this),
            e = a(n.length),
            r = s(n, 0);
          return o(r, n, n, e, 0, void 0 === t ? 1 : u(t)), r;
        }
      }),
        e(50)('flatten');
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(131)(!0);
      r(r.P, 'String', {
        at: function(t) {
          return o(this, t);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(206),
        i = e(99);
      r(r.P + r.F * /Version\/10\.\d+(\.\d+)? Safari\//.test(i), 'String', {
        padEnd: function(t) {
          return o(this, t, arguments.length > 1 ? arguments[1] : void 0, !1);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      e(73)(
        'trimLeft',
        function(t) {
          return function() {
            return t(this, 1);
          };
        },
        'trimStart'
      );
    },
    function(t, n, e) {
      'use strict';
      e(73)(
        'trimRight',
        function(t) {
          return function() {
            return t(this, 2);
          };
        },
        'trimEnd'
      );
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(39),
        i = e(10),
        a = e(94),
        u = e(96),
        s = RegExp.prototype,
        c = function(t, n) {
          (this._r = t), (this._s = n);
        };
      e(133)(c, 'RegExp String', function() {
        var t = this._r.exec(this._s);
        return { value: t, done: null === t };
      }),
        r(r.P, 'String', {
          matchAll: function(t) {
            if ((o(this), !a(t))) throw TypeError(t + ' is not a regexp!');
            var n = String(this),
              e = 'flags' in s ? String(t.flags) : u.call(t),
              r = new RegExp(t.source, ~e.indexOf('g') ? e : 'g' + e);
            return (r.lastIndex = i(t.lastIndex)), new c(r, n);
          }
        });
    },
    function(t, n, e) {
      e(120)('observable');
    },
    function(t, n, e) {
      var r = e(0),
        o = e(203),
        i = e(26),
        a = e(27),
        u = e(137);
      r(r.S, 'Object', {
        getOwnPropertyDescriptors: function(t) {
          for (
            var n, e, r = i(t), s = a.f, c = o(r), f = {}, l = 0;
            c.length > l;

          )
            void 0 !== (e = s(r, (n = c[l++]))) && u(f, n, e);
          return f;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(207)(!1);
      r(r.S, 'Object', {
        values: function(t) {
          return o(t);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(12),
        i = e(18),
        a = e(9);
      e(8) &&
        r(r.P + e(104), 'Object', {
          __defineGetter__: function(t, n) {
            a.f(o(this), t, { get: i(n), enumerable: !0, configurable: !0 });
          }
        });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(12),
        i = e(18),
        a = e(9);
      e(8) &&
        r(r.P + e(104), 'Object', {
          __defineSetter__: function(t, n) {
            a.f(o(this), t, { set: i(n), enumerable: !0, configurable: !0 });
          }
        });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(12),
        i = e(38),
        a = e(28),
        u = e(27).f;
      e(8) &&
        r(r.P + e(104), 'Object', {
          __lookupGetter__: function(t) {
            var n,
              e = o(this),
              r = i(t, !0);
            do {
              if ((n = u(e, r))) return n.get;
            } while ((e = a(e)));
          }
        });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(12),
        i = e(38),
        a = e(28),
        u = e(27).f;
      e(8) &&
        r(r.P + e(104), 'Object', {
          __lookupSetter__: function(t) {
            var n,
              e = o(this),
              r = i(t, !0);
            do {
              if ((n = u(e, r))) return n.set;
            } while ((e = a(e)));
          }
        });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.P + r.R, 'Map', { toJSON: e(208)('Map') });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.P + r.R, 'Set', { toJSON: e(208)('Set') });
    },
    function(t, n, e) {
      e(105)('Map');
    },
    function(t, n, e) {
      e(105)('Set');
    },
    function(t, n, e) {
      e(105)('WeakMap');
    },
    function(t, n, e) {
      e(105)('WeakSet');
    },
    function(t, n, e) {
      e(106)('Map');
    },
    function(t, n, e) {
      e(106)('Set');
    },
    function(t, n, e) {
      e(106)('WeakMap');
    },
    function(t, n, e) {
      e(106)('WeakSet');
    },
    function(t, n, e) {
      var r = e(0);
      r(r.G, { global: e(2) });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'System', { global: e(2) });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(33);
      r(r.S, 'Error', {
        isError: function(t) {
          return 'Error' === o(t);
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        clamp: function(t, n, e) {
          return Math.min(e, Math.max(n, t));
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', { DEG_PER_RAD: Math.PI / 180 });
    },
    function(t, n, e) {
      var r = e(0),
        o = 180 / Math.PI;
      r(r.S, 'Math', {
        degrees: function(t) {
          return t * o;
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(210),
        i = e(183);
      r(r.S, 'Math', {
        fscale: function(t, n, e, r, a) {
          return i(o(t, n, e, r, a));
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        iaddh: function(t, n, e, r) {
          var o = t >>> 0,
            i = e >>> 0;
          return (
            ((n >>> 0) +
              (r >>> 0) +
              (((o & i) | ((o | i) & ~((o + i) >>> 0))) >>> 31)) |
            0
          );
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        isubh: function(t, n, e, r) {
          var o = t >>> 0,
            i = e >>> 0;
          return (
            ((n >>> 0) -
              (r >>> 0) -
              (((~o & i) | (~(o ^ i) & ((o - i) >>> 0))) >>> 31)) |
            0
          );
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        imulh: function(t, n) {
          var e = +t,
            r = +n,
            o = 65535 & e,
            i = 65535 & r,
            a = e >> 16,
            u = r >> 16,
            s = ((a * i) >>> 0) + ((o * i) >>> 16);
          return a * u + (s >> 16) + ((((o * u) >>> 0) + (65535 & s)) >> 16);
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', { RAD_PER_DEG: 180 / Math.PI });
    },
    function(t, n, e) {
      var r = e(0),
        o = Math.PI / 180;
      r(r.S, 'Math', {
        radians: function(t) {
          return t * o;
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', { scale: e(210) });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        umulh: function(t, n) {
          var e = +t,
            r = +n,
            o = 65535 & e,
            i = 65535 & r,
            a = e >>> 16,
            u = r >>> 16,
            s = ((a * i) >>> 0) + ((o * i) >>> 16);
          return a * u + (s >>> 16) + ((((o * u) >>> 0) + (65535 & s)) >>> 16);
        }
      });
    },
    function(t, n, e) {
      var r = e(0);
      r(r.S, 'Math', {
        signbit: function(t) {
          return (t = +t) != t ? t : 0 == t ? 1 / t == 1 / 0 : t > 0;
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(31),
        i = e(2),
        a = e(98),
        u = e(196);
      r(r.P + r.R, 'Promise', {
        finally: function(t) {
          var n = a(this, o.Promise || i.Promise),
            e = 'function' == typeof t;
          return this.then(
            e
              ? function(e) {
                  return u(n, t()).then(function() {
                    return e;
                  });
                }
              : t,
            e
              ? function(e) {
                  return u(n, t()).then(function() {
                    throw e;
                  });
                }
              : t
          );
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(144),
        i = e(195);
      r(r.S, 'Promise', {
        try: function(t) {
          var n = o.f(this),
            e = i(t);
          return (e.e ? n.reject : n.resolve)(e.v), n.promise;
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = r.key,
        a = r.set;
      r.exp({
        defineMetadata: function(t, n, e, r) {
          a(t, n, o(e), i(r));
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = r.key,
        a = r.map,
        u = r.store;
      r.exp({
        deleteMetadata: function(t, n) {
          var e = arguments.length < 3 ? void 0 : i(arguments[2]),
            r = a(o(n), e, !1);
          if (void 0 === r || !r.delete(t)) return !1;
          if (r.size) return !0;
          var s = u.get(n);
          return s.delete(e), !!s.size || u.delete(n);
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = e(28),
        a = r.has,
        u = r.get,
        s = r.key,
        c = function(t, n, e) {
          if (a(t, n, e)) return u(t, n, e);
          var r = i(n);
          return null !== r ? c(t, r, e) : void 0;
        };
      r.exp({
        getMetadata: function(t, n) {
          return c(t, o(n), arguments.length < 3 ? void 0 : s(arguments[2]));
        }
      });
    },
    function(t, n, e) {
      var r = e(145),
        o = e(209),
        i = e(46),
        a = e(1),
        u = e(28),
        s = i.keys,
        c = i.key,
        f = function(t, n) {
          var e = s(t, n),
            i = u(t);
          if (null === i) return e;
          var a = f(i, n);
          return a.length ? (e.length ? o(new r(e.concat(a))) : a) : e;
        };
      i.exp({
        getMetadataKeys: function(t) {
          return f(a(t), arguments.length < 2 ? void 0 : c(arguments[1]));
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = r.get,
        a = r.key;
      r.exp({
        getOwnMetadata: function(t, n) {
          return i(t, o(n), arguments.length < 3 ? void 0 : a(arguments[2]));
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = r.keys,
        a = r.key;
      r.exp({
        getOwnMetadataKeys: function(t) {
          return i(o(t), arguments.length < 2 ? void 0 : a(arguments[1]));
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = e(28),
        a = r.has,
        u = r.key,
        s = function(t, n, e) {
          if (a(t, n, e)) return !0;
          var r = i(n);
          return null !== r && s(t, r, e);
        };
      r.exp({
        hasMetadata: function(t, n) {
          return s(t, o(n), arguments.length < 3 ? void 0 : u(arguments[2]));
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = r.has,
        a = r.key;
      r.exp({
        hasOwnMetadata: function(t, n) {
          return i(t, o(n), arguments.length < 3 ? void 0 : a(arguments[2]));
        }
      });
    },
    function(t, n, e) {
      var r = e(46),
        o = e(1),
        i = e(18),
        a = r.key,
        u = r.set;
      r.exp({
        metadata: function(t, n) {
          return function(e, r) {
            u(t, n, (void 0 !== r ? o : i)(e), a(r));
          };
        }
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(143)(),
        i = e(2).process,
        a = 'process' == e(33)(i);
      r(r.G, {
        asap: function(t) {
          var n = a && i.domain;
          o(n ? n.bind(t) : t);
        }
      });
    },
    function(t, n, e) {
      'use strict';
      var r = e(0),
        o = e(2),
        i = e(31),
        a = e(143)(),
        u = e(5)('observable'),
        s = e(18),
        c = e(1),
        f = e(64),
        l = e(66),
        p = e(21),
        h = e(65),
        d = h.RETURN,
        v = function(t) {
          return null == t ? void 0 : s(t);
        },
        y = function(t) {
          var n = t._c;
          n && ((t._c = void 0), n());
        },
        g = function(t) {
          return void 0 === t._o;
        },
        m = function(t) {
          g(t) || ((t._o = void 0), y(t));
        },
        b = function(t, n) {
          c(t), (this._c = void 0), (this._o = t), (t = new w(this));
          try {
            var e = n(t),
              r = e;
            null != e &&
              ('function' == typeof e.unsubscribe
                ? (e = function() {
                    r.unsubscribe();
                  })
                : s(e),
              (this._c = e));
          } catch (n) {
            return void t.error(n);
          }
          g(this) && y(this);
        };
      b.prototype = l(
        {},
        {
          unsubscribe: function() {
            m(this);
          }
        }
      );
      var w = function(t) {
        this._s = t;
      };
      w.prototype = l(
        {},
        {
          next: function(t) {
            var n = this._s;
            if (!g(n)) {
              var e = n._o;
              try {
                var r = v(e.next);
                if (r) return r.call(e, t);
              } catch (t) {
                try {
                  m(n);
                } finally {
                  throw t;
                }
              }
            }
          },
          error: function(t) {
            var n = this._s;
            if (g(n)) throw t;
            var e = n._o;
            n._o = void 0;
            try {
              var r = v(e.error);
              if (!r) throw t;
              t = r.call(e, t);
            } catch (t) {
              try {
                y(n);
              } finally {
                throw t;
              }
            }
            return y(n), t;
          },
          complete: function(t) {
            var n = this._s;
            if (!g(n)) {
              var e = n._o;
              n._o = void 0;
              try {
                var r = v(e.complete);
                t = r ? r.call(e, t) : void 0;
              } catch (t) {
                try {
                  y(n);
                } finally {
                  throw t;
                }
              }
              return y(n), t;
            }
          }
        }
      );
      var x = function(t) {
        f(this, x, 'Observable', '_f')._f = s(t);
      };
      l(x.prototype, {
        subscribe: function(t) {
          return new b(t, this._f);
        },
        forEach: function(t) {
          var n = this;
          return new (i.Promise || o.Promise)(function(e, r) {
            s(t);
            var o = n.subscribe({
              next: function(n) {
                try {
                  return t(n);
                } catch (t) {
                  r(t), o.unsubscribe();
                }
              },
              error: r,
              complete: e
            });
          });
        }
      }),
        l(x, {
          from: function(t) {
            var n = 'function' == typeof this ? this : x,
              e = v(c(t)[u]);
            if (e) {
              var r = c(e.call(t));
              return r.constructor === n
                ? r
                : new n(function(t) {
                    return r.subscribe(t);
                  });
            }
            return new n(function(n) {
              var e = !1;
              return (
                a(function() {
                  if (!e) {
                    try {
                      if (
                        h(t, !1, function(t) {
                          if ((n.next(t), e)) return d;
                        }) === d
                      )
                        return;
                    } catch (t) {
                      if (e) throw t;
                      return void n.error(t);
                    }
                    n.complete();
                  }
                }),
                function() {
                  e = !0;
                }
              );
            });
          },
          of: function() {
            for (var t = 0, n = arguments.length, e = new Array(n); t < n; )
              e[t] = arguments[t++];
            return new ('function' == typeof this ? this : x)(function(t) {
              var n = !1;
              return (
                a(function() {
                  if (!n) {
                    for (var r = 0; r < e.length; ++r)
                      if ((t.next(e[r]), n)) return;
                    t.complete();
                  }
                }),
                function() {
                  n = !0;
                }
              );
            });
          }
        }),
        p(x.prototype, u, function() {
          return this;
        }),
        r(r.G, { Observable: x }),
        e(61)('Observable');
    },
    function(t, n, e) {
      var r = e(2),
        o = e(0),
        i = e(99),
        a = [].slice,
        u = /MSIE .\./.test(i),
        s = function(t) {
          return function(n, e) {
            var r = arguments.length > 2,
              o = !!r && a.call(arguments, 2);
            return t(
              r
                ? function() {
                    ('function' == typeof n ? n : Function(n)).apply(this, o);
                  }
                : n,
              e
            );
          };
        };
      o(o.G + o.B + o.F * u, {
        setTimeout: s(r.setTimeout),
        setInterval: s(r.setInterval)
      });
    },
    function(t, n, e) {
      var r = e(0),
        o = e(142);
      r(r.G + r.B, { setImmediate: o.set, clearImmediate: o.clear });
    },
    function(t, n, e) {
      (function(n) {
        !(function(n) {
          'use strict';
          var e,
            r = Object.prototype,
            o = r.hasOwnProperty,
            i = 'function' == typeof Symbol ? Symbol : {},
            a = i.iterator || '@@iterator',
            u = i.asyncIterator || '@@asyncIterator',
            s = i.toStringTag || '@@toStringTag',
            c = 'object' == typeof t,
            f = n.regeneratorRuntime;
          if (f) c && (t.exports = f);
          else {
            (f = n.regeneratorRuntime = c ? t.exports : {}).wrap = w;
            var l = 'suspendedStart',
              p = 'suspendedYield',
              h = 'executing',
              d = 'completed',
              v = {},
              y = {};
            y[a] = function() {
              return this;
            };
            var g = Object.getPrototypeOf,
              m = g && g(g(R([])));
            m && m !== r && o.call(m, a) && (y = m);
            var b = (_.prototype = O.prototype = Object.create(y));
            (S.prototype = b.constructor = _),
              (_.constructor = S),
              (_[s] = S.displayName = 'GeneratorFunction'),
              (f.isGeneratorFunction = function(t) {
                var n = 'function' == typeof t && t.constructor;
                return (
                  !!n &&
                  (n === S || 'GeneratorFunction' === (n.displayName || n.name))
                );
              }),
              (f.mark = function(t) {
                return (
                  Object.setPrototypeOf
                    ? Object.setPrototypeOf(t, _)
                    : ((t.__proto__ = _),
                      s in t || (t[s] = 'GeneratorFunction')),
                  (t.prototype = Object.create(b)),
                  t
                );
              }),
              (f.awrap = function(t) {
                return { __await: t };
              }),
              j(k.prototype),
              (k.prototype[u] = function() {
                return this;
              }),
              (f.AsyncIterator = k),
              (f.async = function(t, n, e, r) {
                var o = new k(w(t, n, e, r));
                return f.isGeneratorFunction(n)
                  ? o
                  : o.next().then(function(t) {
                      return t.done ? t.value : o.next();
                    });
              }),
              j(b),
              (b[s] = 'Generator'),
              (b[a] = function() {
                return this;
              }),
              (b.toString = function() {
                return '[object Generator]';
              }),
              (f.keys = function(t) {
                var n = [];
                for (var e in t) n.push(e);
                return (
                  n.reverse(),
                  function e() {
                    for (; n.length; ) {
                      var r = n.pop();
                      if (r in t) return (e.value = r), (e.done = !1), e;
                    }
                    return (e.done = !0), e;
                  }
                );
              }),
              (f.values = R),
              (T.prototype = {
                constructor: T,
                reset: function(t) {
                  if (
                    ((this.prev = 0),
                    (this.next = 0),
                    (this.sent = this._sent = e),
                    (this.done = !1),
                    (this.delegate = null),
                    (this.method = 'next'),
                    (this.arg = e),
                    this.tryEntries.forEach(A),
                    !t)
                  )
                    for (var n in this)
                      't' === n.charAt(0) &&
                        o.call(this, n) &&
                        !isNaN(+n.slice(1)) &&
                        (this[n] = e);
                },
                stop: function() {
                  this.done = !0;
                  var t = this.tryEntries[0].completion;
                  if ('throw' === t.type) throw t.arg;
                  return this.rval;
                },
                dispatchException: function(t) {
                  if (this.done) throw t;
                  var n = this;
                  function r(r, o) {
                    return (
                      (u.type = 'throw'),
                      (u.arg = t),
                      (n.next = r),
                      o && ((n.method = 'next'), (n.arg = e)),
                      !!o
                    );
                  }
                  for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                    var a = this.tryEntries[i],
                      u = a.completion;
                    if ('root' === a.tryLoc) return r('end');
                    if (a.tryLoc <= this.prev) {
                      var s = o.call(a, 'catchLoc'),
                        c = o.call(a, 'finallyLoc');
                      if (s && c) {
                        if (this.prev < a.catchLoc) return r(a.catchLoc, !0);
                        if (this.prev < a.finallyLoc) return r(a.finallyLoc);
                      } else if (s) {
                        if (this.prev < a.catchLoc) return r(a.catchLoc, !0);
                      } else {
                        if (!c)
                          throw new Error(
                            'try statement without catch or finally'
                          );
                        if (this.prev < a.finallyLoc) return r(a.finallyLoc);
                      }
                    }
                  }
                },
                abrupt: function(t, n) {
                  for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                    var r = this.tryEntries[e];
                    if (
                      r.tryLoc <= this.prev &&
                      o.call(r, 'finallyLoc') &&
                      this.prev < r.finallyLoc
                    ) {
                      var i = r;
                      break;
                    }
                  }
                  i &&
                    ('break' === t || 'continue' === t) &&
                    i.tryLoc <= n &&
                    n <= i.finallyLoc &&
                    (i = null);
                  var a = i ? i.completion : {};
                  return (
                    (a.type = t),
                    (a.arg = n),
                    i
                      ? ((this.method = 'next'), (this.next = i.finallyLoc), v)
                      : this.complete(a)
                  );
                },
                complete: function(t, n) {
                  if ('throw' === t.type) throw t.arg;
                  return (
                    'break' === t.type || 'continue' === t.type
                      ? (this.next = t.arg)
                      : 'return' === t.type
                      ? ((this.rval = this.arg = t.arg),
                        (this.method = 'return'),
                        (this.next = 'end'))
                      : 'normal' === t.type && n && (this.next = n),
                    v
                  );
                },
                finish: function(t) {
                  for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                    var e = this.tryEntries[n];
                    if (e.finallyLoc === t)
                      return this.complete(e.completion, e.afterLoc), A(e), v;
                  }
                },
                catch: function(t) {
                  for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                    var e = this.tryEntries[n];
                    if (e.tryLoc === t) {
                      var r = e.completion;
                      if ('throw' === r.type) {
                        var o = r.arg;
                        A(e);
                      }
                      return o;
                    }
                  }
                  throw new Error('illegal catch attempt');
                },
                delegateYield: function(t, n, r) {
                  return (
                    (this.delegate = {
                      iterator: R(t),
                      resultName: n,
                      nextLoc: r
                    }),
                    'next' === this.method && (this.arg = e),
                    v
                  );
                }
              });
          }
          function w(t, n, e, r) {
            var o = n && n.prototype instanceof O ? n : O,
              i = Object.create(o.prototype),
              a = new T(r || []);
            return (
              (i._invoke = (function(t, n, e) {
                var r = l;
                return function(o, i) {
                  if (r === h) throw new Error('Generator is already running');
                  if (r === d) {
                    if ('throw' === o) throw i;
                    return M();
                  }
                  for (e.method = o, e.arg = i; ; ) {
                    var a = e.delegate;
                    if (a) {
                      var u = E(a, e);
                      if (u) {
                        if (u === v) continue;
                        return u;
                      }
                    }
                    if ('next' === e.method) e.sent = e._sent = e.arg;
                    else if ('throw' === e.method) {
                      if (r === l) throw ((r = d), e.arg);
                      e.dispatchException(e.arg);
                    } else 'return' === e.method && e.abrupt('return', e.arg);
                    r = h;
                    var s = x(t, n, e);
                    if ('normal' === s.type) {
                      if (((r = e.done ? d : p), s.arg === v)) continue;
                      return { value: s.arg, done: e.done };
                    }
                    'throw' === s.type &&
                      ((r = d), (e.method = 'throw'), (e.arg = s.arg));
                  }
                };
              })(t, e, a)),
              i
            );
          }
          function x(t, n, e) {
            try {
              return { type: 'normal', arg: t.call(n, e) };
            } catch (t) {
              return { type: 'throw', arg: t };
            }
          }
          function O() {}
          function S() {}
          function _() {}
          function j(t) {
            ['next', 'throw', 'return'].forEach(function(n) {
              t[n] = function(t) {
                return this._invoke(n, t);
              };
            });
          }
          function k(t) {
            function e(n, r, i, a) {
              var u = x(t[n], t, r);
              if ('throw' !== u.type) {
                var s = u.arg,
                  c = s.value;
                return c && 'object' == typeof c && o.call(c, '__await')
                  ? Promise.resolve(c.__await).then(
                      function(t) {
                        e('next', t, i, a);
                      },
                      function(t) {
                        e('throw', t, i, a);
                      }
                    )
                  : Promise.resolve(c).then(function(t) {
                      (s.value = t), i(s);
                    }, a);
              }
              a(u.arg);
            }
            var r;
            'object' == typeof n.process &&
              n.process.domain &&
              (e = n.process.domain.bind(e)),
              (this._invoke = function(t, n) {
                function o() {
                  return new Promise(function(r, o) {
                    e(t, n, r, o);
                  });
                }
                return (r = r ? r.then(o, o) : o());
              });
          }
          function E(t, n) {
            var r = t.iterator[n.method];
            if (r === e) {
              if (((n.delegate = null), 'throw' === n.method)) {
                if (
                  t.iterator.return &&
                  ((n.method = 'return'),
                  (n.arg = e),
                  E(t, n),
                  'throw' === n.method)
                )
                  return v;
                (n.method = 'throw'),
                  (n.arg = new TypeError(
                    "The iterator does not provide a 'throw' method"
                  ));
              }
              return v;
            }
            var o = x(r, t.iterator, n.arg);
            if ('throw' === o.type)
              return (
                (n.method = 'throw'), (n.arg = o.arg), (n.delegate = null), v
              );
            var i = o.arg;
            return i
              ? i.done
                ? ((n[t.resultName] = i.value),
                  (n.next = t.nextLoc),
                  'return' !== n.method && ((n.method = 'next'), (n.arg = e)),
                  (n.delegate = null),
                  v)
                : i
              : ((n.method = 'throw'),
                (n.arg = new TypeError('iterator result is not an object')),
                (n.delegate = null),
                v);
          }
          function P(t) {
            var n = { tryLoc: t[0] };
            1 in t && (n.catchLoc = t[1]),
              2 in t && ((n.finallyLoc = t[2]), (n.afterLoc = t[3])),
              this.tryEntries.push(n);
          }
          function A(t) {
            var n = t.completion || {};
            (n.type = 'normal'), delete n.arg, (t.completion = n);
          }
          function T(t) {
            (this.tryEntries = [{ tryLoc: 'root' }]),
              t.forEach(P, this),
              this.reset(!0);
          }
          function R(t) {
            if (t) {
              var n = t[a];
              if (n) return n.call(t);
              if ('function' == typeof t.next) return t;
              if (!isNaN(t.length)) {
                var r = -1,
                  i = function n() {
                    for (; ++r < t.length; )
                      if (o.call(t, r))
                        return (n.value = t[r]), (n.done = !1), n;
                    return (n.value = e), (n.done = !0), n;
                  };
                return (i.next = i);
              }
            }
            return { next: M };
          }
          function M() {
            return { value: e, done: !0 };
          }
        })(
          'object' == typeof n
            ? n
            : 'object' == typeof window
            ? window
            : 'object' == typeof self
            ? self
            : this
        );
      }.call(this, e(88)));
    },
    function(t, n, e) {
      e(411), (t.exports = e(31).RegExp.escape);
    },
    function(t, n, e) {
      var r = e(0),
        o = e(412)(/[\\^$*+?.()|[\]{}]/g, '\\$&');
      r(r.S, 'RegExp', {
        escape: function(t) {
          return o(t);
        }
      });
    },
    function(t, n) {
      t.exports = function(t, n) {
        var e =
          n === Object(n)
            ? function(t) {
                return n[t];
              }
            : n;
        return function(n) {
          return String(n).replace(t, e);
        };
      };
    },
    function(t, n) {
      t.exports = function() {
        (this.__data__ = []), (this.size = 0);
      };
    },
    function(t, n, e) {
      var r = e(107),
        o = Array.prototype.splice;
      t.exports = function(t) {
        var n = this.__data__,
          e = r(n, t);
        return !(
          e < 0 ||
          (e == n.length - 1 ? n.pop() : o.call(n, e, 1), --this.size, 0)
        );
      };
    },
    function(t, n, e) {
      var r = e(107);
      t.exports = function(t) {
        var n = this.__data__,
          e = r(n, t);
        return e < 0 ? void 0 : n[e][1];
      };
    },
    function(t, n, e) {
      var r = e(107);
      t.exports = function(t) {
        return r(this.__data__, t) > -1;
      };
    },
    function(t, n, e) {
      var r = e(107);
      t.exports = function(t, n) {
        var e = this.__data__,
          o = r(e, t);
        return o < 0 ? (++this.size, e.push([t, n])) : (e[o][1] = n), this;
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        for (
          var e = -1, r = null == t ? 0 : t.length;
          ++e < r && !1 !== n(t[e], e, t);

        );
        return t;
      };
    },
    function(t, n, e) {
      var r = e(420),
        o = (function() {
          try {
            var t = r(Object, 'defineProperty');
            return t({}, '', {}), t;
          } catch (t) {}
        })();
      t.exports = o;
    },
    function(t, n) {
      t.exports = function(t, n) {
        return null == t ? void 0 : t[n];
      };
    },
    function(t, n, e) {
      var r = e(67),
        o = e(153);
      t.exports = function(t, n) {
        return t && r(n, o(n), t);
      };
    },
    function(t, n, e) {
      var r = e(67),
        o = e(109);
      t.exports = function(t, n) {
        return t && r(n, o(n), t);
      };
    },
    function(t, n, e) {
      (function(n) {
        var e = 'object' == typeof n && n && n.Object === Object && n;
        t.exports = e;
      }.call(this, e(88)));
    },
    function(t, n, e) {
      var r = e(67),
        o = e(425);
      t.exports = function(t, n) {
        return r(t, o(t), n);
      };
    },
    function(t, n) {
      t.exports = function() {
        return [];
      };
    },
    function(t, n, e) {
      var r = e(67),
        o = e(427);
      t.exports = function(t, n) {
        return r(t, o(t), n);
      };
    },
    function(t, n) {
      t.exports = function() {
        return [];
      };
    },
    function(t, n, e) {
      var r = e(154)(Object.keys, Object);
      t.exports = r;
    },
    function(t, n) {
      var e = Object.prototype.toString;
      t.exports = function(t) {
        return e.call(t);
      };
    },
    function(t, n) {
      var e = Object.prototype.hasOwnProperty;
      t.exports = function(t) {
        var n = t.length,
          r = new t.constructor(n);
        return (
          n &&
            'string' == typeof t[0] &&
            e.call(t, 'index') &&
            ((r.index = t.index), (r.input = t.input)),
          r
        );
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n, e) {
      var r = e(37),
        o = Object.create,
        i = (function() {
          function t() {}
          return function(n) {
            if (!r(n)) return {};
            if (o) return o(n);
            t.prototype = n;
            var e = new t();
            return (t.prototype = void 0), e;
          };
        })();
      t.exports = i;
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n, e) {
      'use strict';
      var r;
      function o(t) {
        return (
          !!t &&
          ('object' == (void 0 === t ? 'undefined' : i(t)) ||
            'function' == typeof t)
        );
      }
      var i =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol
                  ? 'symbol'
                  : typeof t;
              },
        a = (function() {
          var t = null,
            n = function(n, e) {
              if (!o(n) || !o(e))
                throw new TypeError(
                  'Cannot create proxy with a non-object as target or handler'
                );
              var r = function() {};
              t = function() {
                r = function(t) {
                  throw new TypeError(
                    "Cannot perform '" +
                      t +
                      "' on a proxy that has been revoked"
                  );
                };
              };
              var i = e;
              for (var a in ((e = {
                get: null,
                set: null,
                apply: null,
                construct: null
              }),
              i)) {
                if (!(a in e))
                  throw new TypeError(
                    "Proxy polyfill does not support trap '" + a + "'"
                  );
                e[a] = i[a];
              }
              'function' == typeof i && (e.apply = i.apply.bind(i));
              var u = this,
                s = !1,
                c = 'function' == typeof n;
              (e.apply || e.construct || c) &&
                ((u = function() {
                  var t = this && this.constructor === u;
                  if ((r(t ? 'construct' : 'apply'), t && e.construct))
                    return e.construct.call(this, n, arguments);
                  if (!t && e.apply) return e.apply(n, this, arguments);
                  if (c) {
                    if (t) {
                      var o = Array.prototype.slice.call(arguments);
                      return o.unshift(n), new (n.bind.apply(n, o))();
                    }
                    return n.apply(this, arguments);
                  }
                  throw new TypeError(
                    t ? 'not a constructor' : 'not a function'
                  );
                }),
                (s = !0));
              var f = e.get
                  ? function(t) {
                      return r('get'), e.get(this, t, u);
                    }
                  : function(t) {
                      return r('get'), this[t];
                    },
                l = e.set
                  ? function(t, n) {
                      r('set'), e.set(this, t, n, u);
                    }
                  : function(t, n) {
                      r('set'), (this[t] = n);
                    },
                p = {};
              Object.getOwnPropertyNames(n).forEach(function(t) {
                if (!(s && t in u)) {
                  var e = {
                    enumerable: !!Object.getOwnPropertyDescriptor(n, t)
                      .enumerable,
                    get: f.bind(n, t),
                    set: l.bind(n, t)
                  };
                  Object.defineProperty(u, t, e), (p[t] = !0);
                }
              });
              var h = !0;
              if (
                (Object.setPrototypeOf
                  ? Object.setPrototypeOf(u, Object.getPrototypeOf(n))
                  : u.__proto__
                  ? (u.__proto__ = n.__proto__)
                  : (h = !1),
                e.get || !h)
              )
                for (var d in n)
                  p[d] || Object.defineProperty(u, d, { get: f.bind(n, d) });
              return Object.seal(n), Object.seal(u), u;
            };
          return (
            (n.revocable = function(e, r) {
              return { proxy: new n(e, r), revoke: t };
            }),
            n
          );
        })();
      'object' === i(n)
        ? (t.exports = 'function' != typeof Proxy ? a : Proxy)
        : void 0 ===
            (r = function() {
              return 'function' != typeof Proxy ? a : Proxy;
            }.call(n, e, n, t)) || (t.exports = r);
    },
    function(t, n, e) {
      var r = e(110);
      t.exports = function() {
        return r.Date.now();
      };
    },
    function(t, n) {
      var e = 'Expected a function';
      t.exports = function(t) {
        if ('function' != typeof t) throw new TypeError(e);
        return function() {
          var n = arguments;
          switch (n.length) {
            case 0:
              return !t.call(this);
            case 1:
              return !t.call(this, n[0]);
            case 2:
              return !t.call(this, n[0], n[1]);
            case 3:
              return !t.call(this, n[0], n[1], n[2]);
          }
          return !t.apply(this, n);
        };
      };
    },
    function(t, n, e) {
      var r = e(69),
        o = e(156),
        i = e(218),
        a = e(155);
      t.exports = function(t, n) {
        if (null == t) return {};
        var e = r(a(t), function(t) {
          return [t];
        });
        return (
          (n = o(n)),
          i(t, e, function(t, e) {
            return n(t, e[0]);
          })
        );
      };
    },
    function(t, n, e) {
      var r = e(30),
        o = e(220),
        i = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
        a = /^\w*$/;
      t.exports = function(t, n) {
        if (r(t)) return !1;
        var e = typeof t;
        return (
          !(
            'number' != e &&
            'symbol' != e &&
            'boolean' != e &&
            null != t &&
            !o(t)
          ) ||
          a.test(t) ||
          !i.test(t) ||
          (null != n && t in Object(n))
        );
      };
    },
    function(t, n, e) {
      var r = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
        o = /\\(\\)?/g,
        i = e(442)(function(t) {
          var n = [];
          return (
            46 === t.charCodeAt(0) && n.push(''),
            t.replace(r, function(t, e, r, i) {
              n.push(r ? i.replace(o, '$1') : e || t);
            }),
            n
          );
        });
      t.exports = i;
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n, e) {
      var r = e(151),
        o = e(76),
        i = e(221),
        a = e(37),
        u = e(111);
      t.exports = function(t, n, e, s) {
        if (!a(t)) return t;
        for (
          var c = -1, f = (n = o(n, t)).length, l = f - 1, p = t;
          null != p && ++c < f;

        ) {
          var h = u(n[c]),
            d = e;
          if (c != l) {
            var v = p[h];
            void 0 === (d = s ? s(v, h, p) : void 0) &&
              (d = a(v) ? v : i(n[c + 1]) ? [] : {});
          }
          r(p, h, d), (p = p[h]);
        }
        return t;
      };
    },
    function(t, n, e) {
      var r = e(218),
        o = e(445);
      t.exports = function(t, n) {
        return r(t, n, function(n, e) {
          return o(t, e);
        });
      };
    },
    function(t, n, e) {
      var r = e(446),
        o = e(447);
      t.exports = function(t, n) {
        return null != t && o(t, n, r);
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        return null != t && n in Object(t);
      };
    },
    function(t, n, e) {
      var r = e(76),
        o = e(158),
        i = e(30),
        a = e(221),
        u = e(222),
        s = e(111);
      t.exports = function(t, n, e) {
        for (var c = -1, f = (n = r(n, t)).length, l = !1; ++c < f; ) {
          var p = s(n[c]);
          if (!(l = null != t && e(t, p))) break;
          t = t[p];
        }
        return l || ++c != f
          ? l
          : !!(f = null == t ? 0 : t.length) &&
              u(f) &&
              a(p, f) &&
              (i(t) || o(t));
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        for (var e = -1, r = n.length, o = t.length; ++e < r; ) t[o + e] = n[e];
        return t;
      };
    },
    function(t, n, e) {
      var r = e(450),
        o = e(158),
        i = e(30),
        a = r ? r.isConcatSpreadable : void 0;
      t.exports = function(t) {
        return i(t) || o(t) || !!(a && t && t[a]);
      };
    },
    function(t, n, e) {
      var r = e(110).Symbol;
      t.exports = r;
    },
    function(t, n, e) {
      var r = e(160),
        o = e(161),
        i = e(162),
        a = e(163),
        u = e(452),
        s = e(453),
        c = 200;
      t.exports = function(t, n, e) {
        var f = -1,
          l = o,
          p = t.length,
          h = !0,
          d = [],
          v = d;
        if (e) (h = !1), (l = i);
        else if (p >= c) {
          var y = n ? null : u(t);
          if (y) return s(y);
          (h = !1), (l = a), (v = new r());
        } else v = n ? [] : d;
        t: for (; ++f < p; ) {
          var g = t[f],
            m = n ? n(g) : g;
          if (((g = e || 0 !== g ? g : 0), h && m == m)) {
            for (var b = v.length; b--; ) if (v[b] === m) continue t;
            n && v.push(m), d.push(g);
          } else l(v, m, e) || (v !== d && v.push(m), d.push(g));
        }
        return d;
      };
    },
    function(t, n) {
      t.exports = function() {};
    },
    function(t, n) {
      t.exports = function() {
        return [];
      };
    },
    function(t, n, e) {
      var r = e(160),
        o = e(161),
        i = e(162),
        a = e(69),
        u = e(164),
        s = e(163),
        c = Math.min;
      t.exports = function(t, n, e) {
        for (
          var f = e ? i : o,
            l = t[0].length,
            p = t.length,
            h = p,
            d = Array(p),
            v = 1 / 0,
            y = [];
          h--;

        ) {
          var g = t[h];
          h && n && (g = a(g, u(n))),
            (v = c(g.length, v)),
            (d[h] =
              !e && (n || (l >= 120 && g.length >= 120))
                ? new r(h && g)
                : void 0);
        }
        g = t[0];
        var m = -1,
          b = d[0];
        t: for (; ++m < l && y.length < v; ) {
          var w = g[m],
            x = n ? n(w) : w;
          if (((w = e || 0 !== w ? w : 0), !(b ? s(b, x) : f(y, x, e)))) {
            for (h = p; --h; ) {
              var O = d[h];
              if (!(O ? s(O, x) : f(t[h], x, e))) continue t;
            }
            b && b.push(x), y.push(w);
          }
        }
        return y;
      };
    },
    function(t, n, e) {
      var r = e(112);
      t.exports = function(t) {
        return r(t) ? t : [];
      };
    },
    function(t, n, e) {
      var r = e(78),
        o = e(222);
      t.exports = function(t) {
        return null != t && o(t.length) && !r(t);
      };
    },
    function(t, n, e) {
      var r = e(76),
        o = e(458),
        i = e(459),
        a = e(111);
      t.exports = function(t, n) {
        return (n = r(n, t)), null == (t = i(t, n)) || delete t[a(o(n))];
      };
    },
    function(t, n) {
      t.exports = function(t) {
        var n = null == t ? 0 : t.length;
        return n ? t[n - 1] : void 0;
      };
    },
    function(t, n, e) {
      var r = e(219),
        o = e(460);
      t.exports = function(t, n) {
        return n.length < 2 ? t : r(t, o(n, 0, -1));
      };
    },
    function(t, n) {
      t.exports = function(t, n, e) {
        var r = -1,
          o = t.length;
        n < 0 && (n = -n > o ? 0 : o + n),
          (e = e > o ? o : e) < 0 && (e += o),
          (o = n > e ? 0 : (e - n) >>> 0),
          (n >>>= 0);
        for (var i = Array(o); ++r < o; ) i[r] = t[r + n];
        return i;
      };
    },
    function(t, n, e) {
      var r = e(70);
      t.exports = function(t) {
        return r(t) ? void 0 : t;
      };
    },
    function(t, n, e) {
      var r = e(69),
        o = e(156),
        i = e(463),
        a = e(464),
        u = e(164),
        s = e(465),
        c = e(165);
      t.exports = function(t, n, e) {
        var f = -1;
        n = r(n.length ? n : [c], u(o));
        var l = i(t, function(t, e, o) {
          return {
            criteria: r(n, function(n) {
              return n(t);
            }),
            index: ++f,
            value: t
          };
        });
        return a(l, function(t, n) {
          return s(t, n, e);
        });
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        for (var e = -1, r = null == t ? 0 : t.length, o = Array(r); ++e < r; )
          o[e] = n(t[e], e, t);
        return o;
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        var e = t.length;
        for (t.sort(n); e--; ) t[e] = t[e].value;
        return t;
      };
    },
    function(t, n, e) {
      var r = e(466);
      t.exports = function(t, n, e) {
        for (
          var o = -1,
            i = t.criteria,
            a = n.criteria,
            u = i.length,
            s = e.length;
          ++o < u;

        ) {
          var c = r(i[o], a[o]);
          if (c) return o >= s ? c : c * ('desc' == e[o] ? -1 : 1);
        }
        return t.index - n.index;
      };
    },
    function(t, n, e) {
      var r = e(220);
      t.exports = function(t, n) {
        if (t !== n) {
          var e = void 0 !== t,
            o = null === t,
            i = t == t,
            a = r(t),
            u = void 0 !== n,
            s = null === n,
            c = n == n,
            f = r(n);
          if (
            (!s && !f && !a && t > n) ||
            (a && u && c && !s && !f) ||
            (o && u && c) ||
            (!e && c) ||
            !i
          )
            return 1;
          if (
            (!o && !a && !f && t < n) ||
            (f && e && i && !o && !a) ||
            (s && e && i) ||
            (!u && i) ||
            !c
          )
            return -1;
        }
        return 0;
      };
    },
    function(t, n) {
      !(function() {
        'use strict';
        var t = KeyboardEvent.prototype,
          n = Object.getOwnPropertyDescriptor(t, 'key');
        if (n) {
          var e = {
            Win: 'Meta',
            Scroll: 'ScrollLock',
            Spacebar: ' ',
            Down: 'ArrowDown',
            Left: 'ArrowLeft',
            Right: 'ArrowRight',
            Up: 'ArrowUp',
            Del: 'Delete',
            Apps: 'ContextMenu',
            Esc: 'Escape',
            Multiply: '*',
            Add: '+',
            Subtract: '-',
            Decimal: '.',
            Divide: '/'
          };
          Object.defineProperty(t, 'key', {
            get: function() {
              var t = n.get.call(this);
              return e.hasOwnProperty(t) ? e[t] : t;
            }
          });
        }
      })();
    },
    function(t, n, e) {
      var r = e(211),
        o = e(229),
        i = e(469),
        a = e(471),
        u = e(37),
        s = e(109),
        c = e(230);
      t.exports = function t(n, e, f, l, p) {
        n !== e &&
          i(
            e,
            function(i, s) {
              if (u(i)) p || (p = new r()), a(n, e, s, f, t, l, p);
              else {
                var h = l ? l(c(n, s), i, s + '', n, e, p) : void 0;
                void 0 === h && (h = i), o(n, s, h);
              }
            },
            s
          );
      };
    },
    function(t, n, e) {
      var r = e(470)();
      t.exports = r;
    },
    function(t, n) {
      t.exports = function(t) {
        return function(n, e, r) {
          for (var o = -1, i = Object(n), a = r(n), u = a.length; u--; ) {
            var s = a[t ? u : ++o];
            if (!1 === e(i[s], s, i)) break;
          }
          return n;
        };
      };
    },
    function(t, n, e) {
      var r = e(229),
        o = e(212),
        i = e(472),
        a = e(213),
        u = e(214),
        s = e(158),
        c = e(30),
        f = e(112),
        l = e(216),
        p = e(78),
        h = e(37),
        d = e(70),
        v = e(475),
        y = e(230),
        g = e(476);
      t.exports = function(t, n, e, m, b, w, x) {
        var O = y(t, e),
          S = y(n, e),
          _ = x.get(S);
        if (_) r(t, e, _);
        else {
          var j = w ? w(O, S, e + '', t, n, x) : void 0,
            k = void 0 === j;
          if (k) {
            var E = c(S),
              P = !E && l(S),
              A = !E && !P && v(S);
            (j = S),
              E || P || A
                ? c(O)
                  ? (j = O)
                  : f(O)
                  ? (j = a(O))
                  : P
                  ? ((k = !1), (j = o(S, !0)))
                  : A
                  ? ((k = !1), (j = i(S, !0)))
                  : (j = [])
                : d(S) || s(S)
                ? ((j = O), s(O) ? (j = g(O)) : (h(O) && !p(O)) || (j = u(S)))
                : (k = !1);
          }
          k && (x.set(S, j), b(j, S, m, w, x), x.delete(S)), r(t, e, j);
        }
      };
    },
    function(t, n, e) {
      var r = e(473);
      t.exports = function(t, n) {
        var e = n ? r(t.buffer) : t.buffer;
        return new t.constructor(e, t.byteOffset, t.length);
      };
    },
    function(t, n, e) {
      var r = e(474);
      t.exports = function(t) {
        var n = new t.constructor(t.byteLength);
        return new r(n).set(new r(t)), n;
      };
    },
    function(t, n, e) {
      var r = e(110).Uint8Array;
      t.exports = r;
    },
    function(t, n) {
      t.exports = function() {
        return !1;
      };
    },
    function(t, n, e) {
      var r = e(67),
        o = e(109);
      t.exports = function(t) {
        return r(t, o(t));
      };
    },
    function(t, n, e) {
      var r = e(478),
        o = e(115),
        i = e(479);
      t.exports = function(t) {
        return function(n, e, a) {
          return (
            a && 'number' != typeof a && o(n, e, a) && (e = a = void 0),
            (n = i(n)),
            void 0 === e ? ((e = n), (n = 0)) : (e = i(e)),
            (a = void 0 === a ? (n < e ? 1 : -1) : i(a)),
            r(n, e, a, t)
          );
        };
      };
    },
    function(t, n) {
      var e = Math.ceil,
        r = Math.max;
      t.exports = function(t, n, o, i) {
        for (var a = -1, u = r(e((n - t) / (o || 1)), 0), s = Array(u); u--; )
          (s[i ? u : ++a] = t), (t += o);
        return s;
      };
    },
    function(t, n) {
      t.exports = function(t) {
        return t;
      };
    },
    function(t, n) {
      t.exports = function(t, n, e) {
        return (
          t == t &&
            (void 0 !== e && (t = t <= e ? t : e),
            void 0 !== n && (t = t >= n ? t : n)),
          t
        );
      };
    },
    function(t, n, e) {
      (function(t) {
        var r;
        !(function(t, o, i) {
          function a(t, n) {
            return (n.c = t.c), (n.s0 = t.s0), (n.s1 = t.s1), (n.s2 = t.s2), n;
          }
          function u(t, n) {
            var e = new (function(t) {
                var n = this,
                  e = (function() {
                    var t = 4022871197;
                    return function(n) {
                      n = n.toString();
                      for (var e = 0; e < n.length; e++) {
                        var r = 0.02519603282416938 * (t += n.charCodeAt(e));
                        (r -= t = r >>> 0),
                          (t = (r *= t) >>> 0),
                          (t += 4294967296 * (r -= t));
                      }
                      return 2.3283064365386963e-10 * (t >>> 0);
                    };
                  })();
                (n.next = function() {
                  var t = 2091639 * n.s0 + 2.3283064365386963e-10 * n.c;
                  return (
                    (n.s0 = n.s1), (n.s1 = n.s2), (n.s2 = t - (n.c = 0 | t))
                  );
                }),
                  (n.c = 1),
                  (n.s0 = e(' ')),
                  (n.s1 = e(' ')),
                  (n.s2 = e(' ')),
                  (n.s0 -= e(t)),
                  n.s0 < 0 && (n.s0 += 1),
                  (n.s1 -= e(t)),
                  n.s1 < 0 && (n.s1 += 1),
                  (n.s2 -= e(t)),
                  n.s2 < 0 && (n.s2 += 1),
                  (e = null);
              })(t),
              r = n && n.state,
              o = e.next;
            return (
              (o.int32 = function() {
                return (4294967296 * e.next()) | 0;
              }),
              (o.double = function() {
                return o() + 1.1102230246251565e-16 * ((2097152 * o()) | 0);
              }),
              (o.quick = o),
              r &&
                ('object' == typeof r && a(r, e),
                (o.state = function() {
                  return a(e, {});
                })),
              o
            );
          }
          o && o.exports
            ? (o.exports = u)
            : e(24) && e(51)
            ? void 0 ===
                (r = function() {
                  return u;
                }.call(n, e, n, o)) || (o.exports = r)
            : (this.alea = u);
        })(0, t, e(24));
      }.call(this, e(68)(t)));
    },
    function(t, n, e) {
      (function(t) {
        var r;
        !(function(t, o, i) {
          function a(t, n) {
            return (n.x = t.x), (n.y = t.y), (n.z = t.z), (n.w = t.w), n;
          }
          function u(t, n) {
            var e = new (function(t) {
                var n = this,
                  e = '';
                (n.x = 0),
                  (n.y = 0),
                  (n.z = 0),
                  (n.w = 0),
                  (n.next = function() {
                    var t = n.x ^ (n.x << 11);
                    return (
                      (n.x = n.y),
                      (n.y = n.z),
                      (n.z = n.w),
                      (n.w ^= (n.w >>> 19) ^ t ^ (t >>> 8))
                    );
                  }),
                  t === (0 | t) ? (n.x = t) : (e += t);
                for (var r = 0; r < e.length + 64; r++)
                  (n.x ^= 0 | e.charCodeAt(r)), n.next();
              })(t),
              r = n && n.state,
              o = function() {
                return (e.next() >>> 0) / 4294967296;
              };
            return (
              (o.double = function() {
                do {
                  var t =
                    ((e.next() >>> 11) + (e.next() >>> 0) / 4294967296) /
                    (1 << 21);
                } while (0 === t);
                return t;
              }),
              (o.int32 = e.next),
              (o.quick = o),
              r &&
                ('object' == typeof r && a(r, e),
                (o.state = function() {
                  return a(e, {});
                })),
              o
            );
          }
          o && o.exports
            ? (o.exports = u)
            : e(24) && e(51)
            ? void 0 ===
                (r = function() {
                  return u;
                }.call(n, e, n, o)) || (o.exports = r)
            : (this.xor128 = u);
        })(0, t, e(24));
      }.call(this, e(68)(t)));
    },
    function(t, n, e) {
      (function(t) {
        var r;
        !(function(t, o, i) {
          function a(t, n) {
            return (
              (n.x = t.x),
              (n.y = t.y),
              (n.z = t.z),
              (n.w = t.w),
              (n.v = t.v),
              (n.d = t.d),
              n
            );
          }
          function u(t, n) {
            var e = new (function(t) {
                var n = this,
                  e = '';
                (n.next = function() {
                  var t = n.x ^ (n.x >>> 2);
                  return (
                    (n.x = n.y),
                    (n.y = n.z),
                    (n.z = n.w),
                    (n.w = n.v),
                    ((n.d = (n.d + 362437) | 0) +
                      (n.v = n.v ^ (n.v << 4) ^ t ^ (t << 1))) |
                      0
                  );
                }),
                  (n.x = 0),
                  (n.y = 0),
                  (n.z = 0),
                  (n.w = 0),
                  (n.v = 0),
                  t === (0 | t) ? (n.x = t) : (e += t);
                for (var r = 0; r < e.length + 64; r++)
                  (n.x ^= 0 | e.charCodeAt(r)),
                    r == e.length && (n.d = (n.x << 10) ^ (n.x >>> 4)),
                    n.next();
              })(t),
              r = n && n.state,
              o = function() {
                return (e.next() >>> 0) / 4294967296;
              };
            return (
              (o.double = function() {
                do {
                  var t =
                    ((e.next() >>> 11) + (e.next() >>> 0) / 4294967296) /
                    (1 << 21);
                } while (0 === t);
                return t;
              }),
              (o.int32 = e.next),
              (o.quick = o),
              r &&
                ('object' == typeof r && a(r, e),
                (o.state = function() {
                  return a(e, {});
                })),
              o
            );
          }
          o && o.exports
            ? (o.exports = u)
            : e(24) && e(51)
            ? void 0 ===
                (r = function() {
                  return u;
                }.call(n, e, n, o)) || (o.exports = r)
            : (this.xorwow = u);
        })(0, t, e(24));
      }.call(this, e(68)(t)));
    },
    function(t, n, e) {
      (function(t) {
        var r;
        !(function(t, o, i) {
          function a(t, n) {
            return (n.x = t.x.slice()), (n.i = t.i), n;
          }
          function u(t, n) {
            null == t && (t = +new Date());
            var e = new (function(t) {
                var n = this;
                (n.next = function() {
                  var t,
                    e,
                    r = n.x,
                    o = n.i;
                  return (
                    (t = r[o]),
                    (e = (t ^= t >>> 7) ^ (t << 24)),
                    (e ^= (t = r[(o + 1) & 7]) ^ (t >>> 10)),
                    (e ^= (t = r[(o + 3) & 7]) ^ (t >>> 3)),
                    (e ^= (t = r[(o + 4) & 7]) ^ (t << 7)),
                    (t = r[(o + 7) & 7]),
                    (e ^= (t ^= t << 13) ^ (t << 9)),
                    (r[o] = e),
                    (n.i = (o + 1) & 7),
                    e
                  );
                }),
                  (function(t, n) {
                    var e,
                      r = [];
                    if (n === (0 | n)) r[0] = n;
                    else
                      for (n = '' + n, e = 0; e < n.length; ++e)
                        r[7 & e] =
                          (r[7 & e] << 15) ^
                          ((n.charCodeAt(e) + r[(e + 1) & 7]) << 13);
                    for (; r.length < 8; ) r.push(0);
                    for (e = 0; e < 8 && 0 === r[e]; ++e);
                    for (
                      8 == e ? (r[7] = -1) : r[e], t.x = r, t.i = 0, e = 256;
                      e > 0;
                      --e
                    )
                      t.next();
                  })(n, t);
              })(t),
              r = n && n.state,
              o = function() {
                return (e.next() >>> 0) / 4294967296;
              };
            return (
              (o.double = function() {
                do {
                  var t =
                    ((e.next() >>> 11) + (e.next() >>> 0) / 4294967296) /
                    (1 << 21);
                } while (0 === t);
                return t;
              }),
              (o.int32 = e.next),
              (o.quick = o),
              r &&
                (r.x && a(r, e),
                (o.state = function() {
                  return a(e, {});
                })),
              o
            );
          }
          o && o.exports
            ? (o.exports = u)
            : e(24) && e(51)
            ? void 0 ===
                (r = function() {
                  return u;
                }.call(n, e, n, o)) || (o.exports = r)
            : (this.xorshift7 = u);
        })(0, t, e(24));
      }.call(this, e(68)(t)));
    },
    function(t, n, e) {
      (function(t) {
        var r;
        !(function(t, o, i) {
          function a(t, n) {
            return (n.i = t.i), (n.w = t.w), (n.X = t.X.slice()), n;
          }
          function u(t, n) {
            null == t && (t = +new Date());
            var e = new (function(t) {
                var n = this;
                (n.next = function() {
                  var t,
                    e,
                    r = n.w,
                    o = n.X,
                    i = n.i;
                  return (
                    (n.w = r = (r + 1640531527) | 0),
                    (e = o[(i + 34) & 127]),
                    (t = o[(i = (i + 1) & 127)]),
                    (e ^= e << 13),
                    (t ^= t << 17),
                    (e ^= e >>> 15),
                    (t ^= t >>> 12),
                    (e = o[i] = e ^ t),
                    (n.i = i),
                    (e + (r ^ (r >>> 16))) | 0
                  );
                }),
                  (function(t, n) {
                    var e,
                      r,
                      o,
                      i,
                      a,
                      u = [],
                      s = 128;
                    for (
                      n === (0 | n)
                        ? ((r = n), (n = null))
                        : ((n += '\0'), (r = 0), (s = Math.max(s, n.length))),
                        o = 0,
                        i = -32;
                      i < s;
                      ++i
                    )
                      n && (r ^= n.charCodeAt((i + 32) % n.length)),
                        0 === i && (a = r),
                        (r ^= r << 10),
                        (r ^= r >>> 15),
                        (r ^= r << 4),
                        (r ^= r >>> 13),
                        i >= 0 &&
                          ((a = (a + 1640531527) | 0),
                          (o = 0 == (e = u[127 & i] ^= r + a) ? o + 1 : 0));
                    for (
                      o >= 128 && (u[127 & ((n && n.length) || 0)] = -1),
                        o = 127,
                        i = 512;
                      i > 0;
                      --i
                    )
                      (r = u[(o + 34) & 127]),
                        (e = u[(o = (o + 1) & 127)]),
                        (r ^= r << 13),
                        (e ^= e << 17),
                        (r ^= r >>> 15),
                        (e ^= e >>> 12),
                        (u[o] = r ^ e);
                    (t.w = a), (t.X = u), (t.i = o);
                  })(n, t);
              })(t),
              r = n && n.state,
              o = function() {
                return (e.next() >>> 0) / 4294967296;
              };
            return (
              (o.double = function() {
                do {
                  var t =
                    ((e.next() >>> 11) + (e.next() >>> 0) / 4294967296) /
                    (1 << 21);
                } while (0 === t);
                return t;
              }),
              (o.int32 = e.next),
              (o.quick = o),
              r &&
                (r.X && a(r, e),
                (o.state = function() {
                  return a(e, {});
                })),
              o
            );
          }
          o && o.exports
            ? (o.exports = u)
            : e(24) && e(51)
            ? void 0 ===
                (r = function() {
                  return u;
                }.call(n, e, n, o)) || (o.exports = r)
            : (this.xor4096 = u);
        })(0, t, e(24));
      }.call(this, e(68)(t)));
    },
    function(t, n, e) {
      (function(t) {
        var r;
        !(function(t, o, i) {
          function a(t, n) {
            return (n.a = t.a), (n.b = t.b), (n.c = t.c), (n.d = t.d), n;
          }
          function u(t, n) {
            var e = new (function(t) {
                var n = this,
                  e = '';
                (n.next = function() {
                  var t = n.b,
                    e = n.c,
                    r = n.d,
                    o = n.a;
                  return (
                    (t = (t << 25) ^ (t >>> 7) ^ e),
                    (e = (e - r) | 0),
                    (r = (r << 24) ^ (r >>> 8) ^ o),
                    (o = (o - t) | 0),
                    (n.b = t = (t << 20) ^ (t >>> 12) ^ e),
                    (n.c = e = (e - r) | 0),
                    (n.d = (r << 16) ^ (e >>> 16) ^ o),
                    (n.a = (o - t) | 0)
                  );
                }),
                  (n.a = 0),
                  (n.b = 0),
                  (n.c = -1640531527),
                  (n.d = 1367130551),
                  t === Math.floor(t)
                    ? ((n.a = (t / 4294967296) | 0), (n.b = 0 | t))
                    : (e += t);
                for (var r = 0; r < e.length + 20; r++)
                  (n.b ^= 0 | e.charCodeAt(r)), n.next();
              })(t),
              r = n && n.state,
              o = function() {
                return (e.next() >>> 0) / 4294967296;
              };
            return (
              (o.double = function() {
                do {
                  var t =
                    ((e.next() >>> 11) + (e.next() >>> 0) / 4294967296) /
                    (1 << 21);
                } while (0 === t);
                return t;
              }),
              (o.int32 = e.next),
              (o.quick = o),
              r &&
                ('object' == typeof r && a(r, e),
                (o.state = function() {
                  return a(e, {});
                })),
              o
            );
          }
          o && o.exports
            ? (o.exports = u)
            : e(24) && e(51)
            ? void 0 ===
                (r = function() {
                  return u;
                }.call(n, e, n, o)) || (o.exports = r)
            : (this.tychei = u);
        })(0, t, e(24));
      }.call(this, e(68)(t)));
    },
    function(t, n, e) {
      var r;
      !(function(o, i) {
        var a,
          u = (0, eval)('this'),
          s = 256,
          c = 6,
          f = 'random',
          l = i.pow(s, c),
          p = i.pow(2, 52),
          h = 2 * p,
          d = s - 1;
        function v(t, n, e) {
          var r = [],
            v = g(
              (function t(n, e) {
                var r,
                  o = [],
                  i = typeof n;
                if (e && 'object' == i)
                  for (r in n)
                    try {
                      o.push(t(n[r], e - 1));
                    } catch (t) {}
                return o.length ? o : 'string' == i ? n : n + '\0';
              })(
                (n = 1 == n ? { entropy: !0 } : n || {}).entropy
                  ? [t, m(o)]
                  : null == t
                  ? (function() {
                      try {
                        var t;
                        return (
                          a && (t = a.randomBytes)
                            ? (t = t(s))
                            : ((t = new Uint8Array(s)),
                              (u.crypto || u.msCrypto).getRandomValues(t)),
                          m(t)
                        );
                      } catch (t) {
                        var n = u.navigator,
                          e = n && n.plugins;
                        return [+new Date(), u, e, u.screen, m(o)];
                      }
                    })()
                  : t,
                3
              ),
              r
            ),
            b = new (function(t) {
              var n,
                e = t.length,
                r = this,
                o = 0,
                i = (r.i = r.j = 0),
                a = (r.S = []);
              e || (t = [e++]);
              for (; o < s; ) a[o] = o++;
              for (o = 0; o < s; o++)
                (a[o] = a[(i = d & (i + t[o % e] + (n = a[o])))]), (a[i] = n);
              (r.g = function(t) {
                for (var n, e = 0, o = r.i, i = r.j, a = r.S; t--; )
                  (n = a[(o = d & (o + 1))]),
                    (e =
                      e * s +
                      a[d & ((a[o] = a[(i = d & (i + n))]) + (a[i] = n))]);
                return (r.i = o), (r.j = i), e;
              })(s);
            })(r),
            w = function() {
              for (var t = b.g(c), n = l, e = 0; t < p; )
                (t = (t + e) * s), (n *= s), (e = b.g(1));
              for (; t >= h; ) (t /= 2), (n /= 2), (e >>>= 1);
              return (t + e) / n;
            };
          return (
            (w.int32 = function() {
              return 0 | b.g(4);
            }),
            (w.quick = function() {
              return b.g(4) / 4294967296;
            }),
            (w.double = w),
            g(m(b.S), o),
            (n.pass ||
              e ||
              function(t, n, e, r) {
                return (
                  r &&
                    (r.S && y(r, b),
                    (t.state = function() {
                      return y(b, {});
                    })),
                  e ? ((i[f] = t), n) : t
                );
              })(w, v, 'global' in n ? n.global : this == i, n.state)
          );
        }
        function y(t, n) {
          return (n.i = t.i), (n.j = t.j), (n.S = t.S.slice()), n;
        }
        function g(t, n) {
          for (var e, r = t + '', o = 0; o < r.length; )
            n[d & o] = d & ((e ^= 19 * n[d & o]) + r.charCodeAt(o++));
          return m(n);
        }
        function m(t) {
          return String.fromCharCode.apply(0, t);
        }
        if (((i['seed' + f] = v), g(i.random(), o), t.exports)) {
          t.exports = v;
          try {
            a = e(488);
          } catch (t) {}
        } else
          void 0 ===
            (r = function() {
              return v;
            }.call(n, e, n, t)) || (t.exports = r);
      })([], Math);
    },
    function(t, n) {},
    function(t, n, e) {
      var r = e(67),
        o = e(231),
        i = e(109),
        a = o(function(t, n, e, o) {
          r(n, i(n), t, o);
        });
      t.exports = a;
    },
    function(t, n, e) {
      var r = e(225),
        o = e(77),
        i = e(232),
        a = o(function(t, n) {
          try {
            return r(t, void 0, n);
          } catch (t) {
            return i(t) ? t : new Error(t);
          }
        });
      t.exports = a;
    },
    function(t, n, e) {
      var r = e(69);
      t.exports = function(t, n) {
        return r(n, function(n) {
          return t[n];
        });
      };
    },
    function(t, n, e) {
      var r = e(108),
        o = Object.prototype,
        i = o.hasOwnProperty;
      t.exports = function(t, n, e, a) {
        return void 0 === t || (r(t, o[e]) && !i.call(a, e)) ? n : t;
      };
    },
    function(t, n) {
      var e = {
        '\\': '\\',
        "'": "'",
        '\n': 'n',
        '\r': 'r',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
      };
      t.exports = function(t) {
        return '\\' + e[t];
      };
    },
    function(t, n, e) {
      var r = e(495),
        o = {
          escape: e(498),
          evaluate: e(499),
          interpolate: e(233),
          variable: '',
          imports: { _: { escape: r } }
        };
      t.exports = o;
    },
    function(t, n, e) {
      var r = e(496),
        o = e(157),
        i = /[&<>"']/g,
        a = RegExp(i.source);
      t.exports = function(t) {
        return (t = o(t)) && a.test(t) ? t.replace(i, r) : t;
      };
    },
    function(t, n, e) {
      var r = e(497)({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      });
      t.exports = r;
    },
    function(t, n) {
      t.exports = function(t) {
        return function(n) {
          return null == t ? void 0 : t[n];
        };
      };
    },
    function(t, n) {
      t.exports = /<%-([\s\S]+?)%>/g;
    },
    function(t, n) {
      t.exports = /<%([\s\S]+?)%>/g;
    },
    function(t, n, e) {
      var r = e(501),
        o = NaN;
      t.exports = function(t, n) {
        var e = null == t ? 0 : t.length;
        return e ? r(t, n) / e : o;
      };
    },
    function(t, n) {
      t.exports = function(t, n) {
        for (var e, r = -1, o = t.length; ++r < o; ) {
          var i = n(t[r]);
          void 0 !== i && (e = void 0 === e ? i : e + i);
        }
        return e;
      };
    },
    function(t, n, e) {
      'use strict';
      e.r(n);
      e(252),
        e(20),
        e(44),
        e(42),
        e(17),
        e(15),
        e(29),
        e(59),
        e(93),
        e(19),
        e(84),
        e(83),
        e(186),
        e(14),
        e(72),
        e(13),
        e(145),
        e(60),
        e(11),
        e(34),
        e(7),
        e(16),
        e(58),
        e(147),
        e(149),
        e(148),
        e(36),
        e(6),
        e(47),
        e(173);
      var r = e(234),
        o = e.n(r),
        i = e(235),
        a = e.n(i),
        u = (e(192), e(188), e(185), e(63), e(205), e(62), e(236)),
        s = e.n(u),
        c = e(237),
        f = e.n(c),
        l = e(116),
        p = e.n(l),
        h = e(238),
        d = e.n(h),
        v = e(239),
        y = e.n(v),
        g = e(240),
        m = e.n(g),
        b = e(85),
        w = e.n(b),
        x = e(117),
        O = e.n(x),
        S = e(37),
        _ = e.n(S),
        j = e(241),
        k = e(78),
        E = e.n(k),
        P = e(242),
        A = e.n(P);
      function T(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var R = (function() {
        function t(n) {
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, t),
            (this.plugins = []),
            (this.context = n);
        }
        return (
          (function(t, n, e) {
            n && T(t.prototype, n), e && T(t, e);
          })(t, [
            {
              key: 'add',
              value: function(t) {
                this.plugins.push(t), t.handle(this.context, 'plugin:init');
              }
            },
            {
              key: 'remove',
              value: function(t) {
                t.handle(this.context, 'plugin:removal'),
                  (this.plugins = A()(this.plugins, t));
              }
            },
            {
              key: 'trigger',
              value: function(t) {
                for (
                  var n = this,
                    e = arguments.length,
                    r = new Array(e > 1 ? e - 1 : 0),
                    o = 1;
                  o < e;
                  o++
                )
                  r[o - 1] = arguments[o];
                return Promise.all(
                  this.plugins.map(function(e) {
                    return e.handle.apply(e, [n.context, t].concat(r));
                  })
                );
              }
            }
          ]),
          t
        );
      })();
      function M(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function F(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              M(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              M(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      function C(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      function I(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var L = (function() {
        function t() {
          var n = this,
            e =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : {};
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, t),
            (this.internals = {
              callbacks: {},
              rawOptions: (function(t) {
                for (var n = 1; n < arguments.length; n++) {
                  var e = null != arguments[n] ? arguments[n] : {},
                    r = Object.keys(e);
                  'function' == typeof Object.getOwnPropertySymbols &&
                    (r = r.concat(
                      Object.getOwnPropertySymbols(e).filter(function(t) {
                        return Object.getOwnPropertyDescriptor(e, t).enumerable;
                      })
                    )),
                    r.forEach(function(n) {
                      C(t, n, e[n]);
                    });
                }
                return t;
              })({ debug: !1, plugins: [] }, e),
              parsedOptions: {}
            }),
            (this.plugins = new R(this)),
            this.internals.rawOptions.plugins.map(function(t) {
              return n.plugins.add(t);
            });
        }
        return (
          (function(t, n, e) {
            n && I(t.prototype, n), e && I(t, e);
          })(t, [
            {
              key: 'on',
              value: function(t, n) {
                return (
                  (n.displayName =
                    n.displayName ||
                    ''
                      .concat(t, ' handler on ')
                      .concat(this.internals.rawOptions.title)),
                  (this.internals.callbacks['$'.concat(t)] =
                    this.internals.callbacks['$'.concat(t)] || []),
                  this.internals.callbacks['$'.concat(t)].push(n),
                  this
                );
              }
            },
            {
              key: 'off',
              value: function(t) {
                var n =
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : null;
                return (
                  null === n
                    ? delete this.internals.callbacks['$'.concat(t)]
                    : (this.internals.callbacks[
                        '$'.concat(t)
                      ] = this.internals.callbacks['$'.concat(t)].filter(
                        function(t) {
                          return t !== n;
                        }
                      )),
                  this
                );
              }
            },
            {
              key: 'once',
              value: function(t, n) {
                function e() {
                  this.off(t, e);
                  for (
                    var r = arguments.length, o = new Array(r), i = 0;
                    i < r;
                    i++
                  )
                    o[i] = arguments[i];
                  return n.apply(this, o);
                }
                return (e.fn = n), this.on(t, e), this;
              }
            },
            {
              key: 'waitFor',
              value: function(t) {
                var n = this;
                return new Promise(function(e) {
                  return n.on(t, e);
                });
              }
            },
            {
              key: 'trigger',
              value: (function() {
                var t = F(
                  regeneratorRuntime.mark(function t(n) {
                    var e,
                      r,
                      o,
                      i,
                      a,
                      u = this,
                      s = arguments;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              for (
                                r = s.length,
                                  o = new Array(r > 1 ? r - 1 : 0),
                                  i = 1;
                                i < r;
                                i++
                              )
                                o[i - 1] = s[i];
                              if (
                                !(a = this.internals.callbacks['$'.concat(n)])
                              ) {
                                t.next = 12;
                                break;
                              }
                              return (
                                (t.prev = 3),
                                (t.next = 6),
                                Promise.all(
                                  a.map(function(t) {
                                    return t.apply(u, o);
                                  })
                                )
                              );
                            case 6:
                              t.next = 12;
                              break;
                            case 8:
                              throw ((t.prev = 8),
                              (t.t0 = t.catch(3)),
                              console.error(
                                '%cError in '.concat(
                                  this.internals.rawOptions.title,
                                  '%c '
                                ) +
                                  'during event '
                                    .concat(n, '%c: ')
                                    .concat(t.t0),
                                'font-weight: bold',
                                'font-weight: normal',
                                'font-weight: normal; opacity: 0.5'
                              ),
                              t.t0);
                            case 12:
                              return (
                                (t.next = 14),
                                (e = this.plugins).trigger.apply(
                                  e,
                                  [n].concat(o)
                                )
                              );
                            case 14:
                              return t.abrupt('return', this);
                            case 15:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this,
                      [[3, 8]]
                    );
                  })
                );
                return function(n) {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'triggerMethod',
              value: (function() {
                var t = F(
                  regeneratorRuntime.mark(function t(n) {
                    var e,
                      r,
                      o,
                      i,
                      a,
                      u,
                      s,
                      c,
                      f = arguments;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              for (
                                a = function(t, n, e) {
                                  return e.toUpperCase();
                                },
                                  e = f.length,
                                  r = new Array(e > 1 ? e - 1 : 0),
                                  o = 1;
                                o < e;
                                o++
                              )
                                r[o - 1] = f[o];
                              if (
                                (this.internals.rawOptions.debug &&
                                  (console.info(
                                    '%c'
                                      .concat(
                                        this.internals.rawOptions.title,
                                        '%c ('
                                      )
                                      .concat(this.type, ') → ') +
                                      'Event %c'
                                        .concat(n, '%c · arguments [')
                                        .concat(r, ']'),
                                    'font-weight: bold',
                                    'font-weight: normal',
                                    'font-weight: bold',
                                    'font-weight: normal; opacity: 0.5'
                                  ),
                                  console.time(
                                    ''
                                      .concat(n, ' on ')
                                      .concat(this.internals.rawOptions.title) +
                                      '('.concat(
                                        this.internals.rawOptions.id,
                                        ')'
                                      )
                                  )),
                                (i = /(^|:)(\w)/gi),
                                (u = 'on'.concat(n.replace(i, a))),
                                (s = this[u]),
                                !E()(s))
                              ) {
                                t.next = 10;
                                break;
                              }
                              return (t.next = 9), s.apply(this, r);
                            case 9:
                              c = t.sent;
                            case 10:
                              return (
                                (t.next = 12),
                                this.trigger.apply(this, [n].concat(r))
                              );
                            case 12:
                              return (
                                this.internals.rawOptions.debug &&
                                  console.timeEnd(
                                    ''
                                      .concat(n, ' on ')
                                      .concat(this.internals.rawOptions.title) +
                                      '('.concat(
                                        this.internals.rawOptions.id,
                                        ')'
                                      )
                                  ),
                                t.abrupt('return', c)
                              );
                            case 14:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function(n) {
                  return t.apply(this, arguments);
                };
              })()
            }
          ]),
          t
        );
      })();
      function N(t) {
        for (var n = 1; n < arguments.length; n++) {
          var e = null != arguments[n] ? arguments[n] : {},
            r = Object.keys(e);
          'function' == typeof Object.getOwnPropertySymbols &&
            (r = r.concat(
              Object.getOwnPropertySymbols(e).filter(function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable;
              })
            )),
            r.forEach(function(n) {
              V(t, n, e[n]);
            });
        }
        return t;
      }
      function D(t) {
        return (D =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      function B(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      function U(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function z(t) {
        return (z = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(t) {
              return t.__proto__ || Object.getPrototypeOf(t);
            })(t);
      }
      function q(t, n) {
        return (q =
          Object.setPrototypeOf ||
          function(t, n) {
            return (t.__proto__ = n), t;
          })(t, n);
      }
      function G(t) {
        if (void 0 === t)
          throw new ReferenceError(
            "this hasn't been initialised - super() hasn't been called"
          );
        return t;
      }
      function V(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      var W = ['id', 'participant', 'participant_id'],
        H = W.concat([
          'sender',
          'sender_type',
          'sender_id',
          'timestamp',
          'meta'
        ]),
        $ = function(t) {
          return (
            _()(t) && (t = JSON.stringify(t)),
            'string' == typeof t &&
              ((t = t.replace(/"/g, '""')),
              /[,"\n]+/.test(t) && (t = '"'.concat(t, '"'))),
            t
          );
        },
        J = function(t) {
          return t.toString().padStart(2, '0');
        },
        Y = function(t) {
          return t.map(function(t) {
            return f()(t, function(t, n) {
              return n.startsWith('_');
            });
          });
        },
        X = (function(t) {
          function n() {
            var t,
              e =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {};
            !(function(t, n) {
              if (!(t instanceof n))
                throw new TypeError('Cannot call a class as a function');
            })(this, n),
              V(
                G(
                  G(
                    (t = (function(t, n) {
                      return !n || ('object' !== D(n) && 'function' != typeof n)
                        ? G(t)
                        : n;
                    })(this, z(n).call(this, e)))
                  )
                ),
                'stateProxy',
                void 0
              ),
              V(G(G(t)), '_debouncedTransmit', s()(t.transmit, 2500)),
              V(G(G(t)), '_lastIncrementalTransmission', 0),
              'session' === e.persistence
                ? (t.storage = sessionStorage)
                : 'local' === e.persistence
                ? (t.storage = localStorage)
                : (t.storage = null),
              e.clearPersistence && t.clear();
            var r = !0;
            if (t.storage) {
              var o = t.storage.getItem('lab.js-data');
              if (o)
                try {
                  (t.data = JSON.parse(o)),
                    (t.state = Object.assign.apply(
                      Object,
                      [{}].concat(B(t.data))
                    )),
                    H.forEach(function(n) {
                      Object.hasOwnProperty.call(t.state, n) &&
                        delete t.state[n];
                    }),
                    (r = !1);
                } catch (t) {
                  r = !0;
                }
            }
            return r && ((t.data = []), (t.state = {})), (t.staging = {}), t;
          }
          return (
            (function(t, n) {
              if ('function' != typeof n && null !== n)
                throw new TypeError(
                  'Super expression must either be null or a function'
                );
              (t.prototype = Object.create(n && n.prototype, {
                constructor: { value: t, writable: !0, configurable: !0 }
              })),
                n && q(t, n);
            })(n, L),
            (function(t, n, e) {
              n && U(t.prototype, n), e && U(t, e);
            })(n, [
              {
                key: 'set',
                value: function(t, n) {
                  var e =
                      arguments.length > 2 &&
                      void 0 !== arguments[2] &&
                      arguments[2],
                    r = {};
                  'object' === D(t) ? (r = t) : (r[t] = n),
                    (this.state = Object.assign(this.state, r)),
                    (this.staging = Object.assign(this.staging, r)),
                    e || this.triggerMethod('set');
                }
              },
              {
                key: 'get',
                value: function(t) {
                  return this.state[t];
                }
              },
              {
                key: 'commit',
                value: function() {
                  var t =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : {},
                    n = arguments.length > 1 ? arguments[1] : void 0;
                  this.set(t, n, !0);
                  var e = this.data.push(O()(this.staging)) - 1;
                  return (
                    this.storage &&
                      this.storage.setItem(
                        'lab.js-data',
                        JSON.stringify(this.data)
                      ),
                    this.triggerMethod('commit'),
                    (this.staging = {}),
                    e
                  );
                }
              },
              {
                key: 'update',
                value: function(t) {
                  var n =
                    arguments.length > 1 && void 0 !== arguments[1]
                      ? arguments[1]
                      : function(t) {
                          return t;
                        };
                  (this.data[t] = n(this.data[t] || {})),
                    this.triggerMethod('update');
                }
              },
              {
                key: 'clear',
                value: function() {
                  var t =
                      !(arguments.length > 0 && void 0 !== arguments[0]) ||
                      arguments[0],
                    n =
                      arguments.length > 1 &&
                      void 0 !== arguments[1] &&
                      arguments[1];
                  this.triggerMethod('clear'),
                    t && this.storage && this.storage.clear(),
                    n &&
                      ((this.data = []),
                      (this.staging = {}),
                      (this.state = {}));
                }
              },
              {
                key: 'keys',
                value: function() {
                  var t =
                      arguments.length > 0 &&
                      void 0 !== arguments[0] &&
                      arguments[0],
                    n =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : H,
                    e = this.data.map(function(t) {
                      return Object.keys(t);
                    });
                  t && e.push(Object.keys(this.state)),
                    (e = w()(e)),
                    e.sort(),
                    (e = d()(e, !0).sort());
                  var r = y()(n, e),
                    o = m()(e, r);
                  return r.concat(o);
                }
              },
              {
                key: 'extract',
                value: function(t) {
                  var n =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : RegExp('.*'),
                    e = 'string' == typeof n ? RegExp('^'.concat(n, '$')) : n;
                  return this.data
                    .filter(function(t) {
                      return e.test(t.sender);
                    })
                    .map(function(n) {
                      return n[t];
                    });
                }
              },
              {
                key: 'select',
                value: function(t) {
                  var n,
                    e =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : RegExp('.*');
                  if (
                    ((n =
                      'function' == typeof t
                        ? this.keys().filter(t)
                        : 'string' == typeof t
                        ? [t]
                        : t),
                    !Array.isArray(n))
                  )
                    throw new Error(
                      'The input parameter should be either an array of strings, a string, or a filter function.'
                    );
                  var r = 'string' == typeof e ? RegExp('^'.concat(e, '$')) : e;
                  return this.data
                    .filter(function(t) {
                      return r.test(t.sender);
                    })
                    .map(function(t) {
                      return p()(t, n);
                    });
                }
              },
              {
                key: 'exportJson',
                value: function() {
                  var t =
                    !(arguments.length > 0 && void 0 !== arguments[0]) ||
                    arguments[0]
                      ? this.cleanData
                      : this.data;
                  return JSON.stringify(t);
                }
              },
              {
                key: 'exportJsonL',
                value: function() {
                  return (!(arguments.length > 0 && void 0 !== arguments[0]) ||
                  arguments[0]
                    ? this.cleanData
                    : this.data
                  )
                    .map(function(t) {
                      return JSON.stringify(t);
                    })
                    .join('\n');
                }
              },
              {
                key: 'exportCsv',
                value: function() {
                  var t =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : ',',
                    n =
                      !(arguments.length > 1 && void 0 !== arguments[1]) ||
                      arguments[1],
                    e = n ? this.cleanData : this.data,
                    r = this.keys().filter(function(t) {
                      return !n || !t.startsWith('_');
                    }),
                    o = e.map(function(n) {
                      return r
                        .map(function(t) {
                          return Object.hasOwnProperty.call(n, t) ? n[t] : null;
                        })
                        .map($)
                        .join(t);
                    });
                  return o.unshift(r.join(t)), o.join('\r\n');
                }
              },
              {
                key: 'exportBlob',
                value: function() {
                  var t = '';
                  return (
                    (t =
                      'json' ===
                      (arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : 'csv')
                        ? this.exportJson()
                        : this.exportCsv()),
                    new Blob([t], { type: 'octet/stream' })
                  );
                }
              },
              {
                key: 'makeFilename',
                value: function() {
                  var t =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : 'study',
                    n =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : 'csv',
                    e = this.id;
                  return (
                    t +
                    '--' +
                    (e ? ''.concat(e, '--') : '') +
                    (function() {
                      var t =
                        arguments.length > 0 && void 0 !== arguments[0]
                          ? arguments[0]
                          : new Date();
                      return (
                        ''.concat(t.getFullYear(), '-') +
                        ''.concat(J((t.getMonth() + 1).toString()), '-') +
                        ''.concat(J(t.getDate().toString()), '--') +
                        ''.concat(t.toTimeString().split(' ')[0])
                      );
                    })() +
                    (n ? '.'.concat(n) : '')
                  );
                }
              },
              {
                key: 'download',
                value: function() {
                  var t =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : 'csv',
                    n =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : 'data.csv';
                  return Object(j.saveAs)(this.exportBlob(t), n);
                }
              },
              {
                key: 'show',
                value: function() {
                  return console.table(this.data, this.keys());
                }
              },
              {
                key: 'transmit',
                value: function(t) {
                  var n,
                    e =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : {},
                    r =
                      arguments.length > 2 && void 0 !== arguments[2]
                        ? arguments[2]
                        : {},
                    o = r.headers,
                    i = void 0 === o ? {} : o,
                    a = r.incremental,
                    u = void 0 !== a && a,
                    s = r.encoding,
                    c = void 0 === s ? 'json' : s;
                  this.triggerMethod('transmit'),
                    u
                      ? ((n = this._lastIncrementalTransmission),
                        (this._lastIncrementalTransmission = this.data.length))
                      : (n = 0);
                  var f,
                    l = Y(this.data.slice(n)),
                    p = {};
                  return (
                    'form' === c
                      ? ((f = new FormData()).append(
                          'metadata',
                          JSON.stringify(N({ slice: n }, e))
                        ),
                        f.append('url', window.location.href),
                        f.append('data', JSON.stringify(l)))
                      : ((f = JSON.stringify({
                          metadata: N({ slice: n }, e),
                          url: window.location.href,
                          data: l
                        })),
                        (p = {
                          Accept: 'application/json',
                          'Content-Type': 'application/json'
                        })),
                    fetch(t, {
                      method: 'post',
                      headers: N({}, p, i),
                      body: f,
                      credentials: 'include'
                    })
                  );
                }
              },
              {
                key: 'queueIncrementalTransmission',
                value: function(t, n, e) {
                  this._debouncedTransmit(t, n, N({ incremental: !0 }, e));
                }
              },
              {
                key: 'flushIncrementalTransmissionQueue',
                value: function() {
                  this._debouncedTransmit.flush();
                }
              },
              {
                key: 'cancelIncrementalTransmissionQueue',
                value: function() {
                  this._debouncedTransmit.cancel();
                }
              },
              {
                key: 'cleanData',
                get: function() {
                  return Y(this.data);
                }
              },
              {
                key: 'id',
                get: function() {
                  for (var t = 0; t < W.length; t++) {
                    var n = W[t];
                    if (Object.keys(this.state).includes(n))
                      return this.state[n];
                  }
                }
              }
            ]),
            n
          );
        })(),
        K = e(118),
        Q = e.n(K),
        Z = e(243),
        tt = e.n(Z);
      e(102), e(103);
      function nt(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      var et = function(t) {
          return arguments.length > 1 &&
            void 0 !== arguments[1] &&
            arguments[1] &&
            'getOutputTimestamp' in t
            ? (function(t) {
                for (var n = 1; n < arguments.length; n++) {
                  var e = null != arguments[n] ? arguments[n] : {},
                    r = Object.keys(e);
                  'function' == typeof Object.getOwnPropertySymbols &&
                    (r = r.concat(
                      Object.getOwnPropertySymbols(e).filter(function(t) {
                        return Object.getOwnPropertyDescriptor(e, t).enumerable;
                      })
                    )),
                    r.forEach(function(n) {
                      nt(t, n, e[n]);
                    });
                }
                return t;
              })({}, t.getOutputTimestamp(), {
                baseLatency: t.baseLatency || 0
              })
            : {
                contextTime: t.currentTime,
                performanceTime: performance.now(),
                baseLatency: t.baseLatency || 0
              };
        },
        rt = (e(82), e(166)),
        ot = e.n(rt),
        it = new ot.a().getBrowser().name,
        at = parseInt(new ot.a().getBrowser().version.split('.')[0], 10);
      function ut(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      function st(t, n) {
        if (!(t instanceof n))
          throw new TypeError('Cannot call a class as a function');
      }
      function ct(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function ft(t, n, e) {
        return n && ct(t.prototype, n), e && ct(t, e), t;
      }
      var lt = { frameInterval: 16.68 },
        pt = 'Firefox' === it && at < 54,
        ht = function(t) {
          return t && !pt && t < performance.timing.navigationStart
            ? t
            : performance.now();
        },
        dt = window.requestIdleCallback
          ? window.requestIdleCallback
          : function(t) {
              return window.setTimeout(t);
            },
        vt = (function() {
          function t(n, e) {
            st(this, t), (this.f = n), (this.delay = e);
            for (
              var r = arguments.length, o = new Array(r > 2 ? r - 2 : 0), i = 2;
              i < r;
              i++
            )
              o[i - 2] = arguments[i];
            (this.params = o),
              (this._running = !1),
              (this._timeoutHandle = null);
          }
          return (
            ft(t, [
              {
                key: 'run',
                value: function() {
                  var t;
                  this._running
                    ? console.log('Cannot restart previously run timer')
                    : ((this._timeoutHandle = (t = window).setTimeout.apply(
                        t,
                        [this.f, this.delay].concat(ut(this.params))
                      )),
                      (this._running = !0));
                }
              },
              {
                key: 'cancel',
                value: function() {
                  window.clearTimeout(this._timeoutHandle);
                }
              }
            ]),
            t
          );
        })(),
        yt = { overshoot: 1, closest: 1.5, undershoot: 2 },
        gt = (function() {
          function t(n, e) {
            st(this, t), (this.delay = e), (this.f = n);
            for (
              var r = arguments.length, o = new Array(r > 2 ? r - 2 : 0), i = 2;
              i < r;
              i++
            )
              o[i - 2] = arguments[i];
            (this.params = o),
              (this._running = !1),
              (this._timeoutHandle = void 0),
              (this._animationFrameHandle = void 0),
              (this._lastAnimationFrame = void 0),
              (this.targetTime = void 0),
              (this.mode = 'closest'),
              (this.tick = this.tick.bind(this));
          }
          return (
            ft(t, [
              {
                key: 'tick',
                value: function() {
                  var t = this,
                    n =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : performance.now(),
                    e =
                      arguments.length > 1 &&
                      void 0 !== arguments[1] &&
                      arguments[1],
                    r = n - this._lastAnimationFrame || lt.frameInterval;
                  r < lt.frameInterval && (lt.frameInterval = r),
                    (this.targetTime - n) / r <= yt[this.mode]
                      ? this.f.apply(this, [n].concat(ut(this.params)))
                      : this.targetTime - n < 200
                      ? ((this._animationFrameHandle = window.requestAnimationFrame(
                          function(n) {
                            return t.tick(n, !0);
                          }
                        )),
                        e && (this._lastAnimationFrame = n))
                      : (this._timeoutHandle = window.setTimeout(
                          this.tick,
                          (this.targetTime - n - 100) / 2
                        ));
                }
              },
              {
                key: 'run',
                value: function() {
                  var t =
                    arguments.length > 0 && void 0 !== arguments[0]
                      ? arguments[0]
                      : performance.now();
                  this._running
                    ? console.log('Cannot restart previously run timer')
                    : ((this.targetTime = this.targetTime || t + this.delay),
                      this.tick(),
                      (this._running = !0));
                }
              },
              {
                key: 'cancel',
                value: function() {
                  window.clearTimeout(this._timeoutHandle),
                    window.cancelAnimationFrame(this._animationFrameHandle);
                }
              }
            ]),
            t
          );
        })();
      function mt(t) {
        return (mt =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      function bt(t, n) {
        return !n || ('object' !== mt(n) && 'function' != typeof n)
          ? (function(t) {
              if (void 0 === t)
                throw new ReferenceError(
                  "this hasn't been initialised - super() hasn't been called"
                );
              return t;
            })(t)
          : n;
      }
      function wt(t, n, e) {
        return (wt =
          'undefined' != typeof Reflect && Reflect.get
            ? Reflect.get
            : function(t, n, e) {
                var r = (function(t, n) {
                  for (
                    ;
                    !Object.prototype.hasOwnProperty.call(t, n) &&
                    null !== (t = xt(t));

                  );
                  return t;
                })(t, n);
                if (r) {
                  var o = Object.getOwnPropertyDescriptor(r, n);
                  return o.get ? o.get.call(e) : o.value;
                }
              })(t, n, e || t);
      }
      function xt(t) {
        return (xt = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(t) {
              return t.__proto__ || Object.getPrototypeOf(t);
            })(t);
      }
      function Ot(t, n) {
        if ('function' != typeof n && null !== n)
          throw new TypeError(
            'Super expression must either be null or a function'
          );
        (t.prototype = Object.create(n && n.prototype, {
          constructor: { value: t, writable: !0, configurable: !0 }
        })),
          n && St(t, n);
      }
      function St(t, n) {
        return (St =
          Object.setPrototypeOf ||
          function(t, n) {
            return (t.__proto__ = n), t;
          })(t, n);
      }
      function _t(t, n) {
        if (!(t instanceof n))
          throw new TypeError('Cannot call a class as a function');
      }
      function jt(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function kt(t, n, e) {
        return n && jt(t.prototype, n), e && jt(t, e), t;
      }
      function Et(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      function Pt(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      function At(t, n) {
        return (
          (function(t) {
            if (Array.isArray(t)) return t;
          })(t) ||
          (function(t, n) {
            var e = [],
              r = !0,
              o = !1,
              i = void 0;
            try {
              for (
                var a, u = t[Symbol.iterator]();
                !(r = (a = u.next()).done) &&
                (e.push(a.value), !n || e.length !== n);
                r = !0
              );
            } catch (t) {
              (o = !0), (i = t);
            } finally {
              try {
                r || null == u.return || u.return();
              } finally {
                if (o) throw i;
              }
            }
            return e;
          })(t, n) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance'
            );
          })()
        );
      }
      function Tt(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function Rt(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              Tt(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              Tt(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      var Mt = function(t, n) {
          return new Promise(function(e, r) {
            t.decodeAudioData(n, e, r);
          });
        },
        Ft = (function() {
          var t = Rt(
            regeneratorRuntime.mark(function t(n, e, r) {
              var o, i, a;
              return regeneratorRuntime.wrap(
                function(t) {
                  for (;;)
                    switch ((t.prev = t.next)) {
                      case 0:
                        return (t.next = 2), fetch(n, r);
                      case 2:
                        if (!(o = t.sent).ok) {
                          t.next = 21;
                          break;
                        }
                        return (t.next = 6), o.arrayBuffer();
                      case 6:
                        return (
                          (i = t.sent), (t.prev = 7), (t.next = 10), Mt(e, i)
                        );
                      case 10:
                        if ((a = t.sent)) {
                          t.next = 13;
                          break;
                        }
                        throw new Error(
                          'No data available after decoding '.concat(n)
                        );
                      case 13:
                        return t.abrupt('return', a);
                      case 16:
                        throw ((t.prev = 16),
                        (t.t0 = t.catch(7)),
                        new Error('Error decoding audio data from '.concat(n)));
                      case 19:
                        t.next = 22;
                        break;
                      case 21:
                        throw new Error(
                          "Couldn't load audio from ".concat(o.url)
                        );
                      case 22:
                      case 'end':
                        return t.stop();
                    }
                },
                t,
                this,
                [[7, 16]]
              );
            })
          );
          return function(n, e, r) {
            return t.apply(this, arguments);
          };
        })(),
        Ct = function(t, n) {
          var e,
            r =
              arguments.length > 2 && void 0 !== arguments[2]
                ? arguments[2]
                : {},
            o =
              arguments.length > 3 && void 0 !== arguments[3]
                ? arguments[3]
                : {};
          switch (t) {
            case 'oscillator':
              e = n.createOscillator();
              break;
            case 'bufferSource':
              e = n.createBufferSource();
              break;
            default:
              throw new Error("Can't create node of unknown type");
          }
          return (
            Object.entries(r).forEach(function(t) {
              var n = At(t, 2),
                r = n[0],
                o = n[1];
              o && (e[r] = o);
            }),
            Object.entries(o).forEach(function(t) {
              var n = At(t, 2),
                r = n[0],
                o = n[1];
              o && (e[r].value = o);
            }),
            e
          );
        },
        It = (function() {
          function t(n) {
            var e =
                arguments.length > 1 && void 0 !== arguments[1]
                  ? arguments[1]
                  : {},
              r =
                arguments.length > 2 && void 0 !== arguments[2]
                  ? arguments[2]
                  : {};
            _t(this, t),
              Et(this, 'defaultPayload', { panningModel: 'equalpower' }),
              (this.timeline = n),
              (this.options = e),
              (this.payload = (function(t) {
                for (var n = 1; n < arguments.length; n++) {
                  var e = null != arguments[n] ? arguments[n] : {},
                    r = Object.keys(e);
                  'function' == typeof Object.getOwnPropertySymbols &&
                    (r = r.concat(
                      Object.getOwnPropertySymbols(e).filter(function(t) {
                        return Object.getOwnPropertyDescriptor(e, t).enumerable;
                      })
                    )),
                    r.forEach(function(n) {
                      Et(t, n, e[n]);
                    });
                }
                return t;
              })({}, this.defaultPayload, r, {
                gain: void 0 === r.gain ? 1 : r.gain
              })),
              (this.processingChain = []),
              (this.nodeOrder = {});
          }
          return (
            kt(t, [
              {
                key: 'setAudioOrigin',
                value: function() {
                  this.audioSyncOrigin = et(
                    this.timeline.controller.audioContext
                  );
                }
              },
              {
                key: 'schedule',
                value: function(t) {
                  return (function(t, n) {
                    var e = n.contextTime;
                    return (t - n.performanceTime) / 1e3 + e - n.baseLatency;
                  })(t, this.audioSyncOrigin);
                }
              },
              {
                key: 'prepare',
                value: function() {
                  var t = this.timeline.controller.audioContext;
                  if (
                    (this.payload.gain && 1 !== this.payload.gain) ||
                    (this.payload.rampUp && 0 !== this.payload.rampUp) ||
                    (this.payload.rampDown && 0 !== this.payload.rampDown)
                  ) {
                    var n = t.createGain();
                    (n.gain.value = this.payload.rampUp
                      ? 1e-4
                      : this.payload.gain),
                      (this.nodeOrder.gain = this.processingChain.push(n) - 1);
                  }
                  if (this.payload.pan && 0 !== this.payload.pan) {
                    var e = t.createPanner();
                    (e.panningModel = this.payload.panningModel),
                      e.setPosition(
                        this.payload.pan,
                        0,
                        1 - Math.abs(this.payload.pan)
                      ),
                      this.processingChain.push(e);
                  }
                  !(function(t, n, e) {
                    [t].concat(Pt(n), [e]).reduce(function(t, n) {
                      return t.connect(n);
                    });
                  })(this.source, this.processingChain, t.destination);
                }
              },
              {
                key: 'start',
                value: function(t) {
                  var n = this.options.start,
                    e = this.payload.rampUp,
                    r = this.timeline.controller.audioContext;
                  'running' !== r.state &&
                    console.warn(
                      'Sending audio to a context in '.concat(
                        r.state,
                        ' state.'
                      ),
                      'This may result in missing sounds —',
                      'Please make sure that users interact with the page before using audio.'
                    ),
                    this.setAudioOrigin();
                  var o = Math.max(0, this.schedule(t + n));
                  if (e) {
                    var i = this.processingChain[this.nodeOrder.gain].gain,
                      a = this.schedule(t + n + parseFloat(e));
                    i.setValueAtTime(1e-4, o),
                      i.exponentialRampToValueAtTime(this.payload.gain, a);
                  }
                  this.source.start(o);
                }
              },
              {
                key: 'afterStart',
                value: function(t) {
                  var n = this.options.stop,
                    e = this.payload.rampDown;
                  if (n && e) {
                    var r = this.processingChain[this.nodeOrder.gain].gain,
                      o = this.schedule(t + n - parseFloat(e)),
                      i = this.schedule(t + n);
                    r.setValueAtTime(this.payload.gain, o),
                      r.exponentialRampToValueAtTime(1e-4, i);
                  }
                  if (n) {
                    var a = this.schedule(t + n);
                    this.source.stop(a);
                  }
                }
              },
              {
                key: 'end',
                value: function(t, n) {
                  var e = this,
                    r = n || !this.options.stop,
                    o = r ? t : this.timeline.offset + this.options.stop;
                  if (r) {
                    var i = this.schedule(t);
                    this.source.stop(i);
                  }
                  window.setTimeout(function() {
                    return dt(function() {
                      return e.teardown();
                    });
                  }, o - performance.now() + 20);
                }
              },
              {
                key: 'teardown',
                value: function() {
                  this.source.disconnect(),
                    (this.source = void 0),
                    this.processingChain.forEach(function(t) {
                      return t.disconnect();
                    }),
                    (this.processingChain = []),
                    (this.nodeOrder = {});
                }
              }
            ]),
            t
          );
        })(),
        Lt = (function(t) {
          function n() {
            return _t(this, n), bt(this, xt(n).apply(this, arguments));
          }
          return (
            Ot(n, It),
            kt(n, [
              {
                key: 'prepare',
                value: (function() {
                  var t = Rt(
                    regeneratorRuntime.mark(function t() {
                      var e, r, o;
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                if (
                                  ((e = this.timeline.controller.cache),
                                  (r = this.timeline.controller.audioContext),
                                  !e.audio[this.payload.src])
                                ) {
                                  t.next = 6;
                                  break;
                                }
                                (o = e.audio[this.payload.src]), (t.next = 16);
                                break;
                              case 6:
                                return (
                                  (t.prev = 6),
                                  (t.next = 9),
                                  Ft(this.payload.src, r, { mode: 'cors' })
                                );
                              case 9:
                                (o = t.sent),
                                  (e.audio[this.payload.src] =
                                    e.audio[this.payload.src] || o),
                                  (t.next = 16);
                                break;
                              case 13:
                                (t.prev = 13),
                                  (t.t0 = t.catch(6)),
                                  console.warn(
                                    'Audio timeline item missing content, will remain silent.',
                                    'Source: '
                                      .concat(this.payload.src, ', Error: ')
                                      .concat(t.t0.message)
                                  );
                              case 16:
                                (this.source = Ct('bufferSource', r, {
                                  buffer: o
                                })),
                                  wt(xt(n.prototype), 'prepare', this).call(
                                    this
                                  );
                              case 18:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this,
                        [[6, 13]]
                      );
                    })
                  );
                  return function() {
                    return t.apply(this, arguments);
                  };
                })()
              }
            ]),
            n
          );
        })(),
        Nt = (function(t) {
          function n() {
            return _t(this, n), bt(this, xt(n).apply(this, arguments));
          }
          return (
            Ot(n, It),
            kt(n, [
              {
                key: 'prepare',
                value: function() {
                  var t = this.payload,
                    e = t.type,
                    r = t.frequency,
                    o = t.detune;
                  (this.source = Ct(
                    'oscillator',
                    this.timeline.controller.audioContext,
                    { type: e },
                    { frequency: r, detune: o }
                  )),
                    wt(xt(n.prototype), 'prepare', this).call(this);
                }
              }
            ]),
            n
          );
        })();
      function Dt(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function Bt(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              Dt(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              Dt(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      function Ut(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var zt = (function() {
        function t(n) {
          var e =
            arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, t),
            (this.controller = n),
            (this.events = e),
            (this.offset = void 0);
        }
        return (
          (function(t, n, e) {
            n && Ut(t.prototype, n), e && Ut(t, e);
          })(t, [
            {
              key: 'prepare',
              value: (function() {
                var t = Bt(
                  regeneratorRuntime.mark(function t() {
                    var n,
                      e = this;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              return (
                                (n = tt()(this.events, [
                                  function(t) {
                                    return t.start;
                                  },
                                  function(t) {
                                    return t.priority;
                                  }
                                ])),
                                (this.items = n.map(function(t) {
                                  var n = Q()(t, 'payload'),
                                    r = t.payload;
                                  switch (t.type) {
                                    case 'sound':
                                      return new Lt(e, n, r);
                                    case 'oscillator':
                                      return new Nt(e, n, r);
                                    default:
                                      console.warn(
                                        'Unknown event type '.concat(
                                          t.type,
                                          ', skipping'
                                        )
                                      );
                                  }
                                })),
                                (t.next = 4),
                                Promise.all(
                                  this.items.map(function(t) {
                                    return t.prepare();
                                  })
                                )
                              );
                            case 4:
                              return t.abrupt('return', t.sent);
                            case 5:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function() {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'start',
              value: function(t) {
                var n = this;
                this.items.forEach(function(n) {
                  return n.start(t);
                }),
                  (this.offset = t),
                  dt(function() {
                    return n.afterStart();
                  });
              }
            },
            {
              key: 'afterStart',
              value: function() {
                var t = this;
                this.items.forEach(function(n) {
                  return n.afterStart(t.offset);
                });
              }
            },
            {
              key: 'end',
              value: (function() {
                var t = Bt(
                  regeneratorRuntime.mark(function t(n) {
                    var e,
                      r = arguments;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              return (
                                (e = r.length > 1 && void 0 !== r[1] && r[1]),
                                (t.next = 3),
                                Promise.all(
                                  this.items.map(function(t) {
                                    return t.end(n, e);
                                  })
                                )
                              );
                            case 3:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function(n) {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'teardown',
              value: (function() {
                var t = Bt(
                  regeneratorRuntime.mark(function t() {
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function() {
                  return t.apply(this, arguments);
                };
              })()
            }
          ]),
          t
        );
      })();
      e(184), e(130), e(467);
      function qt(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function Gt(t, n) {
        return (
          (function(t) {
            if (Array.isArray(t)) return t;
          })(t) ||
          (function(t, n) {
            var e = [],
              r = !0,
              o = !1,
              i = void 0;
            try {
              for (
                var a, u = t[Symbol.iterator]();
                !(r = (a = u.next()).done) &&
                (e.push(a.value), !n || e.length !== n);
                r = !0
              );
            } catch (t) {
              (o = !0), (i = t);
            } finally {
              try {
                r || null == u.return || u.return();
              } finally {
                if (o) throw i;
              }
            }
            return e;
          })(t, n) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance'
            );
          })()
        );
      }
      var Vt = { Space: ' ' },
        Wt = (function() {
          function t(n) {
            !(function(t, n) {
              if (!(t instanceof n))
                throw new TypeError('Cannot call a class as a function');
            })(this, t),
              (this.el = n.el || document),
              (this.events = n.events || {}),
              (this.parsedEvents = []),
              (this.context = n.context || this),
              (this.startTime = -1 / 0);
          }
          return (
            (function(t, n, e) {
              n && qt(t.prototype, n), e && qt(t, e);
            })(t, [
              {
                key: 'prepare',
                value: function() {
                  var t = this;
                  this.parsedEvents = Object.entries(this.events).map(function(
                    n
                  ) {
                    var e = Gt(n, 2),
                      r = e[0],
                      o = e[1],
                      i = Gt(
                        (function(t) {
                          var n = /^(\w+)\s*([^()]*)$/,
                            e = /^(\w+)\(([\w\s,]+)\)\s*(.*)$/,
                            r = null,
                            o = null,
                            i = null;
                          if (n.test(t)) {
                            var a = Gt(n.exec(t), 3);
                            (r = a[1]), (i = a[2]);
                          } else if (e.test(t)) {
                            var u = Gt(e.exec(t), 4);
                            (r = u[1]),
                              (o = u[2]),
                              (i = u[3]),
                              (o = o.split(',').map(function(t) {
                                return t.trim();
                              }));
                          } else
                            console.log("Can't interpret event string ", t);
                          return [r, o, i];
                        })(r),
                        3
                      ),
                      a = i[0],
                      u = i[1];
                    return [
                      r,
                      a,
                      i[2],
                      (function(t, n, e) {
                        var r = e.filters,
                          o = void 0 === r ? [] : r,
                          i = e.context,
                          a = void 0 === i ? null : i,
                          u = e.filterRepeat,
                          s = void 0 === u || u,
                          c = e.startTime,
                          f = void 0 === c ? -1 / 0 : c;
                        switch ((null !== a && (t = t.bind(a)), n)) {
                          case 'keypress':
                          case 'keydown':
                          case 'keyup':
                            var l = (o || []).map(function(t) {
                              return Vt[t] || t;
                            });
                            if (l.length > 0 || s)
                              return function(n) {
                                return ht(n.timeStamp) <= f
                                  ? null
                                  : (s && n.repeat) ||
                                    (l.length > 0 && !l.includes(n.key))
                                  ? null
                                  : t(n);
                              };
                          case 'click':
                          case 'mousedown':
                          case 'mouseup':
                            var p = (o || []).map(function(t) {
                              return parseInt(t);
                            });
                            if (p.length > 0)
                              return function(n) {
                                return ht(n.timeStamp) <= f
                                  ? null
                                  : p.includes(n.button)
                                  ? t(n)
                                  : null;
                              };
                          default:
                            return t;
                        }
                      })(o, a, {
                        filters: u,
                        context: t.context,
                        startTime: t.startTime
                      })
                    ];
                  });
                }
              },
              {
                key: 'attach',
                value: function() {
                  var t = this;
                  this.parsedEvents.forEach(function(n) {
                    var e = Gt(n, 4),
                      r = e[1],
                      o = e[2],
                      i = e[3];
                    '' !== o
                      ? Array.from(t.el.querySelectorAll(o)).forEach(function(
                          t
                        ) {
                          return t.addEventListener(r, i);
                        })
                      : document.addEventListener(r, i);
                  });
                }
              },
              {
                key: 'detach',
                value: function() {
                  var t = this;
                  this.parsedEvents.forEach(function(n) {
                    var e = Gt(n, 4),
                      r = e[1],
                      o = e[2],
                      i = e[3];
                    '' !== o
                      ? Array.from(t.el.querySelectorAll(o)).forEach(function(
                          t
                        ) {
                          return t.removeEventListener(r, i);
                        })
                      : document.removeEventListener(r, i);
                  });
                }
              }
            ]),
            t
          );
        })(),
        Ht = (e(140), e(202), e(244)),
        $t = e.n(Ht),
        Jt = e(86),
        Yt = e.n(Jt),
        Xt = e(245),
        Kt = e.n(Xt),
        Qt = e(246);
      function Zt(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      function tn(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var nn = function() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0]
              ? arguments[0]
              : Math.random;
          return '00000000-0000-4000-8000-000000000000'.replace(
            /[08]/g,
            function(n) {
              return (n ^ ((16 * t()) >> (n / 4))).toString(16);
            }
          );
        },
        en = function() {
          var t =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : 256,
            n = new Uint8Array(t);
          return (
            (window.crypto || window.msCrypto).getRandomValues(n),
            String.fromCharCode.apply(null, n)
          );
        },
        rn = (function() {
          function Random() {
            var t =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : {};
            !(function(t, n) {
              if (!(t instanceof n))
                throw new TypeError('Cannot call a class as a function');
            })(this, Random),
              'alea' === t.algorithm
                ? (this.random = Object(Qt.alea)(t.seed || en()))
                : (this.random = Math.random);
          }
          return (
            (function(t, n, e) {
              n && tn(t.prototype, n), e && tn(t, e);
            })(Random, [
              {
                key: 'range',
                value: function(t) {
                  var n =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : void 0,
                    e = void 0 === n ? t : n - t;
                  return (void 0 === n ? 0 : t) + Math.floor(this.random() * e);
                }
              },
              {
                key: 'choice',
                value: function(t) {
                  return t[this.range(t.length)];
                }
              },
              {
                key: 'sample',
                value: function(t) {
                  var n = this,
                    e =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : 1;
                  return arguments.length > 2 &&
                    void 0 !== arguments[2] &&
                    arguments[2]
                    ? Array(e)
                        .fill(0)
                        .map(function() {
                          return n.choice(t);
                        })
                    : this.shuffle(t).slice(0, Kt()(e, t.length));
                }
              },
              {
                key: 'sampleMode',
                value: function(t, n) {
                  var e = this,
                    r =
                      arguments.length > 2 && void 0 !== arguments[2]
                        ? arguments[2]
                        : 'draw-shuffle';
                  if (!(Array.isArray(t) && t.length > 0))
                    throw new Error(
                      "Can't sample: Empty input, or not an array"
                    );
                  var o = n || t.length,
                    i = Math.floor(o / t.length),
                    a = o % t.length;
                  switch (r) {
                    case 'sequential':
                      return Zt(
                        Yt()(i).reduce(function(n) {
                          return n.concat(t);
                        }, [])
                      ).concat(Zt(t.slice(0, a)));
                    case 'draw':
                    case 'draw-shuffle':
                      var u = Zt(
                        Yt()(i).reduce(function(n) {
                          return n.concat(e.shuffle(t));
                        }, [])
                      ).concat(Zt(this.sample(t, a, !1)));
                      return 'draw-shuffle' === r && o > t.length
                        ? this.shuffle(u)
                        : u;
                    case 'draw-replace':
                      return this.sample(t, o, !0);
                    default:
                      throw new Error('Unknown sample mode, please specify');
                  }
                }
              },
              {
                key: 'shuffle',
                value: function(t) {
                  for (var n = t.slice(), e = n.length; 0 !== e; ) {
                    var r = this.range(e--),
                      o = [n[r], n[e]];
                    (n[e] = o[0]), (n[r] = o[1]);
                  }
                  return n;
                }
              },
              {
                key: 'shuffleTable',
                value: function(t) {
                  var n = this,
                    e =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : [],
                    r =
                      !(arguments.length > 2 && void 0 !== arguments[2]) ||
                      arguments[2],
                    o = e.map(function(n) {
                      return t.map(function(t) {
                        return p()(t, n);
                      });
                    }),
                    i = w()(e),
                    a = t.map(function(t) {
                      return Q()(t, i);
                    });
                  return $t.a.apply(
                    void 0,
                    Zt(
                      o.map(function(t) {
                        return { data: n.shuffle(t) };
                      })
                    ).concat([{ data: r ? this.shuffle(a) : a }])
                  ).data;
                }
              },
              {
                key: 'uuid4',
                value: function() {
                  return nn(this.random);
                }
              }
            ]),
            Random
          );
        })(),
        on = (e(179), e(87)),
        an = e.n(on),
        un = e(247),
        sn = e.n(un),
        cn = e(70),
        fn = e.n(cn),
        ln = e(30),
        pn = e.n(ln),
        hn = e(248),
        dn = e.n(hn);
      function vn(t, n) {
        return (
          (function(t) {
            if (Array.isArray(t)) return t;
          })(t) ||
          (function(t, n) {
            var e = [],
              r = !0,
              o = !1,
              i = void 0;
            try {
              for (
                var a, u = t[Symbol.iterator]();
                !(r = (a = u.next()).done) &&
                (e.push(a.value), !n || e.length !== n);
                r = !0
              );
            } catch (t) {
              (o = !0), (i = t);
            } finally {
              try {
                r || null == u.return || u.return();
              } finally {
                if (o) throw i;
              }
            }
            return e;
          })(t, n) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance'
            );
          })()
        );
      }
      function yn(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      var gn = function(t) {
          return Object.assign.apply(
            Object,
            [{}].concat(
              yn(
                (function(t) {
                  for (
                    var n = [Object.getPrototypeOf(t)];
                    Object.getPrototypeOf(n[0]);

                  )
                    n.unshift(Object.getPrototypeOf(n[0]));
                  return n;
                })(t).map(function(t) {
                  return t.constructor.metadata
                    ? t.constructor.metadata.parsableOptions
                    : void 0;
                })
              )
            )
          );
        },
        mn = function t(n, e, r) {
          var o =
            arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
          if (!r) return n;
          if (!dn()(n))
            return pn()(n)
              ? n.map(function(n) {
                  return t(n, e, r.content, o);
                })
              : fn()(n)
              ? an()(
                  Object.entries(n).map(function(n) {
                    var i = vn(n, 2),
                      a = i[0],
                      u = i[1];
                    return [a, t(u, e, r.content[a] || r.content['*'], o)];
                  })
                )
              : n;
          var i = sn()(n, { escape: '', evaluate: '' }).call(o, e);
          switch (r.type) {
            case void 0:
              return i;
            case 'number':
              return Number(i);
            case 'boolean':
              return Boolean('false' !== i.trim());
            default:
              throw new Error(
                'Output type '.concat(r.type, " unknown, can't convert option")
              );
          }
        },
        bn = function(t, n, e, r) {
          return an()(
            Object.entries(e)
              .map(function(e) {
                var o = vn(e, 2),
                  i = o[0],
                  a = o[1];
                if (t[i]) {
                  var u = mn(t[i], n, a, r);
                  if (u !== t[i]) return [i, u];
                }
              })
              .filter(function(t) {
                return void 0 !== t;
              })
          );
        },
        wn = function() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0]
              ? arguments[0]
              : 'complete';
          return new Promise(function(n) {
            if (document.readyState === t) n();
            else {
              document.addEventListener('readystatechange', function e(r) {
                r.target.readyState === t &&
                  (r.target.removeEventListener('readystatechange', e), n());
              });
            }
          });
        };
      function xn(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      var On = function(t, n) {
          return new Promise(function(e, r) {
            var o = new Image();
            o.addEventListener('load', e),
              o.addEventListener('error', r),
              (o.src = t),
              n && (n[t] = o);
          });
        },
        Sn = (function() {
          var t = (function(t) {
            return function() {
              var n = this,
                e = arguments;
              return new Promise(function(r, o) {
                var i = t.apply(n, e);
                function a(t) {
                  xn(i, r, o, a, u, 'next', t);
                }
                function u(t) {
                  xn(i, r, o, a, u, 'throw', t);
                }
                a(void 0);
              });
            };
          })(
            regeneratorRuntime.mark(function t(n, e, r) {
              return regeneratorRuntime.wrap(
                function(t) {
                  for (;;)
                    switch ((t.prev = t.next)) {
                      case 0:
                        if (!e || n in e) {
                          t.next = 4;
                          break;
                        }
                        return (t.next = 3), Ft(n, r);
                      case 3:
                        e[n] = t.sent;
                      case 4:
                      case 'end':
                        return t.stop();
                    }
                },
                t,
                this
              );
            })
          );
          return function(n, e, r) {
            return t.apply(this, arguments);
          };
        })();
      function _n(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      var jn = function t(n, e) {
          e(n);
          var r = Object.getPrototypeOf(n).constructor.metadata;
          r.nestedComponents &&
            r.nestedComponents.forEach(function(r) {
              var o = n.options[r];
              pn()(o)
                ? o.map(function(n) {
                    return t(n, e);
                  })
                : o instanceof Wn && t(o, e);
            });
        },
        kn = function(t, n, e) {
          var r = O()(e);
          return (
            jn(t, function(t) {
              return (r = n(r, t));
            }),
            r
          );
        },
        En = function(t, n) {
          return Object.assign.apply(
            Object,
            [{}].concat(
              _n(
                t.parents.map(function(t) {
                  return t.options[n] || {};
                })
              ),
              [t.options[n]]
            )
          );
        };
      function Pn(t) {
        return (Pn =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      function An(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      function Tn(t) {
        for (var n = 1; n < arguments.length; n++) {
          var e = null != arguments[n] ? arguments[n] : {},
            r = Object.keys(e);
          'function' == typeof Object.getOwnPropertySymbols &&
            (r = r.concat(
              Object.getOwnPropertySymbols(e).filter(function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable;
              })
            )),
            r.forEach(function(n) {
              Ln(t, n, e[n]);
            });
        }
        return t;
      }
      function Rn(t, n) {
        return !n || ('object' !== Pn(n) && 'function' != typeof n) ? In(t) : n;
      }
      function Mn(t) {
        return (Mn = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(t) {
              return t.__proto__ || Object.getPrototypeOf(t);
            })(t);
      }
      function Fn(t, n) {
        if ('function' != typeof n && null !== n)
          throw new TypeError(
            'Super expression must either be null or a function'
          );
        (t.prototype = Object.create(n && n.prototype, {
          constructor: { value: t, writable: !0, configurable: !0 }
        })),
          n && Cn(t, n);
      }
      function Cn(t, n) {
        return (Cn =
          Object.setPrototypeOf ||
          function(t, n) {
            return (t.__proto__ = n), t;
          })(t, n);
      }
      function In(t) {
        if (void 0 === t)
          throw new ReferenceError(
            "this hasn't been initialised - super() hasn't been called"
          );
        return t;
      }
      function Ln(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      function Nn(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function Dn(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              Nn(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              Nn(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      function Bn(t, n) {
        if (!(t instanceof n))
          throw new TypeError('Cannot call a class as a function');
      }
      function Un(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function zn(t, n, e) {
        return n && Un(t.prototype, n), e && Un(t, e), t;
      }
      var qn = Object.freeze({
          initialized: 0,
          prepared: 1,
          running: 2,
          done: 3
        }),
        Gn = ['debug', 'el'],
        Vn = (function() {
          function t() {
            Bn(this, t),
              (this.datastore = new X()),
              (this.cache = { images: {}, audio: {} }),
              (this.audioContext = new (window.AudioContext ||
                window.webkitAudioContext)()),
              (this.domConnection = new Wt({ el: document, context: this })),
              (this.domConnection.events = {
                keydown: this.indicateInteraction,
                mousedown: this.indicateInteraction,
                touchstart: this.indicateInteraction
              }),
              this.domConnection.prepare(),
              this.domConnection.attach();
          }
          return (
            zn(t, [
              {
                key: 'indicateInteraction',
                value: (function() {
                  var t = Dn(
                    regeneratorRuntime.mark(function t() {
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                if ('suspended' !== this.audioContext.state) {
                                  t.next = 3;
                                  break;
                                }
                                return (t.next = 3), this.audioContext.resume();
                              case 3:
                                this.domConnection.detach();
                              case 4:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function() {
                    return t.apply(this, arguments);
                  };
                })()
              }
            ]),
            t
          );
        })(),
        Wn = (function(t) {
          function Component() {
            var t,
              n =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {};
            return (
              Bn(this, Component),
              Ln(
                In(
                  In(
                    (t = Rn(
                      this,
                      Mn(Component).call(
                        this,
                        Tn(
                          {
                            events: {},
                            messageHandlers: {},
                            timeline: [],
                            el: null,
                            controller: null,
                            title: null,
                            id: null,
                            tardy: !1,
                            skip: !1,
                            scrollTop: !1,
                            parent: null,
                            parameters: {},
                            responses: {},
                            correctResponse: null,
                            data: {},
                            datacommit: null,
                            random: {},
                            timeout: null,
                            handMeDowns: Gn.concat()
                          },
                          n,
                          {
                            media: Tn({ images: [], audio: [] }, n.media),
                            files: Tn({}, n.files),
                            timing: Tn({ method: 'frames' }, n.timing)
                          }
                        )
                      )
                    ))
                  )
                ),
                'status',
                qn.initialized
              ),
              Ln(In(In(t)), 'data', {}),
              Ln(In(In(t)), 'internals', Tn({ timestamps: {} }, t.internals)),
              Ln(In(In(t)), 'parameters', void 0),
              Ln(In(In(t)), 'state', void 0),
              Ln(In(In(t)), 'files', void 0),
              (t.internals.parsedOptions = Object.create(
                t.internals.rawOptions
              )),
              (t.options = new a.a(t.internals.rawOptions, {
                get: function(n, e) {
                  return t.internals.parsedOptions[e];
                },
                set: function(n, e, r) {
                  if (
                    ((t.internals.rawOptions[e] = r), t.status >= qn.prepared)
                  ) {
                    var o = mn(
                      r,
                      {
                        parameters: t.aggregateParameters,
                        state: t.options.datastore.state,
                        files: t._aggregateFiles
                      },
                      gn(In(In(t)))[e],
                      In(In(t))
                    );
                    o !== r && (t.internals.parsedOptions[e] = o);
                  }
                  return !0;
                }
              })),
              Object.keys(t.options.messageHandlers).forEach(function(n) {
                return t.on(n, t.options.messageHandlers[n]);
              }),
              (t.internals.domConnection = new Wt({
                el: t.options.el,
                context: In(In(t))
              })),
              t.on('run', function() {
                t.internals.domConnection.attach();
              }),
              t.on('end', function() {
                t.internals.domConnection.detach();
              }),
              t
            );
          }
          return (
            Fn(Component, L),
            zn(Component, [
              {
                key: 'prepare',
                value: (function() {
                  var t = Dn(
                    regeneratorRuntime.mark(function t() {
                      var n,
                        e,
                        r,
                        o,
                        i = this,
                        a = arguments;
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                if (
                                  ((n =
                                    !(a.length > 0 && void 0 !== a[0]) || a[0]),
                                  !this.options.tardy || n)
                                ) {
                                  t.next = 4;
                                  break;
                                }
                                return (
                                  this.options.debug &&
                                    console.log(
                                      'Skipping automated preparation'
                                    ),
                                  t.abrupt('return')
                                );
                              case 4:
                                return (
                                  this.parent &&
                                    this.parents
                                      .reduce(function(t, n) {
                                        return (
                                          n.options.handMeDowns.forEach(
                                            function(n) {
                                              return t.add(n);
                                            }
                                          ),
                                          t
                                        );
                                      }, new Set())
                                      .forEach(function(t) {
                                        i.options[t] =
                                          i.options[t] || i.parent.options[t];
                                      }),
                                  this.parent &&
                                  this.parent.internals.controller
                                    ? (this.internals.controller = this.parent.internals.controller)
                                    : ((this.internals.controller = new Vn()),
                                      this.once('after:prepare', wn)),
                                  (this.options.datastore = this.internals.controller.datastore),
                                  (this.internals.timeline = new zt(
                                    this.internals.controller
                                  )),
                                  this.options.debug &&
                                    (this.on('before:run', function() {
                                      return console.group(
                                        ''
                                          .concat(i.options.title, ' %c(')
                                          .concat(i.type, ')'),
                                        'font-weight: normal'
                                      );
                                    }),
                                    this.on('after:end', function() {
                                      return console.groupEnd();
                                    })),
                                  this.options.debug &&
                                    null == this.options.el &&
                                    console.log(
                                      'No output element specified, using main section'
                                    ),
                                  (this.options.el =
                                    this.options.el ||
                                    document.querySelector(
                                      '[data-labjs-section="main"]'
                                    )),
                                  (this.internals.root = this.parents[0]),
                                  (this.random = new rn(this.options.random)),
                                  (t.next = 15),
                                  this.triggerMethod('before:prepare')
                                );
                              case 15:
                                return (
                                  (e = Object.freeze({
                                    parameters: this.aggregateParameters,
                                    state: this.options.datastore.state,
                                    files: this._aggregateFiles
                                  })),
                                  (r = bn(
                                    this.internals.rawOptions,
                                    e,
                                    gn(this),
                                    e
                                  )),
                                  (this.internals.parsedOptions = Object.assign(
                                    Object.create(this.internals.rawOptions),
                                    r
                                  )),
                                  Object.keys(this.options.responses).forEach(
                                    function(t) {
                                      i.options.events[t] = function(n) {
                                        n.preventDefault(),
                                          i.respond(
                                            i.options.responses[t],
                                            ht(n.timeStamp)
                                          );
                                      };
                                    }
                                  ),
                                  (this.internals.timeline.events = this.options.timeline),
                                  this.internals.timeline.prepare(),
                                  (this.internals.domConnection.events = this.options.events),
                                  (this.internals.domConnection.el = this.options.el),
                                  null !== this.options.timeout &&
                                    ((o =
                                      'frames' === this.options.timing.method
                                        ? gt
                                        : vt),
                                    (this.internals.timeout = new o(function(
                                      t
                                    ) {
                                      return i.end('timeout', t, !0);
                                    },
                                    this.options.timeout)),
                                    this.on('show', function(t) {
                                      i.internals.timeout.run(t),
                                        i.options.debug &&
                                          (i.internals.timestamps.timeoutTarget =
                                            i.internals.timeout.targetTime);
                                    })),
                                  (this.data = Tn(
                                    {},
                                    this.data,
                                    this.options.data
                                  )),
                                  (t.next = 27),
                                  this.triggerMethod('prepare', n)
                                );
                              case 27:
                                return (
                                  (this.status = qn.prepared),
                                  (t.next = 30),
                                  this.preload()
                                );
                              case 30:
                                return (
                                  this.internals.domConnection.prepare(),
                                  (t.next = 33),
                                  this.triggerMethod('after:prepare')
                                );
                              case 33:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function() {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'preload',
                value: (function() {
                  var t = Dn(
                    regeneratorRuntime.mark(function t() {
                      var n = this;
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                return (
                                  (t.next = 2),
                                  Promise.all(
                                    this.options.media.images.map(function(t) {
                                      return On(
                                        t,
                                        n.internals.controller.cache.images
                                      );
                                    })
                                  )
                                );
                              case 2:
                                return (
                                  (t.next = 4),
                                  Promise.all(
                                    this.options.media.audio.map(function(t) {
                                      return Sn(
                                        t,
                                        n.internals.controller.cache.audio,
                                        n.internals.controller.audioContext
                                      );
                                    })
                                  )
                                );
                              case 4:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function() {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'run',
                value: (function() {
                  var t = Dn(
                    regeneratorRuntime.mark(function t(n, e) {
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                if (!(this.status < qn.prepared)) {
                                  t.next = 4;
                                  break;
                                }
                                return (
                                  this.options.debug &&
                                    console.log('Preparing at the last minute'),
                                  (t.next = 4),
                                  this.prepare()
                                );
                              case 4:
                                return (
                                  (t.next = 6), this.triggerMethod('before:run')
                                );
                              case 6:
                                if (
                                  ((this.status = qn.running),
                                  (this.internals.timestamps.run = performance.now()),
                                  !this.options.skip)
                                ) {
                                  t.next = 10;
                                  break;
                                }
                                return t.abrupt(
                                  'return',
                                  this.end('skipped', n, e)
                                );
                              case 10:
                                return (
                                  this.options.scrollTop &&
                                    window.scrollTo(0, 0),
                                  (t.next = 13),
                                  this.triggerMethod('run', n, e)
                                );
                              case 13:
                                return t.abrupt('return', this.render(n, e));
                              case 14:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function(n, e) {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'render',
                value: (function() {
                  var t = Dn(
                    regeneratorRuntime.mark(function t(n, e) {
                      var r,
                        o = this;
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                (r = (function() {
                                  var t = Dn(
                                    regeneratorRuntime.mark(function t(n) {
                                      return regeneratorRuntime.wrap(
                                        function(t) {
                                          for (;;)
                                            switch ((t.prev = t.next)) {
                                              case 0:
                                                return (
                                                  (o.internals.timestamps.render = n),
                                                  (t.next = 3),
                                                  o.triggerMethod('render', n)
                                                );
                                              case 3:
                                                o.internals.timeline.start(
                                                  n + lt.frameInterval
                                                ),
                                                  window.requestAnimationFrame(
                                                    function(t) {
                                                      (o.internals.timestamps.show = t),
                                                        o.triggerMethod(
                                                          'show',
                                                          t
                                                        );
                                                    }
                                                  );
                                              case 5:
                                              case 'end':
                                                return t.stop();
                                            }
                                        },
                                        t,
                                        this
                                      );
                                    })
                                  );
                                  return function(n) {
                                    return t.apply(this, arguments);
                                  };
                                })()),
                                  e
                                    ? r(n)
                                    : (this.internals.frameRequest = window.requestAnimationFrame(
                                        r
                                      ));
                              case 2:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function(n, e) {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'respond',
                value: function() {
                  var t =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : null,
                    n =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : void 0;
                  return (
                    (this.data.response = t),
                    null !== this.options.correctResponse &&
                      ((this.data.correctResponse = this.options.correctResponse),
                      (this.data.correct =
                        this.data.response === this.options.correctResponse)),
                    this.end('response', n)
                  );
                }
              },
              {
                key: 'end',
                value: (function() {
                  var t = Dn(
                    regeneratorRuntime.mark(function t() {
                      var n,
                        e,
                        r,
                        o,
                        i,
                        a = this,
                        u = arguments;
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                return (
                                  (n =
                                    u.length > 0 && void 0 !== u[0]
                                      ? u[0]
                                      : null),
                                  (e =
                                    u.length > 1 && void 0 !== u[1]
                                      ? u[1]
                                      : performance.now()),
                                  (r = u.length > 2 && void 0 !== u[2] && u[2]),
                                  (this.internals.timestamps.end = e),
                                  (this.data.ended_on = n),
                                  (this.status = qn.done),
                                  null !== this.options.timeout &&
                                    this.internals.timeout.cancel(),
                                  this.internals.frameRequest &&
                                    window.cancelAnimationFrame(
                                      this.internals.frameRequest
                                    ),
                                  (t.next = 10),
                                  this.triggerMethod('end', e, r)
                                );
                              case 10:
                                return (
                                  this.internals.timeline.end(
                                    e + lt.frameInterval
                                  ),
                                  !1 !== this.options.datacommit &&
                                    ((o =
                                      'timeout' === this.data.ended_on
                                        ? this.internals.timestamps.end -
                                          this.internals.timestamps.render
                                        : 'response' === this.data.ended_on &&
                                          'Safari' === it
                                        ? this.internals.timestamps.end -
                                          this.internals.timestamps.render
                                        : this.internals.timestamps.end -
                                          this.internals.timestamps.show),
                                    this.commit(
                                      Tn(
                                        {},
                                        this.data,
                                        this.aggregateParameters,
                                        {
                                          time_run: this.internals.timestamps
                                            .run,
                                          time_render: this.internals.timestamps
                                            .render,
                                          time_show: this.internals.timestamps
                                            .show,
                                          time_end: this.internals.timestamps
                                            .end,
                                          duration: o
                                        }
                                      )
                                    )),
                                  (t.next = 14),
                                  this.triggerMethod('after:end', e, r)
                                );
                              case 14:
                                return (
                                  (i = function(t) {
                                    (a.internals.timestamps.switch = t),
                                      a.options.datastore.update(
                                        a.internals.logIndex,
                                        function(n) {
                                          return Tn({}, n, {
                                            time_switch: t,
                                            duration:
                                              'timeout' === n.ended_on
                                                ? t - n.time_show
                                                : n.duration
                                          });
                                        }
                                      ),
                                      dt(function() {
                                        return a.options.datastore.triggerMethod(
                                          'idle'
                                        );
                                      }),
                                      dt(function() {
                                        return a.epilogue();
                                      });
                                  }),
                                  r
                                    ? window.requestAnimationFrame(i)
                                    : window.requestAnimationFrame(function() {
                                        return window.requestAnimationFrame(i);
                                      }),
                                  t.abrupt('return', e)
                                );
                              case 17:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function() {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'epilogue',
                value: function() {
                  this.internals.timeline.teardown(),
                    this.triggerMethod('epilogue');
                }
              },
              {
                key: 'commit',
                value: function() {
                  var t =
                    arguments.length > 0 && void 0 !== arguments[0]
                      ? arguments[0]
                      : {};
                  return (
                    (this.internals.logIndex = this.options.datastore.commit(
                      Tn({}, this.metadata, t, {
                        time_commit: performance.now(),
                        timestamp: new Date().toISOString()
                      })
                    )),
                    this.triggerMethod('commit')
                  );
                }
              },
              {
                key: 'clone',
                value: function() {
                  var t = this,
                    n =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : {},
                    e = this.constructor.metadata.nestedComponents || [],
                    r = Tn(
                      {},
                      o()(this.internals.rawOptions, function(n, r, o) {
                        if (o === t.internals.rawOptions && e.includes(r)) {
                          if (Array.isArray(n))
                            return n.map(function(t) {
                              return t instanceof Component ? t.clone() : t;
                            });
                          if (n instanceof Component) return n.clone();
                        }
                      }),
                      n
                    );
                  return new this.constructor(r);
                }
              },
              {
                key: 'timer',
                get: function() {
                  var t = this.internals.timestamps;
                  switch (this.status) {
                    case qn.running:
                      return performance.now() - (t.show || t.render);
                    case qn.done:
                      return this.internals.timestamps.end - (t.show || t.run);
                    default:
                      return;
                  }
                }
              },
              {
                key: 'progress',
                get: function() {
                  return 1 * (this.status === qn.done);
                }
              },
              {
                key: 'aggregateParameters',
                get: function() {
                  return En(this, 'parameters');
                }
              },
              {
                key: '_aggregateFiles',
                get: function() {
                  return En(this, 'files');
                }
              },
              {
                key: 'metadata',
                get: function() {
                  return {
                    sender: this.options.title,
                    sender_type: this.type,
                    sender_id: this.options.id
                  };
                }
              },
              {
                key: 'parents',
                get: function() {
                  for (var t = [], n = this; n.parent; )
                    (n = n.parent), (t = t.concat(n));
                  return t.reverse();
                }
              },
              {
                key: 'type',
                get: function() {
                  return An(this.constructor.metadata.module)
                    .concat([this.constructor.name])
                    .join('.');
                }
              }
            ]),
            Component
          );
        })();
      Wn.metadata = {
        module: ['core'],
        nestedComponents: [],
        parsableOptions: {
          responses: { content: { '*': 'string' } },
          correctResponse: {},
          timeline: {
            type: 'array',
            content: {
              type: 'object',
              content: {
                start: { type: 'number' },
                stop: { type: 'number' },
                '*': 'string',
                payload: {
                  type: 'object',
                  content: { gain: { type: 'number' }, '*': 'string' }
                }
              }
            }
          },
          timeout: { type: 'number' },
          skip: { type: 'boolean' }
        }
      };
      var Dummy = (function(t) {
          function Dummy() {
            var t =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : {};
            return (
              Bn(this, Dummy),
              Rn(this, Mn(Dummy).call(this, Tn({ skip: !0 }, t)))
            );
          }
          return Fn(Dummy, Wn), Dummy;
        })(),
        Hn = e(167),
        $n = e.n(Hn);
      function Jn(t) {
        return (Jn =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      function Yn(t, n, e) {
        return (Yn =
          'undefined' != typeof Reflect && Reflect.get
            ? Reflect.get
            : function(t, n, e) {
                var r = (function(t, n) {
                  for (
                    ;
                    !Object.prototype.hasOwnProperty.call(t, n) &&
                    null !== (t = ie(t));

                  );
                  return t;
                })(t, n);
                if (r) {
                  var o = Object.getOwnPropertyDescriptor(r, n);
                  return o.get ? o.get.call(e) : o.value;
                }
              })(t, n, e || t);
      }
      function Xn(t, n) {
        return (
          (function(t) {
            if (Array.isArray(t)) return t;
          })(t) ||
          (function(t, n) {
            var e = [],
              r = !0,
              o = !1,
              i = void 0;
            try {
              for (
                var a, u = t[Symbol.iterator]();
                !(r = (a = u.next()).done) &&
                (e.push(a.value), !n || e.length !== n);
                r = !0
              );
            } catch (t) {
              (o = !0), (i = t);
            } finally {
              try {
                r || null == u.return || u.return();
              } finally {
                if (o) throw i;
              }
            }
            return e;
          })(t, n) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance'
            );
          })()
        );
      }
      function Kn(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function Qn(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              Kn(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              Kn(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      function Zn(t) {
        for (var n = 1; n < arguments.length; n++) {
          var e = null != arguments[n] ? arguments[n] : {},
            r = Object.keys(e);
          'function' == typeof Object.getOwnPropertySymbols &&
            (r = r.concat(
              Object.getOwnPropertySymbols(e).filter(function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable;
              })
            )),
            r.forEach(function(n) {
              te(t, n, e[n]);
            });
        }
        return t;
      }
      function te(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      function ne(t, n) {
        if (!(t instanceof n))
          throw new TypeError('Cannot call a class as a function');
      }
      function ee(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function re(t, n, e) {
        return n && ee(t.prototype, n), e && ee(t, e), t;
      }
      function oe(t, n) {
        return !n || ('object' !== Jn(n) && 'function' != typeof n)
          ? (function(t) {
              if (void 0 === t)
                throw new ReferenceError(
                  "this hasn't been initialised - super() hasn't been called"
                );
              return t;
            })(t)
          : n;
      }
      function ie(t) {
        return (ie = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(t) {
              return t.__proto__ || Object.getPrototypeOf(t);
            })(t);
      }
      function ae(t, n) {
        if ('function' != typeof n && null !== n)
          throw new TypeError(
            'Super expression must either be null or a function'
          );
        (t.prototype = Object.create(n && n.prototype, {
          constructor: { value: t, writable: !0, configurable: !0 }
        })),
          n && ue(t, n);
      }
      function ue(t, n) {
        return (ue =
          Object.setPrototypeOf ||
          function(t, n) {
            return (t.__proto__ = n), t;
          })(t, n);
      }
      var se = function(t, n) {
          return (
            t.forEach(function(t) {
              return (t.parent = n);
            }),
            t.forEach(function(t, e) {
              null == n.options.id
                ? (t.options.id = String(e))
                : (t.options.id = [n.options.id, e].join('_'));
            }),
            Promise.all(
              t.map(function(t) {
                return t.prepare(!1);
              })
            )
          );
        },
        ce = (function(t) {
          function Sequence() {
            var t,
              n =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {};
            return (
              ne(this, Sequence),
              ((t = oe(
                this,
                ie(Sequence).call(this, Zn({ content: [], shuffle: !1 }, n))
              )).internals.currentComponent = null),
              (t.internals.currentPosition = null),
              t
            );
          }
          return (
            ae(Sequence, Wn),
            re(Sequence, [
              {
                key: 'onPrepare',
                value: (function() {
                  var t = Qn(
                    regeneratorRuntime.mark(function t() {
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                return (
                                  this.options.shuffle &&
                                    (this.options.content = this.random.shuffle(
                                      this.options.content
                                    )),
                                  (this.internals.iterator = this.options.content.entries()),
                                  (this.internals.stepper = this.step.bind(
                                    this
                                  )),
                                  (t.next = 5),
                                  se(this.options.content, this)
                                );
                              case 5:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function() {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'onRun',
                value: (function() {
                  var t = Qn(
                    regeneratorRuntime.mark(function t(n, e) {
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                return t.abrupt('return', this.step(n, e));
                              case 1:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function(n, e) {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'onEnd',
                value: function() {
                  this.internals.currentComponent &&
                    this.internals.currentComponent.status !== qn.done &&
                    (this.internals.currentComponent.off(
                      'after:end',
                      this.internals.stepper
                    ),
                    this.internals.currentComponent.end('abort by sequence'));
                }
              },
              {
                key: 'step',
                value: (function() {
                  var t = Qn(
                    regeneratorRuntime.mark(function t(n, e) {
                      var r, o;
                      return regeneratorRuntime.wrap(
                        function(t) {
                          for (;;)
                            switch ((t.prev = t.next)) {
                              case 0:
                                if (this.status !== qn.done) {
                                  t.next = 2;
                                  break;
                                }
                                throw new Error(
                                  "Sequence ended, can't take any more steps"
                                );
                              case 2:
                                if (
                                  !(r = this.internals.iterator.next()).done
                                ) {
                                  t.next = 7;
                                  break;
                                }
                                return t.abrupt(
                                  'return',
                                  this.end('completion', n, e)
                                );
                              case 7:
                                return (
                                  (o = Xn(r.value, 2)),
                                  (this.internals.currentPosition = o[0]),
                                  (this.internals.currentComponent = o[1]),
                                  this.internals.currentComponent.on(
                                    'after:end',
                                    this.internals.stepper
                                  ),
                                  t.abrupt(
                                    'return',
                                    this.internals.currentComponent.run(n, e)
                                  )
                                );
                              case 12:
                              case 'end':
                                return t.stop();
                            }
                        },
                        t,
                        this
                      );
                    })
                  );
                  return function(n, e) {
                    return t.apply(this, arguments);
                  };
                })()
              },
              {
                key: 'progress',
                get: function() {
                  return this.status === qn.done
                    ? 1
                    : $n()(
                        this.options.content.map(function(t) {
                          return t.progress;
                        })
                      );
                }
              }
            ]),
            Sequence
          );
        })();
      ce.metadata = {
        module: ['flow'],
        nestedComponents: ['content'],
        parsableOptions: { shuffle: { type: 'boolean' } }
      };
      var fe = (function(t) {
        function Loop() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          return (
            ne(this, Loop),
            oe(
              this,
              ie(Loop).call(
                this,
                Zn(
                  {
                    template: null,
                    templateParameters: [],
                    sample: { n: void 0, mode: 'sequential' },
                    shuffleGroups: void 0,
                    shuffleUngrouped: !1
                  },
                  t
                )
              )
            )
          );
        }
        return (
          ae(Loop, ce),
          re(Loop, [
            {
              key: 'onPrepare',
              value: function() {
                var t = this,
                  n = [];
                if (
                  Array.isArray(this.options.templateParameters) &&
                  this.options.templateParameters.length > 0
                ) {
                  var e =
                    Array.isArray(this.options.shuffleGroups) &&
                    this.options.shuffleGroups.length
                      ? this.random.shuffleTable(
                          this.options.templateParameters,
                          this.options.shuffleGroups,
                          this.options.shuffleUngrouped
                        )
                      : this.options.templateParameters;
                  n = this.random.sampleMode(
                    e,
                    this.options.sample.n,
                    !0 === this.options.sample.replace
                      ? 'draw-replace'
                      : this.options.sample.mode
                  );
                } else
                  console.warn(
                    'Empty or invalid parameter set for loop, no content generated'
                  );
                return (
                  this.options.template instanceof Wn
                    ? (this.options.content = n.map(function(n) {
                        var e = t.options.template.clone();
                        return (
                          (e.options.parameters = Zn(
                            {},
                            e.options.parameters,
                            n
                          )),
                          e
                        );
                      }))
                    : E()(this.options.template)
                    ? (this.options.content = n.map(function(n, e) {
                        return t.options.template(n, e, t);
                      }))
                    : console.warn(
                        'Missing or invalid template in loop, no content generated'
                      ),
                  Yn(ie(Loop.prototype), 'onPrepare', this).call(this)
                );
              }
            }
          ]),
          Loop
        );
      })();
      fe.metadata = {
        module: ['flow'],
        nestedComponents: ['template'],
        parsableOptions: {
          templateParameters: {
            type: 'array',
            content: { content: { '*': {} } }
          },
          sample: {
            type: 'object',
            content: {
              n: { type: 'number' },
              replace: { type: 'boolean' },
              mode: {}
            }
          }
        }
      };
      var le = (function(t) {
        function Parallel() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          return (
            ne(this, Parallel),
            oe(
              this,
              ie(Parallel).call(this, Zn({ content: [], mode: 'race' }, t))
            )
          );
        }
        return (
          ae(Parallel, Wn),
          re(Parallel, [
            {
              key: 'onPrepare',
              value: (function() {
                var t = Qn(
                  regeneratorRuntime.mark(function t() {
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              return (
                                (t.next = 2), se(this.options.content, this)
                              );
                            case 2:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function() {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'onRun',
              value: function(t) {
                var n = this;
                return (
                  Promise[this.options.mode](
                    this.options.content.map(function(t) {
                      return t.waitFor('end');
                    })
                  ).then(function() {
                    return n.end();
                  }),
                  Promise.all(
                    this.options.content.map(function(n) {
                      return n.run(t);
                    })
                  )
                );
              }
            },
            {
              key: 'onEnd',
              value: function() {
                this.options.content.forEach(function(t) {
                  t.status < qn.done && t.end('abort by parallel');
                });
              }
            },
            {
              key: 'progress',
              get: function() {
                return this.status === qn.done
                  ? 1
                  : $n()(
                      this.options.content.map(function(t) {
                        return t.progress;
                      })
                    );
              }
            }
          ]),
          Parallel
        );
      })();
      function pe(t) {
        return (pe =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      function he(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function de(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              he(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              he(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      function ve(t, n, e) {
        return (ve =
          'undefined' != typeof Reflect && Reflect.get
            ? Reflect.get
            : function(t, n, e) {
                var r = (function(t, n) {
                  for (
                    ;
                    !Object.prototype.hasOwnProperty.call(t, n) &&
                    null !== (t = Oe(t));

                  );
                  return t;
                })(t, n);
                if (r) {
                  var o = Object.getOwnPropertyDescriptor(r, n);
                  return o.get ? o.get.call(e) : o.value;
                }
              })(t, n, e || t);
      }
      function ye(t) {
        for (var n = 1; n < arguments.length; n++) {
          var e = null != arguments[n] ? arguments[n] : {},
            r = Object.keys(e);
          'function' == typeof Object.getOwnPropertySymbols &&
            (r = r.concat(
              Object.getOwnPropertySymbols(e).filter(function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable;
              })
            )),
            r.forEach(function(n) {
              ge(t, n, e[n]);
            });
        }
        return t;
      }
      function ge(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      function me(t, n) {
        if (!(t instanceof n))
          throw new TypeError('Cannot call a class as a function');
      }
      function be(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function we(t, n, e) {
        return n && be(t.prototype, n), e && be(t, e), t;
      }
      function xe(t, n) {
        return !n || ('object' !== pe(n) && 'function' != typeof n)
          ? (function(t) {
              if (void 0 === t)
                throw new ReferenceError(
                  "this hasn't been initialised - super() hasn't been called"
                );
              return t;
            })(t)
          : n;
      }
      function Oe(t) {
        return (Oe = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(t) {
              return t.__proto__ || Object.getPrototypeOf(t);
            })(t);
      }
      function Se(t, n) {
        if ('function' != typeof n && null !== n)
          throw new TypeError(
            'Super expression must either be null or a function'
          );
        (t.prototype = Object.create(n && n.prototype, {
          constructor: { value: t, writable: !0, configurable: !0 }
        })),
          n && _e(t, n);
      }
      function _e(t, n) {
        return (_e =
          Object.setPrototypeOf ||
          function(t, n) {
            return (t.__proto__ = n), t;
          })(t, n);
      }
      le.metadata = {
        module: ['flow'],
        nestedComponents: ['content'],
        parsableOptions: { mode: {} }
      };
      var je = (function(t) {
        function Screen(t) {
          return (
            me(this, Screen),
            xe(
              this,
              Oe(Screen).call(this, ye({ content: null, contentUrl: null }, t))
            )
          );
        }
        return (
          Se(Screen, Wn),
          we(Screen, [
            {
              key: 'onBeforePrepare',
              value: function() {
                var t = this;
                return Promise.resolve().then(function() {
                  return t.options.contentUrl
                    ? fetch(t.options.contentUrl)
                        .then(function(t) {
                          return t.text();
                        })
                        .then(function(n) {
                          return (t.options.content = n);
                        })
                        .catch(function(t) {
                          return console.log(
                            'Error while loading content: ',
                            t
                          );
                        })
                    : null;
                });
              }
            },
            {
              key: 'onRun',
              value: function() {
                this.options.el.innerHTML = this.options.content;
              }
            }
          ]),
          Screen
        );
      })();
      je.metadata = {
        module: ['html'],
        nestedComponents: [],
        parsableOptions: { content: {} }
      };
      var Form = (function(t) {
        function Form() {
          var t,
            n =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : {};
          return (
            me(this, Form),
            ((t = xe(
              this,
              Oe(Form).call(
                this,
                ye(
                  {
                    validator: function() {
                      return !0;
                    }
                  },
                  n
                )
              )
            )).options.events['click button[type="submit"]'] = function(n) {
              if (n.target.getAttribute('form')) {
                var e = t.options.el.querySelector(
                  'form#'.concat(n.target.getAttribute('form'))
                );
                if (e) {
                  n.preventDefault();
                  var r = document.createElement('input');
                  return (
                    (r.type = 'submit'),
                    (r.style.display = 'none'),
                    e.appendChild(r),
                    r.click(),
                    e.removeChild(r),
                    !1
                  );
                }
              }
              return !0;
            }),
            (t.options.events['submit form'] = function(n) {
              return t.submit(n);
            }),
            t
          );
        }
        return (
          Se(Form, je),
          we(Form, [
            {
              key: 'onRun',
              value: function() {
                ve(Oe(Form.prototype), 'onRun', this).call(this);
                var t = this.options.el.querySelector('[autofocus]');
                t && t.focus();
              }
            },
            {
              key: 'submit',
              value: function() {
                var t =
                  arguments.length > 0 && void 0 !== arguments[0]
                    ? arguments[0]
                    : null;
                return (
                  t && t.preventDefault && t.preventDefault(),
                  this.validate()
                    ? (Object.assign(this.data, this.serialize()),
                      this.end('form submission'))
                    : Array.from(
                        this.options.el.querySelectorAll('form')
                      ).forEach(function(t) {
                        return t.setAttribute('data-labjs-validated', '');
                      }),
                  !1
                );
              }
            },
            {
              key: 'serialize',
              value: function() {
                var t = this.options.el.querySelectorAll('form'),
                  n = {};
                return (
                  Array.from(t).forEach(function(t) {
                    Array.from(t.elements).forEach(function(t) {
                      switch (t.nodeName.toLowerCase()) {
                        case 'input':
                          switch (t.type) {
                            case 'checkbox':
                              n[t.name] = t.checked;
                              break;
                            case 'radio':
                              t.checked && (n[t.name] = t.value);
                              break;
                            default:
                              n[t.name] = t.value;
                          }
                          break;
                        case 'textarea':
                          n[t.name] = t.value;
                          break;
                        case 'select':
                          switch (t.type) {
                            case 'select-one':
                              n[t.name] = t.value;
                              break;
                            case 'select-multiple':
                              n[t.name] = Array.from(t.options)
                                .filter(function(t) {
                                  return t.selected;
                                })
                                .map(function(t) {
                                  return t.value;
                                });
                          }
                      }
                    });
                  }),
                  n
                );
              }
            },
            {
              key: 'validate',
              value: function() {
                var t = this.options.el.querySelectorAll('form');
                return (
                  this.options.validator(this.serialize()) &&
                  Array.from(t).every(function(t) {
                    return t.checkValidity();
                  })
                );
              }
            }
          ]),
          Form
        );
      })();
      Form.metadata = { module: ['html'], nestedComponents: [] };
      var ke = (function(t) {
        function Frame() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          return (
            me(this, Frame),
            xe(
              this,
              Oe(Frame).call(
                this,
                ye({ content: null, context: '', contextSelector: '' }, t)
              )
            )
          );
        }
        return (
          Se(Frame, Wn),
          we(Frame, [
            {
              key: 'onPrepare',
              value: (function() {
                var t = de(
                  regeneratorRuntime.mark(function t() {
                    var n,
                      e = this;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              return (
                                (n = new DOMParser()),
                                (this.internals.parsedContext = n.parseFromString(
                                  this.options.context,
                                  'text/html'
                                )),
                                (this.options.content.options.el = this.internals.parsedContext.querySelector(
                                  this.options.contextSelector
                                )),
                                (this.internals.contentEndHandler = function() {
                                  return e.end();
                                }),
                                this.options.content.on(
                                  'after:end',
                                  this.internals.contentEndHandler
                                ),
                                (t.next = 7),
                                se([this.options.content], this)
                              );
                            case 7:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function() {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'onRun',
              value: (function() {
                var t = de(
                  regeneratorRuntime.mark(function t(n, e) {
                    var r = this;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              return (
                                (this.options.el.innerHTML = ''),
                                Array.from(
                                  this.internals.parsedContext.body.children
                                ).forEach(function(t) {
                                  return r.options.el.appendChild(t);
                                }),
                                (t.next = 4),
                                this.options.content.run(n, e)
                              );
                            case 4:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function(n, e) {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'onEnd',
              value: function() {
                return this.options.content.status < qn.done
                  ? (this.options.content.off(
                      'after:end',
                      this.internals.contentEndHandler
                    ),
                    this.options.content.end('abort by frame'))
                  : Promise.resolve();
              }
            }
          ]),
          Frame
        );
      })();
      ke.metadata = {
        module: ['html'],
        nestedComponents: ['content'],
        parsableOptions: { context: {} }
      };
      var Ee = function(t) {
          return Math.PI * (t / 180);
        },
        Pe = function(t, n) {
          var e =
              arguments.length > 2 && void 0 !== arguments[2]
                ? arguments[2]
                : 0,
            r =
              arguments.length > 3 && void 0 !== arguments[3]
                ? arguments[3]
                : [0, 0],
            o =
              arguments.length > 4 && void 0 !== arguments[4]
                ? arguments[4]
                : 0,
            i = Ee((360 * e) / t + o);
          return [n * Math.sin(i) + r[0], n * Math.cos(i) + r[1]];
        };
      function Ae(t, n) {
        return (
          (function(t) {
            if (Array.isArray(t)) return t;
          })(t) ||
          (function(t, n) {
            var e = [],
              r = !0,
              o = !1,
              i = void 0;
            try {
              for (
                var a, u = t[Symbol.iterator]();
                !(r = (a = u.next()).done) &&
                (e.push(a.value), !n || e.length !== n);
                r = !0
              );
            } catch (t) {
              (o = !0), (i = t);
            } finally {
              try {
                r || null == u.return || u.return();
              } finally {
                if (o) throw i;
              }
            }
            return e;
          })(t, n) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance'
            );
          })()
        );
      }
      function Te(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      var Re = function(t, n) {
          var e = (function(t) {
              for (var n = 1; n < arguments.length; n++) {
                var e = null != arguments[n] ? arguments[n] : {},
                  r = Object.keys(e);
                'function' == typeof Object.getOwnPropertySymbols &&
                  (r = r.concat(
                    Object.getOwnPropertySymbols(e).filter(function(t) {
                      return Object.getOwnPropertyDescriptor(e, t).enumerable;
                    })
                  )),
                  r.forEach(function(n) {
                    Te(t, n, e[n]);
                  });
              }
              return t;
            })(
              {
                translateOrigin: !0,
                viewportScale: 'auto',
                devicePixelScaling: !0,
                canvasClientRect: { left: 0, top: 0 }
              },
              arguments.length > 2 && void 0 !== arguments[2]
                ? arguments[2]
                : {}
            ),
            r = e.translateOrigin ? t[0] / 2 : 0,
            o = e.translateOrigin ? t[1] / 2 : 0,
            i = e.devicePixelScaling ? window.devicePixelRatio : 1,
            a =
              'auto' === e.viewportScale
                ? Math.min(t[0] / (i * n[0]), t[1] / (i * n[1]))
                : e.viewportScale;
          return {
            translateX: r,
            translateY: o,
            scale: a * i,
            viewportScale: a,
            pixelRatio: i
          };
        },
        Me = function(t, n) {
          var e = Ae(n, 2),
            r = e[0],
            o = e[1];
          return [r * t[0] + o * t[2] + t[4], r * t[1] + o * t[3] + t[5]];
        },
        Fe = function(t, n) {
          return function(e, r, o) {
            return (t || []).forEach(function(t) {
              return (function(t, n) {
                var e =
                  arguments.length > 2 && void 0 !== arguments[2]
                    ? arguments[2]
                    : {};
                switch (
                  (t.save(),
                  t.beginPath(),
                  t.translate(n.left, n.top),
                  t.rotate(Ee(n.angle)),
                  n.type)
                ) {
                  case 'line':
                    t.moveTo(-n.width / 2, 0), t.lineTo(+n.width / 2, 0);
                    break;
                  case 'rect':
                    t.rect(-n.width / 2, -n.height / 2, n.width, n.height);
                    break;
                  case 'triangle':
                    t.moveTo(-n.width / 2, n.height / 2),
                      t.lineTo(0, -n.height / 2),
                      t.lineTo(n.width / 2, n.height / 2),
                      t.closePath();
                    break;
                  case 'circle':
                    t.arc(0, 0, n.width / 2, 0, Ee(360));
                    break;
                  case 'ellipse':
                    t.ellipse(0, 0, n.width / 2, n.height / 2, 0, 0, Ee(360));
                    break;
                  case 'text':
                  case 'i-text':
                    (t.font =
                      ''.concat(n.fontStyle || 'normal', ' ') +
                      ''.concat(n.fontWeight || 'normal', ' ') +
                      ''.concat(n.fontSize || 32, 'px ') +
                      ''.concat(n.fontFamily || 'sans-serif')),
                      (t.textAlign = n.textAlign || 'center'),
                      (t.textBaseline = 'middle');
                    break;
                  case 'image':
                    var r = e.images[n.src],
                      o =
                        'width' === n.autoScale
                          ? r.naturalWidth * (n.height / r.naturalHeight)
                          : n.width,
                      i =
                        'height' === n.autoScale
                          ? r.naturalHeight * (n.width / r.naturalWidth)
                          : n.height;
                    t.drawImage(r, -o / 2, -i / 2, o, i);
                    break;
                  default:
                    throw new Error('Unknown content type');
                }
                n.fill &&
                  ((t.fillStyle = n.fill),
                  'i-text' !== n.type && 'text' !== n.type
                    ? t.fill()
                    : n.text.split('\n').forEach(function(e, r, o) {
                        t.fillText(
                          e,
                          0,
                          (r - 0.5 * (o.length - 1)) *
                            (n.fontSize || 32) *
                            (n.lineHeight || 1.16)
                        );
                      })),
                  n.stroke &&
                    n.strokeWidth &&
                    ((t.strokeStyle = n.stroke),
                    (t.lineWidth = n.strokeWidth || 1),
                    'i-text' !== n.type && 'text' !== n.type
                      ? t.stroke()
                      : n.text.split('\n').forEach(function(e, r, o) {
                          t.strokeText(
                            e,
                            0,
                            (r - 0.5 * (o.length - 1)) *
                              (n.fontSize || 32) *
                              (n.lineHeight || 1.16)
                          );
                        })),
                  t.restore();
              })(o, t, n);
            });
          };
        };
      function Ce(t) {
        return (Ce =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      function Ie(t, n, e, r, o, i, a) {
        try {
          var u = t[i](a),
            s = u.value;
        } catch (t) {
          return void e(t);
        }
        u.done ? n(s) : Promise.resolve(s).then(r, o);
      }
      function Le(t) {
        return function() {
          var n = this,
            e = arguments;
          return new Promise(function(r, o) {
            var i = t.apply(n, e);
            function a(t) {
              Ie(i, r, o, a, u, 'next', t);
            }
            function u(t) {
              Ie(i, r, o, a, u, 'throw', t);
            }
            a(void 0);
          });
        };
      }
      function Ne(t) {
        return (
          (function(t) {
            if (Array.isArray(t)) {
              for (var n = 0, e = new Array(t.length); n < t.length; n++)
                e[n] = t[n];
              return e;
            }
          })(t) ||
          (function(t) {
            if (
              Symbol.iterator in Object(t) ||
              '[object Arguments]' === Object.prototype.toString.call(t)
            )
              return Array.from(t);
          })(t) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance'
            );
          })()
        );
      }
      function De(t, n) {
        if (!(t instanceof n))
          throw new TypeError('Cannot call a class as a function');
      }
      function Be(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function Ue(t, n, e) {
        return n && Be(t.prototype, n), e && Be(t, e), t;
      }
      function ze(t, n) {
        return !n || ('object' !== Ce(n) && 'function' != typeof n) ? We(t) : n;
      }
      function qe(t) {
        return (qe = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(t) {
              return t.__proto__ || Object.getPrototypeOf(t);
            })(t);
      }
      function Ge(t, n) {
        if ('function' != typeof n && null !== n)
          throw new TypeError(
            'Super expression must either be null or a function'
          );
        (t.prototype = Object.create(n && n.prototype, {
          constructor: { value: t, writable: !0, configurable: !0 }
        })),
          n && Ve(t, n);
      }
      function Ve(t, n) {
        return (Ve =
          Object.setPrototypeOf ||
          function(t, n) {
            return (t.__proto__ = n), t;
          })(t, n);
      }
      function We(t) {
        if (void 0 === t)
          throw new ReferenceError(
            "this hasn't been initialised - super() hasn't been called"
          );
        return t;
      }
      function He(t) {
        for (var n = 1; n < arguments.length; n++) {
          var e = null != arguments[n] ? arguments[n] : {},
            r = Object.keys(e);
          'function' == typeof Object.getOwnPropertySymbols &&
            (r = r.concat(
              Object.getOwnPropertySymbols(e).filter(function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable;
              })
            )),
            r.forEach(function(n) {
              $e(t, n, e[n]);
            });
        }
        return t;
      }
      function $e(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      var Je = function(t) {
          return He(
            {
              canvas: null,
              ctxType: '2d',
              ctx: null,
              insertCanvasOnRun: !1,
              translateOrigin: !0,
              viewport: [800, 600],
              viewportScale: 'auto',
              viewportEdge: !1,
              devicePixelScaling: null
            },
            t
          );
        },
        Ye = function() {
          null === this.options.canvas &&
            ((this.options.canvas = document.createElement('canvas')),
            (this.options.insertCanvasOnRun = !0)),
            null === this.options.devicePixelScaling &&
              (this.options.devicePixelScaling = !0);
        },
        Xe = function() {
          var t =
              !(arguments.length > 0 && void 0 !== arguments[0]) ||
              arguments[0],
            n = arguments.length > 1 ? arguments[1] : void 0;
          if (this.options.insertCanvasOnRun) {
            var e = this.options.devicePixelScaling
              ? window.devicePixelRatio
              : 1;
            (n = n || this.options.el), t && (n.innerHTML = '');
            var r = window.getComputedStyle(n),
              o =
                n.clientWidth -
                parseInt(r.paddingLeft) -
                parseInt(r.paddingRight),
              i =
                n.clientHeight -
                parseInt(r.paddingTop) -
                parseInt(r.paddingBottom);
            (this.options.canvas.width = o * e),
              (this.options.canvas.height = i * e),
              (this.options.canvas.style.display = 'block'),
              (this.options.canvas.style.width = ''.concat(o, 'px')),
              (this.options.canvas.style.height = ''.concat(i, 'px')),
              t && n.appendChild(this.options.canvas);
          }
        },
        Ke = (function(t) {
          function Screen() {
            var t,
              n =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {};
            return (
              De(this, Screen),
              ((t = ze(
                this,
                qe(Screen).call(
                  this,
                  He(
                    { content: null, renderFunction: null, clearCanvas: !0 },
                    Je(n)
                  )
                )
              )).internals.frameRequest = null),
              (t.render = t.render.bind(We(We(t)))),
              t
            );
          }
          return (
            Ge(Screen, Wn),
            Ue(Screen, [
              {
                key: 'onPrepare',
                value: function() {
                  var t = this;
                  this.options.content &&
                    this.options.content
                      .filter(function(t) {
                        return 'image' === t.type;
                      })
                      .forEach(function(n) {
                        return t.options.media.images.push(n.src);
                      }),
                    Ye.apply(this),
                    null === this.options.renderFunction &&
                      (this.options.renderFunction = Fe(
                        this.options.content,
                        this.internals.controller.cache
                      ));
                }
              },
              {
                key: 'onRun',
                value: function() {
                  var t;
                  Xe.apply(this),
                    (this.options.ctx = this.options.canvas.getContext(
                      this.options.ctxType
                    )),
                    this.options.ctx.save(),
                    (this.internals.transformationMatrix = (function(t, n, e) {
                      var r = Re(t, n, e),
                        o = r.translateX,
                        i = r.translateY,
                        a = r.scale;
                      return [a, 0, 0, a, o, i];
                    })(
                      [this.options.canvas.width, this.options.canvas.height],
                      this.options.viewport,
                      {
                        translateOrigin: this.options.translateOrigin,
                        viewportScale: this.options.viewportScale,
                        devicePixelScaling: this.options.devicePixelScaling
                      }
                    )),
                    (t = this.options.ctx).setTransform.apply(
                      t,
                      Ne(this.internals.transformationMatrix)
                    );
                }
              },
              {
                key: 'onRender',
                value: function(t) {
                  return (
                    this.options.clearCanvas && this.clear(),
                    this.options.viewportEdge &&
                      (this.options.ctx.save(),
                      (this.options.ctx.strokeStyle = 'rgb(229, 229, 229)'),
                      this.options.ctx.strokeRect(
                        this.options.translateOrigin
                          ? -this.options.viewport[0] / 2
                          : 0,
                        this.options.translateOrigin
                          ? -this.options.viewport[1] / 2
                          : 0,
                        this.options.viewport[0],
                        this.options.viewport[1]
                      ),
                      this.options.ctx.restore()),
                    this.options.renderFunction.call(
                      this,
                      t,
                      this.options.canvas,
                      this.options.ctx,
                      this
                    )
                  );
                }
              },
              {
                key: 'onEnd',
                value: function() {
                  this.options.ctx && this.options.ctx.restore();
                }
              },
              {
                key: 'onEpilogue',
                value: function() {
                  delete this.options.ctx, delete this.options.canvas;
                }
              },
              {
                key: 'clear',
                value: function() {
                  this.options.ctx.save(),
                    this.options.ctx.setTransform(1, 0, 0, 1, 0, 0),
                    this.options.ctx.clearRect(
                      0,
                      0,
                      this.options.canvas.width,
                      this.options.canvas.height
                    ),
                    this.options.ctx.restore();
                }
              },
              {
                key: 'transform',
                value: function(t) {
                  if (!this.internals.transformationMatrix)
                    throw new Error('No transformation matrix set');
                  return Me(this.internals.transformationMatrix, t);
                }
              },
              {
                key: 'transformCanvasEvent',
                value: function(t) {
                  var n = t.offsetX,
                    e = t.offsetY;
                  return this.transform([n, e]);
                }
              }
            ]),
            Screen
          );
        })();
      Ke.metadata = {
        module: ['canvas'],
        nestedComponents: [],
        parsableOptions: {
          content: {
            type: 'array',
            content: {
              type: 'object',
              content: {
                text: {},
                fill: {},
                stroke: {},
                left: { type: 'number' },
                top: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                angle: { type: 'number' },
                src: {}
              }
            }
          }
        }
      };
      var Qe = (function(t) {
        function Frame() {
          var t,
            n =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : {};
          return (
            De(this, Frame),
            (t = ze(
              this,
              qe(Frame).call(this, Je(He({ context: '<canvas></canvas>' }, n)))
            )).options.handMeDowns.includes('canvas') ||
              t.options.handMeDowns.push('canvas', 'devicePixelScaling'),
            t
          );
        }
        return (
          Ge(Frame, ke),
          Ue(Frame, [
            {
              key: 'onPrepare',
              value: (function() {
                var t = Le(
                  regeneratorRuntime.mark(function t() {
                    var n,
                      e = this;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              if (
                                kn(
                                  this,
                                  function(t, n) {
                                    return (
                                      t &&
                                      (n === e ||
                                        n instanceof Ke ||
                                        n instanceof ce ||
                                        n instanceof fe ||
                                        n instanceof le)
                                    );
                                  },
                                  !0
                                )
                              ) {
                                t.next = 4;
                                break;
                              }
                              throw new Error(
                                'CanvasFrame may only contain flow or canvas-based components'
                              );
                            case 4:
                              if (
                                ((n = new DOMParser()),
                                (this.internals.parsedContext = n.parseFromString(
                                  this.options.context,
                                  'text/html'
                                )),
                                (this.options.canvas = this.internals.parsedContext.querySelector(
                                  'canvas'
                                )),
                                this.options.canvas)
                              ) {
                                t.next = 9;
                                break;
                              }
                              throw new Error('No canvas found in context');
                            case 9:
                              return (
                                (this.options.content.options.el =
                                  null === this.options.canvas.parentElement ||
                                  'BODY' ===
                                    this.options.canvas.parentElement.tagName
                                    ? this.options.el
                                    : this.options.canvas.parentElement),
                                (this.internals.contentEndHandler = function() {
                                  return e.end();
                                }),
                                this.options.content.on(
                                  'after:end',
                                  this.internals.contentEndHandler
                                ),
                                Ye.apply(this),
                                (this.options.insertCanvasOnRun = !0),
                                (t.next = 16),
                                se([this.options.content], this)
                              );
                            case 16:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function() {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'onRun',
              value: (function() {
                var t = Le(
                  regeneratorRuntime.mark(function t(n, e) {
                    var r = this;
                    return regeneratorRuntime.wrap(
                      function(t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              return (
                                (this.options.el.innerHTML = ''),
                                Array.from(
                                  this.internals.parsedContext.body.children
                                ).forEach(function(t) {
                                  return r.options.el.appendChild(t);
                                }),
                                Xe.apply(this, [
                                  !1,
                                  this.options.canvas.parentElement
                                ]),
                                (t.next = 5),
                                this.options.content.run(n, e)
                              );
                            case 5:
                            case 'end':
                              return t.stop();
                          }
                      },
                      t,
                      this
                    );
                  })
                );
                return function(n, e) {
                  return t.apply(this, arguments);
                };
              })()
            },
            {
              key: 'onEpilogue',
              value: function() {
                delete this.options.canvas, delete this.internals.parsedContext;
              }
            }
          ]),
          Frame
        );
      })();
      Qe.metadata = { module: ['canvas'], nestedComponents: ['content'] };
      var fromObject = e(249),
        Ze = regeneratorRuntime.mark(function t() {
          var n,
            e,
            r,
            o,
            i,
            a,
            u = arguments;
          return regeneratorRuntime.wrap(
            function(t) {
              for (;;)
                switch ((t.prev = t.next)) {
                  case 0:
                    for (n = u.length, e = new Array(n), r = 0; r < n; r++)
                      e[r] = u[r];
                    (o = e
                      .map(function(t) {
                        return Math.max(t.length, 1);
                      })
                      .reverse()
                      .reduce(function(t, n, e) {
                        return t.concat([(t[e - 1] || 1) * n]);
                      }, [])
                      .reverse()),
                      (i = regeneratorRuntime.mark(function t(n) {
                        return regeneratorRuntime.wrap(
                          function(t) {
                            for (;;)
                              switch ((t.prev = t.next)) {
                                case 0:
                                  return (
                                    (t.next = 2),
                                    e.map(function(t, e) {
                                      return t[
                                        Math.floor(n / (o[e + 1] || 1)) %
                                          t.length
                                      ];
                                    })
                                  );
                                case 2:
                                case 'end':
                                  return t.stop();
                              }
                          },
                          t,
                          this
                        );
                      })),
                      (a = 0);
                  case 4:
                    if (!(a < o[0])) {
                      t.next = 9;
                      break;
                    }
                    return t.delegateYield(i(a), 't0', 6);
                  case 6:
                    a++, (t.next = 4);
                    break;
                  case 9:
                  case 'end':
                    return t.stop();
                }
            },
            t,
            this
          );
        }),
        tr = function(t) {
          return t.reduce(function(t, n) {
            return t + n;
          });
        },
        nr = function(t) {
          return tr(t) / t.length;
        },
        er = function(t) {
          return nr(
            t.map(function(n) {
              return Math.pow(n - nr(t), 2);
            })
          );
        };
      function rr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function or(t) {
        return (or =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(t) {
                return typeof t;
              }
            : function(t) {
                return t &&
                  'function' == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? 'symbol'
                  : typeof t;
              })(t);
      }
      var ir = function(t) {
          return (t.length > 80
            ? '<div class="labjs-debug-trunc">'.concat(
                t.substr(0, 100),
                '</div>'
              )
            : t
          ).replace(/,/g, ',&#8203;');
        },
        ar = function(t) {
          return '<td>'.concat(
            (function(t) {
              switch (or(t)) {
                case 'number':
                  return t > 150 ? t.toFixed(0) : t.toFixed(2);
                case 'string':
                  return ir(t);
                case 'undefined':
                  return '';
                case 'object':
                  if (fn()(t)) return ir(JSON.stringify(t));
                default:
                  return t;
              }
            })(t),
            '</td>'
          );
        },
        Debug = (function() {
          function Debug(t) {
            var n = t.filePrefix,
              e = void 0 === n ? 'study' : n;
            !(function(t, n) {
              if (!(t instanceof n))
                throw new TypeError('Cannot call a class as a function');
            })(this, Debug),
              (this.filePrefix = e);
          }
          return (
            (function(t, n, e) {
              n && rr(t.prototype, n), e && rr(t, e);
            })(Debug, [
              {
                key: 'handle',
                value: function(t, n) {
                  switch (n) {
                    case 'plugin:init':
                      return this.onInit(t);
                    case 'prepare':
                      return this.onPrepare();
                    default:
                      return null;
                  }
                }
              },
              {
                key: 'onInit',
                value: function(t) {
                  var n = this;
                  (this.isVisible = !1),
                    (this.context = t),
                    (this.container = document.createElement('div')),
                    (this.container.id = 'labjs-debug'),
                    (this.container.innerHTML =
                      '<style type="text/css">\n  .labjs-debug-opener {\n    font-size: 1.2rem;\n    color: #8d8d8d;\n    /* Box formatting */\n    width: 40px;\n    height: 32px;\n    padding: 6px 8px;\n    border-radius: 3px;\n    border: 1px solid #e5e5e5;\n    z-index: 3;\n    background-color: white;\n    /* Fixed position */\n    position: fixed;\n    bottom: 36px;\n    right: -5px;\n    /* Content centering */\n    display: flex;\n    align-items: center;\n    justify-content: left;\n  }\n\n  .labjs-debug-toggle {\n    cursor: pointer;\n  }\n\n  body.labjs-debugtools-visible .labjs-debug-opener {\n    display: none;\n  }\n\n  .labjs-debug-overlay {\n    font-family: "Arial", sans-serif;\n    color: black;\n    /* Box formatting */\n    width: 100vw;\n    height: 30vh;\n    position: fixed;\n    bottom: 0;\n    left: 0;\n    z-index: 2;\n    background-color: white;\n    border-top: 2px solid #e5e5e5;\n    display: none;\n    overflow: scroll;\n  }\n\n  #labjs-debug.labjs-debug-large .labjs-debug-overlay {\n    height: 100vh;\n  }\n\n  .labjs-debug-overlay-menu {\n    font-size: 0.8rem;\n    color: #8d8d8d;\n    padding: 8px 12px 6px;\n    border-bottom: 1px solid #e5e5e5;\n  }\n\n  .labjs-debug-overlay-menu a {\n    color: #8d8d8d;\n  }\n\n  .labjs-debug-overlay-menu .pull-right {\n    font-size: 1rem;\n    float: right;\n  }\n\n  body.labjs-debugtools-visible .labjs-debug-overlay {\n    display: block;\n  }\n\n  .labjs-debug-overlay-contents {\n    padding: 12px;\n  }\n\n  .labjs-debug-overlay-contents table {\n    font-size: 0.8rem;\n  }\n\n  .labjs-debug-overlay-contents table tr.labjs-debug-state {\n    background-color: #f8f8f8;\n  }\n\n  /* Truncated cells */\n  .labjs-debug-trunc {\n    min-width: 200px;\n    max-width: 400px;\n  }\n  .labjs-debug-trunc::after {\n    content: "...";\n    opacity: 0.5;\n  }\n</style>\n<div class="labjs-debug-opener labjs-debug-toggle"><div>≡</div></div>\n<div class="labjs-debug-overlay">\n  <div class="labjs-debug-overlay-menu">\n    <div class="pull-right">\n      <span class="labjs-debug-toggle">&times;</span>\n    </div>\n    <code>lab.js</code> ·\n    data preview ·\n    <a href="#" class="labjs-debug-data-download">download csv</a>\n  </div>\n  <div class="labjs-debug-overlay-contents">\n    Contents\n  </div>\n</div>'),
                    Array.from(
                      this.container.querySelectorAll('.labjs-debug-toggle')
                    ).forEach(function(t) {
                      return t.addEventListener('click', function() {
                        return n.toggle();
                      });
                    }),
                    this.container
                      .querySelector('.labjs-debug-overlay-menu')
                      .addEventListener('dblclick', function() {
                        return n.container.classList.toggle(
                          'labjs-debug-large'
                        );
                      }),
                    this.container
                      .querySelector('.labjs-debug-data-download')
                      .addEventListener('click', function(e) {
                        e.preventDefault(),
                          n.context.options.datastore
                            ? n.context.options.datastore.download(
                                'csv',
                                t.options.datastore.makeFilename(
                                  n.filePrefix,
                                  'csv'
                                )
                              )
                            : alert('No datastore to download from');
                      }),
                    document.body.appendChild(this.container);
                }
              },
              {
                key: 'onPrepare',
                value: function() {
                  var t = this;
                  this.context.options.datastore &&
                    (this.context.options.datastore.on('set', function() {
                      return t.render();
                    }),
                    this.context.options.datastore.on('commit', function() {
                      return t.render();
                    }),
                    this.context.options.datastore.on('update', function() {
                      return t.render();
                    }));
                }
              },
              {
                key: 'toggle',
                value: function() {
                  (this.isVisible = !this.isVisible),
                    this.render(),
                    document.body.classList.toggle('labjs-debugtools-visible');
                }
              },
              {
                key: 'render',
                value: function() {
                  var t;
                  this.isVisible &&
                    ((t = this.context.options.datastore
                      ? (function(t) {
                          var n = t.keys(!0),
                            e = n.map(function(t) {
                              return '<th>'.concat(t, '</th>');
                            }),
                            r = n.map(function(n) {
                              return ar(t.state[n]);
                            }),
                            o = t.data
                              .slice()
                              .reverse()
                              .map(function(t) {
                                return '<tr> '.concat(
                                  n
                                    .map(function(n) {
                                      return ar(t[n]);
                                    })
                                    .join(''),
                                  ' </tr>'
                                );
                              });
                          return '\n    <table>\n      <tr>'
                            .concat(
                              e.join('\n'),
                              '</tr>\n      <tr class="labjs-debug-state">'
                            )
                            .concat(r.join('\n'), '</tr>\n      ')
                            .concat(o.join('\n'), '\n    </table>\n  ');
                        })(this.context.options.datastore)
                      : (function(t) {
                          return '\n  <div style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;">\n    '.concat(
                            t,
                            '\n  </div>'
                          );
                        })('No data store found in component')),
                    (this.container.querySelector(
                      '.labjs-debug-overlay-contents'
                    ).innerHTML = t));
                }
              }
            ]),
            Debug
          );
        })();
      function ur(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var sr = function(t) {
          var n = 'Are you sure you want to close this window?';
          return (t.returnValue = n), n;
        },
        Download = (function() {
          function Download(t) {
            var n = t.filePrefix,
              e = t.fileType;
            !(function(t, n) {
              if (!(t instanceof n))
                throw new TypeError('Cannot call a class as a function');
            })(this, Download),
              (this.el = null),
              (this.filePrefix = n || 'study'),
              (this.fileType = e || 'csv');
          }
          return (
            (function(t, n, e) {
              n && ur(t.prototype, n), e && ur(t, e);
            })(Download, [
              {
                key: 'handle',
                value: function(t, n) {
                  var e = this;
                  'end' === n &&
                    t.options.datastore &&
                    (window.addEventListener('beforeunload', sr),
                    (this.el = document.createElement('div')),
                    (this.el.className = 'popover'),
                    (this.el.innerHTML =
                      '\n        <div class="alert text-center">\n          <strong>Download data</strong>\n        </div>\n      '),
                    this.el.addEventListener('click', function() {
                      t.options.datastore.download(
                        e.fileType,
                        t.options.datastore.makeFilename(
                          e.filePrefix,
                          e.fileType
                        )
                      ),
                        window.removeEventListener('beforeunload', sr);
                    }),
                    t.options.el.prepend(this.el));
                }
              }
            ]),
            Download
          );
        })();
      function cr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var Logger = (function() {
        function Logger(t) {
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, Logger),
            (this.title = t.title);
        }
        return (
          (function(t, n, e) {
            n && cr(t.prototype, n), e && cr(t, e);
          })(Logger, [
            {
              key: 'handle',
              value: function(t, n) {
                console.log(
                  'Component '.concat(this.title, ' received ').concat(n)
                );
              }
            }
          ]),
          Logger
        );
      })();
      e(194);
      function fr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      function lr(t, n) {
        return (
          (function(t) {
            if (Array.isArray(t)) return t;
          })(t) ||
          (function(t, n) {
            var e = [],
              r = !0,
              o = !1,
              i = void 0;
            try {
              for (
                var a, u = t[Symbol.iterator]();
                !(r = (a = u.next()).done) &&
                (e.push(a.value), !n || e.length !== n);
                r = !0
              );
            } catch (t) {
              (o = !0), (i = t);
            } finally {
              try {
                r || null == u.return || u.return();
              } finally {
                if (o) throw i;
              }
            }
            return e;
          })(t, n) ||
          (function() {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance'
            );
          })()
        );
      }
      var Metadata = (function() {
        function Metadata() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, Metadata),
            (this.options = t);
        }
        return (
          (function(t, n, e) {
            n && fr(t.prototype, n), e && fr(t, e);
          })(Metadata, [
            {
              key: 'handle',
              value: function(t, n) {
                if ('prepare' === n) {
                  var e = (function(t) {
                    return an()(
                      window.URLSearchParams
                        ? Array.from(new URLSearchParams(t).entries())
                        : t
                            .substr(1)
                            .split('&')
                            .map(function(t) {
                              return t.split('=', 2);
                            })
                            .map(function(t) {
                              var n = lr(t, 2),
                                e = n[0],
                                r = n[1];
                              return [
                                e,
                                decodeURIComponent(r).replace('+', ' ')
                              ];
                            })
                    );
                  })(this.options.location_search || window.location.search);
                  t.options.datastore.set({
                    url: e,
                    meta: (function() {
                      var t = window.Intl.DateTimeFormat().resolvedOptions();
                      return {
                        labjs_version: Sr,
                        labjs_build: _r,
                        location: window.location.href,
                        userAgent: window.navigator.userAgent,
                        platform: window.navigator.platform,
                        language: window.navigator.language,
                        locale: t.locale,
                        timeZone: t.timeZone,
                        timezoneOffset: new Date().getTimezoneOffset(),
                        screen_width: window.screen.width,
                        screen_height: window.screen.height,
                        scroll_width: document.body.scrollWidth,
                        scroll_height: document.body.scrollHeight,
                        window_innerWidth: window.innerWidth,
                        window_innerHeight: window.innerHeight,
                        devicePixelRatio: window.devicePixelRatio
                      };
                    })()
                  });
                }
              }
            }
          ]),
          Metadata
        );
      })();
      function pr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var hr = function(t) {
          var n = 'Closing this window will abort the study. Are you sure?';
          return (t.returnValue = n), n;
        },
        dr = (function() {
          function t() {
            !(function(t, n) {
              if (!(t instanceof n))
                throw new TypeError('Cannot call a class as a function');
            })(this, t);
          }
          return (
            (function(t, n, e) {
              n && pr(t.prototype, n), e && pr(t, e);
            })(t, [
              {
                key: 'handle',
                value: function(t, n) {
                  'prepare' === n
                    ? window.addEventListener('beforeunload', hr)
                    : 'end' === n &&
                      window.removeEventListener('beforeunload', hr);
                }
              }
            ]),
            t
          );
        })();
      function vr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var yr = (function() {
        function t(n) {
          var e = n.origin,
            r = n.target;
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, t),
            (this.origin = e || '*'),
            (this.target = r || parent);
        }
        return (
          (function(t, n, e) {
            n && vr(t.prototype, n), e && vr(t, e);
          })(t, [
            {
              key: 'handle',
              value: function(t, n) {
                'epilogue' === n &&
                  this.target.postMessage(
                    {
                      type: 'labjs.data',
                      metadata: { payload: 'full', url: window.location.href },
                      raw: t.options.datastore.data,
                      json: t.options.datastore.exportJson(),
                      csv: t.options.datastore.exportCsv()
                    },
                    this.origin
                  );
              }
            }
          ]),
          t
        );
      })();
      function gr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var mr = (function() {
        function t() {
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, t);
        }
        return (
          (function(t, n, e) {
            n && gr(t.prototype, n), e && gr(t, e);
          })(t, [
            {
              key: 'handle',
              value: function(t, n) {
                if ('after:end' === n && t.options.datastore) {
                  var e = document.querySelector('form[name="labjs-data"]');
                  try {
                    var r =
                      new ClipboardEvent('').clipboardData ||
                      new DataTransfer();
                    r.items.add(
                      new File([t.options.datastore.exportCsv()], 'data.csv')
                    ),
                      (e.elements.dataFile.files = r.files);
                  } catch (n) {
                    console.log(
                      "Couldn't append data file to form falling back to direkt insertion. Error was",
                      n
                    ),
                      (e.elements.dataRaw.value = t.options.datastore.exportCsv());
                  }
                  e.submit();
                }
              }
            }
          ]),
          t
        );
      })();
      function br(t) {
        for (var n = 1; n < arguments.length; n++) {
          var e = null != arguments[n] ? arguments[n] : {},
            r = Object.keys(e);
          'function' == typeof Object.getOwnPropertySymbols &&
            (r = r.concat(
              Object.getOwnPropertySymbols(e).filter(function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable;
              })
            )),
            r.forEach(function(n) {
              wr(t, n, e[n]);
            });
        }
        return t;
      }
      function wr(t, n, e) {
        return (
          n in t
            ? Object.defineProperty(t, n, {
                value: e,
                enumerable: !0,
                configurable: !0,
                writable: !0
              })
            : (t[n] = e),
          t
        );
      }
      function xr(t, n) {
        for (var e = 0; e < n.length; e++) {
          var r = n[e];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(t, r.key, r);
        }
      }
      var Or = (function() {
        function Transmit() {
          var t =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          !(function(t, n) {
            if (!(t instanceof n))
              throw new TypeError('Cannot call a class as a function');
          })(this, Transmit),
            (this.url = t.url),
            (this.metadata = t.metadata || {}),
            (this.metadata.id = this.metadata.id || nn()),
            (this.updates = {
              incremental: !(t.updates && !1 === t.updates.incremental),
              full: !(t.updates && !1 === t.updates.full)
            }),
            (this.callbacks = t.callbacks || {}),
            (this.headers = t.headers || {}),
            (this.encoding = t.encoding || 'json');
        }
        return (
          (function(t, n, e) {
            n && xr(t.prototype, n), e && xr(t, e);
          })(Transmit, [
            {
              key: 'handle',
              value: function(t, n) {
                var e = this,
                  r = this.url,
                  o = this.metadata;
                switch (n) {
                  case 'prepare':
                    this.updates.incremental &&
                      t.options.datastore.on('idle', function() {
                        this.queueIncrementalTransmission(
                          r,
                          br({}, o, { payload: 'incremental' }),
                          { headers: this.headers, encoding: this.encoding }
                        );
                      }),
                      this.callbacks.setup && this.callbacks.setup.call(this);
                    break;
                  case 'epilogue':
                    this.updates.full &&
                      t.options.datastore
                        .transmit(r, br({}, o, { payload: 'full' }), {
                          headers: this.headers,
                          encoding: this.encoding
                        })
                        .then(function(n) {
                          return (
                            e.updates.incremental &&
                              t.options.datastore.flushIncrementalTransmissionQueue(),
                            n
                          );
                        })
                        .then(this.callbacks.full);
                }
              }
            }
          ]),
          Transmit
        );
      })();
      e.d(n, 'version', function() {
        return Sr;
      }),
        e.d(n, 'build', function() {
          return _r;
        }),
        e.d(n, 'core', function() {
          return jr;
        }),
        e.d(n, 'canvas', function() {
          return kr;
        }),
        e.d(n, 'html', function() {
          return Er;
        }),
        e.d(n, 'flow', function() {
          return Pr;
        }),
        e.d(n, 'plugins', function() {
          return Ar;
        }),
        e.d(n, 'data', function() {
          return Tr;
        }),
        e.d(n, 'util', function() {
          return Rr;
        });
      var Sr = '19.1.0',
        _r = {
          flavor: 'legacy',
          commit: 'e5bb8ebd18a874cbe66989c246f834e910d913c2'
        },
        jr = { Component: Wn, Dummy: Dummy },
        kr = { Frame: Qe, Screen: Ke },
        Er = { Screen: je, Form: Form, Frame: ke },
        Pr = { Sequence: ce, Parallel: le, Loop: fe },
        Ar = {
          Debug: Debug,
          Download: Download,
          Logger: Logger,
          Metadata: Metadata,
          NavigationGuard: dr,
          PostMessage: yr,
          Submit: mr,
          Transmit: Or
        },
        Tr = { Store: X },
        Rr = {
          Random: rn,
          fromObject: fromObject.a,
          canvas: { makeRenderFunction: Fe, toRadians: Ee, transform: Me },
          combinatorics: { product: Ze },
          events: {
            logTimestamp: function(t) {
              return function(n) {
                n.preventDefault(), (this.data[t] = ht(n.timeStamp));
              };
            }
          },
          fullscreen: {
            launch: function(t) {
              return t.requestFullscreen
                ? t.requestFullscreen()
                : t.mozRequestFullScreen
                ? t.mozRequestFullScreen()
                : t.webkitRequestFullscreen
                ? t.webkitRequestFullscreen()
                : t.msRequestFullscreen
                ? t.msRequestFullscreen()
                : void 0;
            },
            exit: function() {
              return document.exitFullscreen
                ? document.exitFullscreen()
                : document.mozCancelFullScreen
                ? document.mozCancelFullScreen()
                : document.webkitExitFullscreen
                ? document.webkitExitFullscreen()
                : void 0;
            }
          },
          geometry: {
            polygon: function(t, n) {
              var e =
                  arguments.length > 2 && void 0 !== arguments[2]
                    ? arguments[2]
                    : [0, 0],
                r =
                  arguments.length > 3 && void 0 !== arguments[3]
                    ? arguments[3]
                    : 0;
              return Yt()(t).map(function(o) {
                return Pe(t, n, o, e, r);
              });
            },
            polygonVertex: Pe,
            toRadians: Ee
          },
          stats: {
            sum: tr,
            mean: nr,
            variance: er,
            std: function(t) {
              return Math.sqrt(er(t));
            }
          },
          timing: { FrameTimeout: gt },
          tree: { traverse: jn, reduce: kn }
        };
    }
  ]);
});
//# sourceMappingURL=lab.legacy.js.map
