import { useState, useEffect } from 'react';
import { api } from './api.js';

export function useDebounce(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

export function useFetch(path) {
  const [s, setS] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let live = true;
    setS(x => ({ ...x, loading: true }));
    api(path)
      .then(data => live && setS({ data, loading: false, error: null }))
      .catch(e => live && setS({ data: null, loading: false, error: e.message }));
    return () => { live = false; };
  }, [path]);
  return s;
}

// Live weather from Open-Meteo (free, no key)
export function useWeather(city) {
  const [s, setS] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!city.trim()) return;
    let live = true;
    setS({ data: null, loading: true, error: null });
    (async () => {
      try {
        const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)).json();
        const p = g.results?.[0];
        if (!p) throw new Error('City not found');
        const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`)).json();
        live && setS({ data: { place: p.name, ...w }, loading: false, error: null });
      } catch (e) { live && setS({ data: null, loading: false, error: e.message }); }
    })();
    return () => { live = false; };
  }, [city]);
  return s;
}
