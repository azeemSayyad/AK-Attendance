import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Client } from "./Client";

@Entity("project_expenses")
export class ProjectExpense {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "client_id" })
    clientId!: number;

    @Column({ type: "date" })
    date!: string;

    @Column()
    name!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @ManyToOne(() => Client, { onDelete: "CASCADE" })
    @JoinColumn({ name: "client_id" })
    client!: Client;
}
