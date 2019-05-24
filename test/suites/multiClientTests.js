import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamAudioInRealtime, streamMultipleAudioInRealtime } from '../utils';
import { loadAudioFiles } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(120000);
  let client1, client2,
      ayatData = [null, null, null, null, null],
      ayatText = ['بسم الله الرحمن الرحيم','الحمد لله رب العالمين','الرحمن الرحيم'];

  before('Loading wavs...', function(done) {
    let ayatList = ['001001.wav', 'silence.wav', '001002.wav', 'silence.wav', '001003.wav'];
    loadAudioFiles(ayatList, (data) => {
      ayatData = data;
      done();
    });
  })

  it('recognize test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);
    client2 = io.connect(socketUrl, options);
    let numReplies = 0;

    // Start both clients at slightly different time intervals
    client1.on('connect', function() {
      setTimeout(() => {
        client1.emit('startStream', {type: 'recognition'});
          streamAudioInRealtime(ayatData[0], (data) => {
            client1.emit('binaryAudioData', data);
          }, () => {
            client1.emit('endStream');
          })
      }, 100)
    });

    client2.on('connect', function() {
      setTimeout(() => {
        client2.emit('startStream', {type: 'recognition'});
          streamAudioInRealtime(ayatData[2], (data) => {
            client2.emit('binaryAudioData', data);
          }, () => {
            client2.emit('endStream');
          })
      }, 3000)
    });

    // Check for correct ayah recognition from both clients
    client1.on('foundResults', (msg) => {
      expect(msg['matches'][0]['ayahNum']).to.equal(1);
      expect(msg['matches'][0]['surahNum']).to.equal(1);
      client1.disconnect();
      numReplies++;
      if (numReplies == 2) {
        done();
      }
    })

    client2.on('foundResults', (msg) => {
      expect(msg['matches'][0]['surahNum']).to.equal(1);
      expect(msg['matches'][0]['ayahNum']).to.equal(2);
      client2.disconnect();
      numReplies++;
      if (numReplies == 2) {
        done();
      }
    })
  });

  it('transcribe test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);
    client2 = io.connect(socketUrl, options);
    let numReplies = 0, numRepliesClient1 = 0, numRepliesClient2 = 0;

    // Start both clients at slightly different time intervals
    client1.on('connect', function() {
      setTimeout(() => {
        client1.emit('startStream', {type: 'transcribe'});
        client1.emit('setCurrentAyah', ayatText[0]);
        streamMultipleAudioInRealtime(ayatData.slice(0,3), (data) => {
          client1.emit('binaryAudioData', data);
        }, () => {
          client1.emit('endStream');
        })
      }, 100)
    });

    client2.on('connect', function() {
      setTimeout(() => {
        client2.emit('startStream', {type: 'transcribe'});
        client2.emit('setCurrentAyah', ayatText[1]);
        streamMultipleAudioInRealtime(ayatData.slice(2,5), (data) => {
          client2.emit('binaryAudioData', data);
        }, () => {
          client2.emit('endStream');
        })
      }, 3000)
    });

    // Check for next ayah
    client1.on('nextAyah', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Client 1 Next ayah")
      }
      numReplies++;
      numRepliesClient1++;
      if (numRepliesClient1 < 2) {
        client1.emit('setCurrentAyah', ayatText[numRepliesClient1]);
      } else {
        client1.disconnect();
      }

      if (numReplies == 4) {
        done();
      }
    })

    client2.on('nextAyah', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Client 2 Next ayah")
      }
      numReplies++;
      numRepliesClient2++;
      if (numRepliesClient2 < 2) {
        client2.emit('setCurrentAyah', ayatText[1+numRepliesClient2]);
      } else {
        client2.disconnect();
      }

      if (numReplies == 4) {
        done();
      }
    })

  });
}