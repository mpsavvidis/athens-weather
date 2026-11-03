// Δεδομένα καιρού Αθήνας μέσω Open-Meteo API
const LAT = 37.9838;
const LON = 23.7275;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

// Αντιστοίχηση Weather Codes σε emojis & περιγραφές
function getWeatherDetails(code) {
    // WMO Weather interpretation codes
    if (code === 0) return { icon: '☀️', desc: 'Ηλιοφάνεια' };
    if (code >= 1 && code <= 3) return { icon: '⛅', desc: 'Λίγα σύννεφα' };
    if (code >= 45 && code <= 48) return { icon: '🌫️', desc: 'Ομίχλη' };
    if (code >= 51 && code <= 67) return { icon: '🌧️', desc: 'Βροχόπτωση' };
    if (code >= 71 && code <= 77) return { icon: '❄️', desc: 'Χιόνι' };
    if (code >= 95) return { icon: '⚡', desc: 'Καταιγίδα' };
    return { icon: '☁️', desc: 'Συννεφιά' };
}

// Δυναμικές προτάσεις ντυσίματος με βάση τη θερμοκρασία και την ώρα
function getOutfitSuggestions(temp, hour) {
    let woman = "";
    let man = "";

    if (temp < 12) {
        woman = "Βαρύ παλτό, κασκόλ και κλειστά παπούτσια. Ιδανικά μάλλινο πουλόβερ.";
        man = "Χοντρό μπουφάν ή παλτό, σκούφος και μακρύ παντελόνι.";
    } else if (temp >= 12 && temp < 18) {
        if (hour >= 18 || hour < 9) {
            woman = "Ελαφρύ τζάκετ ή καμπαρντίνα με πουλόβερ και τζιν.";
            man = "Μπουφάν τύπου bomber ή ζακέτα με μακρυμάνικη μπλούζα.";
        } else {
            woman = "Μακρυμάνικη μπλούζα, ζακέτα και άνετο παντελόνι.";
            man = "Πουκάμισο ή ελαφρύπουλόβερ με τζιν.";
        }
    } else if (temp >= 18 && temp < 23) {
        woman = "T-shirt με ελαφκιά ζακέτα ή τζιν τζάκετ. Ιδανικά sneakers.";
        man = "Πόλο μπλούζα ή ελαφρύ πουκάμισο και casual παντελόνι.";
    } else {
        woman = "Ελαφριά καλοκαιρινή εμφάνιση, t-shirt και παντελόνι ή φούστα.";
        man = "T-shirt και ελαφρύ βερμούδα ή υφασμάτινο παντελόνι.";
    }

    return { woman, man };
}

async function fetchWeather() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // 1. Ημερομηνία & Ημέρα (Ελληνικά)
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = now.toLocaleDateString('el-GR', options);

        // 2. Τρέχουσα Θερμοκρασία, Εικονίδιο, Υγρασία
        const currentTemp = Math.round(data.current.temperature_2m);
        const currentHumidity = data.current.relative_humidity_2m;
        const currentWeatherCode = data.current.weather_code;
        const currentHour = now.getHours();

        document.getElementById('current-temp').innerText = `${currentTemp}°`;
        document.getElementById('humidity').innerText = `Υγρασία: ${currentHumidity}%`;
        
        const currentDetails = getWeatherDetails(currentWeatherCode);
        document.getElementById('weather-icon').innerText = currentDetails.icon;

        // 3. Ωριαία πρόβλεψη μέχρι τις 23:00
        const hourlyContainer = document.getElementById('hourly-container');
        hourlyContainer.innerHTML = '';

        const times = data.hourly.time;
        const temps = data.hourly.temperature_2m;
        const codes = data.hourly.weather_code;

        for (let i = 0; i < times.length; i++) {
            const forecastDate = new Date(times[i]);
            const forecastHour = forecastDate.getHours();
            const forecastDay = forecastDate.getDate();
            const todayDay = now.getDate();

            // Μόνο για τη σημερινή μέρα και μέχρι τις 23:00
            if (forecastDay === todayDay && forecastHour >= currentHour && forecastHour <= 23) {
                const details = getWeatherDetails(codes[i]);
                
                const item = document.createElement('div');
                item.className = 'hourly-item';
                item.innerHTML = `
                    <div class="hourly-time">${forecastHour}:00</div>
                    <div class="hourly-icon">${details.icon}</div>
                    <div class="hourly-temp">${Math.round(temps[i])}°</div>
                `;
                hourlyContainer.appendChild(item);
            }
        }

        // 4. Προτάσεις ντυσίματος
        const outfits = getOutfitSuggestions(currentTemp, currentHour);
        document.getElementById('woman-outfit').innerText = outfits.woman;
        document.getElementById('man-outfit').innerText = outfits.man;

        // 5. Πρόβλεψη Επόμενης Μέρας
        // Βρίσκουμε τον δείκτη για αύριο στα daily δεδομένα
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

    } catch (error) {
        console.error('Σφάλμα κατά τη λήψη δεδομένων καιρού:', error);
        document.getElementById('current-date').innerText = 'Αποτυχία φόρτωσης δεδομένων';
    }
}

// Εκτέλεση κατά τη φόρτωση
fetchWeather();