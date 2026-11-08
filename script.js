const CITIES = {
    athens: { lat: 37.9838, lon: 23.7275 },
    veria: { lat: 40.5238, lon: 22.2024 }
};

function getWeatherDetails(code) {
    if (code === 0) return { icon: '☀️', desc: 'Ηλιοφάνεια' };
    if (code >= 1 && code <= 3) return { icon: '⛅', desc: 'Λίγα σύννεφα' };
    if (code >= 45 && code <= 48) return { icon: '🌫️', desc: 'Ομίχλη' };
    if (code >= 51 && code <= 67) return { icon: '🌧️', desc: 'Βροχόπτωση' };
    if (code >= 71 && code <= 77) return { icon: '❄️', desc: 'Χιόνι' };
    if (code >= 95) return { icon: '⚡', desc: 'Καταιγίδα' };
    return { icon: '☁️', desc: 'Συννεφιά' };
}

// Ασφαλής μετατροπή ημερομηνίας
function parseSafeDate(dateStr) {
    if (!dateStr) return new Date();
    return new Date(dateStr);
}

function getSpecificOutfit(temp) {
    if (temp === null || isNaN(temp)) return { woman: "Ζακέτα.", man: "Μπουφάν." };
    if (temp < 10) return { woman: "Βαρύ παλτό, κασκόλ, μπότες.", man: "Χοντρό μπουφάν, σκούφος." };
    if (temp >= 10 && temp < 16) return { woman: "Πουλόβερ, καμπαρντίνα.", man: "Μπουφάν, φούτερ, τζιν." };
    if (temp >= 16 && temp < 22) return { woman: "Ελαφρύ ζακετάκι, παντελόνι.", man: "Πουκάμισο ή ζακέτα." };
    return { woman: "T-shirt, ελαφριά φούστα ή παντελόνι.", man: "T-shirt, ελαφρύ παντελόνι." };
}

function getAverageTemp(times, temps, startHour, endHour) {
    if (!times || !temps) return null;
    let sum = 0, count = 0;
    const today = new Date().getDate();

    for (let i = 0; i < times.length; i++) {
        const d = parseSafeDate(times[i]);
        if (d.getDate() === today && d.getHours() >= startHour && d.getHours() <= endHour) {
            sum += temps[i];
            count++;
        }
    }
    return count > 0 ? Math.round(sum / count) : null;
}

async function fetchWeather(cityKey) {
    const refreshBtn = document.getElementById('refresh-btn');
    const dateLabel = document.getElementById('current-date');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    const city = CITIES[cityKey] || CITIES.athens;
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FAthens`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Σφάλμα API: " + response.status);
        const data = await response.json();

        // 1. Ημερομηνία
        const now = new Date();
        dateLabel.innerText = now.toLocaleDateString('el-GR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // 2. Τρέχουσες Συνθήκες
        if (data.current) {
            document.getElementById('current-temp').innerText = `${Math.round(data.current.temperature_2m)}°`;
            document.getElementById('humidity').innerText = `Υγρασία: ${data.current.relative_humidity_2m}%`;
            document.getElementById('weather-icon').innerText = getWeatherDetails(data.current.weather_code).icon;
        }

        // 3. Ωριαία (έως 05:00)
        const hourlyContainer = document.getElementById('hourly-container');
        hourlyContainer.innerHTML = '';
        
        if (data.hourly && data.hourly.time) {
            const limitDate = new Date(now);
            limitDate.setDate(limitDate.getDate() + 1);
            limitDate.setHours(5, 0, 0, 0);

            for (let i = 0; i < data.hourly.time.length; i++) {
                const fDate = parseSafeDate(data.hourly.time[i]);
                if (fDate >= now && fDate <= limitDate) {
                    const h = fDate.getHours();
                    const details = getWeatherDetails(data.hourly.weather_code[i]);
                    
                    const item = document.createElement('div');
                    item.className = 'hourly-item';
                    item.innerHTML = `<div class="hourly-time">${h < 10 ? '0'+h : h}:00</div>
                                      <div class="hourly-icon">${details.icon}</div>
                                      <div class="hourly-temp">${Math.round(data.hourly.temperature_2m[i])}°</div>`;
                    hourlyContainer.appendChild(item);
                }
            }

            // 4. Ντύσιμο
            const currT = data.current ? Math.round(data.current.temperature_2m) : 18;
            const mT = getAverageTemp(data.hourly.time, data.hourly.temperature_2m, 7, 10) ?? currT;
            const nT = getAverageTemp(data.hourly.time, data.hourly.temperature_2m, 12, 15) ?? currT;
            const eT = getAverageTemp(data.hourly.time, data.hourly.temperature_2m, 19, 22) ?? currT;

            const mOut = getSpecificOutfit(mT), nOut = getSpecificOutfit(nT), eOut = getSpecificOutfit(eT);
            
            document.getElementById('man-morning').innerText = mOut.man;
            document.getElementById('man-noon').innerText = nOut.man;
            document.getElementById('man-evening').innerText = eOut.man;
            
            document.getElementById('woman-morning').innerText = mOut.woman;
            document.getElementById('woman-noon').innerText = nOut.woman;
            document.getElementById('woman-evening').innerText = eOut.woman;
        }

        // 5. Αύριο
        if (data.daily && data.daily.temperature_2m_max) {
            const tomorrowDate = new Date(now);
            tomorrowDate.setDate(now.getDate() + 1);
            const tomorrowDetails = getWeatherDetails(data.daily.weather_code[1]);

            document.getElementById('tomorrow-day').innerText = tomorrowDate.toLocaleDateString('el-GR', { weekday: 'long' });
            document.getElementById('tomorrow-temp').innerText = `${Math.round(data.daily.temperature_2m_max[1])}° / ${Math.round(data.daily.temperature_2m_min[1])}°`;
            document.getElementById('tomorrow-desc').innerText = tomorrowDetails.desc;
            document.getElementById('tomorrow-icon').innerText = tomorrowDetails.icon;
        }

    } catch (error) {
        console.error(error);
        dateLabel.innerText = "Σφάλμα: " + error.message; // Τώρα θα μας δείξει τι ακριβώς φταίει
    } finally {
        if (refreshBtn) setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    }
}

// Εκκίνηση
const citySelect = document.getElementById('city-select');
const savedCity = localStorage.getItem('selected_city') || 'athens';

if (citySelect) {
    citySelect.value = savedCity;
    citySelect.addEventListener('change', (e) => {
        localStorage.setItem('selected_city', e.target.value);
        fetchWeather(e.target.value);
    });
}

document.getElementById('refresh-btn')?.addEventListener('click', () => fetchWeather(citySelect.value));
fetchWeather(savedCity);