/**
 * useVoiceInput.ts
 *
 * A comprehensive custom React hook for integrating voice recognition in React Native applications.
 * This hook provides a robust interface for speech-to-text functionality with proper error handling,
 * permissions management, and platform-specific optimizations.
 *
 * Features:
 * - Voice recognition with real-time transcription
 * - Automatic permission handling for Android/iOS
 * - Comprehensive error handling with user-friendly messages
 * - Graceful fallback when voice module is unavailable
 * - Event-driven architecture with proper cleanup
 * - Platform-specific optimizations
 *
 * Dependencies:
 * - @react-native-voice/voice: Native voice recognition module
 *
 * Platform Support:
 * - Android: Requires Google app installed (built-in speech recognition)
 * - iOS: Native speech recognition (iOS 10+)
 *
 * @module hooks/useVoiceInput
 */

// React hooks for state management, lifecycle, and memoization
import {useState, useEffect, useCallback} from 'react';

// React Native core modules for platform-specific logic and permissions
import {Platform, PermissionsAndroid, Alert} from 'react-native';

/**
 * Dynamic Voice Module Loading
 * ----------------------------
 * We use a try-catch block to load the voice module because:
 * 1. The module might not be installed in the project
 * 2. Native dependencies might not be linked properly
 * 3. The app should still work without voice features (graceful degradation)
 *
 * This pattern allows the app to run even if voice recognition is unavailable,
 * providing a better user experience than crashing.
 */
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (error) {
  console.warn('[Voice] Failed to load voice module:', error);
}

/**
 * TypeScript Type Imports
 * -----------------------
 * Import only the type definitions (not runtime code) for better type safety.
 * These types help TypeScript understand the structure of voice events.
 */
import type {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

/**
 * Voice Input Hook Return Type
 * ----------------------------
 * This interface defines what the hook returns to components using it.
 *
 * @interface UseVoiceInputReturn
 * @property {boolean} isRecording - Whether voice recording is currently active
 * @property {string} recognizedText - The transcribed text from voice input
 * @property {string | null} error - Any error that occurred (null if no error)
 * @property {boolean} isAvailable - Whether voice recognition is available on this device
 * @property {() => Promise<void>} startRecording - Function to start voice recording
 * @property {() => Promise<void>} stopRecording - Function to stop voice recording
 * @property {() => Promise<void>} cancelRecording - Function to cancel and clear recording
 * @property {() => void} clearText - Function to clear recognized text
 */

/**
 * Custom hook for voice input/speech recognition in React Native.
 *
 * Architecture Pattern: Event-Driven with State Management
 * --------------------------------------------------------
 * This hook uses an event-driven architecture where:
 * 1. Voice events (start, end, results, errors) trigger state updates
 * 2. State changes cause component re-renders with new data
 * 3. Cleanup functions prevent memory leaks
 *
 * @returns {UseVoiceInputReturn} Object containing voice input state and control functions
 *
 * @example
 * // Example 1: Basic voice input in a chat component
 * function ChatInput() {
 *   const {
 *     isRecording,
 *     recognizedText,
 *     error,
 *     isAvailable,
 *     startRecording,
 *     stopRecording,
 *     clearText
 *   } = useVoiceInput();
 *
 *   const [message, setMessage] = useState('');
 *
 *   // Update message when voice recognition completes
 *   useEffect(() => {
 *     if (recognizedText) {
 *       setMessage(recognizedText);
 *       clearText();
 *     }
 *   }, [recognizedText]);
 *
 *   return (
 *     <View>
 *       <TextInput value={message} onChangeText={setMessage} />
 *       <TouchableOpacity
 *         onPress={isRecording ? stopRecording : startRecording}
 *         disabled={!isAvailable}
 *       >
 *         <Text>{isRecording ? 'Stop' : 'Speak'}</Text>
 *       </TouchableOpacity>
 *       {error && <Text style={{color: 'red'}}>{error}</Text>}
 *     </View>
 *   );
 * }
 *
 * @example
 * // Example 2: Voice search functionality
 * function VoiceSearch() {
 *   const {isRecording, recognizedText, startRecording} = useVoiceInput();
 *   const [searchResults, setSearchResults] = useState([]);
 *
 *   useEffect(() => {
 *     if (recognizedText) {
 *       // Perform search with recognized text
 *       searchAPI(recognizedText).then(setSearchResults);
 *     }
 *   }, [recognizedText]);
 *
 *   return (
 *     <View>
 *       <Button title="Voice Search" onPress={startRecording} />
 *       {isRecording && <Text>Listening...</Text>}
 *       <FlatList data={searchResults} renderItem={...} />
 *     </View>
 *   );
 * }
 *
 * @example
 * // Example 3: Form filling with voice
 * function VoiceForm() {
 *   const {recognizedText, startRecording, clearText} = useVoiceInput();
 *   const [formData, setFormData] = useState({
 *     name: '',
 *     address: '',
 *     notes: ''
 *   });
 *   const [activeField, setActiveField] = useState<string | null>(null);
 *
 *   useEffect(() => {
 *     if (recognizedText && activeField) {
 *       setFormData(prev => ({
 *         ...prev,
 *         [activeField]: recognizedText
 *       }));
 *       clearText();
 *       setActiveField(null);
 *     }
 *   }, [recognizedText, activeField]);
 *
 *   const handleVoiceInput = (field: string) => {
 *     setActiveField(field);
 *     startRecording();
 *   };
 *
 *   return (
 *     <View>
 *       <TextInput value={formData.name} />
 *       <Button title="Voice Input" onPress={() => handleVoiceInput('name')} />
 *     </View>
 *   );
 * }
 *
 * Error Handling Strategy:
 * -----------------------
 * The hook handles various error scenarios:
 * 1. Module not loaded: Graceful degradation (isAvailable = false)
 * 2. Permission denied: Clear error message to user
 * 3. No speech detected: Silently ignored (common scenario)
 * 4. Network errors: Displayed to user
 * 5. Device not supported: Clear feedback
 *
 * Permission Handling:
 * -------------------
 * Android: Requests RECORD_AUDIO permission at runtime
 * iOS: Uses Info.plist NSMicrophoneUsageDescription
 *
 * Memory Management:
 * -----------------
 * - Event listeners are properly cleaned up on unmount
 * - Voice instance is destroyed to prevent memory leaks
 * - All async operations are cancelled on cleanup
 */
export const useVoiceInput = () => {
  // State: Whether voice recording is currently active
  const [isRecording, setIsRecording] = useState(false);

  // State: The text recognized from speech
  const [recognizedText, setRecognizedText] = useState('');

  // State: Any error that occurred during voice recognition
  const [error, setError] = useState<string | null>(null);

  // State: Whether voice recognition is available on this device
  const [isAvailable, setIsAvailable] = useState(false);

  /**
   * Voice Initialization Effect
   * --------------------------
   * This effect runs once on component mount to:
   * 1. Check if voice module is available
   * 2. Destroy any previous instances (cleanup from crashes)
   * 3. Verify device supports speech recognition
   * 4. Set up event listeners for voice events
   * 5. Clean up resources on component unmount
   *
   * Pattern: Initialization with Cleanup
   */
  useEffect(() => {
    const initVoice = async () => {
      try {
        // Step 1: Verify the Voice module was successfully loaded
        if (!Voice) {
          setIsAvailable(false);
          setError('Voice recognition is not available. The native module could not be loaded.');
          return;
        }

        // Step 2: Verify required methods exist (defensive programming)
        if (typeof Voice.isAvailable !== 'function') {
          setIsAvailable(false);
          setError('Voice module is incomplete - rebuild required');
          return;
        }

        // Step 3: Cleanup any previous instances (important for hot reloading in dev)
        try {
          if (typeof Voice.destroy === 'function') {
            await Voice.destroy();
          }
        } catch (e) {
          // Silently ignore cleanup errors - previous instance might not exist
        }

        // Step 4: Check if device supports speech recognition
        const available = await Voice.isAvailable();
        setIsAvailable(!!available);

        if (available) {
          // Step 5: Set up event listeners for voice events
          // These callbacks will be triggered by the native module
          Voice.onSpeechStart = onSpeechStart;
          Voice.onSpeechEnd = onSpeechEnd;
          Voice.onSpeechResults = onSpeechResults;
          Voice.onSpeechError = onSpeechError;
          Voice.onSpeechPartialResults = onSpeechResults; // Real-time partial results
          Voice.onSpeechVolumeChanged = () => {
            // Could be used to show visual feedback of voice volume
            // Currently unused but listener prevents warnings
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

    // Run initialization
    initVoice();

    // Cleanup function: runs when component unmounts
    // This is critical for preventing memory leaks
    return () => {
      if (Voice && typeof Voice.destroy === 'function') {
        Voice.destroy()
          .then(() => {
            if (typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
          })
          .catch(() => {
            // Silently ignore cleanup errors on unmount
          });
      }
    };
  }, []); // Empty dependency array = run once on mount

  /**
   * Event Handler: Speech Start
   * --------------------------
   * Called when the user starts speaking and voice detection begins.
   * Updates UI state to show recording is active.
   */
  const onSpeechStart = () => {
    console.log('[Voice] Speech started - listening...');
    setIsRecording(true);
    setError(null); // Clear previous errors
  };

  /**
   * Event Handler: Speech End
   * ------------------------
   * Called when speech detection stops (user stopped speaking).
   * Note: This doesn't mean results are ready yet.
   */
  const onSpeechEnd = () => {
    console.log('[Voice] Speech ended');
    setIsRecording(false);
  };

  /**
   * Event Handler: Speech Results
   * ----------------------------
   * Called when speech has been successfully transcribed to text.
   * The event.value array contains possible transcriptions, ordered by confidence.
   *
   * @param {SpeechResultsEvent} event - Event containing transcription results
   * @param {string[]} event.value - Array of possible transcriptions (best match first)
   */
  const onSpeechResults = (event: SpeechResultsEvent) => {
    console.log('[Voice] Speech results received:', event.value);
    if (event.value && event.value.length > 0) {
      // Take the first result (highest confidence match)
      const text = event.value[0];
      console.log('[Voice] Recognized text:', text);
      setRecognizedText(text);
      // Clear any previous errors when we get successful results
      setError(null);
    }
  };

  /**
   * Event Handler: Speech Error
   * --------------------------
   * Called when an error occurs during speech recognition.
   * Implements intelligent error handling to distinguish between:
   * - Critical errors (permissions, network, etc.) - shown to user
   * - Expected errors (no speech, unclear, etc.) - silently handled
   *
   * Error Classification Pattern:
   * ----------------------------
   * This function categorizes errors to provide better UX:
   * 1. Parse the error from various possible formats
   * 2. Check if it's a common/expected error
   * 3. Only alert user for genuine problems
   * 4. Always log for debugging purposes
   *
   * @param {SpeechErrorEvent} event - Event containing error information
   */
  const onSpeechError = (event: SpeechErrorEvent) => {
    let errorMsg = 'Speech recognition failed';

    // Parse error from various possible formats
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

    /**
     * Ignored Errors List
     * ------------------
     * These are common, expected errors that don't require user notification:
     * - No speech detected (user didn't speak)
     * - Unclear speech (couldn't understand)
     * - User cancelled (intentional action)
     * - Service busy (temporary state)
     *
     * Error codes:
     * 5 - Client side error
     * 7 - No match found
     * 8 - Recognition service busy
     * 11 - Insufficient permissions or unclear speech
     */
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

    // Always log for debugging (helps during development)
    console.log('[Voice] Speech error (ignored=' + isIgnoredError + '):', errorMsg);
    console.log('[Voice] Error event:', JSON.stringify(event));

    if (!isIgnoredError) {
      // Critical error - notify the user
      console.error('[Voice] Speech error:', errorMsg);
      console.error('[Voice] Error details:', event?.error);
      setError(errorMsg);
      // Don't show meaningless error messages
      if (errorMsg !== '{}' && errorMsg !== '[object Object]') {
        Alert.alert('Voice Recognition Error', errorMsg);
      }
    } else {
      // Expected error - handle silently
      console.log('[Voice] Ignoring common error:', errorMsg);
      setError(null);
    }
  };

  /**
   * Permission Request Handler
   * -------------------------
   * Requests microphone permission from the user.
   * Platform-specific implementation:
   *
   * Android:
   * - Uses PermissionsAndroid API to request RECORD_AUDIO permission
   * - Shows a dialog explaining why permission is needed
   * - Returns true if granted, false otherwise
   *
   * iOS:
   * - Permission handled automatically by the OS using Info.plist
   * - NSMicrophoneUsageDescription must be set in Info.plist
   * - Always returns true (iOS handles permission internally)
   *
   * @returns {Promise<boolean>} True if permission granted, false otherwise
   */
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
    // iOS: Permission handled by OS, always return true
    return true;
  };

  /**
   * Start Recording Function
   * -----------------------
   * Initiates voice recording with comprehensive pre-flight checks.
   *
   * Process Flow:
   * 1. Verify voice module is loaded
   * 2. Check device supports speech recognition
   * 3. Request microphone permission
   * 4. Clear previous state
   * 5. Start voice recognition
   *
   * useCallback Pattern:
   * ------------------
   * We use useCallback to memoize this function because:
   * - It's passed to child components as a prop
   * - Prevents unnecessary re-renders of children
   * - Dependencies [isAvailable] trigger re-creation only when needed
   *
   * @returns {Promise<void>}
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('[Voice] startRecording called');

      // Pre-flight check 1: Module loaded?
      if (!Voice) {
        console.error('[Voice] Voice module not loaded');
        Alert.alert('Voice Not Available', 'Voice recognition is not available.\n\nThe app needs to be rebuilt with native modules.');
        return;
      }

      // Pre-flight check 2: Device supported?
      if (!isAvailable) {
        console.error('[Voice] Voice not available on this device');
        Alert.alert('Voice Not Available', 'Speech recognition is not supported on this device.\n\nRequirements:\n• Android: Google app installed\n• iOS: iOS 10 or later');
        return;
      }

      // Pre-flight check 3: Method exists?
      if (typeof Voice.start !== 'function') {
        console.error('[Voice] Voice.start is not a function');
        Alert.alert('Voice Error', 'Voice module is not properly configured. Please rebuild the app.');
        return;
      }

      // Step 1: Request permission
      console.log('[Voice] Requesting microphone permission...');
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.error('[Voice] Microphone permission denied');
        Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
        return;
      }

      // Step 2: Clear previous state
      console.log('[Voice] Permission granted, starting voice recognition...');
      setRecognizedText('');
      setError(null);

      // Step 3: Start voice recognition
      // Language code 'en-US' for English (United States)
      // Other options: 'en-GB', 'es-ES', 'fr-FR', etc.
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
  }, [isAvailable]); // Re-create function if isAvailable changes

  /**
   * Stop Recording Function
   * ----------------------
   * Stops voice recording and processes the results.
   * Results will be delivered via onSpeechResults callback.
   *
   * @returns {Promise<void>}
   */
  const stopRecording = useCallback(async () => {
    try {
      if (!Voice || typeof Voice.stop !== 'function') {
        setIsRecording(false);
        return;
      }
      await Voice.stop();
      setIsRecording(false);
    } catch (err) {
      // Ensure recording state is cleared even on error
      setIsRecording(false);
    }
  }, []);

  /**
   * Cancel Recording Function
   * ------------------------
   * Cancels voice recording and discards any partial results.
   * Unlike stop(), this doesn't process the results.
   *
   * @returns {Promise<void>}
   */
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
      // Ensure state is cleared even on error
      setIsRecording(false);
    }
  }, []);

  /**
   * Clear Text Function
   * ------------------
   * Clears the recognized text and any errors.
   * Useful for resetting state after processing results.
   */
  const clearText = useCallback(() => {
    setRecognizedText('');
    setError(null);
  }, []);

  /**
   * Hook Return Object
   * -----------------
   * Returns all state and functions needed by components.
   *
   * State values:
   * - isRecording: UI can show recording indicator
   * - recognizedText: Transcribed text from speech
   * - error: Error message to display (if any)
   * - isAvailable: Hide voice features if not supported
   *
   * Functions:
   * - startRecording: Begin voice input
   * - stopRecording: End recording and process results
   * - cancelRecording: Cancel without processing
   * - clearText: Reset recognized text
   */
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
