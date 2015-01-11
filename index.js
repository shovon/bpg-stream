var util = require('util');
var stream = require('stream');
var fs = require('fs');
var os = require('os');
var debug = require('debug')('bpgencoder');
var crypto = require('crypto');

var JPG_HEX = 'ffd8';
var PNG_HEX = '89504e47';

module.exports = Encoder;
function Encoder() {
  stream.Duplex.call(this);
  this.copied = false;
  this.filePath = os.tmpdir() + crypto.randomBytes(16);
  this._writeStream = fs
    .createWriteStream(this.filePath);
  this._writeStream.on('finish', function () {
    this.copied = true;
  }.bind(this));
  this._readStream = null;
}
util.inherits(Encoder, stream.Duplex);
Encoder.prototype._write = function (chunk, encoding, callback) {
  this._writeStream.write(chunk, callback);
};
Encoder.prototype._read = function () {
  var beginReadable = function () {
    this._readStream = fs.createReadStream(this.filePath);
    this._readStream.on('data', function (chunk) {
      if (!this.push(chunk)) {
        this._readStream.pause();
      }
    }.bind(this));
    function ended() {
      this.push(null);
    }
    this._readStream.on('close', ended);
    this._readStream.on('end', ended);
  }.bind(this);
  if (!this.copied) {
    this._writeStream.on('finish', function () {
      beginReadable();
    }.bind(this));
    return;
  }
  beginReadable();
};
Encoder.isJPG = function (buffer) {
  var bufferChunk = buffer.slice(0, JPG_HEX.length / 2).toString('hex');
  debug('Buffer\'s first two bytes: %s', bufferChunk);
  return JPG_HEX === bufferChunk;
};
Encoder.isPNG = function (buffer) {
  var bufferChunk = buffer.slice(0, PNG_HEX.length / 2).toString('hex');
  debug('Buffer\'s first four bytes: %s', bufferChunk);
  return PNG_HEX === bufferChunk;
}