import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { Cocktails } from '../src/cocktails/cocktails.entity';
import { CocktailsModule } from '../src/cocktails/cocktails.module';
import { ElasticSearch } from '../src/elasticsearch.service';

// Stubbing Elasticsearch for simplicity.
const elasticStub = {
  bulkIndex: jest.fn().mockResolvedValue(undefined),
  indexCocktail: jest.fn().mockResolvedValue(undefined),
  searchCocktails: jest.fn().mockResolvedValue([]),
};

describe('Cocktails API (integration)', () => {
  let app: INestApplication;
  let repo: Repository<Cocktails>;

  beforeAll(async () => {
    // Using an in memory database for simplicity.
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          dropSchema: true,
          synchronize: true,
          entities: [Cocktails],
        }),
        CocktailsModule,
      ],
    })
      .overrideProvider(ElasticSearch)
      .useValue(elasticStub)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    repo = app.get(getRepositoryToken(Cocktails));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await repo.clear();
    await repo.save([
      { title: 'Virgin Mojito', description: 'Description for Virgin Mojito', glassType: 'Highball', price: 4.50 },
      { title: 'Shirley Temple', description: 'Description for Shirley Temple', glassType: 'Highball', price: 3.75 },
    ]);
  });

  it('GET /cocktails returns all cocktails', async () => {
    const res = await request(app.getHttpServer()).get('/cocktails').expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.map((c: Cocktails) => c.title)).toEqual(
      expect.arrayContaining(['Virgin Mojito', 'Shirley Temple']),
    );
  });

  it('GET /cocktails/:id returns a single cocktail', async () => {
    const [seeded] = await repo.find();

    const res = await request(app.getHttpServer())
      .get(`/cocktails/${seeded.id}`)
      .expect(200);

    expect(res.body.id).toBe(seeded.id);
    expect(res.body.title).toBe(seeded.title);
  });

  it('GET /cocktails/:id returns 404 for an unknown id', async () => {
    await request(app.getHttpServer()).get('/cocktails/999999').expect(404);
  });

  it('GET /cocktails/:id returns 400 for a non-numeric id', async () => {
    await request(app.getHttpServer()).get('/cocktails/not-a-number').expect(400);
  });

  it('POST /cocktails creates a cocktail that is then retrievable', async () => {
    const newCocktail = {
      title: 'Cinderella',
      description: 'Description for Cinderella',
      glassType: 'Margarita',
      price: 4.00,
    };

    await request(app.getHttpServer())
        .post('/cocktails')
        .send(newCocktail)
        .expect(201);

    const res = await request(app.getHttpServer()).get('/cocktails').expect(200);
    expect(res.body.map((c: Cocktails) => c.title)).toContain('Cinderella');
  });

  it('POST /cocktails creates a cocktail and gets an error when duplicate', async () => {
    const newCocktail = {
      title: 'Virgin Mojito',
      description: 'Description for Virgin Mojito',
      glassType: 'Highball',
      price: 4.50,
    };

    await request(app.getHttpServer())
        .post('/cocktails')
        .send(newCocktail)
        .expect(500);

  });
});
