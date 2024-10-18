import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/pages/Navbar.tsx'
import Display from '@/pages/Display.tsx'


function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Navbar />}/>
          <Route path="/cosmograph" element={<Display/>}/>
        </Routes>
    </Router>
    </ThemeProvider>

  )
}

export default App
