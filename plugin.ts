import { IApi } from '@umijs/max';

export default (api: IApi) => {
  api.modifyHTML(($) => {
    console.log('pllugins=========modifyHTML', $);
    return $;
  });
  api.onStart(() => {
    console.log('pllugins=========start');
  });

  // api.modifyConfig((memo: any) => {
  //   // some beautiful code
  //   console.log('pllugins=========memo', memo);
  //   return memo;
  // });
  // api.addLayouts(() => {
  //   return [
  //     {
  //       id: 'layout',
  //       file: require.resolve('./src/global-layouts/index.tsx')
  //     }
  //   ];
  // });
};
