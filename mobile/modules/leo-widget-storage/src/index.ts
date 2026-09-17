import { requireNativeModule } from 'expo';

type LeoWidgetStorageNative = {
  setInt(key: string, value: number, group: string): boolean;
  setString(key: string, value: string, group: string): boolean;
  getString(key: string, group: string): string | null;
  remove(key: string, group: string): boolean;
  reloadWidget(kind?: string): void;
};

const native = requireNativeModule<LeoWidgetStorageNative>('LeoWidgetStorage');

export class LeoWidgetStorage {
  constructor(private readonly appGroup: string) {}

  set(key: string, value: string | number): boolean {
    return typeof value === 'number'
      ? native.setInt(key, value, this.appGroup)
      : native.setString(key, value, this.appGroup);
  }

  get(key: string): string | null {
    return native.getString(key, this.appGroup);
  }

  remove(key: string): boolean {
    return native.remove(key, this.appGroup);
  }

  static reloadWidget(kind?: string): void {
    native.reloadWidget(kind);
  }
}