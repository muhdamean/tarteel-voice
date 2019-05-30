import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamAudioInRealtime } from '../utils';
import { loadAudioFile } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(180000);
  let client1, ayahData;

  before('Loading wavs...', function(done) {
    loadAudioFile('test/audio/002282.wav', (data) => {
      ayahData = data;
      done();
    });
  })

  it('recognize test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);

    client1.on('speechData', (msg) => {
      // TODO: Do some testing with partial transcripts
      // console.log(msg)
    });

    client1.on('foundResults', (msg) => {
      expect(msg['matches'][0]['ayahNum']).to.equal(282);
      expect(msg['matches'][0]['surahNum']).to.equal(2);
      client1.disconnect();
      done();
    })

    client1.on('connect', function() {
      client1.emit('startStream', {type: 'recognition'});
      streamAudioInRealtime(ayahData, (data) => {
        client1.emit('binaryAudioData', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });

  it('transcribe test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);

    client1.on('handleMatchingResult', (msg) => {
      // TODO: Do something with intermediate results
      // console.log(msg)
    });

    client1.on('nextAyah', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Next ayah")
      }
      client1.disconnect();
      done();
    })

    client1.on('connect', function(){
      client1.emit('startStream', {type: 'transcribe'});
      client1.emit('setCurrentAyah', 'بسم الله الرحمن الرحيم');
      streamAudioInRealtime(ayahData, (data) => {
        client1.emit('binaryAudioData', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });
}