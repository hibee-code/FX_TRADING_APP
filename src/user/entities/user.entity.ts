import { Transaction } from "../../transaction/entities/transaction.entity";
import { Wallet } from "../../wallet/entities/wallet.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "../enum/user.enum";

@Entity()
export class User {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: string;

  @Column({ type : 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar'})
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationToken: string;

  @Column({  type: 'timestamp', nullable: true })
  verificationTokenExpiry: Date;

  @CreateDateColumn({type: 'timestamp'})
  createdAt: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updatedAt: Date;


        //relationship

  @OneToMany(() => Wallet, wallet => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions: Transaction[];
}