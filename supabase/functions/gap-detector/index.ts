// @ts-ignore Deno edge runtime import
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore Deno edge runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Subject = 'math' | 'reading' | 'science' | 'english' | 'comprehension';
type SkillRating = 'improving' | 'steady' | 'not_covered';

interface GapProfile {
  math: number;
  reading: number;
  science: number;
  english: number;
  comprehension: number;
}

interface SessionRow {
  id: string;
  student_id: string;
  session_date: string;
  note: string;
  skill_ratings: Partial<Record<Subject, SkillRating>>;
}

interface StudentRow {
  id: string;
  center_id: string;
  gap_profile: GapProfile;
}

interface CenterRow {
  ngo_id: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const NCERT_KEYWORD_MAP: Record<Subject, string[]> = {
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
    'hindi', 'telugu', 'urdu', 'marathi', 'regional language',
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
    'describe', 'describe in english', 'speak', 'speaking', 'conversation',
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

const KEYWORD_TO_STANDARD: Record<string, string> = {
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

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function detectGapsFromNote(
  note: string,
  skillRatings: Partial<Record<Subject, SkillRating>>,
): {
  matchedKeywords: string[];
  standardCodes: string[];
  gapDeltas: Partial<Record<Subject, number>>;
} {
  const lowerNote = note.toLowerCase();
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
        matchedKeywords.push(keyword);
        keywordHitsBySubject[subject] += 1;

        if (KEYWORD_TO_STANDARD[keyword]) {
          standardCodes.push(KEYWORD_TO_STANDARD[keyword]);
        }
      }
    }
  }

  for (const [subject, rating] of Object.entries(skillRatings) as [Subject, SkillRating | undefined][]) {
    if (!rating) {
      continue;
    }

    const keywordBonus = Math.max(keywordHitsBySubject[subject] * -0.1, -0.5);
    gapDeltas[subject] = RATING_DELTAS[rating] + keywordBonus;
  }

  return {
    matchedKeywords: uniqueStrings(matchedKeywords),
    standardCodes: uniqueStrings(standardCodes),
    gapDeltas,
  };
}

function applyGapDeltas(
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

function toSessionTimestamp(sessionDate: string): string {
  return new Date(`${sessionDate}T12:00:00.000Z`).toISOString();
}

function getWeekStartString(sessionDate: string): string {
  const date = new Date(`${sessionDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().split('T')[0] ?? sessionDate;
}

async function logCoordinatorAlert(
  supabase: {
    from: (table: 'coordinator_alerts') => {
      insert: (values: { student_id: string; ngo_id: string; alert_type: string }) => unknown;
    };
  },
  studentId: string | null,
  ngoId: string | null,
): Promise<void> {
  if (!studentId || !ngoId) {
    return;
  }

  await supabase.from('coordinator_alerts').insert({
    student_id: studentId,
    ngo_id: ngoId,
    alert_type: 'gap_detection_failed',
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  let sessionIds: string[] = [];

  try {
    const body = (await req.json()) as { session_ids?: string[] };
    sessionIds = Array.isArray(body.session_ids)
      ? body.session_ids.filter((sessionId): sessionId is string => typeof sessionId === 'string')
      : [];
  } catch {
    return new Response(JSON.stringify({ updated: [], errors: ['Invalid request body'] }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  const updated: string[] = [];
  const errors: string[] = [];

  for (const sessionId of sessionIds) {
    let alertStudentId: string | null = null;
    let alertNgoId: string | null = Deno.env.get('DEFAULT_NGO_ID') ?? null;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id,student_id,session_date,note,skill_ratings')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error(sessionError?.message ?? 'Session not found');
      }

      const typedSession = session as SessionRow;
      alertStudentId = typedSession.student_id;

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id,center_id,gap_profile')
        .eq('id', typedSession.student_id)
        .single();

      if (studentError || !student) {
        throw new Error(studentError?.message ?? 'Student not found');
      }

      const typedStudent = student as StudentRow;

      const { data: center } = await supabase
        .from('centers')
        .select('ngo_id')
        .eq('id', typedStudent.center_id)
        .maybeSingle();

      alertNgoId = (center as CenterRow | null)?.ngo_id ?? alertNgoId;

      const detection = detectGapsFromNote(typedSession.note ?? '', typedSession.skill_ratings ?? {});
      const nextGapProfile = applyGapDeltas(typedStudent.gap_profile, detection.gapDeltas);
      const rawTags = uniqueStrings([...detection.matchedKeywords, ...detection.standardCodes]);
      const weekStart = getWeekStartString(typedSession.session_date);
      const lastSessionAt = toSessionTimestamp(typedSession.session_date);

      const { error: sessionUpdateError } = await supabase
        .from('sessions')
        .update({ raw_tags: rawTags })
        .eq('id', typedSession.id);

      if (sessionUpdateError) {
        throw new Error(sessionUpdateError.message);
      }

      const { error: historyError } = await supabase.from('gap_history').upsert(
        {
          student_id: typedStudent.id,
          week_start: weekStart,
          gap_profile: nextGapProfile,
        },
        { onConflict: 'student_id,week_start' },
      );

      if (historyError) {
        throw new Error(historyError.message);
      }

      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({
          gap_profile: nextGapProfile,
          last_session_at: lastSessionAt,
        })
        .eq('id', typedStudent.id);

      if (studentUpdateError) {
        throw new Error(studentUpdateError.message);
      }

      const { error: invokeError } = await supabase.functions.invoke('risk-scorer', {
        body: { student_ids: [typedStudent.id] },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      updated.push(sessionId);
    } catch (error) {
      const message = error instanceof Error ? `${sessionId}: ${error.message}` : `${sessionId}: Unknown error`;
      errors.push(message);
      await logCoordinatorAlert(supabase, alertStudentId, alertNgoId);
    }
  }

  return new Response(JSON.stringify({ updated, errors }), {
    status: 200,
    headers: corsHeaders,
  });
});
