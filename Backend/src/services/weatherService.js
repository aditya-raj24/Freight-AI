const axios = require("axios");

const API_KEY = process.env.WEATHER_API_KEY;

async function getWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    const res = await axios.get(url);

    return {
      temperature: res.data.main.temp,
      rainfall: res.data.rain ? res.data.rain["1h"] || 0 : 0,
      condition: res.data.weather[0].main,
    };
  } catch (error) {
    console.error("Weather error:", error.message);
    return null;
  }
}

module.exports = { getWeather };
