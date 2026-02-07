import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";

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

    @OneToMany("WorkAssignment", "client")
    workAssignments!: any[];

    @OneToMany("MoneyTaken", "client")
    moneyTaken!: any[];
}
