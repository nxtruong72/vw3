export class Accountant {
    id: string;
    bankerId: string;
    name: string;
    note: string;
    turnOver: number;
    gross_common: number;
    children: Map<string, Accountant>;

    constructor(id, json) {
        this.id = id;
        this.children = new Map();
        if (json != undefined) {
            this.name = json.acc_name;
            this.note = json.note;
        }
    }
}