// Check if speech synthesis is available
export function isSpeechSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }
  
  // Stop any ongoing speech
  export function stopSpeech(): void {
    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
  }
  
  // Speak text with error handling
  export function speakText(text: string): void {
    if (!isSpeechSupported()) return;
  
    // Stop any ongoing speech first
    stopSpeech();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.pitch = 1;
      
      // Add error handling for the utterance
      utterance.onerror = (event) => {
        console.error('Speech synthesis utterance error:', event);
      };
  
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }