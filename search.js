const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const animeList = document.getElementById('animeList');
const loader = document.getElementById('loader');

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

async function searchAnime() {
    const query = searchInput.value.trim();
    if (!query) return;

    animeList.innerHTML = '';
    loader.style.display = 'block';

    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            animeList.innerHTML = '<p>Nenhum anime encontrado.</p>';
            loader.style.display = 'none';
            return;
        }

        const synopses = data.data.map(a => a.synopsis || 'Sem sinopse disponível.');
        const translatedSynopses = await translateBatch(synopses);

        data.data.forEach((anime, i) => {
            const card = document.createElement('div');
            card.className = 'anime-card';

            const title = anime.title || 'Desconhecido';
            const episodes = anime.episodes ? `Episódios: ${anime.episodes}` : 'Episódios: Em lançamento';
            const image = anime.images?.jpg?.image_url || '';

            card.innerHTML = `
                <img src="${image}" alt="${title}">
                <h3>${title}</h3>
                <p>${episodes}</p>
                <p class="sinopse">${translatedSynopses[i]}</p>
            `;

            card.addEventListener('click', () => card.classList.toggle('active'));
            animeList.appendChild(card);
        });

    } catch (err) {
        animeList.innerHTML = '<p>Ocorreu um erro ao buscar o anime.</p>';
    } finally {
        loader.style.display = 'none';
    }
}

searchBtn.addEventListener('click', searchAnime);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchAnime(); });