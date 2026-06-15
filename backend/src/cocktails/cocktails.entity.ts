import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'cocktails' })
@Unique('q_unique_title', ['title'])
export class Cocktails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'glasstype', type: 'text', nullable: true })
  glassType: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  price: number;
}
