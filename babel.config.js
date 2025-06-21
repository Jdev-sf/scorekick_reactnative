module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin'
    ],
    env: {
      web: {
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
          [
            'babel-plugin-transform-define',
            {
              'import.meta.env': 'process.env',
              'import.meta.url': '"file:///"',
              'import.meta': '({})'
            }
          ]
        ]
      }
    }
  };
};