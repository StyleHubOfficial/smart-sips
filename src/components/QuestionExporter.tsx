import React, { useRef, useState } from 'react';
import { Download, FileText, Loader2, Code } from 'lucide-react';
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
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    try {
      if (!exportRef.current) return;
      
      await document.fonts.ready;
      // Let elements settle
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        windowWidth: 1000,
        backgroundColor: '#0a0a0a',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= doc.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= doc.internal.pageSize.getHeight();
      }
      
      doc.save(`${title.replace(/\s+/g, '_')}_Questions.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate PDF. Try exporting to HTML instead.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportToHTML = () => {
    setIsExportingHTML(true);
    try {
      let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<style>
  body {
    background-color: #0a0a0a;
    color: #e5e5e5;
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0;
    padding: 20px;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    background: #111;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    border: 1px solid #333;
  }
  h1 { text-align: center; color: #00F0FF; margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px; }
  .question-container { border: 1px solid #222; background: #1a1a1a; padding: 25px; border-radius: 12px; margin-bottom: 25px; }
  .q-number { color: #B026FF; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px; }
  .q-text { font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px; }
  .options { margin-left: 20px; margin-bottom: 20px; }
  .option { padding: 10px 15px; background: #222; margin-bottom: 10px; border-radius: 8px; cursor: pointer; border: 1px solid #333; transition: all 0.2s; display: flex; align-items: center; }
  .option:hover { background: #2a2a2a; border-color: #00F0FF; }
  .option.correct { background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; }
  .option.wrong { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }
  .option-label { font-weight: bold; margin-right: 15px; color: #00F0FF; }
  .meta { font-size: 0.85rem; color: #888; text-align: right; margin-top: 15px; }
  .toggle-btn { background: #00F0FF20; color: #00F0FF; border: 1px solid #00F0FF40; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 15px; transition: all 0.2s; }
  .toggle-btn:hover { background: #00F0FF40; }
  .solution { display: none; background: #0f172a; padding: 20px; border-radius: 8px; border-left: 4px solid #B026FF; margin-top: 20px; line-height: 1.6; }
  .solution.visible { display: block; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  img { max-width: 100%; border-radius: 8px; }
</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>
<script>
  function toggleSolution(id) {
    const el = document.getElementById(id);
    el.classList.toggle('visible');
  }
  function checkAnswer(optEl, isCorrect) {
    if (optEl.parentElement.dataset.answered === 'true') return;
    optEl.parentElement.dataset.answered = 'true';
    const num = optEl.dataset.qnum;
    if (isCorrect) {
      optEl.classList.add('correct');
      setTimeout(() => document.getElementById('sol-' + num).classList.add('visible'), 500);
    } else {
      optEl.classList.add('wrong');
      const ops = optEl.parentElement.children;
      for (let i = 0; i < ops.length; i++) {
        if (ops[i].dataset.correct === 'true') {
          ops[i].classList.add('correct');
        }
      }
      setTimeout(() => document.getElementById('sol-' + num).classList.add('visible'), 1000);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.md-content').forEach(el => {
      // Decode the url-encoded markdown
      const mdtext = decodeURIComponent(el.dataset.md);
      el.innerHTML = marked.parse(mdtext);
    });
  });
</script>
</head>
<body>
<div class="container">
<h1>${title}</h1>
      `;

      questions.forEach((q, i) => {
        const qText = encodeURIComponent(q.question || q.question_text || '');
        const solText = encodeURIComponent(q.solution || q.explanation || '');
        const hasOptions = q.options && q.options.length > 0;
        const correctAns = q.correctAnswer || q.correct_answer || '';

        htmlContent += `
<div class="question-container">
  <div class="q-number">Question ${i + 1}</div>
  <div class="q-text md-content" data-md="${qText}"></div>`;

        if (hasOptions) {
          htmlContent += `<div class="options" data-answered="false">`;
          q.options!.forEach((opt, idx) => {
            const isCorrect = (opt === correctAns || String.fromCharCode(65 + idx) === correctAns || opt.includes(correctAns));
            const optVal = encodeURIComponent(opt);
            htmlContent += `<div class="option" data-qnum="${i}" data-correct="${isCorrect}" onclick="checkAnswer(this, ${isCorrect})"><span class="option-label">${String.fromCharCode(65 + idx)})</span> <span class="md-content" data-md="${optVal}"></span></div>`;
          });
          htmlContent += `</div>`;
        }

        if (q.solution || q.explanation) {
          if (!hasOptions) {
            htmlContent += `<button class="toggle-btn" onclick="toggleSolution('sol-${i}')">Toggle Solution</button>`;
          }
          htmlContent += `
  <div id="sol-${i}" class="solution">
    <strong>Solution & Explanation:</strong><br><br>
    <div class="md-content" data-md="${solText}"></div>
  </div>`;
        }
        
        if (q.year || q.pyqYear || q.exam) {
          htmlContent += `<div class="meta">Source: ${q.exam || ''} ${q.year || q.pyqYear || ''}</div>`;
        }
        htmlContent += `</div>`;
      });

      htmlContent += `
</div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Interactive.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(err) {
      console.error(err);
      alert('Error generating HTML.');
    } finally {
      setIsExportingHTML(false);
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
          width: '900px',
          padding: '40px',
          background: '#0a0a0a',
          color: '#e5e5e5',
          fontFamily: 'sans-serif'
        }}
      >
        <h1 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center', color: '#00F0FF', borderBottom: '2px solid #333', paddingBottom: '10px' }}>{title}</h1>
        {questions.map((q, i) => (
          <div key={i} style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #333', pageBreakInside: 'avoid' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#B026FF' }}>Question {i + 1}</div>
            <div style={{ marginBottom: '15px', fontSize: '16px', lineHeight: '1.5' }} className="markdown-body prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {q.question || q.question_text || ''}
              </ReactMarkdown>
            </div>
            {q.options && q.options.length > 0 && (
              <div style={{ marginLeft: '20px', marginBottom: '15px' }}>
                {q.options.map((opt, idx) => (
                  <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', display: 'flex' }} className="markdown-body prose prose-invert max-w-none">
                    <span style={{ fontWeight: 'bold', color: '#00F0FF', marginRight: '10px' }}>{String.fromCharCode(65 + idx)})</span>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {opt}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            )}
            {(q.solution || q.explanation) && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px', borderLeft: '4px solid #B026FF' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00F0FF', marginBottom: '10px' }}>SOLUTION & EXPLANATION:</div>
                <div className="markdown-body prose prose-invert max-w-none" style={{ fontSize: '15px' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {q.solution || q.explanation || ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {(q.year || q.pyqYear || q.exam) && (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '15px', textAlign: 'right' }}>
                Source: {q.exam || ''} {q.year || q.pyqYear || ''}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={exportToHTML}
          disabled={isExportingHTML || isExportingPDF}
          className={className || "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] font-bold border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50"}
        >
          {isExportingHTML ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code className="w-5 h-5" />}
          Interactive HTML
        </button>
        <button
          onClick={exportToPDF}
          disabled={isExportingPDF || isExportingHTML}
          className={className || "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"}
        >
          {isExportingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Export PDF
        </button>
      </div>
    </>
  );
};
