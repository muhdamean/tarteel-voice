import { expect } from 'chai';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Transcriber } from '../../src/transcribe';

export default function suite(mochaContext) {
    mochaContext.timeout(30000);

    // Load snapshots
    // - We have to do this synchonously so mocha waits until we 
    //   dynamically generate the tests
    // - All non-json files are ignored
    let snapshot_files = readdirSync('test/snapshots');
    snapshot_files = snapshot_files.filter((file_name) => file_name.split('.').pop() === "json");
    let snapshots = snapshot_files.map((file_name) => (JSON.parse(readFileSync(join('test/snapshots', file_name)))));

    snapshots.forEach((snapshot) => {
        it(snapshot["description"], function(done) {
            let ayahFoundIndex = 0;
            let ayahLabels = snapshot["expected_ayat"];
            let partialTranscripts = snapshot["transcripts"];

            let onAyahFound = (ayahShape) => {
                expect(ayahShape.chapter_id).to.equal(ayahLabels[ayahFoundIndex].chapter_id);
                expect(ayahShape.verse_number).to.equal(ayahLabels[ayahFoundIndex].verse_number);
                ayahFoundIndex += 1;
        
                if (ayahFoundIndex == ayahLabels.length) {
                    transcriber.destructor();
                    transcriber = null;
                    done();
                }
            }

            let onMatchFound = (ayahShape, wordCount) => {
                // pass
            }
            
            // Set up transcriber
            let transcriber = new Transcriber(onAyahFound, onMatchFound);

            for (let partialIndex in partialTranscripts) {
                transcriber.onTranscript(
                    partialTranscripts[partialIndex]['transcript'],
                    partialTranscripts[partialIndex]['isFinal']
                )
            }
        });
    });
}