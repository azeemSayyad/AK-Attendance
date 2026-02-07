import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import type { Attendance } from "./Attendance";
import type { Advance } from "./Advance";

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

    @OneToMany(() => require("./Attendance").Attendance, (attendance: Attendance) => attendance.employee)
    attendances!: Attendance[];

    @OneToMany(() => require("./Advance").Advance, (advance: Advance) => advance.employee)
    advances!: Advance[];
}
