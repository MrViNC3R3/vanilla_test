//  ── intentionally INSECURE SSTI demo ──
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/preview', (req, res) => {
  const { template = '' } = req.body;

  // Bonus: allow {{ ... }} syntax by converting to ${ ... }
  const sanitized = template.replace(/{{\s*([^}]+)\s*}}/g, (_match, code) => `\${${code}}`);

  try {
    // ⚠️ DANGEROUS: executes user-supplied template literal
    const render = new Function(`return \`${sanitized}\``);
    const output = render();
    res.json({ result: output });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SSTI demo listening on port ${PORT}`);
});
