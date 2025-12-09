import { z } from 'zod';

// Interfaces
export interface BoxEntry {
    id: string;
    createdAt: string;
    level: number;
    location: string;
    notes?: string | undefined;
    pokemonId: number;
}

export interface InsertBoxEntry {
    createdAt: string;
    level: number;
    location: string;
    notes?: string | undefined;
    pokemonId: number;
}

export interface UpdateBoxEntry {
    createdAt?: string | undefined;
    level?: number | undefined;
    location?: string | undefined;
    notes?: string | undefined;
    pokemonId?: number | undefined;
}

// Zod Schemas
export const insertBoxEntrySchema = z.object({
    createdAt: z.string().datetime({ message: "Invalid ISO 8601 date string" }),
    level: z.number().min(1).max(100),
    location: z.string().min(1),
    notes: z.string().optional(),
    pokemonId: z.number().int().positive(),
});

export const updateBoxEntrySchema = z.object({
    createdAt: z.string().datetime({ message: "Invalid ISO 8601 date string" }).optional(),
    level: z.number().min(1).max(100).optional(),
    location: z.string().min(1).optional(),
    notes: z.string().optional(),
    pokemonId: z.number().int().positive().optional(),
});
