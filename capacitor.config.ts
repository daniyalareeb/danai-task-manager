import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daniyal.todo',
  appName: 'Daniyal To-Do',
  webDir: 'dist/public',
  server: {
    url: 'http://192.168.1.243:5000',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;
