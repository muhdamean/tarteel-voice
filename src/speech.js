import speech from '@google-cloud/speech';
import fetch from 'node-fetch';
import uuidv1 from 'uuid/v1';

import upload from './aws/upload';
import { saveItem } from './aws/db';
import { findDiff } from './transcribe';

let speechClient,
  recognizeStream,
  partialQuery = '',
  interimTranscript = '',
  globalOptions;

speechClient = new speech.SpeechClient({
  keyFilename: './config/tarteel-236900-2486c1058706.json',
}); // Creates a client.

export const startStream = (socket, options) => {
  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 48000,
      languageCode: 'ar-AE',
      profanityFilter: false,
      enableWordTimeOffsets: true,
    },
    interimResults: true, // If you want interim results, set this to true
    singleUtterance: true,
  };
  
  globalOptions = options;

  // Create a recognize stream
  recognizeStream = speechClient
  .streamingRecognize(request)
  .on('error', (error) => {
    if (error.code === 11) {
      socket.emit('endStream');
      console.log('Duration exceeded 65 seconds');
      return;
    }
    console.log(error);
    socket.emit('streamError', error);
    socket.emit('endStream');
  })
  .on('data', (data) => handleData(data, socket));
};

const handleData = (data, socket) => {  
  if (data.results[0]) {
    process.stdout.write(
      data.results[0].alternatives[0]
        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
        : `\n\nReached transcription time limit, press Ctrl+C\n`
    );

    socket.emit('speechData', data);

    if (data.results[0].isFinal) {
      console.log('Final word');
      endStream();
      
      let finalString =  data.results[0].alternatives[0].transcript;

      if (globalOptions.type === 'recognition') {
        handleSearch(finalString, socket);
      } else {
        socket.emit('nextAyah')
        startStream(socket, globalOptions);
      }
    } else {
      interimTranscript += data.results[0].alternatives[0].transcript;
      if (globalOptions.type === 'transcribe') {
        if (Math.round(data.results[0].stability)) {
          // console.log(data.results[0].alternatives[0].transcript);
          findDiff(socket, data.results[0].alternatives[0].transcript);
        }
      }
    }
    partialQuery = interimTranscript;

  }
  
}

/**
* Closes the recognize stream and wipes it
*/
export const endStream = () => {
  if (recognizeStream) {
    recognizeStream.end();
    recognizeStream = null;
  }
}

/**
* Receives streaming data and writes it to the recognizeStream for transcription
* 
* @param {Buffer} data A section of audio data (ArrayBuffer)
*/
export const handleReceivedData = (data) => {
  if (recognizeStream) {
    recognizeStream.write(data);
  }
}

export const handleSearch = (query, socket) => {
  console.log('Query is: ', query);
  endStream();
  socket.emit('loading', true)
  query = query.trim();
  fetch('https://api.iqraapp.com/api/v3.0/search', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      arabicText: query,
      translation: 'en-hilali',
      apikey: process.env.IQRA_API_KEY,
    }),
  })
    .then(res => res.json())
    .then(json => {
      socket.emit('foundResults', json.result);
    })
    .catch(e => {
      console.log(e);
    });
};
