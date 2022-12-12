import { getMessage, isError } from './error'

/********************************************************
                          Tests
*********************************************************/

describe('error', () => {
  describe('When checking if an unknown is an Error', () => {
    it('should return false if the value is undefined', () => {
      expect(isError(undefined)).toBe(false)
    })
    it('should return false if the value is null', () => {
      expect(isError(null)).toBe(false)
    })
    it('should return false if the value is a string', () => {
      expect(isError('error')).toBe(false)
    })
    it('should return false if the value is a boolean', () => {
      expect(isError(true)).toBe(false)
    })
    it('should return false if the value is an object that is not instance of Error', () => {
      expect(isError({})).toBe(false)
    })
    it('should return true if the is an instance of Error', () => {
      expect(isError(new Error('error'))).toBe(true)
    })
  })
  describe('When getting a message from an unknown error value', () => {
    it('return the error message if it is an instance of Error', () => {
      expect(getMessage(new Error('Some error'))).toBe('Some error')
    })
    it('return the error itself if it is of type string', () => {
      expect(getMessage('Some error')).toBe('Some error')
    })
    it('should return "Unknown Error" if the value is neither an instance of Error nor a string', () => {
      expect(getMessage({})).toBe('Unknown Error')
    })
  })
})
