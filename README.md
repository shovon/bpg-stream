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