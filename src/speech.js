import speech from '@google-cloud/speech';
import fetch from 'node-fetch';
import wav from 'wav'
import uuidv1 from 'uuid/v1';

import upload from './aws/upload';
import { saveItem } from './aws/db';
import { findDiff } from './transcribe';

let speechClient,
  recognizeStream,
  partialQuery = '',
  interimTranscript = '',
  outputFile,
  globalOptions;

speechClient = new speech.SpeechClient({
  keyFilename: './Tarteel-b9ba24204548.json',
}); // Creates a client.

export const startStream = (socket, options) => {
  outputFile = new wav.Writer({
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });
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


  // registering upload event 
  socket.on('upload', (data) => {
    const id = uuidv1();
    if (!recognizeStream) {
      upload(outputFile, id).then((link) => {
        saveItem({
          id,
          audioLink: link,
          ...data,
        }).then((record) => {
          console.log(record);
        }).catch(e => {
          console.log('error: ', e);
        })
      });
    }
  });
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
        socket.emit('nextAyah');
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
  
};

/**
* Closes the recognize stream and wipes it
*/
export const endStream = () => {
  if (recognizeStream) {
    recognizeStream.end();
    recognizeStream = null;
    outputFile.end();
  }
};

/**
* Receives streaming data and writes it to the recognizeStream for transcription
* 
* @param {Buffer} data A section of audio data (ArrayBuffer)
*/
export const handleReceivedData = (data) => {
  if (recognizeStream) {
    recognizeStream.write(data);
    outputFile.write(data);
  }
};

export const handleSearch = (query, socket) => {
  console.log('Query is: ', query);
  endStream();
  socket.emit('loading', true);
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
