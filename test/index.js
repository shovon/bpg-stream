var fs = require('fs');
var path = require('path');
var Encoder = require('..');
var assert = require('assert');
var crypto = require('crypto');
var expect = require('expect.js');

describe('Encoder', function () {
  var jpg = Buffer
    .concat([new Buffer([0xff, 0xd8]), crypto.randomBytes(6)]);
  var png = Buffer
    .concat([new Buffer([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(4)]);

  it(
    'should be able to distinguish the difference between JPG, PNG, and ' +
    'total garbage',
    function () {
      assert(Encoder.isJPG(jpg));
      assert(!Encoder.isJPG(png));
      assert(Encoder.isPNG(png));
      assert(!Encoder.isPNG(jpg));
    }
  );

  it(
    'should be able to get back the correct short code that represents ' +
    'either JPG, or PNG',
    function () {
      expect(Encoder.getImageFormatCode(jpg)).to.be('jpg');
      expect(Encoder.getImageFormatCode(png)).to.be('png');
      try {
        Encoder.getImageFormatCode(new Buffer([0, 0, 0, 0, 0, 0]));
        throw new Error('Should have thrown an error');
      } catch (e) {}
    }
  );
  it(
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
