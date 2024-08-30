import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Importing Lucide icons
import { Sun, Moon, MapPin, AlertTriangle, Star } from 'lucide-react';

// Styles
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700&display=swap');

  body {
    font-family: 'Space Mono', monospace;
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: #e2e8f0;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background: radial-gradient(circle at center, #1f2937 0%, #111827 100%);
  }

  .clock-container {
    background: linear-gradient(145deg, #1a2233, #0d1117);
    border-radius: 50%;
    padding: 2rem;
    box-shadow: 20px 20px 60px #080b11, -20px -20px 60px #1e2735;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .clock-container:hover {
    transform: scale(1.05);
  }

  .clock {
    position: relative;
    width: 20rem;
    height: 20rem;
    border: 8px solid #4a5568;
    border-radius: 50%;
    background: #0f172a;
  }

  .hand {
    position: absolute;
    bottom: 50%;
    left: 50%;
    transform-origin: 50% 100%;
    border-radius: 9999px;
    transition: transform 0.5s cubic-bezier(0.4, 2.3, 0.3, 1);
  }

  .hour-hand {
    width: 0.5rem;
    height: 6rem;
    background: #60a5fa;
  }

  .minute-hand {
    width: 0.375rem;
    height: 8rem;
    background: #34d399;
  }

  .second-hand {
    width: 0.25rem;
    height: 9rem;
    background: #f472b6;
  }

  .center-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 1rem;
    height: 1rem;
    background: #e2e8f0;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  .time-display {
    margin-top: 2rem;
    text-align: center;
  }

  .time {
    font-family: 'Orbitron', sans-serif;
    font-size: 3rem;
    font-weight: bold;
    color: #60a5fa;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 10px #60a5fa;
  }

  .sun-times, .location {
    font-size: 1rem;
    color: #9ca3af;
    margin-top: 0.5rem;
  }

  .location {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading, .error {
    font-size: 1.5rem;
    color: #9ca3af;
    text-align: center;
  }

  .error {
    color: #ef4444;
    max-width: 80%;
    margin: 2rem auto;
  }

  .constellation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .star {
    position: absolute;
    background: #ffffff;
    border-radius: 50%;
    animation: twinkle 2s infinite alternate;
  }

  @keyframes twinkle {
    0% { opacity: 0.2; }
    100% { opacity: 1; }
  }

  .celestial-body {
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    transition: all 0.5s ease;
  }

  .sun {
    background: radial-gradient(circle at 30% 30%, #fbbf24, #d97706);
    box-shadow: 0 0 20px #fbbf24;
  }

  .moon {
    background: radial-gradient(circle at 30% 30%, #e2e8f0, #94a3b8);
    box-shadow: 0 0 20px #94a3b8;
  }

  @media (max-width: 640px) {
    .clock {
      width: 16rem;
      height: 16rem;
    }
    .time {
      font-size: 2rem;
    }
  }
`;

const VariableHourClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sunrise, setSunrise] = useState(null);
  const [sunset, setSunset] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      } catch (error) {
        console.error("Error getting location:", error);
        setError("Unable to get your location. Using default location (Surat).");
        setLocation({ latitude: 21.17613002631575, longitude: 72.83302877520299 }); // Default to Surat
      }
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchSunTimes = async () => {
      if (location) {
        try {
          const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&formatted=0`);
          if (!response.ok) {
            throw new Error('Failed to fetch sunrise and sunset times');
          }
          const data = await response.json();
          setSunrise(new Date(data.results.sunrise));
          setSunset(new Date(data.results.sunset));
          setLoading(false);
        } catch (error) {
          console.error("Error fetching sun times:", error);
          setError("Failed to fetch sunrise and sunset times. Using approximations.");
          // Fallback to approximate times
          const today = new Date();
          setSunrise(new Date(today.setHours(6, 0, 0)));
          setSunset(new Date(today.setHours(18, 0, 0)));
          setLoading(false);
        }
      }
    };

    if (location) {
      fetchSunTimes();
    }
  }, [location]);

  const calculateVariableHour = () => {
    if (!sunrise || !sunset) return { currentHour: 0, minutesIntoHour: 0, secondsIntoHour: 0, isDaytime: false };

    const now = currentTime.getTime();
    const sunriseTime = sunrise.getTime();
    const sunsetTime = sunset.getTime();

    const isDaytime = now >= sunriseTime && now < sunsetTime;
    const periodStart = isDaytime ? sunriseTime : sunsetTime;
    const periodEnd = isDaytime ? sunsetTime : sunriseTime + 24 * 60 * 60 * 1000;

    const periodDuration = periodEnd - periodStart;
    const timeSincePeriodStart = (now - periodStart + periodDuration) % periodDuration;

    const hourDuration = periodDuration / 12;
    const currentHour = Math.floor(timeSincePeriodStart / hourDuration) + 1;
    const minutesIntoHour = (timeSincePeriodStart % hourDuration) / hourDuration * 60;
    const secondsIntoHour = ((timeSincePeriodStart % hourDuration) / hourDuration * 3600) % 60;

    return { 
      currentHour, 
      minutesIntoHour: Math.floor(minutesIntoHour),
      secondsIntoHour: Math.floor(secondsIntoHour),
      isDaytime
    };
  };

  const { currentHour, minutesIntoHour, secondsIntoHour, isDaytime } = calculateVariableHour();

  const hourRotation = (currentHour / 12) * 360;
  const minuteRotation = (minutesIntoHour / 60) * 360;
  const secondRotation = (secondsIntoHour / 60) * 360;

  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      const size = Math.random() * 3 + 1;
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return <div className="loading">Loading your celestial timepiece...</div>;
  }

  return (
    <div className="container">
      {error && (
        <div className="error">
          <AlertTriangle style={{ marginRight: '0.5rem' }} />
          {error}
        </div>
      )}
      <div className="clock-container">
        <div className="constellation">{generateStars()}</div>
        <div className="clock">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: i % 3 === 0 ? '0.25rem' : '0.125rem',
                height: i % 3 === 0 ? '1rem' : '0.75rem',
                background: '#4a5568',
                transform: `rotate(${i * 30}deg) translateY(-9.75rem)`,
                transformOrigin: '50% 9.75rem',
              }}
            />
          ))}
          <div className="hand hour-hand" style={{ transform: `rotate(${hourRotation}deg)` }} />
          <div className="hand minute-hand" style={{ transform: `rotate(${minuteRotation}deg)` }} />
          <div className="hand second-hand" style={{ transform: `rotate(${secondRotation}deg)` }} />
          <div className="center-dot" />
          <div className={`celestial-body ${isDaytime ? 'sun' : 'moon'}`} />
        </div>
      </div>
      <div className="time-display">
        <p className="time">
          {currentHour}:{minutesIntoHour.toString().padStart(2, '0')}:{secondsIntoHour.toString().padStart(2, '0')} {isDaytime ? 'Day' : 'Night'}
        </p>
        <p className="sun-times">
          Sunrise: {sunrise.toLocaleTimeString()} | Sunset: {sunset.toLocaleTimeString()}
        </p>
        <p className="location">
          <MapPin style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
        </p>
      </div>
    </div>
  );
};

const App = () => (
  <>
    <style>{styles}</style>
    <VariableHourClock />
  </>
);

export default App;
ReactDOM.render(<App />, document.getElementById('root'));