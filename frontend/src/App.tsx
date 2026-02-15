import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import FormBuilderPage from "./pages/FormBuilderPage";
import FormRendererPage from "./pages/FormRendererPage";

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
          <Route path="/f/:id" element={<ShortFormRedirect />} />
          <Route path="/forms/:id" element={<FormRendererPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
