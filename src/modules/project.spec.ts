import { getTemplates, getProjectTypeOptions, getSdkOptions } from './project'

/********************************************************
                          Tests
*********************************************************/

describe('project', () => {
  describe('When getting the project type options', () => {
    it('should return the 4 options', () => {
      expect(getProjectTypeOptions()).toHaveLength(4)
    })
  })
  describe('When getting the templates', () => {
    it('should return the list of templates', () => {
      expect(getTemplates()).toEqual(expect.any(Array))
    })
  })
  describe('When getting the SDK options', () => {
    it('should return the 2 options', () => {
      expect(getSdkOptions()).toHaveLength(2)
    })
  })
})
