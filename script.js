const API_KEY = '2017154fe7161bb8381f0a4c2a3accdd';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const AIR_QUALITY_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

const citySearch = document.getElementById('city-search');
const searchBtn = document.getElementById('search-btn');
const refreshBtn = document.getElementById('refresh-btn');
const currentWeatherSection = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast-section');
const loader = document.getElementById('loader');
const themeToggle = document.getElementById('theme-toggle');
const infoBtn = document.getElementById('info-btn');
const closeModal = document.getElementById('close-modal');
const infoModal = document.getElementById('info-modal');
const pinBtn = document.querySelector('.pin-btn');
const pinnedGrid = document.querySelector('.pinned-grid');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
closeModal.addEventListener('click', () => infoModal.classList.remove('active'));
window.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.remove('active');
});

document.getElementById('date-time').textContent = getCurrentDateTime();

refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('loading');
    const currentCity = document.querySelector('.city-name').textContent.replace('📍', '').trim();
    fetchWeatherData(currentCity);
});

searchBtn.addEventListener('click', () => {
    const cityName = citySearch.value.trim();
    if (cityName) fetchWeatherData(cityName);
});

citySearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityName = citySearch.value.trim();
        if (cityName) fetchWeatherData(cityName);
    }
});

function getCurrentDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options) + ' | ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getWeatherIcon(conditionCode) {
    const iconMap = {
        '01d': 'fas fa-sun', '02d': 'fas fa-cloud-sun', '03d': 'fas fa-cloud', '04d': 'fas fa-cloud',
        '09d': 'fas fa-cloud-showers-heavy', '10d': 'fas fa-cloud-rain', '11d': 'fas fa-bolt',
        '13d': 'fas fa-snowflake', '50d': 'fas fa-smog', '01n': 'fas fa-moon', '02n': 'fas fa-cloud-moon',
        '03n': 'fas fa-cloud', '04n': 'fas fa-cloud', '09n': 'fas fa-cloud-showers-heavy',
        '10n': 'fas fa-cloud-rain', '11n': 'fas fa-bolt', '13n': 'fas fa-snowflake', '50n': 'fas fa-smog'
    };
    return iconMap[conditionCode] || 'fas fa-cloud';
}

function getAQIDescription(aqi) {
    if (aqi <= 50) return { text: 'Good', class: 'aqi-good' };
    if (aqi <= 100) return { text: 'Moderate', class: 'aqi-moderate' };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', class: 'aqi-unhealthy' };
    if (aqi <= 200) return { text: 'Unhealthy', class: 'aqi-very-unhealthy' };
    return { text: 'Hazardous', class: 'aqi-hazardous' };
}

async function fetchWeatherData(city) {
    try {
        loader.style.display = 'block';
        currentWeatherSection.style.opacity = '0.5';
        forecastSection.style.opacity = '0.5';

        const weatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) throw new Error(weatherData.message || 'City not found');

        const aqiResponse = await fetch(`${AIR_QUALITY_URL}?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`);
        const aqiData = await aqiResponse.json();

        updateWeatherUI(weatherData, aqiData);

        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();
        updateForecastUI(forecastData);

    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error('Error fetching weather data:', error);
    } finally {
        loader.style.display = 'none';
        currentWeatherSection.style.opacity = '1';
        forecastSection.style.opacity = '1';
        refreshBtn.classList.remove('loading');
    }
}

function updateWeatherUI(weatherData, aqiData) {
    document.querySelector('.city-name').innerHTML = `<i class="fas fa-location-dot"></i> ${weatherData.name}, ${weatherData.sys.country}`;
    document.querySelector('.temperature').textContent = `${Math.round(weatherData.main.temp)}°C`;
    document.querySelector('.weather-icon i').className = getWeatherIcon(weatherData.weather[0].icon);
    document.querySelector('.weather-description h3').textContent = weatherData.weather[0].main;
    document.querySelector('.weather-description p').textContent = weatherData.weather[0].description;
    document.querySelectorAll('.detail-card .value')[0].textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
    document.querySelectorAll('.detail-card .value')[1].textContent = `${weatherData.main.humidity}%`;
    document.querySelectorAll('.detail-card .value')[2].textContent = `${weatherData.main.pressure} hPa`;

    const aqi = aqiData.list[0].main.aqi;
    const aqiInfo = getAQIDescription(aqi);
    document.querySelectorAll('.detail-card .value')[3].innerHTML = `${aqi} <span class="aqi-badge ${aqiInfo.class}">${aqiInfo.text}</span>`;

    document.getElementById('date-time').textContent = getCurrentDateTime();
}

function updateForecastUI(forecastData) {
    const forecastContainer = document.querySelector('.forecast-container');
    forecastContainer.innerHTML = '';
    const days = {};
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (day !== today && !days[day]) {
            days[day] = {
                day: day,
                temp: Math.round(item.main.temp),
                icon: item.weather[0].icon
            };
        }
    });

    Object.values(days).slice(0, 5).forEach(day => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${day.day}</div>
            <div class="forecast-icon"><i class="${getWeatherIcon(day.icon)}"></i></div>
            <div class="forecast-temp">${day.temp}°C</div>
        `;
        forecastContainer.appendChild(forecastCard);
    });
}

pinBtn.addEventListener('click', () => {
    const cityName = document.querySelector('.city-name').textContent.replace('📍', '').trim();
    const temp = document.querySelector('.temperature').textContent;
    const icon = document.querySelector('.weather-icon i').className;

    const pinnedCities = document.querySelectorAll('.pinned-city-name');
    for (let city of pinnedCities) {
        if (city.textContent === cityName) {
            alert('This city is already pinned!');
            return;
        }
    }

    const newPinnedCity = document.createElement('div');
    newPinnedCity.className = 'pinned-city';
    newPinnedCity.innerHTML = `
        <button class="remove-btn"><i class="fas fa-times"></i></button>
        <div class="pinned-weather-icon"><i class="${icon}"></i></div>
        <div class="pinned-city-info">
            <div class="pinned-city-name">${cityName}</div>
            <div class="pinned-city-temp">${temp}</div>
        </div>
    `;
    pinnedGrid.appendChild(newPinnedCity);

    newPinnedCity.querySelector('.remove-btn').addEventListener('click', () => {
        newPinnedCity.remove();
    });
});
