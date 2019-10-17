import { Accountant } from "./accountant";

export class Banker {
    id: string;
    name: string;
    isChecked: boolean = true;
    children: Map<string, Accountant> = new Map();
}