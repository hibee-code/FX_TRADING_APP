import { User } from '../../user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';


export enum TransactionType {
  FUNDING = 'funding',
  CONVERSION = 'conversion',
  TRADE = 'trade',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ nullable: true })
  sourceCurrency: string;

  @Column('decimal', { precision: 18, scale: 6, default: 0 })
  sourceAmount: number;

  @Column({ nullable: true })
  targetCurrency: string;

  @Column('decimal', { precision: 18, scale: 6, default: 0 })
  targetAmount: number;

  @Column('decimal', { precision: 18, scale: 6, nullable: true })
  rate: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  reference: string;

  @CreateDateColumn()
  timestamp: Date;

  //relationship

  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn()
  user: User;
}