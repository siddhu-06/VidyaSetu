// lib/intelligence/gapDetector.ts
import type {
  GapDetectionResult,
  GapKeywordMatch,
  GapProfile,
  GradeBand,
  RiskLevel,
  SkillDomain,
  SkillRating,
  Subject,
} from '@/types';

export const NCERT_KEYWORD_MAP: Record<Subject, string[]> = {
  math: [
    'count', 'counting', 'number', 'numbers', 'digit', 'digits', 'zero',
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
    'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'hundred',
    'place value', 'ones', 'tens', 'hundreds', 'thousands', 'odd', 'even',
    'addition', 'add', 'adding', 'sum', 'total', 'plus',
    'subtraction', 'subtract', 'subtracting', 'difference', 'minus', 'take away',
    'carrying', 'carry', 'regroup', 'regrouping', 'borrow', 'borrowing',
    'multiplication', 'multiply', 'multiplying', 'times', 'product',
    'multiplication table', 'tables', 'times table', '2 times', '3 times',
    'division', 'divide', 'dividing', 'quotient', 'remainder', 'share equally',
    'fraction', 'fractions', 'half', 'quarter', 'third', 'numerator', 'denominator',
    'whole', 'part', 'equal parts', 'pizza', 'share',
    'measurement', 'measure', 'length', 'weight', 'capacity', 'meter', 'centimeter',
    'kilogram', 'gram', 'litre', 'millilitre', 'ruler', 'scale',
    'geometry', 'shape', 'shapes', 'circle', 'square', 'rectangle', 'triangle',
    'pentagon', 'hexagon', 'sides', 'corners', 'angle', 'right angle',
    'perimeter', 'area', 'symmetry', 'line of symmetry',
    'decimal', 'decimals', 'decimal point', 'tenths', 'hundredths',
    'percentage', 'percent', 'ratio', 'proportion', 'rate',
    'average', 'mean', 'data', 'graph', 'bar graph', 'pie chart', 'tally',
    'pattern', 'sequence', 'series', 'prime', 'prime number', 'composite',
    'factor', 'factors', 'multiple', 'multiples', 'lcm', 'hcf',
    'profit', 'loss', 'simple interest', 'unitary method',
  ],
  reading: [
    'letter', 'letters', 'alphabet', 'vowel', 'vowels', 'consonant', 'consonants',
    'sound', 'sounds', 'phonics', 'blend', 'blends', 'digraph',
    'syllable', 'syllables', 'word', 'words', 'spell', 'spelling',
    'read', 'reading', 'read aloud', 'reading aloud', 'fluency', 'fluent',
    'sounding out', 'decode', 'decoding', 'sight word', 'sight words',
    'speed', 'pace', 'accuracy', 'expression', 'punctuation while reading',
    'vocabulary', 'meaning', 'meanings', 'definition', 'word meaning',
    'synonym', 'antonym', 'opposite', 'similar', 'context clue',
    'new word', 'difficult word', 'unknown word',
    'sentence', 'sentences', 'paragraph', 'paragraphs', 'passage',
    'story', 'poem', 'article', 'text', 'book', 'chapter',
    'Hindi', 'Telugu', 'Urdu', 'Marathi', 'regional language',
    'nothing', 'letter level', 'word level', 'sentence level', 'story level',
    'beginner', 'basic', 'grade level',
  ],
  science: [
    'plant', 'plants', 'animal', 'animals', 'living', 'non-living',
    'seed', 'seeds', 'germination', 'germinate', 'root', 'roots', 'stem',
    'leaf', 'leaves', 'flower', 'fruit', 'photosynthesis', 'sunlight',
    'food', 'nutrition', 'herbivore', 'carnivore', 'omnivore',
    'habitat', 'forest', 'desert', 'pond', 'ocean', 'ecosystem',
    'water', 'water cycle', 'evaporation', 'condensation', 'rain', 'cloud',
    'air', 'wind', 'oxygen', 'carbon dioxide', 'atmosphere',
    'soil', 'types of soil', 'erosion', 'weather', 'climate', 'season',
    'earth', 'sun', 'moon', 'stars', 'planet', 'solar system',
    'solid', 'liquid', 'gas', 'state', 'change of state', 'melting', 'boiling',
    'force', 'motion', 'push', 'pull', 'gravity', 'friction', 'speed',
    'light', 'shadow', 'reflection', 'mirror', 'transparent', 'opaque',
    'sound', 'vibration', 'echo', 'loud', 'soft', 'pitch',
    'heat', 'temperature', 'thermometer', 'conductor', 'insulator',
    'electricity', 'electric circuit', 'bulb', 'battery', 'switch',
    'magnet', 'magnetic', 'poles', 'attract', 'repel',
    'body', 'body parts', 'organ', 'organs', 'heart', 'lungs', 'brain',
    'bones', 'muscles', 'sense', 'senses', 'eye', 'ear', 'nose', 'tongue', 'skin',
    'health', 'hygiene', 'disease', 'nutrition', 'balanced diet',
  ],
  english: [
    'grammar', 'noun', 'nouns', 'verb', 'verbs', 'adjective', 'adjectives',
    'adverb', 'adverbs', 'pronoun', 'pronouns', 'preposition', 'prepositions',
    'conjunction', 'conjunctions', 'article', 'articles', 'the', 'a', 'an',
    'tense', 'tenses', 'past tense', 'present tense', 'future tense',
    'simple past', 'past continuous', 'present continuous', 'perfect',
    'was', 'were', 'is', 'are', 'am', 'will', 'would', 'had', 'have', 'has',
    'sentence', 'subject', 'predicate', 'object', 'phrase', 'clause',
    'simple sentence', 'compound sentence', 'question', 'statement', 'exclamation',
    'punctuation', 'full stop', 'period', 'comma', 'question mark',
    'exclamation mark', 'apostrophe', 'capital letter', 'uppercase',
    'write', 'writing', 'essay', 'paragraph writing', 'letter writing',
    'comprehension', 'read', 'understand', 'answer', 'question',
    'describe', 'describe in English', 'speak', 'speaking', 'conversation',
    'english word', 'meaning', 'translation', 'dictionary', 'spelling',
    'synonym', 'antonym', 'opposite word', 'rhyme', 'rhyming words',
  ],
  comprehension: [
    'main idea', 'main topic', 'central idea', 'key idea', 'theme',
    'inference', 'infer', 'guess', 'predict', 'prediction', 'what will happen',
    'summary', 'summarise', 'summarize', 'retell', 'retelling', 'in your own words',
    'sequence', 'order', 'first', 'then', 'next', 'finally', 'beginning', 'end',
    'cause', 'effect', 'reason', 'because', 'result', 'so',
    'compare', 'contrast', 'difference', 'similar', 'same', 'both',
    'character', 'characters', 'who', 'setting', 'where', 'when', 'plot',
    'problem', 'solution', 'conflict', 'resolve',
    'fact', 'opinion', 'evidence', 'support', 'detail',
    'author', 'purpose', 'why did the author', 'message', 'lesson',
    'title', 'heading', 'subheading', 'caption', 'diagram', 'illustration',
    'answer in one sentence', 'answer in two sentences', 'write in brief',
    'true or false', 'fill in the blank', 'match the column',
    'passage', 'unseen passage', 'read the passage', 'after reading',
  ],
};

export const KEYWORD_TO_STANDARD: Record<string, string> = {
  carrying: 'Maths-2.3',
  regroup: 'Maths-2.3',
  regrouping: 'Maths-2.3',
  borrow: 'Maths-2.3',
  borrowing: 'Maths-2.3',
  'multiplication table': 'Maths-3.1',
  tables: 'Maths-3.1',
  fraction: 'Maths-4.2',
  fractions: 'Maths-4.2',
  half: 'Maths-4.2',
  quarter: 'Maths-4.2',
  'place value': 'Maths-2.1',
  vowel: 'Hindi-L1.1',
  consonant: 'Hindi-L1.1',
  'read aloud': 'Hindi-L1.2',
  'reading aloud': 'Hindi-L1.2',
  comprehension: 'Hindi-L2.4',
  summary: 'Hindi-L2.4',
  inference: 'Hindi-L2.5',
  decimal: 'Maths-5.1',
  percentage: 'Maths-5.2',
  photosynthesis: 'Sci-4.1',
  'water cycle': 'Sci-3.2',
  noun: 'Eng-L2.1',
  verb: 'Eng-L2.1',
  adjective: 'Eng-L2.2',
  'past tense': 'Eng-L3.1',
  'present tense': 'Eng-L3.1',
  'main idea': 'Comp-L2.1',
  cause: 'Comp-L3.1',
  effect: 'Comp-L3.1',
};

const RATING_DELTAS: Record<SkillRating, number> = {
  improving: -0.3,
  steady: 0.1,
  not_covered: 0,
};

const SUBJECT_TO_DOMAIN: Record<Subject, SkillDomain> = {
  math: 'arithmetic',
  reading: 'reading',
  science: 'confidence',
  english: 'writing',
  comprehension: 'comprehension',
};

const SUBJECT_TO_STAGE: Record<Subject, GradeBand> = {
  math: 'grade_3_5',
  reading: 'grade_1_2',
  science: 'grade_3_5',
  english: 'grade_3_5',
  comprehension: 'grade_3_5',
};

const SUBJECT_TO_SEVERITY: Record<Subject, RiskLevel> = {
  math: 'high',
  reading: 'moderate',
  science: 'moderate',
  english: 'moderate',
  comprehension: 'moderate',
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getSubjectForKeyword(keyword: string): Subject | null {
  for (const subject of Object.keys(NCERT_KEYWORD_MAP) as Subject[]) {
    if (NCERT_KEYWORD_MAP[subject].includes(keyword)) {
      return subject;
    }
  }

  return null;
}

export function detectGapsFromNote(
  note: string,
  skillRatings: Partial<Record<Subject, SkillRating>>,
): {
  detectedSubjects: Subject[];
  matchedKeywords: string[];
  standardCodes: string[];
  gapDeltas: Partial<Record<Subject, number>>;
} {
  const lowerNote = note.toLowerCase();
  const detectedSubjects = new Set<Subject>();
  const matchedKeywords: string[] = [];
  const standardCodes: string[] = [];
  const gapDeltas: Partial<Record<Subject, number>> = {};
  const keywordHitsBySubject: Record<Subject, number> = {
    math: 0,
    reading: 0,
    science: 0,
    english: 0,
    comprehension: 0,
  };

  for (const [subject, keywords] of Object.entries(NCERT_KEYWORD_MAP) as [Subject, string[]][]) {
    for (const keyword of keywords) {
      if (lowerNote.includes(keyword)) {
        detectedSubjects.add(subject);
        matchedKeywords.push(keyword);
        keywordHitsBySubject[subject] += 1;

        if (KEYWORD_TO_STANDARD[keyword]) {
          standardCodes.push(KEYWORD_TO_STANDARD[keyword]);
        }
      }
    }
  }

  const KEYWORD_BONUS = -0.1;

  for (const [subject, rating] of Object.entries(skillRatings) as [Subject, SkillRating | undefined][]) {
    if (!rating) {
      continue;
    }

    const baseDelta = RATING_DELTAS[rating];
    const keywordBonus = Math.max(keywordHitsBySubject[subject] * KEYWORD_BONUS, -0.5);
    gapDeltas[subject] = baseDelta + (detectedSubjects.has(subject) ? keywordBonus : 0);
  }

  return {
    detectedSubjects: Array.from(detectedSubjects),
    matchedKeywords: uniqueStrings(matchedKeywords),
    standardCodes: uniqueStrings(standardCodes),
    gapDeltas,
  };
}

export function applyGapDeltas(
  current: GapProfile,
  deltas: Partial<Record<Subject, number>>,
): GapProfile {
  return {
    math: Math.max(0, Math.min(5, current.math + (deltas.math ?? 0))),
    reading: Math.max(0, Math.min(5, current.reading + (deltas.reading ?? 0))),
    science: Math.max(0, Math.min(5, current.science + (deltas.science ?? 0))),
    english: Math.max(0, Math.min(5, current.english + (deltas.english ?? 0))),
    comprehension: Math.max(0, Math.min(5, current.comprehension + (deltas.comprehension ?? 0))),
  };
}

export function detectLearningGaps(note: string): GapDetectionResult {
  const detection = detectGapsFromNote(note, {});
  const matches: GapKeywordMatch[] = detection.matchedKeywords.map((keyword) => {
    const subject = getSubjectForKeyword(keyword) ?? 'reading';

    return {
      keyword,
      domain: SUBJECT_TO_DOMAIN[subject],
      concept: KEYWORD_TO_STANDARD[keyword] ?? keyword,
      stage: SUBJECT_TO_STAGE[subject],
      severity: SUBJECT_TO_SEVERITY[subject],
    };
  });

  const uniqueGaps = uniqueStrings(
    matches.map((match) => `${match.domain}: ${match.concept}`),
  );
  const confidence =
    detection.matchedKeywords.length === 0
      ? 0.12
      : Math.min(0.95, 0.18 + detection.matchedKeywords.length * 0.04);

  return {
    gaps: uniqueGaps,
    matches,
    summary:
      matches.length === 0
        ? 'No explicit gap keywords detected. Use mentor ratings to confirm learning needs.'
        : `Detected ${matches.length} likely learning gaps from the session note.`,
    confidence,
  };
}
