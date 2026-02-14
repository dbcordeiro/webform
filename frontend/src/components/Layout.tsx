import { Link } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="app-layout">
      <header className="site-header">
        <Link to="/builder" className="logo">
          Argo
        </Link>
      </header>
      <main className="site-main">{children}</main>
    </div>
  );
}
