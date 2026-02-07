import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee";

@Entity("attendance")
export class Attendance {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "employee_id" })
    employeeId!: number;

    @Column({ type: "date" })
    date!: string;

    @Column({ type: "decimal", precision: 3, scale: 1, default: 1.0 })
    multiplier!: number;

    @Column({ default: true })
    present!: boolean;

    @ManyToOne(() => Employee, (employee) => employee.attendances)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;
}
