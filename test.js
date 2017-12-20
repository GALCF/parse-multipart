/* jshint node: true */
'use strict';
/**
    Unit testing, run with `node test`
*/
const assert = require('assert');
const multipart = require('./multipart.js');

const demoData = () => {
    const body = [
        `trash1`,
        `------WebKitFormBoundaryvef1fLxmoUdYZWXp`,
        `Content-Disposition: form-data; name="uploads[]"; filename="A.txt"`,
        `Content-Type: text/plain`,
        ``,
        `@11X111Y`,
        `111Z\rCCCC\nCCCC`,
        `CCCCC@`,
        ``,
        `------WebKitFormBoundaryvef1fLxmoUdYZWXp`,
        `Content-Disposition: form-data; name="testMessage";`,
        ``,
        `test message 123456 ÄÖÜäöüß`,
        `------WebKitFormBoundaryvef1fLxmoUdYZWXp`,
        `Content-Disposition: form-data; name="uploads[]"; filename="C.txt"`,
        `Content-Type: text/plain`,
        ``,
        `@CCCCCCY`,
        `CCCZ\rCCCW\nCCC0`,
        `666@`,
        `------WebKitFormBoundaryvef1fLxmoUdYZWXp--`
    ].join('\r\n') + '\r\n';

    return (new Buffer(body, 'utf-8'));
};

const testParts = (parts) => {
    assert.strictEqual(parts.length, 3);

    assert.strictEqual(parts[0].filename, 'A.txt');
    assert.strictEqual(parts[1].filename, undefined);
    assert.strictEqual(parts[2].filename, 'C.txt');

    assert.strictEqual(parts[0].data.toString(), '@11X111Y\r\n111Z\rCCCC\nCCCC\r\nCCCCC@\r\n');
    assert.strictEqual(parts[1].data, 'test message 123456 ÄÖÜäöüß');
    assert.strictEqual(parts[2].data.toString(), '@CCCCCCY\r\nCCCZ\rCCCW\nCCC0\r\n666@');

    assert.strictEqual(parts[0].name, 'uploads[]');
    assert.strictEqual(parts[1].name, 'testMessage');
    assert.strictEqual(parts[2].name, 'uploads[]');
};

// Test getBoundary
const boundaryTest = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const contentType = 'Content-Type: multipart/form-data; boundary=' + boundaryTest;

const boundaryResult = multipart.getBoundary(contentType);

assert.strictEqual(boundaryResult, boundaryTest);

// Test parse
const body = demoData();
const demoBoundary = '----WebKitFormBoundaryvef1fLxmoUdYZWXp';
const parts = multipart.parse(body, demoBoundary, 'latin1');

testParts(parts);

// Test middleware
const req = {
    headers: {
        'content-type': 'Content-Type: multipart/form-data; boundary=' + demoBoundary,
        'content-transfer-encoding': 'latin1'
    },
    body: demoData()
};

const res = {};

multipart.middleware({
    dest: false
})(req, res, () => {
    assert.strictEqual(req.fields['uploads[]'], undefined);
    assert.strictEqual(req.fields.testMessage, 'test message 123456 ÄÖÜäöüß');

    assert.strictEqual(req.files.testMessage, undefined);
    assert.strictEqual(req.files['uploads[]'].length, 2);

    assert.strictEqual(req.files['uploads[]'][0].data.toString(), '@11X111Y\r\n111Z\rCCCC\nCCCC\r\nCCCCC@\r\n');
    assert.strictEqual(req.files['uploads[]'][1].data.toString(), '@CCCCCCY\r\nCCCZ\rCCCW\nCCC0\r\n666@');
});
