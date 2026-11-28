const axios = require('axios');

// Timeout for each external call. Override to test, e.g. WEATHER_TIMEOUT_MS=1
const TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS) || 5000;

// ---------- Extended 1: in-memory cache (Map) with a 5-minute TTL ----------
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key: lowercase city -> { data, expiresAt }

function getFromCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key); // expired
        return null;
    }
    return entry.data;
}

function saveToCache(key, data) {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------- Extended 4: retry once, but never for a 404 ----------
async function withRetry(fn, label) {
    try {
        return await fn();
    } catch (error) {
        if (error.status === 404) throw error; // city not found would fail again
        console.log(`Call for "${label}" failed (${error.code || error.message}), retrying once...`);
        return await fn();
    }
}

// ---------- External API calls ----------
async function getCoordinatesForCity(city) {
    const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: { name: city, count: 1 },
        timeout: TIMEOUT_MS
    });

    const result = response.data.results && response.data.results[0];
    if (!result) {
        const err = new Error(`City "${city}" was not found`);
        err.status = 404;
        throw err;
    }
    return { latitude: result.latitude, longitude: result.longitude, resolvedName: result.name };
}

async function fetchWeatherFromApi(city) {
    const { latitude, longitude, resolvedName } = await getCoordinatesForCity(city);

    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: { latitude, longitude, current_weather: true },
        timeout: TIMEOUT_MS
    });

    const current = response.data.current_weather;
    return {
        city: resolvedName,
        temperatureC: current.temperature,
        windSpeedKmh: current.windspeed,
        observedAt: current.time
    };
}

// ---------- Public function ----------
async function getCurrentWeather(city) {
    const key = city.trim().toLowerCase();

    const cached = getFromCache(key);
    if (cached) {
        console.log(`Cache hit for city: ${city}`);
        return cached;
    }

    // Extended 3: measure how long the external calls take
    const start = Date.now();
    try {
        const weather = await withRetry(() => fetchWeatherFromApi(city), city);
        saveToCache(key, weather); // only successful results are cached
        return weather;
    } finally {
        console.log(`External API call for "${city}" took ${Date.now() - start}ms`);
    }
}

module.exports = { getCurrentWeather };
