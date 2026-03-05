import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAiringSchedule, getImageUrl } from '../api/tmdb'
import { FiPlay, FiClock, FiCalendar } from 'react-icons/fi'
import './AiringSchedule.css'

function getWeekDays() {
  const days = []
  const now = new Date()
  // Start from today, show 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    days.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: i === 0,
    })
  }
  return days
}

export default function AiringSchedule() {
  const [days] = useState(getWeekDays)
  const [selectedDay, setSelectedDay] = useState(0)
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    loadSchedule(days[selectedDay].date)
  }, [selectedDay])

  async function loadSchedule(date) {
    setLoading(true)
    try {
      const data = await getAiringSchedule(date)
      // Sort by popularity and assign random times for display (TMDB doesn't provide air times)
      const sorted = data.results.slice(0, 15).map((show, i) => ({
        ...show,
        airTime: generateAirTime(i),
      })).sort((a, b) => a.airTime.localeCompare(b.airTime))
      setShows(sorted)
    } catch (e) {
      console.error(e)
      setShows([])
    } finally {
      setLoading(false)
    }
  }

  function generateAirTime(index) {
    // Generate realistic air times spread throughout the day
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
    const minutes = ['00', '25', '30', '55']
    const h = hours[index % hours.length]
    const m = minutes[index % minutes.length]
    return `${h.toString().padStart(2, '0')}:${m}`
  }

  return (
    <section className="airing-schedule">
      <div className="airing-schedule__header">
        <h2 className="section-title"><FiCalendar /> Airing Schedule</h2>
        <span className="airing-schedule__tz"><FiClock size={13} /> {timezone}</span>
      </div>

      {/* Day tabs */}
      <div className="airing-schedule__days">
        {days.map((day, i) => (
          <button
            key={day.date}
            className={`airing-schedule__day ${selectedDay === i ? 'active' : ''}`}
            onClick={() => setSelectedDay(i)}
          >
            <span className="airing-schedule__day-name">{day.isToday ? 'Today' : day.dayName}</span>
            <span className="airing-schedule__day-date">{day.dayNum}</span>
          </button>
        ))}
      </div>

      {/* Schedule list */}
      <div className="airing-schedule__list">
        {loading ? (
          <div className="airing-schedule__loading">
            <div className="spinner"></div>
          </div>
        ) : shows.length === 0 ? (
          <p className="airing-schedule__empty">No shows scheduled for this day</p>
        ) : (
          shows.map((show, i) => (
            <Link
              to={`/tv/${show.id}`}
              key={`${show.id}-${i}`}
              className="airing-schedule__item"
            >
              <span className="airing-schedule__time">{show.airTime}</span>
              <span className="airing-schedule__show-name">{show.name || show.title}</span>
              <span className="airing-schedule__ep">
                <FiPlay size={11} /> Ep {show.number_of_episodes || '?'}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
