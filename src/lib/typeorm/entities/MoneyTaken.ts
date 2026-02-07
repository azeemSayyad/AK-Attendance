import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Client } from "./Client";

@Entity("money_taken")
export class MoneyTaken {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "date" })
    date!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @ManyToOne(() => Client, (client) => client.moneyTaken, { onDelete: "CASCADE" })
    @JoinColumn({ name: "client_id" })
    client!: Client;

    @Column({ name: "client_id" })
    clientId!: number;
}
