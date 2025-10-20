// ==== ELEMENTOS ==== //
const yearSelect = document.getElementById('yearSelect');
const seasonSelect = document.getElementById('seasonSelect');
const loadBtn = document.getElementById('loadBtn');
const animeList = document.getElementById('animeList');
const loader = document.getElementById('loader');
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const searchFunction = document.getElementById('searchFunction');
const favoritesFunction = document.getElementById('favoritesFunction'); 
const genresFunction = document.getElementById('genresFunction'); // ✅ Adicionado

// ==== VARIÁVEIS ==== //
let allAnimes = [];
let displayedCount = 0;
const perPage = 20;
let isLoading = false;
const seasonsAPI = ['winter', 'spring', 'summer', 'fall'];

// ==== POPULA SELECT DE ANOS ==== //
const currentYear = new Date().getFullYear();
for (let y = 1970; y <= currentYear; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
}

// ==== ABRIR FUNÇÃO DE PESQUISA ==== //
searchFunction.addEventListener('click', e => {
    e.preventDefault();
    window.open('search.html', '_blank');
});

// ==== ABRIR ABA DE FAVORITOS ==== //
favoritesFunction.addEventListener('click', e => {
    e.preventDefault();
    window.open('favorites.html', '_blank');
});

// ==== ABRIR ABA DE GÊNEROS ==== //
genresFunction.addEventListener('click', e => {
    e.preventDefault();
    window.open('genres.html', '_blank'); // ✅ Corrigido
});

// ==== TRADUZIR SINOPSES ==== //
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
            translated.push(text);
        }
    }
    return translated;
}

// ==== FUNÇÃO PARA CRIAR CARD DE ANIME ==== //
function createAnimeCard(anime, translatedSynopsis) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.mal_id;

    const storedStatus = JSON.parse(localStorage.getItem(`anime_${anime.mal_id}`)) || {};
    if (storedStatus.favorite) card.classList.add('favorite');
    if (storedStatus.watching) card.classList.add('watching');
    if (storedStatus.completed) card.classList.add('completed');
    if (storedStatus.plan) card.classList.add('plan');

    const title = anime.title || 'Desconhecido';
    const image = anime.images?.jpg?.image_url || '';
    const episodes =
        anime.status && anime.status.toLowerCase().includes('currently airing')
            ? 'Episódios: Em lançamento'
            : anime.episodes
            ? `Episódios: ${anime.episodes}`
            : 'Episódios: Desconhecido';

    card.innerHTML = `
        <img src="${image}" alt="${title}">
        <h3>${title}</h3>
        <p>${episodes}</p>
        <p class="sinopse">${translatedSynopsis}</p>
        <input type="number" class="episode-input" min="1" placeholder="Episódio atual" value="${storedStatus.episode ?? ''}" style="width:90%; margin:5px auto; padding:3px; border-radius:4px; border:1px solid #00f0ff; background:#111; color:#fff; display:${storedStatus.watching ? 'block' : 'none'};">
        <p class="current-episode">${storedStatus.episode && storedStatus.watching ? `Episódio atual: ${storedStatus.episode}` : ''}</p>
        <div class="anime-menu-btn">⚙️</div>
        <div class="anime-menu-options">
            <div class="menu-option" data-action="favorite">⭐ Favorito</div>
            <div class="menu-option" data-action="watching">▶️ Assistindo</div>
            <div class="menu-option" data-action="completed">✅ Concluído</div>
            <div class="menu-option" data-action="plan">📅 Planejando</div>
        </div>
    `;

    const menuBtn = card.querySelector('.anime-menu-btn');
    const menuOptions = card.querySelector('.anime-menu-options');
    const episodeInput = card.querySelector('.episode-input');
    const epDisplay = card.querySelector('.current-episode');

    menuBtn.addEventListener('click', e => {
        e.stopPropagation();
        menuOptions.classList.toggle('active');
    });

    menuOptions.querySelectorAll('.menu-option').forEach(option => {
        option.addEventListener('click', () => {
            const action = option.dataset.action;
            const status = JSON.parse(localStorage.getItem(`anime_${anime.mal_id}`)) || {};
            status.title = title;
            status.image = image;
            status.synopsis = translatedSynopsis;

            if (status[action]) {
                status[action] = false;
            } else {
                ['favorite', 'watching', 'completed', 'plan'].forEach(key => {
                    status[key] = (key === action);
                });
            }

            if (status.watching) {
                episodeInput.style.display = 'block';
            } else {
                episodeInput.style.display = 'none';
                delete status.episode;
                epDisplay.textContent = '';
            }

            localStorage.setItem(`anime_${anime.mal_id}`, JSON.stringify(status));

            card.classList.toggle('favorite', status.favorite);
            card.classList.toggle('watching', status.watching);
            card.classList.toggle('completed', status.completed);
            card.classList.toggle('plan', status.plan);

            if (animeList.dataset.mode === 'favorites') displayFavorites();
            menuOptions.classList.remove('active');
        });
    });

    episodeInput.addEventListener('change', () => {
        const status = JSON.parse(localStorage.getItem(`anime_${anime.mal_id}`)) || {};
        if (status.watching) {
            status.episode = episodeInput.value;
            localStorage.setItem(`anime_${anime.mal_id}`, JSON.stringify(status));
            epDisplay.textContent = `Episódio atual: ${status.episode}`;
        }
    });

    card.addEventListener('click', () => {
        card.classList.toggle('active');
    });

    return card;
}

// ==== EXIBE ANIMES ==== //
async function displayAnimes() {
    if (isLoading) return;
    isLoading = true;
    loader.style.display = 'block';

    const slice = allAnimes.slice(displayedCount, displayedCount + perPage);
    if (!slice.length) {
        loader.style.display = 'none';
        isLoading = false;
        return;
    }

    const synopses = slice.map(a => a.synopsis || 'Sem sinopse disponível.');
    const translatedSynopses = await translateBatch(synopses);

    slice.forEach((anime, i) => {
        const card = createAnimeCard(anime, translatedSynopses[i]);
        animeList.appendChild(card);
    });

    displayedCount += perPage;
    loader.style.display = 'none';
    isLoading = false;
    animeList.dataset.mode = 'normal';
}

// ==== EXIBE FAVORITOS ==== //
async function displayFavorites() {
    animeList.innerHTML = '';
    loader.style.display = 'block';
    animeList.dataset.mode = 'favorites';

    const keys = Object.keys(localStorage).filter(k => k.startsWith('anime_'));
    if (!keys.length) {
        animeList.innerHTML = '<p>Nenhum anime favoritado ou marcado.</p>';
        loader.style.display = 'none';
        return;
    }

    const favorites = [];
    for (const key of keys) {
        const status = JSON.parse(localStorage.getItem(key));
        if (status.favorite || status.watching || status.completed || status.plan) {
            favorites.push(status);
        }
    }

    if (!favorites.length) {
        animeList.innerHTML = '<p>Nenhum anime favoritado ou marcado.</p>';
        loader.style.display = 'none';
        return;
    }

    favorites.forEach(fav => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        if (fav.favorite) card.classList.add('favorite');
        if (fav.watching) card.classList.add('watching');
        if (fav.completed) card.classList.add('completed');
        if (fav.plan) card.classList.add('plan');

        card.innerHTML = `
            <img src="${fav.image}" alt="${fav.title}">
            <h3>${fav.title}</h3>
            <p class="current-episode">${fav.episode && fav.watching ? `Episódio atual: ${fav.episode}` : ''}</p>
            <p class="sinopse">${fav.synopsis}</p>
        `;
        animeList.appendChild(card);
    });

    loader.style.display = 'none';
}

// ==== CARREGA ANIMES POR ANO/ESTAÇÃO ==== //
loadBtn.addEventListener('click', async () => {
    const year = yearSelect.value;
    const selectedSeason = seasonSelect.value;

    animeList.innerHTML = '';
    allAnimes = [];
    displayedCount = 0;

    loader.style.display = 'block';

    try {
        const seasonsToFetch = selectedSeason === 'all' ? seasonsAPI : [selectedSeason];
        for (const season of seasonsToFetch) {
            const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
            const data = await res.json();
            if (data.data) allAnimes = allAnimes.concat(data.data);
        }

        if (!allAnimes.length) {
            animeList.innerHTML = '<p>Nenhum anime encontrado.</p>';
            loader.style.display = 'none';
            return;
        }

        allAnimes.sort((a,b) => a.title.localeCompare(b.title));
        displayAnimes();
    } catch (err) {
        console.error(err);
        animeList.innerHTML = '<p>Erro ao carregar os animes.</p>';
    } finally {
        loader.style.display = 'none';
    }
});

// ==== SCROLL INFINITO ==== //
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        if (displayedCount < allAnimes.length) displayAnimes();
    }
});

// ==== MENU LATERAL ==== //
menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// ==== CARREGAR TEMPORADA ATUAL ==== //
async function loadCurrentSeason() {
    animeList.innerHTML = '';
    allAnimes = [];
    displayedCount = 0;
    loader.style.display = 'block';

    try {
        const res = await fetch('https://api.jikan.moe/v4/seasons/now');
        const data = await res.json();
        if (data.data) allAnimes = data.data;
        allAnimes.sort((a,b) => a.title.localeCompare(b.title));
        displayAnimes();
    } catch(err){
        console.error(err);
        animeList.innerHTML = '<p>Erro ao carregar animes.</p>';
    } finally {
        loader.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', loadCurrentSeason);