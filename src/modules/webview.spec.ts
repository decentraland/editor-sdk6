import { getNonce } from './webview'

describe('webviews', () => {
  describe('When getting a nonce', () => {
    it('should return a 32 chars long string made of letters and numbers', () => {
      expect(getNonce()).toMatch(/[A-z0-9]{32}/)
    })
  })
})
