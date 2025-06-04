import { UpdateDateColumn, VersionColumn, CreateDateColumn } from 'typeorm';

export class BaseTable {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
