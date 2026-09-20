import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Join from './pages/Join';
import Jobs from './pages/Jobs';
import Quack from './pages/Quack';
import Events from './pages/Events';
import Links from './pages/Links';
import Admin from './pages/Admin';
import Shop from './pages/Shop';

const ExternalRedirect: React.FC<{ to: string }> = ({ to }) => {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/loja" element={<Shop />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/atividades" element={<Events />} />
            <Route
              path="/projetos"
              element={<ExternalRedirect to="https://github.com/neei-aaualg/student-showcase" />}
            />
            <Route path="/colaborar" element={<Join />} />
            <Route path="/vagas" element={<Jobs />} />
            <Route path="/quack" element={<Quack />} />
            <Route path="/links" element={<Links />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
