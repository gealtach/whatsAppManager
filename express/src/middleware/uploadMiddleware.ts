import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Configuración de multer para almacenar archivos temporalmente
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');

        // Crear directorio si no existe usando then/catch en lugar de async/await
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => {
                cb(null, uploadDir);
            })
            .catch((error) => {
                cb(error, uploadDir);
            });
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'video/mp4',
            'video/x-msvideo',
            'video/quicktime',
            'video/webm'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

// Middleware de multer para manejo de archivo único
export const uploadMiddleware = upload.single('file');

// Función para mover el archivo a su ubicación final
export const moveFileToFinalDestination = async (
    tempPath: string,
    accountId: string,
    filename: string
): Promise<string> => {
    const finalDir = path.join(process.cwd(), 'uploads', 'broadcasts', accountId);
    await fs.mkdir(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, filename);
    await fs.rename(tempPath, finalPath);

    // Retornar URL relativa o absoluta según tu configuración
    return `/uploads/broadcasts/${accountId}/${filename}`;
};