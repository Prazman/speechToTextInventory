// speech.js — Web Speech API wrapper
let recognition = null;
let shouldRestart = false;

export function isSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(lang = 'fr-FR', onResult, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = lang;
  shouldRestart = true;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        onResult(event.results[i][0].transcript.trim());
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    if (event.error === 'network') {
      onError(event);
      shouldRestart = false;
      return;
    }
    onError(event);
  };

  recognition.onend = () => {
    if (shouldRestart) {
      try { recognition.start(); } catch { /* already started */ }
    }
  };

  recognition.start();
}

export function stopListening() {
  shouldRestart = false;
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

// Single-shot: capture one phrase then stop
let onceRecognition = null;

export function listenOnce(lang = 'fr-FR', onResult, onError) {
  stopOnce();
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  onceRecognition = new SpeechRecognition();
  onceRecognition.continuous = false;
  onceRecognition.interimResults = false;
  onceRecognition.lang = lang;

  onceRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    onResult(transcript);
    onceRecognition = null;
  };

  onceRecognition.onerror = (event) => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      onError(event);
    }
    onceRecognition = null;
  };

  onceRecognition.onend = () => { onceRecognition = null; };

  onceRecognition.start();
}

export function stopOnce() {
  if (onceRecognition) {
    onceRecognition.abort();
    onceRecognition = null;
  }
}
