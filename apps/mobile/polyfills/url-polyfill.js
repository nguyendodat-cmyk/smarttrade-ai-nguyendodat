/**
 * SmartTrade AI - Polyfills for React Native
 * v1.5.1 - Support both Hermes and JSC engines
 */

(function() {
  'use strict';

  if (typeof global === 'undefined') return;

  // 1. BigInt polyfill for JSC
  if (typeof global.BigInt === 'undefined') {
    var bigInt = require('big-integer');
    global.BigInt = function(value) {
      return bigInt(value);
    };
  }

  // 2. SharedArrayBuffer
  if (typeof global.SharedArrayBuffer === 'undefined') {
    global.SharedArrayBuffer = ArrayBuffer;
  }

  // 2. URLSearchParams (needed for URL.searchParams)
  var URLSearchParamsImpl = function(init) {
    this._entries = [];

    if (typeof init === 'string') {
      var query = init.charAt(0) === '?' ? init.substring(1) : init;
      if (query) {
        var pairs = query.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          var key = decodeURIComponent(pair[0] || '');
          var value = decodeURIComponent(pair[1] || '');
          this._entries.push([key, value]);
        }
      }
    } else if (init && typeof init === 'object') {
      if (init._entries) {
        for (var j = 0; j < init._entries.length; j++) {
          this._entries.push([init._entries[j][0], init._entries[j][1]]);
        }
      } else {
        var keys = Object.keys(init);
        for (var k = 0; k < keys.length; k++) {
          this._entries.push([keys[k], String(init[keys[k]])]);
        }
      }
    }
  };

  URLSearchParamsImpl.prototype.append = function(key, value) {
    this._entries.push([String(key), String(value)]);
  };

  URLSearchParamsImpl.prototype.delete = function(key) {
    var newEntries = [];
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] !== key) {
        newEntries.push(this._entries[i]);
      }
    }
    this._entries = newEntries;
  };

  URLSearchParamsImpl.prototype.get = function(key) {
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === key) {
        return this._entries[i][1];
      }
    }
    return null;
  };

  URLSearchParamsImpl.prototype.getAll = function(key) {
    var result = [];
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === key) {
        result.push(this._entries[i][1]);
      }
    }
    return result;
  };

  URLSearchParamsImpl.prototype.has = function(key) {
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === key) {
        return true;
      }
    }
    return false;
  };

  URLSearchParamsImpl.prototype.set = function(key, value) {
    var found = false;
    var newEntries = [];
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === key) {
        if (!found) {
          newEntries.push([key, String(value)]);
          found = true;
        }
      } else {
        newEntries.push(this._entries[i]);
      }
    }
    if (!found) {
      newEntries.push([key, String(value)]);
    }
    this._entries = newEntries;
  };

  URLSearchParamsImpl.prototype.toString = function() {
    var pairs = [];
    for (var i = 0; i < this._entries.length; i++) {
      pairs.push(
        encodeURIComponent(this._entries[i][0]) + '=' +
        encodeURIComponent(this._entries[i][1])
      );
    }
    return pairs.join('&');
  };

  URLSearchParamsImpl.prototype.forEach = function(callback, thisArg) {
    for (var i = 0; i < this._entries.length; i++) {
      callback.call(thisArg, this._entries[i][1], this._entries[i][0], this);
    }
  };

  // Set global URLSearchParams
  global.URLSearchParams = URLSearchParamsImpl;

  // 3. CRITICAL: Patch URL.prototype to add searchParams getter
  // This affects ALL URL instances, even if code captured URL reference early
  var NativeURL = global.URL;

  if (NativeURL && NativeURL.prototype) {
    // Check if searchParams is already defined and working
    var needsPatch = true;
    try {
      var testUrl = new NativeURL('https://test.com?a=1');
      if (testUrl.searchParams && typeof testUrl.searchParams.get === 'function') {
        needsPatch = false;
      }
    } catch (e) {
      // URL doesn't work properly, need full replacement
    }

    if (needsPatch) {
      // Store searchParams on the instance using a WeakMap
      var searchParamsMap = new WeakMap();

      // Define searchParams getter on URL.prototype
      Object.defineProperty(NativeURL.prototype, 'searchParams', {
        get: function() {
          // Check if we already created searchParams for this instance
          var sp = searchParamsMap.get(this);
          if (!sp) {
            // Create new URLSearchParams from this.search
            var search = '';
            try {
              search = this.search || '';
            } catch (e) {
              search = '';
            }
            sp = new URLSearchParamsImpl(search);
            searchParamsMap.set(this, sp);
          }
          return sp;
        },
        configurable: true,
        enumerable: true
      });
    }
  } else {
    // No native URL, create full polyfill
    var URLPolyfill = function(url, base) {
      if (typeof url !== 'string') {
        url = String(url);
      }

      var fullUrl = url;

      if (base) {
        if (typeof base !== 'string') {
          base = String(base);
        }
        if (url.indexOf('://') === -1) {
          if (url.charAt(0) === '/') {
            var baseMatch = base.match(/^([a-z]+:\/\/[^\/]+)/i);
            if (baseMatch) {
              fullUrl = baseMatch[1] + url;
            }
          } else {
            fullUrl = base.replace(/\/[^\/]*$/, '/') + url;
          }
        }
      }

      var match = fullUrl.match(/^([a-z][a-z0-9+.-]*):\/\/(?:([^:@\/]*):?([^@\/]*)@)?([^:\/\?#]+)(?::(\d+))?(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i);

      if (match) {
        this.protocol = match[1] + ':';
        this.username = match[2] || '';
        this.password = match[3] || '';
        this.hostname = match[4] || '';
        this.port = match[5] || '';
        this.host = this.port ? this.hostname + ':' + this.port : this.hostname;
        this.pathname = match[6] || '/';
        this.search = match[7] || '';
        this.hash = match[8] || '';
        this.origin = this.protocol + '//' + this.host;
        this.href = fullUrl;
      } else {
        this.href = fullUrl;
        this.protocol = '';
        this.username = '';
        this.password = '';
        this.hostname = '';
        this.port = '';
        this.host = '';
        this.pathname = fullUrl;
        this.search = '';
        this.hash = '';
        this.origin = 'null';
      }

      this.searchParams = new URLSearchParamsImpl(this.search);
    };

    URLPolyfill.prototype.toString = function() {
      return this.href;
    };

    URLPolyfill.prototype.toJSON = function() {
      return this.href;
    };

    global.URL = URLPolyfill;
  }

})();
