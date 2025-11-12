import React, { useState, useRef, useEffect } from "react";
import "./searchbar.css";

const API_BASE = import.meta.env.VITE_BASE_API || "/api";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const favourites = ["46A", "145", "16"]; // Mock favourites for now
  const containerRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query.trim());
    setShowDropdown(false);
  };

  const handleFavouriteClick = (fav) => {
    setQuery(fav);
    if (onSearch) onSearch(fav);
    setShowDropdown(false);
  };

  // Function to call the backend when search bar is clicked/focused
  async function fetchFavouriteRoutes() {
    const userId = "USER123"; // mock for now
    console.log(
      `Calling API: GET ${API_BASE}/users/${userId}/routes/favourite ...`
    );

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/routes/favourite`);
      console.log(`API call completed with status: ${res.status}`);

      if (!res.ok) {
        console.error(
          "Failed to fetch favourite route:",
          res.status,
          await res.text()
        );
        return;
      }

      const body = await res.json();
      console.log("Successfully queried backend, response:", body);
    } catch (err) {
      console.error("Error fetching favourite route:", err);
    } finally {
      console.log(
        "Finished attempting to call /users/{user_id}/routes/favourite"
      );
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
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setShowDropdown(true);
            fetchFavouriteRoutes();
          }}
          placeholder="Search for a route or stop..."
          className="searchbar-input"
        />
        <button type="submit" className="searchbar-button">
          Search
        </button>
      </form>

      {showDropdown && favourites.length > 0 && (
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
        </ul>
      )}
    </div>
  );
}
