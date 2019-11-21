import { Accountant } from "./accountant";

export class Banker {
    id: string;
    name: string;
    isChecked: boolean;
    book_name: string;
    total_account: number;
    child: Map<string, Accountant>;
    data: any;

    constructor(json) {
        this.id = json.id;
        this.name = json.name;
        this.book_name = json.book_name;
        this.total_account = json.total_account;
        this.isChecked = true;
        this.child = new Map();
    }
}