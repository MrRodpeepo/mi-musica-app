// Lista de géneros y colores
const genres = [
  { name: "Rock", color: "#2e2a47" },
  { name: "Pop", color: "#f4b2e7" },
  { name: "Jazz", color: "#8b90c9" },
  { name: "Blues", color: "#4682b4" },
  { name: "Hip-Hop", color: "#1e1b1d" },
  { name: "Reggae", color: "#8bc34a" },
  { name: "Metal", color: "#4d4d4d" },
  { name: "Punk", color: "#c82333" },
  { name: "Country", color: "#f0e6b3" },
  { name: "Funk", color: "#f57c00" },
  { name: "Electrónica", color: "#2f4f4f" },
  { name: "House", color: "#3c8dbc" },
  { name: "Techno", color: "#2e003e" },
  { name: "Trap", color: "#3e2723" },
  { name: "R&B", color: "#8d6e63" },
  { name: "Gospel", color: "#c2185b" },
  { name: "Clásica", color: "#f5f5f5" },
  { name: "Salsa", color: "#c62828" },
  { name: "Merengue", color: "#ff9800" },
  { name: "Bachata", color: "#c2185b" },
  { name: "Cumbia", color: "#4caf50" },
  { name: "Tango", color: "#9e9e9e" },
  { name: "Flamenco", color: "#e57373" }
];

// Crear IndexedDB
let db;
const request = indexedDB.open("MiMundoMusicDB", 1);
request.onupgradeneeded = e => {
  db = e.target.result;
  const store = db.createObjectStore("songs", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = e => {
  db = e.target.result;
  generateGenreTabs();
};
request.onerror = e => console.error("Error en IndexedDB", e);

// Crear botones de géneros
function generateGenreTabs() {
  const tabs = document.getElementById("genreTabs");
  genres.forEach(genre => {
    const btn = document.createElement("button");
    btn.textContent = genre.name;
    btn.onclick = () => showLibrary(genre.name);
    btn.style.backgroundColor = genre.color;
    tabs.appendChild(btn);
  });
}

// Subir canciones
function uploadSongs() {
  const files = document.getElementById("fileInput").files;
  if (!files.length) return alert("Selecciona al menos un archivo MP3.");

  Array.from(files).forEach(file => {
    new jsmediatags.Reader(file).read({
      onSuccess: tag => {
        const genre = tag.tags.genre || "Sin Género";
        const artist = tag.tags.artist || "Desconocido";
        const title = tag.tags.title || file.name;
        let coverData = null;

        if (tag.tags.picture) {
          const { data, format } = tag.tags.picture;
          const byteArray = new Uint8Array(data);
          const blob = new Blob([byteArray], { type: format });
          coverData = URL.createObjectURL(blob);
        }

        const song = { title, artist, genre, file, cover: coverData, year: tag.tags.year };

        const tx = db.transaction("songs", "readwrite");
        const store = tx.objectStore("songs");
        store.add(song);
      },
      onError: () => {
        const song = { 
          title: file.name, 
          artist: "Desconocido", 
          genre: "Sin Género", 
          file, 
          cover: "cover.png",
          year: "Desconocido"
        };
        const tx = db.transaction("songs", "readwrite");
        const store = tx.objectStore("songs");
        store.add(song);
      }
    });
  });

  alert("Canciones subidas 🎶");
}

// Eliminar canción
function deleteSong(songId) {
  const tx = db.transaction("songs", "readwrite");
  const store = tx.objectStore("songs");
  store.delete(songId);
  alert("Canción eliminada");
  showLibrary(currentGenre); // Actualiza la lista
}

// Mostrar canciones por género
let currentGenre = "";
function showLibrary(selectedGenre) {
  currentGenre = selectedGenre;
  const area = document.getElementById("libraryArea");
  area.innerHTML = `<h2 style="color:${genres.find(g => g.name === selectedGenre).color}">${selectedGenre}</h2>`;

  const tx = db.transaction("songs", "readonly");
  const store = tx.objectStore("songs");
  const req = store.openCursor();

  req.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const song = cursor.value;
      if (song.genre === selectedGenre) {
        const card = document.createElement("div");
        card.className = "songCard";

        const img = document.createElement("img");
        img.src = song.cover || "cover.png";
        img.className = "cover";

        const title = document.createElement("p");
        title.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = URL.createObjectURL(song.file);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () => deleteSong(song.id);
        
        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(audio);
        card.appendChild(deleteButton);
        area.appendChild(card);
      }
      cursor.continue();
    }
  };
}

// Filtro de búsqueda
function searchMusic() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const area = document.getElementById("libraryArea");
  const tx = db.transaction("songs", "readonly");
  const store = tx.objectStore("songs");
  const req = store.openCursor();

  area.innerHTML = `<h2>Resultados de Búsqueda</h2>`;

  req.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const song = cursor.value;
      if (song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)) {
        const card = document.createElement("div");
        card.className = "songCard";

        const img = document.createElement("img");
        img.src = song.cover || "cover.png";
        img.className = "cover";

        const title = document.createElement("p");
        title.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = URL.createObjectURL(song.file);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () => deleteSong(song.id);

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(audio);
        card.appendChild(deleteButton);
        area.appendChild(card);
      }
      cursor.continue();
    }
  };
}

// Filtro por década
function filterByDecade() {
  const decade = document.getElementById("decadeInput").value;
  const area = document.getElementById("libraryArea");
  const tx = db.transaction("songs", "readonly");
  const store = tx.objectStore("songs");
  const req = store.openCursor();

  area.innerHTML = `<h2>Canciones de la década de ${decade}</h2>`;

  req.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const song = cursor.value;
      if (song.year && song.year.startsWith(decade)) {
        const card = document.createElement("div");
        card.className = "songCard";

        const img = document.createElement("img");
        img.src = song.cover || "cover.png";
        img.className = "cover";

        const title = document.createElement("p");
        title.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = URL.createObjectURL(song.file);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () => deleteSong(song.id);

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(audio);
        card.appendChild(deleteButton);
        area.appendChild(card);
      }
      cursor.continue();
    }
  };
}