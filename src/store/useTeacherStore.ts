import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Slide {
  id: string;
  imageUrl: string;
  whiteboardData?: string;
  annotatedImageUrl?: string;
}

interface TeacherState {
  slides: Slide[];
  currentSlideIndex: number;
  setSlides: (slides: Slide[]) => void;
  setCurrentSlideIndex: (index: number) => void;
  updateSlideWhiteboardData: (index: number, data: string, imageData?: string) => void;
  clearSlides: () => void;
}

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set) => ({
      slides: [],
      currentSlideIndex: 0,
      setSlides: (slides) => set({ slides, currentSlideIndex: 0 }),
      setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
      updateSlideWhiteboardData: (index, data, imageData) => set((state) => {
        const newSlides = [...state.slides];
        if (newSlides[index]) {
          newSlides[index].whiteboardData = data;
          if (imageData) {
            newSlides[index].annotatedImageUrl = imageData;
          }
        }
        return { slides: newSlides };
      }),
      clearSlides: () => set({ slides: [], currentSlideIndex: 0 }),
    }),
    {
      name: 'teacher-storage',
    }
  )
);
