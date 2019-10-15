import { Accountant } from "./accountant";

export class Banker {
    id: string;
    name: string;
    children: Map<string, Accountant> = new Map();
}