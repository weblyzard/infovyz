import eslint from 'rollup-plugin-eslint';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'index.js',
  dest: 'build/infovyz.js',
  format: 'umd',
  moduleName: 'infovyz',
  sourceMap: 'inline',
  plugins: [
    eslint({
      exclude: [
        'src/styles/**',
      ]
    }),
    nodeResolve({
      jsnext: true,
      browser: true
    })
  ]
};