// based off of http://www.timdown.co.uk/jshashtable/

var Type = require('type-of-is');

var _hash = function (obj) {
  var hash;

  if (Type(obj, String)) {
    hash = obj;
  } else if (Type(obj.hash, Function)) {
    hash = obj.hash();
    if (!Type(hash, String)) {
      hash = _hash(hash);
    }
  } else {
    hash = obj.toString();
  }

  return hash;
}

function PamHsah (args) {
  this._buckets = [];
  this._lookup  = {};

  this._hash        = _hash;
  this._replace_key = true;

  var _this = this;
  ['equals', 'hash', 'replace_key'].forEach(function (k) {
    if (args && args.hasOwnProperty(k)) {
      _this['_' + k] = args[k];
    }
  });
};

PamHsah.prototype.put = function () {
  var args = Array.prototype.slice.call(arguments);
  var key, value;

  if (args.length == 2) {
    key   = args[0];
    value = args[1];
  } else {
    key   = args[0].key;
    value = args[0].value;
  }

  var hash   = this._hash(key);
  var bucket = this._getBucket(hash);
  
  if (bucket) {
    var entry = this._getEntry({
      key    : key,
      bucket : bucket
    });

    if (entry) {
      if (this._replace_key) {
          entry[0] = key;
      }
      var old_value = entry[1];
      entry[1] = value;
      return old_value;
    
    } else {
      this._addEntry({
        bucket : bucket,
        key    : key,
        value  : value
      });
    }

  } else {
    var bucket = this._addBucket(hash);
    this._addEntry({
      bucket : bucket,
      key    : key,
      value  : value
    });
  }
};

PamHsah.prototype.get = function (key) {
  var hash   = this._hash(key);
  var bucket = this._getBucket(hash);

  if (bucket) {
    var entry = this._getEntry({
      key    : key,
      bucket : bucket
    });

    if (entry) {
      return entry[1];
    }
  }

  return null;
};

PamHsah.prototype.remove = function(key) {
  var hash = this._hash(key);

  var old_value = null;

  var bucket = this._getBucket(hash);
  if (bucket) {
    old_value = this._removeEntry({
      bucket : bucket,
      key    : key
    });

    if (!!old_value) {
      var entries = bucket[1];
      if (entries.length == 0) {
        var index = this._bucketIndex(hash);
        this._buckets.splice(index, 1);
        delete this._lookup[hash];
      }
    }
  }

  return old_value;
};

PamHsah.prototype.hasKey = function (key) {
  var hash = this._hash(key);

  var bucket = this._getBucket(hash);
  var test   = this._keyTest(key);

  var result = this._findEntry({
    bucket : bucket,
    test   : test
  });

  return !!result;
};

PamHsah.prototype.hasValue = function (value) {
  var test = this._valueTest(value);
  var i    = this._buckets.length;

  while (i--) {
    var bucket  = this._buckets[i];
    var entries = bucket[1];

    var result = this._findEntry({
      bucket : bucket,
      test   : test
    });

    if (result) {
      return true;
    }
  }

  return false;
};

PamHsah.prototype.keys = function () { 
  return this._map('key');
};

PamHsah.prototype.values = function () { 
  return this._map('value');
};

PamHsah.prototype.entries = function () { 
  return this._map('entry');
};

PamHsah.prototype.size = function() {
  var total = 0;
  var i = this._buckets.length;

  while (i--) {
    var bucket  = this._buckets[i];
    var entries = bucket[1];
    total += entries.length;
  }
  return total;
};

PamHsah.prototype.clear = function () {
  this._buckets.length = 0;
  this._lookup = {};
};

PamHsah.prototype.isEmpty = function() {
  return (this._buckets.length === 0);
};

PamHsah.prototype.each = function(callback) {
  this.entries().forEach(callback);
};

// keys, values, entries

PamHsah.prototype._addBucket = function (hash) {
  var entries = [];
  var bucket  = [hash, entries];

  this._buckets.push(bucket);
  this._lookup[hash] = bucket;

  return bucket;
};

PamHsah.prototype._getBucket = function (hash) {
  var bucket = this._lookup[hash];
  return bucket ? bucket : null;
};

PamHsah.prototype._bucketIndex = function (hash) {
  var i = this._buckets.length;

  while (i--) {
    var bucket = this._buckets[i];
    if (hash === bucket[0]) {
      return i;
    }
  }
  return -1;
};

PamHsah.prototype._addEntry = function (args) {
  var bucket = args.bucket;
  var key    = args.key;
  var value  = args.value;

  var entry   = [key, value];
  var entries = bucket[1];
  entries.push(entry);
};

PamHsah.prototype._getEntry = function (args) {
  var bucket = args.bucket;
  var test   = this._keyTest(args.key);

  var result = this._findEntry({
    bucket : bucket,
    test   : test
  });

  if (result) { 
    result = result.entry;
  }
  return result;
};

PamHsah.prototype._removeEntry = function (args) {
  var bucket = args.bucket;
  var test   = this._keyTest(args.key);

  var result = this._findEntry({
    bucket : bucket,
    test   : test
  });

  var entry = result.entry;
  var index = result.index;

  var entries = bucket[1];

  if (result) {
    entries.splice(index, 1);
    return entry[1];
  }
  return null;
}

PamHsah.prototype._keyTest = function (key) {
  var _this = this;
  return function (entry) {
    return _this._equals.call(_this, key, entry[0]);
  }
};

PamHsah.prototype._valueTest = function (value) {
  return function (entry) {
    return (value === entry[1]);
  }
};

PamHsah.prototype._findEntry = function (args) {
  var bucket = args.bucket;
  var test   = args.test;

  if (!bucket) {
    return null;
  }

  var entries = bucket[1];
  var _this   = this;

  var i = entries.length;
  while (i--) {
    var entry = entries[i];
    if (test(entry)) { 
      return {
        entry : entry,
        index : i
      };
    }
  } 
  return null;
};

PamHsah.prototype._equals = function (a, b) {
  var both_have_equals = [a, b].every(function (x) {
    return Type(x.equals, Function);
  });

  if (both_have_equals) {
    return a.equals(b);
  } else {
    return (a === b);
  }
};

PamHsah.prototype._map = function (attr) {
  var i = this._buckets.length;

  var results = [];

  while (i--) {
    var bucket  = this._buckets[i];
    var entries = bucket[1];

    entries.forEach(function(entry) {
      var result;
      if (attr === 'key') {
        result = entry[0];
      } else if (attr === 'value') {
        result = entry[1];
      } else {
        result = entry.slice(0);
      }
      results.push(result);
    });
  }

  return results;
};

module.exports = PamHsah;