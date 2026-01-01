import {useState, useEffect, useCallback} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';

// Import Voice with try-catch to handle cases where it's not available
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (error) {
  console.warn('[Voice] Failed to load voice module:', error);
}

// Type imports for TypeScript
import type {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const initVoice = async () => {
      try {
        // Check if Voice module is loaded
        if (!Voice) {
          setIsAvailable(false);
          setError('Voice recognition is not available. The native module could not be loaded.');
          return;
        }

        // Check if the required methods exist
        if (typeof Voice.isAvailable !== 'function') {
          setIsAvailable(false);
          setError('Voice module is incomplete - rebuild required');
          return;
        }

        // Destroy any previous instance
        try {
          if (typeof Voice.destroy === 'function') {
            await Voice.destroy();
          }
        } catch (e) {
          // Silently ignore cleanup errors
        }

        // Check if voice recognition is available
        const available = await Voice.isAvailable();
        setIsAvailable(!!available);

        if (available) {
          // Set up event listeners
          Voice.onSpeechStart = onSpeechStart;
          Voice.onSpeechEnd = onSpeechEnd;
          Voice.onSpeechResults = onSpeechResults;
          Voice.onSpeechError = onSpeechError;
          Voice.onSpeechPartialResults = onSpeechResults;
          Voice.onSpeechVolumeChanged = () => {
            // Silently track volume changes
          };
        } else {
          setIsAvailable(false);
          setError('Speech recognition is not supported on this device.');
        }
      } catch (err: any) {
        const errorMessage = err?.message || err?.code || String(err) || 'Unknown error';
        setIsAvailable(false);
        setError(errorMessage);
      }
    };

    initVoice();

    return () => {
      if (Voice && typeof Voice.destroy === 'function') {
        Voice.destroy()
          .then(() => {
            if (typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
          })
          .catch(() => {
            // Silently ignore cleanup errors
          });
      }
    };
  }, []);

  const onSpeechStart = () => {
    console.log('[Voice] Speech started - listening...');
    setIsRecording(true);
    setError(null);
  };

  const onSpeechEnd = () => {
    console.log('[Voice] Speech ended');
    setIsRecording(false);
  };

  const onSpeechResults = (event: SpeechResultsEvent) => {
    console.log('[Voice] Speech results received:', event.value);
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      console.log('[Voice] Recognized text:', text);
      setRecognizedText(text);
      // Clear any previous errors when we get successful results
      setError(null);
    }
  };

  const onSpeechError = (event: SpeechErrorEvent) => {
    let errorMsg = 'Speech recognition failed';

    try {
      if (event?.error) {
        if (typeof event.error === 'string') {
          errorMsg = event.error;
        } else if (typeof event.error === 'object' && event.error !== null) {
          if ('message' in event.error && typeof event.error.message === 'string') {
            errorMsg = event.error.message;
          } else if ('code' in event.error) {
            errorMsg = `Error code: ${event.error.code}`;
          } else {
            try {
              errorMsg = JSON.stringify(event.error);
            } catch (stringifyError) {
              errorMsg = 'Speech recognition error (unable to format details)';
            }
          }
        }
      }
    } catch (formatError) {
      errorMsg = 'Speech recognition error';
    }

    setIsRecording(false);

    // List of common non-critical errors to silently ignore
    const ignoredErrors = [
      '7/client',     // No match (variant 1)
      '7/No match',   // No match (variant 2)
      '7/',           // Any error code 7 (no speech detected)
      '5/client',     // Client error
      '5/',           // Any error code 5
      '8/client',     // RecognitionService busy
      '8/',           // Any error code 8
      '11/client',    // Didn't understand / unclear speech
      '11/',          // Any error code 11 (insufficient permissions or didn't understand)
      '111/',         // Didn't understand / unclear speech
      "didn't understand", // Didn't understand message (lowercase)
      "Didn't understand", // Didn't understand message (capitalized)
      'please try again', // Try again message
      'no-speech',    // No speech input
      'aborted',      // User aborted
      'cancelled',    // User cancelled
      'not recognized', // Not recognized
      'no match',     // No match found
    ];

    const isIgnoredError = ignoredErrors.some(ignored => errorMsg.includes(ignored));

    // Log all errors for debugging
    console.log('[Voice] Speech error (ignored=' + isIgnoredError + '):', errorMsg);
    console.log('[Voice] Error event:', JSON.stringify(event));

    if (!isIgnoredError) {
      // Real error - log it and notify user
      console.error('[Voice] Speech error:', errorMsg);
      console.error('[Voice] Error details:', event?.error);
      setError(errorMsg);
      if (errorMsg !== '{}' && errorMsg !== '[object Object]') {
        Alert.alert('Voice Recognition Error', errorMsg);
      }
    } else {
      // Common/expected error - silently handle it (but still log for debugging)
      console.log('[Voice] Ignoring common error:', errorMsg);
      setError(null);
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice input.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const startRecording = useCallback(async () => {
    try {
      console.log('[Voice] startRecording called');

      if (!Voice) {
        console.error('[Voice] Voice module not loaded');
        Alert.alert('Voice Not Available', 'Voice recognition is not available.\n\nThe app needs to be rebuilt with native modules.');
        return;
      }

      if (!isAvailable) {
        console.error('[Voice] Voice not available on this device');
        Alert.alert('Voice Not Available', 'Speech recognition is not supported on this device.\n\nRequirements:\n• Android: Google app installed\n• iOS: iOS 10 or later');
        return;
      }

      if (typeof Voice.start !== 'function') {
        console.error('[Voice] Voice.start is not a function');
        Alert.alert('Voice Error', 'Voice module is not properly configured. Please rebuild the app.');
        return;
      }

      console.log('[Voice] Requesting microphone permission...');
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.error('[Voice] Microphone permission denied');
        Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
        return;
      }

      console.log('[Voice] Permission granted, starting voice recognition...');
      setRecognizedText('');
      setError(null);

      // Start voice recognition with simplified settings
      // Using default Android settings for better compatibility
      console.log('[Voice] Calling Voice.start with language: en-US');
      await Voice.start('en-US');
      console.log('[Voice] Voice.start completed successfully');
    } catch (err: any) {
      const errorMessage = err?.message || err?.code || String(err) || 'Failed to start recording';
      console.error('[Voice] Error starting recording:', errorMessage);
      console.error('[Voice] Full error:', err);
      setError(errorMessage);
      setIsRecording(false);
      Alert.alert('Voice Recognition Error', errorMessage);
    }
  }, [isAvailable]);

  const stopRecording = useCallback(async () => {
    try {
      if (!Voice || typeof Voice.stop !== 'function') {
        setIsRecording(false);
        return;
      }
      await Voice.stop();
      setIsRecording(false);
    } catch (err) {
      setIsRecording(false);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    try {
      if (!Voice || typeof Voice.cancel !== 'function') {
        setIsRecording(false);
        setRecognizedText('');
        return;
      }
      await Voice.cancel();
      setIsRecording(false);
      setRecognizedText('');
    } catch (err) {
      setIsRecording(false);
    }
  }, []);

  const clearText = useCallback(() => {
    setRecognizedText('');
    setError(null);
  }, []);

  return {
    isRecording,
    recognizedText,
    error,
    isAvailable,
    startRecording,
    stopRecording,
    cancelRecording,
    clearText,
  };
};
