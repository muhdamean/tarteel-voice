import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamAudioInRealtime, stopAllStreaming } from '../utils';
import { loadAudioFile } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(180000);
  let client1, ayahData;

  before('Loading wavs...', function(done) {
    loadAudioFile('test/audio/002282.wav', (data) => {
      ayahData = data;
      done();
    });
  });

  afterEach('Stopping all in-progress streams', function() {
    stopAllStreaming();
  });

  it('follow along test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);
    let numWords;

    client1.on('ayahFound', (msg) => {
      expect(msg.ayahNum).to.equal(282);
      expect(msg.surahNum).to.equal(2);

      numWords = msg.ayahWords.length;
    });

    client1.on('matchFound', (msg) => {
      if (msg.wordCount == numWords) {
        client1.emit('endStream');
        client1.disconnect();
        done();
      }
    });

    client1.on('connect', function() {
      client1.emit('startStream');
      streamAudioInRealtime(ayahData, (data) => {
        client1.emit('sendStream', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });
}