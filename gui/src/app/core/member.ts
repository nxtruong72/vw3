export class Member {
    id: string;
    parent_id: string;
    fullName: string;
    username: string;
    status: string;

    constructor(json) {
        this.id = json.id;
        this.parent_id = json.parent_id;
        this.fullName = json.fullname;
        this.username = json.username;
        if (json.status == 1) {
            this.status = 'on';
        } else {
            this.status = 'off';
        }
    }
}