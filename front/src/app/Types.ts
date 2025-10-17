type BroadcastStatus = 'PENDING' | 'SENDING' | 'COMPLETED' | 'FAILED';
type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Account {
    id: string
    name: string
    phone: string
    apiKey: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    accountUsers: AccountUser[]
    clients: Client[]
    broadcasts: Broadcast[]
};

export interface AccountUser {
    id: string;
    userId: string;
    createdAt: Date;
    accountId: string;
    account: Account;
};

export interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    notes: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    accountId: string;
    account: Account;
    broadcastRecipients: BroadcastRecipient[];
};

export interface Broadcast {
    id: string;
    name: string;
    message: string;
    complement: string;
    status: BroadcastStatus;
    scheduledAt: Date;
    sentAt: Date;
    createdAt: Date;
    updatedAt: Date;
    accountId: string;
    account: Account;
    recipients: BroadcastRecipient[];
};

export interface BroadcastRecipient {
    id: string;
    status: MessageStatus;
    sentAt: Date;
    errorMessage: string;
    broadcastId: string;
    broadcast: Broadcast;
    clientId: string;
    client: Client;
};

export interface User {
    id: string;
    createdAt: string;
    updatedAt: string;
    email: string;
    name: string;
    lastname: string;
    role: number;
};