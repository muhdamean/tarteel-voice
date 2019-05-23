import SocketIo from 'socket.io';
import http from 'http';
import express from 'express';
import fetch from 'node-fetch';

import { RecognitionClient } from './speech';
import { FileSaver } from './file';
import { Transcriber } from './transcribe';

require('dotenv').config()

// Create express server for static assets
const app = express();
app.get('/', (req, res) => {
  res.send('Hello world!');
})

// Create socket.io server for streaming audio
const server = http.Server(app);
const io = SocketIo(server);

io.on('connection', (socket) => {
  console.log(`[${socket.id}] Connected`);

  socket.recognitionClient = null;
  socket.fileSaver = null;
  socket.transcriber = null;

  /**
   * startStream event starts and initializes the recogntion, file saving and transcription modules
   */
  socket.on('startStream', (options) => {
    console.log(`[${socket.id}] Initializing stream`);
    socket.globalOptions = options;

    // Start recognition client
    socket.recognitionClient = new RecognitionClient(socket.onPartialResults, socket.onFinalResults, (err) => {console.log(err)})
    socket.recognitionClient.startStream()

    // Start file saver
    socket.fileSaver = new FileSaver()
    socket.fileSaver.startFileSave();
    socket.on('upload', socket.fileSaver.uploadData);

    // Start transcriber if requested
    if (socket.globalOptions.type === 'transcribe') {
      socket.transcriber = new Transcriber((data) => socket.emit('handleMatchingResult', data))
    }
  });

  /**
   * endStream event shuts all existing modules down
   */
  socket.on('endStream', () => {
    console.log(`[${socket.id}] Ending stream`);

    if (socket.recognitionClient) {
      socket.recognitionClient.endStream();
    }

    if (socket.fileSaver) {
      socket.fileSaver.endFileSave();
    }
  });

  /**
   * binaryAudioData event receives audio chunks from the client
   */
  socket.on("binaryAudioData", (chunk) => {
    if (socket.recognitionClient) {
      socket.recognitionClient.handleReceivedData(chunk)
    }

    if (socket.fileSaver) {
      socket.fileSaver.handleDataFileSave(chunk);
    }
  });

  socket.on('setCurrentAyah', (ayah) => {
    if (socket.transcriber) {
      socket.transcriber.setCurrentAyah(ayah)
    }
  });

  socket.onPartialResults = (data) => {
    console.log(`[${socket.id}] Partial result`);
    if (data.results[0]) {
      socket.emit('speechData', data);
      if (socket.globalOptions.type === 'transcribe') {
        if (Math.round(data.results[0].stability)) {
          socket.transcriber.findDiff(data.results[0].alternatives[0].transcript);
        }
      }
    }
  }

  socket.onFinalResults = (data) => {
    console.log(`[${socket.id}] Final result`);
    if (data.results[0]) {
      socket.emit('speechData', data);
      console.log('Final word');
      socket.recognitionClient.endStream();

      let finalString =  data.results[0].alternatives[0].transcript;
  
      if (socket.globalOptions.type === 'recognition') {
        socket.handleSearch(finalString);
      } else {
        socket.emit('nextAyah')
        socket.recognitionClient.startStream();
      }
    }
  }

  socket.onError = (errorMsg) => {
    socket.emit('streamError', errorMsg);
    socket.emit('endStream');
  }

  socket.handleSearch = (query) => {
    console.log('Query is: ', query);
    socket.recognitionClient.endStream();
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
});

server.listen(5000, () => {
  console.log('Server is Listening on PORT: 5000 ...');
});
