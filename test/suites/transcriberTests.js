import { expect } from 'chai';
import { Transcriber } from '../../src/transcribe';

export default function suite(mochaContext) {
    mochaContext.timeout(30000);

    it('single ayah recognize test', function (done) {
        // Test with Surah #1, Ayah #2

        let onAyahFound = (ayahObj) => {
            expect(ayahObj.chapter_id).to.equal(1);
            expect(ayahObj.verse_number).to.equal(2);

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
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': true }
        ]

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah recognize test with pauses', function (done) {
        // Test with Surah #1, Ayah #2-#5

        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3},
            {surahNum: 1, ayahNum: 4},
            {surahNum: 1, ayahNum: 5}
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
            { 'transcript': 'الحمد', 'isFinal': false },
            { 'transcript': 'الحمل', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': true },
            { 'transcript': 'الرحم', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': true },
            { 'transcript': 'ما', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك يوم', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك يوم', 'isFinal': false },
            { 'transcript': 'مالك يوم الدين', 'isFinal': false },
            { 'transcript': 'مالك يوم الدين', 'isFinal': true },
            { 'transcript': 'يا', 'isFinal': false },
            { 'transcript': 'يا كلب', 'isFinal': false },
            { 'transcript': 'يا قلبي', 'isFinal': false },
            { 'transcript': 'يا كلاب', 'isFinal': false },
            { 'transcript': 'اياك نعبد', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'اياك نعبد', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك نستعين', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك نستعين', 'isFinal': true }
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });

    it('multi ayah recognize test without pauses', function (done) {
        // Test with Surah #1, Ayah #2-#5

        let ayahFoundIndex = 0;
        let ayahLabels = [
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3},
            {surahNum: 1, ayahNum: 4},
            {surahNum: 1, ayahNum: 5}
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
            { 'transcript': 'الحمد', 'isFinal': false },
            { 'transcript': 'الحمل', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم ما', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا كلب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا قلبي', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا كلاب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك نستعين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك نستعين', 'isFinal': true }
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
            expect(ayahObj.chapter_id).to.equal(1);
            expect(ayahObj.verse_number).to.equal(2);
            numWords = ayahObj.text_simple.trim().split(' ').length;
        }

        let onMatchFound = (ayahObj, wordCount) => {
            expect(ayahObj.chapter_id).to.equal(1);
            expect(ayahObj.verse_number).to.equal(2);
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
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': true }
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
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3},
            {surahNum: 1, ayahNum: 4},
            {surahNum: 1, ayahNum: 5}
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
            { 'transcript': 'الحمد', 'isFinal': false },
            { 'transcript': 'الحمل', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': true },
            { 'transcript': 'الرحم', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': true },
            { 'transcript': 'ما', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك يوم', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك يوم', 'isFinal': false },
            { 'transcript': 'مالك يوم الدين', 'isFinal': false },
            { 'transcript': 'مالك يوم الدين', 'isFinal': true },
            { 'transcript': 'يا', 'isFinal': false },
            { 'transcript': 'يا كلب', 'isFinal': false },
            { 'transcript': 'يا قلبي', 'isFinal': false },
            { 'transcript': 'يا كلاب', 'isFinal': false },
            { 'transcript': 'اياك نعبد', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'اياك نعبد', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك نستعين', 'isFinal': false },
            { 'transcript': 'اياك نعبد واياك نستعين', 'isFinal': true }
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
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3},
            {surahNum: 1, ayahNum: 4},
            {surahNum: 1, ayahNum: 5}
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
            { 'transcript': 'الحمد', 'isFinal': false },
            { 'transcript': 'الحمل', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم ما', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا كلب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا قلبي', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين يا كلاب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك نستعين', 'isFinal': false },
            { 'transcript': 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين اياك نعبد واياك نستعين', 'isFinal': true }
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
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3},
            {surahNum: 1, ayahNum: 4}
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
            { 'transcript': 'الحب', 'isFinal': false },
            { 'transcript': 'الحمد', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله رب', 'isFinal': false },
            { 'transcript': 'الحمد لله العالمين', 'isFinal': false },
            { 'transcript': 'الحمد لله العالمين', 'isFinal': true },
            { 'transcript': 'الله', 'isFinal': false },
            { 'transcript': 'الرحم', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': true },
            { 'transcript': 'ما', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك يم', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك', 'isFinal': false },
            { 'transcript': 'مالك يم', 'isFinal': false },
            { 'transcript': 'مالك يم لدين', 'isFinal': false },
            { 'transcript': 'مالك يم لدين', 'isFinal': true },
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
            {surahNum: 1, ayahNum: 2},
            {surahNum: 1, ayahNum: 3},
            {surahNum: 1, ayahNum: 4}
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
            { 'transcript': 'حمد لله', 'isFinal': false },
            { 'transcript': 'حمد لله', 'isFinal': false },
            { 'transcript': 'حمد لله رب', 'isFinal': false },
            { 'transcript': 'حمد لله رب', 'isFinal': false },
            { 'transcript': 'حمد لله رب', 'isFinal': false },
            { 'transcript': 'حمد لله رب', 'isFinal': false },
            { 'transcript': 'لله رب العالمين', 'isFinal': false },
            { 'transcript': 'لله رب العالمين', 'isFinal': true },
            { 'transcript': 'الله', 'isFinal': false },
            { 'transcript': 'الرحم', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': false },
            { 'transcript': 'الرحمن الرحيم', 'isFinal': true },
            { 'transcript': 'ا', 'isFinal': false },
            { 'transcript': 'اك', 'isFinal': false },
            { 'transcript': 'اك يوم', 'isFinal': false },
            { 'transcript': 'اك', 'isFinal': false },
            { 'transcript': 'اك', 'isFinal': false },
            { 'transcript': 'اك يوم', 'isFinal': false },
            { 'transcript': 'اك يوم الدين', 'isFinal': false },
            { 'transcript': 'اك يوم الدين', 'isFinal': true },
        ];

        for (let partialIndex in partialTranscripts) {
            transcriber.onTranscript(
                partialTranscripts[partialIndex]['transcript'],
                partialTranscripts[partialIndex]['isFinal']
            )
        }
    });
}