import wav from 'wav';
import upload from './aws/upload';
import uuidv1 from 'uuid/v1';

import { saveItem } from './aws/db';

export class FileSaver {
  constructor() {
    this.outputFile = null;
  }

  startFileSave = () => {
    this.outputFile = new wav.Writer({
      channels: 1,
      sampleRate: 48000,
      bitDepth: 16
    });
  }

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
  }

  handleDataFileSave = (data) => {
    if (this.outputFile) {
      this.outputFile.write(data);
    }
  }

  endFileSave = () => {
    this.outputFile.end();
  }
}
