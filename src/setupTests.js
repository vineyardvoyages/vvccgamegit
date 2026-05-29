import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });
const { ReadableStream } = require('node:stream/web');
Object.assign(global, { ReadableStream });
