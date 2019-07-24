import { eachOf, eachSeries } from 'async';
import fs from 'fs';
import toArray from 'stream-to-array';
import wav from 'wav';

// This constant defines the number of chunks in which the audio is divided
// when being streamed in real time
const numChunksPerSecond = 1;

let timerIDs = [];

// Function to extract a chunk of the correct size from the current audio file
let readOneChunk = (buffer, startChunk) => {
  let currentByte = startChunk * (44100 * 2 / numChunksPerSecond);
  return buffer.slice(currentByte, currentByte + (44100 * 2 / numChunksPerSecond));
}

// Recursive function that streams an entire audio file chunk by chunk
let streamNextChunk = (audioBuffer, cb, done, currChunk, numChunks) => {
  let data = readOneChunk(audioBuffer, currChunk);
  cb(data);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Test] Streaming audio progress: ${((currChunk+1)/numChunks*100).toFixed(2)}%`);
  }

  if (currChunk < numChunks - 1) {
    let timerID = setTimeout(streamNextChunk, 1000/numChunksPerSecond, audioBuffer, cb, done, currChunk+1, numChunks);
    timerIDs.push(timerID);
  } else {
    done();
  }
}

// Stream a single audio file
export const streamAudioInRealtime = (audioBuffer, cb, done) => {
  let duration = audioBuffer.length / (44100 * 2);
  let numChunks = Math.ceil(duration * numChunksPerSecond);

  let timerID = setTimeout(streamNextChunk, 1000/numChunksPerSecond, audioBuffer, cb, done, 0, numChunks);
  timerIDs.push(timerID);
}

// Stream multiple audio files in sequence
export const streamMultipleAudioInRealtime = (audioBuffers, cb, done) => {
  eachSeries(audioBuffers, (audioBuffer, asyncDone) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Test] Streaming next ayah");
      }
      streamAudioInRealtime(audioBuffer, cb, asyncDone);
    },
    done
  )
}

// Load a single audio file
export const loadAudioFile = (audioFilePath, done) => {
  let audioFile = fs.createReadStream(audioFilePath);
  let audioReader = wav.Reader();

  audioReader.on('format', function (format) {
      toArray(audioReader, function (err, arr) {
        let audioData = Buffer.concat(arr);
        audioFile.close();
        done(audioData);
      })
  });

  audioFile.pipe(audioReader);
}

// Load multiple audio files
export const loadAudioFiles = (audioFilePaths, done) => {
  let audioData = [];
  audioFilePaths.forEach(e => {
    audioData.push(null);
  });
  eachOf(audioFilePaths, (audioFilePath, audioIndex, cb) => {
    let audioStream = fs.createReadStream(`test/audio/${audioFilePath}`);
    let audioReader = wav.Reader()

    audioReader.on('format', function (format) {
      toArray(audioReader, function (err, arr) {
        audioData[audioIndex] = Buffer.concat(arr)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Test] Loaded ${audioFilePath}`);
        }
        audioStream.close()
        cb();
      })
    });

    audioStream.pipe(audioReader);
  },
  () => done(audioData));
}

export const stopAllStreaming = () => {
  timerIDs.forEach(clearInterval);
  timerIDs = [];
}