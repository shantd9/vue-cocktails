import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Cocktails } from './cocktails.entity';
import { ElasticSearch } from '../elasticsearch.service';

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
          'Elasticsearch query failed; getting all from the db.',
          err,
        );
        return this.usersRepository
          .createQueryBuilder('c')
          .where('LOWER(c.title) LIKE LOWER(:q)', { q: `%${q}%` })
          .orWhere('LOWER(c.description) LIKE LOWER(:q)', { q: `%${q}%` })
          .getMany();
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
      //indexing the new cocktail so we can use it in the search immediately without restarting
      const id = result.identifiers[0]?.id;
      await this.search.indexCocktail({ ...cocktail, id });
      return result;
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException(
          `A cocktail named "${cocktail.title}" already exists`,
        );
      }
      throw err;
    }
  }

  //works for both postgres and the in memory sqlite. in production, I'd use a more robust solution
  private isUniqueViolation(err: unknown): boolean {
    return err instanceof QueryFailedError && /unique/i.test(err.message);
  }
}
