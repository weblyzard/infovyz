var test = require('tape');
var d3 = require('d3');
var infovyz = require('../build/infovyz')(d3);

var linechart;

var parseTime = d3.timeParse('%Y%m%d');
var width = 960;
var height = 500;

d3.select('body')
  .append('div')
  .attr('id', 'linechart')
  .style('width', width + 'px')
  .style('height', height + 'px');

test('initialize linechart().', function(t) {
  t.doesNotThrow(function() {
    linechart = infovyz.linechart('#linechart');
  }, 'Initialize linechart and add to wrapper element.');

  t.equal(typeof linechart, 'function', 'linechart is of type function.');
  t.equal(typeof linechart.transitionDuration, 'function', 'linechart.transitionDuration is of type function');

  t.equal(linechart.transitionDuration(), 500, 'default transitionDuration is 500ms.');

  var svgSelection = d3.select('#linechart svg');
  t.notOk(svgSelection.empty(), 'svg DOM element exists.');
  t.ok(svgSelection.classed('infovyz-linechart'), 'svg DOM element has class `infovyz-linechart`.');

  t.equal(svgSelection.attr('width'), width + '', 'svg DOM element width matches wrapper width.');
  t.equal(svgSelection.attr('height'), height + '', 'svg DOM element width matches wrapper width.');

  var viewport = svgSelection.select('g.viewport');
  t.notOk(viewport.empty(), 'DOM element g.viewport exists.');

  var xAxis = svgSelection.select('g.viewport g.x.axis');
  t.notOk(xAxis.empty(), 'DOM element g.x.axis exists.');

  var yAxis = svgSelection.select('g.viewport g.y.axis');
  t.notOk(yAxis.empty(), 'DOM element g.y.axis exists.');

  t.end();
});

test('linechart(...)', function(t) {
  linechart = infovyz.linechart('#linechart');

  t.doesNotThrow(function() {
    linechart();
  }, 'Calling linechart() without arguments.');

  t.doesNotThrow(function() {
    linechart([{
      id: 'd1',
      values: [
        {
          date: parseTime('20161221'),
          value: 10
        },
        {
          date: parseTime('20161222'),
          value: 12
        },
        {
          date: parseTime('20161223'),
          value: 11
        }
      ]
    }]);
  }, 'Calling linechart() with some properly formatted dummy location.');

  t.throws(function() {
    linechart([{
      id: 'd2'
    }]);
  }, 'Calling linechart() without values.');

  t.end();
});
