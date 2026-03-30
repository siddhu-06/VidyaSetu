import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type SkillDomain = 'reading' | 'comprehension' | 'writing' | 'arithmetic' | 'confidence';
type GradeBand = 'foundation' | 'grade_1_2' | 'grade_3_5' | 'grade_6_plus';
type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

interface GapKeywordEntry {
  keyword: string;
  domain: SkillDomain;
  concept: string;
  stage: GradeBand;
  severity: RiskLevel;
}

function createEntries(
  keywords: string[],
  domain: SkillDomain,
  concept: string,
  stage: GradeBand,
  severity: RiskLevel,
): GapKeywordEntry[] {
  return keywords.map((keyword) => ({ keyword, domain, concept, stage, severity }));
}

const gapKeywordMap: GapKeywordEntry[] = [
  ...createEntries(['alphabet', 'letter', 'letters', 'uppercase', 'lowercase', 'vowel', 'consonant', 'akshara', 'syllable', 'matra', 'phoneme', 'sound-symbol', 'recognition', 'naming', 'sequence', 'order', 'tracing', 'visual-match', 'picture-letter', 'letter-confusion'], 'reading', 'letter recognition', 'foundation', 'high'),
  ...createEntries(['rhyme', 'rhyming', 'alliteration', 'blending', 'segmenting', 'onset', 'rime', 'clap-syllable', 'sound-count', 'beginning-sound', 'middle-sound', 'ending-sound', 'phonics-drill', 'listen-repeat', 'minimal-pair', 'syllable-break', 'oral-blending', 'sound-deletion', 'sound-substitution', 'hearing-sounds'], 'reading', 'phonemic awareness', 'foundation', 'high'),
  ...createEntries(['cvc', 'cvce', 'digraph', 'trigraph', 'cluster', 'blend', 'decode', 'decoding', 'word-family', 'sight-word', 'high-frequency', 'silent-letter', 'schwa', 'long-vowel', 'short-vowel', 'prefix', 'suffix', 'root-word', 'compound-word', 'multisyllabic'], 'reading', 'phonics and decoding', 'grade_1_2', 'high'),
  ...createEntries(['fluency', 'pace', 'accuracy', 'expression', 'intonation', 'pause', 'punctuation-pause', 'self-correct', 'tracking', 'skipping-words', 're-reading', 'hesitation', 'choppy', 'word-by-word', 'smooth-reading', 'echo-reading', 'paired-reading', 'timed-reading', 'oral-reading', 'prosody'], 'reading', 'fluency', 'grade_1_2', 'moderate'),
  ...createEntries(['meaning', 'vocabulary', 'word-meaning', 'synonym', 'antonym', 'context-clue', 'topic-word', 'phrase', 'idiom', 'opposite', 'category-word', 'sorting-words', 'word-bank', 'new-word', 'home-language-transfer', 'oral-vocabulary', 'labeling', 'naming-objects', 'describing', 'sentence-word'], 'comprehension', 'vocabulary development', 'grade_1_2', 'moderate'),
  ...createEntries(['who', 'what', 'when', 'where', 'question-answer', 'fact-recall', 'sequence-events', 'main-character', 'setting', 'title-clue', 'detail-finding', 'retell', 'retelling', 'story-order', 'beginning-middle-end', 'picture-clue', 'matching-detail', 'literal', 'direct-answer', 'finding-facts'], 'comprehension', 'literal comprehension', 'grade_1_2', 'moderate'),
  ...createEntries(['why', 'how', 'infer', 'inference', 'prediction', 'cause', 'effect', 'problem-solution', 'motive', 'feeling', 'theme', 'lesson', 'compare', 'contrast', 'evidence', 'justify', 'opinion', 'conclusion', 'reading-between-lines', 'reasoning'], 'comprehension', 'inferential comprehension', 'grade_3_5', 'high'),
  ...createEntries(['summarize', 'summary', 'gist', 'main-idea', 'supporting-detail', 'paragraph-focus', 'topic-sentence', 'key-point', 'headline', 'nonfiction', 'fact-opinion', 'compare-texts', 'author-purpose', 'graphic-organizer', 'note-taking', 'sequencing', 'retell-briefly', 'identify-theme', 'story-map', 'summary-sentence'], 'comprehension', 'summarisation', 'grade_3_5', 'moderate'),
  ...createEntries(['handwriting', 'grip', 'posture', 'spacing', 'alignment', 'line-use', 'letter-formation', 'stroke', 'copying', 'dictation', 'legibility', 'speed-writing', 'mirror-writing', 'reversal', 'capitalization', 'punctuation-writing', 'copy-from-board', 'visual-motor', 'fine-motor', 'messy-writing'], 'writing', 'handwriting mechanics', 'foundation', 'moderate'),
  ...createEntries(['sentence', 'sentence-frame', 'subject', 'verb', 'object', 'simple-sentence', 'complete-thought', 'fragment', 'tense', 'agreement', 'connector', 'because', 'and', 'but', 'sequence-word', 'question-mark', 'full-stop', 'capital-letter', 'sentence-expansion', 'rearrange-words'], 'writing', 'sentence construction', 'grade_1_2', 'high'),
  ...createEntries(['paragraph', 'paragraphing', 'topic-sentence-writing', 'supporting-sentence', 'concluding-sentence', 'narrative', 'description', 'dialogue', 'letter-writing', 'message-writing', 'sequence-writing', 'planning', 'brainstorm', 'drafting', 'editing', 'revision', 'coherence', 'transition', 'details', 'organization'], 'writing', 'paragraph writing', 'grade_3_5', 'moderate'),
  ...createEntries(['spelling', 'phonetic-spelling', 'common-misspelling', 'word-family-spelling', 'suffix-spelling', 'prefix-spelling', 'homophone', 'plural', 'past-tense', 'irregular', 'article', 'preposition', 'pronoun', 'adjective', 'adverb', 'noun', 'verb-form', 'grammar', 'editing-mark', 'dictation-errors'], 'writing', 'grammar and spelling', 'grade_3_5', 'moderate'),
  ...createEntries(['number-recognition', 'number-name', 'counting', 'rote-count', 'one-to-one', 'before-after', 'more-less', 'ascending', 'descending', 'number-line', 'place-value', 'tens', 'ones', 'compare-numbers', 'skip-count', 'pattern-number', 'missing-number', 'bundling', 'estimation', 'ordinal'], 'arithmetic', 'number sense', 'foundation', 'high'),
  ...createEntries(['addition', 'add', 'plus', 'sum', 'carry', 'regroup', 'number-bond', 'double', 'near-double', 'mental-addition', 'vertical-addition', 'horizontal-addition', 'make-ten', 'count-on', 'fact-family', 'addition-fact', 'two-digit-addition', 'three-digit-addition', 'word-problem-addition', 'addition-error'], 'arithmetic', 'addition', 'grade_1_2', 'high'),
  ...createEntries(['subtraction', 'subtract', 'minus', 'difference', 'borrow', 'regroup-subtraction', 'count-back', 'take-away', 'comparison-subtraction', 'missing-addend', 'subtraction-fact', 'fact-fluency', 'decompose', 'break-apart', 'two-digit-subtraction', 'three-digit-subtraction', 'subtraction-word-problem', 'reverse-operation', 'checking-work', 'subtraction-error'], 'arithmetic', 'subtraction', 'grade_1_2', 'high'),
  ...createEntries(['multiplication', 'times', 'product', 'array', 'equal-groups', 'repeated-addition', 'table', 'times-table', 'skip-counting', 'fact-recall', 'doubles', 'commutative', 'distributive', 'multiply-by-10', 'carry-multiplication', 'two-digit-multiplication', 'partial-product', 'area-model', 'multiplication-word-problem', 'multiplication-error'], 'arithmetic', 'multiplication', 'grade_3_5', 'high'),
  ...createEntries(['division', 'divide', 'quotient', 'remainder', 'sharing', 'grouping', 'inverse', 'fact-family-division', 'division-table', 'equal-sharing', 'long-division', 'partial-quotient', 'divide-by-10', 'division-word-problem', 'estimate-quotient', 'check-remainder', 'short-division', 'division-steps', 'division-error', 'remainder-interpretation'], 'arithmetic', 'division', 'grade_3_5', 'high'),
  ...createEntries(['fraction', 'half', 'quarter', 'third', 'numerator', 'denominator', 'equal-parts', 'fraction-strip', 'fraction-circle', 'compare-fractions', 'equivalent-fraction', 'simplify', 'improper', 'mixed-number', 'fraction-number-line', 'add-fractions', 'subtract-fractions', 'fraction-word-problem', 'fraction-model', 'decimal-link'], 'arithmetic', 'fractions', 'grade_3_5', 'moderate'),
  ...createEntries(['measure', 'measurement', 'length', 'height', 'weight', 'mass', 'capacity', 'volume', 'litre', 'millilitre', 'centimetre', 'metre', 'kilogram', 'gram', 'clock', 'time', 'calendar', 'money', 'rupee', 'word-problem-measurement'], 'arithmetic', 'measurement and money', 'grade_3_5', 'moderate'),
  ...createEntries(['shape', '2d-shape', '3d-shape', 'circle', 'triangle', 'square', 'rectangle', 'polygon', 'corner', 'side', 'edge', 'face', 'vertex', 'symmetry', 'pattern-shape', 'position', 'direction', 'map', 'angle', 'perimeter'], 'arithmetic', 'geometry and spatial reasoning', 'grade_3_5', 'moderate')
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s-]/g, ' ');
}

function detectLearningGaps(note: string) {
  const normalizedNote = normalizeText(note);
  const matches = gapKeywordMap.filter((entry) => normalizedNote.includes(entry.keyword));
  const rankedMatches = matches.reduce<Record<string, GapKeywordEntry>>((accumulator, entry) => {
    const existingMatch = accumulator[entry.concept];

    if (!existingMatch) {
      accumulator[entry.concept] = entry;
      return accumulator;
    }

    const severityOrder: Record<RiskLevel, number> = {
      low: 1,
      moderate: 2,
      high: 3,
      critical: 4,
    };

    if (severityOrder[entry.severity] > severityOrder[existingMatch.severity]) {
      accumulator[entry.concept] = entry;
    }

    return accumulator;
  }, {});

  const uniqueMatches = Object.values(rankedMatches);
  const gaps = uniqueMatches.map((match) => `${match.domain}: ${match.concept}`);
  const confidence = uniqueMatches.length === 0 ? 0.12 : Math.min(0.95, 0.2 + uniqueMatches.length * 0.08);

  return {
    gaps,
    matches: uniqueMatches,
    summary:
      uniqueMatches.length === 0
        ? 'No explicit gap keywords detected.'
        : `Detected ${uniqueMatches.length} likely learning gaps.`,
    confidence,
  };
}

serve(async (request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as { note: string };

    if (!body.note) {
      throw new Error('The note field is required.');
    }

    return new Response(JSON.stringify(detectLearningGaps(body.note)), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to detect learning gaps.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});

