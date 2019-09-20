import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamAudioInRealtime, streamMultipleAudioInRealtime, stopAllStreaming } from '../utils';
import { loadAudioFiles } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(120000);
  let client1, client2,
      ayatData = [null, null, null, null, null],
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

  it('single ayah recognize test', function (done) {
    // Set up client connections
    client1 = io.connect(socketUrl, options);
    client2 = io.connect(socketUrl, options);
    let numReplies = 0;

    // Start both clients at slightly different time intervals
    client1.on('connect', function() {
      setTimeout(() => {
        client1.emit('startStream');
          streamAudioInRealtime(ayatData[0], (data) => {
            client1.emit('sendStream', data);
          }, () => {
            client1.emit('endStream');
          })
      }, 100)
    });

    client2.on('connect', function() {
      setTimeout(() => {
        client2.emit('startStream');
          streamAudioInRealtime(ayatData[2], (data) => {
            client2.emit('sendStream', data);
          }, () => {
            client2.emit('endStream');
          })
      }, 1500)
    });

    // Check for correct ayah recognition from both clients
    client1.on('ayahFound', (msg) => {
      // console.log('client1 ' + JSON.stringify(msg));
      expect(msg.ayahShape.chapter_id).to.equal(ayat[0].surahNum);
      expect(msg.ayahShape.verse_number).to.equal(ayat[0].ayahNum);
      client1.emit('endStream');
      client1.disconnect();
      numReplies++;
      if (numReplies == 2) {
        done();
      }
    })

    client2.on('ayahFound', (msg) => {
      // console.log('client2 ' + JSON.stringify(msg));
      expect(msg.ayahShape.chapter_id).to.equal(ayat[1].surahNum);
      expect(msg.ayahShape.verse_number).to.equal(ayat[1].ayahNum);
      client2.emit('endStream');
      client2.disconnect();
      numReplies++;
      if (numReplies == 2) {
        done();
      }
    })
  });

  it('multi ayat recognize test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);
    client2 = io.connect(socketUrl, options);
    let numReplies = 0, numRepliesClient1 = 0, numRepliesClient2 = 0;

    // Start both clients at slightly different time intervals
    client1.on('connect', function() {
      setTimeout(() => {
        client1.emit('startStream');
        streamMultipleAudioInRealtime(ayatData.slice(0,3), (data) => {
          client1.emit('sendStream', data);
        }, () => {
          client1.emit('endStream');
        })
      }, 100)
    });

    client2.on('connect', function() {
      setTimeout(() => {
        client2.emit('startStream');
        streamMultipleAudioInRealtime(ayatData.slice(2,5), (data) => {
          client2.emit('sendStream', data);
        }, () => {
          client2.emit('endStream');
        })
      }, 3000)
    });

    // Check for next ayah
    client1.on('ayahFound', (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Client 1 Next ayah")
      }

      expect(msg.ayahShape.chapter_id).to.equal(ayat[numRepliesClient1].surahNum);
      expect(msg.ayahShape.verse_number).to.equal(ayat[numRepliesClient1].ayahNum);

      numReplies++;
      numRepliesClient1++;
      if (numRepliesClient1 == 2) {
        client1.emit('endStream');
        client1.disconnect();
      }

      if (numReplies == 4) {
        done();
      }
    });

    client2.on('ayahFound', (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Client 2 Next ayah")
      }

      expect(msg.ayahShape.chapter_id).to.equal(ayat[1 + numRepliesClient2].surahNum);
      expect(msg.ayahShape.verse_number).to.equal(ayat[1 + numRepliesClient2].ayahNum);

      numReplies++;
      numRepliesClient2++;
      if (numRepliesClient2 == 2) {
        client2.emit('endStream');
        client2.disconnect();
      }

      if (numReplies == 4) {
        done();
      }
    });
  });
}