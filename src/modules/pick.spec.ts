import { QuickPickItem, window } from 'vscode'
import { pick } from './pick'

const showQuickPickMock = window.showQuickPick as jest.MockedFunction<
  typeof window.showQuickPick
>

const items = [
  {
    label: 'First Item',
    value: 'first',
  },
  {
    label: 'Second Item',
    value: 'second',
  },
  {
    label: 'Third Item',
    value: 'third',
  },
]

describe('picker', () => {
  describe('When picking an item', () => {
    afterEach(() => {
      showQuickPickMock.mockRestore()
    })
    it('should show a list of using the values from the labels of the items', async () => {
      await pick(items, 'label', {})
      expect(showQuickPickMock).toHaveBeenCalledWith(
        ['First Item', 'Second Item', 'Third Item'],
        {}
      )
    })
    describe('and the user selects an option', () => {
      beforeEach(() => {
        showQuickPickMock.mockImplementation((items) => (items as any)[0])
      })
      afterEach(() => {
        showQuickPickMock.mockRestore()
      })
      it('should return the selected item', async () => {
        await expect(pick(items, 'label')).resolves.toEqual({
          label: 'First Item',
          value: 'first',
        })
      })
    })
    describe('and the user does not select an option', () => {
      beforeEach(() => {
        showQuickPickMock.mockResolvedValueOnce(undefined)
      })
      afterEach(() => {
        showQuickPickMock.mockRestore()
      })
      it('should return null', async () => {
        await expect(pick(items, 'label')).resolves.toBe(null)
      })
    })
  })
})
