import eslint from 'rollup-plugin-eslint';

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
    })
  ]
};