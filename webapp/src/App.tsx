import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { WorkbenchLayout } from "./pages/WorkbenchLayout";
import { TextToImagePanel } from "./pages/workbench/TextToImagePanel";
import { ImageToImagePanel } from "./pages/workbench/ImageToImagePanel";
import { MultiImagePanel } from "./pages/workbench/MultiImagePanel";
import { VideoGenerationPanel } from "./pages/workbench/VideoGenerationPanel";
import { TaskCenterPage } from "./pages/TaskCenterPage";
import { GalleryPage } from "./pages/GalleryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import { useSettingsStore } from "./store/useSettingsStore";
import { useHistoryStore } from "./store/useHistoryStore";
import { useTaskStore } from "./store/useTaskStore";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const refreshHistory = useHistoryStore((s) => s.refresh);
  const hydrateTasks = useTaskStore((s) => s.hydrate);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    refreshHistory();
    // Tasks need the API key (to resume polling in-flight jobs), so wait
    // for settings to finish loading from localStorage first.
    hydrateSettings().then(() => {
      hydrateTasks(useSettingsStore.getState().settings);
    });
    initAuth();
    // Re-fetch history whenever who's signed in changes (login, logout, or
    // switching accounts) so the gallery always reflects the right backend.
    let lastUserId: string | undefined;
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.user?.id !== lastUserId) {
        lastUserId = state.user?.id;
        refreshHistory();
      }
    });
    return unsubscribe;
  }, [hydrateSettings, refreshHistory, hydrateTasks, initAuth]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AppShell />}>
        <Route path="/studio" element={<WorkbenchLayout />}>
          <Route index element={<Navigate to="text-to-image" replace />} />
          <Route path="text-to-image" element={<TextToImagePanel />} />
          <Route path="image-to-image" element={<ImageToImagePanel />} />
          <Route path="multi-image" element={<MultiImagePanel />} />
          <Route path="video" element={<VideoGenerationPanel />} />
        </Route>
        <Route path="/tasks" element={<TaskCenterPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
