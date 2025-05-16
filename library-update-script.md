# Firestore field renaming script for the Library metadata

The recent incorporation of **Veo** into **ImgStudio** requires a change in the Firestore `metadata` database structure to align with new data models and conventions. Specifically, this script renames various image-related fields to new more generic ones for all media types (images and videos), ensuring your Firestore data is compatible with the updated **ImgStudio** Library feature.

This file provides comprehensive instructions on how to execute this script directly from **Cloud Shell** within the Google Cloud console.

---

## Prerequisites

- Go on the Google Cloud project where **ImgStudio** is deployed.
- The Google Cloud SDK installed (Cloud Shell comes with it pre-installed).
- Sufficient IAM permissions, you must have read and write access to the Firestore database (a role for this is `Cloud Datastore User`).

---

## Run the Script in Google Cloud Shell

### Step 1: Open Google Cloud Shell

1.  Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2.  At the top right of the console, click the **"Activate Cloud Shell"** button (it typically looks like a terminal icon: `_>`).
3.  A new Cloud Shell session will open at the bottom of your browser window. Click on `Continue` then `Authorize` if prompted.
4.  Check the terminal has the right context with your user ID and project ID:
    ```bash
    YOUR_ID@cloudshell:~ (PROJECT_ID)$ ...
    ```

---

### Step 2: Create the necessary files (`index.ts` and `tsconfig.json`)

1.  In your Cloud Shell terminal, create a new file named `index.ts`:
    ```bash
    touch index.ts
    ```
2.  Create a new file named `tsconfig.json`:
    ```bash
    touch tsconfig.json
    ```
3.  Open the Cloud Shell Editor by clicking the "Open Editor" button (with a pencil icon) in the Cloud Shell toolbar, or by typing `cloudshell edit .` in the terminal and pressing Enter.
4.  Paste the following TypeScript code into the `index.ts` file in the editor:

    ```typescript
    import { initializeApp } from 'firebase-admin/app'
    import { getFirestore, FieldValue } from 'firebase-admin/firestore'

    // Initialize Firebase Admin SDK
    initializeApp()

    const db = getFirestore()

    const fieldMappings: Record<string, string> = {
      imageAuthor: 'author',
      imageFormat: 'format',
      imageGcsURI: 'gcsURI',
      imageGenerationDate: 'creationDate',
      imageHeight: 'height',
      imageID: 'id',
      imageLeveragedModel: 'leveragedModel',
      imagePrompt: 'prompt',
      imageRatio: 'aspectRatio',
      imageUpscaleFactor: 'upscaleFactor',
      imageWidth: 'width',
    }

    async function renameFieldsInCollection() {
      const collectionName = 'metadata' // Specify your collection name here
      const collectionRef = db.collection(collectionName)

      console.log(`Starting to process documents in collection: ${collectionName}`)
      const snapshot = await collectionRef.get()

      if (snapshot.empty) {
        console.log('No documents found in the collection.')
        return
      }

      let documentsProcessed = 0
      let documentsUpdated = 0

      // Use Promise.all to handle all asynchronous updates concurrently
      const updatePromises = snapshot.docs.map(async (doc) => {
        const data = doc.data()
        const updatePayload: Record<string, any> = {}
        let changesNeeded = false

        console.log(`\nProcessing document ID: ${doc.id}`)

        if (data) {
          for (const oldFieldName in fieldMappings) {
            if (Object.prototype.hasOwnProperty.call(data, oldFieldName)) {
              const newFieldName = fieldMappings[oldFieldName]
              if (data[oldFieldName] !== undefined) {
                updatePayload[newFieldName] = data[oldFieldName]
                updatePayload[oldFieldName] = FieldValue.delete()
                changesNeeded = true
                console.log(`  - Mapping: '${oldFieldName}' to '${newFieldName}'. Old field found, marked for update.`)
              } else {
                // This case is less likely if hasOwnProperty is true, but good for thoroughness
                console.log(`  - Field '${oldFieldName}' is present but undefined. Skipping.`)
              }
            }
          }
        } else {
          console.log(`  - No data found for document ID: ${doc.id}. Skipping.`)
          documentsProcessed++
          return // Skip if no data
        }

        if (changesNeeded) {
          try {
            await doc.ref.update(updatePayload)
            console.log(`  - Document ID: ${doc.id} successfully updated.`)
            documentsUpdated++
          } catch (error) {
            console.error(`  - Error updating document ID: ${doc.id}`, error)
          }
        } else {
          console.log(`  - Document ID: ${doc.id} did not require any field renaming.`)
        }
        documentsProcessed++
      })

      await Promise.all(updatePromises)

      console.log('\n--- Field Renaming Summary ---')
      console.log(`Total documents processed: ${documentsProcessed}`)
      console.log(`Total documents updated: ${documentsUpdated}`)
      console.log('Field renaming process complete.')
    }

    renameFieldsInCollection().catch((err) => {
      console.error('An error occurred during the field renaming process:', err)
    })
    ```

5.  Paste the following JSON configuration into the `tsconfig.json` file in the editor:
    ```json
    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "nodenext",
        "moduleResolution": "nodenext",
        "strictNullChecks": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "outDir": "./dist"
      },
      "include": ["index.ts"]
    }
    ```
6.  **Save both files** (`Ctrl + S` or `Cmd + S` in the editor, or use File > Save All from the menu).

---

### Step 3: Execute the Script

Return to your Cloud Shell terminal. You can run all the necessary commands (install dependencies, compile TypeScript, and execute JavaScript) in a single, chained command:

```bash
npm install firebase-admin && \
npx tsc && \
node ./dist/index.js
```

The script will then run, and you will see logging output in your Cloud Shell terminal indicating its progress, which documents are being processed, and a final summary of the updates.
