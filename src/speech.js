import speech from '@google-cloud/speech';

export class RecognitionClient {
  constructor(onPartialResults, onFinalResults, onError) {
    this.requestParams = {
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
    this.onPartialResults = onPartialResults;
    this.onFinalResults = onFinalResults;
    this.onError = onError;
    this.recognizeStream = null;
    this.speechClient = new speech.SpeechClient({
      keyFilename: './config/tarteel-236900-2486c1058706.json',
    }); // Creates a client.
  }

  startStream = () => {
    this.recognizeStream = this.speechClient
      .streamingRecognize(this.requestParams)
      .on('error', (error) => {
        if (error.code === 11) {
          this.onError('Duration exceeded 65 seconds')
          return;
        }
        this.onError(error)
      })
      .on('data', (data) => this.handleData(data));
  }

  handleData = (data) => {
    if (data.results[0]) {
      process.stdout.write(
        data.results[0].alternatives[0]
          ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          : `\n\nReached transcription time limit, press Ctrl+C\n`
      );
      if (data.results[0].isFinal) {
        this.onFinalResults(data);
      } else {
        this.onPartialResults(data);
      }
    }
  }

  /**
  * Closes the recognize stream and wipes it
  */
  endStream = () => {
    if (this.recognizeStream) {
      this.recognizeStream.end();
      this.recognizeStream = null;
    }
  }

  /**
  * Receives streaming data and writes it to the recognizeStream for transcription
  *
  * @param {Buffer} data A section of audio data (ArrayBuffer)
  */
  handleReceivedData = (data) => {
    if (this.recognizeStream) {
      this.recognizeStream.write(data);
    }
  }
}
