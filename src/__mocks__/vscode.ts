export const window = {
  createOutputChannel: jest.fn().mockImplementation(() => ({
    append: jest.fn(),
  })),
}
