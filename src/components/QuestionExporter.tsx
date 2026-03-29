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
      <div ref={exportRef} style={{ display: 'none' }}>
        {/* Render questions here */}
        <h1>{title}</h1>
        {questions.map((q, i) => (
          <div key={i}>
            <p>Q{i + 1}. {q.question || q.question_text}</p>
            {q.options?.map((opt, idx) => (
              <p key={idx}>{String.fromCharCode(65 + idx)}) {opt}</p>
            ))}
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {q.solution || q.explanation || ''}
            </ReactMarkdown>
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
