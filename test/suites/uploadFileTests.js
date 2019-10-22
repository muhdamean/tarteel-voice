import { expect } from 'chai';
import io from "socket.io-client";

import { Transcriber } from '../../src/transcribe';
import { loadAudioFile } from "../utils";


export default function suite(mochaContext, socketUrl, options) {
  mochaContext.timeout(30000);

  let client1, ayahData;

  before('Loading wavs...', function (done) {
    loadAudioFile('test/audio/001002.wav', (data) => {
      ayahData = data;
      done();
    });
  });

  it('upload ayah test', function (done) {
    // Set up client1 connection
    client1 = io.connect(socketUrl, options);

    client1.on('ayahFound', (msg) => {
      expect(msg.ayahShape.chapter_id).to.equal(1);
      expect(msg.ayahShape.verse_number).to.equal(2);
      client1.emit('endStream');
      client1.disconnect();
      done();
    });

    client.on('speechResult', (msg) => {
      client1.emit('endStream');
      client1.disconnect();
      done();
    })
  });

}
