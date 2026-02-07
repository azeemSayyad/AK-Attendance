import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee";
import { Client } from "./Client";

@Entity("work_assignments")
export class WorkAssignment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "date" })
    date!: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;

    @Column({ name: "employee_id" })
    employeeId!: number;

    @ManyToOne(() => Client, (client) => client.workAssignments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "client_id" })
    client!: Client;

    @Column({ name: "client_id" })
    clientId!: number;
}
