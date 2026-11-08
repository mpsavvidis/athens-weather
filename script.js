// Συντεταγμένες πόλεων
const CITIES = {
    athens: { name: 'Αθήνα', lat: 37.9838, lon: 23.7275 },
    veria: { name: 'Βέροια', lat: 40.5238, lon: 22.2024 }
};

// Αντιστοίχηση Weather Codes σε emojis & περιγραφές
function getWeatherDetails(code) {
    if (code === 0) return { icon: '☀️', desc: 'Ηλιοφάνεια' };
    if (code >= 1 && code <= 3) return { icon: '⛅', desc: 'Λίγα σύννεφα' };
    if (code >= 45 && code <= 48) return { icon: '🌫️', desc: 'Ομίχλη' };
    if (code >= 51 && code <= 67) return { icon: '🌧️', desc: 'Βροχόπτωση' };
    if (code >= 71 && code <= 77) return { icon: '❄️', desc: 'Χιονοπτώσεις' };
    if (code >= 95) return { icon: '⚡', desc: 'Καταιγίδα' };
    return { icon: '☁️', desc: 'Συννεφιά' };
}

// Ασφαλής μετατροπή ISO string σε Date object
function parseISODate(dateStr) {
    if (!dateStr) return new Date();
    return new Date(dateStr);
}

// Υπολογισμός μέσης θερμοκρασίας για συγκεκριμένο εύρος ωρών
function getAverageTempForRange(hourlyTimes, hourlyTemps, startHour, endHour) {
    if (!hourlyTimes || !hourlyTemps) return null;
    let sum = 0;
    let count = 0;
    const now = new Date();
    const todayDay = now.getDate();

    for (let i = 0; i < hourlyTimes.length; i++) {
        const d = parseISODate(hourlyTimes[i]);
        const hour = d.getHours();
        const day = d.getDate();

        if (day === todayDay && hour >= startHour && hour <= endHour) {
            sum += hourlyTemps[i];
            count++;
        }
    }
    return count > 0 ? sum / count : null;
}

// Παραγωγή πρότασης ενδύματος ανά θερμοκρασία
function getSpecificOutfit(temp) {
    if (temp === null || isNaN(temp)) {
        return { woman: "Ελαφρύ τζάκετ ή ζακέτα.", man: "Ζακέτα ή ελαφρύ μπουφάν." };
    }

    if (temp < 10) {
        return {
            woman: "Βαρύ παλτό, μάλλινο κασκόλ και μπότες.",
            man: "Χοντρό μπουφάν, σκούφος και ισοθερμικό."
        };
    } else if (temp >= 10 && temp < 16) {
        return {
            woman: "Ζεστό πουλόβερ με καμπαρντίνα ή τζάκετ.",
            man: "Μπουφάν, φούτερ και τζιν παντελόνι."
        };
    } else if (temp >= 16 && temp < 22) {
        return {
            woman: "Ελαφρύ ζακετάκι, μπλούζα και άνετο παντελόνι.",
            man: "Πουκάμισο ή ζακέτα με t-shirt."
        };
    } else {
        return {
            woman: "Δροσερό t-shirt, ελαφριά φούστα ή παντελόνι.",
            man: "T-shirt με ελαφρύ υφασμάτινο παντελόνι."
        };
    }
}

async function fetchWeather(cityKey) {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    const city = CITIES[cityKey] || CITIES.athens;
    // Χρήση ρητού timezone Europe/Athens αντί για auto
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=time,temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FAthens`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Σφάλμα δικτύου: ${response.status}`);
        }
        
        const data = await response.json();

        // 1. Ημερομηνία & Ημέρα (Ελληνικά)
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = now.toLocaleDateString('el-GR', options);

        // 2. Τρέχουσα Θερμοκρασία, Εικονίδιο, Υγρασία
        if (data.current) {
            const currentTemp = Math.round(data.current.temperature_2m);
            const currentHumidity = data.current.relative_humidity_2m;
            const currentWeatherCode = data.current.weather_code;

            document.getElementById('current-temp').innerText = `${currentTemp}°`;
            document.getElementById('humidity').innerText = `Υγρασία: ${currentHumidity}%`;
            
            const currentDetails = getWeatherDetails(currentWeatherCode);
            document.getElementById('weather-icon').innerText = currentDetails.icon;
        }

        // 3. Ωριαία πρόβλεψη από την τρέχουσα ώρα έως τις 05:00 π.μ. της επόμενης ημέρας
        const hourlyContainer = document.getElementById('hourly-container');
        hourlyContainer.innerHTML = '';

        if (data.hourly && data.hourly.time) {
            const times = data.hourly.time;
            const temps = data.hourly.temperature_2m;
            const codes = data.hourly.weather_code;

            const limitDate = new Date(now);
            limitDate.setDate(limitDate.getDate() + 1);
            limitDate.setHours(5, 0, 0, 0);

            for (let i = 0; i < times.length; i++) {
                const forecastDate = parseISODate(times[i]);

                if (forecastDate >= now && forecastDate <= limitDate) {
                    const forecastHour = forecastDate.getHours();
                    const details = getWeatherDetails(codes[i]);
                    
                    const item = document.createElement('div');
                    item.className = 'hourly-item';
                    item.innerHTML = `
                        <div class="hourly-time">${forecastHour < 10 ? '0' + forecastHour : forecastHour}:00</div>
                        <div class="hourly-icon">${details.icon}</div>
                        <div class="hourly-temp">${Math.round(temps[i])}°</div>
                    `;
                    hourlyContainer.appendChild(item);
                }
            }

            // 4. Προτάσεις ντυσίματος ανά περίοδο
            const currTemp = data.current ? Math.round(data.current.temperature_2m) : 18;
            const morningTemp = getAverageTempForRange(times, temps, 7, 10) ?? currTemp;
            const noonTemp = getAverageTempForRange(times, temps, 12, 15) ?? currTemp;
            const eveningTemp = getAverageTempForRange(times, temps, 19, 22) ?? currTemp;

            const morningOutfit = getSpecificOutfit(morningTemp);
            const noonOutfit = getSpecificOutfit(noonTemp);
            const eveningOutfit = getSpecificOutfit(eveningTemp);

            // Πίνακας Άντρα (Αριστερά)
            document.getElementById('man-morning').innerText = morningOutfit.man;
            document.getElementById('man-noon').innerText = noonOutfit.man;
            document.getElementById('man-evening').innerText = eveningOutfit.man;

            // Πίνακας Γυναίκας (Δεξιά)
            document.getElementById('woman-morning').innerText = morningOutfit.woman;
            document.getElementById('woman-noon').innerText = noonOutfit.woman;
            document.getElementById('woman-evening').innerText = eveningOutfit.woman;
        }

        // 5. Πρόβλεψη Επόμενης Μέρας
        if (data.daily && data.daily.temperature_2m_max) {
            const tomorrowMax = Math.round(data.daily.temperature_2m_max[1]);
            const tomorrowMin = Math.round(data.daily.temperature_2m_min[1]);
            const tomorrowCode = data.daily.weather_code[1];
            const tomorrowDetails = getWeatherDetails(tomorrowCode);

            const tomorrowDate = new Date();
            tomorrowDate.setDate(now.getDate() + 1);
            const tomorrowDayName = tomorrowDate.toLocaleDateString('el-GR', { weekday: 'long' });

            document.getElementById('tomorrow-day').innerText = tomorrowDayName;
            document.getElementById('tomorrow-temp').innerText = `${tomorrowMax}° / ${tomorrowMin}°`;
            document.getElementById('tomorrow-desc').innerText = tomorrowDetails.desc;
            document.getElementById('tomorrow-icon').innerText = tomorrowDetails.icon;
        }

    } catch (error) {
        console.error('Σφάλμα κατά τη λήψη δεδομένων καιρού:', error);
        document.getElementById('current-date').innerText = 'Αποτυχία φόρτωσης δεδομένων';
    } finally {
        if (refreshBtn) {
            setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
        }
    }
}

// Διαχείριση επιλογής πόλης με αποθήκευση στο localStorage
const citySelect = document.getElementById('city-select');
const savedCity = localStorage.getItem('selected_city') || 'athens';

if (citySelect) {
    citySelect.value = savedCity;
    citySelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        localStorage.setItem('selected_city', selected);
        fetchWeather(selected);
    });
}

// Εκτέλεση κατά την εκκίνηση
fetchWeather(savedCity);

// Event Listener για το κουμπί Ανανέωσης
const refreshButton = document.getElementById('refresh-btn');
if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        const selectedCity = citySelect ? citySelect.value : 'athens';
        fetchWeather(selectedCity);
    });
}