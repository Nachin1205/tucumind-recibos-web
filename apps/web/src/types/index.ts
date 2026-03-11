export interface User {
    username: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface Client {
    id: number;
    name: string;
    cuit: string;
    address?: string;
    iva_type?: string;
    city?: string;
}

export enum PaymentType {
    CASH = 'CASH',
    CHEQUE = 'CHEQUE',
    TRANSFER = 'TRANSFER',
}

export interface ReceiptPayment {
    id: number;
    type: PaymentType;
    amount: number;
    ref_number?: string;
    bank?: string;
    payment_date: string;
}

export interface Receipt {
    id: number;
    receipt_number: number;
    issue_date: string;
    client_snapshot: any;
    concept?: string;
    subtotal: number;
    withholding_iibb: number;
    withholding_ganancias: number;
    withholding_suss: number;
    withholding_tem: number;
    total: number;
    canceled_at?: string;
    payments: ReceiptPayment[];
}
