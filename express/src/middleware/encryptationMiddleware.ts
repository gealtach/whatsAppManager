import { Prisma } from '../generated/prisma';
import { encryptionService } from '../services/encryptionService';

// Define qué campos encriptar por cada modelo
const ENCRYPTED_FIELDS: Readonly<Record<string, ReadonlyArray<string>>> = {
    Account: ['name', 'phone', 'apiKey', 'wabaId', 'verifiedName'],
    Client: ['name', 'phone', 'email', 'notes'],
    Broadcast: ['templateName', 'templateParams'],
    BroadcastRecipient: ['errorMessage'],
};

// Tipos para valores que pueden ser encriptados
type EncryptablePrimitive = string | number | boolean | null;
type EncryptableValue = EncryptablePrimitive | Record<string, unknown> | unknown[];
type EncryptableData = Record<string, EncryptableValue>;

// Type guards para verificar tipos
function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isEncryptableData(value: unknown): value is EncryptableData {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Encripta los campos sensibles de un objeto
 */
function encryptFields<T extends EncryptableData>(model: string, data: T): T {
    const fieldsToEncrypt = ENCRYPTED_FIELDS[model];
    if (!fieldsToEncrypt || !data) return data;

    // Crear una copia mutable del objeto
    const result: EncryptableData = { ...data };

    for (const field of fieldsToEncrypt) {
        const value = result[field];
        if (value == null) continue;

        if (isString(value)) {
            if (!encryptionService.isEncrypted(value)) {
                result[field] = encryptionService.encrypt(value);
            }
        } else if (isObject(value) || Array.isArray(value)) {
            result[field] = encryptionService.encrypt(JSON.stringify(value));
        }
    }

    return result as T;
}

/**
 * Desencripta los campos sensibles de un objeto
 */
function decryptFields<T extends EncryptableData>(model: string, data: T): T {
    const fieldsToEncrypt = ENCRYPTED_FIELDS[model];
    if (!fieldsToEncrypt || !data) return data;

    // Crear una copia mutable del objeto
    const result: EncryptableData = { ...data };

    for (const field of fieldsToEncrypt) {
        const value = result[field];
        if (!isString(value)) continue;

        if (encryptionService.isEncrypted(value)) {
            try {
                const decrypted = encryptionService.decrypt(value);

                // Intentar parsear JSON si es necesario (para templateParams)
                try {
                    result[field] = JSON.parse(decrypted);
                } catch {
                    result[field] = decrypted;
                }
            } catch (error) {
                console.error(`Failed to decrypt ${model}.${field}:`, error);
            }
        }
    }

    return result as T;
}

/**
 * Procesa arrays de datos
 */
function processArray<T extends EncryptableData>(
    model: string,
    data: T[],
    processor: (model: string, item: T) => T
): T[] {
    return data.map(item => processor(model, item));
}

// Tipos para los argumentos de Prisma con genéricos
type PrismaOperationArgs = {
    data?: unknown;
    create?: unknown;
    update?: unknown;
    [key: string]: unknown;
};

type PrismaQuery = (args: unknown) => Promise<unknown>;

// Tipo para el contexto de la query
type QueryContext = {
    args: PrismaOperationArgs;
    query: PrismaQuery;
    model: string;
};

/**
 * Procesa datos de entrada para operaciones que reciben un solo objeto
 */
function processInputData<T extends EncryptableData>(model: string, data: unknown): T {
    if (!isEncryptableData(data)) {
        return data as T;
    }
    return encryptFields(model, data as T);
}

/**
 * Procesa datos de salida para operaciones que devuelven un solo objeto
 */
function processOutputData<T extends EncryptableData>(model: string, data: unknown): T {
    if (!isEncryptableData(data)) {
        return data as T;
    }
    return decryptFields(model, data as T);
}

/**
 * Procesa datos de entrada para operaciones que reciben arrays
 */
function processInputArray<T extends EncryptableData>(model: string, data: unknown): T[] {
    if (!Array.isArray(data)) {
        const processed = processInputData(model, data);
        return [processed] as T[];
    }
    return processArray(model, data as T[], encryptFields);
}

/**
 * Procesa datos de salida para operaciones que devuelven arrays
 */
function processOutputArray<T extends EncryptableData>(model: string, data: unknown): T[] {
    if (!Array.isArray(data)) {
        const processed = processOutputData(model, data);
        return [processed] as T[];
    }
    return processArray(model, data as T[], decryptFields);
}

/**
 * Extensión de Prisma para encriptación automática
 */
export const encryptionExtension = Prisma.defineExtension({
    name: 'encryption',
    query: {
        $allModels: {
            async create({ args, query, model }: QueryContext) {
                const shouldEncrypt = ENCRYPTED_FIELDS[model];

                if (shouldEncrypt && args.data) {
                    args.data = processInputData(model, args.data);
                }

                const result = await query(args);

                if (shouldEncrypt && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async createMany({ args, query, model }: QueryContext) {
                if (ENCRYPTED_FIELDS[model] && args.data) {
                    args.data = processInputArray(model, args.data);
                }
                return query(args);
            },

            async update({ args, query, model }: QueryContext) {
                const shouldEncrypt = ENCRYPTED_FIELDS[model];

                if (shouldEncrypt && args.data) {
                    args.data = processInputData(model, args.data);
                }

                const result = await query(args);

                if (shouldEncrypt && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async updateMany({ args, query, model }: QueryContext) {
                if (ENCRYPTED_FIELDS[model] && args.data) {
                    args.data = processInputData(model, args.data);
                }
                return query(args);
            },

            async upsert({ args, query, model }: QueryContext) {
                const shouldEncrypt = ENCRYPTED_FIELDS[model];

                if (shouldEncrypt) {
                    if (args.create) {
                        args.create = processInputData(model, args.create);
                    }
                    if (args.update) {
                        args.update = processInputData(model, args.update);
                    }
                }

                const result = await query(args);

                if (shouldEncrypt && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async findUnique({ args, query, model }: QueryContext) {
                const result = await query(args);

                if (ENCRYPTED_FIELDS[model] && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async findUniqueOrThrow({ args, query, model }: QueryContext) {
                const result = await query(args);

                if (ENCRYPTED_FIELDS[model] && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async findFirst({ args, query, model }: QueryContext) {
                const result = await query(args);

                if (ENCRYPTED_FIELDS[model] && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async findFirstOrThrow({ args, query, model }: QueryContext) {
                const result = await query(args);

                if (ENCRYPTED_FIELDS[model] && result) {
                    return processOutputData(model, result);
                }

                return result;
            },

            async findMany({ args, query, model }: QueryContext) {
                const result = await query(args);

                if (ENCRYPTED_FIELDS[model] && Array.isArray(result)) {
                    return processOutputArray(model, result);
                }

                return result;
            },
        },
    },
});