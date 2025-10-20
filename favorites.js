// ==== ELEMENTOS ====
const animeList = document.getElementById('animeList');
const filterSelect = document.getElementById('filterSelect');

// ==== CARREGAR FAVORITOS ====
function getFavorites() {
  const data = localStorage.getItem('mysearch_favorites');
  return data ? JSON.parse(data) : [];
}

// ==== SALVAR FAVORITOS ====
function saveFavorites(favs) {
  localStorage.setItem('mysearch_favorites', JSON.stringify(favs));
}

// ==== EXIBIR FAVORITOS ====
function displayFavorites(filter = 'all') {
  animeList.innerHTML = '';

  const favorites = getFavorites().filter(fav =>
    filter === 'all' ? true : fav.status === filter
  );

  if (favorites.length === 0) {
    animeList.innerHTML = '<p>Nenhum anime salvo ainda.</p>';
    return;
  }

  favorites.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';

    const progress = anime.progress || 0;
    const total = anime.episodes || '?';

    card.innerHTML = `
      <img src="${anime.image}" alt="${anime.title}">
      <h3>${anime.title}</h3>
      <p>${anime.synopsis}</p>

      <div class="anime-actions">
        <label>Status:</label>
        <select class="status-select">
          <option value="watching" ${anime.status === 'watching' ? 'selected' : ''}>Assistindo</option>
          <option value="completed" ${anime.status === 'completed' ? 'selected' : ''}>Concluído</option>
          <option value="planning" ${anime.status === 'planning' ? 'selected' : ''}>Planejando</option>
        </select>

        <div class="progress-container">
          <label>Episódios:</label>
          <input type="number" class="progress-input" min="0" value="${progress}">
          <span>/ ${total}</span>
        </div>

        <button class="remove-btn">Remover</button>
      </div>
    `;

    // ====== EVENTOS ======
    card.querySelector('.status-select').addEventListener('change', (e) => {
      anime.status = e.target.value;
      updateFavorite(anime);
    });

    card.querySelector('.progress-input').addEventListener('input', (e) => {
      anime.progress = parseInt(e.target.value) || 0;
      updateFavorite(anime);
    });

    card.querySelector('.remove-btn').addEventListener('click', () => {
      removeFavorite(anime.mal_id);
    });

    animeList.appendChild(card);
  });
}

// ==== ATUALIZAR FAVORITO ====
function updateFavorite(updatedAnime) {
  const favorites = getFavorites();
  const index = favorites.findIndex(f => f.mal_id === updatedAnime.mal_id);
  if (index !== -1) {
    favorites[index] = updatedAnime;
    saveFavorites(favorites);
  }
}

// ==== REMOVER FAVORITO ====
function removeFavorite(id) {
  let favorites = getFavorites();
  favorites = favorites.filter(f => f.mal_id !== id);
  saveFavorites(favorites);
  displayFavorites(filterSelect.value);
}

// ==== FILTRO DE STATUS ====
filterSelect.addEventListener('change', () => {
  displayFavorites(filterSelect.value);
});

// ==== INICIALIZA ====
displayFavorites();