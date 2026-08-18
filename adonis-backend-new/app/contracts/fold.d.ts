import 'reflect-metadata';

declare module '@adonisjs/fold' {
  export function inject(
    name?: string,
  ): <C extends Function>(target: C) => void;
  export function inject(target: any, propertyKey: string | symbol): void;
}
