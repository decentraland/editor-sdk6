export const window = {
  createOutputChannel: jest.fn().mockImplementation(() => ({
    append: jest.fn(),
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
