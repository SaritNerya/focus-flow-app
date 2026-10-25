import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Library from "./pages/Library";
import ContentPage from "./pages/ContentPage";
import History from "./pages/History";
import SessionPage from "./pages/SessionPage";
import NotFound from "./components/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Library />} />
        <Route path="/content/:id" element={<ContentPage />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<SessionPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
