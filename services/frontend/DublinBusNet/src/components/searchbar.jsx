import React, { useState, useRef, useEffect } from "react";
import "./searchbar.css";

// Use the same API base env var as the map so requests hit the backend service.
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function SearchBar({ onSearch, user, setFavouriteRoute }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const mostCommonRoute = user?.most_common_route ?? null;
  const favourites = user?.favourite_route ? [user.favourite_route] : [];
  const [isStarActive, setIsStarActive] = useState(false);
  const containerRef = useRef(null);
  const [direction, setDirection] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalized = query.trim().toUpperCase();
    setQuery(normalized);
    if (onSearch) onSearch(normalized, direction);
    setShowDropdown(false);
  };

  const handleFavouriteClick = (fav) => {
    setQuery(fav);
    if (onSearch) onSearch(fav, direction);
    setShowDropdown(false);
  };

  // function to add favourites to the favourite list
  async function handleStarClick() {
    const route = query.trim().toUpperCase();

    if (!route) return;

    if (!user) {
      alert("Please sign in to save favourite routes.");
      return;
    }

    try {
      await setFavouriteRoute(route);
      setIsStarActive(true);
    } catch {
      alert("Failed to save favourite route");
    }
  }

  // Hide dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="searchbar-container" ref={containerRef}>
      <form onSubmit={handleSubmit} className="searchbar-form">
        {/* input box */}
        <div className="searchbar-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              // Always store and display uppercase so route short names match GTFS.
              setQuery(e.target.value.toUpperCase());
              setIsStarActive(false);
            }}
            onFocus={() => {
              setShowDropdown(true);
            }}
            placeholder="Search for a route or stop..."
            className="searchbar-input"
          />
          {/* DIRECTION SELECTOR */}
          <select
            className="direction-select"
            value={direction}
            onChange={(e) => setDirection(Number(e.target.value))}
          >
            <option value={0}>Dir 0</option>
            <option value={1}>Dir 1</option>
          </select>

          {/* Star icon button */}
          <span
            className={`star-icon ${isStarActive ? "active" : ""}`}
            onClick={handleStarClick}
            title={isStarActive ? "Already in favourites" : "Add to favourites"}
          >
            ★
          </span>
        </div>
        {/* Search Button */}
        <button type="submit" className="searchbar-button">
          Search
        </button>
      </form>
      {/*Show favourite routes in the searchbar */}
      {showDropdown && (
        <ul className="dropdown-list">
          {favourites.map((fav) => (
            <li
              key={fav}
              className="dropdown-item"
              onClick={() => handleFavouriteClick(fav)}
            >
              ⭐ {fav}
            </li>
          ))}

          {/*Show "most common route" below favourites */}
          {mostCommonRoute && (
            <>
              <li className="dropdown-divider"></li>
              <li
                className="dropdown-item"
                onClick={() => handleFavouriteClick(mostCommonRoute)}
              >
                <b>Most Common:</b> {mostCommonRoute}
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
