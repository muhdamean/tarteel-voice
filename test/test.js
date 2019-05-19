import { eachOf, eachSeries } from 'async';
import { expect } from 'chai';
import fs from 'fs';
import io from 'socket.io-client';
import toArray from 'stream-to-array';
import wav from 'wav';

let app = require('../src/index');

let socketUrl = 'http://localhost:5000';

let options = {  
  transports: ['websocket'],
  'force new connection': true
};

let readOneSecond = (buffer, startSecond) => {
  let currentByte = startSecond * 44100 * 2;
  return buffer.slice(currentByte, currentByte + 44100 * 2)
}

let streamNextSecond = (audioBuffer, cb, done, currIteration, numIterations) => {
  let data = readOneSecond(audioBuffer, currIteration);
  cb(data);

  // console.log(`Iteration ${currIteration} of ${numIterations}: ${data.length}`);

  if (currIteration < numIterations - 1) {
    setTimeout(streamNextSecond, 1000, audioBuffer, cb, done, currIteration+1, numIterations)
  } else {
    done();
  }
}

let streamAudioInRealtime = (audioBuffer, cb, done) => {
  let duration = audioBuffer.length / (44100 * 2);
  let numIterations = Math.ceil(duration);

  setTimeout(streamNextSecond, 1000, audioBuffer, cb, done, 0, numIterations)
}

let streamMultipleAudioInRealtime = (audioBuffers, cb, done) => {
  eachSeries(audioBuffers, (audioBuffer, asyncDone) => {
      console.log("Streaming next ayah")
      streamAudioInRealtime(audioBuffer, cb, asyncDone);
    },
    done
  )
}

describe('Basic tests', function () {
  this.timeout(10000);
  let client1, ayahData;

  before('Loading wavs...', function(done) {
    let ayahFile = fs.createReadStream('test/001001.wav');
    let ayahReader = wav.Reader()

    ayahReader.on('format', function (format) {
      toArray(ayahReader, function (err, arr) {
        ayahData = Buffer.concat(arr)
        ayahFile.close()
        done();
      })
    });

    ayahFile.pipe(ayahReader);
  })

  it('recognize test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);

    client1.on('speechData', (msg) => {
      // TODO: Do some testing with partial transcripts
      // console.log(msg)
    });

    client1.on('foundResults', (msg) => {
      expect(msg['matches'][0]['ayahNum']).to.equal(1);
      expect(msg['matches'][0]['surahNum']).to.equal(1);
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
      console.log("Next ayah")
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
});

describe('Multi Ayat tests', function () {
  this.timeout(30000);
  let client1,
      ayatData = [null, null, null],
      ayatText = ['بسم الله الرحمن الرحيم','الحمد لله رب العالمين','الرحمن الرحيم'],
      currentAyah = 0;

  before('Loading wavs...', function(done) {
    let ayatList = ['001001.wav', '001002.wav', '001003.wav'];
    eachOf(ayatList, (ayahFile, ayahIndex, cb) => {
      let ayahStream = fs.createReadStream(`test/${ayahFile}`);
      let ayahReader = wav.Reader()

      ayahReader.on('format', function (format) {
        toArray(ayahReader, function (err, arr) {
          ayatData[ayahIndex] = Buffer.concat(arr)
          console.log(`Loaded ${ayahFile}`);
          ayahStream.close()
          cb();
        })
      });

      ayahStream.pipe(ayahReader);
    }, done);
  })

  it('transcribe test', function (done) {
    client1 = io.connect(socketUrl, options);

    client1.on('handleMatchingResult', (msg) => {
      // TODO: Do something with intermediate results
      // console.log(msg)
    });

    client1.on('nextAyah', () => {
      console.log("Next ayah")
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
});

describe('Multi client test', function () {
  this.timeout(120000);
  let client1, client2,
      ayatData = [null, null, null],
      ayatText = ['بسم الله الرحمن الرحيم','الحمد لله رب العالمين','الرحمن الرحيم'];

  before('Loading wavs...', function(done) {
    let ayatList = ['001001.wav', '001002.wav', '001003.wav'];
    eachOf(ayatList, (ayahFile, ayahIndex, cb) => {
      let ayahStream = fs.createReadStream(`test/${ayahFile}`);
      let ayahReader = wav.Reader()

      ayahReader.on('format', function (format) {
        toArray(ayahReader, function (err, arr) {
          ayatData[ayahIndex] = Buffer.concat(arr)
          console.log(`Loaded ${ayahFile}`);
          ayahStream.close()
          cb();
        })
      });

      ayahStream.pipe(ayahReader);
    }, done);
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
      }, 1000)
    });

    client2.on('connect', function() {
      setTimeout(() => {
        client2.emit('startStream', {type: 'recognition'});
          streamAudioInRealtime(ayatData[1], (data) => {
            client2.emit('binaryAudioData', data);
          }, () => {
            client2.emit('endStream');
          })
      }, 2000)
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
        streamMultipleAudioInRealtime(ayatData.slice(0,2), (data) => {
          client1.emit('binaryAudioData', data);
        }, () => {
          client1.emit('endStream');
        })
      }, 1000)
    });

    client2.on('connect', function() {
      setTimeout(() => {
        client2.emit('startStream', {type: 'transcribe'});
        client2.emit('setCurrentAyah', ayatText[1]);
        streamMultipleAudioInRealtime(ayatData.slice(1,3), (data) => {
          client2.emit('binaryAudioData', data);
        }, () => {
          client2.emit('endStream');
        })
      }, 2000)
    });

    // Check for next ayah
    client1.on('nextAyah', () => {
      console.log("Next ayah")
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
      console.log("Next ayah")
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
});
