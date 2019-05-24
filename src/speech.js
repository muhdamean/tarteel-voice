import speech from '@google-cloud/speech';

export class RecognitionClient {
  constructor(onPartialResults, onFinalResults, onError) {
    this.requestParams = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: 'ar-AE',
        profanityFilter: false,
        enableWordTimeOffsets: true,
      },
      interimResults: true, // If you want interim results, set this to true
      singleUtterance: false,
    };
    this.onPartialResults = onPartialResults;
    this.onFinalResults = onFinalResults;
    this.onError = onError;

    this.speechClient = new speech.SpeechClient({
      keyFilename: './config/tarteel-236900-2486c1058706.json',
    }); // Creates a client.

    // We maintain two recognition streams, so that we can switch between them
    // when we hit the time limit per request
    this.recognizeStreams = [null, null];
    this.currentRecognizeStreamIdx = -1;
    this.currentRequestDuration = 0;
    this.maxDurationPerRequest = 55; // Duration to switch streams in seconds

    this.switchInProgress = false;
    this.nextStreamResultsQueue = [];
    this.previousPartialTranscript = "";
  }

  startStream = () => {
    this.currentRecognizeStreamIdx = 0;
    this.currentRequestDuration = 0;
    this.switchInProgress = false;
    this.nextStreamResultsQueue = [];
    this.previousPartialTranscript = "";

    let currentIdx = this.currentRecognizeStreamIdx
    this.recognizeStreams[currentIdx] = this.speechClient
      .streamingRecognize(this.requestParams)
      .on('error', (error) => {
        console.log(error)
        // if (error.code === 11) {
        //   this.onError('Duration exceeded 65 seconds')
        //   return;
        // }
        this.onError(error)
      })
      .on('data', (data) => this.handleData(currentIdx, data));
  }

  handleData = (streamIdx, data) => {
    // Check if we have some actual transcriptions
    if (data.results[0] === undefined) {
      return;
    }

    let currentTranscript = data.results[0].alternatives[0].transcript
    if (process.env.NODE_ENV === 'development') {
      console.log(`Client #${streamIdx} Transcription [${data.results[0].isFinal?'F':'P'}]: ${currentTranscript}`)
    }

    // If switch is in progress, we should queue all results from nextStream
    // until we have seen a final from prevStream
    if (this.switchInProgress && streamIdx === this.currentRecognizeStreamIdx) {
      return this.nextStreamResultsQueue.push(data)
    } else if (this.switchInProgress) {
      // Switch is in progress and we have received data from prevStream
      if (data.results[0].isFinal) {
        // This final is artificial, since we switched streams, hence we still send result
        // as partial to client
        this.onPartialResults(currentTranscript);

        if (this.previousPartialTranscript.length === 0) {
          this.previousPartialTranscript = `${currentTranscript} _ `
        } else {
          this.previousPartialTranscript = `${this.previousPartialTranscript}${currentTranscript} _ `
        }
        this.switchInProgress = false;

        // Process all queued results
        if (process.env.NODE_ENV === 'development') {
          console.log(`Client #${streamIdx} Queued: ${this.nextStreamResultsQueue.length}`)
        }
        for (let index = 0; index < this.nextStreamResultsQueue.length; index++) {
          this.handleData(this.currentRecognizeStreamIdx, this.nextStreamResultsQueue[index])
        }
        this.nextStreamResultsQueue = [];
      } else {
        this.onPartialResults(this.previousPartialTranscript + currentTranscript);
      }
    } else {
      // Normal case
      if (data.results[0].isFinal) {
        this.onFinalResults(this.previousPartialTranscript + currentTranscript);
        this.previousPartialTranscript = "";
      } else {
        this.onPartialResults(this.previousPartialTranscript + currentTranscript);
      }
    }
  }

  /**
  * Closes the recognize stream
  */
  endStream = () => {
    if (this.recognizeStreams[this.currentRecognizeStreamIdx]) {
      this.recognizeStreams[this.currentRecognizeStreamIdx].end();
    }
  }

  /**
  * Receives streaming data and writes it to the recognizeStream for transcription
  *
  * @param {Buffer} data A section of audio data (ArrayBuffer)
  */
  handleReceivedData = (data) => {
    this.currentRequestDuration += data.length / (this.requestParams.config.sampleRateHertz * 2)

    if (this.currentRequestDuration > this.maxDurationPerRequest) {
      // End old stream: Might still receive results after ending
      this.recognizeStreams[this.currentRecognizeStreamIdx].end();
      this.switchInProgress = true;

      // Start new stream
      this.currentRecognizeStreamIdx = (this.currentRecognizeStreamIdx + 1) % this.recognizeStreams.length;
      let currentIdx = this.currentRecognizeStreamIdx
      this.recognizeStreams[currentIdx] = this.speechClient
        .streamingRecognize(this.requestParams)
        .on('error', (error) => {
          console.log(error);
          // if (error.code === 11) {
          //   this.onError('Duration exceeded 65 seconds')
          //   return;
          // }
          this.onError(error)
        })
        .on('data', (data) => this.handleData(currentIdx, data));
      this.currentRequestDuration = data.length / (this.requestParams.config.sampleRateHertz * 2)
    }
    if (this.recognizeStreams[this.currentRecognizeStreamIdx]) {
      this.recognizeStreams[this.currentRecognizeStreamIdx].write(data);
    }
  }
}

export class LegacyRecognitionClient {
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
