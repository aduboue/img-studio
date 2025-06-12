#!/bin/bash 

git clone https://github.com/aduboue/img-studio.git 
mv src/app src/app.bkp
mv src/public src/public.bkp
mv src/third_party src/third_party.bkp
cp -r img-studio/app/ img-studio/package.json img-studio/Dockerfile img-studio/generate-third-party.js img-studio/next.config.mjs img-studio/package-lock.json img-studio/pnpm-lock.yaml img-studio/postcss.config.js img-studio/tsconfig.json img-studio/webpack.config.js img-studio/public/ img-studio/third_party/ src/
rm -rf img-studio
