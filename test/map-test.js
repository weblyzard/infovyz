var test = require('tape');
var jsdom = require('jsdom');
var d3 = require('d3');
d3.tile = require('d3-tile').tile;
var infovyz = require('../');

test('version test', function(t) {
  t.equal(infovyz.version, '1.0.0-beta.2', 'version is \'1.0.0-beta.2\'.');
  t.end();
});

test('initialize map().', function(t) {
  var document = global.document = jsdom.jsdom();
  var map;

  var width = 960;
  var height = 500;
  var body = d3.select('body')
    .attr('width', width)
    .attr('height', height);

  t.doesNotThrow(function() {
    map = infovyz.map(d3)('body');
  }, 'Initialize map and add to body tag.');

  t.equal(typeof map, 'function', 'map is of type function.');
  t.equal(typeof map.autozoom, 'function', 'map.autozoom is of type function.');
  t.equal(typeof map.transitionDuration, 'function', 'map.transitionDuration is of type function');

  t.ok(map.autozoom(), 'default map.autozoom() is true.');
  t.equal(map.transitionDuration(), 500, 'default transitionDuration is 500ms.');

  var svgSelection = d3.select('body svg');
  t.notOk(svgSelection.empty(), 'svg DOM element exists.');
  t.ok(svgSelection.classed('infovyz-map'), 'svg DOM element has class `infovyz-map`.');

  var tiles = svgSelection.select('g.tiles');
  t.notOk(tiles.empty(), 'DOM element g.tiles exists.');

  var overlay = svgSelection.select('g.overlay');
  t.notOk(overlay.empty(), 'DOM element g.overlay exists.');

  t.end();
});
