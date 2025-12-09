export interface PokemonType {
    name: string;
    color: string;
}

export interface PokemonMove {
    name: string;
    power?: number;
    type: PokemonType;
}

export interface Pokemon {
    id: number;
    name: string;
    description: string;
    types: PokemonType[];
    moves: PokemonMove[];
    sprites: {
        front_default: string;
        back_default: string;
        front_shiny: string;
        back_shiny: string;
    };
    stats: {
        hp: number;
        speed: number;
        attack: number;
        defense: number;
        specialAttack: number;
        specialDefense: number;
    };
}
