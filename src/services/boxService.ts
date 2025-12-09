import client from '../config/redis.js';
import { createId } from '@paralleldrive/cuid2';
import type { BoxEntry, InsertBoxEntry, UpdateBoxEntry } from '../models/box.js';

const getKey = (pennkey: string, id: string) => `${pennkey}:pokedex:${id}`;
const getPattern = (pennkey: string) => `${pennkey}:pokedex:*`;

export const createBoxEntry = async (pennkey: string, data: InsertBoxEntry): Promise<BoxEntry> => {
    const id = createId();
    const entry: BoxEntry = { ...data, id };
    const key = getKey(pennkey, id);

    await client.set(key, JSON.stringify(entry));
    return entry;
};

export const getBoxEntry = async (pennkey: string, id: string): Promise<BoxEntry | null> => {
    const key = getKey(pennkey, id);
    const data = await client.get(key);

    if (!data) return null;
    return JSON.parse(data) as BoxEntry;
};

export const updateBoxEntry = async (pennkey: string, id: string, updates: UpdateBoxEntry): Promise<BoxEntry | null> => {
    const currentEntry = await getBoxEntry(pennkey, id);
    if (!currentEntry) return null;

    // Remove undefined fields from updates to avoid overwriting existing values with undefined
    const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const updatedEntry: BoxEntry = { ...currentEntry, ...cleanUpdates };
    const key = getKey(pennkey, id);

    await client.set(key, JSON.stringify(updatedEntry));
    return updatedEntry;
};

export const deleteBoxEntry = async (pennkey: string, id: string): Promise<boolean> => {
    const key = getKey(pennkey, id);
    const result = await client.del(key);
    return result > 0;
};

export const listBoxEntries = async (pennkey: string): Promise<string[]> => {
    const pattern = getPattern(pennkey);
    const keys = await client.keys(pattern);

    // Extract IDs from keys: "{pennkey}:pokedex:{id}"
    return keys.map(key => key.split(':').pop() || '');
};

export const clearBoxEntries = async (pennkey: string): Promise<void> => {
    const pattern = getPattern(pennkey);
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
        await client.del(keys);
    }
};
