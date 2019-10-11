import async from 'async';
import fetch from 'node-fetch';
import levenshtein from 'levenshtein-edit-distance';
import fuzzball from 'fuzzball';

import * as api_constants from '../config/apiConstants';
import * as transcription_constants from '../config/transcriptionConstants';

/**
 * Function that checks if the ayah that is passed is a special ayah.
 * All special ayat (found in config/transcriptionConstants) have their
 * chapter_id as -1.
 *
 * @param {ayahShape} Object containing all of the ayah details
 *
 * @returns {bool} true if the ayah is special, false otherwise
 */
function isSpecialAyah(ayahShape) {
    return ayahShape.chapter_id === -1;
}

export class Transcriber {
    constructor(onAyahFound, onMatchFound) {
        // Object representations of ayat containing
        //  - chapter_id: Surah number
        //  - verse_number: Ayah number
        //  - text_simple: Ayah text
        //  - a bunch of other information required by the frontend
        // We store next ayah for quick switching
        this.currentAyah = null;
        this.nextAyah = null;

        // Partial transcript so far. We do not rely on isFinal values,
        // since they just indicate silence (which can happen in the middle
        // of an ayah). Instead, we maintain a continuous partial transcript
        // and remove old ayat as we detect them lexically.
        this.partialTranscript = null;

        // Pointer to character until which matching has been done. All follow-along
        // matching will be done from this index onwards
        this.currentPartialAyahIndex = 0;

        // Partial prefix that we may have accidently matched with the previous
        // ayah. Since we perform across-ayat matching, we may run into the following
        // behavior:
        //     partial: ayah1_word1 ayah1_word2             ayah2_word1 ayah2_word2 ...
        //     gold   : ayah1_word1 ayah1_word2 ayah1_word3 ayah2_word1 ayah2_word2 ...
        //   where `gold` refers to the ground truth against which we are currently matching
        //   (text from the Quran)
        // In this case, we would match all the way until `ayah2_word1`, and the
        // currentPartialAyahIndex would point to `ayah2_word2`. We store the already
        // matched part of the next ayah (`ayah2_word1` in this case), so we can
        // use it to properly match the next ayah partials
        this.partialPrefix = '';

        // Since the transcript can change as long as it partial, we maintain
        // the finalized part of the transcript so far separately. At any
        // given time, the full transcript would then be:
        //    lastFinalizedTranscript + currentPartialTranscript
        this.lastFinalizedTranscript = '';

        // Callbacks
        this.onAyahFound = onAyahFound;
        this.onMatchFound = onMatchFound;

        // Processing queue to avoid race conditions, as we rely on
        // several external resources (iqra api, tarteel quran text api)
        this.processingQueue = async.priorityQueue(this.processTask, 1);
    }

    destructor = () => {
        this.processingQueue.kill();
    };

    onTranscript = (transcript, isFinal) => {
        // Add transcript to processing queue with low priority
        this.processingQueue.push({
            'type': 'process-transcript',
            'transcript': transcript,
            'isFinal': isFinal
        }, 2);
    };

    processTask = (task, done) => {
        if (task['type'] === 'process-transcript') {
            this.processTranscript(task, done);
        } else if (task['type'] === 'get-ayah') {
            this.getNextAyah(task, done);
        }
    };

    processTranscript = (task, done) => {
        // Update partial transcript
        if (task['isFinal']) {
            this.lastFinalizedTranscript = `${this.lastFinalizedTranscript} ${task['transcript']}`;
            this.partialTranscript = this.lastFinalizedTranscript;
        } else {
            this.partialTranscript = `${this.lastFinalizedTranscript} ${task['transcript']}`;
        }

        // Check if we know which ayah in the Quran is being recited
        if (this.currentAyah === null) {
            this.findAyah(this.partialTranscript.substring(this.currentPartialAyahIndex), (matches) => {
                if (process.env.DEBUG === 'development') {
                    console.log("[Follow along] Current Matches: " + JSON.stringify(
                        matches.map(ayahShape => { return {
                            chapter_id: ayahShape.chapter_id,
                            verse_number: ayahShape.verse_number,
                            text_simple: ayahShape.text_simple
                        }}))
                    );
                }

                // If (after filtering) we have exactly one matching ayah, we can be sure
                // about our position
                if (matches.length === 1) {
                    let surahNum = matches[0]['chapter_id'];
                    let ayahNum = matches[0]['verse_number'];

                    // Check for special ayat
                    if (isSpecialAyah(matches[0])) {
                        // Detected ayah is a special ayah, so just perform follow along until we
                        // reach the end of it. We do not have a next ayah because we do not know what
                        // surah we are in.
                        // Note: No ayahFound/matchFound events are currently fired for special ayat
                        if (process.env.DEBUG === 'development') {
                            console.log(`[Follow along] Special Ayah Detected: ${matches[0].text_simple}`);
                        }
                        this.currentAyah = matches[0];
                        this.nextAyah = null;
                        this.currentSurahNum = surahNum;
                        this.currentAyahNum = ayahNum;

                        this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
                    } else {
                        // Detected ayah is not a special ayah, so fetch current and next
                        // Ayah objects, and start follow along on current ayah
                        if (process.env.DEBUG === 'development') {
                            console.log(`[Follow along] Ayah Detected: Surah #${surahNum} Ayah #${ayahNum}`);
                        }
                        let ayatList = [
                            {'surahNum': surahNum, 'ayahNum': ayahNum},
                            {'surahNum': surahNum, 'ayahNum': ayahNum+1}
                        ]

                        this.getAyat(ayatList, (err, results) => {
                            let ayahShape = results[0];
                            this.onAyahFound(ayahShape);

                            this.currentAyah = ayahShape;
                            this.nextAyah = results[1] && results[1].chapter_id ? results[1] : null;
                            this.currentSurahNum = surahNum;
                            this.currentAyahNum = ayahNum;

                            this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
                        });
                    }
                } else {
                    // We are not sure about ayah, so do nothing
                    done();
                }
            })
        } else {
            // If we know our position in the Quran, we can directly start matching
            // Match from the currentPartialAyahIndex onwards part of partialTranscript
            this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
        }
    };

    getNextAyah = (task, done) => {
        if (process.env.DEBUG === 'development') {
            console.log(`----------------------------------------------------------`);
            console.log(`[Next Ayah] Downloading ${task.surahNum}-${task.ayahNum}`)
        }
        this.getAyah({'surahNum': task.surahNum, 'ayahNum': task.ayahNum}, (err, result) => {
            this.nextAyah = result.chapter_id ? result : null;
            return done();
        });
    };
    
    findMatch = (transcript, done) => {
        // Current partialTranscript is prepended with the stored partialPrefix that we may
        // have accidently matched earlier because of the mechanics of across-ayat matching
        transcript = this.partialPrefix + transcript;

        // Trim whitespaces to avoid spurious matches and have better tie-breakers
        transcript = transcript.trim();

        // If the transcript is empty, do nothing
        if (transcript.length === 0) {
            return done();
        }

        if (process.env.DEBUG === 'development') {
            console.log(`----------------------------------------------------------`);
            console.log(`[Follow along] Partial transcript: ${this.partialTranscript}`);
            console.log(`[Follow along] Partial transcript in consideration: ${transcript}`);
            console.log(`[Follow along] Correct ayah: ${this.currentAyah.text_simple}`);
            console.log(`[Follow along] Gold transcript in consideration: ${this.currentAyah.text_simple} ${this.nextAyah ? this.nextAyah.text_simple : ""}`);
        }

        // If we reached the end the previous ayah and have some new characters, we can emit
        // the ayahFound event and get the next ayah text
        if (this.nextAyahStart) {
            if (process.env.DEBUG === 'development') {
                console.log(`[Follow along] Beginning new ayah: Surah #${this.currentAyah.chapter_id} Ayah #${this.currentAyah.verse_number}`)
            }
            this.nextAyahStart = false;

            this.onAyahFound(this.currentAyah)
        }

        // Find best position within current ayah and next ayah (across-ayat matching)
        let gold_transcript = this.currentAyah.text_simple +
                            (this.nextAyah ? " " + this.nextAyah.text_simple : "");

        let maxRatio = Number.MIN_VALUE;
        let finalSlack = Number.MIN_VALUE;

        for (let i=transcription_constants.TRANSCRIPTION_SLACK; i >= -transcription_constants.TRANSCRIPTION_SLACK; i--) {
            let correctPartial = gold_transcript.substring(0, transcript.length + i).trim();
            let ratio = fuzzball.ratio(correctPartial, transcript);

            if (ratio > transcription_constants.MIN_SIMILARITY_RATIO && ratio > maxRatio) {
                maxRatio = ratio;
                finalSlack = i;
            }
        }

        if (process.env.DEBUG === 'development') {
            console.log(`[Follow along] Detected follow along: ${gold_transcript.substring(0, transcript.length + finalSlack)}`);
        }
        let matchedWords = gold_transcript.substring(0, transcript.length + finalSlack).trim().split(' ');
        let currentAyahWords = this.currentAyah.text_simple.trim().split(' ');

        // Check if we have reached the end of ayah
        if ((transcript.length + finalSlack) >= this.currentAyah.text_simple.length) {
            // End of ayah - start looking for next ayah
            if (process.env.DEBUG === 'development') {
                console.log("[Follow along] Detected end of ayah");
                console.log(`[Follow along] ${this.nextAyah?"Next ayah available":"NEXT AYAH NOT AVAILABLE"}`);
            }

            // Send onMatch events for all ayat except special ayat
            if (!isSpecialAyah(this.currentAyah)) {
                if (process.env.DEBUG === 'development') {
                    console.log(`[Follow along] Match found: ${currentAyahWords.length}`);
                }
                this.onMatchFound(this.currentAyah, currentAyahWords.length);
            }

            // Any words that we matched from the next ayah should be prefixed to future
            // partials for proper matching
            this.partialPrefix = matchedWords.slice(currentAyahWords.length).join(' ');
            if (process.env.DEBUG === 'development') {
                console.log(`[Follow along] Next partial prefix: ${this.partialPrefix}`);
            }

            this.currentPartialAyahIndex = Math.min(
                this.currentPartialAyahIndex + transcript.length + finalSlack + 1,
                this.partialTranscript.length
            );

            // Signal start of next ayah in the next tick if we are in the middle of a surah
            // or IQRA search if we do not have a nextAyah
            if (this.nextAyah === null) {
                this.currentAyah = null;
            } else {
                this.nextAyahStart = true;

                // TODO: add support for retrying with iqra e.g. when nextAyah == null
                this.currentAyah = this.nextAyah;
                this.nextAyah = null;

                if (this.currentAyah) {
                    this.processingQueue.push({
                        type: 'get-ayah',
                        surahNum: this.currentAyah.chapter_id,
                        ayahNum: this.currentAyah.verse_number + 1,
                    }, 1);
                }
            }
        } else if (this.currentAyah.text_simple[transcript.length + finalSlack] === ' ') {
            // Match occurred at word boundary
            if (!isSpecialAyah(this.currentAyah)) {
                if (process.env.DEBUG === 'development') {
                    console.log(`[Follow along] Match found: ${matchedWords.length}`);
                }
                this.onMatchFound(this.currentAyah, matchedWords.length);
            }
        } else {
            // Match occurred in the middle of a word, do not count this
            // word as a matched word
            if (!isSpecialAyah(this.currentAyah)) {
                if (process.env.DEBUG === 'development') {
                    console.log(`[Follow along] Match found: ${matchedWords.length}`);
                }
                this.onMatchFound(this.currentAyah, matchedWords.length - 1);
            }
        }

        return done();
    };
    
    /**
    * Iqra search function
    * In the future, this should be factored out into its own module
    */
    findAyah = (query, callback) => {
        if (process.env.DEBUG === 'development') {
            console.log(`[Follow Along] Iqra query is: ${query}`);
        }

        query = query.trim();
        if (query.length <= transcription_constants.MIN_PARTIAL_LENGTH) {
            return callback([]);
        }
        fetch(api_constants.IQRA_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                arabicText: query,
                translation: 'en-hilali',
                limit: transcription_constants.MAX_IQRA_MATCHES + 1
            }),
        })
        .then(res => res.json())
        .then(json => {
            let currentMatches = json.result.matches.map((e) => {return {'surahNum': e.surahNum, 'ayahNum': e.ayahNum}});

            if (currentMatches.length === 0) {
                return callback(currentMatches);
            } else if (currentMatches.length > transcription_constants.MAX_IQRA_MATCHES) {
                return callback([]);
            } else {
                this.getAyat(currentMatches, (err, matches) => {
                    // Preprocess matches to add special ayat
                    // We also remove Surah #1 Ayah #1 match, because Bismillah is a special ayah aleady
                    matches = matches.concat(transcription_constants.SPECIAL_AYAT);
                    matches = matches.filter(ayahShape => !(ayahShape.chapter_id === 1 && ayahShape.verse_number === 1));

                    // Filter matches using approximate prefix-matching
                    // See https://github.com/Tarteel-io/Tarteel-voice/wiki/Follow-Along-Algorithm
                    let filteredMatches = [];
                    let max_edit_distance = Math.floor(transcription_constants.PREFIX_MATCHING_SLACK + transcription_constants.QUERY_PREFIX_FRACTION * query.length);
                    for (let idx = 0; idx < matches.length; idx++) {
                        let current_edit_distance = levenshtein(query, matches[idx].text_simple.substring(0, query.length + transcription_constants.PREFIX_MATCHING_SLACK));
                        if (current_edit_distance <= max_edit_distance && query.length/matches[idx].text_simple.length > transcription_constants.MIN_PARTIAL_LENGTH_FRACTION) {
                            filteredMatches.push(matches[idx]);
                            if (process.env.DEBUG === 'development') {
                                console.log(`[Follow along] matching ${query} with ${matches[idx].text_simple} MATCHED`);
                            }
                        } else {
                            if (process.env.DEBUG === 'development') {
                                console.log(`[Follow along] matching ${query} with ${matches[idx].text_simple} UNMATCHED`);
                            }
                        }
                    }
                    return callback(filteredMatches);
                });
            }
        })
        .catch(err => {
            console.log(`[Follow Along] Error:`);
            console.log(err);

            return callback([]);
        });
    };

    /**
     * Quran text retrieval function for a single ayah
     *
     *  ayah: object
     *  suranNum: int
     *  ayahNum: int
     *
     *  callback: function
     *  signature: (error, results: object)
     */
    getAyah = (ayah, callback) => {
        fetch(`${api_constants.TARTEEL_API}/quran/${ayah.surahNum}/${ayah.ayahNum}/`, {
            method: 'GET'
        })
        .then(res => res.json())
        .then(json => {return callback(null, json);})
        .catch(err => {
            console.log(`[Follow Along] Single ayah fetch exception:`);
            console.log(ayah);
            console.log(err);
            return callback(err);
        })
    };

    /**
     * Quran text retrieval function for multiple ayat
     */
    getAyat = (ayatList, callback) => {
        async.map(ayatList, (ayah, done) => {
            if (ayah === null) {
                return done(null, null);
            }
            fetch(`${api_constants.TARTEEL_API}/quran/${ayah.surahNum}/${ayah.ayahNum}/`, {
                method: 'GET'
            })
            .then(res => res.json())
            .then(json => {return done(null, json);})
            .catch(err => {
                console.log(`[Follow Along] Multi ayah fetch exception:`);
                console.log(ayah);
                console.log(err);
                return done(err);
            })
        }, (err, results) => {
            if (err) {
                console.log(`[Follow Along] Ayat fetch error:`);
                console.log(err);
            }
            callback(err, results);
        })
    }
}
