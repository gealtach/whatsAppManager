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
    templateName: string;
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


export interface MessageTemplate {
    name: string;
    language: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'IN_APPEAL' | 'PAUSED' | 'DISABLED';
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'TRANSACTIONAL';
    sub_category?: string;
    id: string;
    parameter_format: 'POSITIONAL' | 'NAMED';
    components?: Array<
        HeaderComponent |
        BodyComponent |
        FooterComponent |
        ButtonsComponent
    >;
}

export interface HeaderComponent {
    type: 'HEADER';
    format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
    text: string;
    example?: {
        header_handle?: string[];
        header_text?: string[];
    };
}

export interface BodyComponent {
    type: 'BODY';
    text: string;
    example?: {
        body_text?: string[][];
        body_text_named_params?: Array<{
            param_name: string;
            example: string;
        }>;
    };
}

export interface FooterComponent {
    type: 'FOOTER';
    text: string;
}

export interface ButtonsComponent {
    type: 'BUTTONS';
    buttons: Array<
        QuickReplyButton |
        UrlButton |
        CopyCodeButton |
        PhoneNumberButton
    >;
}

export interface QuickReplyButton {
    type: 'QUICK_REPLY';
    text: string;
}

export interface UrlButton {
    type: 'URL';
    text: string;
    url: string;
}

export interface CopyCodeButton {
    type: 'COPY_CODE';
    text: string;
    example?: string[];
}

export interface PhoneNumberButton {
    type: 'PHONE_NUMBER';
    text: string;
    phone_number: string;
}

// Interfaces para parámetros (si los necesitas para enviar mensajes)
export interface TemplateParameter {
    type: 'text' | 'image' | 'video' | 'document' | 'location' | 'currency' | 'date_time';
    text?: string;
    image?: {
        link: string;
    };
    video?: {
        link: string;
    };
    document?: {
        link: string;
    };
    location?: {
        latitude: string;
        longitude: string;
        name?: string;
        address?: string;
    };
    currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
    };
    date_time?: {
        fallback_value: string;
    };
}

export interface TemplateComponentWithParameters {
    type: 'header' | 'body' | 'button';
    parameters: TemplateParameter[];
}