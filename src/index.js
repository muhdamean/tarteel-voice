import SocketIo from 'socket.io';
import http from 'http';
import express from 'express';
import fetch from 'node-fetch';

import { RecognitionClient } from './speech';
import { FileSaver } from './file';
import { Transcriber } from './transcribe';

require('dotenv').config()

const app = express();

const server = http.Server(app);

const io = SocketIo(server);

app.get('/', (req, res) => {
  res.send('Hello world!');
})

io.on('connection', (socket) => {
  console.log('Connected: ', socket.id);
  socket.recognitionClient = null;
  socket.fileSaver = null;
  socket.transcriber = null;

  socket.onPartialResults = (data) => {
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

  socket.on("binaryAudioData", (chunk) => {
    socket.recognitionClient.handleReceivedData(chunk)
    socket.fileSaver.handleDataFileSave(chunk);
  });

  socket.on('endStream', () => {
    console.log('Ended!');
    socket.recognitionClient.endStream();
    socket.fileSaver.endFileSave();
  });

  socket.on('startStream', (options) => {
    console.log('Starting...');
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

  socket.on('setCurrentAyah', (ayah) => {
    socket.transcriber.setCurrentAyah(ayah)
  });

});

server.listen(5000, () => {
  console.log('Server is Listening on PORT: 5000 ...');
});
