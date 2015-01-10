var Assert = require('assert');

var PamHsah = require('./index');

module.exports = {
  "basic api operations" : function () {
    var hashmap = new PamHsah();
    
    var derp1 = { x : 10 };
    var derp2 = { y : 12 };
    var derp3 = { z : 200 };

    hashmap.put({
      key   : derp1,
      value : 101
    });

    hashmap.put(derp2, 12);
    
    Assert.equal(hashmap.hasKey(derp1), true);
    Assert.equal(hashmap.hasValue(101), true);

    Assert.equal(hashmap.hasKey(derp2), true);
    Assert.equal(hashmap.hasValue(12), true);

    Assert.equal(hashmap.hasKey(derp3), false);
    Assert.equal(hashmap.hasValue("BARF"), false);

    Assert.equal(hashmap.get(derp1), 101);
    Assert.equal(hashmap.get(derp2), 12);

    Assert.equal(hashmap.size(), 2);

    // haven't tested this stuff
    console.log(hashmap.keys());
    console.log(hashmap.values());
    console.log(hashmap.entries());
    hashmap.each(function () {});

    var derp2_val = hashmap.remove(derp2);
    Assert.equal(derp2_val, 12);

    Assert.equal(hashmap.hasKey(derp2), false);
    Assert.equal(hashmap.hasValue(12), false);
    Assert.equal(hashmap.size(), 1);

    Assert.equal(hashmap.isEmpty(), false);
    hashmap.clear()
    Assert.equal(hashmap.isEmpty(), true);
    Assert.equal(hashmap.size(), 0);
    Assert.equal(hashmap.hasKey(derp1), false);
  }
};