# Infovyz

_Infovyz_ is a JavaScript/d3 based visualization library.

[![npm](https://img.shields.io/npm/v/infovyz.svg?maxAge=2592000)](https://www.npmjs.com/package/infovyz)
[![npm](https://img.shields.io/npm/l/infovyz.svg?maxAge=2592000)](https://www.npmjs.com/package/infovyz)
[![npm](https://img.shields.io/npm/dt/infovyz.svg?maxAge=2592000)](https://www.npmjs.com/package/infovyz)

## Installation

```bash
npm install infovyz
```

## Examples

To run the examples in your browser:

```bash
npm install
npm start
```

The console output should tell you at which address you can reach the static webserver, for example:

- http://localhost:8080/examples/earthquakes/
- http://localhost:8080/examples/state-capitals/

## Testing

_Infovyz_ is using tape for testing its functionality:

```bash
npm install
npm test
```

## Development

The build process uses rollup (https://github.com/rollup/rollup), so you can use ES6 modules, however the rest of the code is still ES5.

During development, using the following command allows you to watch the source files and do an automatic rebuild. Please note that minifying is not done at this stage.

```bash
npm run-script watch
```

## Documentation

See Wiki: <https://github.com/weblyzard/infovyz/wiki>