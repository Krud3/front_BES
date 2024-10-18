import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/pages/Navbar.tsx';
import Display from '@/pages/Display.tsx';
import { Button } from './components/ui/button';
import { useState } from 'react';

function App() {
  const [labelButton, setLabelButton] = useState('Click me');

  // Fix handleClick function: It's supposed to take a string (label) and set it to state
  const handleClick = (label: string) => {
    setLabelButton(label);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Navbar /> {/* Navbar component remains outside of Routes */}

        <Routes>
          <Route
            path="/cosmograph"
            element={
              <>
                {/* Pass handleClick correctly, onClick needs a function */}
                <Button onClick={() => handleClick('belief')}>Set to Belief</Button>
                <Button onClick={() => handleClick('publicBelief')}>Set to Public Belief</Button>
                <Button onClick={() => handleClick('isSpeaking')}>Set to Is Speaking</Button>
                <Button onClick={() => handleClick('id')}>Set to ID</Button>

                {/* Pass the labelButton state and setLabelButton function to Display */}
                <Display labelButton={labelButton} />
              </>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
