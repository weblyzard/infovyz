var test = require('tape');
var d3 = require('d3');
d3.tile = require('d3-tile').tile;
var infovyz = require('../build/infovyz')(d3);

var map;

var width = 960;
var height = 500;

d3.select('body')
  .append('div')
  .attr('id', 'map')
  .style('width', width + 'px')
  .style('height', height + 'px');

test('initialize map().', function(t) {
  t.doesNotThrow(function() {
    map = infovyz.map('#map');
  }, 'Initialize map and add to wrapper element.');

  t.equal(typeof map, 'function', 'map is of type function.');
  t.equal(typeof map.autozoom, 'function', 'map.autozoom is of type function.');
  t.equal(typeof map.interactive, 'function', 'map.autozoom is of type function.');
  t.equal(typeof map.transitionDuration, 'function', 'map.transitionDuration is of type function');

  t.ok(map.autozoom(), 'default map.autozoom() is true.');
  t.ok(map.interactive(), 'default map.interactive() is true.');
  t.equal(map.transitionDuration(), 500, 'default transitionDuration is 500ms.');

  var svgSelection = d3.select('#map svg');
  t.notOk(svgSelection.empty(), 'svg DOM element exists.');
  t.ok(svgSelection.classed('infovyz-map'), 'svg DOM element has class `infovyz-map`.');

  t.equal(svgSelection.attr('width'), width + '', 'svg DOM element width matches wrapper width.');
  t.equal(svgSelection.attr('height'), height + '', 'svg DOM element width matches wrapper width.');

  var tiles = svgSelection.select('g.tiles');
  t.notOk(tiles.empty(), 'DOM element g.tiles exists.');

  var overlay = svgSelection.select('g.overlay');
  t.notOk(overlay.empty(), 'DOM element g.overlay exists.');

  var legend = svgSelection.select('g.legend');
  t.notOk(legend.empty(), 'DOM element g.legend exists.');

  t.end();
});

test('map(...)', function(t) {
  map = infovyz.map('#map');

  t.doesNotThrow(function() {
    map();
  }, 'Calling map() without arguments.');

  t.doesNotThrow(function() {
    map([{
      id: 'Europe',
      longitude: 15.2551,
      latitude: 54.5260,
      value: 1
    }]);
  }, 'Calling map() with a proper location.');

  t.doesNotThrow(function() {
    map([{
      id: 'Europe',
      longitude: 15.2551,
      latitude: 54.5260
    }]);
  }, 'Calling map() without a value in the location.');

  t.throws(function() {
    map([{
      id: 1,
      longitude: 15.2551,
      latitude: 54.5260
    }]);
  }, 'Calling map() without an id as string in the location.');

  t.throws(function() {
    map([{
      id: 1,
      longitude: 100,
      latitude: 54.5260
    }]);
  }, 'Calling map() with invalid longitude.');

  t.throws(function() {
    map([{
      id: 1,
      longitude: 50,
      latitude: 200
    }]);
  }, 'Calling map() with invalid latidude.');

  t.throws(function() {
    map([{
      longitude: 15.2551,
      latitude: 54.5260
    }]);
  }, 'Calling map() with missing id attribute in location.');

  t.throws(function() {
    map([{
      id: 'Europe',
      latitude: 54.5260
    }]);
  }, 'Calling map() with missing longitude attribute in location.');

  t.throws(function() {
    map([{
      id: 'Europe',
      longitude: 15.2551
    }]);
  }, 'Calling map() with missing latitude attribute in location.');

  t.end();
});

test('map.panTo()', function(t) {
  map = infovyz.map('#map');

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
