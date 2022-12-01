import { isError } from './error'

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
})
