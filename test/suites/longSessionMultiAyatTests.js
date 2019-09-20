import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamMultipleAudioInRealtime, stopAllStreaming } from '../utils';
import { loadAudioFiles } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(180000);
  let client1,
      ayatData = [null, null];

  before('Loading wavs...', function(done) {
    let ayatList = ['002285.wav', 'silence.wav', '002286.wav'];
    loadAudioFiles(ayatList, (data) => {
      ayatData = data;
      done();
    });
  });

  afterEach('Stopping all in-progress streams', function() {
    stopAllStreaming();
  });

  it('follow along test', function (done) {
    client1 = io.connect(socketUrl, options);
    let numWords, currentAyah = 0;
    let ayat = [
      {surahNum: 2, ayahNum: 285},
      {surahNum: 2, ayahNum: 286},
    ];

    client1.on('ayahFound', (msg) => {
      expect(msg.ayahShape.chapter_id).to.equal(ayat[currentAyah].surahNum);
      expect(msg.ayahShape.verse_number).to.equal(ayat[currentAyah].ayahNum);

      numWords = msg.ayahShape.text_simple.split(' ').length;
      currentAyah += 1;
    });

    client1.on('matchFound', (msg) => {
      if (currentAyah == 2 && msg.wordCount == numWords) {
        client1.emit('endStream');
        client1.disconnect();
        done();
      }
    });

    client1.on('connect', function(){
      client1.emit('startStream', {type: 'transcribe'});
      streamMultipleAudioInRealtime(ayatData, (data) => {
        client1.emit('sendStream', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });
}