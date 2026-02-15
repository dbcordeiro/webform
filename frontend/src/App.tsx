import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import FormBuilderPage from "./pages/FormBuilderPage";
import FormRendererPage from "./pages/FormRendererPage";
import EditFormPage from "./pages/EditFormPage";
import EditResponsePage from "./pages/EditResponsePage";

function ShortFormRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/forms/${id}` : "/builder"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/builder" />} />
          <Route path="/builder" element={<FormBuilderPage />} />
          <Route path="/builder/edit/:id" element={<EditFormPage />} />
          <Route path="/f/:id" element={<ShortFormRedirect />} />
          <Route path="/forms/:id" element={<FormRendererPage />} />
          <Route path="/forms/:id/response/:responseId/edit" element={<EditResponsePage />} />
          <Route path="/forms/:id/response/:responseId/edit/" element={<EditResponsePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
