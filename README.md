# Vanilla SSTI Demo Project

A minimal, intentionally vulnerable Node.js application demonstrating Server-Side Template Injection (SSTI) and environment variable exposure for security research and education.

## 🚨 Security Warning

**This application is INTENTIONALLY INSECURE and contains severe vulnerabilities. Never deploy this to production or expose it to untrusted users.**

## Project Structure

```
vanilla-ssti-demo/
├── package.json
├── server.js
├── public/
│   └── index.html
├── README.md
└── .gitignore
```

## Files

### package.json
```json
{
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
}
```

### server.js
```javascript
const express = require('express');
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
    // Convert {{ ... }} syntax to ${ ... } for broader compatibility
    const processed = description.replace(/{{\s*([^}]*)\s*}}/g, (_, code) => `\${${code}}`);
    
    // ⚠️ DANGEROUS: Direct template evaluation - NEVER DO THIS IN PRODUCTION
    const render = new Function(`return \`${processed}\`;`);
    const result = render();
    
    res.json({ result: String(result) });
  } catch (error) {
    res.json({ result: `Error: ${error.message}` });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
});

app.listen(PORT, () => {
  console.log(`🚨 VULNERABLE SSTI Demo running on port ${PORT}`);
  console.log(`⚠️  WARNING: This app is intentionally insecure!`);
  console.log(`📍 Access at: http://localhost:${PORT}`);
});
```

### public/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanilla SSTI Demo</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .warning {
            background-color: #fee;
            border: 2px solid #f88;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
            color: #c33;
        }
        .demo-section {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        textarea {
            width: 100%;
            height: 100px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
            resize: vertical;
        }
        button {
            background-color: #333;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
        }
        button:hover {
            background-color: #555;
        }
        .output {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }
        .examples {
            margin-top: 20px;
        }
        .example {
            background-color: #f0f8ff;
            border: 1px solid #b0d4f1;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            cursor: pointer;
        }
        .example:hover {
            background-color: #e6f3ff;
        }
        h1, h2 {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 Vanilla SSTI Demo</h1>
        
        <div class="warning">
            <strong>⚠️ Security Warning:</strong> This application is intentionally vulnerable and demonstrates Server-Side Template Injection (SSTI). 
            It should ONLY be used for security research, education, and authorized testing.
        </div>

        <div class="demo-section">
            <h2>Template Preview</h2>
            <p>Enter a template string to be evaluated server-side. Both <code>${...}</code> and <code>{{...}}</code> syntax are supported.</p>
            
            <form id="ssti-form">
                <textarea id="template-input" placeholder="Try: ${7*7} or {{process.env.NODE_ENV}}" name="description"></textarea>
                <button type="submit">Preview Template</button>
            </form>
            
            <div id="output" class="output" style="display: none;"></div>
        </div>

        <div class="examples">
            <h2>Example Payloads</h2>
            <p>Click any example to try it:</p>
            
            <div class="example" onclick="setTemplate('${7*7}')">
                <strong>Basic Math:</strong> ${7*7}
            </div>
            
            <div class="example" onclick="setTemplate('{{7*7}}')">
                <strong>Alternative Syntax:</strong> {{7*7}}
            </div>
            
            <div class="example" onclick="setTemplate('${process.env.NODE_ENV}')">
                <strong>Environment Variable:</strong> ${process.env.NODE_ENV}
            </div>
            
            <div class="example" onclick="setTemplate('{{JSON.stringify(process.env, null, 2)}}')">
                <strong>All Environment Variables:</strong> {{JSON.stringify(process.env, null, 2)}}
            </div>
            
            <div class="example" onclick="setTemplate('${process.version}')">
                <strong>Node Version:</strong> ${process.version}
            </div>
            
            <div class="example" onclick="setTemplate('${new Date().toISOString()}')">
                <strong>Current Time:</strong> ${new Date().toISOString()}
            </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p><strong>Educational Purpose:</strong> This demo shows how SSTI vulnerabilities can leak sensitive information like AWS credentials in serverless environments.</p>
            <p><strong>Mitigation:</strong> Never evaluate user input directly. Use safe templating engines with proper sandboxing.</p>
        </div>
    </div>

    <script>
        function setTemplate(template) {
            document.getElementById('template-input').value = template;
        }

        document.getElementById('ssti-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const description = formData.get('description');
            
            if (!description.trim()) {
                alert('Please enter a template string');
                return;
            }

            const outputDiv = document.getElementById('output');
            outputDiv.style.display = 'block';
            outputDiv.textContent = 'Processing...';

            try {
                const response = await fetch('/api/preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ description })
                });

                const data = await response.json();
                outputDiv.textContent = data.result || 'No result returned';
                
            } catch (error) {
                outputDiv.textContent = `Network Error: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

### .gitignore
```
node_modules/
.env
.env.local
.vercel
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
```

### README.md
```markdown
# Vanilla SSTI Demo

## ⚠️ SECURITY WARNING

This application contains **intentional security vulnerabilities** and should NEVER be deployed to production or exposed to untrusted users. It is designed for:

- Security research and education
- Demonstrating SSTI vulnerabilities
- Testing serverless environment variable exposure
- Authorized penetration testing

## What This Demonstrates

This vanilla Node.js application demonstrates:

1. **Server-Side Template Injection (SSTI)** - User input is evaluated as code
2. **Environment Variable Exposure** - When deployed to serverless platforms like Vercel, it can leak AWS credentials
3. **Minimal Attack Surface** - Shows vulnerabilities with minimal dependencies

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start the server
npm start

# Visit http://localhost:3000
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Example Payloads

- `${7*7}` - Basic arithmetic
- `{{7*7}}` - Alternative syntax  
- `${process.env}` - Environment variables
- `{{JSON.stringify(process.env, null, 2)}}` - Formatted env vars
- `${process.version}` - Node.js version

## On Serverless Platforms

When deployed to Vercel, this app will expose:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_SESSION_TOKEN`
- `VERCEL_*` environment variables

This demonstrates the security impact of SSTI in cloud environments.

## Mitigation

- Never evaluate user input as code
- Use safe templating engines (Handlebars, Mustache)
- Implement proper input validation and sanitization
- Use Content Security Policies
- Apply principle of least privilege for service accounts

## Legal Notice

This tool is for authorized security testing only. Unauthorized use against systems you don't own is illegal.
```

## Quick Setup Commands

```bash
# Create project directory
mkdir vanilla-ssti-demo
cd vanilla-ssti-demo

# Initialize package.json
npm init -y

# Install Express
npm install express

# Create directories
mkdir public

# Deploy to Vercel (optional)
npx vercel --prod
```

## Key Features

1. **Minimal Dependencies**: Only Express.js
2. **Dual Syntax Support**: Both `${...}` and `{{...}}`
3. **Clean UI**: Simple web interface for testing
4. **Educational**: Clear warnings and explanations
5. **Serverless Ready**: Deploys easily to Vercel/AWS Lambda

This vanilla implementation replicates your SSTI demo functionality while using the absolute minimum framework overhead possible.
