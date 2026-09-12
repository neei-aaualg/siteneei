import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Join from './pages/Join';
import Jobs from './pages/Jobs';
import Quack from './pages/Quack';
import Events from './pages/Events';
import Links from './pages/Links';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/projetos" element={<Projects />} />
          <Route path="/pertencer" element={<Join />} />
          <Route path="/vagas" element={<Jobs />} />
          <Route path="/quack" element={<Quack />} />
          <Route path="/links" element={<Links />} />
        </Routes>
      </Layout>
    </Router>
  </ThemeProvider>
  );
};

export default App;