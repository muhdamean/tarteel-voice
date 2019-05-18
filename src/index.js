import SocketIo from 'socket.io';
import http from 'http';
import express from 'express';

import { startStream, endStream, handleReceivedData } from './speech';
import { startFileSave, endFileSave, handleDataFileSave } from './file';
import { setCurrentAyah } from './transcribe';

require('dotenv').config()

const app = express();

const server = http.Server(app);

const io = SocketIo(server);

app.get('/', (req, res) => {
  res.send('Hello world!');
})

io.on('connection', (socket) => {
  console.log('Connected: ', socket.id);
  
  socket.on("binaryAudioData", (chunk) => {
    handleReceivedData(chunk);
    handleDataFileSave(chunk);
  });

  socket.on('endStream', () => {
    console.log('Ended!');
    endStream();
    endFileSave();
  });

  socket.on('startStream', (options) => {
    console.log('Starting...');
    startStream(socket, options);
    startFileSave(socket);
  });

  socket.on('setCurrentAyah', (ayah) => {
    setCurrentAyah(ayah)
  });

});

server.listen(5000, () => {
  console.log('Server is Listening on PORT: 5000 ...');
});
