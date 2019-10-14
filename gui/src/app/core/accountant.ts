import { Account } from "./account";

export class Accountant {
    id: string;
    bankerId: string;
    name: string;
    note: string;
    tunerOver: number;
    gross_common: number;
    children: Array<Account> = [];
}