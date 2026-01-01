/**
 * Redux Typed Hooks
 *
 * This file provides pre-typed versions of React Redux hooks.
 * Using these hooks instead of plain useDispatch and useSelector
 * gives you automatic TypeScript type inference.
 *
 * Benefits:
 * - Type safety: Catch errors at compile time
 * - Autocomplete: IDE suggests available state properties and actions
 * - Refactoring: Rename state properties with confidence
 *
 * Best Practice: Always use these typed hooks in components instead of
 * the plain useDispatch and useSelector from react-redux.
 */

// Import React Redux hooks
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
// TypedUseSelectorHook: Generic type for creating typed selector hooks
// useDispatch: Hook to get the dispatch function from Redux store
// useSelector: Hook to extract data from Redux store state

// Import our app-specific types from store configuration
import type {RootState, AppDispatch} from './store';
// RootState: Complete type definition of our Redux state tree
// AppDispatch: Type definition of our dispatch function (includes thunk support)

/**
 * useAppDispatch Hook
 *
 * Typed version of useDispatch.
 * Returns the dispatch function with correct TypeScript types.
 *
 * Usage in components:
 * ```typescript
 * const dispatch = useAppDispatch();
 * dispatch(login({ email, password })); // Fully typed!
 * ```
 *
 * @returns {AppDispatch} Typed dispatch function
 *
 * Why typed dispatch?
 * - Knows about async thunks (returns promises)
 * - Autocompletes action creators
 * - Validates action payloads
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * useAppSelector Hook
 *
 * Typed version of useSelector.
 * Extracts data from Redux store with full TypeScript support.
 *
 * Usage in components:
 * ```typescript
 * const user = useAppSelector(state => state.auth.user);
 * const tasks = useAppSelector(state => state.tasks.items);
 * ```
 *
 * The selector function receives the complete RootState as parameter,
 * and TypeScript will:
 * - Autocomplete available state properties (state.auth, state.chat, etc.)
 * - Infer the return type based on what you select
 * - Catch typos in property names
 *
 * @type {TypedUseSelectorHook<RootState>}
 *
 * Why typed selector?
 * - Full autocomplete for state properties
 * - Type checking for selector functions
 * - Automatic type inference for returned values
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
