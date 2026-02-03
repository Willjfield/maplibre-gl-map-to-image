import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'index.js',
  output: [
    // ESM build for bundlers / modern toolchains (real exports)
    {
      file: 'dist/maplibre-gl-map-to-image.esm.js',
      format: 'es'
    },
    // UMD build for direct <script> usage (global MapLibreGLMapToImage)
    {
      file: 'dist/maplibre-gl-map-to-image.min.js',
      format: 'umd',
      name: 'MapLibreGLMapToImage',
      exports: 'named',
      globals: {},
      plugins: [
        terser({
          compress: {
            drop_console: false
          }
        })
      ]
    }
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: false
    }),
    commonjs(),
    // terser applied only to the UMD output (see output.plugins)
  ]
};

