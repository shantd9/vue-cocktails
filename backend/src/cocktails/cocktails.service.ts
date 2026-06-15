import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { DatabaseError } from 'pg';
import { Cocktails } from './cocktails.entity';
import { ElasticSearch } from '../elasticsearch.service';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class CocktailsService implements OnModuleInit {
  private readonly logger = new Logger(CocktailsService.name);

  constructor(
    @InjectRepository(Cocktails)
    private usersRepository: Repository<Cocktails>,
    private readonly search: ElasticSearch,
  ) {}

  async onModuleInit() {
    try {
      const all = await this.usersRepository.find();
      await this.search.bulkIndex(all);
    } catch (err) {
      this.logger.error('Failed to seed Elasticsearch index on startup', err);
    }
  }

  async findAll(q?: string): Promise<Cocktails[]> {
    if (q) {
      try {
        return await this.search.searchCocktails(q);
      } catch (err) {
        this.logger.error(
          'Elasticsearch query failed; falling back to a DB substring search',
          err,
        );
        return this.usersRepository.find({
          where: [{ title: ILike(`%${q}%`) }, { description: ILike(`%${q}%`) }],
        });
      }
    }

    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<Cocktails | null> {
    const cocktail = await this.usersRepository.findOneBy({ id });

    if (!cocktail) {
      throw new NotFoundException(`Cocktail with id ${id} was not found`);
    }

    return cocktail;
  }

  async create(cocktail: Cocktails) {
    try {
      const result = await this.usersRepository.insert(cocktail);
      // Index the new cocktail immediately so it's searchable without a restart.
      const id = result.identifiers[0]?.id;
      await this.search.indexCocktail({ ...cocktail, id });
      return result;
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
