import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "0.5rem", borderRadius: "8px", flex: 1 }}
      />
      <button
        type="submit"
        style={{ padding: "0.5rem 1rem", borderRadius: "8px" }}
      >
        Search
      </button>
    </form>
  );
}
