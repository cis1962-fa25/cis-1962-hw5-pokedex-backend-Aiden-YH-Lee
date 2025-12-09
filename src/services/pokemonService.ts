import Pokedex from 'pokedex-promise-v2';
import type { Pokemon, PokemonMove, PokemonType } from '../models/pokemon.js';

const P = new Pokedex();

const typeColors: { [key: string]: string } = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    steel: '#B7B7CE',
    fairy: '#D685AD',
};

export const getPokemonDetails = async (name: string): Promise<Pokemon> => {
    try {
        // 1. Fetch basic Pokemon data
        const pokemonData = await P.getPokemonByName(name);

        // 2. Fetch species data for description
        const speciesData = await P.getPokemonSpeciesByName(name);

        // 3. Fetch moves data
        const movePromises = pokemonData.moves.map(async (moveEntry) => {
            try {
                const moveData = await P.getMoveByName(moveEntry.move.name);
                const englishName = moveData.names.find((n) => n.language.name === 'en')?.name || moveData.name;

                const typeName = moveData.type.name;
                const moveType: PokemonType = {
                    name: typeName.toUpperCase(),
                    color: typeColors[typeName] || '#000000'
                };

                return {
                    name: englishName,
                    power: moveData.power || undefined,
                    type: moveType,
                } as PokemonMove;
            } catch (error) {
                console.error(`Failed to fetch move ${moveEntry.move.name}`, error);
                return null;
            }
        });

        const moves = (await Promise.all(movePromises)).filter((m): m is PokemonMove => m !== null);

        // Extract description (flavor text)
        const descriptionEntry = speciesData.flavor_text_entries.find(
            (entry) => entry.language.name === 'en'
        );
        const description = descriptionEntry
            ? descriptionEntry.flavor_text.replace(/[\n\f]/g, ' ')
            : 'No description available.';

        // Map types
        const types: PokemonType[] = pokemonData.types.map((typeEntry) => ({
            name: typeEntry.type.name.toUpperCase(),
            color: typeColors[typeEntry.type.name] || '#000000',
        }));

        // Map stats
        const stats = {
            hp: pokemonData.stats.find((s) => s.stat.name === 'hp')?.base_stat || 0,
            speed: pokemonData.stats.find((s) => s.stat.name === 'speed')?.base_stat || 0,
            attack: pokemonData.stats.find((s) => s.stat.name === 'attack')?.base_stat || 0,
            defense: pokemonData.stats.find((s) => s.stat.name === 'defense')?.base_stat || 0,
            specialAttack: pokemonData.stats.find((s) => s.stat.name === 'special-attack')?.base_stat || 0,
            specialDefense: pokemonData.stats.find((s) => s.stat.name === 'special-defense')?.base_stat || 0,
        };

        const englishName = speciesData.names.find((n) => n.language.name === 'en')?.name || pokemonData.name;

        return {
            id: pokemonData.id,
            name: englishName,
            description,
            types,
            moves,
            sprites: {
                front_default: pokemonData.sprites.front_default || '',
                back_default: pokemonData.sprites.back_default || '',
                front_shiny: pokemonData.sprites.front_shiny || '',
                back_shiny: pokemonData.sprites.back_shiny || '',
            },
            stats,
        };

    } catch (error) {
        throw error;
    }
};

export const getPokemonList = async (limit: number, offset: number): Promise<Pokemon[]> => {
    const list = await P.getPokemonsList({ limit, offset });

    // For each pokemon, fetch details
    const promises = list.results.map((p) => getPokemonDetails(p.name));
    return Promise.all(promises);
};
