# bpg-stream

Encodes JPG or PNG image stream to BPG image format.

## Usage

```javascript
var Encoder = require('bpgencoder');

// Create a read stream from a PNG file.
fs.createReadStream(path.join(__dirname, 'Lenna.png'))

  // Pipe to a new instance of BPG encoder.
  .pipe(new Encoder())

  // Pipe the image out to a file.
  .pipe(fs.createWriteStream(path.join(__dirname, 'Lenna.bpg')));
```

## Installation

Be sure that you have libbpg installed, and is on your PATH

Afterwards, you can simply install using npm.

```
npm install bpg-stream
```

## Developing

To run tests, simply run `npm test`.

## License

The MIT License (MIT)

Copyright (c) 2015 Salehen Shovon Rahman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.