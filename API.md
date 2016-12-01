# infovyz

## API Reference

### Map

Creates a geographic bubble map with a tile base layer.

<a name="infovyz-map" href="#infovyz-map">#</a> infovyz.<b>map</b>(<i>d3</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L3 "Source")

A factory function taking <i>d3</i> as an argument to initialize a bubble map. Returns another factory to create the actual map.

<a name="map-factory" href="#map-factory">#</a> <b>`<map_factory>`</b>(<i>selector</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L4 "Source")

This is the factory returned by `infovyz.map(d3)` and itself returns the actual bubble map. The selector must be an existing DOM selection like `#wrapper`. Here's how you'd typically invoke a new bubble map:

```js
  var map = infovyz.map(d3)('#wrapper');
```

<a name="map" href="#map">#</a> <b>`<map>`</b>(<i>locations</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L142 "Source")

Updates the bubble map with new locations. This replaces a possibly existing previous data set. <i>locations</i> is expected to be an <i>Array</i> of plain <i>Objects</i> in the following format:

```js
{
  id: 'Vienna, Austria',
  longitude: 16.363449,
  latitude: 48.210033,
  value: 1.741 // optional
}
```

The library [Avocado](https://github.com/walterra/avocado) is used to verify the input, e.g. if longitude and latitude are values in the proper range. The value attribute is optional.

<a name="map-autozoom" href="#map-autozoom">#</a> <b>`<map>`</b>.autozoom(<i>[boolean]</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L284 "Source")

Gets or sets the <i>autozoom</i> status.

If <i>boolean</i> is specified, enables or disables the <i>autozoom</i> feature. If enabled, follow-up updates of the map update the viewport using a transition to the boundaries of the dataset.

If <i>boolean</i> is not specified, returns he current <i>autzoom</i> status.

Defaults to `true`.

<a name="map-interactive" href="#map-interactive">#</a> <b>`<map>`</b>.interactive(<i>[boolean]</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L290 "Source")

Gets or sets the <i>interactive</i> status.

If <i>boolean</i> is specified, enables or disables the <i>interactive</i> feature. If enabled, mouse events are enabled to be able to navigate the map with zoom and pan. When disabled, these events will not be considered by settings the SVG elements style `pointer-events` to `none`. The bubbles themselves can still listen to mouse events.

If <i>boolean</i> is not specified, returns he current <i>interactive</i> status.

Defaults to `true`.

<a name="map-transitionduration" href="#map-transitionduration">#</a> <b>`<map>`</b>.transitionDuration(<i>[duration]</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L303 "Source")

Gets or sets the <i>transitionDuration</i>.

If <i>duration</i> is specified, sets <i>transitionDuration</i> to the specified time in milliseconds. This is the duration used by the <i>autozoom</i> transitions.
If <i>duration</i> is not specified, returns he current <i>transitionDuration</i>.

Defaults to `500`.

<a name="map-panto" href="#map-panto">#</a> <b>`<map>`</b>.panTo(<i>location</i>) [<>](https://github.com/weblyzard/infovyz/blob/master/src/map.js#L261 "Source")

Moves the visible viewport to the bounds of <i>location</i>, expected in this format:

```js
map.panTo({
  longitude: 16.363449,
  latitude: 48.210033,
  zoom: 19
});
```

The above moves the viewport to Vienna, Austria. Zoom level can be a float value. A value of `9-10` covers the whole globe. `12` zooms down to continents like Europe or Australia. `18-20` is suitable for city level. `25` and higher is street level.