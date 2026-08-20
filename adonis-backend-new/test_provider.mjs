import AppServiceProvider from '@adonisjs/core/providers/app_provider';

// Create a minimal app mock
const app = {
  container: {
    singleton: (name, fn) => {
      console.log(`Registering singleton: ${name}`);
    },
    alias: (alias, target) => {
      console.log(`Creating alias: ${alias} -> ${target}`);
    },
  },
  config: {
    get: (key) => {
      console.log(`Getting config: ${key}`);
      return {};
    },
  },
};

const provider = new AppServiceProvider(app);
console.log('Calling register()...');
provider.register();
console.log('register() completed');
console.log('Done');
