import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const API_KEY = '328eb2b2f9105533279be240dee8a8da';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_PATH = 'https://image.tmdb.org/t/p/original';
const IMAGE_W500 = 'https://image.tmdb.org/t/p/w500';

function App() {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [hero, setHero] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [genres, setGenres] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTrending, resPopular, resGenres] = await Promise.all([
          fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
        ]);
        const dataTrending = await resTrending.json();
        const dataPopular = await resPopular.json();
        const dataGenres = await resGenres.json();

        if (dataGenres.genres) {
          const map = {};
          dataGenres.genres.forEach(g => { map[g.id] = g.name; });
          setGenres(map);
        }
        if (dataTrending.results) {
          setTrending(dataTrending.results);
          setHero(dataTrending.results[0]);
        }
        if (dataPopular.results) setPopular(dataPopular.results);
      } catch (error) {
        console.error('Error API:', error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } else {
      setSearchResults([]);
    }
  };

  const openDetails = async (movie) => {
    try {
      const type = movie.media_type === 'tv' ? 'tv' : 'movie';
      const res = await fetch(`${BASE_URL}/${type}/${movie.id}?api_key=${API_KEY}`);
      const data = await res.json();
      setSelectedMovie({ ...movie, ...data });
    } catch {
      setSelectedMovie(movie);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setSelectedMovie(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const getGenreNames = (movie) => {
    if (movie.genres) return movie.genres.map(g => g.name).slice(0, 3);
    if (movie.genre_ids) return movie.genre_ids.slice(0, 3).map(id => genres[id]).filter(Boolean);
    return [];
  };

  const getRuntime = (movie) => {
    if (movie.runtime) return `${movie.runtime} min`;
    if (movie.episode_run_time?.[0]) return `${movie.episode_run_time[0]} min`;
    return null;
  };

  const displayList = searchResults.length > 0 ? searchResults : trending;

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-logo" onClick={goHome}>
          CineSearch
        </span>
        <div className="navbar-search-wrapper">
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={handleSearch}
            className="navbar-search"
          />
         
        </div>
      </nav>

      {selectedMovie ? (
        <div className="detail-wrapper">
          <div className="detail-backdrop-container">
            <img
              src={`${IMAGE_PATH}${selectedMovie.backdrop_path}`}
              className="detail-backdrop-img"
              alt=""
            />
            <div className="detail-backdrop-gradient" />
          </div>

          <div className="detail-content">
            <img
              src={`${IMAGE_W500}${selectedMovie.poster_path}`}
              className="detail-poster"
              alt=""
            />

            <div className="detail-info">
              <h1 className="detail-title">
                {selectedMovie.title || selectedMovie.name}
              </h1>

              <p className="detail-tagline">
                "{selectedMovie.tagline || 'Act natural.'}"
              </p>

              <div className="detail-meta">
                <span className="detail-rating">
                  ☆ {selectedMovie.vote_average?.toFixed(1)} / 10
                </span>
                <span className="detail-meta-sep">|</span>
                <span className="detail-meta-item">
                  {(selectedMovie.release_date || selectedMovie.first_air_date || '').split('-')[0]}
                </span>
                {getRuntime(selectedMovie) && (
                  <>
                    <span className="detail-meta-sep">|</span>
                    <span className="detail-meta-item">⏱ {getRuntime(selectedMovie)}</span>
                  </>
                )}
              </div>

              <div className="detail-genres">
                {getGenreNames(selectedMovie).map(g => (
                  <span key={g} className="genre-tag">{g}</span>
                ))}
              </div>

              <h3 className="detail-overview-title">Overview</h3>
              <p className="detail-overview-text">{selectedMovie.overview}</p>

              <button className="btn-back" onClick={goHome}>
                Back
              </button>
            </div>
          </div>
        </div>

      ) : (

        <div>
          {/* HERO */}
          {hero && !searchQuery && (
            <div className="hero">
              <img
                src={`${IMAGE_PATH}${hero.backdrop_path}`}
                className="hero-img"
                alt=""
              />
              <div className="hero-gradient-left" />
              <div className="hero-gradient-bottom" />

              <div className="hero-content">
                <h1 className="hero-title">{hero.title || hero.name}</h1>
                <p className="hero-overview">{hero.overview}</p>
                <button className="btn-primary" onClick={() => openDetails(hero)}>
                  ⓘ More Info
                </button>
              </div>
            </div>
          )}

          <div className="section">
            <h2 className="section-title">
              {searchResults.length > 0 ? `Results for: "${searchQuery}"` : 'Trending Now'}
            </h2>
            <Slider movies={displayList} onOpen={openDetails} />
          </div>

          {!searchQuery && popular.length > 0 && (
            <div className="section-last">
              <h2 className="section-title">Popular</h2>
              <Slider movies={popular} onOpen={openDetails} />
            </div>
          )}
        </div>
      )}

      <footer className="footer">
        <p className="footer-title">© 2026 CINESEARCH. ALL RIGHTS RESERVED.</p>
        <p className="footer-sub">
          This website uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </div>
  );
}

function Slider({ movies, onOpen }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const CARD_W = 148;
  const GAP = 8;
  const SCROLL_AMT = (CARD_W + GAP) * 4;

  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_AMT, behavior: 'smooth' });
    setTimeout(updateArrows, 400);
  };

  return (
    <div className="slider-wrapper">
      {canLeft && (
        <button className="slider-arrow slider-arrow-left" onClick={() => scroll(-1)}>
          ‹
        </button>
      )}

      <div className="slider-track" ref={ref} onScroll={updateArrows}>
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} onClick={() => onOpen(movie)} />
        ))}
      </div>

      {canRight && (
        <button className="slider-arrow slider-arrow-right" onClick={() => scroll(1)}>
          ›
        </button>
      )}
    </div>
  );
}

function MovieCard({ movie, onClick }) {
  return (
    <div className="movie-card" onClick={onClick}>
      <div className="movie-card-inner">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            className="movie-card-img"
            alt=""
          />
        ) : (
          <div className="movie-card-no-img">No image</div>
        )}
      </div>
    </div>
  );
}

export default App;