import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("tenants")
export class Tenant {
    @PrimaryGeneratedColumn()
    id!: number;

    // Business / owner display name (e.g. "Akram Pasha")
    @Column({ length: 40 })
    name!: string;

    // 4-digit admin PIN for this tenant's owner. Globally unique across the app.
    @Column({ name: "admin_pin", length: 4 })
    adminPin!: string;

    // "active" | "suspended"
    @Column({ default: "active" })
    status!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
