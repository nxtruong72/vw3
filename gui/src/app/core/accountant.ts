export class Accountant {
    id: string;
    bankerId: string;
    name: string;
    note: any;
    isChecked: boolean = true;
    children: Map<string, Accountant>;
    data: any;
    level: number;

    constructor(id, json) {
        this.id = id;
        this.children = new Map();

        // check if it's accountant
        if (json.acc_name != undefined) {
            this.bankerId = json.banker;
            this.name = json.acc_name;
            this.note = json.note;
        } else {
            this.name = json.username;
            this.data = json.data;
            this.level = json.level;
        }
    }
}