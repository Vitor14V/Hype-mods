import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Added imports for routing
import HomePage from './pages/home-page';
import AuthPage from './pages/auth-page';
import ProfilePage from './pages/profile-page';
import AdminPage from './pages/admin-page';
import GamePage from './pages/game-page'; // Added import for GamePage
import 'react-toastify/dist/ReactToastify.css';


const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/game" element={<GamePage />} /> {/* Added route for GamePage */}
    </Routes>
  </BrowserRouter>
);