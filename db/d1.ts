import { env } from 'cloudflare:workers';

import {
  neon,
  type FullQueryResults,
  type NeonQueryFunction,
} from '@neondatabase/serverless';

type Row = Record<string, unknown>;

export type DatabaseResult<T = Row> = {
  results: T[];
  success: true;
  meta: { changes: number };
};

export interface DatabaseStatement {
  bind(...values: unknown[]): DatabaseStatement;
  first<T = Row>(): Promise<T | null>;
  all<T = Row>(): Promise<DatabaseResult<T>>;
  run<T = Row>(): Promise<DatabaseResult<T>>;
}

export interface DatabaseBinding {
  prepare(query: string): DatabaseStatement;
  batch(statements: DatabaseStatement[]): Promise<DatabaseResult[]>;
}

type NeonClient = NeonQueryFunction<false, true>;

function postgresQuery(query: string) {
  let parameter = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  let output = '';

  for (let index = 0; index < query.length; index += 1) {
    const character = query[index];
    const next = query[index + 1];

    if (character === "'" && !doubleQuoted) {
      output += character;
      if (singleQuoted && next === "'") {
        output += next;
        index += 1;
      } else {
        singleQuoted = !singleQuoted;
      }
      continue;
    }
    if (character === '"' && !singleQuoted) {
      output += character;
      if (doubleQuoted && next === '"') {
        output += next;
        index += 1;
      } else {
        doubleQuoted = !doubleQuoted;
      }
      continue;
    }
    if (character === '?' && !singleQuoted && !doubleQuoted) {
      parameter += 1;
      output += `$${parameter}`;
      continue;
    }
    output += character;
  }

  return output.replace(
    /\bAS\s+([A-Za-z_][A-Za-z0-9_]*)/g,
    (match, alias: string) =>
      /[A-Z]/.test(alias) ? `AS "${alias}"` : match,
  );
}

function d1Result<T extends Row>(result: FullQueryResults<false>): DatabaseResult<T> {
  return {
    results: result.rows as T[],
    success: true,
    meta: { changes: result.rowCount ?? 0 },
  };
}

class NeonStatement implements DatabaseStatement {
  readonly query: string;
  readonly values: unknown[];

  constructor(
    private readonly client: NeonClient,
    query: string,
    values: unknown[] = [],
  ) {
    this.query = postgresQuery(query);
    this.values = values;
  }

  bind(...values: unknown[]) {
    return new NeonStatement(this.client, this.query, values);
  }

  private async execute<T extends Row>() {
    const result = await this.client.query(this.query, this.values);
    return d1Result<T>(result);
  }

  async first<T = Row>() {
    const result = await this.execute<T & Row>();
    return (result.results[0] as T | undefined) ?? null;
  }

  async all<T = Row>() {
    return this.execute<T & Row>() as Promise<DatabaseResult<T>>;
  }

  async run<T = Row>() {
    return this.execute<T & Row>() as Promise<DatabaseResult<T>>;
  }
}

class NeonDatabase implements DatabaseBinding {
  constructor(private readonly client: NeonClient) {}

  prepare(query: string) {
    return new NeonStatement(this.client, query);
  }

  async batch(statements: DatabaseStatement[]) {
    const neonStatements = statements.map((statement) => {
      if (!(statement instanceof NeonStatement)) {
        throw new Error('Invalid Neon database statement');
      }
      return this.client.query(statement.query, statement.values);
    });
    const results = await this.client.transaction(neonStatements);
    return results.map((result) => d1Result(result));
  }
}

let neonDatabase: NeonDatabase | undefined;

function getNeonUrl() {
  const runtimeEnv = env as Cloudflare.Env & {
    DATABASE_URL?: string;
    DATABASE_POSTGRES_URL?: string;
  };
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    runtimeEnv.DATABASE_URL ||
    runtimeEnv.DATABASE_POSTGRES_URL
  );
}

export function getD1Binding(): DatabaseBinding {
  if (env.DB) return env.DB as unknown as DatabaseBinding;

  const connectionString = getNeonUrl();
  if (!connectionString) {
    throw new Error('Database connection is unavailable');
  }
  neonDatabase ??= new NeonDatabase(
    neon(connectionString, { fullResults: true }),
  );
  return neonDatabase;
}
