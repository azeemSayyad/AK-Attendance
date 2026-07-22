import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("common_expenses")
export class CommonExpense {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "tenant_id", nullable: true })
    tenantId?: number;

    @Column()
    name!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;
}
