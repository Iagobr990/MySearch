// ==== ELEMENTOS ====
const animeList = document.getElementById('animeList');
const filterSelect = document.getElementById('filterSelect');

// ==== CHAVES DE LOCALSTORAGE ====
const FAVORITES_KEY = 'mysearch_favorites';

// ==== PEGAR FAVORITOS ====
function getFavorites() {
  const data = localStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

// ==== SALVAR FAVORITOS ====
function saveFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

// ==== ATUALIZA OU ADICIONA FAVORITO ====
function updateFavoriteStorage(anime) {
  // Salva individualmente (para manter compatibilidade com outras abas)
  localStorage.setItem(`anime_${anime.mal_id}`, JSON.stringify(anime));

  // Atualiza lista de favoritos
  let favs = getFavorites();
  const index = favs.findIndex(f => f.mal_id === anime.mal_id);
  if (index !== -1) {
    favs[index] = anime;
  } else {
    favs.push(anime);
  }
  saveFavorites(favs);
}

// ==== REMOVER FAVORITO ====
function removeFavorite(id) {
  // Remove da lista de favoritos
  let favs = getFavorites().filter(f => f.mal_id !== id);
  saveFavorites(favs);

  // Remove individual
  localStorage.removeItem(`anime_${id}`);

  // Atualiza a lista exibida
  displayFavorites(filterSelect.value);
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
      updateFavoriteStorage(anime);
    });

    card.querySelector('.progress-input').addEventListener('input', (e) => {
      anime.progress = parseInt(e.target.value) || 0;
      updateFavoriteStorage(anime);
    });

    card.querySelector('.remove-btn').addEventListener('click', () => {
      removeFavorite(anime.mal_id);
    });

    animeList.appendChild(card);
  });
}

// ==== FILTRO DE STATUS ====
filterSelect.addEventListener('change', () => {
  displayFavorites(filterSelect.value);
});

// ==== ATUALIZA DYNAMICAMENTE SE LOCALSTORAGE MUDAR (OUTRA ABA) ====
window.addEventListener('storage', () => {
  displayFavorites(filterSelect.value);
});

// ==== INICIALIZA ====
displayFavorites();