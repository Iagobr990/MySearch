const yearSelect = document.getElementById('yearSelect');
const seasonSelect = document.getElementById('seasonSelect');
const loadBtn = document.getElementById('loadBtn');
const animeList = document.getElementById('animeList');
const loader = document.getElementById('loader');

// Popula o select de anos
for (let y = 2000; y <= 2025; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
}

const seasons = ['winter', 'spring', 'summer', 'fall'];
let allAnimes = [];
let displayedCount = 0;
const perPage = 20;

// Traduz sinopses usando Google Translate
async function translateBatch(texts) {
    const translated = [];

    for (let text of texts) {
        if (!text) {
            translated.push('Sem sinopse disponível.');
            continue;
        }
        try {
            const res = await fetch(
                'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=' +
                    encodeURIComponent(text)
            );
            const data = await res.json();
            translated.push(data[0][0][0] || text);
        } catch (err) {
            console.error('Erro na tradução:', err);
            translated.push(text);
        }
    }

    return translated;
}

// Exibe os próximos animes
async function displayAnimes() {
    loader.style.display = 'block';
    const slice = allAnimes.slice(displayedCount, displayedCount + perPage);
    const synopses = slice.map((a) => a.synopsis || 'Sem sinopse disponível.');
    const translatedSynopses = await translateBatch(synopses);

    slice.forEach((anime, i) => {
        const card = document.createElement('div');
        card.className = 'anime-card';

        const title = anime.title || 'Desconhecido';
        const episodes = anime.episodes || 'Desconhecido';
        const image = anime.images?.jpg?.image_url || '';

        // Sinopse fica oculta até clicar
        card.innerHTML = `
            <img src="${image}" alt="${title}">
            <h3>${title}</h3>
            <p><strong>Episódios:</strong> ${episodes}</p>
            <p class="sinopse">${translatedSynopses[i]}</p>
        `;

        // Clique para mostrar/ocultar sinopse
        card.addEventListener('click', () => {
            card.classList.toggle('active');
        });

        animeList.appendChild(card);
    });

    displayedCount += perPage;
    loader.style.display = 'none';
}

// Carrega animes por ano e temporada
loadBtn.addEventListener('click', async () => {
    const year = yearSelect.value;
    const selectedSeason = seasonSelect.value;
    animeList.innerHTML = '';
    allAnimes = [];
    displayedCount = 0;

    loader.style.display = 'block';

    try {
        let seasonsToFetch = selectedSeason === 'all' ? seasons : [selectedSeason];

        for (const season of seasonsToFetch) {
            const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
            const data = await res.json();
            if (data.data) allAnimes = allAnimes.concat(data.data);
        }

        if (allAnimes.length === 0) {
            animeList.innerHTML = '<p>Nenhum anime encontrado para este ano/temporada.</p>';
            loader.style.display = 'none';
            return;
        }

        allAnimes.sort((a, b) => a.title.localeCompare(b.title));
        displayAnimes();
    } catch (error) {
        console.error(error);
        animeList.innerHTML = '<p>Ocorreu um erro ao carregar os animes.</p>';
        loader.style.display = 'none';
    }
});

// Scroll infinito
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        if (displayedCount < allAnimes.length) displayAnimes();
    }
});