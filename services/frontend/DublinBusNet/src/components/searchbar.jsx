import React, { useState, useRef, useEffect } from "react";
import "./searchbar.css";

const API_BASE = import.meta.env.VITE_BASE_API || "/api";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mostCommonRoute, setMostCommonRoute] = useState(null);
  const [lastRoute, setLastRoute] = useState(null);
  const [favourites, setFavourites] = useState([]); // start empty
  const [isStarActive, setIsStarActive] = useState(false);
  const containerRef = useRef(null);
  const userId = "USER123"; // mock user ID for now

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

  // function to fetch the last route entered by the user.
  async function fetchLastRoute() {
    console.log(`Calling API: GET ${API_BASE}/users/${userId}/routes/last ...`);

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/routes/last`);
      console.log(`API call completed with status: ${res.status}`);

      if (!res.ok) {
        console.error(
          "Failed to fetch last route:",
          res.status,
          await res.text()
        );

        // fallback fake last route
        const fake = {
          route_id: "27",
          origin_stop: "Clare Hall",
          destination_stop: "Ringsend Depot",
        };
        setLastRoute(fake);
        console.log("Using fake last route:", fake);
        return;
      }

      const body = await res.json();
      console.log("Successfully fetched last route:", body);

      if (body?.data) {
        setLastRoute(body.data);
      } else {
        const fake = {
          route_id: "27",
          origin_stop: "Clare Hall",
          destination_stop: "Ringsend Depot",
        };
        setLastRoute(fake);
        console.log("Backend returned no data, using fake:", fake);
      }
    } catch (err) {
      console.error("Error fetching last route:", err);
      const fake = {
        route_id: "27",
        origin_stop: "Clare Hall",
        destination_stop: "Ringsend Depot",
      };
      setLastRoute(fake);
      console.log("Using fake last route after error:", fake);
    } finally {
      console.log("Finished attempting to call /users/{user_id}/routes/last");
    }
  }

  // function to add favourites to the favourite list
  async function handleStarClick() {
    const route = query.trim();

    if (!route) {
      console.warn("No route entered. Cannot add favourite.");
      return;
    }

    // Prevent more than 3 favourites
    if (favourites.includes(route)) {
      console.log("ℹRoute already in favourites.");
      setIsStarActive(true);
      return;
    }

    if (favourites.length >= 3) {
      console.warn("Maximum of 3 favourite routes reached.");
      return;
    }

    const userId = "USER123";
    console.log(
      `Calling API: POST ${API_BASE}/users/${userId}/routes/favourite ...`
    );
    console.log("Payload (mock):", { route_id: route });

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/routes/favourite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: route }),
      });

      console.log(`API call completed with status: ${res.status}`);

      if (!res.ok) {
        console.error("Failed to add favourite route:", res.status);
        console.log("Using mock success for now.");
      }
    } catch (err) {
      console.error("Error sending POST request:", err);
      console.log("Using mock success due to error.");
    } finally {
      console.log("Finished POST to /routes/favourite");
    }

    // Update UI
    setFavourites([...favourites, route]);
    setIsStarActive(true);
  }

  // Function to call the "most common route" endpoint
  async function fetchMostCommonRoute() {
    console.log(
      `Calling API: GET ${API_BASE}/users/${userId}/routes/common ...`
    );
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/routes/common`);
      console.log(`API call completed with status: ${res.status}`);

      if (!res.ok) {
        console.error(
          "Failed to fetch most common route:",
          res.status,
          await res.text()
        );
        // define fake fallback if backend not up yet
        const fakeRoute = {
          route_id: "155",
          origin_stop: "Blanchardstown",
          destination_stop: "Bray Station",
        };
        setMostCommonRoute(fakeRoute);
        console.log("Using fake most common route:", fakeRoute);
        return;
      }

      const body = await res.json();
      console.log("uccessfully fetched most common route:", body);

      if (body?.data) {
        setMostCommonRoute(body.data);
      } else {
        // fallback if empty
        const fakeRoute = {
          route_id: "155",
          origin_stop: "Blanchardstown",
          destination_stop: "Bray Station",
        };
        setMostCommonRoute(fakeRoute);
        console.log("Backend returned no data, using fake route:", fakeRoute);
      }
    } catch (err) {
      console.error("Error fetching most common route:", err);
      const fakeRoute = {
        route_id: "155",
        origin_stop: "Blanchardstown",
        destination_stop: "Bray Station",
      };
      setMostCommonRoute(fakeRoute);
      console.log("Using fake most common route after error:", fakeRoute);
    } finally {
      console.log("Finished attempting to call /users/{user_id}/routes/common");
    }
  }

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
      <form onSubmit={handleSubmit} className="searchbar-form">
        {/* input box */}
        <div className="searchbar-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsStarActive(false);
            }}
            onFocus={() => {
              setShowDropdown(true);
              fetchFavouriteRoutes();
              fetchMostCommonRoute();
              fetchLastRoute();
            }}
            placeholder="Search for a route or stop..."
            className="searchbar-input"
          />
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
                onClick={() => handleFavouriteClick(mostCommonRoute.route_id)}
              >
                <b>Most Common:</b> {mostCommonRoute.route_id}
              </li>
            </>
          )}

          {/* Show the last taken route in the searchbar*/}
          {lastRoute && (
            <>
              <li className="dropdown-divider"></li>
              <li
                className="dropdown-item"
                onClick={() => handleFavouriteClick(lastRoute.route_id)}
              >
                <b>Last Route:</b> {lastRoute.route_id}
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
