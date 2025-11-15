export class TextToSpeech {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    // Cancel any ongoing speech
    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties
    this.utterance.rate = options?.rate || 0.9; // Slightly slower for clarity
    this.utterance.pitch = options?.pitch || 1;
    this.utterance.volume = options?.volume || 1;

    // Try to use a more natural voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      voice => voice.lang.startsWith('en') && (voice.name.includes('Natural') || voice.name.includes('Premium'))
    ) || voices.find(voice => voice.lang.startsWith('en'));

    if (preferredVoice) {
      this.utterance.voice = preferredVoice;
    }

    // Add event listeners
    this.utterance.onstart = () => {
      console.log('Speech started');
    };

    this.utterance.onend = () => {
      console.log('Speech ended');
    };

    this.utterance.onerror = (event) => {
      console.error('Speech error:', event);
    };

    // Speak the text
    this.synth.speak(this.utterance);
  }

  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  isPaused(): boolean {
    return this.synth.paused;
  }
}

// Singleton instance
let ttsInstance: TextToSpeech | null = null;

export const getTextToSpeech = (): TextToSpeech => {
  if (!ttsInstance) {
    ttsInstance = new TextToSpeech();
  }
  return ttsInstance;
};
