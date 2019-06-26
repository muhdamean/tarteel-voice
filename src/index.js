import SocketIo from 'socket.io';
import http from 'http';
import express from 'express';

import { FileSaver } from './fileHandler';
import { RecognitionClient } from './speech';
import { Transcriber } from './transcribe';


require('dotenv').config();

// Create express server for static assets
const app = express();
app.get('/', (req, res) => {
    res.send('Hello world!');
});

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
    socket.on('startStream', () => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${socket.id}] Initializing stream`);
        }

        // Start recognition client
        socket.recognitionClient = new RecognitionClient(
            socket.onPartialResults,
            socket.onFinalResults,
            (err) => console.log(err)
        );
        socket.recognitionClient.startStream();

        // Start file saver
        socket.fileSaver = new FileSaver();
        socket.fileSaver.startFileSave();
        socket.on('upload', socket.fileSaver.uploadData);

        // Start transcriber
        socket.transcriber = new Transcriber(
            socket.onAyahFound,
            socket.onMatchFound
        );
        //(data) => socket.emit('handleMatchingResult', data))
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
    socket.on('sendStream', (chunk) => {
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

        // Propagate raw transcript to client
        socket.emit('speechResult', {
            'text': transcript,
            'isFinal': false
        });

        // call onPartial
        socket.transcriber.onTranscript(transcript, false);
    };

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

        // Propagate raw transcript to client
        socket.emit('speechResult', {
            'text': transcript,
            'isFinal': true
        });

        socket.transcriber.onTranscript(transcript, true);
    };

    /**
     * Error handler, current just streams the error to the client
     * and ends the connection.
     */
    socket.onError = (errorMsg) => {
        socket.emit('streamError', errorMsg);
        socket.emit('endStream');
    };

    socket.onAyahFound = (surahNum, ayahNum, ayahText) => {
        socket.emit('ayahFound', {
            'surahNum': surahNum,
            'ayahNum': ayahNum,
            'ayahWords': ayahText.trim().split(' ')
        });
    }

    socket.onMatchFound = (surahNum, ayahNum, ayahWordIndex) => {
        socket.emit('matchFound', {
            'surahNum': surahNum,
            'ayahNum': ayahNum,
            'wordCount': ayahWordIndex
        });
    }
});

server.listen(5000, () => {
    console.log('Server is Listening on PORT: 5000 ...');
});
