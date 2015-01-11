var util = require('util');
var stream = require('stream');
var fs = require('fs');
var os = require('os');
var crypto = require('crypto');
var childProcess = require('child_process');
var async = require('async');

var dbg = require('debug');
var debug = dbg('bpgencoder');
var debugConstructor = dbg('bpgencoder:constructor');
var debugWriter = dbg('bpgencoder:writer');
var debugReader = dbg('bpgencoder:reader');

var JPG_HEX = 'ffd8';
var PNG_HEX = '89504e47';

function randomString(length, chars) {
  if(!chars) {
    throw new Error('Argument \'chars\' is undefined');
  }

  var charsLength = chars.length;
  if(charsLength > 256) {
    throw new Error('Argument \'chars\' should not have more than 256 characters'
        + ', otherwise unpredictability will be broken');
  }

  var randomBytes = crypto.randomBytes(length)
  var result = new Array(length);

  var cursor = 0;
  for (var i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % charsLength]
  };

  return result.join('');
}

function randomAsciiString(length) {
  return randomString(length,
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
}


/*
 * A duplex stream that takes in either a PNG or JPG stream, and outputs a BPG
 * stream.
 */
module.exports = Encoder;
function Encoder() {
  stream.Duplex.call(this);

  /*
   * Determines whether or not the original image file has been copied.
   */
  this.copied = false;

  /*
   * Determines whether or not we are in the process of reading.
   */
  this.reading = false;

  /*
   * The path where we will be temporarily storing our buffer.
   */
  this.filepath = os.tmpdir() + randomAsciiString(16);

  debugConstructor('Path to store file: %s', this.filepath);

  /*
   * This is what will be writing the original file to the temporary
   * destination.
   */
  this._writeStream = fs
    .createWriteStream(this.filepath);
  this._writeStream.on('finish', function () {
    debugConstructor('Done writing input stream to %s', this.filepath);
    this.copied = true;
  }.bind(this));
  this.on('pipe', function (src) {
    debugConstructor('A stream has been piped');
    var ended = false;
    var onEnd = function () {
      if (!ended) {
        debugConstructor('The piped stream has ended');
        ended = true;
        this._writeStream.end();
      }
    }.bind(this);
    src.on('end', onEnd);
    src.on('close', onEnd);
  }.bind(this));
}
util.inherits(Encoder, stream.Duplex);

/*
 * Override of the Duplex#_write method. This will simply be writing out the
 * inputted chunks to the temporary file.
 */
Encoder.prototype._write = function (chunk, encoding, callback) {
  debugWriter('Writing chunk of size %d to disk', chunk.length);
  this._writeStream.write(chunk, callback);
};

/*
 * Override of the Duplex#_read method. This will simply be reading in the
 * outputted BPG image.
 */
Encoder.prototype._read = function () {
  // Used to keep the code DRY.
  var beginReadable = function () {
    if (this.reading) {
      debugReader('Attempted to start reading.');
      return;
    }
    this.reading = true;

    debugReader('Starting to read the original image from disk');

    async.waterfall([
      // Get the format of the given file.
      function (callback) {
        debugReader('Reading from %s', this.filepath);
        var tempReadStream = fs.createReadStream(this.filepath);

        var stoppedReading = false;

        tempReadStream.on('readable', function () {
          debugReader('Did we stop reading? %s', stoppedReading ? 'Yes' : 'No');
          if (stoppedReading) { return; }
          stoppedReading = true;
          debugReader('Stopped the read');
          tempReadStream.pause();

          var chunk = tempReadStream.read(4);
          var format;
          try {
            format = Encoder.getImageFormatCode(chunk);
          } catch (e) {
            return callback(e);
          }

          debugReader('Image is of format %s', format);
          callback(null, format);
        });

        tempReadStream.on('error', function (e) {
          if (stoppedReading) { return; }
          debugReader('An error occurred while reading from disk');
          this.emit('error', e);
        }.bind(this));

      }.bind(this),

      // Rename the file into the appropriate format.
      function (format, callback) {
        var destFilepath = this.filepath + '.' + format;
        debugReader('Will rename to to %s', destFilepath);
        fs.rename(this.filepath, destFilepath, function (err) {
          debugReader('Done renaming to %s', destFilepath);
          if (err) { return callback(err); }
          callback(null, destFilepath);
        });
      }.bind(this),

      // Encode the image into BPG format.
      function (filepath, callback) {
        var bpgpath = this.filepath + '.' + 'bpg';
        debugReader('Will temporarily write the BPG file to %s', bpgpath);
        var bpgenc = childProcess.spawn(
          'bpgenc', [ filepath, '-o', bpgpath ]
        );
        bpgenc.on('close', function (code) {
          debugReader('The encoder has exitted with code %d', code);
          fs.unlink(filepath);
          if (code) {
            return callback(
              new Error(
                'The BPG encoder exitted with a non-zero error code ' + code
                  + '.'
              )
            );
          }
          callback(null, bpgpath);
        });
      }.bind(this),
    ], function (err, bpgpath) {
      if (err) { this.emit('error', err); }

      var ended = false;

      // Called when the stream has ended.
      var onEnd = function () {
        if (!ended) {
          debugReader('The reader has ended');
          fs.unlink(bpgpath);
          ended = true;
          this.push(null);
        }
      }.bind(this);

      // This will be reading the generated BPG image, and pushing it out onto
      // the listener.
      debugReader('The BPG image file should be at %s', bpgpath);
      var readStream = fs.createReadStream(bpgpath);
      readStream.on('data', function (data) {
        this.push(data);
      }.bind(this));

      readStream.on('close', onEnd);
      readStream.on('end', onEnd);
      readStream.on('error', function (e) { this.emit(e); }.bind(this))
    }.bind(this));
  }.bind(this);

  if (!this.copied) {
    this._writeStream.on('finish', function () {
      beginReadable();
    }.bind(this));
    return;
  }
  beginReadable();
};

/*
 * Determines whether or not the buffer represents JPG.
 */
Encoder.isJPG = function (buffer) {
  var bufferChunk = buffer.slice(0, JPG_HEX.length / 2).toString('hex');
  debug('Buffer\'s first two bytes: %s', bufferChunk);
  return JPG_HEX === bufferChunk;
};

/*
 * Determines whther or not the buffer represents PNG.
 */
Encoder.isPNG = function (buffer) {
  var bufferChunk = buffer.slice(0, PNG_HEX.length / 2).toString('hex');
  debug('Buffer\'s first four bytes: %s', bufferChunk);
  return PNG_HEX === bufferChunk;
};

/*
 * Gets the image format code of the supplied buffer.
 */
Encoder.getImageFormatCode = function (buffer) {
  if      (Encoder.isJPG(buffer)) { return 'jpg'; }
  else if (Encoder.isPNG(buffer)) { return 'png'; }
  throw new Error('Unknown format');
};
