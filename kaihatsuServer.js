
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use( express.static( __dirname + '/public' ) );

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
