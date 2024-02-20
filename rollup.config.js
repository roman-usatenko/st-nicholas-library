import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import cssnano from 'cssnano';

export default {
  input: 'src/frontend/frontend.ts',
  output: {
    file: 'public/bundle.js', // Output bundle file
    format: 'iife' // Immediately Invoked Function Expression format suitable for <script> tag
  },
  plugins: [
    postcss({
      extract: 'bundle.css', // Update the path as per your requirement
      plugins: [
        postcssImport(),
        cssnano()
      ]
    }),
    typescript({tsconfigOverride: {"exclude": ["node_modules", "src/backend/**/*"]}}), 
    resolve(), // For resolving node_modules
    commonjs(), // Convert CommonJS modules to ES6
    babel({ // Transpile to ES5
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env']
    })
  ]
};