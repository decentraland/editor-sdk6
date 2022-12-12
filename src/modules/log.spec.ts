import { output, append, appendLine, replace, clear, log, bind } from './log'
import { SpanwedChild } from './spawn'

/********************************************************
                          Mocks
*********************************************************/

const appendSpy = jest.spyOn(output, 'append')
const replaceSpy = jest.spyOn(output, 'replace')
const clearSpy = jest.spyOn(output, 'clear')
const showSpy = jest.spyOn(output, 'show')

function mockChild() {
  let _onData: (data?: string) => void
  function sendData(data?: string) {
    _onData(data)
  }
  return [
    {
      on: jest.fn().mockImplementationOnce(
        (_regExp: RegExp, onData: (data?: string) => void) => (_onData = onData) // Store the _onData handler on a variable so we can sendData data from within tests
      ),
    } as unknown as SpanwedChild,
    sendData, // return a helper to sendData data
  ] as const
}

/********************************************************
                          Tests
*********************************************************/

describe('log', () => {
  afterEach(() => {
    appendSpy.mockReset()
    replaceSpy.mockReset()
    clearSpy.mockReset()
    showSpy.mockReset()
  })
  describe('When appending a message', () => {
    it('should append it to the output channel', () => {
      append('message')
      expect(appendSpy).toHaveBeenCalledWith('message')
    })
  })
  describe('When appending a line', () => {
    it('should append the message with a new line to the output channel', () => {
      appendLine('message')
      expect(appendSpy).toHaveBeenCalledWith('message\n')
    })
  })
  describe('When replacing a message', () => {
    it('should replace the message in the output channel', () => {
      replace('message')
      expect(replaceSpy).toHaveBeenCalledWith('message')
    })
  })
  describe('When clearing', () => {
    it('should clear output channel', () => {
      clear()
      expect(clearSpy).toHaveBeenCalled()
    })
  })
  describe('When logging multiple messages', () => {
    it('should append a single message combining all the messages and a new line', () => {
      log('hello world', 'these are', 'many messages')
      expect(appendSpy).toHaveBeenCalledWith(
        'hello world these are many messages\n'
      )
    })
  })
  describe('When binding a child process', () => {
    it('should register a catch-all regexp with a handler to the child', () => {
      const [child] = mockChild()
      bind(child)
      expect(child.on).toHaveBeenCalledWith(/.*/, expect.any(Function))
    })
    describe('and data is received', () => {
      it('should append incoming data to the output channel', () => {
        const [child, sendData] = mockChild()
        bind(child)
        sendData('Some data')
        expect(appendSpy).toHaveBeenCalledWith('Some data')
      })
      it('should ignore invalid data', () => {
        const [child, sendData] = mockChild()
        bind(child)
        sendData('')
        expect(appendSpy).not.toHaveBeenCalled()
      })
      describe('and is an error', () => {
        it('should focus the output channel', () => {
          const [child, sendData] = mockChild()
          bind(child)
          sendData('error')
          expect(showSpy).toHaveBeenCalled()
        })
        it('ignore if it is an outdated package', () => {
          const [child, sendData] = mockChild()
          bind(child)
          sendData('error outdated package')
          expect(showSpy).not.toHaveBeenCalled()
        })
      })
    })
  })
})
