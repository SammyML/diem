import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import FactionPage from './pages/FactionPage';
import ArenaPage from './pages/ArenaPage';
import NetworkPage from './pages/NetworkPage';
import { GamingDashboard } from './components/GamingDashboard';
import CinematicBackground from './components/CinematicBackground';

function App() {
    return (
        <Router>
            <div className="App">
                <CinematicBackground />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/app" element={<GamingDashboard />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/factions" element={<FactionPage />} />
                    <Route path="/arena" element={<ArenaPage />} />
                    <Route path="/network" element={<NetworkPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
