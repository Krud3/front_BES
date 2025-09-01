import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Define the animation variants
const animations = {
  initial: { opacity: 0, x: -50 }, // Start off-screen to the left and invisible
  animate: { opacity: 1, x: 0 },   // Animate to full opacity and original position
  exit: { opacity: 0, x: 50 },    // Exit to the right and fade out
};

interface AnimatedPageProps {
  children: ReactNode;
}

const AnimatedPage = ({ children }: AnimatedPageProps) => {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }} // Control the speed of the transition
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;