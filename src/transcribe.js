let currentAyah;
let transcript = [];

export const setCurrentAyah = (ayah) => {
  currentAyah = ayah
}

export const getCurrentAyah = () => currentAyah;

export const findDiff = (socket, text) => {
  if (transcript) {
    transcript = text.split(" ");
  }
  console.log('current ayah: ', currentAyah);
  console.log('final string: ', text);
  for (let word in transcript) {
    const match = checkSequence(word);
    socket.emit('handleMatchingResult', {
      match,
      word: transcript[word],
      index: Number(word),
    });
  }
}

const checkSequence = (wordIndex) => {
  console.log('next three: ', currentAyah.split(" ").slice(wordIndex, wordIndex + 3));
  return transcript[wordIndex] in currentAyah.split(" ").slice(wordIndex, wordIndex + 3);
}
