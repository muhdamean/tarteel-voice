// See https://github.com/Tarteel-io/Tarteel-voice/wiki/Follow-Along-Algorithm
export const MIN_PARTIAL_LENGTH = 6;
export const MAX_IQRA_MATCHES = 10;
export const PREFIX_MATCHING_SLACK = 5;
export const QUERY_PREFIX_FRACTION = 0.30;
export const MIN_PARTIAL_LENGTH_FRACTION = 0.05;
export const TRANSCRIPTION_SLACK = 10;
export const MIN_RATIO = 30;
export const SPECIAL_AYAT = [
    { chapter_id: -1, verse_number: 0, text_simple: 'اعوذ بالله من الشيطان الرجيم' },
    { chapter_id: -1, verse_number: 1, text_simple: 'بسم الله الرحمن الرحيم' }
]