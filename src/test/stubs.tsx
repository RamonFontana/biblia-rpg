// Componentes falsos para testar uma tela sem os filhos: cada stub desenha as props que recebeu
// (as funções ficam de fora do texto) e as guarda, para o teste chamar os callbacks. Filhos que
// aparecem várias vezes (uma lista de cartões) usam `keyOf` para guardar as props de cada um.
const calls = new Map<string, Record<string, unknown>>();

const slot = (name: string, key?: string) => (key === undefined ? name : `${name}:${key}`);

export const stubProps = (name: string, key?: string) => calls.get(slot(name, key));
export const clearStubs = () => calls.clear();

export function makeStub(name: string, keyOf?: (props: Record<string, unknown>) => string) {
  return function Stub(props: Record<string, unknown>) {
    calls.set(slot(name, keyOf?.(props)), props);
    return (
      <div data-stub={name}>
        {JSON.stringify(props, (_key, value) => (typeof value === 'function' ? undefined : value))}
      </div>
    );
  };
}
