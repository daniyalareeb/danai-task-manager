import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daniyal.todo',
  appName: 'Daniyal To-Do',
  webDir: 'dist/public',
  // Commented out for standalone APK - will use local bundled files
  // Uncomment and set to your server URL only for development/live reload
  // server: {
  //   url: 'http://192.168.1.243:5000',
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
