export interface UserProfile {
    email: string | null;
    createdAt: string;
    balance: number;
    settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
}
