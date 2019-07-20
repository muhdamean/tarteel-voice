import async from 'async';
import fetch from 'node-fetch';
import levenshtein from 'levenshtein-edit-distance';

import * as api_constants from '../config/apiConstants';
import * as transcription_constants from '../config/transcriptionConstants';

export class Transcriber {
    constructor(onAyahFound, onMatchFound) {
        // Current Ayah trackers
        this.currentSurahNum = null;
        this.currentAyahNum = null;

        // Textual representations of ayah
        // We store next ayah for quick switching
        this.currentAyah = null;
        this.nextAyah = null;

        // Partial transcript so far. We do not rely on isFinal values,
        // since they just indicate silence (which can happen in the middle
        // of an ayah). Instead, we maintain a continuous partial transcript
        // and remove old ayat as we detect them lexically.
        this.partialTranscript = null;
        this.lastFinalizedTranscript = '';
        this.currentPartialAyahIndex = 0;

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
            this.findAyah(this.partialTranscript, (matches) => {
                if (process.env.DEBUG === 'development') {
                    console.log("[Follow along] Current Matches: " + JSON.stringify(matches));
                }

                // If (after filtering) we have exactly one matching ayah, we can be sure
                // about our position
                if (matches.length === 1) {
                    let surahNum = matches[0]['chapter_id'];
                    let ayahNum = matches[0]['verse_number'];

                    // Get the current and the next ayah text so we can begin matching
                    let ayatList = [
                        {'surahNum': surahNum, 'ayahNum': ayahNum},
                        {'surahNum': surahNum, 'ayahNum': ayahNum+1}
                    ];

                    this.getAyat(ayatList, (err, results) => {
                        this.onAyahFound(results[0]);

                        this.currentAyah = results[0];
                        this.nextAyah = results === null ? null : results[1];
                        this.currentSurahNum = surahNum;
                        this.currentAyahNum = ayahNum;

                        this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
                    });
                } else {
                    // We are not sure about ayah, so do nothing
                    done();
                }
            })
        } else {
            // If we know our position in the Quran, we can directly start matching
            this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
        }
    };

    getNextAyah = (task, done) => {
        this.getAyah({'surahNum': task.surahNum, 'ayahNum': task.ayahNum}, (err, result) => {
            this.nextAyah = result === null ? null : result;
            return done();
        });
    };
    
    findMatch = (transcript, done) => {
        if (transcript.length === 0) {
            return done();
        }

        if (process.env.DEBUG === 'development') {
            console.log(`[Follow along] Partial transcript: ${this.partialTranscript}`);
            console.log(`[Follow along] Correct ayah: ${this.currentAyah}`);
        }

        // If we reached the end the previous ayah and have some new characters, we can emit
        // the ayahFound event and get the next ayah text
        if (this.nextAyahStart) {
            if (process.env.DEBUG === 'development') {
                console.log("[Follow along] Beginning new ayah")
            }
            this.nextAyahStart = false;
            this.currentAyahNum = this.currentAyahNum + 1;

            // TODO: raise transcription error if we think we are at the end of a surah
            // TODO: add support for retrying with iqra e.g. when nextAyah == null
            this.currentAyah = this.nextAyah;
            this.nextAyah = null;

            this.processingQueue.push({
                type: 'get-ayah',
                surahNum: this.currentSurahNum,
                ayahNum: this.currentAyahNum + 1,
            }, 1);

            this.onAyahFound(this.currentAyah)
        }

        // Find best position within current ayah
        let minDist = Number.MAX_VALUE;
        let finalSlack = Number.MAX_VALUE;
        for (let i=transcription_constants.TRANSCRIPTION_SLACK; i >= -transcription_constants.TRANSCRIPTION_SLACK; i--) {
            let correctPartial = this.currentAyah.text_simple.substring(0, transcript.length + i);
            let dist = levenshtein(correctPartial, transcript);

            if (dist <= minDist) {
                minDist = dist;
                finalSlack = i;
            }
        }
        // console.log(`Detected follow along: ${this.currentAyah.substring(0, transcript.length + finalSlack)}`);
        let matchedWords = this.currentAyah.text_simple.substring(0, transcript.length + finalSlack).split(' ');
        if ((transcript.length + finalSlack) === this.currentAyah.text_simple.length) {
            // End of ayah - start looking for next ayah
            if (process.env.DEBUG === 'development') {
                console.log("[Follow along] Detected end of ayah")
            }
            this.onMatchFound(this.currentAyah, matchedWords.length);
            this.currentPartialAyahIndex = Math.min(
                this.currentPartialAyahIndex + transcript.length + finalSlack + 1,
                this.partialTranscript.length
            );
            // console.log(this.partialTranscript.length + " " + this.currentPartialAyahIndex);
            this.nextAyahStart = true;
        } else if (this.currentAyah.text_simple[transcript.length + finalSlack] === ' ') {
            this.onMatchFound(this.currentAyah, matchedWords.length);
        } else {
            this.onMatchFound(this.currentAyah, matchedWords.length - 1);
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
                apikey: process.env.IQRA_API_KEY,
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
            if (process.env.DEBUG === 'development') {
                console.log(`[Follow Along] Error:`);
                console.log(err);
            }
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
            if (process.env.DEBUG === 'development') {
                console.log(`[Follow Along] Ayah fetch error:`);
                console.log(ayah);
                console.log(err);
            }
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
                if (process.env.DEBUG === 'development') {
                    console.log(`[Follow Along] Ayah fetch error:`);
                    console.log(ayah);
                    console.log(err);
                }
                return done(err);
            })
        }, (err, results) => {
            if (process.env.DEBUG === 'development' && err) {
                console.log(`[Follow Along] Ayat fetch error:`);
                console.log(err);
            }
            callback(err, results);
        })
    }
}
