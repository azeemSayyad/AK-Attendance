import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("system_settings")
export class SystemSettings {
    @PrimaryColumn()
    key!: string;

    @Column()
    value!: string;
}
