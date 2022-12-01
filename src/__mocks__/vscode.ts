export const window = {
  createOutputChannel: jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    replace: jest.fn(),
    clear: jest.fn(),
    show: jest.fn(),
  })),
  withProgress: jest
    .fn()
    .mockImplementation(
      async (
        _options,
        onProgress: (progress: {
          report: (value: number) => void
        }) => Promise<any>
      ) => onProgress({ report: jest.fn() })
    ),
}

export const ProgressLocation = {
  Notification: 15,
}
