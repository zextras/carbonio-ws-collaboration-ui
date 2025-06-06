/* eslint-disable prettier/prettier */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = {
   'chats': {
     input: {
      target: './src/types/network/apis/generated/entrypoint/api.yaml',
    },
     clean: ['./src/types/network/apis/generated/output/'],
     prettier: true,
     headers: false,
     output: {
      target: './src/types/network/apis/generated/output/api.ts',
      mode: 'tags-split',
      httpClient: 'fetch',
      client: 'fetch',
      override: {
         header: (info): string[] => [
          `eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types`,
           ...(info.title ? [info.title] : []),
           ...(info.description ? [info.description] : []),
           ...(info.version ? [`OpenAPI spec version: ${info.version}`] : []),
         ],
         fetch: {
           includeHttpResponseReturnType: false,
         },
        components: {
           responses: {
             suffix: '',
           }
         },
         useTypeOverInterfaces: true,
         enumGenerationType: 'const',
         urlEncodeParameters: true,
         // USE THIS TO OVERRIDE DEFAULT API GENERATION
        //  mutator: {
        //     path: './src/types/network/apis/generated/customFetch.ts',
        //     name: 'fetchWrapper'
        //  }
       },
    },
     hooks: {
       afterAllFilesWrite: [
        'eslint --fix --resolve-plugins-relative-to node_modules/@zextras/carbonio-ui-configs',
      ],
     },
   }
 };