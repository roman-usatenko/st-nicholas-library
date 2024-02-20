export interface Book {
    id: number;
    description: string;
    shelf: number;
    comment?: string;
    dueDate?: number;
}

export interface User {
    id: string;
    name: string;
}

export interface Library {
    user?: User;
    books?: Book[];
}

