export default function(d3) {
  return function(id) {
    
    var transitionDuration = 500;
    var numberFormat = d3.format('.3s');
    var wrapper = d3.select(id);

    var barchart = function (data) {
      var _transitionDuration = transitionDuration;
      if (arguments.length === 0) {
        _transitionDuration = 0;
        data = wrapper.selectAll('div.bar-el').data();
      }

      var values = data.map(function (d){ return d.value; });

      var width = 200;
      var x = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .range([0, width]);

      data = data.sort(function(a, b) {
        return b.value - a.value;
      });

      var bar = wrapper
        .selectAll('div.bar-el')
        .data(data, function (d) { return d.id; });

      bar.exit().remove();

      var barEl = bar.enter()
        .append('div')
        .attr('class', 'bar-el');

      barEl
        .append('div')
        .attr('class', 'bar bar-label')
        .html(function (d) { 
          return d.id;
        });

      barEl
        .append('div')
        .attr('class', 'bar bar-bar')
        .style('width', function(d) { return x(d.value) + 'px'; });

      barEl
        .append('div')
        .attr('class', 'bar bar-value');

      var t = d3.transition()
        .duration(_transitionDuration);

      barEl.merge(bar).select('div.bar-bar')
        .transition(t)
        .style('width', function(d) { return x(d.value) + 'px'; });

      barEl.merge(bar).select('div.bar-value')
        .text(function(d) { return numberFormat(d.value); });

      barEl.merge(bar).order();
    };

    barchart.transitionDuration = function(d) {
      if (arguments.length === 0) return transitionDuration;
      transitionDuration = d;
      return barchart;
    };

    return barchart;
  };
}
