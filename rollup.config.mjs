
// rollup.config.js
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import license from 'rollup-plugin-license'
import packageJson from './package.json' assert { type: 'json' };
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { name, version, author } = packageJson
const { main, module, browser } = packageJson["clean-package"].replace
const isProduction = process.env.NODE_ENV === 'production'
const nameClean = name.replace(/\.js$/, '')

const settings = {
  globals: {
  },
  sourcemap: true
}

export default {
  input: './src/index.ts',
  output: [
    {
    file: main,
    name: nameClean,
    ...settings,
    format: 'cjs',
    plugins: [
      isProduction && terser()
    ]
  },
    {
    file: module,
    ...settings,
    name: nameClean,
    format: 'esm'
  },
  {
    file: browser,
    ...settings,
    name: nameClean,
    format: 'umd',
    plugins: [
      isProduction && terser()
    ]
  }
  ],
  external: [ ],
  // treeshake: {
  //   preset: "smallest",
  //   moduleSideEffects: false,
  //   unknownGlobalSideEffects: false,
  //   propertyReadSideEffects: false,
  //   tryCatchDeoptimization: false,
  // },
  plugins: [
    json(),
    typescript({
    }),
    resolve({
    }),
    // commonjs({
    //   include: 'node_modules/**',
    //   extensions: [ '.js' ],
    //   ignoreGlobal: false,
    //   sourceMap: false
    // }),
    license({
      banner: `
        @license
        ${name} v${version}
        Copyright 2022<%= moment().format('YYYY') > 2022 ? '-' + moment().format('YYYY') : null %> ${author}
        ${packageJson.license} License
      `,
      // thirdParty: {
      //   output: path.join(__dirname, 'dist', 'dependencies.txt'),
      //   includePrivate: true, // Default is false.
      // },

    })
  ]
}
