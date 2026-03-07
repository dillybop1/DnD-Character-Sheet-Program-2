import { HashRouter, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { CharactersPage } from "./pages/CharactersPage";
import { CompendiumPage } from "./pages/CompendiumPage";
import { HomebrewPage } from "./pages/HomebrewPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="brand-lockup">
          <p>D&D Character Sheet</p>
          <strong>Desktop Workshop</strong>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
            to="/characters"
          >
            Characters
          </NavLink>
          <NavLink
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
            to="/compendium"
          >
            Compendium
          </NavLink>
          <NavLink
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
            to="/homebrew"
          >
            Homebrew
          </NavLink>
          <NavLink
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
            to="/settings"
          >
            Settings
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <span>Offline-first</span>
          <strong>Local DB + committed handoff docs</strong>
        </div>
      </aside>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          element={<AppShell />}
          path="/"
        >
          <Route
            element={
              <Navigate
                replace
                to="/characters"
              />
            }
            index
          />
          <Route
            element={<CharactersPage />}
            path="characters"
          />
          <Route
            element={<CompendiumPage />}
            path="compendium"
          />
          <Route
            element={<HomebrewPage />}
            path="homebrew"
          />
          <Route
            element={<SettingsPage />}
            path="settings"
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
