export class Accountant {
    id: string;
    bankerId: string;
    name: string;
    note: any;
    turnOver: number = -1;
    gross_common: number = -1;
    isChecked: boolean = true;
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