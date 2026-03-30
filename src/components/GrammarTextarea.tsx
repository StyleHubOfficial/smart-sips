import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface GrammarError {
  original: string;
  corrected: string;
  startIndex: number;
  endIndex: number;
  explanation: string;
}

interface GrammarTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export const GrammarTextarea: React.FC<GrammarTextareaProps> = ({ value, onChange, className = '', ...props }) => {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [activeError, setActiveError] = useState<GrammarError | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkGrammar = useCallback(async (text: string) => {
    if (!text || text.trim().length < 10) {
      setErrors([]);
      return;
    }

    setIsChecking(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing API Key");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Analyze the following text for grammatical errors, awkward phrasing, or typos. 
        Return a JSON array of errors. If there are no errors, return an empty array [].
        Text: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING, description: "The exact incorrect text snippet" },
                corrected: { type: Type.STRING, description: "The corrected text snippet" },
                startIndex: { type: Type.INTEGER, description: "The starting character index of the error in the original text" },
                endIndex: { type: Type.INTEGER, description: "The ending character index of the error in the original text" },
                explanation: { type: Type.STRING, description: "Brief explanation of the error" }
              },
              required: ["original", "corrected", "startIndex", "endIndex", "explanation"]
            }
          }
        }
      });

      const resultText = response.text || "[]";
      const parsedErrors: GrammarError[] = JSON.parse(resultText);
      
      const validErrors = parsedErrors.filter(err => 
        err.startIndex >= 0 && 
        err.endIndex <= text.length && 
        err.startIndex < err.endIndex &&
        text.substring(err.startIndex, err.endIndex) === err.original
      );
      
      setErrors(validErrors);
    } catch (error) {
      console.error("Grammar check failed:", error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    
    checkTimeoutRef.current = setTimeout(() => {
      checkGrammar(value);
    }, 2000);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [value, checkGrammar]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    setActiveError(null);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    
    const clickedError = errors.find(
      err => cursorPosition >= err.startIndex && cursorPosition <= err.endIndex
    );

    if (clickedError) {
      // Very basic positioning
      const rect = textarea.getBoundingClientRect();
      setPopupPosition({
        top: Math.min(rect.height / 2, 60),
        left: Math.min(rect.width / 2, 100)
      });
      setActiveError(clickedError);
    } else {
      setActiveError(null);
    }
  };

  const applyCorrection = (error: GrammarError) => {
    const newValue = value.substring(0, error.startIndex) + error.corrected + value.substring(error.endIndex);
    
    const event = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(event);
    setActiveError(null);
    setErrors([]); // Clear errors to force re-check
  };

  const renderHighlightedText = () => {
    if (errors.length === 0) return value;

    let lastIndex = 0;
    const elements = [];
    
    const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

    sortedErrors.forEach((error, idx) => {
      if (error.startIndex >= lastIndex) {
        elements.push(<span key={`text-${idx}`}>{value.substring(lastIndex, error.startIndex)}</span>);
        
        elements.push(
          <span 
            key={`error-${idx}`} 
            className="border-b-2 border-blue-400 bg-blue-500/20 text-transparent rounded-sm"
            style={{ color: 'transparent', WebkitTextFillColor: 'transparent' }}
          >
            {value.substring(error.startIndex, error.endIndex)}
          </span>
        );
        
        lastIndex = error.endIndex;
      }
    });

    if (lastIndex < value.length) {
      elements.push(<span key="text-end">{value.substring(lastIndex)}</span>);
    }

    if (value.endsWith('\n')) {
      elements.push(<br key="br-end" />);
    }

    return elements;
  };

  const sharedStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    padding: 'inherit',
    border: 'inherit',
    letterSpacing: 'inherit',
    wordSpacing: 'inherit',
    textAlign: 'inherit',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.75rem',
  };

  return (
    <div className="relative w-full h-full group">
      <div 
        ref={backdropRef}
        className={`absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words ${className}`}
        style={{ ...sharedStyles, color: 'transparent', WebkitTextFillColor: 'transparent' }}
        aria-hidden="true"
      >
        {renderHighlightedText()}
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e);
          setActiveError(null);
        }}
        onScroll={handleScroll}
        onClick={handleTextareaClick}
        className={`relative z-10 w-full h-full bg-transparent text-white resize-none outline-none transition-all duration-300 ${className}`}
        style={sharedStyles}
        spellCheck={false}
        {...props}
      />

      {isChecking && (
        <div className="absolute top-4 right-4 z-20">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
        </div>
      )}

      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 bg-[#1A1A2E] border border-blue-500/50 shadow-2xl rounded-xl p-4 w-72"
            style={{ 
              top: `${popupPosition.top}px`, 
              left: `${popupPosition.left}px`,
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Grammar Suggestion
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveError(null); }}
                className="text-gray-500 hover:text-white transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-3 p-2 bg-black/30 rounded-lg border border-white/5">
              <p className="text-sm text-red-400 line-through mb-1">{activeError.original}</p>
              <p className="text-sm text-green-400 font-medium">{activeError.corrected}</p>
            </div>
            
            <p className="text-xs text-gray-400 mb-4">{activeError.explanation}</p>
            
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyCorrection(activeError); }}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Check className="w-4 h-4" /> Apply Fix
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
