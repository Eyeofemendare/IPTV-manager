import React, { useState } from 'react';
import {
  X,
  Github,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Code2,
  FileCode,
  Terminal,
} from 'lucide-react';

interface GithubHostingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubHostingModal: React.FC<GithubHostingModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadStandaloneHtml = () => {
    // Generate a standalone HTML file that can be committed to GitHub Pages root
    const htmlContent = `<!doctype html>
<html lang="el" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iPTV Manager - GitHub Pages Edition</title>
  <meta name="description" content="Ολοκληρωμένο εργαλείο διαχείρισης, φιλτραρίσματος, αντιστοίχισης EPG και συγχρονισμού λιστών IPTV." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <style>
    body { background-color: #0b0f17; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between">
  <header class="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xl font-extrabold text-white">iPTV <span class="text-emerald-400">Manager</span></span>
      <span class="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">GitHub Pages</span>
    </div>
    <a href="https://github.com" target="_blank" class="text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">GitHub Repo</a>
  </header>
  <main class="max-w-4xl mx-auto p-6 space-y-6 flex-1 flex flex-col justify-center text-center">
    <div class="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-4">
      <h2 class="text-2xl font-bold text-white">Καλωσήρθατε στο iPTV Manager για GitHub Pages</h2>
      <p class="text-slate-400 text-sm max-w-xl mx-auto">
        Η εφαρμογή διαχείρισης και φιλτραρίσματος IPTV λιστών έχει αναπτυχθεί με πλήρη υποστήριξη για static hosting σε GitHub Pages, Cloudflare Pages και Netlify.
      </p>
      <div class="pt-4 flex flex-wrap justify-center gap-3">
        <a href="https://github.com" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition">
          Άνοιγμα στο GitHub
        </a>
      </div>
    </div>
  </main>
  <footer class="border-t border-slate-800/80 text-center py-4 text-xs text-slate-500">
    iPTV Manager • Φιλοξενία στο GitHub Pages
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const gitCommands = `# 1. Αρχικοποίηση τοπικού φακέλου
git init
git add .
git commit -m "Initial commit of iPTV Manager"

# 2. Σύνδεση με το GitHub repository σας
git branch -M main
git remote add origin https://github.com/<USERNAME>/iptv-manager.git
git push -u origin main

# 3. Ενεργοποίηση GitHub Pages
# Μεταβείτε στο Settings -> Pages -> Επιλέξτε "Deploy from a branch" (main ή gh-pages)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Οδηγός Φιλοξενίας στο GitHub Pages (HTML Export)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Πού βρίσκεται το GitHub Pages & Πώς γίνεται το Deploy;</span>
            </h4>
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg space-y-1">
              <p className="font-semibold">💡 Σημαντική διευκρίνιση για το "Deploy στο Pages":</p>
              <p className="text-slate-300">
                Η επιλογή <strong>Pages</strong> δεν είναι κουμπί μέσα στην εφαρμογή αυτή, αλλά βρίσκεται <strong>μέσα στην ιστοσελίδα του GitHub</strong>, στις ρυθμίσεις του αποθετηρίου σας (Repository Settings).
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs pt-1">
              <li>
                <strong>Εξαγωγή / Ανέβασμα:</strong> Εξάγετε τον κώδικα στο GitHub μέσω του μενού της εφαρμογής (Settings ➔ Export to GitHub) ή ανεβάστε τα αρχεία σας σε νέο repository.
              </li>
              <li>
                <strong>Μετάβαση στο GitHub:</strong> Ανοίξτε το αποθετήριό σας στο <a href="https://github.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">github.com</a>.
              </li>
              <li>
                <strong>Ρυθμίσεις Pages:</strong> Κάντε κλικ στην καρτέλα <strong>Settings</strong> (στο πάνω μέρος του αποθετηρίου) ➔ στο αριστερό μενού πατήστε <strong>Pages</strong>.
              </li>
              <li>
                <strong>Ενεργοποίηση:</strong> Στο πεδίο <em>Build and deployment ➔ Source</em> επιλέξτε <strong>Deploy from a branch</strong>, διαλέξτε branch <strong>main</strong> και φάκελο <strong>/ (root)</strong> και πατήστε <strong>Save</strong>.
              </li>
              <li>
                Σε 1–2 λεπτά, το GitHub θα σας δώσει το live link της μορφής: <code className="text-emerald-400 font-bold font-mono">https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>!
              </li>
            </ol>
          </div>

          {/* Quick Terminal Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-slate-400" /> Εντολές Git Terminal
              </span>
              <button
                onClick={() => handleCopyText(gitCommands, 'git')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded transition"
              >
                {copied === 'git' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'git' ? 'Αντιγράφηκε' : 'Αντιγραφή'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {gitCommands}
            </pre>
          </div>

          {/* Download Standalone HTML */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-white text-xs sm:text-sm block">
                Άμεση Λήψη Αυτόνομου index.html
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Κατεβάστε έτοιμο το αρχείο html για άμεσο drag & drop στο GitHub repo σας.
              </span>
            </div>

            <button
              onClick={handleDownloadStandaloneHtml}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-md shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Λήψη HTML</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
