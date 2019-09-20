import { expect } from 'chai';
import { Transcriber } from '../../src/transcribe';

export default function suite(mochaContext) {
    mochaContext.timeout(30000);

    it('single ayah recognize test', function (done) {
        let onAyahFound = (ayahObj) => {
            expect(ayahObj.chapter_id).to.equal(1);
            expect(ayahObj.verse_number).to.equal(1);

            transcriber.destructor();
            transcriber = null;
            done();
        }

        let onMatchFound = (ayahObj, wordCount) => {
            // pass
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            { 'transcript': 'بس', 'isFinal': false },
            { 'transcript': 'بسم', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله الرحمن', 'isFinal': false },
            { 'transcript': 'بسم الله الرحمن', 'isFinal': false },
            { 'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': true }
        ]

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah recognize test with pauses', function (done) {
        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 1},
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3}
        ];

        let onAyahFound = (ayahObj) => {
            expect(ayahObj.chapter_id).to.equal(ayahLabels[ayahFoundIndex].surahNum);
            expect(ayahObj.verse_number).to.equal(ayahLabels[ayahFoundIndex].ayahNum);
            // console.log(`found ${ayahFoundIndex}`);
            ayahFoundIndex += 1;

            if (ayahFoundIndex == ayahLabels.length) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }

        let onMatchFound = (ayahObj, wordCount) => {
            // pass
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            {'transcript': 'بس', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': true },
            {'transcript': 'الحب', 'isFinal': false },
            {'transcript': 'الحمد', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب العالمين', 'isFinal': false },
            {'transcript': 'الحمد لله رب العالمين', 'isFinal': true },
            {'transcript': 'الله', 'isFinal': false },
            {'transcript': 'الرحم', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah recognize test without pauses', function (done) {
        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 1},
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3}
        ];

        let onAyahFound = (ayahObj) => {
            expect(ayahObj.chapter_id).to.equal(ayahLabels[ayahFoundIndex].surahNum);
            expect(ayahObj.verse_number).to.equal(ayahLabels[ayahFoundIndex].ayahNum);
            // console.log(`found ${ayahFoundIndex}`);
            ayahFoundIndex += 1;

            if (ayahFoundIndex == ayahLabels.length) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }

        let onMatchFound = (ayahObj, wordCount) => {
            // pass
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            {'transcript': 'بس', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('single ayah follow along test', function (done) {
        let numWords = 0;
        let onAyahFound = (ayahObj) => {
            numWords = ayahObj.text_simple.trim().split(' ').length;
        }

        let onMatchFound = (ayahObj, wordCount) => {
            expect(ayahObj.chapter_id).to.equal(1);
            expect(ayahObj.verse_number).to.equal(1);
            if (wordCount == numWords) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            { 'transcript': 'بس', 'isFinal': false },
            { 'transcript': 'بسم', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله', 'isFinal': false },
            { 'transcript': 'بسم الله الرحمن', 'isFinal': false },
            { 'transcript': 'بسم الله الرحمن', 'isFinal': false },
            { 'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': true }
        ]

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah follow along test with pauses', function (done) {
        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 1},
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3}
        ];
        let ayahNumWords = 0;
        let ayahFollowAlongEnded = true;

        let onAyahFound = (ayahObj) => {
            expect(ayahFollowAlongEnded).to.equal(true);
            expect(ayahObj.chapter_id).to.equal(ayahLabels[ayahFoundIndex].surahNum);
            expect(ayahObj.verse_number).to.equal(ayahLabels[ayahFoundIndex].ayahNum);

            ayahNumWords = ayahObj.text_simple.trim().split(' ').length;
            ayahFollowAlongEnded = false;
            ayahFoundIndex += 1;
        }

        let onMatchFound = (ayahObj, wordCount) => {
            if (wordCount == ayahNumWords) {
                ayahFollowAlongEnded = true;
            }

            if (ayahFoundIndex == ayahLabels.length && ayahFollowAlongEnded) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            {'transcript': 'بس', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': true },
            {'transcript': 'الحب', 'isFinal': false },
            {'transcript': 'الحمد', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب العالمين', 'isFinal': false },
            {'transcript': 'الحمد لله رب العالمين', 'isFinal': true },
            {'transcript': 'الله', 'isFinal': false },
            {'transcript': 'الرحم', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah follow along test without pauses', function (done) {
        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 1},
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3}
        ];
        let ayahNumWords = 0;
        let ayahFollowAlongEnded = true;

        let onAyahFound = (ayahObj) => {
            expect(ayahFollowAlongEnded).to.equal(true);
            expect(ayahObj.chapter_id).to.equal(ayahLabels[ayahFoundIndex].surahNum);
            expect(ayahObj.verse_number).to.equal(ayahLabels[ayahFoundIndex].ayahNum);

            ayahNumWords = ayahObj.text_simple.trim().split(' ').length;
            ayahFollowAlongEnded = false;
            ayahFoundIndex += 1;
        }

        let onMatchFound = (ayahObj, wordCount) => {
            if (wordCount == ayahNumWords) {
                ayahFollowAlongEnded = true;
            }

            if (ayahFoundIndex == ayahLabels.length && ayahFollowAlongEnded) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            {'transcript': 'بس', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الله', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah recognize test with errors in the middle', function (done) {
        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 1},
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3}
        ];

        let onAyahFound = (ayahObj) => {
            expect(ayahObj.chapter_id).to.equal(ayahLabels[ayahFoundIndex].surahNum);
            expect(ayahObj.verse_number).to.equal(ayahLabels[ayahFoundIndex].ayahNum);
            // console.log(`found ${ayahFoundIndex}`);
            ayahFoundIndex += 1;

            if (ayahFoundIndex == ayahLabels.length) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }

        let onMatchFound = (ayahObj, wordCount) => {
            // pass
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            {'transcript': 'بس', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم الله', 'isFinal': false },
            {'transcript': 'بسم ال الرحمن', 'isFinal': false },
            {'transcript': 'بسم ال الرن الرحيم', 'isFinal': true },
            {'transcript': 'الحب', 'isFinal': false },
            {'transcript': 'الحمد', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد لله', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله رب', 'isFinal': false },
            {'transcript': 'الحمد لله العالمين', 'isFinal': false },
            {'transcript': 'الحمد لله العالمين', 'isFinal': true },
            {'transcript': 'الله', 'isFinal': false },
            {'transcript': 'الرحم', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah recognize test with errors in the beginning', function (done) {
        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 1},
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3}
        ];

        let onAyahFound = (ayahObj) => {
            expect(ayahObj.chapter_id).to.equal(ayahLabels[ayahFoundIndex].surahNum);
            expect(ayahObj.verse_number).to.equal(ayahLabels[ayahFoundIndex].ayahNum);
            ayahFoundIndex += 1;

            if (ayahFoundIndex == ayahLabels.length) {
                transcriber.destructor();
                transcriber = null;
                done();
            }
        }

        let onMatchFound = (ayahObj, wordCount) => {
            // pass
        }
        
        // Set up transcriber
        let transcriber = new Transcriber(onAyahFound, onMatchFound)

        // Set up partial transcripts
        let partialTranscripts = [
            {'transcript': 'م الله', 'isFinal': false },
            {'transcript': 'م الله الرحمن', 'isFinal': false },
            {'transcript': 'م الله الرحمن', 'isFinal': false },
            {'transcript': 'م الله الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'م الله الرحمن الرحيم', 'isFinal': true },
            {'transcript': 'حمد لله', 'isFinal': false },
            {'transcript': 'حمد لله', 'isFinal': false },
            {'transcript': 'حمد لله رب', 'isFinal': false },
            {'transcript': 'حمد لله رب', 'isFinal': false },
            {'transcript': 'حمد لله رب', 'isFinal': false },
            {'transcript': 'حمد لله رب', 'isFinal': false },
            {'transcript': 'لله رب العالمين', 'isFinal': false },
            {'transcript': 'لله رب العالمين', 'isFinal': true },
            {'transcript': 'الله', 'isFinal': false },
            {'transcript': 'الرحم', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': false },
            {'transcript': 'الرحمن الرحيم', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });
}