import async from 'async';
import fetch from 'node-fetch';
import levenshtein from 'levenshtein-edit-distance';

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

        // Hyper parameters
        this.SLACK = 10;
        this.MAX_IQRA_MATCHES = 10;
    }

    destructor = () => {
        this.processingQueue.kill();
    }
    
    setCurrentAyah = (ayah) => {
        this.currentAyah = ayah
    };
    
    getCurrentAyah = () => this.currentAyah;

    onTranscript = (transcript, isFinal) => {
        this.processingQueue.push({
            'type': 'process-transcript',
            'transcript': transcript,
            'isFinal': isFinal
        }, 2);
    }

    processTask = (task, done) => {
        if (task['type'] === 'process-transcript') {
            this.processTranscript(task, done);
        } else if (task['type'] === 'get-ayah') {
            this.getNextAyah(task, done);
        }
    }

    processTranscript = (task, done) => {
        // console.log("[Queue] Processing next transcript");
        // Update partial transcript
        if (task['isFinal']) {
            this.lastFinalizedTranscript = `${this.lastFinalizedTranscript} ${task['transcript']}`;
            this.partialTranscript = this.lastFinalizedTranscript;
        } else {
            this.partialTranscript = `${this.lastFinalizedTranscript} ${task['transcript']}`;
        }

        // console.log(this.partialTranscript)

        if (this.currentAyah === null) {
            this.findAyah(this.partialTranscript, (matches) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log("[Follow along] Current Matches: " + matches);
                }
                if (matches.length == 1) {
                    let surahNum = matches[0]['surahNum'];
                    let ayahNum = matches[0]['ayahNum'];

                    let ayatList = [
                        {'surahNum': surahNum, 'ayahNum': ayahNum},
                        {'surahNum': surahNum, 'ayahNum': ayahNum+1}
                    ]
                    this.getAyat(ayatList, (err, results) => {
                        let ayahText = results[0].ayahText;
                        this.onAyahFound(surahNum, ayahNum, ayahText);

                        this.currentAyah = ayahText;
                        this.nextAyah = results === null ? null : results[1].ayahText;
                        this.currentSurahNum = surahNum;
                        this.currentAyahNum = ayahNum;

                        this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
                    });
                } else {
                    // We are not sure about ayah, so just quit
                    done();
                }
            })
        } else {
            this.findMatch(this.partialTranscript.substring(this.currentPartialAyahIndex), done);
        }
    }

    getNextAyah = (task, done) => {
        // console.log("[Queue] Getting next ayah");
        this.getAyah({'surahNum': task.surahNum, 'ayahNum': task.ayahNum}, (err, result) => {
            this.nextAyah = result === null ? null : result.ayahText;
            return done();
        });
    }
    
    findMatch = (transcript, done) => {
        if (transcript.length === 0) {
            return done();
        }
        // console.log(`Partial transcript: ${this.partialTranscript}`);
        // console.log(`Correct ayah: ${this.currentAyah}`);
        if (transcript.length > 0 && this.nextAyahStart) {
            if (process.env.NODE_ENV === 'development') {
                console.log("[Follow along] Beginning new ayah")
            }
            this.nextAyahStart = false;
            this.currentAyahNum = this.currentAyahNum + 1;
            // TODO: raise transcription error if we think we are at the end of a surah
            // or retry with iqra i.e. when nextAyah == null
            this.currentAyah = this.nextAyah;
            this.nextAyah = null;

            this.processingQueue.push({
                type: 'get-ayah',
                surahNum: this.currentSurahNum,
                ayahNum: this.currentAyahNum + 1,
            }, 1);

            this.onAyahFound(this.currentSurahNum, this.currentAyahNum, this.currentAyah)
        }
        let minDist = Number.MAX_VALUE;
        let finalSlack = Number.MAX_VALUE;
        for (let i=this.SLACK; i >= -this.SLACK; i--) {
            let correctPartial = this.currentAyah.substring(0, transcript.length + i);
            let dist = levenshtein(correctPartial, transcript);

            if (dist <= minDist) {
                minDist = dist;
                finalSlack = i;
            }
        }
        // console.log(`Detected follow along: ${this.currentAyah.substring(0, transcript.length + finalSlack)}`);
        let matchedWords = this.currentAyah.substring(0, transcript.length + finalSlack).split(' ');
        if ((transcript.length + finalSlack) == this.currentAyah.length) {
            // End of ayah - start looking for next ayah
            if (process.env.NODE_ENV === 'development') {
                console.log("[Follow along] Detected end of ayah")
            }
            this.onMatchFound(this.currentSurahNum, this.currentAyahNum, matchedWords.length);
            this.currentPartialAyahIndex = Math.min(
                this.currentPartialAyahIndex + transcript.length + finalSlack + 1,
                this.partialTranscript.length
            );
            // console.log(this.partialTranscript.length + " " + this.currentPartialAyahIndex);
            this.nextAyahStart = true;
        } else if (this.currentAyah[transcript.length + finalSlack] === ' ') {
            this.onMatchFound(this.currentSurahNum, this.currentAyahNum, matchedWords.length);
        } else {
            this.onMatchFound(this.currentSurahNum, this.currentAyahNum, matchedWords.length - 1);
        }

        return done();
    };
    
    /**
    * Iqra search function
    * In the future, this should be factored out into its own module
    */
    findAyah = (query, callback) => {
        if (process.env.NODE_ENV === 'development') {
            // console.log(`[---] Iqra query is: ${query}`);
        }

        query = query.trim();
        fetch('https://api.iqraapp.com/api/v3.0/search', {
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

            if (currentMatches.length == 0) {
                callback(currentMatches);
            } else if (currentMatches.length > this.MAX_IQRA_MATCHES) {
                callback([]);
            } else {
                this.getAyat(currentMatches, (err, matches) => {
                    let filteredMatches = []
                    for (let idx = 0; idx < matches.length; idx++) {
                        if (query.length > 5 && levenshtein(query, matches[idx].ayahText.substring(0, query.length + 5)) <= Math.floor(5 + 0.50 * query.length) && query.length/matches[idx].ayahText.length > 0.05) {
                            filteredMatches.push(matches[idx]);
                            if (process.env.NODE_ENV === 'development') {
                                console.log(`[Follow along] matching ${query} with ${matches[idx].ayahText} MATCHED`)
                            }
                        } else {
                            if (process.env.NODE_ENV === 'development') {
                                console.log(`[Follow along] matching ${query} with ${matches[idx].ayahText} UNMATCHED`)
                            }
                        }
                    }
                    callback(filteredMatches);
                });
            }
        })
        .catch(e => {
            // TODO: Probably should propagate to client
            // console.log(e);
        });
    };

    /**
     * Quran text retrieval function for a single ayah
     *
     * ayah: object
     *  suranNum: int
     *  ayahNum: int
     *
     * callback: function
     *  signature: (error, results)
     */
    getAyah = (ayah, callback) => {
        // TODO: url should be constant
        fetch(`https://api-dev.tarteel.io/v1/quran/ayah/?surah=${ayah.surahNum}&ayah=${ayah.ayahNum}`, {
            method: 'GET'
        })
        .then(res => res.json())
        .then(json => {
            // Check if we got any results
            // List may be empty when we query for an out of bounds ayah
            if (json['results'].length === 0) {
                return callback(null, null);
            } else {
                let ayahText = json['results'][0]['text_simple'];

                return callback(null, {
                    'surahNum': ayah.surahNum,
                    'ayahNum': ayah.ayahNum,
                    'ayahText': ayahText
                });
            }
        })
        .catch(err => {
            // TODO: Probably should propagate to client
            // console.log("ayah fetch error")
            // console.log(err)
            return callback(err);
        })
    }

    /**
     * Quran text retrieval function for multiple ayat
     */
    getAyat = (ayatList, callback) => {
        async.map(ayatList, (ayah, done) => {
            if (ayah === null) {
                return done(null, null);
            }
            // TODO: url should be constant
            fetch(`https://api-dev.tarteel.io/v1/quran/ayah/?surah=${ayah.surahNum}&ayah=${ayah.ayahNum}`, {
                method: 'GET'
            })
            .then(res => res.json())
            .then(json => {
                // Check if we got any results
                // List may be empty when we query for an out of bounds ayah
                if (json['results'].length === 0) {
                    return done(null, null);
                } else {
                    let ayahText = json['results'][0]['text_simple'];

                    return done(null, {
                        'surahNum': ayah.surahNum,
                        'ayahNum': ayah.ayahNum,
                        'ayahText': ayahText
                    });
                }
            })
            .catch(err => {
                // TODO: Probably should propagate to client
                console.log("ayah fetch error")
                console.log(err)
                return done(err);
            })
        }, (err, results) => {
            // TODO: error check
            callback(err, results);
        })
    }
}
