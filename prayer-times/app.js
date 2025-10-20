// Глобальные переменные
let selectedCountry = null;
let selectedCity = null;
let prayerData = null;

// Названия намазов на русском
const prayerNames = {
    Fajr: "Фаджр (Рассвет)",
    Sunrise: "Восход солнца",
    Dhuhr: "Зухр (Полдень)",
    Asr: "Аср (После полудня)",
    Maghrib: "Магриб (Закат)",
    Isha: "Иша (Ночь)"
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCountries();
    updateCurrentDate();

    // Обновлять дату каждую минуту
    setInterval(updateCurrentDate, 60000);
});

// Загрузка списка стран
function loadCountries() {
    const countrySelect = document.getElementById('country');

    // Очистить существующие опции (кроме первой)
    countrySelect.innerHTML = '<option value="">-- Выберите страну --</option>';

    // Добавить все страны из данных
    Object.keys(cisCountries).sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
}

// Загрузка городов выбранной страны
function loadCities() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');
    const getPrayerTimesBtn = document.getElementById('getPrayerTimes');

    selectedCountry = countrySelect.value;

    if (!selectedCountry) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">-- Сначала выберите страну --</option>';
        getPrayerTimesBtn.disabled = true;
        hidePrayerTimes();
        hideError();
        return;
    }

    // Очистить и включить селектор городов
    citySelect.innerHTML = '<option value="">-- Выберите город --</option>';
    citySelect.disabled = false;

    // Добавить города выбранной страны
    const cities = cisCountries[selectedCountry].cities;
    cities.forEach((city, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });

    // Сбросить время намаза
    hidePrayerTimes();
    hideError();
    getPrayerTimesBtn.disabled = true;

    // Добавить обработчик для выбора города
    citySelect.onchange = function() {
        if (citySelect.value !== "") {
            getPrayerTimesBtn.disabled = false;
            selectedCity = cities[parseInt(citySelect.value)];
        } else {
            getPrayerTimesBtn.disabled = true;
        }
        hidePrayerTimes();
        hideError();
    };
}

// Получение времени намаза через API
async function getPrayerTimes() {
    if (!selectedCity || !selectedCountry) {
        showError('Пожалуйста, выберите страну и город');
        return;
    }

    showLoading();
    hideError();
    hidePrayerTimes();

    try {
        const countryCode = cisCountries[selectedCountry].code;
        const method = calculationMethods[countryCode] || 2;

        // Получаем текущую дату
        const today = new Date();
        const timestamp = Math.floor(today.getTime() / 1000);

        // API запрос к Aladhan
        const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&method=${method}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Ошибка при получении данных с сервера');
        }

        const data = await response.json();

        if (data.code !== 200) {
            throw new Error('Получены некорректные данные');
        }

        prayerData = data.data;
        displayPrayerTimes();

    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить время намаза. Проверьте подключение к интернету и попробуйте снова.');
    } finally {
        hideLoading();
    }
}

// Отображение времени намаза
function displayPrayerTimes() {
    if (!prayerData) return;

    const container = document.getElementById('prayerTimesContainer');
    const timingsDiv = document.getElementById('prayerTimes');
    const locationName = document.getElementById('locationName');

    // Установить название города
    locationName.textContent = `${selectedCity.name}, ${selectedCountry}`;

    // Очистить предыдущие данные
    timingsDiv.innerHTML = '';

    // Получить времена намазов
    const timings = prayerData.timings;

    // Определить текущий и следующий намаз
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let nextPrayer = null;
    let nextPrayerTime = null;

    // Отобразить каждый намаз
    Object.keys(prayerNames).forEach(key => {
        if (timings[key]) {
            const prayerDiv = document.createElement('div');
            prayerDiv.className = 'prayer-time';

            const time = timings[key].substring(0, 5); // Убираем секунды
            const [hours, minutes] = time.split(':').map(Number);
            const prayerMinutes = hours * 60 + minutes;

            // Проверка, является ли это следующим намазом
            if (prayerMinutes > currentTime && !nextPrayer) {
                nextPrayer = prayerNames[key];
                nextPrayerTime = time;
                prayerDiv.classList.add('active');
            }

            prayerDiv.innerHTML = `
                <div class="prayer-name">${prayerNames[key]}</div>
                <div class="prayer-time-value">${time}</div>
            `;

            timingsDiv.appendChild(prayerDiv);
        }
    });

    // Если не найден следующий намаз (все намазы прошли), показать первый намаз следующего дня
    if (!nextPrayer) {
        nextPrayer = prayerNames.Fajr;
        nextPrayerTime = timings.Fajr.substring(0, 5);
    }

    // Отобразить следующий намаз
    const nextPrayerDiv = document.getElementById('nextPrayer');
    nextPrayerDiv.innerHTML = `
        <strong>${nextPrayer}</strong> в <strong>${nextPrayerTime}</strong>
    `;

    // Показать контейнер
    container.style.display = 'block';
}

// Обновление текущей даты
function updateCurrentDate() {
    const dateDiv = document.getElementById('currentDate');
    const now = new Date();

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    const dateStr = now.toLocaleDateString('ru-RU', options);
    const timeStr = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    dateDiv.textContent = `${dateStr}, ${timeStr}`;
}

// Вспомогательные функции для UI
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function hidePrayerTimes() {
    document.getElementById('prayerTimesContainer').style.display = 'none';
}
