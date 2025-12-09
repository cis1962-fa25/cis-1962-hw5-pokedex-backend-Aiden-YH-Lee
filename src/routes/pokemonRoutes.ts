import { Router } from 'express';
import * as pokemonController from '../controllers/pokemonController.js';

const router = Router();

router.get('/', pokemonController.listPokemon);
router.get('/:name', pokemonController.getPokemonByName);

export default router;
