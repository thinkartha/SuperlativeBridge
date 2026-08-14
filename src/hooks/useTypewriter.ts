import { useState, useEffect, useCallback } from "react";

interface UseTypewriterOptions {
  words: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  delayBetween?: number;
}

export const useTypewriter = ({
  words,
  typeSpeed = 100,
  deleteSpeed = 60,
  delayBetween = 2000,
}: UseTypewriterOptions) => {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentWord = words[wordIndex];

    if (isDeleting) {
      setText(currentWord.substring(0, text.length - 1));
    } else {
      setText(currentWord.substring(0, text.length + 1));
    }

    if (!isDeleting && text === currentWord) {
      setTimeout(() => setIsDeleting(true), delayBetween);
      return;
    }

    if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }
  }, [text, wordIndex, isDeleting, words, delayBetween]);

  useEffect(() => {
    const speed = isDeleting ? deleteSpeed : typeSpeed;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting, typeSpeed, deleteSpeed]);

  return { text, wordIndex };
};
