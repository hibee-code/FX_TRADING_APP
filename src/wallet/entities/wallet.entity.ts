import { User } from "../../user/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";


export enum Currency {
    USD = 'USD',
    GBP = 'GBP',
    EUR = 'EUR',
  }


@Entity()
export class Wallet {
  @PrimaryGeneratedColumn({ type: 'bigint'})
  id: string;

  @Column({
    type: 'enum',
    enum: Currency,
  })
  currency: Currency;

  @Column('decimal', { precision: 18, scale: 6, default: 0 })
  balance: number;

  @CreateDateColumn({type: 'timestamp'})
  createdAt: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updatedAt: Date;


  //relation

  @ManyToOne(() => User, user => user.wallets)
  @JoinColumn()
  user: User;
}