import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GrammarTextarea } from '../components/GrammarTextarea';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Terminal, Code2, GitPullRequest, Settings, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function AIDeveloperPanel() {
  const { role } = useAuthStore();
  const navigate = useNavigate();

  const [instruction, setInstruction] = useState('');
  const [componentPath, setComponentPath] = useState('/src/components/PhysicsSimulator.tsx');
  const [githubToken, setGithubToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'validating' | 'committing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (role !== 'admin' && role !== 'developer') {
      navigate('/');
    }
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction || !componentPath || !githubToken || !repoOwner || !repoName) {
      setErrorMsg('Please fill in all required fields.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('processing');
    setErrorMsg('');
    setSuccessData(null);

    try {
      const response = await fetch('/api/ai/evolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          componentPath,
          githubToken,
          repoOwner,
          repoName,
          apiKey
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to process request');
      }

      setSuccessData(data);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'admin' && role !== 'developer') {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <Terminal className="w-8 h-8 text-[#00F0FF]" />
              AI Developer Panel
            </h1>
            <p className="text-gray-400 mt-2">Self-Evolving UI Engine - Natural Language to Production Code</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-[#B026FF]/20 border border-[#B026FF]/30 text-[#B026FF] text-sm font-bold tracking-wider uppercase">
            Admin Access
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-black/40">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#00F0FF]" />
                Task Configuration
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Target Component Path</label>
                    <input 
                      type="text"
                      list="component-paths"
                      value={componentPath}
                      onChange={(e) => setComponentPath(e.target.value)}
                      placeholder="e.g., /src/components/PhysicsSimulator.tsx"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                      required
                    />
                    <datalist id="component-paths">
                      <option value="/src/components/PhysicsSimulator.tsx" />
                      <option value="/src/components/DashboardLayout.tsx" />
                      <option value="/src/components/PracticeArena.tsx" />
                      <option value="/src/pages/Dashboard.tsx" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Instruction</label>
                    <div className="relative h-32">
                      <GrammarTextarea 
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="e.g., Add dark mode toggle to the physics simulator component"
                        className="w-full h-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors resize-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" onClick={() => setInstruction("Create a new animated lesson card component.")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors">
                      ✨ AI Component Generator
                    </button>
                    <button type="button" onClick={() => setInstruction("Fix layout overflow in dashboard.")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors">
                      🐛 AI Bug Fix Assistant
                    </button>
                    <button type="button" onClick={() => setInstruction("Optimize this component for mobile and smart panel screens.")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors">
                      ♻️ AI Refactor Tool
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    System Credentials
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">GitHub Owner</label>
                      <input 
                        type="text"
                        value={repoOwner}
                        onChange={(e) => setRepoOwner(e.target.value)}
                        placeholder="e.g., my-org"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">GitHub Repo</label>
                      <input 
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="e.g., smart-sunrise"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">GitHub Personal Access Token</label>
                    <input 
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Gemini API Key (Optional)</label>
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Evolving UI...
                    </>
                  ) : (
                    <>
                      <Terminal className="w-5 h-5" />
                      Execute Evolution
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-black/40 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-[#B026FF]" />
                Deployment Status
              </h2>

              <div className="space-y-4">
                <StatusStep 
                  title="Analyzing Request" 
                  active={status === 'processing'} 
                  completed={['validating', 'committing', 'success'].includes(status)} 
                />
                <StatusStep 
                  title="AI Code Generation" 
                  active={status === 'processing'} 
                  completed={['validating', 'committing', 'success'].includes(status)} 
                />
                <StatusStep 
                  title="Validation (Build/Lint)" 
                  active={status === 'validating'} 
                  completed={['committing', 'success'].includes(status)} 
                />
                <StatusStep 
                  title="GitHub PR Creation" 
                  active={status === 'committing'} 
                  completed={status === 'success'} 
                />
              </div>

              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">{errorMsg}</div>
                </motion.div>
              )}

              {status === 'success' && successData && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-green-400">Evolution Successful</div>
                        <div className="text-xs text-green-200/70 mt-1">Branch: {successData.branchName}</div>
                      </div>
                    </div>
                    
                    <a 
                      href={successData.pullRequestUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full py-2 text-center rounded-lg bg-green-500/20 text-green-300 text-sm font-bold hover:bg-green-500/30 transition-colors"
                    >
                      Review Pull Request
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-2">Change Summary</h3>
                    <p className="text-xs text-gray-400">The AI has successfully processed your instruction and generated the updated code. A pull request has been created for your review.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-2">AI Suggestion Preview</h3>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar rounded-lg bg-[#0f172a] p-3">
                      <pre className="text-[10px] sm:text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {successData.updatedCode}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatusStep({ title, active, completed }: { title: string, active: boolean, completed: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${active ? 'opacity-100' : completed ? 'opacity-70' : 'opacity-30'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        completed ? 'bg-green-500/20 text-green-400' : 
        active ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 
        'bg-white/10 text-gray-500'
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : 
         active ? <Loader2 className="w-4 h-4 animate-spin" /> : 
         <div className="w-2 h-2 rounded-full bg-current" />}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-400'}`}>{title}</span>
    </div>
  );
}
