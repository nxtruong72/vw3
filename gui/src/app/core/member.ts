export class Member {
    id: string;
    name: string;
    bankerId: string;
    bankerName: string;
    subUser: string;
    isActive: boolean;
    child: Member[] = [];

    constructor(json) {
        this.id = json.id;
        this.name = json.acc_name;
        this.bankerId = json.banker;
        this.bankerName = json.banker_name;
        this.subUser = json.sub_user;
        this.isActive = json.is_active;
        if (json.child) {
            json.child.forEach(element => {
                let tmp = new Member(element);
                this.child.push(tmp);
            });
        }
    }
}