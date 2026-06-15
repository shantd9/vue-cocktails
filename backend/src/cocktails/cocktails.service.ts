import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { DatabaseError } from 'pg';
import { Cocktails } from './cocktails.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class CocktailsService {
  constructor(
    @InjectRepository(Cocktails)
    private usersRepository: Repository<Cocktails>,
  ) {}

  findAll(description?: string): Promise<Cocktails[]> {
    if (description) {
      return this.usersRepository.find({
        where: { description: ILike(`%${description}%`) },
      });
    }

    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<Cocktails | null> {
    const cocktail = await this.usersRepository.findOneBy({id});

    if (!cocktail) {
      throw new NotFoundException(`Cocktail with id ${id} was not found`);
    }

    return cocktail
  }

  async create(cocktail: Cocktails) {
    try {
      return await this.usersRepository.insert(cocktail);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err.driverError as DatabaseError).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `A cocktail named "${cocktail.title}" already exists`,
        );
      }

      throw err;
    }
  }

}
