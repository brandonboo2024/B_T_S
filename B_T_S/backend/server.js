// server.js
const express = require('express');
const app = express();
const cors = require('cors');
//middleware so we can handle JSON

app.use(express.json());
app.use(cors());

let videoFeed = [
  { id: 1, author: 'boo', description: 'test video 1'},
  { id: 2, author: 'hia', description: 'test video 2'}
];

// API ROUTES
//test route
app.get('/', (req, res) =>{
  res.send('Hello World!');
});

// TEST TEST ROUTE
app.get('/ping', (req, res) => {
  res.send('pong');
})

// creating api route for front end to request for a video
app.get('/api/feed', (req, res) =>{
  res.json({
    success: true,
    data: videoFeed
  });
});


// start server
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


