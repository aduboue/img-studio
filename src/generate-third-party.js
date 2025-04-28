// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const thirdPartyDir = path.join(__dirname, 'third_party');

// List of built-in Node.js modules (add more if needed)
const builtInModules = ['fs', 'path', 'http', 'https', 'os', 'crypto', 'zlib', 'events', 'stream', 'url', 'util'];

// Function to create the third_party directory if it doesn't exist
function createThirdPartyDir() {
  if (!fs.existsSync(thirdPartyDir)) {
    fs.mkdirSync(thirdPartyDir);
  }
}

// Function to copy the license file and create the METADATA file
function processDependency(name, packageJsonPath) {
  // Ignore built-in modules
  if (builtInModules.includes(name)) {
    return false; // Indicates that the dependency was skipped
  }

  const packageJson = require(packageJsonPath);
  const version = packageJson.version;
  const homepage = packageJson.homepage || (packageJson.repository ? (typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository.url) : null);
  const licenseType = packageJson.license || 'License Not Found';

  const licensePath = path.join(path.dirname(packageJsonPath), 'LICENSE');
  const readmePath = path.join(path.dirname(packageJsonPath), 'README.md');

  // Handle scoped package names (e.g., @types/react)
  const [scope, packageName] = name.startsWith('@') ? name.split('/') : [null, name];
  const dependencyDir = scope
    ? path.join(thirdPartyDir, scope, packageName)
    : path.join(thirdPartyDir, name);

  // Create the dependency directory if it doesn't exist
  if (!fs.existsSync(dependencyDir)) {
    fs.mkdirSync(dependencyDir, { recursive: true });
  }

  // Copy the LICENSE file if it exists
  if (fs.existsSync(licensePath)) {
    fs.copyFileSync(licensePath, path.join(dependencyDir, 'LICENSE'));
  } else {
    console.warn(`LICENSE not found for ${name}`);
    fs.writeFileSync(path.join(dependencyDir, 'LICENSE'), `${licenseType} - see package.json`);
  }

  // Create the METADATA file
  const metadataContent = `Name: ${name}
Version: ${version}
Homepage: ${homepage || 'Not Found'}
License: ${licenseType}

This package was sourced from npm.
`;
  fs.writeFileSync(path.join(dependencyDir, 'METADATA'), metadataContent);

  return true; // Indicates that the dependency was processed
}

// Main function
function main() {
  createThirdPartyDir();

  // Get the list of installed dependencies using pnpm
  const dependenciesListOutput = execSync('pnpm ls --json --long', { encoding: 'utf-8' });
  const dependenciesList = JSON.parse(dependenciesListOutput);

  // Counter for processed dependencies
  let processedDependenciesCount = 0;
  let totalDependenciesCount = 0;
  let dependencies = {};
  let failedDependencies = []; // List for failed dependencies

  // Iterate over the dependencies. Supports projects with one or more packages
  const packages = dependenciesList.length ? dependenciesList : [{ dependencies: dependenciesList }]

  packages.forEach(project => {
    if (!project.dependencies) {
      console.warn('No dependencies found.');
      return;
    }

    // Merge dependencies from all packages
    dependencies = { ...dependencies, ...project.dependencies };
  });

  totalDependenciesCount = Object.keys(dependencies).length;

  for (const name in dependencies) {
    const packageJsonPath = path.join(__dirname, 'node_modules', name, 'package.json');
    const dependencyProcessed = processDependency(name, packageJsonPath);
    if (dependencyProcessed) {
      processedDependenciesCount++;
    } else {
      failedDependencies.push(name); // Add the dependency to the failed list
    }
  }

  // Global confirmation message
  if (processedDependenciesCount === (totalDependenciesCount - builtInModules.filter(module => dependencies.hasOwnProperty(module)).length)) {
    console.log('All dependencies have been successfully processed and added to the `third_party` directory.');
  } else {
    console.warn(`Some dependencies might be missing in the \`third_party\` directory.`);
    if (failedDependencies.length > 0) {
        console.warn("The following dependencies were not processed correctly:");
        failedDependencies.forEach(dep => console.warn(`- ${dep}`));
    }
  }
}

main();
