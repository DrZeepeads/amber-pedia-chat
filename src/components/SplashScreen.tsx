import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';

export const SplashScreen = () => {
  const setCurrentView = useChatStore((state) => state.setCurrentView);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentView('welcome');
    }, 2500);
    return () => clearTimeout(timer);
  }, [setCurrentView]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: [0.68, -0.55, 0.265, 1.55],
        }}
        className="text-center space-y-6"
      >
        {/* Animated Logo/Title */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Nelson-GPT
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full mx-auto w-48"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-xl text-muted-foreground font-medium"
        >
          Trusted Pediatric AI
        </motion.p>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-2 justify-center pt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Footer Text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 text-sm text-muted-foreground text-center px-4"
      >
        Pediatric Knowledge at Your Fingertips — Powered by Nelson Textbook of Pediatrics
      </motion.p>
    </motion.div>
  );
};
