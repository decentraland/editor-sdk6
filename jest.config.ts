import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  // collectCoverageFrom: [
  //   'src/**/*.ts',
  //   '!<rootDir>/node_modules/',
  //   'src/untyped-modules.d.ts',
  // ],
  // coverageThreshold: {
  //   global: {
  //     lines: 90,
  //     branches: 90,
  //     statements: 90,
  //     functions: 90,
  //   },
  // },
}

export default config
