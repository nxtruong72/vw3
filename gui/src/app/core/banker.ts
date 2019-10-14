import { Accountant } from "./accountant";

export class Banker {
    id: string;
    name: string;
    children: Array<Accountant> = [];
}