import type { Request, Response } from 'express';
import * as pokemonService from '../services/pokemonService.js';

export const listPokemon = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string);
        const offset = parseInt(req.query.offset as string);

        if (isNaN(limit) || limit <= 0 || isNaN(offset) || offset < 0) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Invalid limit or offset' });
            return;
        }

        const pokemonList = await pokemonService.getPokemonList(limit, offset);
        res.json(pokemonList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch pokemon list' });
    }
};

export const getPokemonByName = async (req: Request, res: Response) => {
    try {
        const name = req.params.name;
        if (!name) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Name is required' });
            return;
        }

        const pokemon = await pokemonService.getPokemonDetails(name);
        res.json(pokemon);
    } catch (error: any) {
        console.error(error);
        // Pokedex promise v2 might throw different errors.
        // Usually 404 comes from the API.
        // Let's assume if it fails it might be 404 or 500.
        // We can check error message or status if available.
        if (error.response && error.response.status === 404) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'Pokemon not found' });
        } else if (error.message && error.message.includes('404')) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'Pokemon not found' });
        } else {
            res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch pokemon details' });
        }
    }
};
