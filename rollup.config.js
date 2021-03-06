import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'

import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true
      },

      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      external(),
      postcss({
        modules: true
      }),
      url(),
      babel({
        exclude: 'node_modules/**'
      }),
      resolve(),
      commonjs()
    ]
  },

  {
    input: 'src/simplified.js',
    output: [
      {
        file: 'dist/simplified.js',
        format: 'cjs',
        sourcemap: true
      },

      {
        file: 'dist/simplified.es.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      external(),
      postcss({
        modules: true
      }),
      url(),
      babel({
        exclude: 'node_modules/**'
      }),
      resolve(),
      commonjs()
    ]
  },

  {
    input: 'src/promote-into-responsive.js',
    output: [
      {
        file: 'dist/promote-into-responsive.js',
        format: 'cjs',
        sourcemap: true
      },

      {
        file: 'dist/promote-into-responsive.es.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      external(),
      postcss({
        modules: true
      }),
      url(),
      babel({
        exclude: 'node_modules/**'
      }),
      resolve(),
      commonjs()
    ]
  }
]
