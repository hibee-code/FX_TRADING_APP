import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class FxRate {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: string;

  @Column({ type: 'varchar', length: 3 })
  baseCurrency: string;
  
  @Column({ type: 'varchar', length: 3 })
  quoteCurrency: string;

  @Column('decimal', { precision: 18, scale: 6 })
  rate: number;

  @CreateDateColumn()
  timestamp: Date;
}