import { expect } from 'chai';
import io from 'socket.io-client';

// Import utilities
import { streamMultipleAudioInRealtime } from '../utils';
import { loadAudioFiles } from '../utils';

export default function suite (mochaContext, socketUrl, options) {
  mochaContext.timeout(50000);
  let client1,
      ayatData = [null, null, null],
      ayatText = ['بسم الله الرحمن الرحيم','الحمد لله رب العالمين','الرحمن الرحيم'],
      currentAyah = 0;

  before('Loading wavs...', function(done) {
    let ayatList = ['001001.wav', 'silence.wav', '001002.wav', 'silence.wav', '001003.wav'];
    loadAudioFiles(ayatList, (data) => {
      ayatData = data;
      done();
    });
  })

  it('transcribe test', function (done) {
    client1 = io.connect(socketUrl, options);

    client1.on('handleMatchingResult', (msg) => {
      // TODO: Do something with intermediate results
      // console.log(msg)
    });

    client1.on('nextAyah', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Next ayah")
      }
      currentAyah += 1;
      if (currentAyah < ayatText.length) {
        client1.emit('setCurrentAyah', ayatText[currentAyah]);
      } else {
        client1.disconnect();
        done();
      }
    })

    client1.on('connect', function(){
      client1.emit('startStream', {type: 'transcribe'});
      client1.emit('setCurrentAyah', ayatText[currentAyah]);
      streamMultipleAudioInRealtime(ayatData, (data) => {
        client1.emit('binaryAudioData', data);
      }, () => {
        client1.emit('endStream');
      })
    });
  });
}