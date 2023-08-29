type ActionType = 'add' | 'update' | 'delete' | 'empty' | 'get' | 'none';

export interface Action<T> {
  item: T | null;
  action: ActionType;
}