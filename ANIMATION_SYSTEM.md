# Smart Sunrise Animation System

## 1. Animation Principles
1. **Smoothness above everything:** All animations must hit 60fps (or 120fps on supported displays).
2. **Subtle but premium motion:** Avoid excessive bouncing or dramatic scaling. Use soft, elegant transitions.
3. **Fast and responsive:** Animations should never block user interaction. Keep durations short (200ms - 600ms).
4. **No lag or heavy rendering:** Rely exclusively on GPU-accelerated properties (`transform` and `opacity`).
5. **Consistent animation language:** Use the same easing curves and spatial relationships across the entire application.

## 2. Global Motion Style
- **Easing Curves:** 
  - Standard: `[0.22, 1, 0.36, 1]` (Custom ease-out for smooth deceleration)
  - Entrance: `[0.0, 0.0, 0.2, 1]` (Deceleration)
  - Exit: `[0.4, 0.0, 1, 1]` (Acceleration)
- **Springs:** Use for interactive elements (hover/tap). 
  - Stiffness: 300-400
  - Damping: 25-30
- **Durations:** 
  - Micro-interactions: 150ms - 200ms
  - Page Transitions: 300ms - 500ms
  - Complex Sequences (e.g., Loading): 4s - 6s

## 3. Component Animation Mapping

### Page Transitions
- **Trigger:** Route change.
- **Effect:** Fade out old page, slide in new page from right (x: 20px → 0), slight scale (0.98 → 1).
- **Implementation:** `<AnimatePresence mode="wait">` wrapping a `<PageTransition>` component.

### Scroll Reveal Animations
- **Location:** Dashboard, Courses, and content lists.
- **Effect:** Fade in (opacity 0 → 1) and slide up (y: 20px → 0).
- **Stagger:** 50ms - 100ms delay between sibling elements.
- **Implementation:** `framer-motion` variants with `whileInView` or `IntersectionObserver`.

### Card Interactions
- **Hover:** Scale to 1.03, translate Y by -4px, increase shadow, add subtle glow.
- **Tap/Click:** Scale down to 0.97.
- **Implementation:** `whileHover` and `whileTap` props on `motion.div`.

### Category Reveal (Courses Tab)
- **Trigger:** Selecting a class, subject, or filter.
- **Effect:** Staggered fade-in, slide-up, and blur-to-clear (`filter: blur(10px) -> blur(0px)`).

### Loading Animation System (Cinematic)
- **Phase 1:** Dark background with subtle gradient.
- **Phase 2:** AI Knowledge Core (particles forming a glowing sphere).
- **Phase 3:** Logo reveal.
- **Phase 4:** Glass butterfly particles (bottom-left to top-right).
- **Phase 5:** "Powered by Lakshya Bhamu" text reveal.
- **Transition:** Fade into dashboard.

### Micro Interactions
- **Buttons:** Hover glow, soft pulse (`box-shadow` transition).
- **Toggles:** Smooth sliding thumb (`layout` prop in Framer Motion).
- **Dropdowns:** Fade + slide-down (y: -10px → 0).
- **Search Bar:** Expand width on focus.

### Practice Arena Animations
- **Question Transitions:** Fade out current, slide in next from right.
- **Answer Selection:** Highlight with scale pulse, color transition to green (correct) or red (incorrect).
- **Score Reveal:** Count-up animation from 0 to final score.

### Celebration Animation (90%+ Score)
- **Trigger:** Completing a quiz with ≥ 90%.
- **Effect:** Confetti particles, sparkles, glow pulse, floating badge.
- **Constraint:** Non-blocking (pointer-events-none).

### Whiteboard Animations
- **Drawing:** Instant rendering (Canvas API, bypassing React state for strokes).
- **Eraser:** Soft fade removal.
- **Clear All:** Wipe animation across the canvas.

### AI Generator Transitions
- **Generating:** Skeleton loader with shimmer effect (CSS linear-gradient animation).
- **Result:** Fade-in + slight scale (0.95 → 1).

## 4. Performance Optimization Strategy
- **Animate Only Compositor Properties:** Stick to `transform` (translate, scale, rotate) and `opacity`. Avoid animating `width`, `height`, `top`, `left`, or `box-shadow` directly if it causes layout thrashing.
- **`will-change`:** Use `will-change: transform, opacity` sparingly on elements that animate frequently.
- **Hardware Acceleration:** Use `translate3d` or `translateZ(0)` to force GPU rendering.
- **React Optimization:** Memoize complex animated components using `React.memo`.
- **Canvas for Particles:** Use HTML5 Canvas for complex particle systems (like the Intro Sequence and Celebration) instead of rendering hundreds of DOM nodes.

## 5. Responsive Design Considerations
- **Mobile/Tablets:** 
  - Reduce particle counts in canvas animations by 50%.
  - Disable heavy blur filters if performance drops.
  - Ensure touch targets are large enough (min 44x44px) and use `whileTap` for immediate touch feedback.
  - Shorten page transition distances (e.g., slide 10px instead of 20px).
