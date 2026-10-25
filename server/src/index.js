import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () =>
  console.log(`\x1b[32m✅ API ready → http://localhost:${PORT}\x1b[0m`)
);
