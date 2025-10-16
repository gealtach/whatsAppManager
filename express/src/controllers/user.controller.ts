import { RequestHandler } from 'express';
import { CoreService } from '../services/coreService';

const coreService = CoreService.getInstance();

export const user: RequestHandler = async (req, res) => {
    try {
        const userId = req.user!.userId;

        // Consultar directamente al core
        const user = await coreService.getUser(userId);

        if (!user) {
            res.status(404).json({ message: 'Utilizador não encontrado' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};