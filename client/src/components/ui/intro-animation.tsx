import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              opacity: 1,
            }}
            transition={{
              duration: 2,
              times: [0, 0.5, 1],
              ease: "easeInOut"
            }}
            className="text-center"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              BY LITE STUDIO
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
