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
  Sparkles,
  Workflow,
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
              <p className="font-semibold">💡 Γιατί βλέπετε λευκή οθόνη (White Screen) & Πώς λύνεται σε 1 λεπτό:</p>
              <p className="text-slate-300">
                Επειδή η εφαρμογή είναι σύγχρονο React/Vite project (TypeScript), τα αρχεία πρέπει να γίνουν <strong>build</strong> από το GitHub.
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs pt-1">
              <li>
                <strong>Μετάβαση στο αποθετήριο:</strong> Ανοίξτε το <a href="https://github.com/eyeofemendare/IPTV-manager" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono">github.com/eyeofemendare/IPTV-manager</a>.
              </li>
              <li>
                <strong>Ρυθμίσεις Pages:</strong> Κάντε κλικ στην καρτέλα <strong>Settings</strong> ➔ στο αριστερό μενού πατήστε <strong>Pages</strong>.
              </li>
              <li>
                <strong>Επιλογή Source (Πολύ σημαντικό):</strong><br />
                Στο πεδίο <em>Build and deployment ➔ Source</em>, αλλάξτε το από <em>«Deploy from a branch»</em> σε:
                <div className="my-1.5 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 font-bold">
                  👉 Επιλέξτε: <u>GitHub Actions</u>
                </div>
              </li>
              <li>
                Το GitHub θα εντοπίσει το αρχείο <code className="text-cyan-400 font-mono">deploy-pages.yml</code> (ή μπορείτε να επιλέξετε το προτεινόμενο Vite / Static HTML workflow του GitHub), θα κάνει αυτόματα το build και σε 1 λεπτό το site θα ανοίγει κανονικά στο:
                <div className="mt-1 font-mono text-emerald-400 font-bold">https://eyeofemendare.github.io/IPTV-manager/</div>
              </li>
            </ol>
          </div>

          {/* Section 2: GitHub Action Workflow Automation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Workflow className="w-4 h-4 text-cyan-400" />
              <span>Βήμα 2: Πώς ρυθμίζεται το GitHub Action Workflow (Αυτόματος Συγχρονισμός);</span>
            </h4>
            
            <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <p>
                <strong>Χρειάζεται απαραίτητα το workflow;</strong>
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li><strong className="text-slate-200">Όχι:</strong> Αν θέλετε απλώς να παίζει η λίστα σας στην τηλεόραση (χρησιμοποιείτε απευθείας το M3U link ή το αρχείο).</li>
                <li><strong className="text-slate-200">Ναι:</strong> Αν θέλετε το GitHub να μπαίνει μόνο του καθημερινά (χωρίς ανοιχτό υπολογιστή) και να ανανεώνει EPG και streams αυτόματα!</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Οδηγός Δημιουργίας (Μέσα στο GitHub):</span>
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                <li>
                  Στο repository σας στο GitHub, πατήστε <strong>Add file ➔ Create new file</strong>.
                </li>
                <li>
                  Στο πεδίο ονόματος πληκτρολογήστε:
                  <code className="text-emerald-400 font-bold font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 block sm:inline-block my-1">
                    .github/workflows/iptv-sync.yml
                  </code>
                </li>
                <li>
                  Κάντε επικόλληση του κώδικα YAML (τον αντιγράφετε με το κουμπί <em>«Αντιγραφή Workflow»</em> στο Βήμα 4).
                </li>
                <li>
                  Πατήστε <strong>Commit changes...</strong>.
                </li>
                <li>
                  <strong>Δικαίωμα εγγραφής:</strong> Πηγαίνετε <em>Settings ➔ Actions ➔ General ➔ Workflow permissions</em>, επιλέξτε <strong>Read and write permissions</strong> και πατήστε <strong>Save</strong>.
                </li>
              </ol>
            </div>
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
