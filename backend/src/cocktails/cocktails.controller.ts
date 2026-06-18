import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Cocktails } from './cocktails.entity';
import { CocktailsService } from './cocktails.service';

@ApiTags('cocktails')
@Controller('cocktails')
export class CocktailsController {
  constructor(private readonly cocktailsService: CocktailsService) {}

  @Get()
  @ApiOperation({
    summary: 'Search cocktails',
    description:
      'Returns all cocktails, or — when "q" is provided — the best fuzzy, ' +
      'typo-tolerant matches across title, description and glass type, ranked ' +
      'by relevance.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Fuzzy search term matched against title, description and glass type.',
    example: 'mojto',
  })
  @ApiOkResponse({
    description: 'The matching cocktails.',
    type: Cocktails,
    isArray: true,
  })
  searchCocktails(@Query('q') q?: string): Promise<Cocktails[]> {
    return this.cocktailsService.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cocktail by id' })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the cocktail.',
    example: 1,
  })
  @ApiOkResponse({ description: 'The requested cocktail.', type: Cocktails })
  @ApiNotFoundResponse({ description: 'No cocktail exists with the given id.' })
  async getCocktail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cocktails> {
    return this.cocktailsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a cocktail' })
  @ApiCreatedResponse({
    description: 'The cocktail was created successfully.',
    type: Boolean,
  })
  @ApiConflictResponse({
    description: 'A cocktail with the same title already exists.',
  })
  async newCocktail(@Body() cocktail: Cocktails) {
    await this.cocktailsService.create(cocktail);
    return true;
  }
}
