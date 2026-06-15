import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CocktailsService } from './cocktails.service';
import { CocktailsController } from './cocktails.controller';
import { Cocktails } from './cocktails.entity';
import { SearchModule } from '../search.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cocktails]), SearchModule],
  providers: [CocktailsService],
  controllers: [CocktailsController],
})
export class CocktailsModule {}
