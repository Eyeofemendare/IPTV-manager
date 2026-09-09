import { EpgChannel, EpgPreset } from '../types';
import { DEMO_EPG_DATABASE } from './demoData';

export const INTERNATIONAL_EPG_DATABASE: EpgChannel[] = [
  {
    id: 'SkySportsMainEvent.uk',
    displayName: 'Sky Sports Main Event',
    iconUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=160&auto=format&fit=crop&q=80',
    category: 'UK Sports',
    currentShow: {
      title: 'Premier League Live: Super Sunday',
      start: '16:00',
      end: '18:30',
      desc: 'Live coverage of the marquee Premier League clash with full analysis.',
      category: 'Football',
    },
    nextShow: {
      title: 'Super Sunday Match Choice & Reaction',
      start: '18:30',
      end: '20:00',
      desc: 'Post-match reactions, manager interviews and highlights.',
      category: 'Analysis',
    },
  },
  {
    id: 'SkySportsPremierLeague.uk',
    displayName: 'Sky Sports Premier League',
    iconUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=160&auto=format&fit=crop&q=80',
    category: 'UK Sports',
    currentShow: {
      title: 'Premier League: Arsenal vs Manchester City',
      start: '16:30',
      end: '18:45',
      desc: 'Top of the table title battle live from London.',
      category: 'Football',
    },
    nextShow: {
      title: 'Monday Night Football Preview',
      start: '18:45',
      end: '20:00',
      desc: 'In-depth tactical breakdown with Jamie Carragher.',
      category: 'Football',
    },
  },
  {
    id: 'SkySportBundesliga1.de',
    displayName: 'Sky Sport Bundesliga 1',
    iconUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=160&auto=format&fit=crop&q=80',
    category: 'German Sports',
    currentShow: {
      title: 'Bundesliga: Bayern München - Borussia Dortmund',
      start: '17:30',
      end: '20:00',
      desc: 'Der Klassiker live in voller Länge aus der Allianz Arena.',
      category: 'Fußball',
    },
    nextShow: {
      title: 'Alle Spiele, alle Tore',
      start: '20:00',
      end: '21:15',
      desc: 'Die Highlights des aktuellen Bundesliga-Spieltags.',
      category: 'Fußball',
    },
  },
  {
    id: 'SkySportBundesliga2.de',
    displayName: 'Sky Sport Bundesliga 2',
    iconUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=160&auto=format&fit=crop&q=80',
    category: 'German Sports',
    currentShow: {
      title: 'Bundesliga Konferenz',
      start: '15:00',
      end: '17:30',
      desc: 'Die Original Sky Konferenz der Samstagsspiele.',
      category: 'Fußball',
    },
    nextShow: {
      title: '2. Bundesliga Highlights',
      start: '17:30',
      end: '19:00',
      desc: 'Zusammenfassung aller Partien des Wochenendes.',
      category: 'Fußball',
    },
  },
  {
    id: 'CanalPlusDecouverte.fr',
    displayName: 'Canal+ Decouverte',
    iconUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&auto=format&fit=crop&q=80',
    category: 'French Documentary',
    currentShow: {
      title: 'Planète Bleue: Les Océans Secrets',
      start: '18:00',
      end: '19:30',
      desc: 'Une immersion inédite au cœur des abysses océaniques.',
      category: 'Documentaire',
    },
    nextShow: {
      title: 'Les Mystères du Système Solaire',
      start: '19:30',
      end: '21:00',
      desc: 'Voyage aux confins de notre galaxie.',
      category: 'Science',
    },
  },
  {
    id: 'CanalPlusCinema.fr',
    displayName: 'Canal+ Cinema',
    iconUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=160&auto=format&fit=crop&q=80',
    category: 'French Cinema',
    currentShow: {
      title: 'Anatomie d\'une Chute (2023)',
      start: '17:45',
      end: '20:15',
      desc: 'Palme d\'Or au Festival de Cannes, drame judiciaire captivant.',
      category: 'Cinéma',
    },
    nextShow: {
      title: 'Mission: Impossible - Dead Reckoning',
      start: '20:15',
      end: '23:00',
      desc: 'Ethan Hunt face à une intelligence artificielle toute-puissante.',
      category: 'Action',
    },
  },
  {
    id: 'beINSportsHaber.tr',
    displayName: 'beIN Sports Haber',
    iconUrl: 'https://images.unsplash.com/photo-1489944445391-08d4057ae2b3?w=160&auto=format&fit=crop&q=80',
    category: 'Turkish Sports',
    currentShow: {
      title: 'Süper Lig Maç Önü',
      start: '18:00',
      end: '19:00',
      desc: 'Galatasaray ve Fenerbahçe derbi hazırlıkları ve son dakika haberleri.',
      category: 'Futbol',
    },
    nextShow: {
      title: 'Günün Golleri & Özetler',
      start: '19:00',
      end: '20:30',
      desc: 'Avrupa liglerinden en güzel goller ve kritik anlar.',
      category: 'Futbol',
    },
  },
  {
    id: 'MBCAction.ar',
    displayName: 'MBC Action',
    iconUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&auto=format&fit=crop&q=80',
    category: 'Arabic Entertainment',
    currentShow: {
      title: 'WWE SmackDown Live',
      start: '17:00',
      end: '19:00',
      desc: 'High-octane wrestling entertainment with WWE superstars.',
      category: 'Action',
    },
    nextShow: {
      title: 'Fast & Furious: Action Night',
      start: '19:00',
      end: '21:30',
      desc: 'Street racing thriller movie.',
      category: 'Movies',
    },
  },
  {
    id: 'Eurosport1.eu',
    displayName: 'Eurosport 1 HD',
    iconUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=160&auto=format&fit=crop&q=80',
    category: 'Pan-European Sports',
    currentShow: {
      title: 'Tour de France: Live Stage Coverage',
      start: '14:30',
      end: '18:00',
      desc: 'Mountain stage battle live from the Pyrenees.',
      category: 'Cycling',
    },
    nextShow: {
      title: 'Australian Open Tennis Highlights',
      start: '18:00',
      end: '19:30',
      desc: 'Grand slam tournament recap and expert analysis.',
      category: 'Tennis',
    },
  },
  {
    id: 'BBCOne.uk',
    displayName: 'BBC One HD',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/BBC_One_2021.svg/240px-BBC_One_2021.svg.png',
    category: 'UK General',
    currentShow: {
      title: 'BBC News at Six',
      start: '18:00',
      end: '18:30',
      desc: 'The latest national and international news stories from the BBC.',
      category: 'News',
    },
    nextShow: {
      title: 'Doctor Who',
      start: '18:30',
      end: '19:20',
      desc: 'Sci-fi adventure traveling across time and space in the TARDIS.',
      category: 'Sci-Fi',
    },
  },
  {
    id: 'CNN.us',
    displayName: 'CNN International',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/240px-CNN.svg.png',
    category: 'US News',
    currentShow: {
      title: 'The Situation Room with Wolf Blitzer',
      start: '18:00',
      end: '19:00',
      desc: 'Breaking news and political discussions from Washington D.C.',
      category: 'News',
    },
    nextShow: {
      title: 'Anderson Cooper 360',
      start: '19:00',
      end: '20:00',
      desc: 'In-depth global investigative journalism.',
      category: 'Current Affairs',
    },
  },
];

export const GREEK_EPG_DATABASE: EpgChannel[] = DEMO_EPG_DATABASE;

export const COMBINED_EPG_DATABASE: EpgChannel[] = [
  ...GREEK_EPG_DATABASE,
  ...INTERNATIONAL_EPG_DATABASE,
];

export const EPG_PRESETS: EpgPreset[] = [
  {
    id: 'greek_full',
    name: 'Ελληνικό Πακέτο (Greek & Cyprus EPG)',
    nameEn: 'Greek & Cyprus Channels',
    url: 'https://iptv-manager.cloud/epg/greece.xml',
    description: 'ΕΡΤ 1-3, Mega, Ant1, Alpha, Star, ΣΚΑΪ, Open, Cosmote Sports 1-4, Novasports, Cosmote Cinema, ΡΙΚ Κύπρου κ.α.',
    badge: 'Προτεινόμενο GR',
    channelCount: GREEK_EPG_DATABASE.length,
  },
  {
    id: 'international_sports',
    name: 'Διεθνές & Αθλητικό (International & Sports)',
    nameEn: 'International & Sports Channels',
    url: 'https://iptv-manager.cloud/epg/international.xml',
    description: 'Sky Sports UK, Bundesliga DE, Canal+ FR, beIN Sports TR, MBC Action, Eurosport, BBC One, CNN.',
    badge: 'Sports & Cinema',
    channelCount: INTERNATIONAL_EPG_DATABASE.length,
  },
  {
    id: 'all_in_one',
    name: 'Συνδυαστικό Πακέτο (Greek + International All-in-One)',
    nameEn: 'All-in-One Unified EPG',
    url: 'https://iptv-manager.cloud/epg/all-in-one.xml',
    description: 'Πλήρης ενοποιημένος οδηγός με όλα τα ελληνικά κανάλια συν τα κορυφαία διεθνή αθλητικά & ταινίες.',
    badge: 'Πλήρες (All-in-One)',
    channelCount: COMBINED_EPG_DATABASE.length,
  },
  {
    id: 'iptv_org_gr',
    name: 'IPTV-Org Official Greek Guide (WebGrab+)',
    nameEn: 'IPTV-Org Greek XMLTV',
    url: 'https://iptv-org.github.io/epg/guides/gr/ertflix.gr.epg.xml',
    description: 'Επίσημος οδηγός προγράμματος από το ανοικτό project iptv-org για ελληνικούς σταθμούς.',
    badge: 'Open Source',
    channelCount: 24,
  },
  {
    id: 'custom_url',
    name: 'Προσαρμοσμένο XMLTV EPG URL',
    nameEn: 'Custom XMLTV EPG URL',
    url: '',
    description: 'Εισάγετε το δικό σας XMLTV link (από τον πάροχο, epg.best, WebGrab+ κ.λπ.) με ζωντανή ανάλυση.',
    badge: 'Custom URL',
    channelCount: 0,
  },
];

export function getPresetChannels(presetId: string): EpgChannel[] {
  switch (presetId) {
    case 'international_sports':
      return INTERNATIONAL_EPG_DATABASE.map((c) => ({
        ...c,
        sourceName: 'Διεθνές & Αθλητικό',
        sourceId: 'international_sports',
      }));
    case 'all_in_one':
      return COMBINED_EPG_DATABASE.map((c) => ({
        ...c,
        sourceName: 'Συνδυαστικό (All-in-One)',
        sourceId: 'all_in_one',
      }));
    case 'iptv_org_gr':
      return GREEK_EPG_DATABASE.map((c) => ({
        ...c,
        sourceName: 'IPTV-Org Greek',
        sourceId: 'iptv_org_gr',
      }));
    case 'greek_full':
    case 'greek_default':
    default:
      return GREEK_EPG_DATABASE.map((c) => ({
        ...c,
        sourceName: 'Ελληνικό Πακέτο',
        sourceId: 'greek_full',
      }));
  }
}

