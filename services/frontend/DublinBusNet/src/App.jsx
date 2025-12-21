import BusMap from "./components/map.jsx";
import useAuth from "./auth/useAuth";
import "./App.css";

function App() {
  const auth = useAuth();

  return (
    <div className="App">
      <BusMap auth={auth}/>
    </div>
  );
}

export default App;
