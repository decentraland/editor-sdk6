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
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
}

export const ProgressLocation = {
  Notification: 15,
}

export const workspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: '/path/to/workspace',
      },
    },
  ],
}
