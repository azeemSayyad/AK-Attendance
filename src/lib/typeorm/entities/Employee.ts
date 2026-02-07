import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Attendance } from "./Attendance";
import { Advance } from "./Advance";

@Entity("employees")
export class Employee {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, length: 15 })
    name!: string;

    @Column({ name: "daily_wage", type: "decimal", precision: 10, scale: 2 })
    dailyWage!: number;

    @Column({ nullable: true })
    phone?: string;

    @Column({ name: "previous_advance", type: "decimal", precision: 10, scale: 2, default: 0 })
    previousAdvance!: number;

    @Column({ default: "active" })
    status!: string;

    @Column({ length: 4, nullable: true })
    pin?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @OneToMany(() => Attendance, (attendance) => attendance.employee)
    attendances!: Attendance[];

    @OneToMany(() => Advance, (advance) => advance.employee)
    advances!: Advance[];
}
