import defaultFeedSettings, { type FeedSettings } from 'modules/feedSettings';

// Define the key used in sessionStorage to store the settings
const FEED_SETTINGS_KEY = 'cmf_feed_settings';

class SessionStorageManager {
  private static instance: SessionStorageManager;

  private constructor() {
    if (typeof sessionStorage === 'undefined') {
      console.error('SessionStorage is not available. State management will not be persistent.');
    }
  }

  public static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }
  
  private _read<T>(key: string, defaultValue: T): T {
    try {
      const storedData = sessionStorage.getItem(key);
      
      if (storedData) {
        const settings = JSON.parse(storedData) as T;
        
        if (typeof settings === 'object' && settings !== null && !Array.isArray(settings)) {
          return {
            ...defaultValue,
            ...settings
          } as T;
        }
        return settings;
      }
    } catch (error) {
      console.error(`Failed to read or parse storage key "${key}":`, error);
    }
    
    return defaultValue;
  }
  
  private _write<T>(key: string, value: T): void {
    try {
      const serializedData = JSON.stringify(value);
      sessionStorage.setItem(key, serializedData);
    } catch (error) {
      console.error(`Failed to serialize or write storage key "${key}":`, error);
    }
  }

  public get<T>(key: string, defaultValue: T): T {
    return this._read<T>(key, defaultValue);
  }

  public set<T>(key: string, value: T): void {
    this._write(key, value);
  }

  public getFeedSettings(): FeedSettings {
    return this.get<FeedSettings>(FEED_SETTINGS_KEY, defaultFeedSettings); 
  }

  public setFeedSettings(settings: FeedSettings): void {
    this.set<FeedSettings>(FEED_SETTINGS_KEY, settings);
  }
  
  public updateFeedSettings(
    update: Partial<FeedSettings> | ((currentSettings: FeedSettings) => FeedSettings)
  ): void {
    const currentSettings: FeedSettings = this.getFeedSettings();
    
    let newSettings: FeedSettings;

    if (typeof update === 'function') {
      newSettings = update(currentSettings);
    } else {
      newSettings = {
        ...currentSettings,
        ...update,
      };
    }
    
    this.setFeedSettings(newSettings);
  }
}

export const cmfSessionManager = SessionStorageManager.getInstance();
