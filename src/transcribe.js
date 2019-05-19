export class Transcriber {
  constructor(callback) {
    this.currentAyah = null;
    this.transcript = [];
    this.resultsCallback = callback;
  }

  setCurrentAyah = (ayah) => {
    this.currentAyah = ayah
  }

  getCurrentAyah = () => this.currentAyah;

  findDiff = (text) => {
    if (this.transcript) {
      this.transcript = text.split(" ");
    }
    console.log('current ayah: ', this.currentAyah);
    console.log('final string: ', text);
    for (let word in this.transcript) {
      const match = this.checkSequence(word);
      this.resultsCallback({
        match,
        word: this.transcript[word],
        index: Number(word),
      })
    }
  }

  checkSequence = (wordIndex) => {
    console.log('next three: ', this.currentAyah.split(" ").slice(wordIndex, wordIndex + 3));
    return this.transcript[wordIndex] in this.currentAyah.split(" ").slice(wordIndex, wordIndex + 3);
  }
}
