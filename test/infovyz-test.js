var test = require('tape');
var infovyz = require('../build/infovyz');
var d3 = require('d3');

test('version matches package.json', function(t) {
  t.equal(infovyz(d3).version, require('../package.json').version);
  t.end();
});
