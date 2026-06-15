import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client as EsClient } from '@elastic/elasticsearch';
import { Cocktails } from './cocktails/cocktails.entity';

const INDEX = 'cocktails';

@Injectable()
export class ElasticSearch implements OnModuleInit {
  private readonly logger = new Logger(ElasticSearch.name);
  private client: EsClient;

  constructor() {
    this.client = new EsClient({
      node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    await this.checkConnection();
    await this.ensureIndex();
  }

  async checkConnection() {
    try {
      const isAlive = await this.client.ping();
      this.logger.log(`Elasticsearch cluster is up and running: ${isAlive}`);
    } catch (error) {
      this.logger.error('Elasticsearch cluster is down!', error);
    }
  }

  async ensureIndex() {
    const exists = await this.client.indices.exists({ index: INDEX });
    if (exists) return;

    await this.client.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          id: { type: 'integer' },
          title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          description: { type: 'text' },
          glassType: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          price: { type: 'float' },
        },
      },
    });
    this.logger.log(`Created Elasticsearch index "${INDEX}"`);
  }

  // Upsert a single cocktail. Using the row id as the ES _id makes this
  // idempotent, so re-indexing the same cocktail overwrites rather than dupes.
  async indexCocktail(cocktail: Cocktails) {
    await this.client.index({
      index: INDEX,
      id: String(cocktail.id),
      document: cocktail,
      refresh: true,
    });
  }

  // Bulk upsert, used to seed the index from Postgres on startup.
  async bulkIndex(cocktails: Cocktails[]) {
    if (cocktails.length === 0) return;

    const operations = cocktails.flatMap((c) => [
      { index: { _index: INDEX, _id: String(c.id) } },
      c,
    ]);

    const result = await this.client.bulk({ operations, refresh: true });
    if (result.errors) {
      this.logger.error('Bulk indexing into Elasticsearch reported errors');
    } else {
      this.logger.log(`Indexed ${cocktails.length} cocktails into "${INDEX}"`);
    }
  }

  // Fuzzy, typo-tolerant, multi-field search ranked by relevance.
  // - fuzziness AUTO allows ~1-2 character edits depending on term length
  // - title^3 boosts name matches above description/glass-type matches
  async searchCocktails(q: string): Promise<Cocktails[]> {
    const result = await this.client.search<Cocktails>({
      index: INDEX,
      query: {
        multi_match: {
          query: q,
          fields: ['title^3', 'description', 'glassType'],
          fuzziness: 'AUTO',
          prefix_length: 1,
        },
      },
    });

    return result.hits.hits.map((hit) => hit._source as Cocktails);
  }
}
