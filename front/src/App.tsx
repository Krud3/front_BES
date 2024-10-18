import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './pages/Navbar.tsx'
import { Button } from "./components/ui/button.tsx";


function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Navbar />}/>
        </Routes>
        <Routes>
          <Route path="/asdf" element={<Button>xD</Button>}/>
        </Routes>
    </Router>
    </ThemeProvider>

  )
}

export default App
