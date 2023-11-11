type IrregularVerb = [string, string];
const irregularVerbs: IrregularVerb[] = [
  ['arise', 'arisen'],
  ['awake', 'awoken'],
  ['be', 'been'],
  ['bear', 'borne'],
  ['beat', 'beaten'],
  ['become', 'become'],
  ['begin', 'begun'],
  ['bend', 'bent'],
  ['bet', 'bet'],
  ['bid', 'bidden'],
  ['bind', 'bound'],
  ['bite', 'bitten'],
  ['bleed', 'bled'],
  ['blow', 'blown'],
  ['break', 'broken'],
  ['breed', 'bred'],
  ['bring', 'brought'],
  ['build', 'built'],
  ['burn', 'burnt'],
  ['burst', 'burst'],
  ['buy', 'bought'],
  ['cast', 'cast'],
  ['catch', 'caught'],
  ['choose', 'chosen'],
  ['come', 'come'],
  ['cost', 'cost'],
  ['cut', 'cut'],
  ['deal', 'dealt'],
  ['dig', 'dug'],
  ['do', 'done'],
  ['draw', 'drawn'],
  ['dream', 'dreamt'],
  ['drink', 'drunk'],
  ['drive', 'driven'],
  ['eat', 'eaten'],
  ['fall', 'fallen'],
  ['feed', 'fed'],
  ['feel', 'felt'],
  ['fight', 'fought'],
  ['find', 'found'],
  ['flee', 'fled'],
  ['fly', 'flown'],
  ['forbid', 'forbidden'],
  ['forget', 'forgotten'],
  ['forgive', 'forgiven'],
  ['freeze', 'frozen'],
  ['get', 'gotten'],
  ['give', 'given'],
  ['go', 'gone'],
  ['grow', 'grown'],
  ['hang', 'hanged'],
  ['have', 'had'],
  ['hear', 'heard'],
  ['hide', 'hidden'],
  ['hit', 'hit'],
  ['hold', 'held'],
  ['hurt', 'hurt'],
  ['keep', 'kept'],
  ['kneel', 'knelt'],
  ['knit', 'knitted'],
  ['know', 'known'],
  ['lay', 'laid'],
  ['lead', 'led'],
  ['lean', 'leant'],
  ['leap', 'leapt'],
  ['learn', 'learnt'],
  ['leave', 'left'],
  ['lend', 'lent'],
  ['let', 'let'],
  ['lie', 'lain'],
  ['light', 'lit'],
  ['lose', 'lost'],
  ['make', 'made'],
  ['mean', 'meant'],
  ['meet', 'met'],
  ['pay', 'paid'],
  ['put', 'put'],
  ['quit', 'quitted'],
  ['read', 'read'],
  ['ride', 'ridden'],
  ['ring', 'rung'],
  ['rise', 'risen'],
  ['run', 'run'],
  ['saw', 'sawn'],
  ['say', 'said'],
  ['see', 'seen'],
  ['seek', 'sought'],
  ['sell', 'sold'],
  ['send', 'sent'],
  ['set', 'set'],
  ['sew', 'sewn'],
  ['shake', 'shaken'],
  ['shave', 'shaven'],
  ['shear', 'shorn'],
  ['shed', 'shed'],
  ['shine', 'shone'],
  ['shoot', 'shot'],
  ['show', 'shown'],
  ['shrink', 'shrunk'],
  ['shut', 'shut'],
  ['sing', 'sung'],
  ['sink', 'sunk'],
  ['sit', 'sat'],
  ['slay', 'slain'],
  ['sleep', 'slept'],
  ['slide', 'slid'],
  ['sling', 'slung'],
  ['slit', 'slit'],
  ['smell', 'smelt'],
  ['sneak', 'snuck'],
  ['speak', 'spoken'],
  ['spell', 'spelt'],
  ['spend', 'spent'],
  ['spill', 'spilt'],
  ['spin', 'spun'],
  ['spit', 'spit'],
  ['split', 'split'],
  ['spread', 'spread'],
  ['spring', 'sprung'],
  ['stand', 'stood'],
  ['steal', 'stolen'],
  ['stick', 'stuck'],
  ['sting', 'stung'],
  ['stink', 'stunk'],
  ['stride', 'stridden'],
  ['strike', 'stricken'],
  ['string', 'strung'],
  ['strive', 'striven'],
  ['swear', 'sworn'],
  ['sweep', 'swept'],
  ['swell', 'swollen'],
  ['swim', 'swum'],
  ['swing', 'swung'],
  ['take', 'taken'],
  ['teach', 'taught'],
  ['tear', 'torn'],
  ['tell', 'told'],
  ['think', 'thought'],
  ['throw', 'thrown'],
  ['thrust', 'thrust'],
  ['tread', 'trodden'],
  ['understand', 'understood'],
  ['uphold', 'upheld'],
  ['upset', 'upset'],
  ['wake', 'woken'],
  ['wear', 'worn'],
  ['weave', 'woven'],
  ['wed', 'wedded'],
  ['weep', 'wept'],
  ['win', 'won'],
  ['wind', 'wound'],
  ['wring', 'wrung'],
  ['write', 'written'],
];

function capitalizeFirstLetter(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function removeCommandSuffix(str: string): string {
  return str.endsWith('Command') ? str.slice(0, -7) : str;
}

function handleSpecialCases(verb: string, nouns: string[]) {
  // SetUp > SetUpDone
  if (verb.toLowerCase() === 'set' && nouns[0]?.toLowerCase() === 'up') {
    nouns[0] = nouns[0].replace('Up', '');
    nouns.push('SetUp');
    verb = 'do';
  }
  // Setup > SetupDone
  if (verb.toLowerCase() === 'setup') {
    nouns[0] = nouns[0].replace('Up', '');
    nouns.push('Setup');
    verb = 'do';
  }
  return verb;
}

function convertToPastTense(verb: string): string {
  verb = verb.toLowerCase();
  const irregularVerb = irregularVerbs.find(([base]) => base === verb);
  if (irregularVerb) return irregularVerb[1];
  if (verb.endsWith('e')) {
    return verb + 'd';
  } else if (verb.endsWith('y')) {
    return verb.slice(0, -1) + 'ied';
  }
  return verb + 'ed';
}

function convertCommandToEvent(command: string): string {
  const words = removeCommandSuffix(command).match(/[A-Z][a-z]+|[0-9]+/g);
  if (!words) throw new Error('Invalid command format');
  const [initialVerb, ...nouns] = words;
  let verb = handleSpecialCases(initialVerb, nouns);
  verb = capitalizeFirstLetter(convertToPastTense(verb));
  const event = [...nouns, verb].join('');
  return event.charAt(0).toUpperCase() + event.slice(1) + 'Event';
}

// Examples
// eslint-disable-next-line no-console
console.log(`  
${convertCommandToEvent('SetupTelevisionCommand')}
`);
