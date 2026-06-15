import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'cocktails' })
@Unique('q_unique_title', ['title'])
export class Cocktails {
  @ApiProperty({
    description: 'Auto-generated unique identifier.',
    example: 1,
    readOnly: true,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Display name of the cocktail. Must be unique.',
    maxLength: 100,
    example: 'Margarita',
  })
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @ApiProperty({
    description: 'Free-text description of the cocktail.',
    required: false,
    nullable: true,
    example: 'A refreshing blend of tequila, lime juice and orange liqueur.',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Type of glass the cocktail is served in.',
    required: false,
    nullable: true,
    example: 'Margarita glass',
  })
  @Column({ name: 'glasstype', type: 'text', nullable: true })
  glassType: string;

  @ApiProperty({
    description: 'Price of the cocktail.',
    type: Number,
    example: 9.5,
  })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  price: number;
}
