var test = require('tape');
var d3 = require('d3');
d3.tile = require('d3-tile').tile;
var infovyz = require('../');

var map;

var width = 960;
var height = 500;
var body = d3.select('body')
  .attr('width', width)
  .attr('height', height);

test('initialize map().', function(t) {
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

test('map.panTo()', function(t) {
  map = infovyz.map(d3)('body');

  t.throws(function() {
    map.panTo();
  }, 'Call map.panTo() without location throws error.');

  t.throws(function() {
    map.panTo({});
  }, 'Call map.panTo() without valid location throws error.');

  // the following should work but doesn't because jsdom
  // doesn't support SVGElement.
  t.doesNotThrow(function() {
    map.panTo({
      longitude: 16.363449,
      latitude: 48.210033
    });
  }, 'Calling map.panTo() with valid location works.');

  t.end();
});
