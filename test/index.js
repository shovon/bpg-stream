var fs = require('fs');
var path = require('path');
var Encoder = require('..');
var assert = require('assert');
var crypto = require('crypto');

describe('Encoder', function () {
  it(
    'should be able to distinguish the difference between JPG, PNG, and ' +
    'total garbage',
    function () {
      var jpg = Buffer
        .concat([new Buffer([0xff, 0xd8]), crypto.randomBytes(6)]);
      var png = Buffer
        .concat([new Buffer([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(4)]);

      assert(Encoder.isJPG(jpg));
      assert(!Encoder.isJPG(png));
      assert(Encoder.isPNG(png));
      assert(!Encoder.isPNG(jpg));
    }
  );
  xit(
    'should accept either a PNG or JPG image stream and convert it to BPG',
    function (done) {
      var writeStream = fs.createWriteStream(path.join(__dirname, 'Lenna.bpg'));
      fs.createReadStream(path.join(__dirname, 'Lenna.png'))
        .pipe(new Encoder())
        .pipe(writeStream);
      writeStream.on('finish', function () {
        done();
      });
    }
  );
});
