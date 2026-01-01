# StatusDropdown Component Documentation

This file provides detailed documentation for the StatusDropdown component since the inline comments would make the file very large.

## Component Overview

StatusDropdown is a bottom sheet modal that allows users to change a task's status. It demonstrates advanced React Native patterns including:

- Bottom sheet pattern (slides up from bottom)
- List rendering with selection state
- Dynamic styling based on selection
- Slide-up animation with spring physics

## Key Concepts Demonstrated

### 1. Bottom Sheet Pattern
```typescript
// Modal slides from bottom of screen
justifyContent: 'flex-end' // on overlay container
translateY animation from 300 to 0
```

### 2. Status Options Array
```typescript
const STATUS_OPTIONS: StatusOption[] = [
  // Each status has icon, color, and label
  // Centralized configuration makes updates easy
]
```

### 3. Dynamic List Rendering
```typescript
{STATUS_OPTIONS.map((option, index) => {
  const isSelected = option.value === currentStatus;
  // Conditional styling based on selection
})}
```

## File Structure

1. **Imports**: React Native components for modal and animations
2. **Constants**: STATUS_OPTIONS array with all status configurations
3. **Props Interface**: Typed props for visibility, current status, callbacks
4. **Component**: Main component with animation logic
5. **Styles**: Bottom sheet styling with centered content

## Animation Behavior

**Show Animation:**
- translateY: 300 → 0 (slides up)
- opacity: 0 → 1 (fades in)
- Uses spring for natural motion

**Hide Animation:**
- translateY: 0 → 300 (slides down)
- opacity: 1 → 0 (fades out)
- Uses timing for quick exit

## Usage Example

```typescript
<StatusDropdown
  visible={showStatusPicker}
  currentStatus={task.status}
  onSelect={(status) => updateTaskStatus(task.id, status)}
  onClose={() => setShowStatusPicker(false)}
/>
```
