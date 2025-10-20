// ==== ELEMENTOS ==== //
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const animeList = document.getElementById('animeList');
const loader = document.getElementById('loader');
const genreTitle = document.getElementById('genreTitle');

// ==== SIDEBAR ==== //
menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
});
overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// ==== VARIÁVEIS ==== //
let allAnimes = [];
let displayedCount = 0;
const perPage = 20;
let isLoading = false;

// ==== PEGAR ID DO GÊNERO NA URL ==== //
const urlParams = new URLSearchParams(window.location.search);
const genreId = urlParams.get('id');
const genreName = urlParams.get('name');
genreTitle.textContent = `Gênero: ${genreName}`;

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

    const title = anime.title || 'Desconhecido';
    const image = anime.images?.jpg?.image_url || '';
    const episodes = anime.episodes ? `Episódios: ${anime.episodes}` : 'Episódios: Desconhecido';

    card.innerHTML = `
        <img src="${image}" alt="${title}">
        <h3>${title}</h3>
        <p class="sinopse">${translatedSynopsis}</p>
    `;

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
}

// ==== CARREGA ANIMES POR GÊNERO ==== //
async function loadAnimesByGenre() {
    loader.style.display = 'block';
    animeList.innerHTML = '';
    allAnimes = [];
    displayedCount = 0;

    try {
        let page = 1;
        let hasMore = true;

        while (hasMore && allAnimes.length < 200) {
            const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&page=${page}`);
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                allAnimes = allAnimes.concat(data.data);
                page++;
            } else {
                hasMore = false;
            }
        }

        if (allAnimes.length === 0) {
            animeList.innerHTML = '<p>Nenhum anime encontrado para este gênero.</p>';
            loader.style.display = 'none';
            return;
        }

        allAnimes.sort((a, b) => a.title.localeCompare(b.title));
        displayAnimes();
    } catch (err) {
        console.error(err);
        animeList.innerHTML = '<p>Erro ao carregar os animes deste gênero.</p>';
        loader.style.display = 'none';
    }
}

// ==== SCROLL INFINITO ==== //
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        if (displayedCount < allAnimes.length) displayAnimes();
    }
});

window.addEventListener('DOMContentLoaded', loadAnimesByGenre);