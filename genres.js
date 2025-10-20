// ==== ELEMENTOS ==== //
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const genreList = document.getElementById('genreList');

// ==== SIDEBAR ==== //
menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
});
overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// ==== CARREGA GÊNEROS ==== //
async function loadGenres() {
    try {
        const res = await fetch('https://api.jikan.moe/v4/genres/anime');
        const data = await res.json();
        const genres = data.data;

        genres.forEach(g => {
            const card = document.createElement('div');
            card.className = 'genre-card';
            card.textContent = g.name;

            card.addEventListener('click', () => {
                window.location.href = `genre-selected.html?id=${g.mal_id}&name=${encodeURIComponent(g.name)}`;
            });

            genreList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        genreList.innerHTML = '<p>Erro ao carregar os gêneros.</p>';
    }
}

window.addEventListener('DOMContentLoaded', loadGenres);