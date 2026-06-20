const API_BASE = window.location.origin;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadPage = document.getElementById('uploadPage');
const loader = document.getElementById('loader');
const resultsModal = document.getElementById('resultsModal');
const errorMessage = document.getElementById('errorMessage');
const cardsGrid = document.getElementById('cardsGrid');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.vdf'));
    if (files.length) processFiles(files);
    else showError('Загрузите только .vdf файлы');
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) processFiles(Array.from(e.target.files));
});

function setStage(id, state) {
    const el = document.getElementById('stage-' + id);
    if (!el) return;
    el.className = 'stage ' + state;
}

function updateLoader(text, current, total) {
    const stageEl = document.querySelector('.loader-stage');
    const progEl = document.getElementById('loaderProgress');
    const barEl = document.getElementById('progressBar');
    if (stageEl) stageEl.textContent = text;
    if (progEl && total) progEl.textContent = current + ' / ' + total;
    if (barEl && total) barEl.style.width = Math.round((current / total) * 100) + '%';
}

function formatDate(ts) {
    if (!ts) return 'навсегда';
    try {
        const d = new Date(ts * 1000);
        return d.toLocaleDateString('ru-RU');
    } catch (e) { return 'навсегда'; }
}

function daysLeft(ts) {
    if (!ts) return null;
    try {
        const now = Date.now() / 1000;
        const left = Math.ceil((ts - now) / 86400);
        if (left <= 0) return 'истёк';
        if (left === 1) return '1 день';
        if (left < 5) return left + ' дня';
        return left + ' дней';
    } catch (e) { return null; }
}

function vacText(days) {
    if (days === 0) return 'сегодня';
    if (days === 1) return 'вчера';
    if (days < 5) return days + ' дня назад';
    return days + ' дней назад';
}

async function processFiles(files) {
    hideError();
    const formData = new FormData();
    let hasVdf = false;
    for (const file of files) {
        if (file.name.endsWith('.vdf')) { formData.append('files', file); hasVdf = true; }
    }
    if (!hasVdf) { showError('Файлы .vdf не найдены'); return; }

    showLoader();
    setStage('parse', 'active');
    setStage('steam', 'waiting');
    setStage('fear', 'waiting');
    setStage('yooma', 'waiting');
    setStage('done', 'waiting');
    updateLoader('Читаем VDF файл...', 0, 0);

    try {
        const parseRes = await fetch(API_BASE + '/api/parse-vdf', { method: 'POST', body: formData });
        if (!parseRes.ok) throw new Error('Ошибка парсинга: ' + parseRes.status);
        const parseData = await parseRes.json();

        if (!parseData.unique_ids) {
            hideLoader();
            showError('SteamID не найдены в файле');
            return;
        }

        const total = parseData.unique_ids;
        updateLoader('Найдено ' + total + ' аккаунтов. Проверяем...', 0, total);

        setStage('parse', 'done');
        setStage('steam', 'active');
        setStage('fear', 'active');
        setStage('yooma', 'active');
        updateLoader('Проверяем Steam + Fear + Yooma...', 0, total);

        const checkRes = await fetch(API_BASE + '/api/check-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steamids: parseData.steamids })
        });

        if (!checkRes.ok) {
            const errText = await checkRes.text();
            throw new Error('Ошибка проверки: ' + checkRes.status);
        }

        const data = await checkRes.json();

        setStage('steam', 'done');
        setStage('fear', 'done');
        setStage('yooma', 'done');
        setStage('done', 'active');
        updateLoader('Готово! Загружаем результаты...', total, total);
        await new Promise(r => setTimeout(r, 400));

        hideLoader();
        if (!data.results || !Array.isArray(data.results)) {
            throw new Error('Неверный ответ сервера');
        }
        showResults(data.results);

    } catch (err) {
        console.error(err);
        hideLoader();
        showError('Ошибка: ' + err.message);
    }
}

function showResults(results) {
    try {
        results.sort((a, b) => getScore(b) - getScore(a));

        const total = results.length;
        const banned = results.filter(r => r.fearBanned || r.vacBanned || r.gameBans > 0 || r.yoomaFound).length;
        const notFear = results.filter(r => !r.onFear).length;
        const clean = total - banned;

        document.getElementById('totalCount').textContent = total;
        document.getElementById('bannedCount').textContent = banned;
        document.getElementById('notFearCount').textContent = notFear;
        document.getElementById('cleanCount').textContent = clean;

        cardsGrid.innerHTML = results.map((r, i) => makeCard(r, i)).join('');

        // Показываем модалку
        resultsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

    } catch (e) {
        showError('Ошибка отображения: ' + e.message);
    }
}

function getScore(r) {
    let s = 0;
    if (r.fearBanned) s += 100;
    if (r.yoomaFound) s += 80;
    if (r.vacBanned) s += 60;
    if (r.gameBans > 0) s += 50;
    if (!r.onFear) s += 10;
    return s;
}

function makeCard(r, idx) {
    try {
        const score = getScore(r);
        const isBan = score >= 50;
        const isWarn = !r.onFear && score < 50;
        const cardClass = isBan ? 'banned' : (isWarn ? 'warning' : 'clean');
        const badgeClass = isBan ? 'banned' : (isWarn ? 'warning' : 'clean');
        const badgeText = isBan ? 'БАН' : (isWarn ? 'НЕТ' : 'ЧИСТ');

        const details = [];

        if (r.fearBanned) {
            const reason = r.fearReason || 'Бан';
            const until = formatDate(r.fearUnban);
            details.push({ label: 'Fear', text: esc(reason) + ' (до ' + until + ')', type: 'banned' });
        }

        if (r.yoomaFound && r.yoomaBans && r.yoomaBans.length > 0) {
            const b = r.yoomaBans[0];
            const reason = b.reason || 'Бан';
            const until = formatDate(b.expires);
            const left = daysLeft(b.expires);
            let text = esc(reason) + ' (до ' + until + ')';
            if (left && left !== 'истёк') text += ' — осталось ' + left;
            details.push({ label: 'Yooma', text: text, type: 'banned' });
        }

        if (r.vacBanned) {
            details.push({ label: 'VAC', text: vacText(r.vacDays), type: 'banned' });
        }

        if (r.gameBans > 0) {
            const w = r.gameBans === 1 ? 'бан' : (r.gameBans < 5 ? 'бана' : 'банов');
            details.push({ label: 'Game', text: r.gameBans + ' ' + w, type: 'banned' });
        }

        if (!details.length) {
            if (!r.onFear) {
                details.push({ label: 'Fear', text: 'Не зарегистрирован', type: 'warning' });
            } else {
                details.push({ label: 'Статус', text: 'Аккаунт чист', type: 'clean' });
            }
        }

        const detailsHtml = details.map(d =>
            `<div class="detail-row ${d.type}"><span class="detail-label">${d.label}</span>${d.text}</div>`
        ).join('');

        const avatar = r.avatar
            ? `<a href="https://fearproject.ru/profile/${r.steamid}" target="_blank" class="avatar-link"><img src="${esc(r.avatar)}" alt="" onerror="this.parentElement.innerHTML='<div class=\'placeholder\'>?</div>'"></a>`
            : `<a href="https://fearproject.ru/profile/${r.steamid}" target="_blank" class="avatar-link"><div class="placeholder">?</div></a>`;

        let links = `<a href="https://fearproject.ru/profile/${r.steamid}" target="_blank" class="link-fear">Fear</a>`;
        links += `<a href="https://steamcommunity.com/profiles/${r.steamid}" target="_blank" class="link-steam">Steam</a>`;
        if (r.yoomaFound) links += `<a href="https://yooma.su/ru/profile/${r.steamid}" target="_blank" class="link-yooma">Yooma</a>`;

        return `<div class="account-card ${cardClass}">
            <div class="card-top">
                <div class="card-avatar">${avatar}</div>
                <div class="card-info">
                    <div class="card-nickname" title="${esc(r.nickname)}">${esc(r.nickname)}</div>
                    <div class="card-steamid">${r.steamid}</div>
                </div>
                <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="card-details">${detailsHtml}</div>
            <div class="card-links">${links}</div>
        </div>`;
    } catch (e) {
        return `<div class="account-card" style="color:#f87171;padding:20px;">Ошибка: ${esc(e.message)}</div>`;
    }
}

function showLoader() {
    uploadPage.style.display = 'none';
    resultsModal.style.display = 'none';
    loader.style.display = 'flex';
    document.body.style.overflow = '';
}
function hideLoader() {
    loader.style.display = 'none';
}
function resetPage() {
    uploadPage.style.display = 'flex';
    loader.style.display = 'none';
    resultsModal.style.display = 'none';
    fileInput.value = '';
    hideError();
    document.body.style.overflow = '';
}
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.add('show');
}
function hideError() {
    errorMessage.classList.remove('show');
}
function esc(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = String(t);
    return d.innerHTML;
}

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resultsModal.style.display === 'flex') {
        resetPage();
    }
});

// Закрытие по клику на оверлей
resultsModal.addEventListener('click', (e) => {
    if (e.target === resultsModal) {
        resetPage();
    }
});

window.resetPage = resetPage;