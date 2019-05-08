const record = require('node-record-lpcm16');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
};

const request = {
    config,
    interimResults: false, //Get interim results from stream
};

// Creates a client
const client = new speech.SpeechClient();

// Create a recognize stream
const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data =>
        process.stdout.write(
            data.results[0] && data.results[0].alternatives[0]
                ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                : `\n\nReached transcription time limit, press Ctrl+C\n`
        )
    );

// Start recording and send the microphone input to the Speech API
record
    .start({
        sampleRateHertz: 16000,
        threshold: 1, //silence threshold
        recordProgram: 'arecord', // Try also "arecord" or "sox"
        silence: '5.0', //seconds of silence before ending
    })
    .on('error', console.error)
    .pipe(recognizeStream);

console.log('Listening, press Ctrl+C to stop.');
