var test = require('tape');
var infovyz = require('../build/infovyz');

test('version matches package.json', function(t) {
  t.equal(infovyz.version, require('../package.json').version);
  t.end();
});
