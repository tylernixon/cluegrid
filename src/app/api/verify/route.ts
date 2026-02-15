import { NextResponse } from 'next/server';
import { computeFeedback } from '@/lib/feedback';
import type { LetterFeedback, RevealedLetter } from '@/types';

// ---------------------------------------------------------------------------
// Server-side answer data -- NEVER sent to the client
// ---------------------------------------------------------------------------
interface CrosserAnswer {
  word: string;
  direction: 'down' | 'across';
  startRow: number;
  startCol: number;
  intersectionIndex: number; // position within crosser that intersects main word
}

interface PuzzleAnswers {
  mainWord: string;
  mainWordRow: number;
  crossers: Record<string, CrosserAnswer>;
}

const PUZZLE_ANSWERS: Record<string, PuzzleAnswers> = {
  'puzzle-1': {
    mainWord: 'CRANE',
    mainWordRow: 2,
    crossers: {
      'c1': { word: 'CRISP', direction: 'down', startRow: 0, startCol: 0, intersectionIndex: 2 },
      'c2': { word: 'ARROW', direction: 'down', startRow: 0, startCol: 1, intersectionIndex: 2 },
      'c3': { word: 'DANCE', direction: 'down', startRow: 0, startCol: 3, intersectionIndex: 2 },
    },
  },
};

// ---------------------------------------------------------------------------
// Simple word list for validation (accept common 5-letter words)
// In production this will be a database lookup.
// ---------------------------------------------------------------------------
const VALID_WORDS = new Set([
  // The puzzle answers themselves
  'CRANE', 'CRISP', 'ARROW', 'DANCE',
  // Common 5-letter words for testing
  'ABOUT', 'ABOVE', 'ABUSE', 'ADAPT', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER',
  'AGAIN', 'AGENT', 'AGREE', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN',
  'ALIVE', 'ALLEY', 'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMPLE', 'ANGEL',
  'ANGER', 'ANGLE', 'ANGRY', 'ANKLE', 'ANNEX', 'APART', 'APPLE', 'APPLY',
  'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'AROMA', 'ARRAY', 'ASIDE', 'ASSET',
  'AVOID', 'AWAKE', 'AWARD', 'AWARE', 'BADLY', 'BAKER', 'BASED', 'BASIC',
  'BASIN', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW', 'BENCH',
  'BIBLE', 'BLACK', 'BLADE', 'BLAME', 'BLAND', 'BLANK', 'BLAST', 'BLAZE',
  'BLEED', 'BLEND', 'BLESS', 'BLIND', 'BLOCK', 'BLOOD', 'BLOOM', 'BLOWN',
  'BOARD', 'BONUS', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND', 'BRAVE', 'BREAD',
  'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BROAD', 'BROKE',
  'BROWN', 'BRUSH', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'BUYER', 'CABIN',
  'CANDY', 'CARRY', 'CATCH', 'CAUSE', 'CEDAR', 'CHAIN', 'CHAIR', 'CHALK',
  'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEEK', 'CHEER', 'CHESS',
  'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOIR', 'CHOSE', 'CHUNK', 'CIVIL',
  'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLERK', 'CLICK', 'CLIFF', 'CLIMB',
  'CLING', 'CLOCK', 'CLONE', 'CLOSE', 'CLOTH', 'CLOUD', 'COACH', 'COAST',
  'COLOR', 'COMET', 'CORAL', 'COUNT', 'COURT', 'COVER', 'CRACK', 'CRAFT',
  'CRASH', 'CRAZY', 'CREAM', 'CREEK', 'CRIME', 'CROSS', 'CROWD', 'CROWN',
  'CRUSH', 'CURVE', 'CYCLE', 'DAILY', 'DAIRY', 'DEALT', 'DEATH',
  'DEBUT', 'DECAY', 'DELAY', 'DEMON', 'DENSE', 'DEPTH', 'DEVIL', 'DIRTY',
  'DODGE', 'DOING', 'DONOR', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAIN', 'DRAMA',
  'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRIED', 'DRIFT', 'DRINK', 'DRIVE',
  'DROPS', 'DROVE', 'DRUNK', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT',
  'ELDER', 'ELECT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY',
  'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXAMS', 'EXIST', 'EXTRA',
  'FAINT', 'FAIRY', 'FAITH', 'FALSE', 'FANCY', 'FATAL', 'FAULT', 'FAVOR',
  'FEAST', 'FENCE', 'FEWER', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT',
  'FINAL', 'FIRST', 'FIXED', 'FLAME', 'FLASH', 'FLEET', 'FLESH', 'FLOAT',
  'FLOCK', 'FLOOD', 'FLOOR', 'FLOUR', 'FLUID', 'FLUSH', 'FOCUS', 'FORCE',
  'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH',
  'FRONT', 'FROZE', 'FRUIT', 'FULLY', 'FUNNY', 'GHOST', 'GIANT', 'GIVEN',
  'GLASS', 'GLOBE', 'GLOOM', 'GLORY', 'GOING', 'GRACE', 'GRADE', 'GRAIN',
  'GRAND', 'GRANT', 'GRAPE', 'GRASP', 'GRASS', 'GRAVE', 'GREAT', 'GREEN',
  'GREET', 'GRIEF', 'GRILL', 'GRIND', 'GROSS', 'GROUP', 'GROVE', 'GROWN',
  'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILT', 'HABIT', 'HAPPY', 'HARRY',
  'HARSH', 'HAVEN', 'HEART', 'HEAVY', 'HENCE', 'HONEY', 'HONOR', 'HORSE',
  'HOTEL', 'HOUSE', 'HUMAN', 'HUMOR', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX',
  'INNER', 'INPUT', 'IRONY', 'ISSUE', 'IVORY', 'JOINT', 'JUDGE', 'JUICE',
  'KNIFE', 'KNOCK', 'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER', 'LAUGH',
  'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON', 'LEVEL',
  'LIGHT', 'LIMIT', 'LINEN', 'LIVER', 'LOCAL', 'LODGE', 'LOGIC', 'LONELY',
  'LOOSE', 'LOVER', 'LOWER', 'LUCKY', 'LUNCH', 'MAGIC', 'MAJOR', 'MAKER',
  'MANOR', 'MARCH', 'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'MERCY',
  'METAL', 'METER', 'MIGHT', 'MINOR', 'MINUS', 'MODEL', 'MONEY', 'MONTH',
  'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAKED',
  'NERVE', 'NEVER', 'NEWLY', 'NIGHT', 'NOBLE', 'NOISE', 'NORTH', 'NOTED',
  'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'OLIVE', 'ONSET',
  'OPERA', 'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'OXIDE', 'PAINT',
  'PANEL', 'PANIC', 'PATCH', 'PAUSE', 'PEACE', 'PEARL', 'PEACH', 'PENNY',
  'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PIXEL',
  'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'PLEAD', 'POINT',
  'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINCE', 'PRINT',
  'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'PUPIL', 'QUEEN', 'QUERY',
  'QUEST', 'QUEUE', 'QUICK', 'QUIET', 'QUITE', 'QUOTA', 'QUOTE', 'RADAR',
  'RADIO', 'RAISE', 'RALLY', 'RANCH', 'RANGE', 'RAPID', 'RATIO', 'REACH',
  'REACT', 'READY', 'REALM', 'REBEL', 'REIGN', 'RELAX', 'REPLY', 'RIGHT',
  'RIGID', 'RIVAL', 'RIVER', 'ROBOT', 'ROCKY', 'ROGER', 'ROMAN', 'ROUGH',
  'ROUND', 'ROUTE', 'ROYAL', 'RUGBY', 'RULER', 'RURAL', 'SADLY', 'SAINT',
  'SALAD', 'SAUCE', 'SCALE', 'SCARE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE',
  'SERVE', 'SEVEN', 'SHALL', 'SHAME', 'SHAPE', 'SHARE', 'SHARP', 'SHEER',
  'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT',
  'SHORT', 'SHOUT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY', 'SKILL',
  'SKULL', 'SLATE', 'SLAVE', 'SLEEP', 'SLICE', 'SLIDE', 'SLOPE', 'SMALL',
  'SMART', 'SMELL', 'SMILE', 'SMOKE', 'SNAKE', 'SOLAR', 'SOLID', 'SOLVE',
  'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPARK', 'SPEAK', 'SPEED',
  'SPELL', 'SPEND', 'SPENT', 'SPICE', 'SPIKE', 'SPINE', 'SPLIT', 'SPOKE',
  'SPOON', 'SPORT', 'SPRAY', 'SQUAD', 'STAFF', 'STAGE', 'STAIN', 'STAKE',
  'STALE', 'STALL', 'STAMP', 'STAND', 'STARE', 'START', 'STATE', 'STEAL',
  'STEAM', 'STEEL', 'STEEP', 'STEER', 'STERN', 'STICK', 'STILL', 'STOCK',
  'STOLE', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STOVE', 'STRAP',
  'STRAW', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE',
  'SUNNY', 'SUPER', 'SURGE', 'SWAMP', 'SWEAR', 'SWEAT', 'SWEEP', 'SWEET',
  'SWEPT', 'SWIFT', 'SWING', 'SWORD', 'SWORE', 'SWORN', 'TABLE', 'TAKEN',
  'TASTE', 'TEACH', 'TEETH', 'TEMPO', 'THANK', 'THEFT', 'THEIR', 'THEME',
  'THERE', 'THESE', 'THICK', 'THIEF', 'THING', 'THINK', 'THIRD', 'THOSE',
  'THREE', 'THREW', 'THROW', 'THUMB', 'TIGHT', 'TIRED', 'TITLE', 'TODAY',
  'TOKEN', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TOXIC', 'TRACE', 'TRACK',
  'TRADE', 'TRAIL', 'TRAIN', 'TRAIT', 'TRASH', 'TREAT', 'TREND', 'TRIAL',
  'TRIBE', 'TRICK', 'TRIED', 'TROOP', 'TRUCK', 'TRULY', 'TRUNK', 'TRUST',
  'TRUTH', 'TWICE', 'TWIST', 'ULTRA', 'UNCLE', 'UNDER', 'UNION', 'UNITE',
  'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'UTTER',
  'VALID', 'VALUE', 'VIDEO', 'VIGOR', 'VINYL', 'VIRUS', 'VISIT', 'VITAL',
  'VIVID', 'VOCAL', 'VOICE', 'VOTER', 'WAGON', 'WASTE', 'WATCH', 'WATER',
  'WEARY', 'WEAVE', 'WHEAT', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE',
  'WHOLE', 'WHOSE', 'WIDTH', 'WITCH', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY',
  'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRATH', 'WRITE', 'WRONG',
  'WROTE', 'YIELD', 'YOUNG', 'YOUTH',
]);

export async function POST(request: Request) {
  // 1. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { puzzleId, guess, target } = body as {
    puzzleId?: string;
    guess?: string;
    target?: string;
  };

  // 2. Validate inputs
  if (!puzzleId || typeof puzzleId !== 'string') {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'puzzleId is required' },
      { status: 400 },
    );
  }

  if (!guess || typeof guess !== 'string') {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'guess is required' },
      { status: 400 },
    );
  }

  if (!target || typeof target !== 'string') {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'target is required (use "main" or a crosser id)' },
      { status: 400 },
    );
  }

  const normalizedGuess = guess.toUpperCase();

  // 3. Validate guess is 5 uppercase letters
  if (!/^[A-Z]{5}$/.test(normalizedGuess)) {
    return NextResponse.json(
      { error: 'INVALID_LENGTH', message: 'Guess must be exactly 5 letters' },
      { status: 400 },
    );
  }

  // 4. Check dictionary
  if (!VALID_WORDS.has(normalizedGuess)) {
    return NextResponse.json(
      {
        valid: false,
        isWord: false,
        feedback: [],
        solved: false,
        revealedLetters: [],
        gameOver: false,
        won: false,
        error: 'INVALID_WORD',
        message: 'Not in word list',
      },
      { status: 400 },
    );
  }

  // 5. Look up puzzle answers
  const puzzleData = PUZZLE_ANSWERS[puzzleId];
  if (!puzzleData) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  // 6. Resolve the target answer word
  let answerWord: string;
  let crosserData: CrosserAnswer | null = null;

  if (target === 'main') {
    answerWord = puzzleData.mainWord;
  } else {
    crosserData = puzzleData.crossers[target] ?? null;
    if (!crosserData) {
      return NextResponse.json(
        { error: 'INVALID_TARGET', message: 'Target crosser not found' },
        { status: 400 },
      );
    }
    answerWord = crosserData.word;
  }

  // 7. Compute feedback
  const feedback: LetterFeedback[] = computeFeedback(normalizedGuess, answerWord);
  const solved = normalizedGuess === answerWord;

  // 8. Compute revealed letters if crosser was solved
  const revealedLetters: RevealedLetter[] = [];

  if (solved && target !== 'main' && crosserData) {
    const idx = crosserData.intersectionIndex;
    let revealRow: number;
    let revealCol: number;

    if (crosserData.direction === 'down') {
      revealRow = crosserData.startRow + idx;
      revealCol = crosserData.startCol;
    } else {
      revealRow = crosserData.startRow;
      revealCol = crosserData.startCol + idx;
    }

    const letter = answerWord[idx];
    if (letter) {
      revealedLetters.push({
        row: revealRow,
        col: revealCol,
        letter,
        source: target,
      });
    }
  }

  // 9. Check if main word is solved (game won)
  const gameWon = solved && target === 'main';

  return NextResponse.json({
    valid: true,
    isWord: true,
    feedback,
    solved,
    revealedLetters,
    gameOver: gameWon,
    won: gameWon,
  });
}
