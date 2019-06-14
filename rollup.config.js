import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import { uglify } from 'rollup-plugin-uglify'
import replace from 'rollup-plugin-replace'

const minify = process.env.MINIFY
const format = process.env.FORMAT
const es = format === 'es'
const umd = format === 'umd'
const cjs = format === 'cjs'

let output

if (es) {
  output = { file: `dist/react-final-form-arrays.es.js`, format: 'es' }
} else if (umd) {
  if (minify) {
    output = {
      file: `dist/react-final-form-arrays.umd.min.js`,
      format: 'umd'
    }
  } else {
    output = { file: `dist/react-final-form-arrays.umd.js`, format: 'umd' }
  }
} else if (cjs) {
  output = { file: `dist/react-final-form-arrays.cjs.js`, format: 'cjs' }
} else if (format) {
  throw new Error(`invalid format specified: "${format}".`)
} else {
  throw new Error('no format specified. --environment FORMAT:xxx')
}

const globals = {
  react: 'React',
  'final-form': 'FinalForm',
  'react-final-form': 'ReactFinalForm',
  'react-lifecycles-compat': 'ReactLifecyclesCompat'
}

// eslint-disable-next-line no-nested-ternary
export default {
  input: 'src/index.js',
  output: Object.assign(
    {
      name: 'react-final-form-arrays',
      exports: 'named',
      globals
    },
    output
  ),
  external: id => {
    const isBabelRuntime = id.startsWith('@babel/runtime')
    const isStaticExternal = globals[id]
    return isBabelRuntime || isStaticExternal
  },
  plugins: [
    resolve({ jsnext: true, main: true }),
    json(),
    commonjs({ include: 'node_modules/**' }),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [
        [
          '@babel/preset-env',
          {
            loose: true,
            modules: false
          }
        ],
        '@babel/preset-react',
        '@babel/preset-flow'
      ],
      plugins: [
        '@babel/plugin-transform-flow-strip-types',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-syntax-import-meta',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-json-strings',
        [
          '@babel/plugin-proposal-decorators',
          {
            legacy: true
          }
        ],
        '@babel/plugin-proposal-function-sent',
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-proposal-numeric-separator',
        '@babel/plugin-proposal-throw-expressions'
      ],
      runtimeHelpers: true
    }),
    umd
      ? replace({
          'process.env.NODE_ENV': JSON.stringify(
            minify ? 'production' : 'development'
          )
        })
      : null,
    minify ? uglify() : null
  ].filter(Boolean)
}
