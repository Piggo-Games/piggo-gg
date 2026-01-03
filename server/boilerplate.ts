import { mocks } from 'mock-browser'

// for pixi-filters & discord
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  // @ts-expect-error
  location: {
    origin: 'http://localhost'
  }
}

const mock = new mocks.MockBrowser()
global.document = mock.getDocument()
