import { HashRouter, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { CharacterRosterPage } from "./pages/CharacterRosterPage";
import { CharacterSheetPage } from "./pages/CharacterSheetPage";
import { CharactersPage } from "./pages/CharactersPage";
import { CompendiumPage } from "./pages/CompendiumPage";
import { HomebrewPage } from "./pages/HomebrewPage";
import { formatBuiltAt, getLaunchSummary, getRuntimeLabel, useAppInfo } from "./lib/appInfo";
import { SettingsPage } from "./pages/SettingsPage";

function AppShell() {
  const appInfo = useAppInfo();

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
          <span>{getRuntimeLabel(appInfo)}</span>
          <strong>{appInfo ? `v${appInfo.appVersion}` : "Checking build details..."}</strong>
          <p className="sidebar-note__meta">
            {appInfo
              ? appInfo.builtAt
                ? `Built ${formatBuiltAt(appInfo.builtAt)}`
                : "Live dev session"
              : "Loading runtime diagnostics."}
          </p>
          <p className="sidebar-note__meta">
            {appInfo ? getLaunchSummary(appInfo.launchPath) : "Waiting for launch path."}
          </p>
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
            element={<CharacterRosterPage />}
            path="characters"
          />
          <Route
            element={<CharactersPage />}
            path="characters/new"
          />
          <Route
            element={<CharacterSheetPage />}
            path="characters/:characterId"
          />
          <Route
            element={<CharactersPage />}
            path="characters/:characterId/edit"
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
