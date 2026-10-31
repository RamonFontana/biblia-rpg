// Cliente Supabase falso para os testes de caracterização de serviços e stores que misturam
// regra e I/O. Só registra as chamadas e devolve o que o teste mandar; não simula o banco.
// Uso: `vi.mock('../lib/supabase', ...)` com `createFakeSupabase` (ver combatStore.test.ts).

export type FakeOp = 'select' | 'insert' | 'upsert' | 'update' | 'delete' | 'rpc';

export interface FakeCall {
  /** Nome da tabela; nas chamadas `rpc`, o nome da função. */
  table: string;
  op: FakeOp;
  /** Linhas de insert/update ou argumentos da rpc. */
  payload?: unknown;
  /** Filtros na ordem em que foram encadeados: ['eq', 'id', 'x'], ['in', 'id', [...]]. */
  filters: unknown[][];
  single: boolean;
  /** Colunas pedidas no primeiro `select(...)`, quando houve. */
  columns?: unknown;
  /** Opções do `upsert(payload, options)`. */
  options?: unknown;
}

export interface FakeResult {
  data?: unknown;
  error?: unknown;
  /** Mantém a resposta pendente até esta promessa resolver (para provar ordem e `await`). */
  wait?: Promise<unknown>;
}

export type Responder = (call: FakeCall) => FakeResult | undefined;

interface FakeBuilder extends PromiseLike<{ data: unknown; error: unknown }> {
  select: (...args: unknown[]) => FakeBuilder;
  insert: (payload: unknown) => FakeBuilder;
  upsert: (payload: unknown, options?: unknown) => FakeBuilder;
  update: (payload: unknown) => FakeBuilder;
  delete: () => FakeBuilder;
  eq: (...args: unknown[]) => FakeBuilder;
  in: (...args: unknown[]) => FakeBuilder;
  or: (...args: unknown[]) => FakeBuilder;
  order: (...args: unknown[]) => FakeBuilder;
  limit: (...args: unknown[]) => FakeBuilder;
  single: () => FakeBuilder;
  maybeSingle: () => FakeBuilder;
}

export interface FakeOptions {
  calls: FakeCall[];
  respond: Responder;
  /** Usuário autenticado; uma função permite mudar entre testes. */
  userId?: string | null | (() => string | null);
}

function newBuilder(call: FakeCall, options: FakeOptions): FakeBuilder {
  options.calls.push(call);
  const builder: FakeBuilder = {
    select: (...args) => {
      if (call.columns === undefined) call.columns = args[0];
      return builder;
    },
    insert: (payload) => {
      call.op = 'insert';
      call.payload = payload;
      return builder;
    },
    upsert: (payload, options) => {
      call.op = 'upsert';
      call.payload = payload;
      call.options = options;
      return builder;
    },
    update: (payload) => {
      call.op = 'update';
      call.payload = payload;
      return builder;
    },
    delete: () => {
      call.op = 'delete';
      return builder;
    },
    eq: (...args) => {
      call.filters.push(['eq', ...args]);
      return builder;
    },
    in: (...args) => {
      call.filters.push(['in', ...args]);
      return builder;
    },
    or: (...args) => {
      call.filters.push(['or', ...args]);
      return builder;
    },
    order: (...args) => {
      call.filters.push(['order', ...args]);
      return builder;
    },
    limit: (...args) => {
      call.filters.push(['limit', ...args]);
      return builder;
    },
    single: () => {
      call.single = true;
      return builder;
    },
    maybeSingle: () => {
      call.single = true;
      return builder;
    },
    then: (onFulfilled, onRejected) => {
      const { wait, ...result } = options.respond(call) ?? {};
      return Promise.resolve(wait)
        .then(() => ({ data: null, error: null, ...result }))
        .then(onFulfilled, onRejected);
    },
  };
  return builder;
}

export function createFakeSupabase(options: FakeOptions) {
  const currentUser = () => {
    const { userId } = options;
    if (userId === undefined) return 'user-1';
    return typeof userId === 'function' ? userId() : userId;
  };
  return {
    from: (table: string) =>
      newBuilder({ table, op: 'select', filters: [], single: false }, options),
    rpc: (name: string, args?: unknown) =>
      newBuilder({ table: name, op: 'rpc', payload: args, filters: [], single: false }, options),
    auth: {
      getUser: async () => {
        const id = currentUser();
        return { data: { user: id ? { id } : null } };
      },
      getSession: async () => {
        const id = currentUser();
        return { data: { session: id ? { user: { id } } : null } };
      },
    },
  };
}

/** Chamadas de uma tabela (ou rpc) com a operação pedida, na ordem em que ocorreram. */
export function callsOf(calls: FakeCall[], table: string, op?: FakeOp): FakeCall[] {
  return calls.filter((c) => c.table === table && (op === undefined || c.op === op));
}

/** O filtro `eq`/`in` de uma chamada, ou undefined. */
export function filterOf(call: FakeCall, method: string, column: string): unknown {
  return call.filters.find((f) => f[0] === method && f[1] === column)?.[2];
}
