import { getTemplates, getTypeOptions } from './project'

describe('project', () => {
  describe('When getting the project type options', () => {
    it('should return the 4 options', () => {
      expect(getTypeOptions()).toHaveLength(4)
    })
  })
  describe('When getting the templates', () => {
    it('should return the list of templates', () => {
      expect(getTemplates()).toEqual(expect.any(Array))
    })
  })
})
