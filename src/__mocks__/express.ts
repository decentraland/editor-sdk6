const appMock = {
  use: jest.fn(),
  listen: jest.fn().mockImplementation((_port: number, cb: () => void) => {
    cb()
    return {
      close: jest.fn(),
    }
  }),
}

const expressMock = jest.fn().mockImplementation(() => {
  return appMock
})
;(expressMock as any).static = jest.fn()

export default expressMock
