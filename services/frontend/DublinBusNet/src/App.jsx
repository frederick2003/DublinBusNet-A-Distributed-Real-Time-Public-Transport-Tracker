import Map from "./components/map.jsx";
import Navbar from "./components/navbar.jsx";
import SearchBar from "./components/searchbar";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Navbar />
      <Map />
      <SearchBar />
    </div>
  );
}

export default App;
