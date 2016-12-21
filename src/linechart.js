export default function(d3) {
  return function(id) {
    var transitionDuration = 500;
    var margin = {top: 20, right: 20, bottom: 30, left: 45};

    var wrapper = d3.select(id);
    var wrapperWidth = wrapper.node().clientWidth;
    var wrapperHeight = wrapper.node().clientHeight;

    var svg = wrapper.select('svg g.viewport');
    var gXAxis = wrapper.select('svg g.viewport g.x.axis');
    var gYAxis = wrapper.select('svg g.viewport g.y.axis');

    if (svg.empty()) {
      svg = wrapper.append('svg')
        .classed('infovyz-linechart', true)
        .attr('width', wrapperWidth)
        .attr('height', wrapperHeight)
        .append('g')
          .attr('class', 'viewport')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
      gXAxis = svg
        .append('g')
        .attr('class', 'x axis');
      
      gYAxis = svg
        .append('g')
        .attr('class', 'y axis');
    }
    
    var linechart = function(data) {
      var _transitionDuration = transitionDuration;

      wrapperWidth = wrapper.node().clientWidth;
      wrapperHeight = wrapper.node().clientHeight;

      var width = wrapperWidth - margin.left - margin.right;
      var height = wrapperHeight - margin.top - margin.bottom;
      
      var x = d3.scaleTime().rangeRound([0, width]);
      var y = d3.scaleLinear().rangeRound([height, 0]);
      var z = d3.scaleOrdinal(d3.schemeCategory10);
      
      var line = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.value); });
      
      if (arguments.length === 0) {
        data = wrapper.selectAll('svg g.viewport path.line').data();
        _transitionDuration = 0;
      }

      x.domain(d3.extent(data.reduce(function(p, c) {
        c.values.map(function(d) {
          p.push(d.date);
        });
        return p;
      }, [])));

      y.domain([
        d3.min(data, function(c) { return d3.min(c.values, function(d) { return d.value; }); }),
        d3.max(data, function(c) { return d3.max(c.values, function(d) { return d.value; }); })
      ]);

      z.domain(data.map(function(c) { return c.id; }));

      wrapper.selectAll('svg')
        .attr('width', wrapperWidth)
        .attr('height', wrapperHeight);
      
      var t = d3.transition()
        .duration(_transitionDuration);
      var fadeTransition = d3.transition()
        .duration(0)
        .delay(500);

      gXAxis
        .attr('transform', 'translate(0,' + height + ')')
        .transition(t)
        .call(d3.axisBottom(x).ticks(width / 75));

      gYAxis
        .transition(t)
        .call(d3.axisLeft(y).ticks(height / 50));

      var lines = svg.selectAll('path.line')
        .data(data, function(d) { return d.id; });
      
      lines
        .exit()
        .classed('exit', true)
        .transition(fadeTransition)
        .remove();

      lines
        .transition(t)
        .attr('d', function(d) {
          return line(d.values);
        });
        
      lines
        .enter()
        .append('path')
        .attr('class', 'line')
        .style('stroke', function(d) {
          return z(d.id);
        })
        .attr('d', function(d) {
          return line(d.values);
        });
    };

    linechart.transitionDuration = function(d) {
      if (arguments.length === 0) return transitionDuration;
      transitionDuration = d;
      return linechart;
    };

    return linechart;
  };
}