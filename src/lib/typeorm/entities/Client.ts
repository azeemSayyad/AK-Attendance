import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { WorkAssignment } from "./WorkAssignment";
import { MoneyTaken } from "./MoneyTaken";

@Entity("clients")
export class Client {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 15 })
    name!: string;

    @Column({ length: 15 })
    location!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => WorkAssignment, (workAssignment) => workAssignment.client)
    workAssignments!: WorkAssignment[];

    @OneToMany(() => MoneyTaken, (moneyTaken) => moneyTaken.client)
    moneyTaken!: MoneyTaken[];
}
