import { debounce } from './debounce'

/********************************************************
                          Mocks
*********************************************************/

let setTimeoutMock: jest.MockedFunction<typeof setTimeout>
let clearTimeoutMock: jest.MockedFunction<typeof clearTimeout>

/********************************************************
                          Tests
*********************************************************/

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')
    setTimeoutMock = setTimeout as jest.MockedFunction<typeof setTimeout>
    jest.spyOn(global, 'clearTimeout')
    clearTimeoutMock = clearTimeout as jest.MockedFunction<typeof clearTimeout>
  })
  afterEach(() => {
    jest.useRealTimers()
    setTimeoutMock.mockReset()
    clearTimeoutMock.mockReset()
  })
  describe('When creating a debounced function', () => {
    it('should return a new function', () => {
      expect(debounce(() => {}, 100)).toEqual(expect.any(Function))
    })
    describe('and calling the debounced function', () => {
      it('should call setTimeout', () => {
        const fn = () => {}
        const debounced = debounce(fn, 100)
        debounced()
        expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 100)
      })
      it('should call clearTimeout if there was already one pending debounced function call', () => {
        const debounced = debounce(() => {}, 100)
        debounced()
        jest.advanceTimersByTime(50)
        debounced()
        expect(clearTimeoutMock).toHaveBeenCalled()
      })
      it('should call the debounced function with the same parameters as the debounced function if enough times has passed', () => {
        const fn = jest.fn()
        const debounced = debounce(fn, 100)
        debounced('abc', 123)
        jest.advanceTimersByTime(200)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('abc', 123)
      })
      it('should not clearTimeout if enough time passes between calls', () => {
        const fn = jest.fn()
        const debounced = debounce(fn, 100)
        debounced()
        jest.advanceTimersByTime(200)
        debounced()
        expect(clearTimeoutMock).not.toHaveBeenCalled()
      })
      it('should throw if the base function throws when called', () => {
        const fn = jest.fn().mockImplementationOnce(() => {
          throw new Error('Some error')
        })
        const debounced = debounce(fn, 100)
        debounced()
        expect(() => jest.advanceTimersByTime(200)).toThrow('Some error')
      })
    })
  })
})
