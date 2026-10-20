// Componentes falsos para testar uma tela sem os filhos: cada stub desenha as props que recebeu
// (as funções ficam de fora do texto) e as guarda, para o teste chamar os callbacks.
const calls = new Map<string, Record<string, unknown>>();

export const stubProps = (name: string) => calls.get(name);
export const clearStubs = () => calls.clear();

export function makeStub(name: string) {
  return function Stub(props: Record<string, unknown>) {
    calls.set(name, props);
    return (
      <div data-stub={name}>
        {JSON.stringify(props, (_key, value) => (typeof value === 'function' ? undefined : value))}
      </div>
    );
  };
}
