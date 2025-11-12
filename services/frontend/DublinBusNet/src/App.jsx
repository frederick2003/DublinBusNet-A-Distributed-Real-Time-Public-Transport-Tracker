import BusMap from "./components/map.jsx";
import Navbar from "./components/navbar.jsx";
import SearchBar from "./components/searchbar";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Navbar />
      <BusMap />
    </div>
  );
}

export default App;
