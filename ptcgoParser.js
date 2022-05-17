// copied from https://github.com/Hamatti/ptcgo-parser
import setcodes from './sets.js';

const SET_PATTERN = /(?:\*)?(\d+) (.*) ([A-Z]{2,3}|[A-Z]{2}-[A-Z]{2,4}|[A-Z0-9]{3}|Energy)? (\d+|XY\d+|BW\d+|SM\d+|SWSH\d+|RC\d+|TG\d+)/;
const BASIC_ENERGY_COUNT_PATTERN = /(?:\*)?\d+/;

const BASIC_ENERGY_TYPES = [
  'Darkness',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
];

const PTCGL_BASIC_ENERGY = [
  '{D}',
  '{Y}',
  '{F}',
  '{R}',
  '{G}',
  '{L}',
  '{M}',
  '{P}',
  '{W}',
];

const SWSH_SPECIAL_ENERGY = [
  'RCL 172',
  'RCL 173',
  'DAA 174',
  'DAA 175',
  'DAA 176',
  'VIV 162',
  'VIV 163',
  'VIV 164',
  'VIV 165',
];

const BASIC_ENERGY_IDS = {
  Darkness: 'sm1-170',
  Fairy: 'sm1-172',
  Fighting: 'sm1-169',
  Fire: 'sm1-165',
  Grass: 'sm1-164',
  Lightning: 'sm1-167',
  Metal: 'sm1-171',
  Psychic: 'sm1-168',
  Water: 'sm1-166',
};

const BASIC_ENERGY_NUMBERS = {
  Darkness: '7',
  Fairy: '17',
  Fighting: '6',
  Fire: '2',
  Grass: '1',
  Lightning: '4',
  Metal: '8',
  Psychic: '5',
  Water: '3',
};

const BASIC_ENERGY_FROM_NUMBERS=[
  'Grass',
  'Fire',
  'Water',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Fairy',
]

const detectBasicEnergy = (row) => {
  const result = BASIC_ENERGY_TYPES.findIndex((energy, index) => (row.includes(`${energy} Energy`)
    || row.includes(`Basic ${PTCGL_BASIC_ENERGY[index]} Energy`)));
  if (result > -1) {
    // filter out swsh special energies that may be detected
    const special = SWSH_SPECIAL_ENERGY.findIndex((energy) => (row.includes(energy)));
    if (special > -1) { return null; }
    return BASIC_ENERGY_TYPES[result];
  }
  return null;
};

const detectCard = (row) => {
  const basicEnergyType = detectBasicEnergy(row);
  if (basicEnergyType) {
    const energyCount = row.match(BASIC_ENERGY_COUNT_PATTERN)[0];
    return {
      amount: energyCount,
      name: basicEnergyType,
      set: 'Energy',
      code: BASIC_ENERGY_NUMBERS[basicEnergyType],
    };
  }
  const result = row.match(SET_PATTERN);
  if (result) {
    return {
      amount: result[1],
      name: result[2],
      set: result[3],
      code: result[4],
    };
  }
  return null;
};

const parseRow = (row) => {
  const card = detectCard(row);
  if (card) {
    const {
      name, set, code, isEnergy,
    } = card;

    // basic energy
    if(set === 'Energy'){
      card.isEnergy = true;
      const energyIndex = (card.code - 1) % 9;
      card.energyType = BASIC_ENERGY_FROM_NUMBERS[energyIndex];

      card.ptcgoio = card.ptcgoio = {
        id: BASIC_ENERGY_IDS[card.energyType],
      };

      return card;
    }

    card.ptcgoio = {
      id: 'undefined',
    };
    const regularSet = setcodes.regularSets[set];
    if(regularSet){
      const promoCode = setcodes.promoSets[set];
      if (promoCode) {
        // special case for SWSH promo numbering
        if (promoCode === 'swshp-SWSH') {
          if (code < 10) {
            card.ptcgoio.id = `${promoCode}00${code}`;
          } else if (code < 100) {
            card.ptcgoio.id = `${promoCode}0${code}`;
          } else {
            card.ptcgoio.id = `${promoCode}${code}`;
          }
        } else {
          card.ptcgoio.id = `${promoCode}${code}`;
        }
      } else {
        card.ptcgoio.id = `${regularSet}-${code}`;
      }
    }
    else{
      card.ptcgoio.missing = true;
    }
    

    
    return card;
  }
  return null;
};

const parse = (decklist) => {
  const parsed = {
    cards: decklist
      .split('\n')
      .map((row) => parseRow(row))
      .filter((c) => c),
  };

  return parsed;
};

export default { parse, parseRow };
