(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.infovyz = factory());
}(this, (function () { 'use strict';

var barchart = function(d3) {
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
};

var findByType = function(arr, typeName) {
  if (!Array.isArray(arr)) {
    throw new Error('arr needs to be an array');
  }

  if (typeof typeName !== 'string') {
    throw new Error('typeName needs to be string');
  }

  for (var i = 0; i < arr.length; i++) {
    if (arr[i].typeName === typeName) {
      return i;
    }
  }

  return -1;
};

var types = [];

// av's main function is a getter-setter-combo
// it expects a default value and a validation function
// the validation function should return the validated value or throw an exception
// it shouldn't return 'false' for non-validating values
var av$1 = function (i, validate){
  // we offer a shortcut to get types when only one argument is provided
  if (arguments.length === 1) {
    return av$1.type(i);
  }

  // we store the value in private scope
  var _i;
  // our getter-setter-combo including validation
  var me = function (d){
    if (!arguments.length) {
      if (typeof _i === 'object'){
        var o = {};
        for (var prop in _i){
          o[prop] = _i[prop]();
        }
        return o;
      } else {
        return _i;
      }
    }
    _i = validate(d);
    // if _i is an object we expose the getter/setter methods of its attributes
    if (typeof _i === 'object'){
      for (var prop_object in _i){
        me[prop_object] = _i[prop_object];
      }
    }
  };
  // we initialize the getter-setter-combo with the provided value
  me(i);
  // return the getter-setter-combo (allows chaining, among other things)
  return me;
};

av$1.type = function() {
  var typeIndex;
  var typeName;
  var typeData;

  if (arguments.length === 0) {
    throw new Error('av.type requires at least one argument.');
  }

  typeName = arguments[0];
  typeIndex = findByType(types, typeName);

  // get a type by name
  if (arguments.length === 1) {
    if (typeIndex === -1) {
      throw new Error('type not found');
    }
    return types[typeIndex].type;
  // set a type by name
  } else if (arguments.length === 2) {
    typeData = arguments[1];
    if (typeIndex !== -1) {
      throw new Error('type specification already exists.');
    }
    if (typeof typeData === 'function') {
      types.push({
        typeName: typeName,
        type: function(i) {
          return av$1(i, typeData);
        }
      });
    } else if (typeof typeData === 'object') {
      types.push({
        typeName: typeName,
        type: function(i) {
          return av$1(i, function(d) {
            if (typeof d === 'object'){
              var _i = {};
              for (var prop in typeData){
                _i[prop] = av$1.type(typeData[prop])(d[prop]);
              }
              return _i;
            } else throw 'not a valid object';
          });
        }
      });
    } else {
      throw new Error('argument 2 typeData must be either a function or object.');
    }

    return av$1;
  }

  throw new Error('invalid amount of arguments for av.type()');
};

// isValid allows you to test if a value (v) is a valid type (t)
av$1.isValid = function (t, v){
  try {
    t(v);
    return true;
  } catch (err) {
    return false;
  }
};

// a boolean type and its validation function
av$1.type('boolean', function (d){
  if (typeof d === 'boolean') {
    return d;
  } else throw new Error('d is not boolean');
});

// http://stackoverflow.com/a/20779354/2266116
var isInteger = function (nVal){
  return typeof nVal === 'number' && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
};

av$1.type('int', function(d) {
  if(!isInteger(d)) {
    throw new Error('d is not an integer');
  }
  return d;
});

av$1.type('float', function(d){
  if(typeof d !== 'number') {
    throw 'd is not a number';
  }
  return d;
});

av$1.type('string', function (d){
  if (typeof d === 'string') {
    return d;
  } else throw 'd is not a string';
});

av$1.type('collection', function (d){
  if (d && d.constructor === Array) {
    return d;
  } else throw 'not an array';
});

av$1.type('latitude', function(d) {
  var l = av$1('float')(d)();
  if (l < -90 || l > 90) {
    throw new Error('latitude must be a number between -90 and 90.');
  }
  return d;
});

av$1.type('longitude', function (d){
  var l = av$1('float')(d)();
  if (l < -180 || l > 180) {
    throw new Error('longitude must be a number between -180 and 180.');
  }
  return d;
});

av$1.type('location', {
  id: 'string',
  // commented for now because examples use data without values
  // and avocado doesn't support optional attributes yet.
  // value: 'int',
  longitude: 'longitude',
  latitude: 'latitude'
});

var map = function(d3) {
  return function(id) {
    var autozoom = true;
    var interactive = true;
    var transitionDuration = 500; // ms
    var pi = Math.PI;
    var tau = 2 * pi;
    var radius = d3.scalePow()
        .domain([1, 10])
        .range([3, 15]);

    var strokeWidth = 0.5;

    var wrapper = d3.select(id);
    var width = wrapper.node().clientWidth;
    var height = wrapper.node().clientHeight;
    var size = [width, height];

    var tilesConfig = {
      url: 'https://maps.wikimedia.org/osm-intl/',
      extension: '.png',
      switchXY: false,
      factor: 256
    };

    var projection = d3.geoMercator()
        .scale(1 / tau)
        .translate([0, 0]);

    var path = d3.geoPath()
        .projection(projection);  

    var tile = d3.tile()
        .size(size);

    var zoom = d3.zoom()
        .scaleExtent([1 << 9, 1 << 14])
        .on('zoom', zoomed);

    var svg = wrapper.select('svg');
    
    if (svg.empty()) {
      svg = wrapper.append('svg')
          .classed('infovyz-map', true)
          .attr('width', width)
          .attr('height', height);

      if (!interactive) {
        svg.style('pointer-events', 'none');
      }
    }

    var raster = svg.append('g').classed('tiles', true);
    var vector = svg.append('g').classed('overlay', true);
    var legend = svg.append('g').classed('legend', true);

    var previousTransform;
    function zoomed() {
      var transform = previousTransform = d3.event.transform;

      var tiles = tile
          .scale(transform.k)
          .translate([transform.x, transform.y])
          ();

      vector
        .attr('transform', transform);
      
      vector.selectAll('circle.active')
        .attr('transform', function(d) { return 'translate(' + projection(d.geometry.coordinates) + ')'; })
        .attr('r', function(d) {
          return radius(d.properties.value || 1) / transform.k;
        })
        .attr('stroke-width', strokeWidth / transform.k);

      var image = raster
        .attr('transform', stringify(tiles.scale, tiles.translate))
        .selectAll('image')
        .data(tiles, function(d) { return d; });

      image
        .exit().remove();

      image.enter().append('image')
          .attr('xlink:href', function(d) {
            return tilesConfig.url + d[2] + '/' + d[0] + '/' + d[1] + tilesConfig.extension;
          })
          .attr('x', function(d) { return d[0] * tilesConfig.factor; })
          .attr('y', function(d) { return d[1] * tilesConfig.factor; })
          .attr('width', tilesConfig.factor)
          .attr('height', tilesConfig.factor);
    }

    function stringify(scale, translate) {
      var k = scale / tilesConfig.factor;
      var r = scale % 1 ? Number : Math.round;
      return 'translate(' + r(translate[0] * scale) + ',' + r(translate[1] * scale) + ') scale(' + k + ')';
    }

    var transformData = function(d) {
      return {
        type: 'FeatureCollection',
        features: d.map(function(el) {
          av$1('location')(el);
          return {
            type: 'Feature',
            id: el.id,
            properties: el,
            geometry: {type: 'Point', coordinates: [+el.longitude, +el.latitude]}
          };
        })
      };
    };

    var map = function(d) {
      var newWidth = wrapper.node().clientWidth;
      var newHeight = wrapper.node().clientHeight;
      var _transitionDuration = transitionDuration;

      if (width !== newWidth || height !== newHeight) {
        width = newWidth;
        height = newHeight;
        _transitionDuration = 0;
        svg
          .attr('width', width)
          .attr('height', height);
      }

      if (typeof vector.datum() === 'undefined') {
        _transitionDuration = 0;
      }
      var data = (typeof d !== 'undefined') ? transformData(d) : vector.datum();

      // Compute the projected center.
      var bounds  = path.bounds(data);
      var bx = bounds[1][0] - bounds[0][0];
      var by = bounds[1][1] - bounds[0][1];
      var tx = (bounds[0][0] + bounds[1][0]) / 2;
      var ty = (bounds[0][1] + bounds[1][1]) / 2;
      var scale = 0.8 * Math.min(width / bx, height / by);

      svg.call(zoom);

      if (!autozoom && typeof vector.datum() === 'undefined') {
        svg
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(1 << 10)
              .translate(0, 0)
          );
      }

      if (autozoom) {
        svg
          .transition()
          .duration(_transitionDuration)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(scale)
              .translate(-tx, -ty)
          );
      }

      vector.datum(data);

      var features = (typeof data !== 'undefined') ? data.features : [];

      var valueExtent = d3.extent(features.map(function(f) {
        return f.properties.value || 1;
      }));

      radius = d3.scalePow()
        .domain(valueExtent)
        .range([3, 15]);

      var bubble = vector
        .selectAll('circle')
        .data(features, function(d) { return d.id; });

      bubble
        .exit()
        .classed('active', false)
        .transition()
        .attr('r', 0)
        .attr('stroke-width', 0)
        .remove();

      scale = (previousTransform) ? previousTransform.k : scale;
      bubble.enter().append('circle')
        .classed('active', true)
        .attr('transform', function(d) { return 'translate(' + projection(d.geometry.coordinates) + ')'; })
        .attr('r', 0)
        .attr('stroke-width', 0)
        .transition()
        .attr('r', function(d) {
          return radius(d.properties.value || 1) / scale;
        })
        .attr('stroke-width', strokeWidth / scale);

      legend
        .attr('transform', 'translate(' + (width - radius(valueExtent[1]) - 10) + ',' + (height - 10) + ')');

      var legendElement = legend.selectAll('g')
        .data(valueExtent)
        .enter().append('g');

      legendElement.append('circle');

      legend.selectAll('circle')
        .data(valueExtent)
        .attr('cy', function(d) { return -(radius(d)); })
        .attr('r', function(d) { return radius(d); });

      legendElement.append('text');

      legend.selectAll('text')
        .data(valueExtent)
        .attr('y', function(d) { return -2 * (radius(d)); })
        .attr('dy', function() { return '-.2em'; })
        .text(function(d){ return d; });

      return map;
    };

    map.panTo = function(d) {
      if (typeof d === 'undefined') {
        throw new Error('map.panTo() called without location.');
      }

      if (typeof d.longitude === 'undefined' || typeof d.latitude === 'undefined') {
        throw new Error('map.panTo() called without valid location.');
      }

      var t = projection([d.longitude, d.latitude]);
      var z = d.zoom || 10;
      svg
        .transition()
        .duration(transitionDuration)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1 << z)
            .translate(-t[0], -t[1])
        );
    };

    map.autozoom = function(d) {
      if (arguments.length === 0) return autozoom;
      autozoom = d;
      return map;
    };

    map.interactive = function(d) {
      if (arguments.length === 0) return interactive;
      interactive = d;

      if (!interactive) {
        svg.style('pointer-events', 'none');
      } else {
        svg.style('pointer-events', null);
      }

      return map;
    };

    map.transitionDuration = function(d) {
      if (arguments.length === 0) return transitionDuration;
      transitionDuration = d;
      return map;
    };

    return map;
  };
};

var linechart = function(d3) {
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
};

var infovyz = function(d3) {
  return {
    version: '1.0.0',
    barchart: barchart(d3),
    linechart: linechart(d3),
    map: map(d3)
  };
};

return infovyz;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9iYXJjaGFydC5qcyIsIi4uL25vZGVfbW9kdWxlcy9hdm9jYWRvLXR5cGUtY2hlY2tlci9idWlsZC9hdm9jYWRvX2VzLmpzIiwiLi4vc3JjL192YWxpZGF0ZUxvY2F0aW9uLmpzIiwiLi4vc3JjL21hcC5qcyIsIi4uL3NyYy9saW5lY2hhcnQuanMiLCIuLi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbihkMykge1xuICByZXR1cm4gZnVuY3Rpb24oaWQpIHtcbiAgICBcbiAgICB2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gNTAwO1xuICAgIHZhciBudW1iZXJGb3JtYXQgPSBkMy5mb3JtYXQoJy4zcycpO1xuICAgIHZhciB3cmFwcGVyID0gZDMuc2VsZWN0KGlkKTtcblxuICAgIHZhciBiYXJjaGFydCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICB2YXIgX3RyYW5zaXRpb25EdXJhdGlvbiA9IHRyYW5zaXRpb25EdXJhdGlvbjtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIF90cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgICAgICBkYXRhID0gd3JhcHBlci5zZWxlY3RBbGwoJ2Rpdi5iYXItZWwnKS5kYXRhKCk7XG4gICAgICB9XG5cbiAgICAgIHZhciB2YWx1ZXMgPSBkYXRhLm1hcChmdW5jdGlvbiAoZCl7IHJldHVybiBkLnZhbHVlOyB9KTtcblxuICAgICAgdmFyIHdpZHRoID0gMjAwO1xuICAgICAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIGQzLm1heCh2YWx1ZXMpXSlcbiAgICAgICAgLnJhbmdlKFswLCB3aWR0aF0pO1xuXG4gICAgICBkYXRhID0gZGF0YS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIudmFsdWUgLSBhLnZhbHVlO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBiYXIgPSB3cmFwcGVyXG4gICAgICAgIC5zZWxlY3RBbGwoJ2Rpdi5iYXItZWwnKVxuICAgICAgICAuZGF0YShkYXRhLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5pZDsgfSk7XG5cbiAgICAgIGJhci5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgIHZhciBiYXJFbCA9IGJhci5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdiYXItZWwnKTtcblxuICAgICAgYmFyRWxcbiAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhciBiYXItbGFiZWwnKVxuICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkgeyBcbiAgICAgICAgICByZXR1cm4gZC5pZDtcbiAgICAgICAgfSk7XG5cbiAgICAgIGJhckVsXG4gICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdiYXIgYmFyLWJhcicpXG4gICAgICAgIC5zdHlsZSgnd2lkdGgnLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQudmFsdWUpICsgJ3B4JzsgfSk7XG5cbiAgICAgIGJhckVsXG4gICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdiYXIgYmFyLXZhbHVlJyk7XG5cbiAgICAgIHZhciB0ID0gZDMudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihfdHJhbnNpdGlvbkR1cmF0aW9uKTtcblxuICAgICAgYmFyRWwubWVyZ2UoYmFyKS5zZWxlY3QoJ2Rpdi5iYXItYmFyJylcbiAgICAgICAgLnRyYW5zaXRpb24odClcbiAgICAgICAgLnN0eWxlKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHgoZC52YWx1ZSkgKyAncHgnOyB9KTtcblxuICAgICAgYmFyRWwubWVyZ2UoYmFyKS5zZWxlY3QoJ2Rpdi5iYXItdmFsdWUnKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBudW1iZXJGb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG4gICAgICBiYXJFbC5tZXJnZShiYXIpLm9yZGVyKCk7XG4gICAgfTtcblxuICAgIGJhcmNoYXJ0LnRyYW5zaXRpb25EdXJhdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdHJhbnNpdGlvbkR1cmF0aW9uO1xuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uID0gZDtcbiAgICAgIHJldHVybiBiYXJjaGFydDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGJhcmNoYXJ0O1xuICB9O1xufVxuIiwidmFyIGZpbmRCeVR5cGUgPSBmdW5jdGlvbihhcnIsIHR5cGVOYW1lKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhcnIgbmVlZHMgdG8gYmUgYW4gYXJyYXknKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdHlwZU5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0eXBlTmFtZSBuZWVkcyB0byBiZSBzdHJpbmcnKTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGFycltpXS50eXBlTmFtZSA9PT0gdHlwZU5hbWUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn07XG5cbnZhciB0eXBlcyA9IFtdO1xuXG4vLyBhdidzIG1haW4gZnVuY3Rpb24gaXMgYSBnZXR0ZXItc2V0dGVyLWNvbWJvXG4vLyBpdCBleHBlY3RzIGEgZGVmYXVsdCB2YWx1ZSBhbmQgYSB2YWxpZGF0aW9uIGZ1bmN0aW9uXG4vLyB0aGUgdmFsaWRhdGlvbiBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRoZSB2YWxpZGF0ZWQgdmFsdWUgb3IgdGhyb3cgYW4gZXhjZXB0aW9uXG4vLyBpdCBzaG91bGRuJ3QgcmV0dXJuICdmYWxzZScgZm9yIG5vbi12YWxpZGF0aW5nIHZhbHVlc1xudmFyIGF2ID0gZnVuY3Rpb24gKGksIHZhbGlkYXRlKXtcbiAgLy8gd2Ugb2ZmZXIgYSBzaG9ydGN1dCB0byBnZXQgdHlwZXMgd2hlbiBvbmx5IG9uZSBhcmd1bWVudCBpcyBwcm92aWRlZFxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBhdi50eXBlKGkpO1xuICB9XG5cbiAgLy8gd2Ugc3RvcmUgdGhlIHZhbHVlIGluIHByaXZhdGUgc2NvcGVcbiAgdmFyIF9pO1xuICAvLyBvdXIgZ2V0dGVyLXNldHRlci1jb21ibyBpbmNsdWRpbmcgdmFsaWRhdGlvblxuICB2YXIgbWUgPSBmdW5jdGlvbiAoZCl7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICBpZiAodHlwZW9mIF9pID09PSAnb2JqZWN0Jyl7XG4gICAgICAgIHZhciBvID0ge307XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gX2kpe1xuICAgICAgICAgIG9bcHJvcF0gPSBfaVtwcm9wXSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIF9pO1xuICAgICAgfVxuICAgIH1cbiAgICBfaSA9IHZhbGlkYXRlKGQpO1xuICAgIC8vIGlmIF9pIGlzIGFuIG9iamVjdCB3ZSBleHBvc2UgdGhlIGdldHRlci9zZXR0ZXIgbWV0aG9kcyBvZiBpdHMgYXR0cmlidXRlc1xuICAgIGlmICh0eXBlb2YgX2kgPT09ICdvYmplY3QnKXtcbiAgICAgIGZvciAodmFyIHByb3Bfb2JqZWN0IGluIF9pKXtcbiAgICAgICAgbWVbcHJvcF9vYmplY3RdID0gX2lbcHJvcF9vYmplY3RdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLy8gd2UgaW5pdGlhbGl6ZSB0aGUgZ2V0dGVyLXNldHRlci1jb21ibyB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZVxuICBtZShpKTtcbiAgLy8gcmV0dXJuIHRoZSBnZXR0ZXItc2V0dGVyLWNvbWJvIChhbGxvd3MgY2hhaW5pbmcsIGFtb25nIG90aGVyIHRoaW5ncylcbiAgcmV0dXJuIG1lO1xufTtcblxuYXYudHlwZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdHlwZUluZGV4O1xuICB2YXIgdHlwZU5hbWU7XG4gIHZhciB0eXBlRGF0YTtcblxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYXYudHlwZSByZXF1aXJlcyBhdCBsZWFzdCBvbmUgYXJndW1lbnQuJyk7XG4gIH1cblxuICB0eXBlTmFtZSA9IGFyZ3VtZW50c1swXTtcbiAgdHlwZUluZGV4ID0gZmluZEJ5VHlwZSh0eXBlcywgdHlwZU5hbWUpO1xuXG4gIC8vIGdldCBhIHR5cGUgYnkgbmFtZVxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIGlmICh0eXBlSW5kZXggPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3R5cGUgbm90IGZvdW5kJyk7XG4gICAgfVxuICAgIHJldHVybiB0eXBlc1t0eXBlSW5kZXhdLnR5cGU7XG4gIC8vIHNldCBhIHR5cGUgYnkgbmFtZVxuICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICB0eXBlRGF0YSA9IGFyZ3VtZW50c1sxXTtcbiAgICBpZiAodHlwZUluZGV4ICE9PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0eXBlIHNwZWNpZmljYXRpb24gYWxyZWFkeSBleGlzdHMuJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdHlwZURhdGEgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHR5cGVzLnB1c2goe1xuICAgICAgICB0eXBlTmFtZTogdHlwZU5hbWUsXG4gICAgICAgIHR5cGU6IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICByZXR1cm4gYXYoaSwgdHlwZURhdGEpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0eXBlRGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHR5cGVzLnB1c2goe1xuICAgICAgICB0eXBlTmFtZTogdHlwZU5hbWUsXG4gICAgICAgIHR5cGU6IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICByZXR1cm4gYXYoaSwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkID09PSAnb2JqZWN0Jyl7XG4gICAgICAgICAgICAgIHZhciBfaSA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHR5cGVEYXRhKXtcbiAgICAgICAgICAgICAgICBfaVtwcm9wXSA9IGF2LnR5cGUodHlwZURhdGFbcHJvcF0pKGRbcHJvcF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBfaTtcbiAgICAgICAgICAgIH0gZWxzZSB0aHJvdyAnbm90IGEgdmFsaWQgb2JqZWN0JztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXJndW1lbnQgMiB0eXBlRGF0YSBtdXN0IGJlIGVpdGhlciBhIGZ1bmN0aW9uIG9yIG9iamVjdC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXY7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgYW1vdW50IG9mIGFyZ3VtZW50cyBmb3IgYXYudHlwZSgpJyk7XG59O1xuXG4vLyBpc1ZhbGlkIGFsbG93cyB5b3UgdG8gdGVzdCBpZiBhIHZhbHVlICh2KSBpcyBhIHZhbGlkIHR5cGUgKHQpXG5hdi5pc1ZhbGlkID0gZnVuY3Rpb24gKHQsIHYpe1xuICB0cnkge1xuICAgIHQodik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gYSBib29sZWFuIHR5cGUgYW5kIGl0cyB2YWxpZGF0aW9uIGZ1bmN0aW9uXG5hdi50eXBlKCdib29sZWFuJywgZnVuY3Rpb24gKGQpe1xuICBpZiAodHlwZW9mIGQgPT09ICdib29sZWFuJykge1xuICAgIHJldHVybiBkO1xuICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKCdkIGlzIG5vdCBib29sZWFuJyk7XG59KTtcblxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjA3NzkzNTQvMjI2NjExNlxudmFyIGlzSW50ZWdlciA9IGZ1bmN0aW9uIChuVmFsKXtcbiAgcmV0dXJuIHR5cGVvZiBuVmFsID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZShuVmFsKSAmJiBuVmFsID4gLTkwMDcxOTkyNTQ3NDA5OTIgJiYgblZhbCA8IDkwMDcxOTkyNTQ3NDA5OTIgJiYgTWF0aC5mbG9vcihuVmFsKSA9PT0gblZhbDtcbn07XG5cbmF2LnR5cGUoJ2ludCcsIGZ1bmN0aW9uKGQpIHtcbiAgaWYoIWlzSW50ZWdlcihkKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignZCBpcyBub3QgYW4gaW50ZWdlcicpO1xuICB9XG4gIHJldHVybiBkO1xufSk7XG5cbmF2LnR5cGUoJ2Zsb2F0JywgZnVuY3Rpb24oZCl7XG4gIGlmKHR5cGVvZiBkICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93ICdkIGlzIG5vdCBhIG51bWJlcic7XG4gIH1cbiAgcmV0dXJuIGQ7XG59KTtcblxuYXYudHlwZSgnc3RyaW5nJywgZnVuY3Rpb24gKGQpe1xuICBpZiAodHlwZW9mIGQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGQ7XG4gIH0gZWxzZSB0aHJvdyAnZCBpcyBub3QgYSBzdHJpbmcnO1xufSk7XG5cbmF2LnR5cGUoJ2NvbGxlY3Rpb24nLCBmdW5jdGlvbiAoZCl7XG4gIGlmIChkICYmIGQuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgcmV0dXJuIGQ7XG4gIH0gZWxzZSB0aHJvdyAnbm90IGFuIGFycmF5Jztcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBhdjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJanB1ZFd4c0xDSnpiM1Z5WTJWeklqcGJJaTR1TDNOeVl5OW1hVzVrUW5sVWVYQmxMbXB6SWl3aUxpNHZjM0pqTDJGMmIyTmhaRzh1YW5NaVhTd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2laWGh3YjNKMElHUmxabUYxYkhRZ1puVnVZM1JwYjI0b1lYSnlMQ0IwZVhCbFRtRnRaU2tnZTF4dUlDQnBaaUFvSVVGeWNtRjVMbWx6UVhKeVlYa29ZWEp5S1NrZ2UxeHVJQ0FnSUhSb2NtOTNJRzVsZHlCRmNuSnZjaWduWVhKeUlHNWxaV1J6SUhSdklHSmxJR0Z1SUdGeWNtRjVKeWs3WEc0Z0lIMWNibHh1SUNCcFppQW9kSGx3Wlc5bUlIUjVjR1ZPWVcxbElDRTlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJGY25KdmNpZ25kSGx3WlU1aGJXVWdibVZsWkhNZ2RHOGdZbVVnYzNSeWFXNW5KeWs3WEc0Z0lIMWNibHh1SUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnYVNBOElHRnljaTVzWlc1bmRHZzdJR2tyS3lrZ2UxeHVJQ0FnSUdsbUlDaGhjbkpiYVYwdWRIbHdaVTVoYldVZ1BUMDlJSFI1Y0dWT1lXMWxLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdhVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdMVEU3WEc1OVhHNGlMQ0pwYlhCdmNuUWdleUJrWldaaGRXeDBJR0Z6SUdacGJtUkNlVlI1Y0dVZ2ZTQm1jbTl0SUNjdUwyWnBibVJDZVZSNWNHVW5PMXh1WEc1MllYSWdkSGx3WlhNZ1BTQmJYVHRjYmx4dUx5OGdZWFluY3lCdFlXbHVJR1oxYm1OMGFXOXVJR2x6SUdFZ1oyVjBkR1Z5TFhObGRIUmxjaTFqYjIxaWIxeHVMeThnYVhRZ1pYaHdaV04wY3lCaElHUmxabUYxYkhRZ2RtRnNkV1VnWVc1a0lHRWdkbUZzYVdSaGRHbHZiaUJtZFc1amRHbHZibHh1THk4Z2RHaGxJSFpoYkdsa1lYUnBiMjRnWm5WdVkzUnBiMjRnYzJodmRXeGtJSEpsZEhWeWJpQjBhR1VnZG1Gc2FXUmhkR1ZrSUhaaGJIVmxJRzl5SUhSb2NtOTNJR0Z1SUdWNFkyVndkR2x2Ymx4dUx5OGdhWFFnYzJodmRXeGtiaWQwSUhKbGRIVnliaUFuWm1Gc2MyVW5JR1p2Y2lCdWIyNHRkbUZzYVdSaGRHbHVaeUIyWVd4MVpYTmNiblpoY2lCaGRpQTlJR1oxYm1OMGFXOXVJQ2hwTENCMllXeHBaR0YwWlNsN1hHNGdJQzh2SUhkbElHOW1abVZ5SUdFZ2MyaHZjblJqZFhRZ2RHOGdaMlYwSUhSNWNHVnpJSGRvWlc0Z2IyNXNlU0J2Ym1VZ1lYSm5kVzFsYm5RZ2FYTWdjSEp2ZG1sa1pXUmNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREVwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdZWFl1ZEhsd1pTaHBLVHRjYmlBZ2ZWeHVYRzRnSUM4dklIZGxJSE4wYjNKbElIUm9aU0IyWVd4MVpTQnBiaUJ3Y21sMllYUmxJSE5qYjNCbFhHNGdJSFpoY2lCZmFUdGNiaUFnTHk4Z2IzVnlJR2RsZEhSbGNpMXpaWFIwWlhJdFkyOXRZbThnYVc1amJIVmthVzVuSUhaaGJHbGtZWFJwYjI1Y2JpQWdkbUZ5SUcxbElEMGdablZ1WTNScGIyNGdLR1FwZTF4dUlDQWdJR2xtSUNnaFlYSm5kVzFsYm5SekxteGxibWQwYUNrZ2UxeHVJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQmZhU0E5UFQwZ0oyOWlhbVZqZENjcGUxeHVJQ0FnSUNBZ0lDQjJZWElnYnlBOUlIdDlPMXh1SUNBZ0lDQWdJQ0JtYjNJZ0tIWmhjaUJ3Y205d0lHbHVJRjlwS1h0Y2JpQWdJQ0FnSUNBZ0lDQnZXM0J5YjNCZElEMGdYMmxiY0hKdmNGMG9LVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYnp0Y2JpQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmYVR0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0I5WEc0Z0lDQWdYMmtnUFNCMllXeHBaR0YwWlNoa0tUdGNiaUFnSUNBdkx5QnBaaUJmYVNCcGN5QmhiaUJ2WW1wbFkzUWdkMlVnWlhod2IzTmxJSFJvWlNCblpYUjBaWEl2YzJWMGRHVnlJRzFsZEdodlpITWdiMllnYVhSeklHRjBkSEpwWW5WMFpYTmNiaUFnSUNCcFppQW9kSGx3Wlc5bUlGOXBJRDA5UFNBbmIySnFaV04wSnlsN1hHNGdJQ0FnSUNCbWIzSWdLSFpoY2lCd2NtOXdYMjlpYW1WamRDQnBiaUJmYVNsN1hHNGdJQ0FnSUNBZ0lHMWxXM0J5YjNCZmIySnFaV04wWFNBOUlGOXBXM0J5YjNCZmIySnFaV04wWFR0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0I5WEc0Z0lIMDdYRzRnSUM4dklIZGxJR2x1YVhScFlXeHBlbVVnZEdobElHZGxkSFJsY2kxelpYUjBaWEl0WTI5dFltOGdkMmwwYUNCMGFHVWdjSEp2ZG1sa1pXUWdkbUZzZFdWY2JpQWdiV1VvYVNrN1hHNGdJQzh2SUhKbGRIVnliaUIwYUdVZ1oyVjBkR1Z5TFhObGRIUmxjaTFqYjIxaWJ5QW9ZV3hzYjNkeklHTm9ZV2x1YVc1bkxDQmhiVzl1WnlCdmRHaGxjaUIwYUdsdVozTXBYRzRnSUhKbGRIVnliaUJ0WlR0Y2JuMDdYRzVjYm1GMkxuUjVjR1VnUFNCbWRXNWpkR2x2YmlncElIdGNiaUFnZG1GeUlIUjVjR1ZKYm1SbGVEdGNiaUFnZG1GeUlIUjVjR1ZPWVcxbE8xeHVJQ0IyWVhJZ2RIbHdaVVJoZEdFN1hHNWNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMkYyTG5SNWNHVWdjbVZ4ZFdseVpYTWdZWFFnYkdWaGMzUWdiMjVsSUdGeVozVnRaVzUwTGljcE8xeHVJQ0I5WEc1Y2JpQWdkSGx3WlU1aGJXVWdQU0JoY21kMWJXVnVkSE5iTUYwN1hHNGdJSFI1Y0dWSmJtUmxlQ0E5SUdacGJtUkNlVlI1Y0dVb2RIbHdaWE1zSUhSNWNHVk9ZVzFsS1R0Y2JseHVJQ0F2THlCblpYUWdZU0IwZVhCbElHSjVJRzVoYldWY2JpQWdhV1lnS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUFQwOUlERXBJSHRjYmlBZ0lDQnBaaUFvZEhsd1pVbHVaR1Y0SUQwOVBTQXRNU2tnZTF4dUlDQWdJQ0FnZEdoeWIzY2dibVYzSUVWeWNtOXlLQ2QwZVhCbElHNXZkQ0JtYjNWdVpDY3BPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnZEhsd1pYTmJkSGx3WlVsdVpHVjRYUzUwZVhCbE8xeHVJQ0F2THlCelpYUWdZU0IwZVhCbElHSjVJRzVoYldWY2JpQWdmU0JsYkhObElHbG1JQ2hoY21kMWJXVnVkSE11YkdWdVozUm9JRDA5UFNBeUtTQjdYRzRnSUNBZ2RIbHdaVVJoZEdFZ1BTQmhjbWQxYldWdWRITmJNVjA3WEc0Z0lDQWdhV1lnS0hSNWNHVkpibVJsZUNBaFBUMGdMVEVwSUh0Y2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRmNuSnZjaWduZEhsd1pTQnpjR1ZqYVdacFkyRjBhVzl1SUdGc2NtVmhaSGtnWlhocGMzUnpMaWNwTzF4dUlDQWdJSDFjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSFI1Y0dWRVlYUmhJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQjBlWEJsY3k1d2RYTm9LSHRjYmlBZ0lDQWdJQ0FnZEhsd1pVNWhiV1U2SUhSNWNHVk9ZVzFsTEZ4dUlDQWdJQ0FnSUNCMGVYQmxPaUJtZFc1amRHbHZiaWhwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHRjJLR2tzSUhSNWNHVkVZWFJoS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaDBlWEJsYjJZZ2RIbHdaVVJoZEdFZ1BUMDlJQ2R2WW1wbFkzUW5LU0I3WEc0Z0lDQWdJQ0IwZVhCbGN5NXdkWE5vS0h0Y2JpQWdJQ0FnSUNBZ2RIbHdaVTVoYldVNklIUjVjR1ZPWVcxbExGeHVJQ0FnSUNBZ0lDQjBlWEJsT2lCbWRXNWpkR2x2YmlocEtTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR0YyS0drc0lHWjFibU4wYVc5dUtHUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdaQ0E5UFQwZ0oyOWlhbVZqZENjcGUxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCMllYSWdYMmtnUFNCN2ZUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ1ptOXlJQ2gyWVhJZ2NISnZjQ0JwYmlCMGVYQmxSR0YwWVNsN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1gybGJjSEp2Y0YwZ1BTQmhkaTUwZVhCbEtIUjVjR1ZFWVhSaFczQnliM0JkS1Noa1czQnliM0JkS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMms3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2RHaHliM2NnSjI1dmRDQmhJSFpoYkdsa0lHOWlhbVZqZENjN1hHNGdJQ0FnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUgwcE8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMkZ5WjNWdFpXNTBJRElnZEhsd1pVUmhkR0VnYlhWemRDQmlaU0JsYVhSb1pYSWdZU0JtZFc1amRHbHZiaUJ2Y2lCdlltcGxZM1F1SnlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJR0YyTzF4dUlDQjlYRzVjYmlBZ2RHaHliM2NnYm1WM0lFVnljbTl5S0NkcGJuWmhiR2xrSUdGdGIzVnVkQ0J2WmlCaGNtZDFiV1Z1ZEhNZ1ptOXlJR0YyTG5SNWNHVW9LU2NwTzF4dWZUdGNibHh1THk4Z2FYTldZV3hwWkNCaGJHeHZkM01nZVc5MUlIUnZJSFJsYzNRZ2FXWWdZU0IyWVd4MVpTQW9kaWtnYVhNZ1lTQjJZV3hwWkNCMGVYQmxJQ2gwS1Z4dVlYWXVhWE5XWVd4cFpDQTlJR1oxYm1OMGFXOXVJQ2gwTENCMktYdGNiaUFnZEhKNUlIdGNiaUFnSUNCMEtIWXBPMXh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNCOUlHTmhkR05vSUNobGNuSXBJSHRjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lIMWNibjA3WEc1Y2JpOHZJR0VnWW05dmJHVmhiaUIwZVhCbElHRnVaQ0JwZEhNZ2RtRnNhV1JoZEdsdmJpQm1kVzVqZEdsdmJseHVZWFl1ZEhsd1pTZ25ZbTl2YkdWaGJpY3NJR1oxYm1OMGFXOXVJQ2hrS1h0Y2JpQWdhV1lnS0hSNWNHVnZaaUJrSUQwOVBTQW5ZbTl2YkdWaGJpY3BJSHRjYmlBZ0lDQnlaWFIxY200Z1pEdGNiaUFnZlNCbGJITmxJSFJvY205M0lHNWxkeUJGY25KdmNpZ25aQ0JwY3lCdWIzUWdZbTl2YkdWaGJpY3BPMXh1ZlNrN1hHNWNiaTh2SUdoMGRIQTZMeTl6ZEdGamEyOTJaWEptYkc5M0xtTnZiUzloTHpJd056YzVNelUwTHpJeU5qWXhNVFpjYm5aaGNpQnBjMGx1ZEdWblpYSWdQU0JtZFc1amRHbHZiaUFvYmxaaGJDbDdYRzRnSUhKbGRIVnliaUIwZVhCbGIyWWdibFpoYkNBOVBUMGdKMjUxYldKbGNpY2dKaVlnYVhOR2FXNXBkR1VvYmxaaGJDa2dKaVlnYmxaaGJDQStJQzA1TURBM01UazVNalUwTnpRd09Ua3lJQ1ltSUc1V1lXd2dQQ0E1TURBM01UazVNalUwTnpRd09Ua3lJQ1ltSUUxaGRHZ3VabXh2YjNJb2JsWmhiQ2tnUFQwOUlHNVdZV3c3WEc1OU8xeHVYRzVoZGk1MGVYQmxLQ2RwYm5RbkxDQm1kVzVqZEdsdmJpaGtLU0I3WEc0Z0lHbG1LQ0ZwYzBsdWRHVm5aWElvWkNrcElIdGNiaUFnSUNCMGFISnZkeUJ1WlhjZ1JYSnliM0lvSjJRZ2FYTWdibTkwSUdGdUlHbHVkR1ZuWlhJbktUdGNiaUFnZlZ4dUlDQnlaWFIxY200Z1pEdGNibjBwTzF4dVhHNWhkaTUwZVhCbEtDZG1iRzloZENjc0lHWjFibU4wYVc5dUtHUXBlMXh1SUNCcFppaDBlWEJsYjJZZ1pDQWhQVDBnSjI1MWJXSmxjaWNwSUh0Y2JpQWdJQ0IwYUhKdmR5QW5aQ0JwY3lCdWIzUWdZU0J1ZFcxaVpYSW5PMXh1SUNCOVhHNGdJSEpsZEhWeWJpQmtPMXh1ZlNrN1hHNWNibUYyTG5SNWNHVW9KM04wY21sdVp5Y3NJR1oxYm1OMGFXOXVJQ2hrS1h0Y2JpQWdhV1lnS0hSNWNHVnZaaUJrSUQwOVBTQW5jM1J5YVc1bkp5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCa08xeHVJQ0I5SUdWc2MyVWdkR2h5YjNjZ0oyUWdhWE1nYm05MElHRWdjM1J5YVc1bkp6dGNibjBwTzF4dVhHNWhkaTUwZVhCbEtDZGpiMnhzWldOMGFXOXVKeXdnWm5WdVkzUnBiMjRnS0dRcGUxeHVJQ0JwWmlBb1pDQW1KaUJrTG1OdmJuTjBjblZqZEc5eUlEMDlQU0JCY25KaGVTa2dlMXh1SUNBZ0lISmxkSFZ5YmlCa08xeHVJQ0I5SUdWc2MyVWdkR2h5YjNjZ0oyNXZkQ0JoYmlCaGNuSmhlU2M3WEc1OUtUdGNibHh1Wlhod2IzSjBJR1JsWm1GMWJIUWdZWFk3WEc1Y2JpSmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaVFVRkJRU3hwUWtGQlpTeFRRVUZUTEVkQlFVY3NSVUZCUlN4UlFVRlJMRVZCUVVVN1JVRkRja01zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3U1VGRGRrSXNUVUZCVFN4SlFVRkpMRXRCUVVzc1EwRkJReXd3UWtGQk1FSXNRMEZCUXl4RFFVRkRPMGRCUXpkRE96dEZRVVZFTEVsQlFVa3NUMEZCVHl4UlFVRlJMRXRCUVVzc1VVRkJVU3hGUVVGRk8wbEJRMmhETEUxQlFVMHNTVUZCU1N4TFFVRkxMRU5CUVVNc05rSkJRVFpDTEVOQlFVTXNRMEZCUXp0SFFVTm9SRHM3UlVGRlJDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRKUVVOdVF5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFdEJRVXNzVVVGQlVTeEZRVUZGTzAxQlEyaERMRTlCUVU4c1EwRkJReXhEUVVGRE8wdEJRMVk3UjBGRFJqczdSVUZGUkN4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRE8wTkJRMWdzUTBGQlFUczdRVU5rUkN4SlFVRkpMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03T3pzN096dEJRVTFtTEVsQlFVa3NSVUZCUlN4SFFVRkhMRlZCUVZVc1EwRkJReXhGUVVGRkxGRkJRVkVzUTBGQlF6czdSVUZGTjBJc1NVRkJTU3hUUVVGVExFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTXNSVUZCUlR0SlFVTXhRaXhQUVVGUExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1IwRkRia0k3T3p0RlFVZEVMRWxCUVVrc1JVRkJSU3hEUVVGRE96dEZRVVZRTEVsQlFVa3NSVUZCUlN4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRE8wbEJRMjVDTEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUU3hGUVVGRk8wMUJRM0pDTEVsQlFVa3NUMEZCVHl4RlFVRkZMRXRCUVVzc1VVRkJVU3hEUVVGRE8xRkJRM3BDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOWUxFdEJRVXNzU1VGQlNTeEpRVUZKTEVsQlFVa3NSVUZCUlN4RFFVRkRPMVZCUTJ4Q0xFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF6dFRRVU4wUWp0UlFVTkVMRTlCUVU4c1EwRkJReXhEUVVGRE8wOUJRMVlzVFVGQlRUdFJRVU5NTEU5QlFVOHNSVUZCUlN4RFFVRkRPMDlCUTFnN1MwRkRSanRKUVVORUxFVkJRVVVzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN08wbEJSV3BDTEVsQlFVa3NUMEZCVHl4RlFVRkZMRXRCUVVzc1VVRkJVU3hEUVVGRE8wMUJRM3BDTEV0QlFVc3NTVUZCU1N4WFFVRlhMRWxCUVVrc1JVRkJSU3hEUVVGRE8xRkJRM3BDTEVWQlFVVXNRMEZCUXl4WFFVRlhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdUMEZEYmtNN1MwRkRSanRIUVVOR0xFTkJRVU03TzBWQlJVWXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE96dEZRVVZPTEU5QlFVOHNSVUZCUlN4RFFVRkRPME5CUTFnc1EwRkJRenM3UVVGRlJpeEZRVUZGTEVOQlFVTXNTVUZCU1N4SFFVRkhMRmRCUVZjN1JVRkRia0lzU1VGQlNTeFRRVUZUTEVOQlFVTTdSVUZEWkN4SlFVRkpMRkZCUVZFc1EwRkJRenRGUVVOaUxFbEJRVWtzVVVGQlVTeERRVUZET3p0RlFVVmlMRWxCUVVrc1UwRkJVeXhEUVVGRExFMUJRVTBzUzBGQlN5eERRVUZETEVWQlFVVTdTVUZETVVJc1RVRkJUU3hKUVVGSkxFdEJRVXNzUTBGQlF5eDVRMEZCZVVNc1EwRkJReXhEUVVGRE8wZEJRelZFT3p0RlFVVkVMRkZCUVZFc1IwRkJSeXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdSVUZEZUVJc1UwRkJVeXhIUVVGSExGVkJRVlVzUTBGQlF5eExRVUZMTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN096dEZRVWQ0UXl4SlFVRkpMRk5CUVZNc1EwRkJReXhOUVVGTkxFdEJRVXNzUTBGQlF5eEZRVUZGTzBsQlF6RkNMRWxCUVVrc1UwRkJVeXhMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTzAxQlEzQkNMRTFCUVUwc1NVRkJTU3hMUVVGTExFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJRenRMUVVOdVF6dEpRVU5FTEU5QlFVOHNTMEZCU3l4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF6czdSMEZGT1VJc1RVRkJUU3hKUVVGSkxGTkJRVk1zUTBGQlF5eE5RVUZOTEV0QlFVc3NRMEZCUXl4RlFVRkZPMGxCUTJwRExGRkJRVkVzUjBGQlJ5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRlRUlzU1VGQlNTeFRRVUZUTEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVN1RVRkRjRUlzVFVGQlRTeEpRVUZKTEV0QlFVc3NRMEZCUXl4dlEwRkJiME1zUTBGQlF5eERRVUZETzB0QlEzWkVPMGxCUTBRc1NVRkJTU3hQUVVGUExGRkJRVkVzUzBGQlN5eFZRVUZWTEVWQlFVVTdUVUZEYkVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF6dFJRVU5VTEZGQlFWRXNSVUZCUlN4UlFVRlJPMUZCUTJ4Q0xFbEJRVWtzUlVGQlJTeFRRVUZUTEVOQlFVTXNSVUZCUlR0VlFVTm9RaXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1UwRkRlRUk3VDBGRFJpeERRVUZETEVOQlFVTTdTMEZEU2l4TlFVRk5MRWxCUVVrc1QwRkJUeXhSUVVGUkxFdEJRVXNzVVVGQlVTeEZRVUZGTzAxQlEzWkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU03VVVGRFZDeFJRVUZSTEVWQlFVVXNVVUZCVVR0UlFVTnNRaXhKUVVGSkxFVkJRVVVzVTBGQlV5eERRVUZETEVWQlFVVTdWVUZEYUVJc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEZOQlFWTXNRMEZCUXl4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NVVUZCVVN4RFFVRkRPMk5CUTNoQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXp0alFVTmFMRXRCUVVzc1NVRkJTU3hKUVVGSkxFbEJRVWtzVVVGQlVTeERRVUZETzJkQ1FVTjRRaXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dGxRVU0zUXp0alFVTkVMRTlCUVU4c1JVRkJSU3hEUVVGRE8yRkJRMWdzVFVGQlRTeE5RVUZOTEc5Q1FVRnZRaXhEUVVGRE8xZEJRMjVETEVOQlFVTXNRMEZCUXp0VFFVTktPMDlCUTBZc1EwRkJReXhEUVVGRE8wdEJRMG9zVFVGQlRUdE5RVU5NTEUxQlFVMHNTVUZCU1N4TFFVRkxMRU5CUVVNc01FUkJRVEJFTEVOQlFVTXNRMEZCUXp0TFFVTTNSVHM3U1VGRlJDeFBRVUZQTEVWQlFVVXNRMEZCUXp0SFFVTllPenRGUVVWRUxFMUJRVTBzU1VGQlNTeExRVUZMTEVOQlFVTXNNa05CUVRKRExFTkJRVU1zUTBGQlF6dERRVU01UkN4RFFVRkRPenM3UVVGSFJpeEZRVUZGTEVOQlFVTXNUMEZCVHl4SFFVRkhMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dEZRVU14UWl4SlFVRkpPMGxCUTBZc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEwd3NUMEZCVHl4SlFVRkpMRU5CUVVNN1IwRkRZaXhEUVVGRExFOUJRVThzUjBGQlJ5eEZRVUZGTzBsQlExb3NUMEZCVHl4TFFVRkxMRU5CUVVNN1IwRkRaRHREUVVOR0xFTkJRVU03T3p0QlFVZEdMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eEZRVUZGTEZWQlFWVXNRMEZCUXl4RFFVRkRPMFZCUXpkQ0xFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NVMEZCVXl4RlFVRkZPMGxCUXpGQ0xFOUJRVThzUTBGQlF5eERRVUZETzBkQlExWXNUVUZCVFN4TlFVRk5MRWxCUVVrc1MwRkJTeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1EwRkROVU1zUTBGQlF5eERRVUZET3pzN1FVRkhTQ3hKUVVGSkxGTkJRVk1zUjBGQlJ5eFZRVUZWTEVsQlFVa3NRMEZCUXp0RlFVTTNRaXhQUVVGUExFOUJRVThzU1VGQlNTeExRVUZMTEZGQlFWRXNTVUZCU1N4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNaMEpCUVdkQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEdkQ1FVRm5RaXhKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRE8wTkJRM1pKTEVOQlFVTTdPMEZCUlVZc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNVMEZCVXl4RFFVRkRMRVZCUVVVN1JVRkRla0lzUjBGQlJ5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSVHRKUVVOb1FpeE5RVUZOTEVsQlFVa3NTMEZCU3l4RFFVRkRMSEZDUVVGeFFpeERRVUZETEVOQlFVTTdSMEZEZUVNN1JVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF6dERRVU5XTEVOQlFVTXNRMEZCUXpzN1FVRkZTQ3hGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRGUVVNeFFpeEhRVUZITEU5QlFVOHNRMEZCUXl4TFFVRkxMRkZCUVZFc1JVRkJSVHRKUVVONFFpeE5RVUZOTEcxQ1FVRnRRaXhEUVVGRE8wZEJRek5DTzBWQlEwUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1EwRkRWaXhEUVVGRExFTkJRVU03TzBGQlJVZ3NSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFVkJRVVVzVlVGQlZTeERRVUZETEVOQlFVTTdSVUZETlVJc1NVRkJTU3hQUVVGUExFTkJRVU1zUzBGQlN5eFJRVUZSTEVWQlFVVTdTVUZEZWtJc1QwRkJUeXhEUVVGRExFTkJRVU03UjBGRFZpeE5RVUZOTEUxQlFVMHNiVUpCUVcxQ0xFTkJRVU03UTBGRGJFTXNRMEZCUXl4RFFVRkRPenRCUVVWSUxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RlFVRkZMRlZCUVZVc1EwRkJReXhEUVVGRE8wVkJRMmhETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhYUVVGWExFdEJRVXNzUzBGQlN5eEZRVUZGTzBsQlEyaERMRTlCUVU4c1EwRkJReXhEUVVGRE8wZEJRMVlzVFVGQlRTeE5RVUZOTEdOQlFXTXNRMEZCUXp0RFFVTTNRaXhEUVVGRExFTkJRVU1zUVVGRlNDeEJRVUZyUWpzN0luMD1cbiIsImltcG9ydCB7IGRlZmF1bHQgYXMgYXYgfSBmcm9tICdhdm9jYWRvLXR5cGUtY2hlY2tlci9idWlsZC9hdm9jYWRvX2VzJztcblxuYXYudHlwZSgnbGF0aXR1ZGUnLCBmdW5jdGlvbihkKSB7XG4gIHZhciBsID0gYXYoJ2Zsb2F0JykoZCkoKTtcbiAgaWYgKGwgPCAtOTAgfHwgbCA+IDkwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdsYXRpdHVkZSBtdXN0IGJlIGEgbnVtYmVyIGJldHdlZW4gLTkwIGFuZCA5MC4nKTtcbiAgfVxuICByZXR1cm4gZDtcbn0pO1xuXG5hdi50eXBlKCdsb25naXR1ZGUnLCBmdW5jdGlvbiAoZCl7XG4gIHZhciBsID0gYXYoJ2Zsb2F0JykoZCkoKTtcbiAgaWYgKGwgPCAtMTgwIHx8IGwgPiAxODApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2xvbmdpdHVkZSBtdXN0IGJlIGEgbnVtYmVyIGJldHdlZW4gLTE4MCBhbmQgMTgwLicpO1xuICB9XG4gIHJldHVybiBkO1xufSk7XG5cbmF2LnR5cGUoJ2xvY2F0aW9uJywge1xuICBpZDogJ3N0cmluZycsXG4gIC8vIGNvbW1lbnRlZCBmb3Igbm93IGJlY2F1c2UgZXhhbXBsZXMgdXNlIGRhdGEgd2l0aG91dCB2YWx1ZXNcbiAgLy8gYW5kIGF2b2NhZG8gZG9lc24ndCBzdXBwb3J0IG9wdGlvbmFsIGF0dHJpYnV0ZXMgeWV0LlxuICAvLyB2YWx1ZTogJ2ludCcsXG4gIGxvbmdpdHVkZTogJ2xvbmdpdHVkZScsXG4gIGxhdGl0dWRlOiAnbGF0aXR1ZGUnXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgYXY7XG5cbiIsImltcG9ydCB7IGRlZmF1bHQgYXMgYXYgfSBmcm9tICcuL192YWxpZGF0ZUxvY2F0aW9uJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oZDMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGF1dG96b29tID0gdHJ1ZTtcbiAgICB2YXIgaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSA1MDA7IC8vIG1zXG4gICAgdmFyIHBpID0gTWF0aC5QSTtcbiAgICB2YXIgdGF1ID0gMiAqIHBpO1xuICAgIHZhciByYWRpdXMgPSBkMy5zY2FsZVBvdygpXG4gICAgICAgIC5kb21haW4oWzEsIDEwXSlcbiAgICAgICAgLnJhbmdlKFszLCAxNV0pO1xuXG4gICAgdmFyIHN0cm9rZVdpZHRoID0gMC41O1xuXG4gICAgdmFyIHdyYXBwZXIgPSBkMy5zZWxlY3QoaWQpO1xuICAgIHZhciB3aWR0aCA9IHdyYXBwZXIubm9kZSgpLmNsaWVudFdpZHRoO1xuICAgIHZhciBoZWlnaHQgPSB3cmFwcGVyLm5vZGUoKS5jbGllbnRIZWlnaHQ7XG4gICAgdmFyIHNpemUgPSBbd2lkdGgsIGhlaWdodF07XG5cbiAgICB2YXIgdGlsZXNDb25maWcgPSB7XG4gICAgICB1cmw6ICdodHRwczovL21hcHMud2lraW1lZGlhLm9yZy9vc20taW50bC8nLFxuICAgICAgZXh0ZW5zaW9uOiAnLnBuZycsXG4gICAgICBzd2l0Y2hYWTogZmFsc2UsXG4gICAgICBmYWN0b3I6IDI1NlxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGQzLmdlb01lcmNhdG9yKClcbiAgICAgICAgLnNjYWxlKDEgLyB0YXUpXG4gICAgICAgIC50cmFuc2xhdGUoWzAsIDBdKTtcblxuICAgIHZhciBwYXRoID0gZDMuZ2VvUGF0aCgpXG4gICAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pOyAgXG5cbiAgICB2YXIgdGlsZSA9IGQzLnRpbGUoKVxuICAgICAgICAuc2l6ZShzaXplKTtcblxuICAgIHZhciB6b29tID0gZDMuem9vbSgpXG4gICAgICAgIC5zY2FsZUV4dGVudChbMSA8PCA5LCAxIDw8IDE0XSlcbiAgICAgICAgLm9uKCd6b29tJywgem9vbWVkKTtcblxuICAgIHZhciBzdmcgPSB3cmFwcGVyLnNlbGVjdCgnc3ZnJyk7XG4gICAgXG4gICAgaWYgKHN2Zy5lbXB0eSgpKSB7XG4gICAgICBzdmcgPSB3cmFwcGVyLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgICAuY2xhc3NlZCgnaW5mb3Z5ei1tYXAnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpO1xuXG4gICAgICBpZiAoIWludGVyYWN0aXZlKSB7XG4gICAgICAgIHN2Zy5zdHlsZSgncG9pbnRlci1ldmVudHMnLCAnbm9uZScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciByYXN0ZXIgPSBzdmcuYXBwZW5kKCdnJykuY2xhc3NlZCgndGlsZXMnLCB0cnVlKTtcbiAgICB2YXIgdmVjdG9yID0gc3ZnLmFwcGVuZCgnZycpLmNsYXNzZWQoJ292ZXJsYXknLCB0cnVlKTtcbiAgICB2YXIgbGVnZW5kID0gc3ZnLmFwcGVuZCgnZycpLmNsYXNzZWQoJ2xlZ2VuZCcsIHRydWUpO1xuXG4gICAgdmFyIHByZXZpb3VzVHJhbnNmb3JtO1xuICAgIGZ1bmN0aW9uIHpvb21lZCgpIHtcbiAgICAgIHZhciB0cmFuc2Zvcm0gPSBwcmV2aW91c1RyYW5zZm9ybSA9IGQzLmV2ZW50LnRyYW5zZm9ybTtcblxuICAgICAgdmFyIHRpbGVzID0gdGlsZVxuICAgICAgICAgIC5zY2FsZSh0cmFuc2Zvcm0uaylcbiAgICAgICAgICAudHJhbnNsYXRlKFt0cmFuc2Zvcm0ueCwgdHJhbnNmb3JtLnldKVxuICAgICAgICAgICgpO1xuXG4gICAgICB2ZWN0b3JcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHRyYW5zZm9ybSk7XG4gICAgICBcbiAgICAgIHZlY3Rvci5zZWxlY3RBbGwoJ2NpcmNsZS5hY3RpdmUnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJvamVjdGlvbihkLmdlb21ldHJ5LmNvb3JkaW5hdGVzKSArICcpJzsgfSlcbiAgICAgICAgLmF0dHIoJ3InLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIHJhZGl1cyhkLnByb3BlcnRpZXMudmFsdWUgfHwgMSkgLyB0cmFuc2Zvcm0uaztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIHN0cm9rZVdpZHRoIC8gdHJhbnNmb3JtLmspO1xuXG4gICAgICB2YXIgaW1hZ2UgPSByYXN0ZXJcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHN0cmluZ2lmeSh0aWxlcy5zY2FsZSwgdGlsZXMudHJhbnNsYXRlKSlcbiAgICAgICAgLnNlbGVjdEFsbCgnaW1hZ2UnKVxuICAgICAgICAuZGF0YSh0aWxlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSk7XG5cbiAgICAgIGltYWdlXG4gICAgICAgIC5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgIGltYWdlLmVudGVyKCkuYXBwZW5kKCdpbWFnZScpXG4gICAgICAgICAgLmF0dHIoJ3hsaW5rOmhyZWYnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGlsZXNDb25maWcudXJsICsgZFsyXSArICcvJyArIGRbMF0gKyAnLycgKyBkWzFdICsgdGlsZXNDb25maWcuZXh0ZW5zaW9uO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkWzBdICogdGlsZXNDb25maWcuZmFjdG9yOyB9KVxuICAgICAgICAgIC5hdHRyKCd5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZFsxXSAqIHRpbGVzQ29uZmlnLmZhY3RvcjsgfSlcbiAgICAgICAgICAuYXR0cignd2lkdGgnLCB0aWxlc0NvbmZpZy5mYWN0b3IpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIHRpbGVzQ29uZmlnLmZhY3Rvcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyaW5naWZ5KHNjYWxlLCB0cmFuc2xhdGUpIHtcbiAgICAgIHZhciBrID0gc2NhbGUgLyB0aWxlc0NvbmZpZy5mYWN0b3I7XG4gICAgICB2YXIgciA9IHNjYWxlICUgMSA/IE51bWJlciA6IE1hdGgucm91bmQ7XG4gICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcih0cmFuc2xhdGVbMF0gKiBzY2FsZSkgKyAnLCcgKyByKHRyYW5zbGF0ZVsxXSAqIHNjYWxlKSArICcpIHNjYWxlKCcgKyBrICsgJyknO1xuICAgIH1cblxuICAgIHZhciB0cmFuc2Zvcm1EYXRhID0gZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcbiAgICAgICAgZmVhdHVyZXM6IGQubWFwKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgYXYoJ2xvY2F0aW9uJykoZWwpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnRmVhdHVyZScsXG4gICAgICAgICAgICBpZDogZWwuaWQsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBlbCxcbiAgICAgICAgICAgIGdlb21ldHJ5OiB7dHlwZTogJ1BvaW50JywgY29vcmRpbmF0ZXM6IFsrZWwubG9uZ2l0dWRlLCArZWwubGF0aXR1ZGVdfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pXG4gICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgbWFwID0gZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIG5ld1dpZHRoID0gd3JhcHBlci5ub2RlKCkuY2xpZW50V2lkdGg7XG4gICAgICB2YXIgbmV3SGVpZ2h0ID0gd3JhcHBlci5ub2RlKCkuY2xpZW50SGVpZ2h0O1xuICAgICAgdmFyIF90cmFuc2l0aW9uRHVyYXRpb24gPSB0cmFuc2l0aW9uRHVyYXRpb247XG5cbiAgICAgIGlmICh3aWR0aCAhPT0gbmV3V2lkdGggfHwgaGVpZ2h0ICE9PSBuZXdIZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSBuZXdXaWR0aDtcbiAgICAgICAgaGVpZ2h0ID0gbmV3SGVpZ2h0O1xuICAgICAgICBfdHJhbnNpdGlvbkR1cmF0aW9uID0gMDtcbiAgICAgICAgc3ZnXG4gICAgICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdmVjdG9yLmRhdHVtKCkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIF90cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgICAgfVxuICAgICAgdmFyIGRhdGEgPSAodHlwZW9mIGQgIT09ICd1bmRlZmluZWQnKSA/IHRyYW5zZm9ybURhdGEoZCkgOiB2ZWN0b3IuZGF0dW0oKTtcblxuICAgICAgLy8gQ29tcHV0ZSB0aGUgcHJvamVjdGVkIGNlbnRlci5cbiAgICAgIHZhciBib3VuZHMgID0gcGF0aC5ib3VuZHMoZGF0YSk7XG4gICAgICB2YXIgYnggPSBib3VuZHNbMV1bMF0gLSBib3VuZHNbMF1bMF07XG4gICAgICB2YXIgYnkgPSBib3VuZHNbMV1bMV0gLSBib3VuZHNbMF1bMV07XG4gICAgICB2YXIgdHggPSAoYm91bmRzWzBdWzBdICsgYm91bmRzWzFdWzBdKSAvIDI7XG4gICAgICB2YXIgdHkgPSAoYm91bmRzWzBdWzFdICsgYm91bmRzWzFdWzFdKSAvIDI7XG4gICAgICB2YXIgc2NhbGUgPSAwLjggKiBNYXRoLm1pbih3aWR0aCAvIGJ4LCBoZWlnaHQgLyBieSk7XG5cbiAgICAgIHN2Zy5jYWxsKHpvb20pO1xuXG4gICAgICBpZiAoIWF1dG96b29tICYmIHR5cGVvZiB2ZWN0b3IuZGF0dW0oKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc3ZnXG4gICAgICAgICAgLmNhbGwoXG4gICAgICAgICAgICB6b29tLnRyYW5zZm9ybSxcbiAgICAgICAgICAgIGQzLnpvb21JZGVudGl0eVxuICAgICAgICAgICAgICAudHJhbnNsYXRlKHdpZHRoIC8gMiwgaGVpZ2h0IC8gMilcbiAgICAgICAgICAgICAgLnNjYWxlKDEgPDwgMTApXG4gICAgICAgICAgICAgIC50cmFuc2xhdGUoMCwgMClcbiAgICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXV0b3pvb20pIHtcbiAgICAgICAgc3ZnXG4gICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgIC5kdXJhdGlvbihfdHJhbnNpdGlvbkR1cmF0aW9uKVxuICAgICAgICAgIC5jYWxsKFxuICAgICAgICAgICAgem9vbS50cmFuc2Zvcm0sXG4gICAgICAgICAgICBkMy56b29tSWRlbnRpdHlcbiAgICAgICAgICAgICAgLnRyYW5zbGF0ZSh3aWR0aCAvIDIsIGhlaWdodCAvIDIpXG4gICAgICAgICAgICAgIC5zY2FsZShzY2FsZSlcbiAgICAgICAgICAgICAgLnRyYW5zbGF0ZSgtdHgsIC10eSlcbiAgICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICB2ZWN0b3IuZGF0dW0oZGF0YSk7XG5cbiAgICAgIHZhciBmZWF0dXJlcyA9ICh0eXBlb2YgZGF0YSAhPT0gJ3VuZGVmaW5lZCcpID8gZGF0YS5mZWF0dXJlcyA6IFtdO1xuXG4gICAgICB2YXIgdmFsdWVFeHRlbnQgPSBkMy5leHRlbnQoZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgcmV0dXJuIGYucHJvcGVydGllcy52YWx1ZSB8fCAxO1xuICAgICAgfSkpO1xuXG4gICAgICByYWRpdXMgPSBkMy5zY2FsZVBvdygpXG4gICAgICAgIC5kb21haW4odmFsdWVFeHRlbnQpXG4gICAgICAgIC5yYW5nZShbMywgMTVdKTtcblxuICAgICAgdmFyIGJ1YmJsZSA9IHZlY3RvclxuICAgICAgICAuc2VsZWN0QWxsKCdjaXJjbGUnKVxuICAgICAgICAuZGF0YShmZWF0dXJlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZDsgfSk7XG5cbiAgICAgIGJ1YmJsZVxuICAgICAgICAuZXhpdCgpXG4gICAgICAgIC5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSlcbiAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAuYXR0cigncicsIDApXG4gICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAwKVxuICAgICAgICAucmVtb3ZlKCk7XG5cbiAgICAgIHNjYWxlID0gKHByZXZpb3VzVHJhbnNmb3JtKSA/IHByZXZpb3VzVHJhbnNmb3JtLmsgOiBzY2FsZTtcbiAgICAgIGJ1YmJsZS5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgLmNsYXNzZWQoJ2FjdGl2ZScsIHRydWUpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7IHJldHVybiAndHJhbnNsYXRlKCcgKyBwcm9qZWN0aW9uKGQuZ2VvbWV0cnkuY29vcmRpbmF0ZXMpICsgJyknOyB9KVxuICAgICAgICAuYXR0cigncicsIDApXG4gICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAwKVxuICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgIC5hdHRyKCdyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiByYWRpdXMoZC5wcm9wZXJ0aWVzLnZhbHVlIHx8IDEpIC8gc2NhbGU7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCBzdHJva2VXaWR0aCAvIHNjYWxlKTtcblxuICAgICAgbGVnZW5kXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyAod2lkdGggLSByYWRpdXModmFsdWVFeHRlbnRbMV0pIC0gMTApICsgJywnICsgKGhlaWdodCAtIDEwKSArICcpJyk7XG5cbiAgICAgIHZhciBsZWdlbmRFbGVtZW50ID0gbGVnZW5kLnNlbGVjdEFsbCgnZycpXG4gICAgICAgIC5kYXRhKHZhbHVlRXh0ZW50KVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ2cnKTtcblxuICAgICAgbGVnZW5kRWxlbWVudC5hcHBlbmQoJ2NpcmNsZScpO1xuXG4gICAgICBsZWdlbmQuc2VsZWN0QWxsKCdjaXJjbGUnKVxuICAgICAgICAuZGF0YSh2YWx1ZUV4dGVudClcbiAgICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gLShyYWRpdXMoZCkpOyB9KVxuICAgICAgICAuYXR0cigncicsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHJhZGl1cyhkKTsgfSk7XG5cbiAgICAgIGxlZ2VuZEVsZW1lbnQuYXBwZW5kKCd0ZXh0Jyk7XG5cbiAgICAgIGxlZ2VuZC5zZWxlY3RBbGwoJ3RleHQnKVxuICAgICAgICAuZGF0YSh2YWx1ZUV4dGVudClcbiAgICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7IHJldHVybiAtMiAqIChyYWRpdXMoZCkpOyB9KVxuICAgICAgICAuYXR0cignZHknLCBmdW5jdGlvbigpIHsgcmV0dXJuICctLjJlbSc7IH0pXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpeyByZXR1cm4gZDsgfSk7XG5cbiAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuICAgIG1hcC5wYW5UbyA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmICh0eXBlb2YgZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXAucGFuVG8oKSBjYWxsZWQgd2l0aG91dCBsb2NhdGlvbi4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBkLmxvbmdpdHVkZSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIGQubGF0aXR1ZGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbWFwLnBhblRvKCkgY2FsbGVkIHdpdGhvdXQgdmFsaWQgbG9jYXRpb24uJyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB0ID0gcHJvamVjdGlvbihbZC5sb25naXR1ZGUsIGQubGF0aXR1ZGVdKTtcbiAgICAgIHZhciB6ID0gZC56b29tIHx8IDEwO1xuICAgICAgc3ZnXG4gICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcbiAgICAgICAgLmNhbGwoXG4gICAgICAgICAgem9vbS50cmFuc2Zvcm0sXG4gICAgICAgICAgZDMuem9vbUlkZW50aXR5XG4gICAgICAgICAgICAudHJhbnNsYXRlKHdpZHRoIC8gMiwgaGVpZ2h0IC8gMilcbiAgICAgICAgICAgIC5zY2FsZSgxIDw8IHopXG4gICAgICAgICAgICAudHJhbnNsYXRlKC10WzBdLCAtdFsxXSlcbiAgICAgICAgKTtcbiAgICB9O1xuXG4gICAgbWFwLmF1dG96b29tID0gZnVuY3Rpb24oZCkge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBhdXRvem9vbTtcbiAgICAgIGF1dG96b29tID0gZDtcbiAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuICAgIG1hcC5pbnRlcmFjdGl2ZSA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gaW50ZXJhY3RpdmU7XG4gICAgICBpbnRlcmFjdGl2ZSA9IGQ7XG5cbiAgICAgIGlmICghaW50ZXJhY3RpdmUpIHtcbiAgICAgICAgc3ZnLnN0eWxlKCdwb2ludGVyLWV2ZW50cycsICdub25lJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdmcuc3R5bGUoJ3BvaW50ZXItZXZlbnRzJywgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuICAgIG1hcC50cmFuc2l0aW9uRHVyYXRpb24gPSBmdW5jdGlvbihkKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRyYW5zaXRpb25EdXJhdGlvbjtcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbiA9IGQ7XG4gICAgICByZXR1cm4gbWFwO1xuICAgIH07XG5cbiAgICByZXR1cm4gbWFwO1xuICB9O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oZDMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIHRyYW5zaXRpb25EdXJhdGlvbiA9IDUwMDtcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMjAsIHJpZ2h0OiAyMCwgYm90dG9tOiAzMCwgbGVmdDogNDV9O1xuXG4gICAgdmFyIHdyYXBwZXIgPSBkMy5zZWxlY3QoaWQpO1xuICAgIHZhciB3cmFwcGVyV2lkdGggPSB3cmFwcGVyLm5vZGUoKS5jbGllbnRXaWR0aDtcbiAgICB2YXIgd3JhcHBlckhlaWdodCA9IHdyYXBwZXIubm9kZSgpLmNsaWVudEhlaWdodDtcblxuICAgIHZhciBzdmcgPSB3cmFwcGVyLnNlbGVjdCgnc3ZnIGcudmlld3BvcnQnKTtcbiAgICB2YXIgZ1hBeGlzID0gd3JhcHBlci5zZWxlY3QoJ3N2ZyBnLnZpZXdwb3J0IGcueC5heGlzJyk7XG4gICAgdmFyIGdZQXhpcyA9IHdyYXBwZXIuc2VsZWN0KCdzdmcgZy52aWV3cG9ydCBnLnkuYXhpcycpO1xuXG4gICAgaWYgKHN2Zy5lbXB0eSgpKSB7XG4gICAgICBzdmcgPSB3cmFwcGVyLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgLmNsYXNzZWQoJ2luZm92eXotbGluZWNoYXJ0JywgdHJ1ZSlcbiAgICAgICAgLmF0dHIoJ3dpZHRoJywgd3JhcHBlcldpZHRoKVxuICAgICAgICAuYXR0cignaGVpZ2h0Jywgd3JhcHBlckhlaWdodClcbiAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ZpZXdwb3J0JylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgbWFyZ2luLmxlZnQgKyAnLCcgKyBtYXJnaW4udG9wICsgJyknKTtcbiAgICAgIFxuICAgICAgZ1hBeGlzID0gc3ZnXG4gICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAneCBheGlzJyk7XG4gICAgICBcbiAgICAgIGdZQXhpcyA9IHN2Z1xuICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3kgYXhpcycpO1xuICAgIH1cbiAgICBcbiAgICB2YXIgbGluZWNoYXJ0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIF90cmFuc2l0aW9uRHVyYXRpb24gPSB0cmFuc2l0aW9uRHVyYXRpb247XG5cbiAgICAgIHdyYXBwZXJXaWR0aCA9IHdyYXBwZXIubm9kZSgpLmNsaWVudFdpZHRoO1xuICAgICAgd3JhcHBlckhlaWdodCA9IHdyYXBwZXIubm9kZSgpLmNsaWVudEhlaWdodDtcblxuICAgICAgdmFyIHdpZHRoID0gd3JhcHBlcldpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQ7XG4gICAgICB2YXIgaGVpZ2h0ID0gd3JhcHBlckhlaWdodCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuICAgICAgXG4gICAgICB2YXIgeCA9IGQzLnNjYWxlVGltZSgpLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7XG4gICAgICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKCkucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XG4gICAgICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbChkMy5zY2hlbWVDYXRlZ29yeTEwKTtcbiAgICAgIFxuICAgICAgdmFyIGxpbmUgPSBkMy5saW5lKClcbiAgICAgIC5jdXJ2ZShkMy5jdXJ2ZUJhc2lzKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGUpOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4geShkLnZhbHVlKTsgfSk7XG4gICAgICBcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRhdGEgPSB3cmFwcGVyLnNlbGVjdEFsbCgnc3ZnIGcudmlld3BvcnQgcGF0aC5saW5lJykuZGF0YSgpO1xuICAgICAgICBfdHJhbnNpdGlvbkR1cmF0aW9uID0gMDtcbiAgICAgIH1cblxuICAgICAgeC5kb21haW4oZDMuZXh0ZW50KGRhdGEucmVkdWNlKGZ1bmN0aW9uKHAsIGMpIHtcbiAgICAgICAgYy52YWx1ZXMubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBwLnB1c2goZC5kYXRlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgICAgfSwgW10pKSk7XG5cbiAgICAgIHkuZG9tYWluKFtcbiAgICAgICAgZDMubWluKGRhdGEsIGZ1bmN0aW9uKGMpIHsgcmV0dXJuIGQzLm1pbihjLnZhbHVlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZTsgfSk7IH0pLFxuICAgICAgICBkMy5tYXgoZGF0YSwgZnVuY3Rpb24oYykgeyByZXR1cm4gZDMubWF4KGMudmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTsgfSlcbiAgICAgIF0pO1xuXG4gICAgICB6LmRvbWFpbihkYXRhLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBjLmlkOyB9KSk7XG5cbiAgICAgIHdyYXBwZXIuc2VsZWN0QWxsKCdzdmcnKVxuICAgICAgICAuYXR0cignd2lkdGgnLCB3cmFwcGVyV2lkdGgpXG4gICAgICAgIC5hdHRyKCdoZWlnaHQnLCB3cmFwcGVySGVpZ2h0KTtcbiAgICAgIFxuICAgICAgdmFyIHQgPSBkMy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKF90cmFuc2l0aW9uRHVyYXRpb24pO1xuXG4gICAgICB2YXIgZmFkZVRyYW5zaXRpb24gPSBkMy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDApXG4gICAgICAgIC5kZWxheSg1MDApO1xuXG4gICAgICBnWEF4aXNcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgaGVpZ2h0ICsgJyknKVxuICAgICAgICAudHJhbnNpdGlvbih0KVxuICAgICAgICAuY2FsbChkMy5heGlzQm90dG9tKHgpLnRpY2tzKHdpZHRoIC8gNzUpKTtcblxuICAgICAgZ1lBeGlzXG4gICAgICAgIC50cmFuc2l0aW9uKHQpXG4gICAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHkpLnRpY2tzKGhlaWdodCAvIDUwKSk7XG5cbiAgICAgIHZhciBsaW5lcyA9IHN2Zy5zZWxlY3RBbGwoJ3BhdGgubGluZScpXG4gICAgICAgIC5kYXRhKGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQ7IH0pO1xuICAgICAgXG4gICAgICBsaW5lc1xuICAgICAgICAuZXhpdCgpXG4gICAgICAgIC5jbGFzc2VkKCdleGl0JywgdHJ1ZSlcbiAgICAgICAgLnRyYW5zaXRpb24oZmFkZVRyYW5zaXRpb24pXG4gICAgICAgIC5yZW1vdmUoKTtcblxuICAgICAgbGluZXNcbiAgICAgICAgLnRyYW5zaXRpb24odClcbiAgICAgICAgLmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGxpbmUoZC52YWx1ZXMpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICBsaW5lc1xuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4geihkLmlkKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGxpbmUoZC52YWx1ZXMpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbGluZWNoYXJ0LnRyYW5zaXRpb25EdXJhdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdHJhbnNpdGlvbkR1cmF0aW9uO1xuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uID0gZDtcbiAgICAgIHJldHVybiBsaW5lY2hhcnQ7XG4gICAgfTtcblxuICAgIHJldHVybiBsaW5lY2hhcnQ7XG4gIH07XG59XG4iLCJpbXBvcnQgYmFyY2hhcnQgZnJvbSAnLi9zcmMvYmFyY2hhcnQnO1xuaW1wb3J0IG1hcCBmcm9tICcuL3NyYy9tYXAnO1xuaW1wb3J0IGxpbmVjaGFydCBmcm9tICcuL3NyYy9saW5lY2hhcnQnO1xuXG52YXIgaW5mb3Z5eiA9IGZ1bmN0aW9uKGQzKSB7XG4gIHJldHVybiB7XG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBiYXJjaGFydDogYmFyY2hhcnQoZDMpLFxuICAgIGxpbmVjaGFydDogbGluZWNoYXJ0KGQzKSxcbiAgICBtYXA6IG1hcChkMylcbiAgfTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGluZm92eXo7XG4iXSwibmFtZXMiOlsiYXYiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGVBQWUsU0FBUyxFQUFFLEVBQUU7RUFDMUIsT0FBTyxTQUFTLEVBQUUsRUFBRTs7SUFFbEIsSUFBSSxrQkFBa0IsR0FBRyxHQUFHLENBQUM7SUFDN0IsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztJQUU1QixJQUFJLFFBQVEsR0FBRyxVQUFVLElBQUksRUFBRTtNQUM3QixJQUFJLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO01BQzdDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDMUIsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO09BQy9DOztNQUVELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7O01BRXZELElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQztNQUNoQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3JCLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDM0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7O01BRXJCLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUM5QixPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztPQUMxQixDQUFDLENBQUM7O01BRUgsSUFBSSxHQUFHLEdBQUcsT0FBTztTQUNkLFNBQVMsQ0FBQyxZQUFZLENBQUM7U0FDdkIsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7TUFFN0MsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDOztNQUVwQixJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFO1NBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDYixJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztNQUUzQixLQUFLO1NBQ0YsTUFBTSxDQUFDLEtBQUssQ0FBQztTQUNiLElBQUksQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDO1NBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtVQUNqQixPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDYixDQUFDLENBQUM7O01BRUwsS0FBSztTQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDYixJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQztTQUM1QixLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzs7TUFFN0QsS0FBSztTQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDYixJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDOztNQUVsQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFO1NBQ3BCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOztNQUVqQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUM7U0FDbkMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUNiLEtBQUssQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztNQUU3RCxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7U0FDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztNQUV2RCxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQzFCLENBQUM7O0lBRUYsUUFBUSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxFQUFFO01BQ3hDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxrQkFBa0IsQ0FBQztNQUN0RCxrQkFBa0IsR0FBRyxDQUFDLENBQUM7TUFDdkIsT0FBTyxRQUFRLENBQUM7S0FDakIsQ0FBQzs7SUFFRixPQUFPLFFBQVEsQ0FBQztHQUNqQixDQUFDO0NBQ0gsQ0FBQTs7QUN4RUQsSUFBSSxVQUFVLEdBQUcsU0FBUyxHQUFHLEVBQUUsUUFBUSxFQUFFO0VBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztHQUM3Qzs7RUFFRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtJQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7R0FDaEQ7O0VBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDbkMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtNQUNoQyxPQUFPLENBQUMsQ0FBQztLQUNWO0dBQ0Y7O0VBRUQsT0FBTyxDQUFDLENBQUMsQ0FBQztDQUNYLENBQUM7O0FBRUYsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDOzs7Ozs7QUFNZixJQUFJQSxJQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsUUFBUSxDQUFDOztFQUU3QixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0lBQzFCLE9BQU9BLElBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDbkI7OztFQUdELElBQUksRUFBRSxDQUFDOztFQUVQLElBQUksRUFBRSxHQUFHLFVBQVUsQ0FBQyxDQUFDO0lBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO01BQ3JCLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNYLEtBQUssSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO1VBQ2xCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztTQUN0QjtRQUNELE9BQU8sQ0FBQyxDQUFDO09BQ1YsTUFBTTtRQUNMLE9BQU8sRUFBRSxDQUFDO09BQ1g7S0FDRjtJQUNELEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7O0lBRWpCLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxDQUFDO01BQ3pCLEtBQUssSUFBSSxXQUFXLElBQUksRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7T0FDbkM7S0FDRjtHQUNGLENBQUM7O0VBRUYsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDOztFQUVOLE9BQU8sRUFBRSxDQUFDO0NBQ1gsQ0FBQzs7QUFFRkEsSUFBRSxDQUFDLElBQUksR0FBRyxXQUFXO0VBQ25CLElBQUksU0FBUyxDQUFDO0VBQ2QsSUFBSSxRQUFRLENBQUM7RUFDYixJQUFJLFFBQVEsQ0FBQzs7RUFFYixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztHQUM1RDs7RUFFRCxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3hCLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDOzs7RUFHeEMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtJQUMxQixJQUFJLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRTtNQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDbkM7SUFDRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUM7O0dBRTlCLE1BQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtJQUNqQyxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLElBQUksU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFO01BQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztLQUN2RDtJQUNELElBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxFQUFFO01BQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDVCxRQUFRLEVBQUUsUUFBUTtRQUNsQixJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUU7VUFDaEIsT0FBT0EsSUFBRSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4QjtPQUNGLENBQUMsQ0FBQztLQUNKLE1BQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7TUFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUNULFFBQVEsRUFBRSxRQUFRO1FBQ2xCLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRTtVQUNoQixPQUFPQSxJQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQ3ZCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDO2NBQ3hCLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQztjQUNaLEtBQUssSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDO2dCQUN4QixFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUdBLElBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7ZUFDN0M7Y0FDRCxPQUFPLEVBQUUsQ0FBQzthQUNYLE1BQU0sTUFBTSxvQkFBb0IsQ0FBQztXQUNuQyxDQUFDLENBQUM7U0FDSjtPQUNGLENBQUMsQ0FBQztLQUNKLE1BQU07TUFDTCxNQUFNLElBQUksS0FBSyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7S0FDN0U7O0lBRUQsT0FBT0EsSUFBRSxDQUFDO0dBQ1g7O0VBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO0NBQzlELENBQUM7OztBQUdGQSxJQUFFLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUMxQixJQUFJO0lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsT0FBTyxJQUFJLENBQUM7R0FDYixDQUFDLE9BQU8sR0FBRyxFQUFFO0lBQ1osT0FBTyxLQUFLLENBQUM7R0FDZDtDQUNGLENBQUM7OztBQUdGQSxJQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztFQUM3QixJQUFJLE9BQU8sQ0FBQyxLQUFLLFNBQVMsRUFBRTtJQUMxQixPQUFPLENBQUMsQ0FBQztHQUNWLE1BQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0NBQzVDLENBQUMsQ0FBQzs7O0FBR0gsSUFBSSxTQUFTLEdBQUcsVUFBVSxJQUFJLENBQUM7RUFDN0IsT0FBTyxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLGdCQUFnQixJQUFJLElBQUksR0FBRyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQztDQUN2SSxDQUFDOztBQUVGQSxJQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRTtFQUN6QixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztHQUN4QztFQUNELE9BQU8sQ0FBQyxDQUFDO0NBQ1YsQ0FBQyxDQUFDOztBQUVIQSxJQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztFQUMxQixHQUFHLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtJQUN4QixNQUFNLG1CQUFtQixDQUFDO0dBQzNCO0VBQ0QsT0FBTyxDQUFDLENBQUM7Q0FDVixDQUFDLENBQUM7O0FBRUhBLElBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0VBQzVCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUFFO0lBQ3pCLE9BQU8sQ0FBQyxDQUFDO0dBQ1YsTUFBTSxNQUFNLG1CQUFtQixDQUFDO0NBQ2xDLENBQUMsQ0FBQzs7QUFFSEEsSUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7RUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7SUFDaEMsT0FBTyxDQUFDLENBQUM7R0FDVixNQUFNLE1BQU0sY0FBYyxDQUFDO0NBQzdCLENBQUMsQ0FBQyxBQUVILEFBQWtCLEFBQ2xCOztBQ2xLQUEsSUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDOUIsSUFBSSxDQUFDLEdBQUdBLElBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0VBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO0dBQ2xFO0VBQ0QsT0FBTyxDQUFDLENBQUM7Q0FDVixDQUFDLENBQUM7O0FBRUhBLElBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0VBQy9CLElBQUksQ0FBQyxHQUFHQSxJQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztFQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFO0lBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztHQUNyRTtFQUNELE9BQU8sQ0FBQyxDQUFDO0NBQ1YsQ0FBQyxDQUFDOztBQUVIQSxJQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtFQUNsQixFQUFFLEVBQUUsUUFBUTs7OztFQUlaLFNBQVMsRUFBRSxXQUFXO0VBQ3RCLFFBQVEsRUFBRSxVQUFVO0NBQ3JCLENBQUMsQ0FBQyxBQUVILEFBQWtCOztBQ3pCbEIsVUFBZSxTQUFTLEVBQUUsRUFBRTtFQUMxQixPQUFPLFNBQVMsRUFBRSxFQUFFO0lBQ2xCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztJQUNwQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsSUFBSSxrQkFBa0IsR0FBRyxHQUFHLENBQUM7SUFDN0IsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNqQixJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUU7U0FDckIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2YsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0lBRXBCLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQzs7SUFFdEIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDO0lBQ3ZDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7SUFDekMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7O0lBRTNCLElBQUksV0FBVyxHQUFHO01BQ2hCLEdBQUcsRUFBRSxzQ0FBc0M7TUFDM0MsU0FBUyxFQUFFLE1BQU07TUFDakIsUUFBUSxFQUFFLEtBQUs7TUFDZixNQUFNLEVBQUUsR0FBRztLQUNaLENBQUM7O0lBRUYsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUM1QixLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNkLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUV2QixJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFO1NBQ2xCLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7SUFFNUIsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRTtTQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFFaEIsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRTtTQUNmLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7O0lBRXhCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7O0lBRWhDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO01BQ2YsR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1dBQ3RCLE9BQU8sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDO1dBQzVCLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO1dBQ3BCLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7O01BRTVCLElBQUksQ0FBQyxXQUFXLEVBQUU7UUFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztPQUNyQztLQUNGOztJQUVELElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRCxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEQsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDOztJQUVyRCxJQUFJLGlCQUFpQixDQUFDO0lBQ3RCLFNBQVMsTUFBTSxHQUFHO01BQ2hCLElBQUksU0FBUyxHQUFHLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDOztNQUV2RCxJQUFJLEtBQUssR0FBRyxJQUFJO1dBQ1gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7V0FDbEIsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsQ0FBQzs7TUFFUCxNQUFNO1NBQ0gsSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQzs7TUFFaEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7U0FDOUIsSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbEcsSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsRUFBRTtVQUNyQixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO1NBQ3RELENBQUM7U0FDRCxJQUFJLENBQUMsY0FBYyxFQUFFLFdBQVcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7O01BRW5ELElBQUksS0FBSyxHQUFHLE1BQU07U0FDZixJQUFJLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxRCxTQUFTLENBQUMsT0FBTyxDQUFDO1NBQ2xCLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7TUFFMUMsS0FBSztTQUNGLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDOztNQUVuQixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztXQUN4QixJQUFJLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQzlCLE9BQU8sV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUM7V0FDakYsQ0FBQztXQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztXQUM1RCxJQUFJLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7V0FDNUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDO1dBQ2pDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3pDOztJQUVELFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7TUFDbkMsSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7TUFDbkMsSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztNQUN4QyxPQUFPLFlBQVksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLFVBQVUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0tBQ3RHOztJQUVELElBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxFQUFFO01BQzlCLE9BQU87UUFDTCxJQUFJLEVBQUUsbUJBQW1CO1FBQ3pCLFFBQVEsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFO1VBQzNCQSxJQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7VUFDbkIsT0FBTztZQUNMLElBQUksRUFBRSxTQUFTO1lBQ2YsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ1QsVUFBVSxFQUFFLEVBQUU7WUFDZCxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztXQUN0RSxDQUFDO1NBQ0gsQ0FBQztPQUNILENBQUM7S0FDSCxDQUFDOztJQUVGLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxFQUFFO01BQ3BCLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUM7TUFDMUMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQztNQUM1QyxJQUFJLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDOztNQUU3QyxJQUFJLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUM5QyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ2pCLE1BQU0sR0FBRyxTQUFTLENBQUM7UUFDbkIsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLEdBQUc7V0FDQSxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQztXQUNwQixJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO09BQzNCOztNQUVELElBQUksT0FBTyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssV0FBVyxFQUFFO1FBQ3pDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztPQUN6QjtNQUNELElBQUksSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssV0FBVyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7O01BRzFFLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7TUFDaEMsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNyQyxJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3JDLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztNQUMzQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7TUFDM0MsSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7O01BRXBELEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O01BRWYsSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxXQUFXLEVBQUU7UUFDdEQsR0FBRztXQUNBLElBQUk7WUFDSCxJQUFJLENBQUMsU0FBUztZQUNkLEVBQUUsQ0FBQyxZQUFZO2VBQ1osU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQztlQUNoQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztlQUNkLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1dBQ25CLENBQUM7T0FDTDs7TUFFRCxJQUFJLFFBQVEsRUFBRTtRQUNaLEdBQUc7V0FDQSxVQUFVLEVBQUU7V0FDWixRQUFRLENBQUMsbUJBQW1CLENBQUM7V0FDN0IsSUFBSTtZQUNILElBQUksQ0FBQyxTQUFTO1lBQ2QsRUFBRSxDQUFDLFlBQVk7ZUFDWixTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2VBQ2hDLEtBQUssQ0FBQyxLQUFLLENBQUM7ZUFDWixTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7V0FDdkIsQ0FBQztPQUNMOztNQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7O01BRW5CLElBQUksUUFBUSxHQUFHLENBQUMsT0FBTyxJQUFJLEtBQUssV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7O01BRWxFLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUNuRCxPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztPQUNoQyxDQUFDLENBQUMsQ0FBQzs7TUFFSixNQUFNLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRTtTQUNuQixNQUFNLENBQUMsV0FBVyxDQUFDO1NBQ25CLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDOztNQUVsQixJQUFJLE1BQU0sR0FBRyxNQUFNO1NBQ2hCLFNBQVMsQ0FBQyxRQUFRLENBQUM7U0FDbkIsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7TUFFaEQsTUFBTTtTQUNILElBQUksRUFBRTtTQUNOLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDO1NBQ3hCLFVBQVUsRUFBRTtTQUNaLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ1osSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7U0FDdkIsTUFBTSxFQUFFLENBQUM7O01BRVosS0FBSyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO01BQzFELE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQzVCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDO1NBQ3ZCLElBQUksQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLFlBQVksR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ2xHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ1osSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7U0FDdkIsVUFBVSxFQUFFO1NBQ1osSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsRUFBRTtVQUNyQixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDaEQsQ0FBQztTQUNELElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxHQUFHLEtBQUssQ0FBQyxDQUFDOztNQUU3QyxNQUFNO1NBQ0gsSUFBSSxDQUFDLFdBQVcsRUFBRSxZQUFZLEdBQUcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzs7TUFFdkcsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7U0FDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUNqQixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7O01BRXZCLGFBQWEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O01BRS9CLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1NBQ3ZCLElBQUksQ0FBQyxXQUFXLENBQUM7U0FDakIsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUNoRCxJQUFJLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7O01BRWhELGFBQWEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7O01BRTdCLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1NBQ3JCLElBQUksQ0FBQyxXQUFXLENBQUM7U0FDakIsSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDbkQsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDO1NBQzFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztNQUVsQyxPQUFPLEdBQUcsQ0FBQztLQUNaLENBQUM7O0lBRUYsR0FBRyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsRUFBRTtNQUN0QixJQUFJLE9BQU8sQ0FBQyxLQUFLLFdBQVcsRUFBRTtRQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7T0FDekQ7O01BRUQsSUFBSSxPQUFPLENBQUMsQ0FBQyxTQUFTLEtBQUssV0FBVyxJQUFJLE9BQU8sQ0FBQyxDQUFDLFFBQVEsS0FBSyxXQUFXLEVBQUU7UUFDM0UsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO09BQy9EOztNQUVELElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7TUFDckIsR0FBRztTQUNBLFVBQVUsRUFBRTtTQUNaLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztTQUM1QixJQUFJO1VBQ0gsSUFBSSxDQUFDLFNBQVM7VUFDZCxFQUFFLENBQUMsWUFBWTthQUNaLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUM7YUFDaEMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDYixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDM0IsQ0FBQztLQUNMLENBQUM7O0lBRUYsR0FBRyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsRUFBRTtNQUN6QixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sUUFBUSxDQUFDO01BQzVDLFFBQVEsR0FBRyxDQUFDLENBQUM7TUFDYixPQUFPLEdBQUcsQ0FBQztLQUNaLENBQUM7O0lBRUYsR0FBRyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsRUFBRTtNQUM1QixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sV0FBVyxDQUFDO01BQy9DLFdBQVcsR0FBRyxDQUFDLENBQUM7O01BRWhCLElBQUksQ0FBQyxXQUFXLEVBQUU7UUFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztPQUNyQyxNQUFNO1FBQ0wsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNuQzs7TUFFRCxPQUFPLEdBQUcsQ0FBQztLQUNaLENBQUM7O0lBRUYsR0FBRyxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxFQUFFO01BQ25DLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxrQkFBa0IsQ0FBQztNQUN0RCxrQkFBa0IsR0FBRyxDQUFDLENBQUM7TUFDdkIsT0FBTyxHQUFHLENBQUM7S0FDWixDQUFDOztJQUVGLE9BQU8sR0FBRyxDQUFDO0dBQ1osQ0FBQztDQUNILENBQUE7O0FDeFJELGdCQUFlLFNBQVMsRUFBRSxFQUFFO0VBQzFCLE9BQU8sU0FBUyxFQUFFLEVBQUU7SUFDbEIsSUFBSSxrQkFBa0IsR0FBRyxHQUFHLENBQUM7SUFDN0IsSUFBSSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7O0lBRXhELElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUIsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQztJQUM5QyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDOztJQUVoRCxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDM0MsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ3ZELElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQzs7SUFFdkQsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUU7TUFDZixHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDeEIsT0FBTyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQztTQUNsQyxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztTQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQztTQUM3QixNQUFNLENBQUMsR0FBRyxDQUFDO1dBQ1QsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUM7V0FDekIsSUFBSSxDQUFDLFdBQVcsRUFBRSxZQUFZLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQzs7TUFFNUUsTUFBTSxHQUFHLEdBQUc7U0FDVCxNQUFNLENBQUMsR0FBRyxDQUFDO1NBQ1gsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQzs7TUFFM0IsTUFBTSxHQUFHLEdBQUc7U0FDVCxNQUFNLENBQUMsR0FBRyxDQUFDO1NBQ1gsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztLQUM1Qjs7SUFFRCxJQUFJLFNBQVMsR0FBRyxTQUFTLElBQUksRUFBRTtNQUM3QixJQUFJLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDOztNQUU3QyxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQztNQUMxQyxhQUFhLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQzs7TUFFNUMsSUFBSSxLQUFLLEdBQUcsWUFBWSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztNQUN0RCxJQUFJLE1BQU0sR0FBRyxhQUFhLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDOztNQUV4RCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7TUFDOUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2pELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUM7O01BRTdDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUU7T0FDbkIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7T0FDcEIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztPQUNwQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7O01BRXZDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDMUIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1RCxtQkFBbUIsR0FBRyxDQUFDLENBQUM7T0FDekI7O01BRUQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQzVDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1VBQ3ZCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hCLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxDQUFDO09BQ1YsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7O01BRVQsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNQLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3ZGLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO09BQ3hGLENBQUMsQ0FBQzs7TUFFSCxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7TUFFakQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7U0FDckIsSUFBSSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUM7U0FDM0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQzs7TUFFakMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRTtTQUNwQixRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7TUFFakMsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRTtTQUNqQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ1gsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztNQUVkLE1BQU07U0FDSCxJQUFJLENBQUMsV0FBVyxFQUFFLGNBQWMsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO1NBQ2hELFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDYixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7O01BRTVDLE1BQU07U0FDSCxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQ2IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOztNQUUzQyxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUNuQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztNQUU1QyxLQUFLO1NBQ0YsSUFBSSxFQUFFO1NBQ04sT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUM7U0FDckIsVUFBVSxDQUFDLGNBQWMsQ0FBQztTQUMxQixNQUFNLEVBQUUsQ0FBQzs7TUFFWixLQUFLO1NBQ0YsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUNiLElBQUksQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEVBQUU7VUFDckIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZCLENBQUMsQ0FBQzs7TUFFTCxLQUFLO1NBQ0YsS0FBSyxFQUFFO1NBQ1AsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUNkLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO1NBQ3JCLEtBQUssQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7VUFDM0IsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2hCLENBQUM7U0FDRCxJQUFJLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1VBQ3JCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN2QixDQUFDLENBQUM7S0FDTixDQUFDOztJQUVGLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLENBQUMsRUFBRTtNQUN6QyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sa0JBQWtCLENBQUM7TUFDdEQsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO01BQ3ZCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCLENBQUM7O0lBRUYsT0FBTyxTQUFTLENBQUM7R0FDbEIsQ0FBQztDQUNILENBQUE7O0FDdkhELElBQUksT0FBTyxHQUFHLFNBQVMsRUFBRSxFQUFFO0VBQ3pCLE9BQU87SUFDTCxPQUFPLEVBQUUsT0FBTztJQUNoQixRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztJQUN0QixTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztJQUN4QixHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztHQUNiLENBQUM7Q0FDSCxDQUFDLEFBRUYsQUFBdUI7Ozs7In0=
