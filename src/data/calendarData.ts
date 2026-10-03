// Calendar & Events System for Lembah Karsa (Harvest Moon / Innocent Life style)
import { Season, CalendarEvent, UpcomingEvent } from '../types/game';

export const TOTAL_DAYS_PER_SEASON = 28;
export const SEASONS: Season[] = ['Semi', 'Panas', 'Gugur', 'Dingin'];

export const DAY_NAMES = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

export const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export interface SeasonTheme {
  name: string;
  english: string;
  icon: string;
  tagline: string;
  bgGradient: string;
  cardBg: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  activeTabBg: string;
}

export const SEASON_THEMES: Record<Season, SeasonTheme> = {
  Semi: {
    name: 'Musim Semi',
    english: 'Spring',
    icon: '🌸',
    tagline: 'Musim Bunga Merekah & Awal Masa Tanam Baru',
    bgGradient: 'from-pink-950/40 via-stone-900 to-emerald-950/30',
    cardBg: 'bg-emerald-950/30 border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-600/50',
    activeTabBg: 'bg-emerald-600 text-stone-950',
  },
  Panas: {
    name: 'Musim Panas',
    english: 'Summer',
    icon: '☀️',
    tagline: 'Terik Mentari Hangat, Laut Tropis & Buah Manis',
    bgGradient: 'from-amber-950/40 via-stone-900 to-sky-950/30',
    cardBg: 'bg-amber-950/30 border-amber-500/30',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-600/50',
    activeTabBg: 'bg-amber-500 text-stone-950',
  },
  Gugur: {
    name: 'Musim Gugur',
    english: 'Autumn',
    icon: '🍂',
    tagline: 'Panen Raya Melimpah, Jamur Rimba & Doa Leluhur',
    bgGradient: 'from-orange-950/40 via-stone-900 to-amber-950/30',
    cardBg: 'bg-orange-950/30 border-orange-500/30',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-600/50',
    activeTabBg: 'bg-orange-600 text-stone-950',
  },
  Dingin: {
    name: 'Musim Dingin',
    english: 'Winter',
    icon: '❄️',
    tagline: 'Salju Berkilau, Danau Es & Pendaran Aurora',
    bgGradient: 'from-cyan-950/40 via-stone-900 to-blue-950/30',
    cardBg: 'bg-cyan-950/30 border-cyan-500/30',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-600/50',
    activeTabBg: 'bg-cyan-500 text-stone-950',
  },
};

export const CALENDAR_EVENTS: CalendarEvent[] = [
  // ==================== MUSIM SEMI ====================
  {
    id: 'spring_opening',
    title: 'Festival Tanam Musim Semi',
    season: 'Semi',
    day: 1,
    type: 'festival',
    icon: '🌱',
    locationName: 'Alun-alun Desa Karsa',
    timeRange: '08:00 - 17:00',
    description: 'Upacara pembuka musim tanam baru di Lembah Karsa. Warga berkumpul saling mendoakan keberkahan panen dan bertukar bibit unggulan.',
    tips: 'Kunjungi Warung Bu Sari untuk diskon bibit lobak, stroberi, dan kentang!',
  },
  {
    id: 'bday_raka',
    title: 'Ulang Tahun Tabib Raka',
    season: 'Semi',
    day: 4,
    type: 'birthday',
    icon: '🎂',
    locationName: 'Klinik Desa Karsa',
    timeRange: 'Sepanjang Hari',
    description: 'Hari kelahiran Tabib Raka, peracik ramuan herbal desa yang tenang, teliti, dan selalu memperhatikan stamina para petani.',
    npcId: 'raka',
    rewardsOrGifts: ['Akar Mandrake', 'Herba Obat', 'Eliksir Naga', 'Madu Hutan'],
    tips: 'Beri hadiah kesukaannya hari ini untuk mendapatkan bonus relasi hati ganda (+2 Hati)!',
  },
  {
    id: 'spring_lotus_fest',
    title: 'Festival Bunga Teratai & Mata Air',
    season: 'Semi',
    day: 11,
    type: 'festival',
    icon: '🪷',
    locationName: 'Danau Karsa & Altar Mata Air',
    timeRange: '10:00 - 20:00',
    description: 'Bunga teratai merah mekar sempurna di permukaan Danau Karsa. Warga menghanyutkan lentera harapan dan meminum seduhan air suci teratai.',
    tips: 'Ikan air tawar di danau berenang lebih aktif, kesempatan menangkap ikan lele dan nila ukuran jumbo!',
  },
  {
    id: 'bday_arsa',
    title: 'Ulang Tahun Paman Arsa',
    season: 'Semi',
    day: 18,
    type: 'birthday',
    icon: '🎂',
    locationName: 'Kebun Paman Arsa',
    timeRange: 'Sepanjang Hari',
    description: 'Ulang tahun Paman Arsa, sosok sesepuh bijak yang mewariskan cangkul dan lahan leluhur kepadamu.',
    npcId: 'arsa',
    rewardsOrGifts: ['Ubi Kayu Panggang', 'Jus Wortel Segar', 'Kue Telur Bolu'],
    tips: 'Paman Arsa sangat terharu jika kamu membawakannya ubi kayu bakar atau kue telur hasil olahan dapur sendiri.',
  },
  {
    id: 'spring_pasture_gala',
    title: 'Pekan Ternak & Pacuan Sahabat',
    season: 'Semi',
    day: 22,
    type: 'festival',
    icon: '🐄',
    locationName: 'Padang Rumput Lembah Karsa',
    timeRange: '09:00 - 18:00',
    description: 'Kontes keindahan dan kesehatan ternak. Sapi berbulu mengkilap dan domba berbulu lebat dipamerkan oleh peternak desa.',
    tips: 'Pastikan rajin membelai, membersihkan, dan memberi makan ternak di tab Ternak agar produk bintang 5!',
  },

  // ==================== MUSIM PANAS ====================
  {
    id: 'summer_beach_open',
    title: 'Pesta Pembukaan Pantai Tropis',
    season: 'Panas',
    day: 1,
    type: 'festival',
    icon: '🏖️',
    locationName: 'Pantai Selatan & Dermaga Karang',
    timeRange: '09:00 - 19:00',
    description: 'Menyambut datangnya musim panas tropis! Alunan musik gamelan pesisir berpadu desau ombak samudra karang.',
    tips: 'Musim panas ideal untuk jagung dan tomat yang tahan sengatan matahari terik.',
  },
  {
    id: 'bday_budi',
    title: 'Ulang Tahun Pandai Budi',
    season: 'Panas',
    day: 7,
    type: 'birthday',
    icon: '🎂',
    locationName: 'Bengkel Pandai Besi',
    timeRange: 'Sepanjang Hari',
    description: 'Hari kelahiran sang pandai besi perkasa Lembah Karsa yang ahli menempa perkakas tembaga, besi, hingga mithril.',
    npcId: 'budi',
    rewardsOrGifts: ['Bijih Mithril', 'Bijih Emas', 'Kristal Jiwa', 'Batu Bara'],
    tips: 'Hadiahkan bijih logam tambang langka dari lereng gunung untuk mempercepat persahabatan!',
  },
  {
    id: 'summer_fishing_derby',
    title: 'Turnamen Memancing Samudra Karang',
    season: 'Panas',
    day: 14,
    type: 'festival',
    icon: '🎣',
    locationName: 'Dermaga Pantai & Teluk Samudra',
    timeRange: '07:00 - 18:00',
    description: 'Lomba akbar pemancing handal! Ikan tuna samudra tropis, kakap merah, dan pari listrik bernilai tinggi berkumpul di sekitar karang.',
    tips: 'Siapkan alat pancing terbaikmu dan gunakan timing tarikan reel pada mini-game memancing.',
  },
  {
    id: 'bday_maya',
    title: 'Ulang Tahun Maya Seniman',
    season: 'Panas',
    day: 20,
    type: 'birthday',
    icon: '🎂',
    locationName: 'Studio Kerajinan & Tenun',
    timeRange: 'Sepanjang Hari',
    description: 'Hari bahagia Maya, perajin kain tenun dan arsitek berjiwa estetik yang menyukai warna-warni bunga dan kunang-kunang.',
    npcId: 'maya',
    rewardsOrGifts: ['Kain Tenun Wol', 'Kunang-Kunang', 'Ikan Legendaris', 'Bunga Liar'],
    tips: 'Tenun wol domba di kompor/alat olah menjadi Kain Tenun Indah untuk hadiah teristimewa bagi Maya.',
  },
  {
    id: 'summer_fireworks',
    title: 'Festival Kembang Api Malam Samudra',
    season: 'Panas',
    day: 24,
    type: 'festival',
    icon: '🎆',
    locationName: 'Tebing Pantai Karang & Patung Moai',
    timeRange: '19:00 - 23:00',
    description: 'Puncak perayaan musim panas! Langit malam pesisir disinari kembang api warna-warni yang memantul di mata air dan laut tropis.',
    tips: 'Ajak bicara warga desa saat malam kembang api untuk membuka dialog hangat bernuansa nostalgia.',
  },

  // ==================== MUSIM GUGUR ====================
  {
    id: 'bday_sari',
    title: 'Ulang Tahun Bu Sari',
    season: 'Gugur',
    day: 3,
    type: 'birthday',
    icon: '🎂',
    locationName: 'Warung Desa Karsa',
    timeRange: 'Sepanjang Hari',
    description: 'Ulang tahun Bu Sari, pemilik warung serba ada yang selalu ceria menyambut warga dengan senyuman hangat.',
    npcId: 'sari',
    rewardsOrGifts: ['Selai Stroberi Manis', 'Stroberi Segar', 'Saus Tomat Gurih', 'Kue Bolu Telur'],
    tips: 'Bu Sari sangat menyukai selai manis buatan sendiri dari buah stroberi segar!',
  },
  {
    id: 'autumn_harvest_fest',
    title: 'Pesta Panen Raya & Festival Memasak',
    season: 'Gugur',
    day: 9,
    type: 'festival',
    icon: '🍲',
    locationName: 'Alun-alun Desa Karsa',
    timeRange: '10:00 - 19:00',
    description: 'Festival termegah musim gugur! Warga bergotong-royong memasak sup desa raksasa di tengah kuali besar alun-alun.',
    tips: 'Bawa sayuran atau jamur berharga jual tinggi untuk dinilai sebagai kontributor sup terbaik!',
  },
  {
    id: 'autumn_dragon_shrine',
    title: 'Ritual Berkat Sang Hyang Naga',
    season: 'Gugur',
    day: 15,
    type: 'festival',
    icon: '🐉',
    locationName: 'Altar Gua Naga Suci',
    timeRange: '12:00 - 21:00',
    description: 'Upacara adat penghormatan kepada roh penjaga tanah Lembah Karsa. Wewangian dupa dan lentera dupa mengalirkan energi kesuburan abadi.',
    tips: 'Persembahkan hasil bumi terbaik di depan altar naga untuk berkah panen berikutnya.',
  },
  {
    id: 'bday_hope',
    title: 'Hari Peringatan Dr. Hope',
    season: 'Gugur',
    day: 21,
    type: 'birthday',
    icon: '🔬',
    locationName: 'Laboratorium Dr. Hope (Innocent Life)',
    timeRange: 'Sepanjang Hari',
    description: 'Peringatan hari kelahiran Dr. Hope, ilmuwan jenius pelindung pulau yang menciptakan rel maglev, kapsul Life, dan teknologi ramah alam.',
    npcId: 'hope',
    rewardsOrGifts: ['Kristal Jiwa Purba', 'Biji Delima Api', 'Batu Safir Air', 'Baterai Kuno'],
    tips: 'Naiki rel maglev dari kebun menuju lab Dr. Hope untuk memeriksa terminal status sains pulau.',
  },
  {
    id: 'autumn_pumpkin_gala',
    title: 'Festival Lentera Labu Emas',
    season: 'Gugur',
    day: 27,
    type: 'festival',
    icon: '🎃',
    locationName: 'Kebun Paman Arsa & Alun-alun',
    timeRange: '18:00 - 23:00',
    description: 'Pesta penutup musim gugur yang semarak. Ratusan labu berukir lentera kuning keemasan menerangi jalan setapak desa.',
    tips: 'Segera panen sisa tanaman musim gugurmu sebelum salju musim dingin menutupi tanah ladang!',
  },

  // ==================== MUSIM DINGIN ====================
  {
    id: 'winter_frost_fest',
    title: 'Pesta Salju & Ukiran Es Pertama',
    season: 'Dingin',
    day: 2,
    type: 'festival',
    icon: '❄️',
    locationName: 'Danau Karsa Membeku',
    timeRange: '09:00 - 17:00',
    description: 'Air Danau Karsa membeku menjadi hamparan es kristal. Warga bermain seluncur dan memahat patung es bertema satwa hutan.',
    tips: 'Tanaman terbuka membeku, gunakan Rumah Kaca (Greenhouse) untuk bercocok tanam sepanjang musim dingin!',
  },
  {
    id: 'winter_aurora_night',
    title: 'Malam Pendaran Aurora Mistis',
    season: 'Dingin',
    day: 10,
    type: 'festival',
    icon: '✨',
    locationName: 'Lereng Gunung & Puncak Swarga',
    timeRange: '19:00 - 02:00',
    description: 'Keajaiban langit malam! Gelombang cahaya hijau zamrud dan ungu berpendar di langit atas pulau, memancarkan pesona visual PS2.',
    tips: 'Waktu terbaik untuk mendaki lereng gunung dan berburu bijih kristal bercahaya di gua tambang.',
  },
  {
    id: 'bday_forte',
    title: 'Hari Aktivasi Drone Forte',
    season: 'Dingin',
    day: 16,
    type: 'birthday',
    icon: '🤖',
    locationName: 'Lab Dr. Hope & Kebun',
    timeRange: 'Sepanjang Hari',
    description: 'Hari pertama drone robot Forte diaktifkan untuk membantu tugas harian, merekam data cuaca, dan menemani petualanganmu.',
    npcId: 'forte',
    rewardsOrGifts: ['Bijih Besi Murni', 'Baterai Kuno', 'Kristal Jiwa', 'Komponen Logam'],
    tips: 'Berikan logam mulia agar sensor dan pendaran lampu cyan di tubuh Forte tetap prima!',
  },
  {
    id: 'winter_star_night',
    title: 'Malam Lilin Berbintang (Starry Eve)',
    season: 'Dingin',
    day: 24,
    type: 'festival',
    icon: '⭐',
    locationName: 'Desa Karsa & Rumah Penduduk',
    timeRange: '18:00 - 24:00',
    description: 'Malam syukuran hening di musim dingin. Lilin-lilin wangi dinyalakan di beranda rumah dan warga berkumpul menikmati sup hangat.',
    tips: 'Kunjungi tetangga desa yang memiliki ikatan persahabatan tinggi untuk hadiah persahabatan istimewa.',
  },
  {
    id: 'winter_new_year',
    title: 'Festival Malam Pergantian Tahun',
    season: 'Dingin',
    day: 28,
    type: 'festival',
    icon: '🎊',
    locationName: 'Alun-alun Desa Karsa',
    timeRange: '20:00 - 06:00',
    description: 'Dentang 108 lonceng kuil desa bergema merayakan tahun yang baru. Warga menyalakan api unggun raksasa menanti musim semi yang kembali.',
    tips: 'Esok hari kalender akan berganti ke Tahun Baru, Musim Semi Hari ke-1!',
  },
];

/**
 * Returns the day of the week name in Indonesian
 * (Day 1 of any season starts on Senin / Monday)
 */
export function getDayOfWeek(day: number): string {
  const index = (day - 1) % 7;
  return DAY_NAMES[index] || 'Senin';
}

export function getDayOfWeekShort(day: number): string {
  const index = (day - 1) % 7;
  return DAY_NAMES_SHORT[index] || 'Sen';
}

/**
 * Returns all events scheduled for a specific season and day
 */
export function getEventsForDay(season: Season, day: number): CalendarEvent[] {
  return CALENDAR_EVENTS.filter((ev) => ev.season === season && ev.day === day);
}

/**
 * Returns all events scheduled for a specific season
 */
export function getEventsForSeason(season: Season): CalendarEvent[] {
  return CALENDAR_EVENTS.filter((ev) => ev.season === season).sort((a, b) => a.day - b.day);
}

/**
 * Returns upcoming events relative to currentSeason and currentDay
 * Tracks forward through seasons up to 1 full year ahead
 */
export function getUpcomingEvents(
  currentSeason: Season,
  currentDay: number,
  currentYear: number,
  maxCount: number = 6
): UpcomingEvent[] {
  const seasonIndex = SEASONS.indexOf(currentSeason);
  const currentTotalDay = seasonIndex * TOTAL_DAYS_PER_SEASON + currentDay;
  const fullYearDays = SEASONS.length * TOTAL_DAYS_PER_SEASON;

  const result: UpcomingEvent[] = [];

  // Check current year & next year events
  for (const ev of CALENDAR_EVENTS) {
    const evSeasonIndex = SEASONS.indexOf(ev.season);
    const evTotalDay = evSeasonIndex * TOTAL_DAYS_PER_SEASON + ev.day;

    let diff = evTotalDay - currentTotalDay;
    let eventYear = currentYear;

    if (diff < 0) {
      // Event is in the next calendar year
      diff += fullYearDays;
      eventYear += 1;
    }

    result.push({
      ...ev,
      daysUntil: diff,
      isToday: diff === 0,
      isTomorrow: diff === 1,
      relativeYear: eventYear,
    });
  }

  // Sort by daysUntil ascending
  result.sort((a, b) => a.daysUntil - b.daysUntil);

  return result.slice(0, maxCount);
}

/**
 * Friendly badge text for countdown
 */
export function formatCountdownBadge(daysUntil: number): { label: string; badgeClass: string } {
  if (daysUntil === 0) {
    return {
      label: 'HARI INI!',
      badgeClass: 'bg-amber-500 text-stone-950 font-black animate-pulse shadow-md shadow-amber-500/40',
    };
  }
  if (daysUntil === 1) {
    return {
      label: 'BESOK!',
      badgeClass: 'bg-orange-500 text-stone-950 font-bold shadow-sm',
    };
  }
  if (daysUntil <= 7) {
    return {
      label: `${daysUntil} hari lagi`,
      badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold',
    };
  }
  return {
    label: `${daysUntil} hari lagi`,
    badgeClass: 'bg-stone-800 text-stone-400 border border-stone-700 font-medium',
  };
}
