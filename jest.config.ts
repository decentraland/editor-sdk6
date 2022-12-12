import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/modules/**/*.ts', '!<rootDir>/node_modules/'],
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      statements: 100,
      functions: 100,
    },
  },
}

export default config
