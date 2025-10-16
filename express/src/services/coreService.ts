// services/coreService.ts
interface CoreUser {
    id: string;
    createdAt: string;
    updatedAt: string;
    email: string;
    name: string;
    lastname: string;
    role: number;
    department?: string;
}

export class CoreService {
    private static instance: CoreService;

    static getInstance(): CoreService {
        if (!CoreService.instance) {
            CoreService.instance = new CoreService();
        }
        return CoreService.instance;
    }

    async getUser(userId: string): Promise<CoreUser | null> {
        try {
            const response = await fetch(`${process.env.CORE_URL}/user/userExternal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.CORE_KEY!,
                },
                body: JSON.stringify({
                    where: process.env.WHERE,
                    userId: userId
                }),
            });

            if (!response.ok) {
                console.error(`Core service error: ${response.status}`);
                return null;
            }
            return await response.json();

        } catch (error) {
            console.error('Error fetching user from core:', error);
            return null;
        }
    }

    async logoutUser(userId: string): Promise<boolean> {
        try {
            const response = await fetch(`${process.env.CORE_URL}/login/logoutExternal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.CORE_KEY!,
                },
                body: JSON.stringify({
                    where: process.env.WHERE,
                    userId: userId,
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error logging out from core:', error);
            return false;
        }
    }
}