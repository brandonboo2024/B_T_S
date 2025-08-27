// server.js
const express = require('express');
const app = express();

//middleware so we can handle JSON

app.use(express.json());

//test route
app.get('/', (req, res) =>{
  res.send('Hello World!');
});

// TEST TEST ROUTE
app.get('/ping', (req, res) => {
  res.send('pong');
})


// start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log('Server running on http://localhost:${PORT}');
});


