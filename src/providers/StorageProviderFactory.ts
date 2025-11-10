import { StorageProviderType } from "./storage/types";
import { StorageProvider } from "./storage/StorageProvider";
import { R2Provider } from "./r2/R2Provider";

export class StorageProviderFactory {
  static getProvider(type: StorageProviderType = StorageProviderType.R2): StorageProvider {
    switch (type) {
      case StorageProviderType.R2:
      default:
        return new R2Provider();
    }
  }
}