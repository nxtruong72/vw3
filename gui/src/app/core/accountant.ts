export class Accountant {
    id: string;
    bankerId: string;
    name: string;
    note: any;
    isChecked: boolean = true;
    children: Map<string, Accountant>;
    // data
    sb: any;
    cf: any;
    loto: any;
    csn: any;

    constructor(id, json) {
        this.id = id;
        this.children = new Map();

        // check if it's accountant
        if (json.acc_name != undefined) {
            this.name = json.acc_name;
            this.note = json.note;
        } else {
            this.name = json.username;
            this.sb = json.data.sb;
            this.cf = json.data.cf;
            this.loto = json.data.loto;
            this.csn = json.data.csn;
        }
    }
}