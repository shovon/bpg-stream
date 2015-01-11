var util = require('util');
var stream = require('stream');
var fs = require('fs');
var os = require('os');
var debug = require('debug')('bpgencoder');

var JPG_HEX = 'ffd8';
var PNG_HEX = '89504e47';

module.exports = Encoder;
function Encoder() {
  stream.Duplex.call(this);
  this._writeStream = fs.createWriteStream(os.tmpdir() + '');
}
util.inherits(Encoder, stream.Duplex);
// Encoder.prototype._write = function (chunk, encoding, callback) {
//   this._writeStream.write(chunk, callback);
// };
// Encoder.prototype._read = function (size) {
//   this
// };
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