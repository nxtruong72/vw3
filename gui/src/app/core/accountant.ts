export class Accountant {
  // init data
  id: string = "";
  banker: string = "";
  acc_name: string = "";
  note: string = "";

  // scanned data
  level: number = 0;
  username: string = "";
  data: [];
  child: Accountant[] = [];
  reportAccountant: [];

  isChecked: boolean = true;

  constructor(input) {
    if (input) {
      let json = JSON.parse(JSON.stringify(input));
      this.id = (json.id ? json.id : this.id);
      this.banker = (json.banker ? json.banker : this.banker);
      this.acc_name = (json.acc_name ? json.acc_name : this.acc_name);
      this.note = (json.note ? json.note : this.note);
      this.level = (json.level ? json.level : this.level);
      this.username = (json.username ? json.username : this.username);
      this.data = json.data;
      if (json.child && json.child.length > 0) {
        this.child = [];
        json.child.forEach(e => {
          let acc: Accountant = new Accountant(e);
          this.child.push(acc);
        });
      }
      this.reportAccountant = json.reportAccountant;
    }
  }

  updateScanData(input): string[] {
    let members: string[] = [];
    if (input) {
      let json = JSON.parse(JSON.stringify(input));
      this.level = json.level;
      this.username = json.username;
      this.data = json.data;
      if (json.child && json.child.length > 0) {
        members.push(this.username);
        json.child.forEach(e => {          
          let tmpChild = this.findChild(e.username);
          if (!tmpChild) {
            let acc: Accountant = new Accountant(e);
            this.child.push(acc);
          } else {
            let tmpMembers = tmpChild.updateScanData(e);
            tmpMembers.forEach(m => {
              members.push(m);
            })
          }
        });
      }
      this.reportAccountant = json.reportAccountant;
    }
    return members;
  }

  findChild(name): Accountant {
    let result: Accountant = undefined;
    this.child.forEach(e => {
      if (e.username === name) {
        result = e;
        return;
      }
    });
    return result;
  }
}