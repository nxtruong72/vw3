export class Accountant {
  id: string;
  bankerId: string;
  name: string;
  note: any;
  isChecked: boolean = true;
  children: Map<string, Accountant>;
  data: any;
  level: number;
  username: string;
  reportAccountant: any;

  constructor(id, json) {
    this.id = id;
    this.children = new Map();

    if (json) {
      let data = JSON.parse(JSON.stringify(json));
      // check if it's accountant
      if (data.acc_name != undefined) {
        this.bankerId = data.banker;
        this.name = data.acc_name;
        this.note = data.note;
      } else {
        this.name = data.username;
        this.data = data.data;
        this.level = data.level;
        this.reportAccountant = data.reportAccountant;
      }
    }
  }
}