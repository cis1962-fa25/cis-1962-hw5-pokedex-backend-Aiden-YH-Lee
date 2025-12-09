import express from 'express';
import dotenv from 'dotenv';
import pokemonRoutes from './routes/pokemonRoutes.js';
import authRoutes from './routes/authRoutes.js';
import boxRoutes from './routes/boxRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.use(authRoutes);
app.use('/pokemon', pokemonRoutes);
app.use('/box', boxRoutes);

export default app;
