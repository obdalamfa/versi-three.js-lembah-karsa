// Interactive 28-Day Seasonal Calendar & Events Tracker (Harvest Moon / Innocent Life style)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Season, GameState, CalendarEvent, UpcomingEvent } from '../types/game';
import {
  SEASONS,
  SEASON_THEMES,
  DAY_NAMES,
  DAY_NAMES_SHORT,
  TOTAL_DAYS_PER_SEASON,
  getDayOfWeek,
  getEventsForDay,
  getEventsForSeason,
  getUpcomingEvents,
  formatCountdownBadge,
} from '../data/calendarData';
import { sound } from '../systems/sound';
import {
  Calendar as CalendarIcon,
  Sparkles,
  MapPin,
  Clock,
  Gift,
  PartyPopper,
  Info,
  ChevronRight,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Heart,
  ChevronLeft,
} from 'lucide-react';

interface CalendarViewProps {
  time: GameState['time'];
  npcs: GameState['npcs'];
  onSelectNpcTab?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ time, npcs, onSelectNpcTab }) => {
  // Season currently being viewed in the calendar (defaults to in-game current season)
  const [viewSeason, setViewSeason] = useState<Season>(time.season);
  // Day selected for inspection (defaults to current day if viewing current season, else day 1)
  const [selectedDay, setSelectedDay] = useState<number>(time.day);

  const theme = SEASON_THEMES[viewSeason];
  const isViewingCurrentSeason = viewSeason === time.season;

  // Events for the selected day in viewSeason
  const dayEvents = getEventsForDay(viewSeason, selectedDay);

  // Upcoming events from current in-game time
  const upcomingEvents = getUpcomingEvents(time.season, time.day, time.year, 6);

  const handleDayClick = (day: number) => {
    sound.playClick();
    setSelectedDay(day);
  };

  const handleSeasonChange = (season: Season) => {
    sound.playClick();
    setViewSeason(season);
    if (season === time.season) {
      setSelectedDay(time.day);
    } else {
      setSelectedDay(1);
    }
  };

  const handleJumpToToday = () => {
    sound.playClick();
    setViewSeason(time.season);
    setSelectedDay(time.day);
  };

  const handleSelectUpcomingEvent = (ev: UpcomingEvent) => {
    sound.playClick();
    setViewSeason(ev.season);
    setSelectedDay(ev.day);
  };

  const getWeatherIcon = () => {
    switch (time.weather) {
      case 'Hujan':
        return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
      case 'Badai':
        return <CloudLightning className="w-3.5 h-3.5 text-purple-400" />;
      case 'Bersalju':
        return <Snowflake className="w-3.5 h-3.5 text-cyan-200" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Seasonal farm guidance tips for days without festivals
  const getDailyFarmAdvice = (season: Season, day: number) => {
    if (season === 'Semi') {
      return {
        title: 'Musim Semi: Tunas & Kesuburan',
        desc: 'Hari yang ideal untuk menanam lobak, stroberi, dan kentang. Siram tanah di pagi hari sebelum jam 12 siang terik agar tunas berkembang subur.',
        tip: 'Jaga ternak tetap terawat untuk produksi susu dan wol berkualitas tinggi.',
      };
    }
    if (season === 'Panas') {
      return {
        title: 'Musim Panas: Terik Tropis',
        desc: 'Tanaman jagung, tomat, dan nanas sangat menyukai sinar matahari terik. Waspadai cuaca badai pesisir tropis.',
        tip: 'Perbanyak memancing di dermaga pantai karang untuk menangkap tuna dan pari listrik bernilai tinggi.',
      };
    }
    if (season === 'Gugur') {
      return {
        title: 'Musim Gugur: Panen Raya Lembah',
        desc: 'Musim keemasan untuk memanen ubi kayu, labu, dan terong. Jamur hutan juga tumbuh subur di lereng gunung.',
        tip: 'Olah hasil panen menjadi selai, saus, atau hidangan di kompor dapur untuk nilai jual lebih tinggi.',
      };
    }
    return {
      title: 'Musim Dingin: Salju & Es',
      desc: 'Lahan luar membeku dan tanaman berhenti tumbuh. Gunakan Rumah Kaca (Greenhouse) untuk menanam sayur sepanjang musim.',
      tip: 'Waktu terbaik menjelajahi gua tambang, mengumpulkan bijih mithril, dan mengunjungi warga desa.',
    };
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top Header Card: Current Game Date + Season Switcher */}
      <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        {/* Left: Current In-Game Time State */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
            {SEASON_THEMES[time.season].icon}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">
                Tahun ke-{time.year} • {time.season}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-extrabold text-amber-300">
                HARI KE-{time.day}
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-300 text-xs mt-0.5 font-medium">
              <span>{getDayOfWeek(time.day)}</span>
              <span>•</span>
              <span className="font-mono text-stone-200">
                {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {getWeatherIcon()} {time.weather}
              </span>
            </div>
          </div>
        </div>

        {/* Right: 4 Seasons Tabs & Jump to Today Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SEASONS.map((s) => {
            const isCurrent = time.season === s;
            const isSelected = viewSeason === s;
            const sTheme = SEASON_THEMES[s];

            return (
              <button
                key={s}
                onClick={() => handleSeasonChange(s)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? `${sTheme.activeTabBg} shadow-md`
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800'
                }`}
              >
                <span>{sTheme.icon}</span>
                <span>{sTheme.name}</span>
                {isCurrent && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-stone-950 animate-ping' : 'bg-amber-400'
                    }`}
                    title="Musim saat ini di permainan"
                  />
                )}
              </button>
            );
          })}

          {(!isViewingCurrentSeason || selectedDay !== time.day) && (
            <button
              onClick={handleJumpToToday}
              className="px-2.5 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 text-xs font-bold transition flex items-center gap-1 shadow-sm"
              title="Kembali ke hari dan musim saat ini"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hari Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Left (28-Day Grid) & Right (Inspector & Upcoming) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Side: 28-Day Calendar Grid (7 cols lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col bg-stone-950/70 p-3.5 sm:p-4 rounded-3xl border border-stone-800 shadow-xl">
          {/* Season Header Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-800/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{theme.icon}</span>
              <div>
                <h3 className={`text-base font-black tracking-wide ${theme.textColor}`}>
                  {theme.name} ({theme.english})
                </h3>
                <p className="text-[11px] text-stone-400">{theme.tagline}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-stone-400 bg-stone-900 px-2.5 py-1 rounded-full border border-stone-800">
              28 Hari / Musim
            </span>
          </div>

          {/* 7 Days of the Week Header */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {DAY_NAMES_SHORT.map((name, i) => (
              <div
                key={name}
                className={`text-[11px] font-bold py-1 rounded-lg ${
                  i === 5 || i === 6
                    ? 'text-rose-400/80 bg-rose-950/20'
                    : 'text-stone-400 bg-stone-900/40'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* 28 Day Cells Grid (4 rows of 7) */}
          <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
            {Array.from({ length: TOTAL_DAYS_PER_SEASON }, (_, i) => i + 1).map((day) => {
              const isToday = isViewingCurrentSeason && day === time.day;
              const isPast =
                (viewSeason === time.season && day < time.day) ||
                SEASONS.indexOf(viewSeason) < SEASONS.indexOf(time.season);
              const isSelected = selectedDay === day;
              const events = getEventsForDay(viewSeason, day);
              const hasFestival = events.some((e) => e.type === 'festival');
              const hasBirthday = events.some((e) => e.type === 'birthday');

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between transition group text-left border overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/40 shadow-lg ring-2 ring-amber-400/50'
                      : isToday
                      ? 'border-amber-500/80 bg-gradient-to-b from-amber-950/40 to-stone-900 shadow-md shadow-amber-950/50'
                      : isPast
                      ? 'border-stone-800/60 bg-stone-900/30 text-stone-500 hover:border-stone-700 hover:bg-stone-900/60'
                      : 'border-stone-800 bg-stone-900/70 hover:border-stone-700 hover:bg-stone-800/90'
                  }`}
                >
                  {/* Top: Day Number & Indicators */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black font-mono ${
                        isToday
                          ? 'text-amber-300 font-extrabold'
                          : isSelected
                          ? 'text-white'
                          : isPast
                          ? 'text-stone-500'
                          : 'text-stone-200'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Today Pill Badge */}
                    {isToday && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 uppercase tracking-tighter scale-90 sm:scale-100">
                        INI
                      </span>
                    )}

                    {/* Quick Event Dot if space is tight */}
                    {!isToday && events.length > 0 && (
                      <span className="flex items-center gap-0.5 text-xs">
                        {hasFestival && <span>🎉</span>}
                        {hasBirthday && <span>🎂</span>}
                      </span>
                    )}
                  </div>

                  {/* Bottom: Event Mini Badges */}
                  <div className="flex flex-col gap-1 w-full mt-1">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-1 truncate ${
                          ev.type === 'festival'
                            ? 'bg-gradient-to-r from-amber-600/40 to-emerald-600/40 border border-amber-500/50 text-amber-200'
                            : 'bg-gradient-to-r from-rose-600/40 to-pink-600/40 border border-rose-500/50 text-rose-200'
                        }`}
                        title={ev.title}
                      >
                        <span className="shrink-0">{ev.icon}</span>
                        <span className="truncate hidden sm:inline">{ev.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Highlight Glow for selected day */}
                  {isSelected && (
                    <div className="absolute inset-0 pointer-events-none border border-amber-400/40 rounded-2xl" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Grid Legend */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-800 text-[11px] text-stone-400 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300" />
                <span>Hari Ini</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-xs">🎉</span>
                <span>Festival Desa</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-xs">🎂</span>
                <span>Ulang Tahun Warga</span>
              </span>
            </div>
            <span className="text-stone-500 text-[10px]">Klik tanggal mana pun untuk membaca detail acara</span>
          </div>
        </div>

        {/* Right Side: Day Inspector + Upcoming Events List (5 cols lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto">
          {/* 1. Selected Day Inspector Card */}
          <div className="bg-stone-950/80 p-4 rounded-3xl border border-stone-800 shadow-xl flex flex-col gap-3">
            {/* Header: Date and Tags */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{theme.icon}</span>
                  <h4 className="font-extrabold text-sm text-stone-100">
                    {viewSeason}, Hari ke-{selectedDay}
                  </h4>
                </div>
                <span className="text-xs text-stone-400 font-medium">
                  {getDayOfWeek(selectedDay)} • Minggu ke-{Math.ceil(selectedDay / 7)}
                </span>
              </div>

              {isViewingCurrentSeason && selectedDay === time.day ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] tracking-wide shadow-md shadow-amber-500/30">
                  SEDANG BERLANGSUNG
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-400 text-[10px] font-mono">
                  {isViewingCurrentSeason && selectedDay > time.day
                    ? `Dalam ${selectedDay - time.day} hari`
                    : isViewingCurrentSeason && selectedDay < time.day
                    ? `${time.day - selectedDay} hari lalu`
                    : 'Kalender'}
                </span>
              )}
            </div>

            {/* Events Content or Regular Farming Day */}
            {dayEvents.length > 0 ? (
              <div className="flex flex-col gap-3">
                {dayEvents.map((ev) => {
                  const npc = ev.npcId ? npcs[ev.npcId] : null;

                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 ${
                        ev.type === 'festival'
                          ? 'bg-amber-950/20 border-amber-600/40 shadow-inner'
                          : 'bg-rose-950/20 border-rose-600/40 shadow-inner'
                      }`}
                    >
                      {/* Event Title & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{ev.icon}</span>
                          <div>
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                                ev.type === 'festival' ? 'text-amber-400' : 'text-rose-400'
                              }`}
                            >
                              {ev.type === 'festival' ? 'Festival Lembah Karsa' : 'Ulang Tahun Warga'}
                            </span>
                            <h5 className="font-bold text-sm text-stone-100">{ev.title}</h5>
                          </div>
                        </div>
                      </div>

                      {/* Time and Location Pills */}
                      <div className="flex items-center gap-2 text-[11px] text-stone-300 flex-wrap">
                        {ev.locationName && (
                          <span className="flex items-center gap-1 bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-700/60">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{ev.locationName}</span>
                          </span>
                        )}
                        {ev.timeRange && (
                          <span className="flex items-center gap-1 bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-700/60 font-mono">
                            <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{ev.timeRange}</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/40 p-2.5 rounded-xl border border-stone-800/80">
                        {ev.description}
                      </p>

                      {/* NPC Birthday Details: Avatar, Friendship Hearts, and Loved Gifts */}
                      {npc && (
                        <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{npc.avatar}</span>
                              <div>
                                <span className="font-bold text-xs text-stone-100 block">
                                  {npc.name}
                                </span>
                                <span className="text-[10px] text-stone-400">{npc.role}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Heart
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < npc.hearts
                                      ? 'text-rose-500 fill-rose-500'
                                      : 'text-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Loved Gifts List */}
                          {ev.rewardsOrGifts && ev.rewardsOrGifts.length > 0 && (
                            <div>
                              <span className="text-[10px] font-semibold text-rose-300 flex items-center gap-1 mb-1">
                                <Gift className="w-3 h-3 text-rose-400" /> Hadiah Kesukaan {npc.name}:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {ev.rewardsOrGifts.map((gift) => (
                                  <span
                                    key={gift}
                                    className="px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-800/60 text-[10px] text-rose-200 font-medium"
                                  >
                                    🎁 {gift}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tips */}
                      {ev.tips && (
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-200/90 bg-amber-950/30 p-2 rounded-lg border border-amber-800/40">
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{ev.tips}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Regular Day without major events */
              <div className="flex flex-col gap-2.5 py-1">
                {(() => {
                  const advice = getDailyFarmAdvice(viewSeason, selectedDay);
                  return (
                    <div className="bg-stone-900/50 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{advice.title}</span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{advice.desc}</p>
                      <div className="mt-1 p-2 rounded-xl bg-stone-900 border border-stone-800 text-[11px] text-stone-400">
                        💡 <strong className="text-stone-300">Saran Aktivitas:</strong> {advice.tip}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 2. Upcoming Events List Card */}
          <div className="bg-stone-950/80 p-4 rounded-3xl border border-stone-800 shadow-xl flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-xs text-stone-200 uppercase tracking-wider">
                  Agenda Acara Mendatang
                </h4>
              </div>
              <span className="text-[10px] text-stone-500 font-medium">Urutan Waktu</span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
              {upcomingEvents.map((ev) => {
                const countdown = formatCountdownBadge(ev.daysUntil);
                const isSelectedEv = viewSeason === ev.season && selectedDay === ev.day;

                return (
                  <button
                    key={`${ev.id}-${ev.relativeYear}`}
                    onClick={() => handleSelectUpcomingEvent(ev)}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between text-left transition ${
                      isSelectedEv
                        ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400/40'
                        : 'bg-stone-900/60 border-stone-800 hover:bg-stone-900 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{ev.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-stone-100 truncate">
                          {ev.title}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {ev.season} Hari ke-{ev.day} ({getDayOfWeek(ev.day)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${countdown.badgeClass}`}>
                        {countdown.label}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
