import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamAudioInRealtime } from '../utils';
import { loadAudioFile } from '../utils';

export default function suite(mochaContext, socketUrl, options) {
  mochaContext.timeout(20000);
  let client1, ayahData;

  before('Loading wavs...', function (done) {
    loadAudioFile('test/audio/001001.wav', (data) => {
      ayahData = data;
      done();
    });
  });

  it('recognize test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);

    client1.on('ayahFound', (msg) => {
      expect(msg.surahNum).to.equal(1);
      expect(msg.ayahNum).to.equal(1);
      client1.emit('endStream');
      client1.disconnect();
      done();
    });

    client1.on('connect', function () {
      client1.emit('startStream');
      streamAudioInRealtime(ayahData, (data) => {
        client1.emit('sendStream', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });

  it('transcribe test', function (done) {
    // Set up client1 connection
    let client1 = io.connect(socketUrl, options);
    let numWords = 0;

    client1.on('ayahFound', (msg) => {
      numWords = msg.ayahWords.length;
    });

    client1.on('matchFound', (msg) => {
      if (msg.wordCount == numWords) {
        client1.emit('endStream');
        client1.disconnect();
        done();
      }
    });

    client1.on('connect', function () {
      client1.emit('startStream');
      streamAudioInRealtime(ayahData, (data) => {
        client1.emit('sendStream', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });
}