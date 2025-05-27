import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import { uglify } from 'rollup-plugin-uglify'
import replace from 'rollup-plugin-replace'
import typescript from '@rollup/plugin-typescript'

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
  'react-lifecycles-compat': 'ReactLifecyclesCompat',
  '@babel/runtime/helpers/extends': '_extends',
  '@babel/runtime/helpers/objectWithoutPropertiesLoose':
    '_objectWithoutPropertiesLoose'
}

const loose = true

export default {
  input: 'src/index.ts',
  output: Object.assign(
    {
      name: 'react-final-form-arrays',
      exports: 'named',
      globals
    },
    output
  ),
  external: (id) => {
    const isBabelRuntime = id.startsWith('@babel/runtime')
    const isStaticExternal = globals[id]
    return isBabelRuntime || isStaticExternal
  },
  plugins: [
    resolve({
      mainFields: ['module', 'jsnext:main', 'main'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    json(),
    typescript({
      tsconfig: './tsconfig.build.json',
      declaration: true,
      declarationMap: true
    }),
    commonjs({ include: 'node_modules/**' }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      babelrc: false,
      presets: [
        [
          '@babel/preset-env',
          {
            loose,
            modules: false
          }
        ],
        '@babel/preset-react',
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-syntax-import-meta',
        ['@babel/plugin-proposal-class-properties', { loose }],
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
        '@babel/plugin-proposal-throw-expressions',
        ['@babel/plugin-transform-private-methods', { loose }],
        ['@babel/plugin-transform-private-property-in-object', { loose }]
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
