# infovyz

## API Reference

### General Usage

To initialize *infovyz*, pass its dependency `d3` to its factory:

```javascript
  var v = infovyz(d3);
```

<a name="map-factory" href="#chart-factory">#</a> <b>`infovyz(d3).<chart>`</b>(<i>selector</i>) 

Once the library itself is initialized, individual visualizations can be created by passing an existing wrapper DOM element to their factory. Here's how you'd typically invoke the different charts:

```js
  var barchart = v.barchart('#barchart');
  var linechart = v.linechart('#linechart');
  var map = v.map('#map');
```

<a name="map" href="#map">#</a> <b>`<chartInstance>`</b>(<i>data</i>)

You update a chart by calling it with new data as its argument. This replaces a possibly existing previous data set. <i>data</i> is expected to be an <i>Array</i> of plain JavaScript <i>Objects</i>. The object's required attributes differ for each component though:

```js

// Bar Chart
{
  id: 'bar-1',
  value: 10
}

// Line Chart
{
  id: 'line-1',
  // values is expected to be an Array of Object in the following format
  values: [
    {
      date: new Date(),
      value: 12
    }
  ]
}

// Geographic Bubble Map
{
  id: 'Vienna, Austria',
  longitude: 16.363449,
  latitude: 48.210033,
  value: 1.741 // optional
}
```

The library [Avocado](https://github.com/walterra/avocado) is used to verify the input, e.g. if longitude and latitude for the map are values in the proper range.

<a name="chart-transitionduration" href="#chart-transitionduration">#</a> <b>`<chart>`</b>.transitionDuration(<i>[duration]</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js "Source")

This method is supported by all of the charts and gets or sets the <i>transitionDuration</i>.

If <i>duration</i> is specified, sets <i>transitionDuration</i> to the specified time in milliseconds. This is the duration used by the <i>autozoom</i> transitions.
If <i>duration</i> is not specified, returns he current <i>transitionDuration</i>.

Defaults to `500`.

### Geographic Bubble Map

The map component exposes some additional methods:

<a name="map-autozoom" href="#map-autozoom">#</a> <b>`<map>`</b>.autozoom(<i>[boolean]</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js "Source")

Gets or sets the <i>autozoom</i> status.

If <i>boolean</i> is specified, enables or disables the <i>autozoom</i> feature. If enabled, follow-up updates of the map update the viewport using a transition to the boundaries of the dataset.

If <i>boolean</i> is not specified, returns he current <i>autzoom</i> status.

Defaults to `true`.

<a name="map-interactive" href="#map-interactive">#</a> <b>`<map>`</b>.interactive(<i>[boolean]</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js "Source")

Gets or sets the <i>interactive</i> status.

If <i>boolean</i> is specified, enables or disables the <i>interactive</i> feature. If enabled, mouse events are enabled to be able to navigate the map with zoom and pan. When disabled, these events will not be considered by settings the SVG elements style `pointer-events` to `none`. The bubbles themselves can still listen to mouse events.

If <i>boolean</i> is not specified, returns he current <i>interactive</i> status.

Defaults to `true`.

<a name="map-panto" href="#map-panto">#</a> <b>`<map>`</b>.panTo(<i>location</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js "Source")

Moves the visible viewport to the bounds of <i>location</i>, expected in this format:

```js
map.panTo({
  longitude: 16.363449,
  latitude: 48.210033,
  zoom: 19
});
```

The above moves the viewport to Vienna, Austria. Zoom level can be a float value. A value of `9-10` covers the whole globe. `12` zooms down to continents like Europe or Australia. `18-20` is suitable for city level. `25` and higher is street level.