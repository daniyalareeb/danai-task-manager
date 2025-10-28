import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daniyal.todo',
  appName: 'Daniyal To-Do',
  webDir: 'dist/public',
  server: {
    // Commented out for standalone APK - will use local files
    // To use with deployed server, set URL here:
    // url: 'https://your-app.onrender.com',
    // cleartext: false
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
