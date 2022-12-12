import { disposeAll, Disposable } from './dispose'

/********************************************************
                          Mocks
*********************************************************/

let disposable: DummyDisposable
let otherDisposable: DummyDisposable
let disposables: DummyDisposable[]

class DummyDisposable extends Disposable {
  public register(value: Disposable) {
    this._register(value)
  }
  public getDisposables() {
    return this._disposables
  }
}

/********************************************************
                          Tests
*********************************************************/

describe('dispose', () => {
  describe('When disposing all disposabled', () => {
    beforeEach(() => {
      disposables = [
        new DummyDisposable(),
        new DummyDisposable(),
        new DummyDisposable(),
      ]
    })
    it('should dispose each disposable', () => {
      const first = disposables[0]
      const second = disposables[1]
      const third = disposables[2]
      disposeAll(disposables)
      expect(first.isDisposed).toBe(true)
      expect(second.isDisposed).toBe(true)
      expect(third.isDisposed).toBe(true)
    })
    it('should remove each disposable from the list', () => {
      disposeAll(disposables)
      expect(disposables).toHaveLength(0)
    })
  })
  describe('When creating a disposable', () => {
    beforeEach(() => {
      disposable = new DummyDisposable()
      otherDisposable = new DummyDisposable()
    })
    it('should start as not disposed', () => {
      expect(disposable.isDisposed).toBe(false)
    })
    describe('and disposing it', () => {
      beforeEach(() => {
        disposable.dispose()
      })
      it('should be disposed', () => {
        expect(disposable.isDisposed).toBe(true)
        expect(disposable.getDisposables).toHaveLength(0)
      })
      it('should dispose other disposables when they are registered', () => {
        expect(otherDisposable.isDisposed).toBe(false)
        disposable.register(otherDisposable)
        expect(otherDisposable.isDisposed).toBe(true)
      })
      it('should not add other disposables to the list when they are registered', () => {
        expect(disposable.getDisposables()).toHaveLength(0)
        disposable.register(otherDisposable)
        expect(disposable.getDisposables()).toHaveLength(0)
      })
      it('should work if disposed again', () => {
        expect(disposable.isDisposed).toBe(true)
        disposable.dispose()
        expect(disposable.isDisposed).toBe(true)
      })
    })
    describe('and registering another disposable to it', () => {
      beforeEach(() => {
        disposable.register(otherDisposable)
      })
      it('should be added to the disposables list', () => {
        const registeredDisposabled = disposable.getDisposables()
        expect(registeredDisposabled).toHaveLength(1)
        expect(registeredDisposabled[0]).toBe(otherDisposable)
      })
      it('should be disposed when the parent is dispose', () => {
        expect(otherDisposable.isDisposed).toBe(false)
        disposable.dispose()
        expect(otherDisposable.isDisposed).toBe(true)
      })
    })
  })
})
