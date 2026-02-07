import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Employee } from "./Employee";

@Entity("monthly_advances")
@Unique(["employeeId", "year", "month"])
export class MonthlyAdvance {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "employee_id" })
    employeeId!: number;

    @Column()
    year!: number;

    @Column()
    month!: number; // 0-11

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    amount!: number;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;
}
