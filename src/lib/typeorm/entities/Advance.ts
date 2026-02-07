import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee";

@Entity("advances")
export class Advance {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "employee_id" })
    employeeId!: number;

    @Column({ type: "date" })
    date!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @Column({ nullable: true })
    note?: string;

    @ManyToOne(() => Employee, (employee) => employee.advances)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;
}
