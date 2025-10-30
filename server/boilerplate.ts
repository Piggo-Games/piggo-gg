import { mocks } from 'mock-browser'

// for pixi-filters & discord
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  location: {
    origin: 'http://localhost'
  }
}

// for react-hot-toast
const mock = new mocks.MockBrowser()
global.document = mock.getDocument()
