import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import FormBuilderPage from "./pages/FormBuilderPage";
import FormRendererPage from "./pages/FormRendererPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/builder" />} />
          <Route path="/builder" element={<FormBuilderPage />} />
          <Route path="/forms/:id" element={<FormRendererPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
