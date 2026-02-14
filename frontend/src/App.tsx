import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FormBuilderPage from "./pages/FormBuilderPage";
import FormRendererPage from "./pages/FormRendererPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/builder" />} />
        <Route path="/builder" element={<FormBuilderPage />} />
        <Route path="/forms/:id" element={<FormRendererPage />} />
      </Routes>
    </BrowserRouter>
  );
}
