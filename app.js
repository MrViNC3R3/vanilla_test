// Vanilla SSTI Demo – Main JS
// ------------------------------------------------------------
(() => {
  /* ---------------------------------------------------------- */
  /*  TAB NAVIGATION                                            */
  /* ---------------------------------------------------------- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function setActiveTab(name) {
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === name;
      btn.classList.toggle('active', isActive);
    });
    tabPanes.forEach(pane => {
      const isActive = pane.id === name;
      pane.classList.toggle('active', isActive);
    });
  }

  // Attach listeners
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  // Ensure overview visible on first load
  setActiveTab('overview');

  /* ---------------------------------------------------------- */
  /*  PROJECT FILE BROWSER                                      */
  /* ---------------------------------------------------------- */
  // Hard-coded project files (provided in JSON data)
  const FILES = {
    'package.json': `{
  "name": "vanilla-ssti-demo",
  "version": "1.0.0",
  "description": "Vanilla Node.js SSTI demo for security research",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`,

    'server.js': `const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ⚠️ VULNERABLE ENDPOINT - FOR DEMO PURPOSES ONLY
app.post('/api/preview', (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ result: 'Error: No description provided' });
  }

  try {
    // Convert {{ }} to ${ }
    const processed = description.replace(/{{\s*([^}]*)\s*}}/g, (_, code) => `\\${${code}}`);
    const render = new Function(`return \\`${processed}\\`;`);
    const result = render();
    res.json({ result: String(result) });
  } catch (error) {
    res.json({ result: `Error: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚨 Demo running on port ${PORT}`);
});`,

    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vanilla SSTI Demo</title>
</head>
<body>
  <h1>Vanilla SSTI Demo</h1>
  <p>Front-end page that allows testing of the vulnerable endpoint.</p>
</body>
</html>`
  };

  // Placeholder until README loaded
  FILES['readme.md'] = '# Vanilla SSTI Demo\n\nLoading README…';

  const README_URL = 'https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/4cad7b46d001dbd5ad0c1c9b215538b7/783308fc-345b-49be-9a77-5c2f17967c41/15ed28d2.md';
  fetch(README_URL)
    .then(r => (r.ok ? r.text() : Promise.reject()))
    .then(text => {
      FILES['readme.md'] = text;
      // If user currently viewing readme, refresh content
      if (currentFileEl.textContent === 'readme.md') {
        renderFile('readme.md');
      }
    })
    .catch(() => {
      FILES['readme.md'] = '# README\n\nUnable to load remote README.';
    });

  // DOM elements
  const fileItems = document.querySelectorAll('.file-item');
  const fileContentEl = document.getElementById('file-content');
  const currentFileEl = document.getElementById('current-file');
  const copyBtn = document.getElementById('copy-file');
  const downloadBtn = document.getElementById('download-file');

  // Render helper
  function renderFile(name) {
    const raw = FILES[name] ?? '// File not found';
    currentFileEl.textContent = name;
    fileContentEl.innerHTML = syntaxHighlight(escape(raw), name);
    fileItems.forEach(item => item.classList.toggle('active', item.dataset.file === name));
  }

  // Initial file
  renderFile('package.json');

  // Click handlers for file list
  fileItems.forEach(item => {
    item.addEventListener('click', () => renderFile(item.dataset.file));
  });

  // Copy
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(FILES[currentFileEl.textContent] || '').then(() => toast('Copied to clipboard'));
  });

  // Download
  downloadBtn.addEventListener('click', () => {
    const name = currentFileEl.textContent;
    const blob = new Blob([FILES[name]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /* ---------------------------------------------------------- */
  /*  LIVE DEMO                                                 */
  /* ---------------------------------------------------------- */
  const payloadInput = document.getElementById('payload-input');
  const testBtn = document.getElementById('test-payload');
  const resultBox = document.getElementById('payload-result');
  const exampleCards = document.querySelectorAll('.example-card');

  function evaluate(templateStr) {
    try {
      if (!templateStr.trim()) return 'Error: Empty payload';
      const processed = templateStr.replace(/{{\s*([^}]*)\s*}}/g, (_, code) => `\${${code}}`);
      return new Function(`return \`${processed}\`;`)();
    } catch (err) {
      return `Error: ${err.message}`;
    }
  }

  function displayResult(res) {
    resultBox.textContent = res;
    resultBox.classList.toggle('error', String(res).startsWith('Error'));
    resultBox.classList.toggle('success', !String(res).startsWith('Error'));
  }

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      displayResult(evaluate(payloadInput.value));
    });
  }

  exampleCards.forEach(card => {
    card.addEventListener('click', () => {
      const p = card.dataset.payload;
      payloadInput.value = p;
      displayResult(evaluate(p));
      setActiveTab('demo');
    });
  });

  /* ---------------------------------------------------------- */
  /*  UTILITIES                                                 */
  /* ---------------------------------------------------------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'copy-success';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function escape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Very minimal syntax highlighter (JS/JSON/HTML/MD)
  function syntaxHighlight(code, fileName) {
    let html = code;
    if (fileName.endsWith('.js') || fileName.endsWith('.json')) {
      html = html
        .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>')
        .replace(/\b(\d+)(?=[^\w])/g, '<span class="number">$1</span>')
        .replace(/\b(const|let|var|return|if|else|try|catch|new|function|=>|import|from|export|class|extends|require)\b/g, '<span class="keyword">$1</span>')
        .replace(/(\/\/.*?$)/gm, '<span class="comment">$1</span>');
    } else if (fileName.endsWith('.html')) {
      html = html.replace(/(&lt;\/?.*?&gt;)/g, '<span class="keyword">$1</span>');
    } else if (fileName.endsWith('.md')) {
      html = html.replace(/(^#+ .*?$)/gm, '<span class="keyword">$1</span>');
    }
    return html;
  }

  // Shortcut: Ctrl/Cmd+S copies file
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      copyBtn.click();
    }
  });
})();
