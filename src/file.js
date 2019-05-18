import wav from 'wav';

let outputFile;

export const startFileSave = (socket) => {
  outputFile = new wav.Writer({
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });
  // registering upload event 
  socket.on('upload', (data) => {
    const id = uuidv1();
    if (!recognizeStream) {
      upload(outputFile, id).then((link) => {
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
  });
}

export const handleDataFileSave = (data) => {
  if (outputFile) {
    outputFile.write(data);
  }
}

export const endFileSave = () => {
  outputFile.end();
}
