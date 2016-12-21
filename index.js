import barchart from './src/barchart';
import map from './src/map';
import linechart from './src/linechart';

var infovyz = function(d3) {
  return {
    version: '1.0.0-beta.7',
    barchart: barchart(d3),
    linechart: linechart(d3),
    map: map(d3)
  };
};

export default infovyz;
