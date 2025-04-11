require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const { exec } = require("child_process");
const NodeCache = require("node-cache");
const cron = require('node-cron');

// Routes & Middleware
const dbConnect = require('./config/dbConnect');
const ensureAuthenticated = require('./middlewares/Auth');

// Routes
const AuthRouter = require('./routes/authRoutes');
const ExpenseRouter = require('./routes/ExpenseRouter');
const currencyRoutes = require('./routes/currencyRoutes');
const weatherRoutes = require('./routes/WeatherRoute');
const activitiesRoute = require('./routes/activitiesRoute');
const locationRoutes = require('./routes/locationRoute');
const amadeusRoutes = require('./routes/amadeus');
const tmdbRoutes = require('./routes/tmdb');
const geminiRoutes = require('./routes/geminiRoutes');
const movieRoutes = require('./routes/movieRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const cityRoutes = require('./routes/cityRoutes');
const storyRoute = require('./routes/stories');
const newsletterJob = require('./utils/cronJob');

// GTFS
require('./models/db.js');
const { Server } = require('socket.io');

// App setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// CORS (before everything else)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport
require('./config/passportConfig');
app.use(passport.initialize());
app.use(passport.session());

// Connect DB
dbConnect();

// Logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - Session:`, req.sessionID);
  next();
});

// Routes
app.get('/ping', (req, res) => res.send('PONG'));

app.use('/auth', AuthRouter);
app.use('/expenses', ensureAuthenticated, ExpenseRouter);
app.use('/api/currency', currencyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/activities', activitiesRoute);
app.use('/api/locations', locationRoutes);
app.use('/api/amadeus', amadeusRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/stories', storyRoute);
app.use('/api', require('./routes/gtfs'));

// Google Trends Python script route
const trendCache = new NodeCache({ stdTTL: 3600 });
app.get("/trends", (req, res) => {
  const { cityA, cityB } = req.query;
  if (!cityA || !cityB) return res.status(400).json({ error: "Provide two cities." });

  const cacheKey = `${cityA}_${cityB}`.toLowerCase();
  const cached = trendCache.get(cacheKey);
  if (cached) return res.json(cached);

  const command = `python trends.py "${cityA}" "${cityB}"`;
  exec(command, (err, stdout) => {
    if (err) return res.status(500).json({ error: "Trends error." });
    try {
      const parsed = JSON.parse(stdout);
      trendCache.set(cacheKey, parsed);
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: "Invalid JSON from script." });
    }
  });
});

// Socket.IO rooms
const rooms = {};
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  socket.on('createRoom', ({ meetupName, username }) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      name: meetupName,
      members: {
        [socket.id]: {
          socketId: socket.id,
          username: username || `User-${socket.id.slice(0, 4)}`,
          location: null
        }
      }
    };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, meetupName });
    io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
  });

  socket.on('joinRoom', ({ roomId, username }) => {
    if (!rooms[roomId]) return socket.emit('error', { message: 'Room not found!' });

    rooms[roomId].members[socket.id] = {
      socketId: socket.id,
      username: username || `User-${socket.id.slice(0, 4)}`,
      location: null
    };
    socket.join(roomId);
    socket.emit('roomJoined', {
      roomId,
      meetupName: rooms[roomId].name,
    });
    io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
    io.to(roomId).emit('userJoined', { username });
  });

  socket.on('updateLocation', ({ roomId, location }) => {
    if (rooms[roomId]?.members[socket.id]) {
      rooms[roomId].members[socket.id].location = location;
      io.to(roomId).emit('locationUpdate', Object.values(rooms[roomId].members));
    }
  });

  socket.on('leaveRoom', ({ roomId }) => {
    if (rooms[roomId]?.members[socket.id]) {
      const username = rooms[roomId].members[socket.id].username;
      delete rooms[roomId].members[socket.id];
      socket.leave(roomId);
      io.to(roomId).emit('userLeft', { username });

      if (Object.keys(rooms[roomId].members).length === 0) delete rooms[roomId];
      else io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      if (rooms[roomId].members[socket.id]) {
        const username = rooms[roomId].members[socket.id].username;
        delete rooms[roomId].members[socket.id];
        io.to(roomId).emit('userLeft', { username });

        if (Object.keys(rooms[roomId].members).length === 0) delete rooms[roomId];
        else io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
      }
    }
  });
});

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Cron jobs
newsletterJob.start();

// GTFS data init
(async () => {
  try {
    const { importGtfs, getStops } = await import('gtfs');
    const config = require('./config/gtfs-config.json');

    await importGtfs(config);
    console.log('GTFS loaded');

    cron.schedule('0 3 * * *', async () => {
      console.log('Refreshing GTFS...');
      await importGtfs(config);
    });

    app.get('/api/stops', async (req, res) => {
      try {
        const accessibleStops = await getStops({ wheelchair_boarding: 1 });
        const allStops = await getStops();
        res.json({ accessibleStops, totalStops: allStops.length });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  } catch (err) {
    console.error("GTFS init failed:", err);
  }
})();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
