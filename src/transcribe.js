import fetch from 'node-fetch';
import levenshtein from 'levenshtein-edit-distance';
import queue from 'async/queue';

export class Transcriber {
    constructor(onAyahFound, onMatchFound) {
        this.currentAyah = null;
        this.currentSurahNum = null;
        this.currentAyahNum = null;

        this.onAyahFound = onAyahFound;
        this.onMatchFound = onMatchFound;

        this.processingQueue = queue(this.processTranscript, 1);

        this.SLACK = 10;
    }
    
    setCurrentAyah = (ayah) => {
        this.currentAyah = ayah
    };
    
    getCurrentAyah = () => this.currentAyah;

    onTranscript = (transcript, isFinal) => {
        console.log("onTranscript process...")
        this.processingQueue.push({
            'transcript': transcript,
            'isFinal': isFinal
        })
    }

    processTranscript = (task, done) => {
        console.log("Gonna process...")
        if (this.currentAyah === null) {
            this.findAyah(task['transcript'], (result) => {
                if (result['matches'].length >= 1) {
                    let surahNum = result['matches'][0]['surahNum'];
                    let ayahNum = result['matches'][0]['ayahNum'];
                    let ayahText = result['matches'][0]['arabicAyah'];

                    fetch(`https://api-dev.tarteel.io/v1/quran/ayah/?surah=${surahNum}&ayah=${ayahNum}`, {
                        method: 'GET'
                    })
                    .then(res => res.json())
                    .then(json => {
                        console.log(json)
                        let ayahText = json['results'][0]['text_simple'];
                        this.onAyahFound(surahNum, ayahNum, ayahText);

                        this.currentAyah = ayahText;
                        this.currentSurahNum = surahNum;
                        this.currentAyahNum = ayahNum;

                        this.findMatch(task['transcript'], done);
                    })
                } else {
                    // We are not sure about ayah, so just quit
                    done();
                }
            })
        } else {
            this.findMatch(task['transcript'], done);
        }
    }
    
    findMatch = (transcript, done) => {
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
        let matchedWords = this.currentAyah.substring(0, transcript.length + finalSlack).split(' ');
        if (this.currentAyah[transcript.length + finalSlack] === ' ' || (transcript.length + finalSlack + 1) == this.currentAyah.length) {
            this.onMatchFound(this.currentSurahNum, this.currentAyahNum, matchedWords.length);
        } else {
            this.onMatchFound(this.currentSurahNum, this.currentAyahNum, matchedWords.length - 1);
        }

        done();

        // TODO: Check if ayah end
    };
    
    /**
    * Iqra search function
    * In the future, this should be factored out into its own module
    */
    findAyah = (query, callback) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[---] Iqra query is: ${query}`);
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
            callback(json.result)
        })
        .catch(e => {
            // TODO: Probably should propagate to client
            console.log(e);
        });
    };
}
