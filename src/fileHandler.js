import wav from 'wav';
import upload from './aws/upload';
import uuidv1 from 'uuid/v1';
import * as audio_constants from '../config/audioConstants';

import { saveItem } from './aws/db';

export class FileSaver {
  constructor() {
    this.outputFile = null;
  }

  startFileSave = () => {
    this.outputFile = new wav.Writer({
      channels: audio_constants.CHANNELS,
      sampleRate: audio_constants.SAMPLE_RATE_HZ,
      bitDepth: audio_constants.BIT_DEPTH
    });
  };

  uploadData = (data) => {
    const id = uuidv1();
    upload(this.outputFile, id).then((link) => {
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
  };

  handleDataFileSave = (data) => {
    if (this.outputFile) {
      this.outputFile.write(data);
    }
  };

  endFileSave = () => {
    this.outputFile.end();
  }
}
