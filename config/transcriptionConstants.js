// See https://github.com/Tarteel-io/Tarteel-voice/wiki/Follow-Along-Algorithm
export const MIN_PARTIAL_LENGTH = 6;
export const MAX_IQRA_MATCHES = 10;
export const PREFIX_MATCHING_SLACK = 5;
export const QUERY_PREFIX_FRACTION = 0.30;
export const MIN_PARTIAL_LENGTH_FRACTION = 0.05;
export const TRANSCRIPTION_SLACK = 10;

// Minimum similarity ratio between partial and gold before we consider it for follow-along
export const MIN_SIMILARITY_RATIO = 30;

// List of special ayat
// These ayat are either ones that don't appear in the quran e.g.  A’oodhu Billah or
// occur so frequently that we cannot pinpoint which part of the quran is being recited
// precisely. These ayat will be matched by the transcription algorithm, but no events
// will be raised for them.
export const SPECIAL_AYAT = [
    { chapter_id: -1, verse_number: 0, text_simple: 'اعوذ بالله من الشيطان الرجيم' },
    { chapter_id: -1, verse_number: 1, text_simple: 'بسم الله الرحمن الرحيم' }
]