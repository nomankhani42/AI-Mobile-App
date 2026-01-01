/**
 * useDebounce.ts
 *
 * A custom React hook that implements the debouncing pattern for performance optimization.
 * Debouncing delays the processing of an input value until the user has stopped making changes
 * for a specified period of time. This is particularly useful for expensive operations like
 * API calls, search queries, or complex computations.
 *
 * Common Use Cases:
 * - Search input fields (wait for user to finish typing before searching)
 * - Form validation (avoid validating on every keystroke)
 * - Window resize handlers (prevent excessive recalculations)
 * - Auto-save functionality (save after user stops editing)
 *
 * @module hooks/useDebounce
 */

// React imports for state management and side effects
import {useState, useEffect} from 'react';

/**
 * Custom hook that debounces a rapidly changing value.
 *
 * The Debouncing Pattern:
 * ---------------------
 * Debouncing is a programming practice used to ensure that time-consuming tasks
 * do not fire so often. It limits the rate at which a function can fire.
 *
 * How it works:
 * 1. User types/changes value rapidly
 * 2. Each change starts a new timer
 * 3. Previous timer is cancelled (cleanup function)
 * 4. Only after the delay period with no new changes does the value update
 *
 * Visual Example:
 * User types: "h" -> "he" -> "hel" -> "hell" -> "hello"
 * Time:       0ms   50ms    100ms    150ms     200ms
 * Timer:      [----] [----] [----]   [----]    [--------500ms--------]
 * Result:     (cancelled) (cancelled) (cancelled) (cancelled) -> "hello" at 700ms
 *
 * Type Parameters:
 * @template T - The type of value being debounced (can be string, number, object, etc.)
 *
 * @param {T} value - The value to debounce. Can be any type (string, number, object, array)
 * @param {number} delay - The delay in milliseconds to wait before updating (default: 500ms)
 *
 * @returns {T} The debounced value that only updates after the delay period with no changes
 *
 * @example
 * // Example 1: Search input debouncing
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 *   useEffect(() => {
 *     // This only runs 500ms after user stops typing
 *     if (debouncedSearchTerm) {
 *       searchAPI(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *
 *   return (
 *     <TextInput
 *       value={searchTerm}
 *       onChangeText={setSearchTerm}
 *       placeholder="Search..."
 *     />
 *   );
 * }
 *
 * @example
 * // Example 2: Form validation with custom delay
 * function FormField() {
 *   const [email, setEmail] = useState('');
 *   const debouncedEmail = useDebounce(email, 800);
 *
 *   useEffect(() => {
 *     // Validate email only after user stops typing for 800ms
 *     if (debouncedEmail) {
 *       validateEmail(debouncedEmail);
 *     }
 *   }, [debouncedEmail]);
 *
 *   return <TextInput value={email} onChangeText={setEmail} />;
 * }
 *
 * @example
 * // Example 3: Auto-save functionality
 * function NoteEditor() {
 *   const [content, setContent] = useState('');
 *   const debouncedContent = useDebounce(content, 1000);
 *
 *   useEffect(() => {
 *     // Auto-save note 1 second after user stops typing
 *     if (debouncedContent) {
 *       saveNote(debouncedContent);
 *     }
 *   }, [debouncedContent]);
 *
 *   return <TextInput value={content} onChangeText={setContent} />;
 * }
 *
 * @example
 * // Example 4: Debouncing complex objects
 * interface FilterOptions {
 *   category: string;
 *   priceMin: number;
 *   priceMax: number;
 * }
 *
 * function ProductFilter() {
 *   const [filters, setFilters] = useState<FilterOptions>({
 *     category: '',
 *     priceMin: 0,
 *     priceMax: 1000
 *   });
 *   const debouncedFilters = useDebounce(filters, 600);
 *
 *   useEffect(() => {
 *     // Fetch products only after all filter changes settle
 *     fetchProducts(debouncedFilters);
 *   }, [debouncedFilters]);
 *
 *   return <FilterForm filters={filters} onChange={setFilters} />;
 * }
 *
 * Performance Benefits:
 * --------------------
 * - Reduces API calls (e.g., from 10 calls to 1 call for "hello" typed)
 * - Improves app responsiveness by reducing unnecessary renders
 * - Saves network bandwidth and server resources
 * - Prevents excessive database queries
 * - Better user experience (no lag from too many operations)
 *
 * Implementation Details:
 * ----------------------
 * - Uses React's useState for managing the debounced value state
 * - Uses React's useEffect for setting up and cleaning up timers
 * - Cleanup function prevents memory leaks by clearing old timers
 * - Dependencies array [value, delay] ensures timer updates when inputs change
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  // State to store the debounced value
  // Initially set to the current value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timeout to update the debounced value after the delay period
    // If value changes before timeout completes, this timer will be cancelled
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: runs before the next effect and on unmount
    // This is crucial for the debouncing pattern - it cancels the previous timer
    // when value changes, ensuring only the last value update goes through
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  // Return the debounced value
  // This will lag behind the actual value by the delay amount
  return debouncedValue;
}
