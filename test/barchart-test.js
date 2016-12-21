var test = require('tape');
var d3 = require('d3');
var infovyz = require('../build/infovyz')(d3);

var barchart;

var width = 960;
var height = 500;

d3.select('body')
  .append('div')
  .attr('id', 'barchart')
  .style('width', width + 'px')
  .style('height', height + 'px');

test('initialize barchart().', function(t) {
  t.doesNotThrow(function() {
    barchart = infovyz.barchart('#barchart');
  }, 'Initialize barchart and add to wrapper element.');

  t.equal(typeof barchart, 'function', 'barchart is of type function.');
  t.equal(typeof barchart.transitionDuration, 'function', 'barchart.transitionDuration is of type function');

  t.equal(barchart.transitionDuration(), 500, 'default transitionDuration is 500ms.');

  t.end();
});

test('barchart(...)', function(t) {
  barchart = infovyz.barchart('#barchart');

  t.doesNotThrow(function() {
    barchart();
  }, 'Calling barchart() without arguments.');

  t.doesNotThrow(function() {
    barchart([
      {
        id: 'd1',
        value: 10
      },
      {
        id: 'd2',
        value: 12
      },
      {
        id: 'd3',
        value: 11
      }
    ]);
  }, 'Calling barchart() with some properly formatted dummy data.');

  /*
  t.throws(function() {
    barchart([{
      id: 'd2'
    }]);
  }, 'Calling barchart() without values.');
  */

  t.end();
});
