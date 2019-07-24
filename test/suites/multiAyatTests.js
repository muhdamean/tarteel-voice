import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamMultipleAudioInRealtime, stopAllStreaming } from '../utils';
import { loadAudioFiles } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(50000);
  let ayatData = [null, null, null],
      ayat = [
        {surahNum: 1, ayahNum: 1},
        {surahNum: 1, ayahNum: 2},
        {surahNum: 1, ayahNum: 3},
      ];

  before('Loading wavs...', function(done) {
    let ayatList = ['001001.wav', 'silence.wav', '001002.wav', 'silence.wav', '001003.wav'];
    loadAudioFiles(ayatList, (data) => {
      ayatData = data;
      done();
    });
  })

  afterEach('Stopping all in-progress streams', function() {
    stopAllStreaming();
  });

  it('recognize test with pauses', function (done) {
    let client1 = io.connect(socketUrl, options);
    let currentAyah = 0;

    client1.on('ayahFound', (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Next ayah")
      }

      expect(msg.surahNum).to.equal(ayat[currentAyah].surahNum);
      expect(msg.ayahNum).to.equal(ayat[currentAyah].ayahNum);

      currentAyah += 1;
      if (currentAyah == ayat.length) {
        client1.emit('endStream');
        client1.disconnect();
        done();
      }
    })

    client1.on('connect', function() {
      client1.emit('startStream');

      streamMultipleAudioInRealtime(ayatData, (data) => {
        client1.emit('sendStream', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });

  it('recognize test without pauses', function (done) {
    let client1 = io.connect(socketUrl, options);
    let currentAyah = 0;

    client1.on('ayahFound', (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Next ayah")
      }

      expect(msg.surahNum).to.equal(ayat[currentAyah].surahNum);
      expect(msg.ayahNum).to.equal(ayat[currentAyah].ayahNum);

      currentAyah += 1;
      if (currentAyah == ayat.length) {
        client1.emit('endStream');
        client1.disconnect();
        done();
      }
    })

    client1.on('connect', function(){
      client1.emit('startStream', {type: 'transcribe'});
      let ayatWithoutSilence = [ayatData[0], ayatData[2], ayatData[4]]
      streamMultipleAudioInRealtime(ayatWithoutSilence, (data) => {
        client1.emit('sendStream', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });
}