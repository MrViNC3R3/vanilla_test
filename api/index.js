const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// SSTI vulnerable endpoint
app.post('/api/preview', (req, res) => {
  const { template = '' } = req.body;
  
  // Convert {{ ... }} to ${ ... } for dual syntax support
  const processed = template.replace(/{{\s*([^}]+)\s*}}/g, (_, code) => `\${${code}}`);
  
  try {
    // 🚨 INTENTIONALLY VULNERABLE - DO NOT USE IN PRODUCTION
    const render = new Function(`return \`${processed}\``);
    const result = render();
    
    res.json({ 
      result: result,
      input: template,
      processed: processed
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      input: template 
    });
  }
});

// Root route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;
