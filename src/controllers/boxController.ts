import type { Request, Response } from 'express';
import * as boxService from '../services/boxService.js';
import { insertBoxEntrySchema, updateBoxEntrySchema } from '../models/box.js';

export const createBoxEntry = async (req: Request, res: Response) => {
    try {
        const pennkey = req.user?.pennkey;
        if (!pennkey) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }

        const validation = insertBoxEntrySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Invalid request body', errors: validation.error.issues });
            return;
        }

        const entry = await boxService.createBoxEntry(pennkey, validation.data);
        res.status(201).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create box entry' });
    }
};

export const getBoxEntry = async (req: Request, res: Response) => {
    try {
        const pennkey = req.user?.pennkey;
        const { id } = req.params;

        if (!pennkey) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        if (!id) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing ID' });
            return;
        }

        const entry = await boxService.getBoxEntry(pennkey, id);
        if (!entry) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'Box entry not found' });
            return;
        }

        res.json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get box entry' });
    }
};

export const updateBoxEntry = async (req: Request, res: Response) => {
    try {
        const pennkey = req.user?.pennkey;
        const { id } = req.params;

        if (!pennkey) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        if (!id) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing ID' });
            return;
        }

        const validation = updateBoxEntrySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Invalid request body', errors: validation.error.issues });
            return;
        }

        const updatedEntry = await boxService.updateBoxEntry(pennkey, id, validation.data);

        if (!updatedEntry) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'Box entry not found' });
            return;
        }

        res.json(updatedEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update box entry' });
    }
};

export const deleteBoxEntry = async (req: Request, res: Response) => {
    try {
        const pennkey = req.user?.pennkey;
        const { id } = req.params;

        if (!pennkey) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        if (!id) {
            res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing ID' });
            return;
        }

        const exists = await boxService.getBoxEntry(pennkey, id);
        if (!exists) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'Box entry not found' });
            return;
        }

        await boxService.deleteBoxEntry(pennkey, id);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete box entry' });
    }
};

export const listBoxEntries = async (req: Request, res: Response) => {
    try {
        const pennkey = req.user?.pennkey;
        if (!pennkey) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }

        const ids = await boxService.listBoxEntries(pennkey);
        res.json(ids);
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to list box entries' });
    }
};

export const clearBoxEntries = async (req: Request, res: Response) => {
    try {
        const pennkey = req.user?.pennkey;
        if (!pennkey) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }

        await boxService.clearBoxEntries(pennkey);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to clear box entries' });
    }
};
