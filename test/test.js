// Import test suites
import transcriberTests from './suites/transcriberTests';

import basicTests from './suites/basicTests';
import multiAyatTests from './suites/multiAyatTests';
import multiClientTests from './suites/multiClientTests';
import longSessionTests from './suites/longSessionTests';
import longSessionMultiAyatTests from './suites/longSessionMultiAyatTests';
import snapshotTests from './suites/snapshotTests';
import uploadFileTests from "./suites/uploadFileTests";

// Start test server
let app = require('../src/index');
let socketUrl = 'http://localhost:5000';

// Global options for test client sockets
let options = {  
  transports: ['websocket'],
  'force new connection': true
};

// Run unit tests
describe('Unit tests', function() {
  describe('Transcriber tests', function() {transcriberTests(this);});
});

// Run integration test suite
describe('Basic tests', function() { basicTests(this, socketUrl, options);});
describe('Multi Ayat tests', function() { multiAyatTests(this, socketUrl, options);});
describe('Multi client test', function() { multiClientTests(this, socketUrl, options);});
describe('Long Session tests', function() { longSessionTests(this, socketUrl, options);});
describe('Long Session Multi Ayat tests', function() { longSessionMultiAyatTests(this, socketUrl, options);});
describe('Upload file tests', function () { uploadFileTests(this, socketUrl, options) });
describe('Snapshot tests', function() { snapshotTests(this); });
