(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.infovyz = factory());
}(this, (function () { 'use strict';

var map = function(d3) {
  return function(id) {
    var autozoom = true;
    var transitionDuration = 500; // ms
    var pi = Math.PI;
    var tau = 2 * pi;
    var radius = d3.scalePow()
        .domain([1, 10])
        .range([3, 15]);

    var strokeWidth = 0.5;

    var wrapper = d3.select(id);
    var width = parseInt(wrapper.style('width').replace('px', ''), 10);
    var height = parseInt(wrapper.style('height').replace('px', ''), 10);
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
    }

    var raster = svg.append('g').classed('tiles', true);

    var vector = svg.append('g').classed('overlay', true);

    var previousTransform;
    function zoomed() {
      var transform = previousTransform = d3.event.transform;

      var tiles = tile
          .scale(transform.k)
          .translate([transform.x, transform.y])
          ();

      vector
        .attr('transform', transform);
      
      vector.selectAll('circle')
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
          .attr('xlink:href', function(d) { return tilesConfig.url + d[2] + '/' + d[0] + '/' + d[1] + tilesConfig.extension; })
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
      var newWidth = parseInt(wrapper.style('width').replace('px', ''), 10);
      var newHeight = parseInt(wrapper.style('height').replace('px', ''), 10);
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

      radius.domain(d3.extent(data.features.map(function(f) {
        return f.properties.value || 1;
      })));

      var bubble = vector
        .selectAll('circle')
        .data(data.features, function(d) { return d.id; });

      bubble
        .exit()
        .transition()
        .attr('r', 0)
        .attr('stroke-width', 0)
        .remove();

      scale = (previousTransform) ? previousTransform.k : scale;
      bubble.enter().append('circle')
        .attr('transform', function(d) { return 'translate(' + projection(d.geometry.coordinates) + ')'; })
        .attr('r', 0)
        .attr('stroke-width', 0)
        .transition()
        .attr('r', function(d) {
          return radius(d.properties.value || 1) / scale;
        })
        .attr('stroke-width', strokeWidth / scale);

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

    map.transitionDuration = function(d) {
      if (arguments.length === 0) return transitionDuration;
      transitionDuration = d;
      return map;
    };

    return map;
  };
};

var index = {
  version: '1.0.0-beta.5',
  map: map
};

return index;

})));
