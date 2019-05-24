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
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${socket.id}] Connected`);
  }

  socket.recognitionClient = null;
  socket.fileSaver = null;
  socket.transcriber = null;

  /**
   * startStream event starts and initializes the recogntion, file saving and transcription modules
   */
  socket.on('startStream', (options) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${socket.id}] Initializing stream`);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${socket.id}] Ending stream`);
    }

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

  /**
   * setCurrentAyah sets the current ayah from the client for transcribe mode
   */
  socket.on('setCurrentAyah', (ayah) => {
    if (socket.transcriber) {
      socket.transcriber.setCurrentAyah(ayah)
    }
  });

  /**
   * Function that receives partial transcripts from the speech client. 
   * Transcripts may change in the future. Currently, we use partial outputs
   * only for `transcribe` mode and not `recognition` mode.
   */
  socket.onPartialResults = (transcript) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${socket.id}] Partial result: ${transcript}`);
    }
    socket.emit('speechData', transcript);
    if (socket.globalOptions.type === 'transcribe') {
        socket.transcriber.findDiff(transcript);
    }
  }

  /**
   * Function that receives final transcripts from the speech client. 
   * Currently, we use final transcripts to start the iqra search in 
   * `recognition` mode. In `transcribe` mode, we just assume that the
   * current ayah has ended, and signal the client with `nextAyah`.
   */
  socket.onFinalResults = (transcript) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${socket.id}] Final result: ${transcript}`);
    }
    socket.emit('speechData', transcript);

    if (socket.globalOptions.type === 'recognition') {
      socket.handleSearch(transcript);
    } else {
      socket.emit('nextAyah');
    }
  }

  /**
   * Error handler, current just streams the error to the client
   * and ends the connection.
   */
  socket.onError = (errorMsg) => {
    socket.emit('streamError', errorMsg);
    socket.emit('endStream');
  }

  /**
   * Iqra search function
   * In the future, this should be factored out into its own module
   */
  socket.handleSearch = (query) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${socket.id}] Iqra query is: ${query}`);
    }
    // socket.recognitionClient.endStream();
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
