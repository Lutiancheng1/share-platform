import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['text', 'link', 'image', 'file'],
    default: 'text',
  })
  type: 'text' | 'link' | 'image' | 'file';

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userIp: string;
}
