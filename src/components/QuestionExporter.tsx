import React, { useRef } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Question {
  id?: string;
  question_id?: string;
  question?: string;
  question_text?: string;
  options?: string[];
  correctAnswer?: string;
  correct_answer?: string;
  solution?: string;
  explanation?: string;
  year?: string;
  pyqYear?: string;
  exam?: string;
  subject?: string;
}

interface QuestionExporterProps {
  questions: Question[];
  title: string;
  className?: string;
}

export const QuestionExporter: React.FC<QuestionExporterProps> = ({ questions, title, className }) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      if (!exportRef.current) return;
      const doc = new jsPDF('p', 'mm', 'a4');
      await doc.html(exportRef.current, {
        callback: (doc) => {
          doc.save(`${title.replace(/\s+/g, '_')}_Questions.pdf`);
        },
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 1000
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div 
        ref={exportRef} 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: 0, 
          width: '800px',
          padding: '40px',
          background: 'white',
          color: 'black',
          fontFamily: 'serif'
        }}
      >
        <h1 style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px' }}>{title}</h1>
        {questions.map((q, i) => (
          <div key={i} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Q{i + 1}. {q.question || q.question_text}
            </div>
            {q.options && q.options.length > 0 && (
              <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                {q.options.map((opt, idx) => (
                  <div key={idx} style={{ marginBottom: '5px' }}>
                    {String.fromCharCode(65 + idx)}) {opt}
                  </div>
                ))}
              </div>
            )}
            {(q.solution || q.explanation) && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #00F0FF' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666', marginBottom: '5px' }}>SOLUTION & EXPLANATION:</div>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {q.solution || q.explanation || ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {(q.year || q.pyqYear || q.exam) && (
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px', textAlign: 'right' }}>
                Source: {q.exam || ''} {q.year || q.pyqYear || ''}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={exportToPDF}
      disabled={isExporting}
      className={className || "flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Download PDF (High Quality)
        </>
      )}
      </button>
    </>
  );
};
