import { requireOptionalNativeModule } from 'expo';

type LeoWidgetStorageNative = {
  setInt(key: string, value: number, group: string): boolean;
  setString(key: string, value: string, group: string): boolean;
  getString(key: string, group: string): string | null;
  remove(key: string, group: string): boolean;
  reloadWidget(kind?: string): void;
};

const native = requireOptionalNativeModule<LeoWidgetStorageNative>('LeoWidgetStorage');

export class LeoWidgetStorage {
  constructor(private readonly appGroup: string) {}

  set(key: string, value: string | number): boolean {
    if (!native) return false;
    return typeof value === 'number'
      ? native.setInt(key, value, this.appGroup)
      : native.setString(key, value, this.appGroup);
  }

  get(key: string): string | null {
    return native?.getString(key, this.appGroup) ?? null;
  }

  remove(key: string): boolean {
    return native?.remove(key, this.appGroup) ?? false;
  }

  static reloadWidget(kind?: string): void {
    native?.reloadWidget(kind);
  }

  /** False when the installed build was compiled without the widget bridge. */
  static get isAvailable(): boolean {
    return native != null;
  }
}