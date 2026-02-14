import { Routes, Route, Navigate } from "react-router-dom";
import FormBuilderWrapper from "./FormBuilderWrapper";
import FormRendererPage from "./FormRendererPage";

export default function App() {
  return (
    <>
      <header className="header">
        <div className="logo">argo</div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/create" />} />
          <Route path="/create" element={<FormBuilderWrapper />} />
          <Route path="/f/:formId" element={<FormRendererPage />} />
        </Routes>
      </main>
    </>
  );
}
