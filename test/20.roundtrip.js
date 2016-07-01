#!/usr/bin/env mocha -R spec

var assert = require("assert");
var msgpackJS = "../index";
var isBrowser = ("undefined" !== typeof window);
var Map = isBrowser && window.Map || global.Map;
var msgpack = isBrowser && window.msgpack || require(msgpackJS);
var TITLE = __filename.replace(/^.*\//, "");

var STRING_ASCII = "a";
var STRING_GREEK = "α";
var STRING_ASIAN = "亜";

// 128K characters
for (var i = 0; i < 17; i++) {
  STRING_ASCII = STRING_ASCII + STRING_ASCII;
  STRING_GREEK = STRING_GREEK + STRING_GREEK;
  STRING_ASIAN = STRING_ASIAN + STRING_ASIAN;
}

function pattern(min, max, offset) {
  var array = [];
  var check = {};
  var val = min - 1;
  while (val <= max) {
    if (min <= val && !check[val]) array.push(val);
    check[val++] = 1;
    if (val <= max && !check[val]) array.push(val);
    check[val++] = 1;
    if (val <= max && !check[val]) array.push(val);
    check[val--] = 1;
    val = val ? val * 2 - 1 : 1;
  }
  return array;
}

describe(TITLE, function() {

  it("null", function() {
    [null, undefined].forEach(function(value) {
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("boolean", function() {
    [true, false].forEach(function(value) {
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("positive int (small)", function() {
    pattern(0, 0x40000000).forEach(function(value) {
      value = value | 0; // integer
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("positive int (large)", function() {
    pattern(0x40000000, 0xFFFFFFFF).forEach(function(value) {
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("negative int (small)", function() {
    pattern(0, 0x40000000).forEach(function(value) {
      value = -value | 0; // integer
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("negative int (large)", function() {
    pattern(0x40000000, 0xFFFFFFFF).forEach(function(value) {
      value = -value;
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("float", function() {
    [1.1, 10.01, 100.001, 1000.0001, 10000.00001, 100000.000001, 1000000.0000001].forEach(function(value) {
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("string (ASCII)", function() {
    this.timeout(30000);
    pattern(0, 65537).forEach(function(length) {
      var value = STRING_ASCII.substr(0, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("string (GREEK)", function() {
    this.timeout(30000);
    pattern(0, 65537).forEach(function(length) {
      var value = STRING_GREEK.substr(0, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("string (ASIAN)", function() {
    this.timeout(30000);
    pattern(0, 65537).forEach(function(length) {
      var value = STRING_ASIAN.substr(0, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded, value);
    });
  });

  it("array (small)", function() {
    pattern(0, 257).forEach(function(length, idx) {
      var value = new Array(length);
      for (var i = 0; i < length; i++) {
        value[i] = String.fromCharCode(i);
      }
      assert.equal(value.length, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded.length, length);
      assert.equal(decoded[0], value[0]);
      assert.equal(decoded[length - 1], value[length - 1]);
    });
  });

  it("array (large)", function() {
    this.timeout(30000);
    pattern(0, 65537).forEach(function(length) {
      var value = new Array(length);
      assert.equal(value.length, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded.length, length);
      assert.equal(decoded[0], value[0]);
      assert.equal(decoded[length - 1], value[length - 1]);
    });
  });

  it("object map (small)", function() {
    pattern(0, 257).forEach(function(length) {
      var value = {};
      for (var i = 0; i < length; i++) {
        var key = String.fromCharCode(i);
        value[key] = length;
      }
      assert.equal(Object.keys(value).length, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(Object.keys(decoded).length, length);
      assert.equal(decoded[0], value[0]);
      assert.equal(decoded[length - 1], value[length - 1]);
    });
  });

  it("object map (large)", function() {
    this.timeout(30000);
    pattern(65536, 65537).forEach(function(length) {
      var value = {};
      for (var i = 0; i < length; i++) {
        value[i] = length;
      }
      assert.equal(Object.keys(value).length, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(Object.keys(decoded).length, length);
      assert.equal(decoded[0], value[0]);
      assert.equal(decoded[length - 1], value[length - 1]);
    });
  });

  it("Map (small)", function() {
    pattern(0, 257).forEach(function(length) {
      var value = new Map();
      assert.equal(true, value instanceof Map);
      for (var i = 0; i < length; i++) {
        var key = String.fromCharCode(i);
        value.set(key, length);
      }
      assert.equal(value.size, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded, {"usemap": true});
      assert.equal(true, decoded instanceof Map);
      assert.equal(decoded.size, length);
      assert.equal(decoded.get(String.fromCharCode(0)), value.get(String.fromCharCode(0)));
      assert.equal(decoded.get(String.fromCharCode(length - 1)), value.get(String.fromCharCode(length - 1)));
    });
  });

  it("Map (large)", function() {
    this.timeout(30000);
    pattern(65536, 65537).forEach(function(length) {
      var value = new Map();
      for (var i = 0; i < length; i++) {
        value.set(i, length);
      }
      assert.equal(value.size, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded, {"usemap": true});
      assert.equal(decoded.size, length);
      assert.equal(decoded.get(0), value.get(0));
      assert.equal(decoded.get(length - 1), value.get(length - 1));
    });
  });

  it("buffer", function() {
    this.timeout(30000);
    pattern(2, 65537).forEach(function(length, idx) {
      var value = new Buffer(length);
      value.fill(idx);
      assert.equal(value.length, length);
      var encoded = msgpack.encode(value);
      var decoded = msgpack.decode(encoded);
      assert.equal(decoded.length, length);
      assert.equal(decoded[0], value[0]);
      assert.equal(decoded[length - 1], value[length - 1]);
    });
  });
});
